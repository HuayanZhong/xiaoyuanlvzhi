<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Repository guidance for coding agents

## Repository at a glance

pnpm + Turborepo workspace with three apps and three workspace packages:

| Package                   | Stack                            | Port | Role                           |
| ------------------------- | -------------------------------- | ---- | ------------------------------ |
| `admin`                   | React 19 + Vite 8 + TypeScript 6 | 3000 | Admin SPA                      |
| `web`                     | Nuxt 4 + Vue 3 + TypeScript 6    | 4000 | User-facing app                |
| `bff`                     | NestJS 12 + Express              | 5000 | HTTP BFF skeleton              |
| `@repo/http-client`       | ky 2 + TypeScript 6              | —    | Shared HTTP client             |
| `@repo/env`               | zod 4 + TypeScript 6             | —    | Shared env validation          |
| `@repo/typescript-config` | Shared tsconfig presets          | —    | `base`, `react-app`, `library` |
| `@repo/vitest-config`     | Shared Vitest defaults           | —    | Test/coverage defaults         |

The apps are currently minimal skeletons. `@repo/http-client` is the only shared runtime package; `@repo/env` is build/startup-time only. There is no shared UI package, authentication, or persistence. The admin dev server proxies `/api/*` to the BFF, but no domain API call exists yet. The BFF only exposes `GET /` and `GET /health`.

## Commands

Run all commands from the repository root. Root scripts delegate to `turbo`; the real build/lint/test commands live in each app's `package.json`.

```sh
pnpm install        # install workspace dependencies
pnpm dev            # start admin(3000), web(4000), and bff(5000) together
pnpm build          # build all apps
pnpm lint           # oxlint --deny-warnings in every package
pnpm lint:fix       # root oxlint --fix (not routed through Turbo)
pnpm format         # oxfmt in every package
pnpm format:check   # verify formatting
pnpm check-types    # type-check every package
pnpm test           # Vitest run in every app
pnpm test:coverage  # Vitest + V8 coverage in every app
```

Work on one app with a pnpm filter:

```sh
pnpm --filter admin dev
pnpm --filter web build
pnpm --filter bff check-types
pnpm --filter admin test:watch
```

Run a single test file or a single test by name:

```sh
pnpm --filter admin exec vitest run tests/unit/App.test.tsx
pnpm --filter admin exec vitest run tests/unit/App.test.tsx -t "renders the primary button"
pnpm --filter admin exec vitest run tests/unit/http.test.ts
pnpm --filter @repo/http-client exec vitest run tests/client.test.ts
pnpm --filter web exec vitest run tests/nuxt/App.test.ts
pnpm --filter bff exec vitest run tests/e2e/app.e2e.test.ts
```

Build outputs are `apps/admin/dist`, `apps/web/.output`, and `apps/bff/dist`. Coverage reports are written to `apps/<app>/coverage/` and `packages/http-client/coverage/`, both ignored by Git.

## How the workspace is wired

### Environment configuration

Environment files live in the repository root and are shared by all three apps:

| File                | Committed | Role                             |
| ------------------- | --------- | -------------------------------- |
| `.env.example`      | yes       | template documenting every key   |
| `.env.development`  | no        | development values               |
| `.env.production`   | no        | production values                |
| `.env`              | no        | local base overrides             |
| `.env.local`        | no        | machine-local overrides          |
| `.env.<mode>.local` | no        | per-mode machine-local overrides |

Only `.env.example` is committed; never commit a file that can hold secrets. Copy it to `.env.development` and `.env.production` locally, or rely on the schema defaults, which cover every port.

Every app script injects them with `dotenv -c <mode> -e ../../.env -- <command>`. `dotenv-cli`'s cascade loads `.env.<mode>.local` → `.env.local` → `.env.<mode>` → `.env`, and **first loaded wins**: a later file never overrides an already-set variable. Variables already present in the process environment win over all files. There is no `createEnv`-style loader; the shared package never reads files or `process.env`.

`@repo/env` exports `parseEnv(schema, env?, options?)`, `EnvError`, a re-exported `z`, and zod builders (`envString`, `envOptionalString`, `envUrlString`, `envIntString`, `envBoolString`). Each app declares its own schema in `src|config/config/env.ts`; `parseEnv` throws with every invalid key listed. The shared package knows no business variable names.

`NODE_ENV` is asymmetric: admin and web bake their values in at build time (`.env.production`), while the BFF reads `PORT` and `NODE_ENV` at runtime. `apps/bff`'s `start` script therefore also runs through `dotenv -c production`, and `dotenv-cli` is a runtime dependency there rather than a dev dependency.

Nuxt resolves its port as `--port → NUXT_PORT → NITRO_PORT → PORT`, falling back to `devServer.port` only when none is set. Because `PORT` belongs to the BFF, a local env file sets `NUXT_PORT=${WEB_PORT}`; without any env file, `devServer.port` keeps the web dev server on 4000.

On Windows Git Bash, a shell override whose value looks like a POSIX absolute path (for example `API_BASE_URL=/api/ pnpm dev`) is rewritten into a Windows path by MSYS path conversion. Set such values in the env files, or prefix the command with `MSYS_NO_PATHCONV=1`.

### Turborepo

`turbo.json` is the task graph:

- `build` depends on `^build`, hashes the root env files via `$TURBO_ROOT$/.env*`, declares `NODE_ENV`, and caches `dist/**` and `.output/**`.
- `lint` and `check-types` run workspace dependencies first.
- `format` is uncached; `format:check` is cached.
- `test` includes `packages/vitest-config/**` and `packages/env/**` as inputs, so shared test config or shared env changes invalidate test caches.
- `test:coverage` runs with Turbo concurrency 1 from the root script because parallel V8 coverage workers can exhaust memory; `test` remains parallel.
- `test:coverage` also caches `coverage/**`.
- `dev` is persistent, uncached, and declares `PORT` and `NODE_ENV`. Turbo 2.11 defaults to `envMode: "strict"`; an undeclared variable is stripped from the task process, so `PORT=4321 pnpm dev` would otherwise reach the BFF as `undefined`.

When a root-level config file affects a task, add it to that task's `inputs` (the existing lint/format/test tasks already reference the root Oxc, Oxfmt, and Vitest configs).

Only `admin`, `web`, `bff`, `@repo/http-client`, and the config packages participate. Package names, not folder paths, are used with `--filter` in the documented commands.

### `apps/admin`

React SPA with the entry point `src/main.tsx` rendering `src/App.tsx`. There is no router or state manager. `src/lib/http.ts` is the environment adapter: it resolves `VITE_API_BASE_URL`, falls back to `/api/`, and creates the shared ky client.

`src/config/env.ts` parses `ADMIN_PORT` (default 3000), `PORT` (default 5000) and optional `API_BASE_URL`. `vite.config.ts` reads that object and writes `process.env.VITE_API_BASE_URL`; Vite then merges `VITE_*` into `import.meta.env`, so `http.ts` is unchanged and `@repo/env` never enters the browser bundle. The dev server port and the `/api` proxy target both come from the env file, so the scripts must not pass `--port`.

`vite.config.ts` owns both Vite and Vitest configuration: React plugin, `/api` proxy to the BFF with the prefix stripped, jsdom environment, `tests/**/*.test.{ts,tsx}`, and `tests/setup.ts`. The setup file registers `@testing-library/jest-dom/vitest` and calls Testing Library `cleanup` after each test. The app tsconfig extends `@repo/typescript-config/react-app.json` and includes `tests` and `vite.config.ts`.

Only `src/lib/http.ts` reads `import.meta.env`; keep future environment access in that adapter so the root environment module can replace it without touching the shared package.

### `apps/web`

Nuxt 4 application. The root component is `app/app.vue`; `config/env.ts` parses `WEB_PORT` (default 4000) and `nuxt.config.ts` feeds it to `devServer.port`.

`tsconfig.json` extends the generated `./.nuxt/tsconfig.json`. If types are stale after changing dependencies or app structure, run `pnpm --filter web exec nuxt prepare`. Nuxt's generated config includes `tests/nuxt/**/*`, which is why Nuxt tests live there.

`vitest.config.ts` uses `defineVitestConfig` from `@nuxt/test-utils/config`, the `nuxt` environment with jsdom, and `tests/nuxt/**/*.test.ts`. `apps/web/.nuxtrc` is generated by Nuxt/test-utils and should not be hand-edited.

### `apps/bff`

NestJS HTTP BFF. `src/main.ts` bootstraps `AppModule`; `AppModule` wires `AppController`, which serves `GET /` and `GET /health`. `src/config/env.ts` parses `PORT` (default 5000) and `main.ts` listens on that value. The `start` script runs `dotenv -c production -e ../../.env -- node dist/main`, so the built artifact reads the root env files at runtime.

The runtime is CommonJS and uses Nest decorator metadata:

- `tsconfig.json` compiles `src` with `experimentalDecorators` and `emitDecoratorMetadata`.
- `tsconfig.build.json` excludes tests and the Vitest config from the Nest build.
- `tsconfig.test.json` includes `src`, `tests`, and `vitest.config.mts` with `rootDir: "."`; `check-types` uses this config.
- `vitest.config.mts` uses `unplugin-swc` because the default esbuild transform does not emit decorator metadata. Keep the `.mts` extension to avoid Vite's CJS/ESM loader warning.

Tests are split into `tests/unit` (direct controller construction) and `tests/e2e` (create a Nest application with `@nestjs/testing` and call it through Supertest). E2E tests do not require a separately running server.

### Shared packages

- `@repo/http-client`: exports `createHttpClient`, default timeout/retry constants, and ky's HTTP/network/timeout errors plus guards from `src/index.ts`. It is source-exported with no build step and never reads environment variables.
- `@repo/env`: exports `parseEnv`, `EnvError`, `z`, and the zod builders from `src/index.ts`, source-exported with no build step. It performs no file loading; callers pass a plain record (normally `process.env`) and declare their own schema.
- `@repo/typescript-config`: `base.json` is strict `NodeNext`/ES2022; `react-app.json` switches to bundler resolution, `react-jsx`, and `vite/client` types; `library.json` is the bundler/no-emit preset for non-React runtime packages. The BFF and config packages extend `base.json`.
- `@repo/vitest-config`: exports `baseTestConfig` from `src/base.ts`. App and package configs spread it into their own `test` block and override `environment`, `include`, `setupFiles`, or `environmentOptions`. The shared coverage `include` covers `src`, `app`, and `shared`; update it if source moves.

These packages export source files directly; there is no build step for workspace config packages or `@repo/http-client`.

## Testing conventions

- All apps and the shared HTTP client use Vitest 5 with the V8 coverage provider.
- `test` is the normal run; `test:coverage` enables coverage with `text`, `html`, and `lcov` reporters.
- Admin tests use jsdom + Testing Library. Web tests use the Nuxt runtime. BFF tests use Nest testing utilities and Supertest. `@repo/http-client` tests use the Node environment with an injected fetch.
- Test files are type-checked as part of each app's or package's normal type checking, except that the BFF uses the dedicated `tsconfig.test.json`.
- Keep test files in the app/package configured `tests` directory; changing the directory requires updating both the Vitest `include` pattern and the relevant tsconfig/Nuxt setup.

## Toolchain and conventions

- Node.js version is pinned in `.nvmrc` (`26.12.1`); the root `engines` field requires `>=26.12.1`.
- pnpm 12.14.0. Most app/tool versions are exact pins; keep Vite, Vitest, and TypeScript versions aligned across apps when upgrading.
- pnpm 12 enforces a 24-hour `minimumReleaseAge`. A newly released pinned version must be added to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. Native install scripts must be allowed under `allowBuilds` (currently `esbuild` and `@swc/core`).
- Oxc is the only lint/format toolchain; ESLint and Prettier are intentionally disabled. Root configs are `.oxlintrc.json` and `.oxfmtrc.json`; package scripts run `oxlint`/`oxfmt`.
- Formatting defaults: UTF-8, LF, 2 spaces, 80-column print width. Do not add conflicting formatter configs.
- OpenSpec is initialized for spec-driven changes; specs/changes live under `openspec/` and the workflow skills are under `.agents/skills/`.
- Git hooks are managed by husky through the root `prepare` script. See `README.md` → "Git 钩子" for hook behavior, bypass rules, and Windows troubleshooting.
