# Design

## Context

See `proposal.md` for motivation. The current state that shapes the approach:

- `apps/admin` is a complete React SPA with direct Spring authentication, localStorage accessToken, startup `/auth/me` recovery, route guards, and a 401 event. Its HTTP adapter and auth store are useful patterns, but web must not import admin code.
- `apps/web` is a Nuxt 4 skeleton: `app/app.vue`, `config/env.ts`, and one runtime test. It has no pages, auth, API client, proxy, or design system.
- Spring exposes the student APIs the later modules need. The auth module already has QQ email verification codes, email login, `/auth/me`, logout, and the seeded `admin` login. Registration currently treats profile fields as optional and does not check student-number or phone uniqueness in the service layer, although the database has unique indexes for both.
- `@repo/http-client` is a transport-only ky wrapper. It does not read environment variables or assume a business envelope.
- Root `.env` files are loaded by each app script. `API_BASE_URL` is `/api/v1/`; admin proxies `/api` through Vite. Web currently defaults its API base to `/api/` and has no proxy, and Spring has no CORS configuration.
- Toolchain constraints: Nuxt 4, Vue 3, TypeScript 6, Vitest 5, Oxc only, no external UI library, no cross-app imports.
- Spring lives in `../backend`, outside the frontend Git worktree and not itself a Git repository. Backend edits are treated as in-scope implementation work for this change, but they are not part of the frontend diff; reviews and rollbacks must cover both directories. All Maven commands run from `../backend`, and the backend verification result is recorded with the change evidence. If the backend later moves into version control, a mirror change should be created there.

## Goals / Non-Goals

**Goals:**

- Deliver an end-to-end student authentication flow: QQ email registration, email login, startup session recovery, route guards, 401 handling, and logout.
- Establish a mobile-first web shell and a pure-CSS token system that later student modules can reuse.
- Establish a single web API adapter for the Spring envelope, business errors, network/timeout errors, Bearer injection, and server-side proxying in both development and production.
- Make registration data trustworthy: required profile fields, clear 409 conflicts for duplicate email, student number, and phone, and a profile update that cannot clear the required phone.
- Cover the behavior with backend tests, Nuxt tests, type/lint checks, and browser verification at 320px and 375px.

**Non-Goals:**

- Implementing plants, adoption, care, tasks, points, rewards, notifications, or feedback pages.
- Profile editing, password reset, dark mode, or a theme toggle.
- Changing admin UI behavior or `admin-auth`.
- Introducing an independent BFF service or a server-side session store; the Nitro server only forwards HTTP and does not own sessions or validate credentials.
- Adding a UI component library.
- Changing the database schema.
- Student-number login; the selected identity is email-only.

## Decisions

### 1. Keep Nuxt SSR enabled

Web uses Nuxt's default server-side rendering. Auth pages and the shell render on the server, and data pages fetch with `useAsyncData` so the first HTML already contains the result. The access token lives in a same-origin cookie so route middleware and server-side requests can read it during SSR. Auth state uses `useState` and per-NuxtApp session bookkeeping, so concurrent SSR requests do not share a login state.

Alternative: `ssr: false`. It removes hydration and server-context work, but every page becomes an empty shell until JavaScript runs, server-side guards cannot see the session, and the app cannot use Nuxt's server data flow.

### 2. Direct Spring authentication through the Nitro server

Web calls Spring through its own Nitro server. Browser requests to `/api/v1/*` hit `server/api/[...path].ts`, which uses `proxyRequest` to forward the method, query, body and headers to Spring. During SSR, server code calls `${SPRING_API_ORIGIN}/api/v1/` directly to avoid a loopback request. The Nitro server does not own a session, validate credentials, or store tokens; Spring remains the final authentication and role boundary.

Alternative: a full BFF with server-side session storage. It would add a second session layer and a new runtime state boundary, which the project does not need for a same-origin proxy.

### 3. Email-only identity

Registration requires a QQ email, a 6-digit email code, a password, and the full profile. Login uses email and password. The seeded administrator can still log in with the bare name `admin`.

Rationale: the backend already implements the QQ code flow and email login; the database keeps a non-null unique email; no migration is needed. The product document is updated to match this choice.

Alternative: student-number login. It would require changing login resolution and likely an email-nullability migration, with no product benefit after the user selected email-only.

### 4. Enforce complete profile and uniqueness in Spring

`RegisterRequest` gains required validation for `fullName`, `studentNumber`, `department`, `className`, and `phone`. Email fields gain `@Size(max = 254)` to match the database column. The phone pattern drops the empty-string alternative so a required phone cannot be blank. The email keeps format validation, but the QQ-domain rule moves to `AuthService` so a well-formed non-QQ email returns `QQ_EMAIL_REQUIRED` instead of a generic `INVALID_REQUEST`. The existing unique indexes remain the final guard; a concurrent duplicate falls through to the existing `GlobalExceptionHandler`, which maps `DataIntegrityViolationException` to 409 `DATA_CONFLICT`.

Registration order is deliberate: normalize and require the five profile fields (no database lookup); check the email duplicate; verify the email code; only then check student-number and phone uniqueness; save the account and consume the code. Student/phone existence is not disclosed until the caller proves control of the email. Email duplicate keeps its existing precedence over code validation. The order is pinned by tests so a future refactor does not reintroduce enumeration or change error precedence.

Why pre-check if the database is authoritative: it produces field-specific errors for normal use, while the database prevents races. The client still maps `DATA_CONFLICT` to a generic "资料已被使用" message.

No migration is needed because `accounts.email` is already non-null and unique, and `student_number` and `phone` already have unique indexes.

The profile update path preserves the required-phone invariant: `ProfileRequest.phone` no longer accepts an empty string, an omitted phone keeps the current value, and a duplicate phone returns 409 `PHONE_ALREADY_USED`. The foundation UI does not expose profile editing yet, but the backend contract is correct for the later profile change. `GET /api/v1/profile` remains self-scoped for any authenticated account and returns `pointsBalance`/`activeAdoptionCount`; the student web only calls it as a STUDENT, and a contract test pins the response shape.

Mail configuration is checked for both `QQ_MAIL_USERNAME` and `QQ_MAIL_AUTH_CODE`; a blank value returns 503 `MAIL_NOT_CONFIGURED`. `MailException` during sending is mapped to 503 `MAIL_SEND_FAILED` instead of the generic 500, so the registration page can distinguish configuration from delivery failure. The code row is still written and rolled back with the send transaction, so a failed send leaves no usable code record. Sending inside the transaction holds a DB connection for the SMTP timeout window; this is accepted for the current single-node deployment and noted as a risk.

### 5. Split student web behavior into three capabilities

- `student-auth`: identity, registration, login, session state, guards, 401, logout, and auth forms.
- `web-api`: API base, proxy, envelope, error model, Bearer injection, and 401 event.
- `web-shell`: authenticated layout, bottom navigation, auth layout, home and profile pages, tokens, responsive and accessibility behavior.

This keeps identity, transport, and presentation independently evolvable. It also matches the existing split between `admin-auth` and `admin-shell`.

### 6. Pure CSS tokens and a small component set

The web app uses semantic CSS custom properties for color, spacing, radius, typography, shadow, and safe-area values. Components consume tokens; hex values appear only in token definitions. The foundation builds only the primitives needed by auth and the shell: button, field/input, inline error, toast/alert, loading state, empty/error state, page header, bottom navigation, and dialog/confirmation.

Alternatives: Vant or `@nuxt/ui`. Both would speed up components but add a dependency and a visual language that must then be reskinned. The selected approach keeps the student experience distinct and avoids a second UI framework.

The first version is light-only. The token structure leaves room for a later dark theme without changing components.

### 7. Persist only the accessToken and restore through `/auth/me`

The web stores only the token in the same-origin `student-auth-token` cookie (`Path=/`, `SameSite=Lax`, 7-day `Max-Age`, `Secure` on HTTPS). The cookie is not `httpOnly` because the browser API adapter also reads it; it is a carrier, not an authentication mechanism — Spring still receives an `Authorization: Bearer` header. The account is runtime state and is re-fetched on startup. Reading the token from the request cookie lets the SSR guard authenticate the first request. Only `role=STUDENT` and `status=ACTIVE` are accepted; any other value clears the cookie.

The auth state machine:

```text
                 no token
   checking ------------------> anonymous
      |                          |    ^
      | /auth/me 200 STUDENT     |    | logout / 401
      v                          v    |
 authenticated <---------- login/register
      |
      | /auth/me 401 / non-STUDENT / DISABLED
      v
 anonymous

   checking -- network/5xx --> error -- retry --> checking
                                  |
                                  +-- clear --> anonymous
```

`checking` renders a loading gate, not protected content. `error` keeps the token and offers retry or clear. On `/login` and `/register`, an existing token that fails restoration shows the same retry/clear state while leaving the credential form usable, rather than silently discarding the token.

Auth refs come from `useState`, so every SSR request owns its state. The restore dedupe map is keyed by the request's NuxtApp. After awaiting `/auth/me`, the Nuxt async context may already have ended; clearing the cookie or state then runs through `callWithNuxt` so `useCookie`/`useState` operate on the correct request.

`restore()` captures the token (or a monotonic attempt id) before awaiting `/auth/me` and discards the result if the token changed or the user cleared/logged out meanwhile. This prevents a late success from re-authenticating a logged-out session. A login response with a non-STUDENT role never reaches the token cookie: the app calls logout with the issued token in a direct Authorization header, then clears state and shows the student-only message.

### 8. API adapter stays app-local

The web adapter creates `@repo/http-client` with a base URL from Nuxt public runtime config. It owns envelope parsing, the error object, Bearer injection, and the 401 event. The shared package stays transport-only and environment-agnostic. API modules pass relative paths such as `auth/login`; a leading `/` would bypass the base URL and is rejected by the adapter in development. Authentication POSTs (login, register, send-code, logout) use retry 0 to avoid duplicate server-side effects.

The client is created in `app/plugins/http.ts`, a universal plugin where `useRuntimeConfig()` has a Nuxt context. In the browser the base URL is the relative `runtimeConfig.public.apiBaseUrl`, so requests go through `server/api`; during SSR it resolves against the private `runtimeConfig.springApiOrigin` and calls Spring directly. The instance is provided through `nuxtApp`. The request helpers accept an injected ky instance/fetch so unit tests do not depend on `registerEndpoint` intercepting ky. Do not call `useRuntimeConfig()` at module scope, and do not touch `document.cookie` at module top level; the token module guards the browser and uses `useCookie` on the server.

No code is imported from `apps/admin`. The web adapter is a local implementation of the same pattern, not a copy of admin's module graph.

### 9. Server proxy and API base

`nuxt.config.ts` reads `API_BASE_URL` (default `/api/v1/`) into `runtimeConfig.public.apiBaseUrl`, and `SPRING_API_ORIGIN` into the private `runtimeConfig.springApiOrigin`. `server/api/[...path].ts` catches every `/api/*` request, restores the `/api` prefix onto the wildcard path, and calls `proxyRequest` against `${SPRING_API_ORIGIN}/api/<path>`. This runs in development and in the production Nitro server, so no `nitro.devProxy`, `routeRules` proxy, or external reverse proxy is needed for `/api`; Spring does not need CORS. `SPRING_API_ORIGIN` is validated as an origin without path, query or hash and its trailing slash is normalized, so a configured path cannot double-prefix the target. The deployed Nitro process must be able to reach that origin; a private origin can be supplied with `NUXT_SPRING_API_ORIGIN`.

SSR requests use the origin directly instead of calling the proxy over the network: the universal HTTP plugin builds an absolute `${SPRING_API_ORIGIN}${apiBaseUrl}` base on the server and keeps the relative base in the browser.

This replaces the current web default of `/api/`, which would otherwise call the Nuxt server instead of Spring.

### 10. Route map and middleware

```text
/login     auth layout   public
/register  auth layout   public
/          default shell protected  home
/me        default shell protected  profile
*          404 page with home/login link
```

A global middleware reads the route meta/public-path list, awaits `restore()` once, and handles redirects. `returnTo` accepts only internal paths with a single leading `/`. The login and register pages are guest-only; authenticated users are sent to `/`. The catch-all 404 page is public so an anonymous visitor can see the login link; the middleware must not redirect it before it renders.

### 11. Registration and login data flow

```text
Register page
  -> POST /api/v1/auth/email-code/registration
  -> QQ SMTP sends a 6-digit code
  -> POST /api/v1/auth/register
  -> 201 AuthResult (accessToken + STUDENT account)
  -> store token, set account, navigate /

Login page
  -> POST /api/v1/auth/login
  -> 200 AuthResult
  -> store token, set account, navigate returnTo or /
```

The backend registration response already creates a session, so the web does not call login again after registration.

### 12. Error mapping

| Backend code                  | UI location          | Message                                                |
| ----------------------------- | -------------------- | ------------------------------------------------------ |
| `EMAIL_ALREADY_REGISTERED`    | email field          | 这个邮箱已经注册，请直接登录                           |
| `STUDENT_NUMBER_ALREADY_USED` | student number field | 这个学号已经注册                                       |
| `PHONE_ALREADY_USED`          | phone field          | 这个手机号已绑定其他账号                               |
| `CODE_REQUIRED`               | code field           | 请先获取邮箱验证码                                     |
| `CODE_EXPIRED`                | code field           | 验证码已过期，请重新获取                               |
| `CODE_INVALID`                | code field           | 验证码不正确                                           |
| `CODE_ATTEMPTS_EXCEEDED`      | code field           | 验证码错误次数过多，请重新获取                         |
| `CODE_RESEND_TOO_SOON`        | send button          | 请稍后再获取验证码                                     |
| `QQ_EMAIL_REQUIRED`           | email field          | 注册邮箱必须是 QQ 邮箱                                 |
| `MAIL_NOT_CONFIGURED`         | top alert            | 注册邮件暂不可用，请联系管理员                         |
| `MAIL_SEND_FAILED`            | top alert            | 验证码邮件发送失败，请稍后重试                         |
| `INVALID_REQUEST`             | top alert            | 使用后端返回的中文字段提示；缺失时显示“请检查填写内容” |
| `DATA_CONFLICT`               | top alert            | 资料已被使用，请检查邮箱、学号或手机号                 |
| `INVALID_CREDENTIALS`         | top alert            | 邮箱或密码错误                                         |
| `ACCOUNT_DISABLED`            | top alert            | 账号暂不可用，请联系管理员                             |
| `NOT_STUDENT`                 | top alert            | 仅学生账号可登录学生端                                 |
| `NETWORK_ERROR`               | top alert            | 无法连接后端服务，请稍后重试                           |
| `REQUEST_TIMEOUT`             | top alert            | 请求超时，请稍后重试                                   |

Unknown business codes use a general Chinese retry message and never expose raw codes or stack traces in the page.

`CODE_RESEND_TOO_SOON` restarts the send button's 60-second countdown because the error envelope carries no remaining time. `EMAIL_ALREADY_REGISTERED` shows a "去登录" action with the current email prefilled. Registration failures preserve the form values and only clear or focus the field that needs correction; the verification code is the exception when it is expired or exhausted.

### 13. Web module layout

```text
app/
  app.vue
  layouts/default.vue        authenticated shell
  layouts/auth.vue           centered auth layout
  pages/index.vue            home summary (useAsyncData)
  pages/login.vue
  pages/register.vue
  pages/me.vue               profile (useAsyncData)
  pages/[...slug].vue        404
  middleware/auth.global.ts
  composables/useAuth.ts     auth state machine (useState)
  composables/useApi.ts      access the plugin-provided client
  plugins/http.ts            universal ky client with runtime config
  plugins/auth.client.ts     401 listener
  utils/token.ts             student token cookie
  utils/api.ts               Spring envelope adapter
  utils/auth-api.ts          auth endpoints
  utils/profile-api.ts       profile endpoint
  utils/auth-events.ts       401 event bus
  utils/auth-errors.ts       auth and request error mapping
  utils/auth-route.ts        guards and returnTo validation
  utils/auth-session.ts      401 -> clear/redirect handler
  components/...             shell and form primitives
  assets/css/tokens.css
  assets/css/base.css
server/
  api/[...path].ts           /api/* -> Spring proxy
shared/utils/api.ts          API base and proxy target helpers
tests/nuxt/setup.ts          cookie/auth/cache reset
```

Nuxt auto-imports from `app/composables`, `app/utils`, `app/components`, and `shared/utils`; explicit imports are kept where they clarify cross-module dependencies. No generated `.nuxt` files are edited.

### 14. Shell and page behavior

- The default layout renders the page header, content slot, and bottom navigation. The auth layout renders the brand and a centered form panel without navigation.
- The bottom navigation only lists implemented modules. This change lists 首页 and 我的; plants, tasks, and points add entries in their own changes.
- Home reads the current profile (`GET /api/v1/profile`) with `useAsyncData` and shows display name, points balance, and active plant count. It shows loading, retryable failure, and a zero-plants explanation. The first render happens on the server; `refresh()` backs the retry action.
- Profile reads the same profile with its own `useAsyncData` key and shows the full account fields plus logout. Editing phone/class, notifications, and feedback are later changes. Logout clears the cached profile data.
- The 404 page links to `/` when authenticated and `/login` when anonymous.

### 15. Tooling and configuration

- **tsconfig:** no change. `apps/web/tsconfig.json` continues to extend the generated `.nuxt/tsconfig.json`; `nuxt prepare` regenerates it after adding `app/` structure.
- **Vitest:** include and environment stay the same. `apps/web/vitest.config.ts` already uses the Nuxt runtime and `tests/nuxt/**/*.test.ts`; `baseTestConfig` already covers `app/**/*.{ts,vue}` and `shared/**/*.{ts,vue}`. Add `tests/nuxt/setup.ts` and `setupFiles` to clear the auth cookie, reset auth state and drop cached async data between tests. Add `shared/utils/api.ts` with `DEFAULT_API_BASE_URL`, `resolveApiBaseUrl`, and `resolveSpringApiTarget` so `nuxt.config.ts`, the client plugin and the server route share one source for the `/api/v1/` fallback and proxy path mapping.
- **Turbo:** `turbo.json` currently lists `packages/vitest-config/**` and `packages/env/**` in the `test` inputs but not `packages/http-client/**`. Because web starts importing the shared client, add `packages/http-client/**` to the `build`, `check-types`, `test`, and `test:coverage` inputs; add `packages/env/**` to `build` and `check-types` because both apps import it at build time. Do not add a new task or change task dependencies.
- **Oxc:** remain the only lint/format toolchain. No ESLint, Prettier, or second formatter.
- **Env:** `apps/web/config/env.ts` gains `SPRING_API_ORIGIN` (default `http://localhost:8080`); `API_BASE_URL` remains optional with a `/api/v1/` fallback. Root `.env.example` comments are updated to say both apps use these values. `turbo.json` already declares both variables for `dev`; no new environment variable is introduced.
- **Dependencies:** add `@repo/http-client` to `apps/web/package.json` as a workspace dependency. No external UI or date library is added.

## Risks / Trade-offs

- **SMTP is not configured** → registration returns 503 `MAIL_NOT_CONFIGURED`. The web shows a clear top-level message; local/production deployment must provide `QQ_MAIL_USERNAME` and `QQ_MAIL_AUTH_CODE` in an untracked environment. Do not put the values in repository files or change artifacts.
- **Email deliverability or QQ restrictions** → the code-send endpoint can fail. The UI keeps the form intact and allows retry; the product fallback is to contact the administrator.
- **Duplicate registration race** → pre-checks handle normal cases; the database unique index plus `DATA_CONFLICT` 409 handles the race. The generic message is less specific but never returns 500.
- **SSR request isolation** → module-level refs would leak one student's state into another request. Auth refs use `useState` and the restore map is keyed by NuxtApp; the 401 listener stays client-only.
- **SSR needs a server-side token** → the token is in a same-origin cookie, not localStorage. The cookie is not `httpOnly`, so the browser adapter can add the Bearer header; XSS exposure is comparable to localStorage, and Spring still requires the header rather than the cookie.
- **SSR waits on Spring** → a slow or unavailable backend delays the first byte and shows the retryable error in the HTML. The shell and navigation still render.
- **Pure CSS increases component work and accessibility risk** → the foundation limits itself to the primitives needed by auth and the shell, with keyboard/focus/error tests. Later modules extend the set.
- **Admin regression** → the only shared API change is registration validation; admin login and `/api/v1/admin/**` are untouched. Run admin tests and a login smoke check before archive.
- **Product document currently specifies student-number login** → update `docs/product/student.md` and `business-rules.md` in the same change so the product and implementation do not diverge again.
- **Email-only registration excludes students without a QQ mailbox** → this is the selected product identity. The UI validates the domain and points users to the administrator when they cannot register.
- **SMTP send holds a database transaction** → the current send path can hold a connection for up to the SMTP timeout window. This is acceptable for the single-node campus deployment; if registration volume grows, move sending after commit or use an outbox.
- **AuthService uses the JVM default time zone** → `expiresAt` and code/session expiry are wall-clock values. If the deployment JVM is not `Asia/Shanghai`, document the timezone or inject the business `Clock` in a later auth-hardening change.
- **Profile editing is deferred** → the foundation's `/me` page is read-only. The backend profile update is tightened now (empty phone rejected, omitted phone keeps the current value) so later profile editing cannot break the required-phone invariant.
- **No login throttling and email enumeration** → code-send returns 409 for registered emails and login has no lockout. These are accepted for the first campus release; add rate limiting and a dummy-hash comparison in a security-hardening change.
- **Bare `admin` resolves to the local default admin email** → if deployment configures a different `INITIAL_ADMIN_EMAIL`, the administrator should use that full email; bare `admin` only reaches `admin@campus.local`.
- **Repeated logout can return 401** → Spring Security requires authentication for `/auth/logout`. The web treats a 401 on logout as already revoked, clears local state, and does not warn; only network/5xx failures warn that the server token may still be valid. The controller description should not promise a 2xx on every repeat.
- **Backend OpenAPI snapshots are tracked** → `backend/docs/api.md` and `docs/openapi.*` currently describe profile fields as optional. They must be regenerated or updated with the annotation change so generated clients do not omit required fields.
- **No real MySQL duplicate-key integration test** → the handler unit test covers `DuplicateKeyException` to 409, and the database unique index remains the final guard, but the actual MyBatis exception translation is not exercised against MySQL. A later database integration test should cover the concurrent registration race.
- **Mail failure rollback is not integration-tested** → the code row is written before the SMTP send and should roll back with the transaction on `MailException`; the unit tests cover the exception mapping, but a database integration test is still needed to prove the row is absent after a failed send.
- **Bootstrap default admin credentials are for local development** → production must set `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`; otherwise the documented demo account is created. This is a deployment prerequisite, not changed by this feature.
- **No cross-tab session synchronization** → logout or token clearing in one tab does not immediately update another open tab until its next request receives 401. This is acceptable for the first student release.

## Migration Plan

1. Configure the local backend SMTP environment (`QQ_MAIL_USERNAME`, `QQ_MAIL_AUTH_CODE`) in the untracked backend environment; verify one code send and one registration.
2. Deploy the Spring validation/uniqueness changes. There is no schema migration. Existing admin login is unaffected; existing student accounts remain valid.
3. Deploy web as a Nuxt/Nitro SSR server with `API_BASE_URL=/api/v1/` and a reachable `SPRING_API_ORIGIN`; the Nitro `server/api` route proxies browser requests, so no separate reverse proxy is required for `/api`. Development uses the same route with `SPRING_API_ORIGIN`.
4. Update the product and repository documentation, remove stale BFF claims from `backend/README.md` and `backend/docs/api.md`, and regenerate the tracked `backend/docs/openapi.*` snapshots in the same release.
5. Rollback: revert the web deployment and the Spring auth code; no database rollback is needed because no schema changed. Existing tokens continue to work until their normal expiry.

## Open Questions

None. Production SMTP credentials are deployment configuration, not a design decision; the local flow uses the provided credentials and the same environment keys.
