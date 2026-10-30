# Design

## Context

当前 admin 只有静态登录页：表单校验通过后直接跳转 `/dashboard`，没有请求、token 或路由守卫。Spring 后端已提供 `/api/v1/auth/login`、`/api/v1/auth/me`、`/api/v1/auth/logout`，登录返回 Bearer accessToken（7 天有效），没有 refresh token。`apps/bff` 是此前为完整 BFF 会话准备的 NestJS 骨架，管理端尚未接入它。

现有链路中，Vite 把 `/api` 代理到 BFF 5000 并去掉 `/api` 前缀；Spring 监听 8080，API 根路径为 `/api/v1`，且没有 CORS 配置。`@repo/http-client` 是环境无关的 ky 工厂，admin 在 `src/lib/http.ts` 中传入 base URL。

## Goals / Non-Goals

**Goals:**

- 删除 BFF 进程和它的认证/会话代码，工作区只保留 admin 与 web 两个应用。
- admin 直连 Spring，完成登录、启动恢复、路由守卫、401 处理和退出。
- 保持 Spring 为最终认证和角色边界，不修改后端接口。
- 开发与生产默认采用同源路径，避免给 Spring 增加 CORS 配置。

**Non-Goals:**

- 不实现 refresh token、记住我、多标签页同步退出或跨设备会话管理。
- 不引入 HttpOnly Cookie 或 CSRF token；Bearer 头不随浏览器自动发送。
- 不实现业务模块 API，只建立认证基础设施。
- 不支持 admin 与 Spring 分域部署；该场景需要额外的 CORS 设计。

## Decisions

### D1：删除整个 `apps/bff`

BFF 的当前价值只有 HttpOnly 会话和服务端 token。既然管理端接受浏览器持有 token，BFF 只剩一个无业务逻辑的转发进程，删除它可以去掉一个端口、一套依赖、一组环境变量和一组测试。

替代方案是保留 BFF 骨架供未来使用，但它会继续出现在 Turbo、README、AGENTS 和环境变量中，容易让人误以为它是认证边界。未来若真的需要聚合多个后端，再单独提案引入。

### D2：开发用 Vite 同源代理，生产用同源反向代理

开发环境把 `/api` 原样代理到 `http://localhost:8080`，浏览器看到的是 `http://localhost:3000/api/v1/...`；生产环境假设 admin 静态资源与 Spring 由同一站点提供，由 Nginx 把 `/api/v1` 反代到 Spring。两条路径都不触发浏览器跨域，因此 Spring 不需要 CORS。

替代方案是让浏览器直接请求 `http://localhost:8080` 并在 Spring 配置 CORS。它需要修改后端、在生产环境维护来源白名单，且会让管理员 token 出现在跨域请求中；在当前单后端场景没有收益。

### D3：accessToken 存 localStorage

Spring 没有 refresh token，token 本身 7 天有效。存 localStorage 可以让刷新、重开浏览器和跨标签页都保持登录，代码量也最小。代价是同源脚本可以读取 token，XSS 时暴露窗口等于 token 有效期。

替代方案：sessionStorage 关闭标签页即退出，但多标签页要分别登录；仅内存最安全但刷新即退出。选择 localStorage 是明确接受该取舍；后续可通过 CSP、依赖审计和避免 `dangerouslySetInnerHTML` 降低 XSS 风险。

### D4：认证状态与 token 分离

- `src/lib/token.ts`：只负责读写/清理 `localStorage` 中的 token，不依赖 React 或路由。
- `src/lib/auth-events.ts`：一个极小的未认证事件通道，避免 HTTP 客户端反向依赖 auth store。
- `src/stores/auth.ts`：zustand store，保存 `status`（`checking` / `authenticated` / `anonymous` / `error`）和 `account`；动作包括 `restore()`、`login()`、`logout()`、`clear()`。
- `src/api/auth.ts`：封装 Spring 登录、`/me`、注销和响应类型。

token 模块独立可以避免 `http.ts` 与 auth store 的循环依赖：HTTP 客户端只读取 token 并发出未认证事件，不知道 store。

### D5：认证头与 401 放在 admin 的 HTTP 适配层

`@repo/http-client` 保持环境无关、不含认证逻辑。admin 在 `createHttpClient` 的 `beforeRequest` 钩子里附加 `Authorization: Bearer`，在 `afterResponse` 钩子里对 401 清除 token 并调用 `emitUnauthorized()`。auth store 在模块初始化时订阅该事件并清空账号。这样共享包契约不变，HTTP 客户端也不会反向依赖 React 或 store。

### D6：客户端角色检查只做体验，Spring 仍是权限边界

Spring 登录对合法学生账号也会返回 200，因此 admin 在登录响应和 `/me` 响应中检查 `account.role === "ADMIN"`。非管理员时尽力注销该 token、清理本地状态并提示。真正的权限仍由 Spring 对 `/api/v1/admin/**` 的 `hasRole("ADMIN")` 执行。

### D7：退出登录总是清理本地状态

点击退出时先带 Bearer 调 `POST /api/v1/auth/logout`，无论成功与否都清除本地 token 和账号并回到 `/login`。注销失败时提示“服务端令牌可能仍未失效”。这避免用户被卡在无法退出的状态；服务端 token 会在 7 天后自然过期。

### D8：启动校验与路由守卫

`App` 外层放 `SessionGate`：首次挂载调用 `restore()`，`checking` 时显示全屏加载，`error` 时显示重试，`anonymous` 时仍渲染路由（由 `RequireAdmin` 把业务路由送回 `/login`）。

`RequireAdmin` 包裹后台壳路由：未认证时 `<Navigate to="/login?returnTo=...">`；已认证访问 `/login` 时回 `/dashboard`。`returnTo` 只接受以单个 `/` 开头且不以 `//` 开头的站内路径。

### D9：环境变量与代理路径

- `API_BASE_URL` 默认 `/api/v1/`，与 Spring 路径一致；`resolveApiBaseUrl` 的回退值同步修改。
- `SPRING_API_ORIGIN` 默认 `http://localhost:8080`，只用于 Vite 开发代理，不进入浏览器产物。
- Vite 代理保留 `/api` 前缀，不再 rewrite；否则 `/api/v1/auth/login` 会被改写成 `/v1/auth/login`。
- `.env.example` 删除 BFF 的 `PORT`、`SPRING_API_BASE_URL`、`SESSION_SECRET`、`ADMIN_ORIGINS`、`BFF_COOKIE_SECURE`、`BFF_SESSION_DAYS`。
- `turbo.json` 的 `dev.env` 用 `SPRING_API_ORIGIN` 替换 BFF 变量；`build.env` 仍保留 `API_BASE_URL`。

### D10：工作区清理

删除 `apps/bff` 后运行 `pnpm install` 更新锁文件，移除 `@nestjs/axios`、`axios`、`express-session` 等仅 BFF 使用的依赖。README、AGENTS、PR 模板和 `openspec/config.yaml` 中关于三应用、BFF 端口和 BFF 边界的描述同步改为两应用。

`apps/admin` 的 tsconfig、Vitest 配置和覆盖率 include 不需要结构性调整；新测试继续放在 `apps/admin/tests/unit`，参与现有 `tsc --noEmit` 和 Vitest include。

### D11：页面级反馈使用轻量 toast

登录成功、登录失败、登录过期和退出成功统一通过页面级 toast 提示，不再在表单内重复同一条错误。toast 由 `lib/toast-events` 发布、`ToastBridge` 订阅后调用 `lib/toast-dom`，直接挂到 `document.body` 顶部居中，样式走 `global.css` 的 `.app-toast` 与设计 token，不依赖 antd message holder 或路由生命周期。HTTP 适配层对 `/auth/login` 与 `/auth/logout` 自身的 401 不发布“登录已过期”事件，避免登录失败或主动退出时误报；退出提示在跳转前直接发布，toast 挂在 body 上，路由切换不会打断。

## Risks / Trade-offs

- [XSS 可读取 localStorage token] → 不引入不可信脚本，避免 `dangerouslySetInnerHTML`，后续补 CSP；token 有效期保持 7 天。
- [注销接口失败后服务端 token 仍有效] → 本地立即清理并提示用户；token 自然过期，必要时由管理员在服务端撤销。
- [生产环境若分域部署会触发 CORS] → 当前假设同源反代；分域部署需要单独提案给 Spring 加 CORS。
- [启动时后端不可用] → 保留 token 并显示重试，不把网络故障当登出。
- [localStorage 中的账号资料可能过期] → 每次启动用 `/me` 刷新；401 时清理。
- [删除 BFF 后失去统一服务端聚合点] → 当前只有一个后端，不需要聚合；未来需要时重新引入。

## Migration Plan

1. 删除 `apps/bff`，清理 `.env.example`、`.env.development`、`.env.production`、`turbo.json`、`pnpm-lock.yaml`。
2. 更新 admin 环境、Vite 代理、HTTP 适配层。
3. 添加认证 store、SessionGate、RequireAdmin、登录/退出页面行为。
4. 更新 README、AGENTS、PR 模板、`openspec/config.yaml` 和主规格中过时的 BFF 描述。
5. 运行 `pnpm --filter admin lint check-types test`，再运行根目录 `pnpm verify`。
6. 手动联调：启动 Spring 与 admin，使用 `admin / 123456` 登录，刷新保持登录，退出后回到登录页；未登录直接访问 `/dashboard` 应回跳。

回滚：恢复本次提交即可；被放弃的 BFF 实现保存在本地 git stash 中，可按需取回。
