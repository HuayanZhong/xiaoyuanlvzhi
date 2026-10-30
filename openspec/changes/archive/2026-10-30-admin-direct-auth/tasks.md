# Tasks

## 1. 工作区清理（删除 BFF）

- [x] 1.1 删除 `apps/bff` 整个目录，确认 `apps/bff` 不存在且 `pnpm-workspace.yaml` 无需改动（`test ! -d apps/bff`）。
- [x] 1.2 运行 `pnpm install` 更新锁文件并清理 BFF 依赖，确认 `pnpm list -r --depth 0` 不再列出 `bff`，且 `pnpm-lock.yaml` 不再包含 `express-session` 与 `@nestjs/axios`。
- [x] 1.3 清理 `.env.example`、`.env.development`、`.env.production`：删除 `PORT`、`SPRING_API_BASE_URL`、`SESSION_SECRET`、`ADMIN_ORIGINS`、`BFF_COOKIE_SECURE`、`BFF_SESSION_DAYS`，新增 `SPRING_API_ORIGIN=http://localhost:8080`，把 `API_BASE_URL` 改为 `/api/v1/`；确认 `grep -R "BFF_\|SESSION_SECRET\|ADMIN_ORIGINS\|SPRING_API_BASE_URL" .env.example .env.development .env.production` 无匹配。
- [x] 1.4 更新 `turbo.json` 的 `dev.env`：移除 BFF 变量，加入 `SPRING_API_ORIGIN`；用 `pnpm exec turbo run dev --dry=json` 确认任务环境包含该变量。
- [x] 1.5 更新 `README.md`、`AGENTS.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`openspec/config.yaml`：改为 admin/web 两个应用，删除 BFF 端口、命令、测试和边界描述；确认 `grep -Rni "bff" README.md AGENTS.md .github/PULL_REQUEST_TEMPLATE.md openspec/config.yaml` 无匹配。
- [x] 1.6 更新 `openspec/specs/env/spec.md` 的 Purpose，把“三个应用”改为 admin 与 web 两个应用；用 `openspec show env --type spec` 确认文案已更新。

## 2. admin 环境与 HTTP 适配层

- [x] 2.1 修改 `apps/admin/src/config/env.ts`：移除 `PORT`，新增 `SPRING_API_ORIGIN`（默认 `http://localhost:8080`，URL 校验）；`pnpm --filter admin check-types` 通过。
- [x] 2.2 修改 `apps/admin/vite.config.ts`：代理 target 使用 `env.SPRING_API_ORIGIN`，保留 `/api` 前缀，不 rewrite；`pnpm --filter admin build` 通过。
- [x] 2.3 新增 `apps/admin/src/lib/token.ts`：同源 localStorage 读写与清理，存储异常时安全降级；新增 `tests/unit/lib/token.test.ts` 覆盖读写、清理和异常分支，`pnpm --filter admin exec vitest run tests/unit/lib/token.test.ts` 通过。
- [x] 2.4 新增 `apps/admin/src/lib/auth-events.ts`：未认证事件订阅与发布；新增 `tests/unit/lib/auth-events.test.ts` 覆盖订阅、退订和发布，`pnpm --filter admin exec vitest run tests/unit/lib/auth-events.test.ts` 通过。
- [x] 2.5 修改 `apps/admin/src/lib/http.ts`：base 回退改为 `/api/v1/`，`beforeRequest` 附加 Bearer，`afterResponse` 对 401 清理 token 并发布未认证事件；扩展 `tests/unit/http.test.ts` 覆盖回退值、有/无 token 的请求头和 401 清理，`pnpm --filter admin exec vitest run tests/unit/http.test.ts` 通过。
- [x] 2.6 运行 `pnpm --filter admin lint check-types test`，确认本组改动全部通过。

## 3. admin 认证 API 与状态

- [x] 3.1 新增 `apps/admin/src/api/auth.ts`：封装 `POST /auth/login`、`GET /auth/me`、`POST /auth/logout`，解析 Spring `{ success, data, error }` 信封并映射中文错误；新增 `tests/unit/api/auth.test.ts` 覆盖成功、401、403、5xx 和信封错误，`pnpm --filter admin exec vitest run tests/unit/api/auth.test.ts` 通过。
- [x] 3.2 新增 `apps/admin/src/stores/auth.ts`：`checking/authenticated/anonymous/error` 状态、`restore()`、`login()`、`logout()`、`clear()`，非 ADMIN 时不保存登录态，订阅未认证事件；新增 `tests/unit/stores/auth.test.ts` 覆盖启动恢复、401、网络失败、非管理员和退出，`pnpm --filter admin exec vitest run tests/unit/stores/auth.test.ts` 通过。
- [x] 3.3 新增 `apps/admin/src/components/auth/SessionGate.tsx`：启动时调用 `restore()`，checking 显示加载、error 显示重试、其余渲染子节点；新增 `tests/unit/components/auth/SessionGate.test.tsx` 覆盖加载、成功、失败重试，`pnpm --filter admin exec vitest run tests/unit/components/auth/SessionGate.test.tsx` 通过。
- [x] 3.4 新增 `apps/admin/src/lib/return-to.ts` 与 `apps/admin/src/components/auth/RequireAdmin.tsx`：未登录重定向 `/login?returnTo=...`，已登录访问 `/login` 回 `/dashboard`，拒绝外部 `returnTo`；新增 `tests/unit/lib/return-to.test.ts` 和 `tests/unit/components/auth/RequireAdmin.test.tsx`，对应测试通过。
- [x] 3.5 运行 `pnpm --filter admin lint check-types test`，确认本组改动全部通过。

## 4. 登录页、路由与退出

- [x] 4.1 修改 `apps/admin/src/components/auth/LoginForm.tsx`：异步提交、loading、禁用重复提交、中文错误提示；账号和密码只校验必填与非空白，移除“至少 6 位”；更新 `tests/unit/components/auth/LoginForm.test.tsx`（或现有登录页测试）覆盖成功、失败和 loading。
- [x] 4.2 修改 `apps/admin/src/pages/auth/LoginPage.tsx`：调用真实登录、使用安全 `returnTo`、移除静态演示提示；更新 `tests/unit/pages/auth/LoginPage.test.tsx` 覆盖成功后跳转、失败停留和回跳路径。
- [x] 4.3 修改 `apps/admin/src/router/index.tsx`：用 `RequireAdmin` 包裹后台壳路由，登录页在已认证时回 `/dashboard`；更新 `tests/unit/router.test.tsx` 覆盖未登录访问 `/dashboard`、已登录访问 `/login` 和未知路径。
- [x] 4.4 修改 `apps/admin/src/components/layout/HeaderActions.tsx`：账号菜单显示姓名或邮箱，退出调用 auth store 并处理注销失败提示；更新 `tests/unit/components/layout/HeaderActions.test.tsx` 覆盖账号展示和退出。
- [x] 4.5 运行 `pnpm --filter admin lint check-types test`，确认本组改动全部通过。

## 5. 集成验证

- [x] 5.1 运行 `pnpm install && pnpm --filter admin build`，确认构建产物生成且无环境变量校验错误。
- [x] 5.2 从仓库根目录运行 `pnpm lint`、`pnpm check-types`、`pnpm test`，确认所有剩余应用与共享包通过。
- [x] 5.3 启动 Spring（8080）与 admin（3000），手动验证：`admin / 123456` 登录成功；刷新保持登录；未登录访问 `/dashboard` 回跳 `/login?returnTo=/dashboard`；退出后回到登录页；非管理员账号被拒；后端停止时启动显示重试而不是静默退出。
- [x] 5.4 运行 `openspec validate admin-direct-auth --strict`，确认变更规格通过校验。

## 6. 认证反馈弹窗

- [x] 6.1 新增 `apps/admin/src/lib/toast-events.ts`、`apps/admin/src/lib/toast-dom.ts` 与 `apps/admin/src/styles/global.css` 的 `.app-toast` 样式：顶部居中、类型图标、进出动画、3 秒自动消失；新增 `tests/unit/lib/toast-events.test.ts` 与 `tests/unit/lib/toast-dom.test.ts`。
- [x] 6.2 在 `LoginForm` 登录失败时显示 `error` toast，在 `LoginPage` 登录成功时显示 `success` toast；更新 `tests/unit/components/auth/LoginForm.test.tsx` 和 `tests/unit/pages/auth/LoginPage.test.tsx`。
- [x] 6.3 退出时 `HeaderActions` 在跳转前直接发布 toast，提示“已退出登录”或“已退出本地登录，但服务端令牌可能仍未失效”；更新 `tests/unit/components/layout/HeaderActions.test.tsx`。
- [x] 6.4 新增 `ToastBridge`，业务请求 401 时显示“登录已过期，请重新登录”；让 `/auth/login` 与 `/auth/logout` 自身的 401 不触发该提示；新增 bridge 测试并扩展 `tests/unit/http.test.ts`。
- [x] 6.5 运行 `pnpm --filter admin lint check-types test` 和 `openspec validate admin-direct-auth --strict`，确认全部通过。

## Workflow follow-up

- 归档 `admin-direct-auth`，并在归档摘要中记录删除 BFF、admin 直连 Spring 的验证结果。
