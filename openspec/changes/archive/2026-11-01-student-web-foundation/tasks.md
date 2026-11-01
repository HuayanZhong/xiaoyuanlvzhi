# Tasks

## 0. 变更前提

- Spring 代码位于 `../backend`，是 frontend Git 工作区之外的兄弟目录，且自身不是 Git 仓库。本变更包含这些后端编辑；所有 Maven 命令从 `../backend` 执行，评审和回滚需同时覆盖 frontend 与 backend 目录。
- QQ SMTP 凭据只写入 `../backend/.env` 等本地未跟踪环境，不进入仓库、OpenSpec、README 或任务文件。

## 1. Spring 学生认证

- [x] 1.1 在 `AuthDtos.RegisterRequest` 为姓名、学号、院系、班级、手机号增加必填、长度和手机号格式校验，手机号正则去掉空字符串分支；为 `RegisterRequest`、`EmailCodeRequest`、`LoginRequest` 的邮箱增加 `@Size(max=254)`；保留邮箱格式校验，但移除 `RegisterRequest` 和 `EmailCodeRequest` 的 QQ 域名 `@Pattern`，由服务层统一返回 `QQ_EMAIL_REQUIRED`；同步更新 `AuthDtos` 与 `AuthController` 的 OpenAPI 描述（含 logout 的 401 可能），并运行 `cd ../backend && ./mvnw -DskipTests compile` 验证编译
- [x] 1.2 在 `AccountRepository` 和 `AccountPersistenceAdapter` 增加 `existsByStudentNumber`，查询前去空白并复用现有学号唯一索引；运行 `cd ../backend && ./mvnw -DskipTests compile` 验证编译
- [x] 1.3 在 `AuthService.register` 中按“规范化/必填资料 → 邮箱重复 → 验证码校验 → 学号/手机号唯一 → 保存并消费验证码”的顺序实现，并同步把现有 `AuthServiceTest` 夹具改为完整资料；运行 `cd ../backend && ./mvnw -Dtest=AuthServiceTest test` 验证现有用例通过
- [x] 1.4 扩充 `AuthServiceTest`，覆盖重复学号、重复手机号、必填字段、错误验证码优先于学号/手机号冲突、重复邮箱优先于验证码，以及邮箱登录、管理员登录和禁用账号；运行 `cd ../backend && ./mvnw -Dtest=AuthServiceTest test` 确认全部通过
- [x] 1.5 新增 `AuthControllerContractTest`，覆盖注册必填字段 400、非 QQ 邮箱 400 `QQ_EMAIL_REQUIRED`、重复邮箱/学号/手机号 409、验证码发送 202/400/429、登录 401/403；运行 `cd ../backend && ./mvnw -Dtest=AuthControllerContractTest test` 确认通过
- [x] 1.6 在 `RegistrationEmailService` 同时检查 `QQ_MAIL_USERNAME` 和 `QQ_MAIL_AUTH_CODE`，并在 `GlobalExceptionHandler` 把 `MailException` 映射为 503 `MAIL_SEND_FAILED`；新增 `RegistrationEmailServiceTest` 覆盖空用户名/空授权码、成功发送和 `MailAuthenticationException`；在 `GlobalExceptionHandlerTest` 覆盖 `DuplicateKeyException` → 409 `DATA_CONFLICT` 和 `MailException` → 503；运行 `cd ../backend && ./mvnw -Dtest=RegistrationEmailServiceTest,AuthControllerContractTest,GlobalExceptionHandlerTest test` 确认邮件失败和唯一键冲突不再返回 500
- [x] 1.7 更新 `backend/docs/api.md`、`backend/README.md` 和受版本控制的 `backend/docs/openapi.json`/`backend/docs/openapi.yaml`：移除 NestJS BFF/`frontend/apps/bff` 等过时描述，改为 admin/web 直连 Spring；将注册资料从“可选”改为必填并同步状态码/错误码，同时同步 profile 手机号不可清空的校验；检查快照中的 `RegisterRequest.required` 包含五个资料字段
- [x] 1.8 在 `AccountDtos.ProfileRequest` 移除手机号的空字符串分支，使 `PUT /api/v1/profile` 对空手机号返回 400、省略时保持原值；补 `AccountServiceTest`/契约测试，运行 `cd ../backend && ./mvnw -Dtest=AccountServiceTest,ProfileControllerContractTest test` 验证不可清空
- [x] 1.9 新增 `ProfileControllerContractTest`，覆盖无 token 401、学生 token 200，以及首页/我的依赖的 `pointsBalance`、`activeAdoptionCount`、`email` 等字段；明确记录 ADMIN token 访问 `/api/v1/profile` 的行为；运行 `cd ../backend && ./mvnw -Dtest=ProfileControllerContractTest test` 确认通过
- [x] 1.10 运行后端完整验证 `cd ../backend && ./mvnw verify`，确认 Spotless、Checkstyle 和全部测试通过

## 2. Web 配置与基础

- [x] 2.1 在 `apps/web/package.json` 添加 `@repo/http-client` workspace 依赖并运行 `pnpm install`；确认 `pnpm-lock.yaml` 更新且 `pnpm --filter web exec nuxt prepare` 成功
- [x] 2.2 更新 `apps/web/config/env.ts`，声明 `SPRING_API_ORIGIN`（默认 `http://localhost:8080`，只接受不带路径/查询/片段的源地址并归一化末尾斜杠）并保留 `API_BASE_URL`；创建 `apps/web/shared/utils/api.ts` 提供默认 `/api/v1/` 和 `resolveApiBaseUrl`；运行 `pnpm --filter web exec nuxt prepare` 验证配置可解析，包含非法 `SPRING_API_ORIGIN` 的失败用例
- [x] 2.3 更新 `apps/web/nuxt.config.ts`，保留 Nuxt 默认 SSR、CSS 入口、中文 `lang`、`runtimeConfig.public.apiBaseUrl` 默认 `/api/v1/` 和私有 `runtimeConfig.springApiOrigin`；验证 `/login` 返回包含表单的服务端 HTML，`/api/v1/*` 由 Nitro `server/api` 转发
- [x] 2.4 更新根 `.env.example` 注释，说明 `API_BASE_URL` 和 `SPRING_API_ORIGIN` 同时供 admin 与 web 使用；检查文件不包含任何真实凭据
- [x] 2.5 更新 `turbo.json`：`build`、`check-types` 加入 `$TURBO_ROOT$/packages/http-client/**` 和 `$TURBO_ROOT$/packages/env/**`，`test`、`test:coverage` 加入 `$TURBO_ROOT$/packages/http-client/**`；运行 `pnpm test` 确认工作区任务通过，并用 `turbo run build --dry=json` 检查缓存哈希包含这些输入
- [x] 2.6 创建 `app/assets/css/tokens.css` 和 `base.css`，定义颜色、间距、圆角、字体、阴影和安全区 token；运行 `pnpm --filter web lint`，并检查组件样式中没有裸十六进制色值
- [x] 2.7 创建认证与页面壳所需的基础组件（按钮、字段、输入框、密码显示切换、验证码字段、行内错误、Toast/错误提示、加载态、空态、页头、底部导航、确认弹窗）；运行 `pnpm --filter web exec vitest run tests/nuxt/components` 验证组件测试

## 3. Web API 与会话

- [x] 3.1 创建 `app/utils/token.ts`，使用学生专用同源 Cookie（`student-auth-token`，7 天、`SameSite=Lax`）并在服务端通过 `useCookie` 读取；运行 `pnpm --filter web exec vitest run tests/nuxt/utils/token.test.ts` 验证 Cookie 读写和清理
- [x] 3.2 创建通用 `app/plugins/http.ts`、`server/api/[...path].ts` 和 API 适配层，使用 `useRuntimeConfig()` 创建 `@repo/http-client`；浏览器用相对 `/api/v1/` 经 Nitro 转发，SSR 直接访问 Spring；实现 Bearer 注入、Spring 信封解析、业务/网络/超时错误和 401 事件；认证 POST 关闭重试；请求 helper 支持注入 ky/fetch；运行 `pnpm --filter web exec vitest run tests/nuxt/utils/api.test.ts tests/nuxt/shared/utils/api.test.ts` 验证成功、相对路径、业务错误、401、403、网络、超时和代理目标拼接
- [x] 3.3 创建 `app/utils/auth-api.ts` 和 `app/utils/profile-api.ts`，封装验证码、注册、登录、`/auth/me`、退出（支持显式 token）和资料请求；运行 `pnpm --filter web check-types` 验证类型
- [x] 3.4 创建 `app/composables/useAuth.ts`，用 `useState` 保存认证状态并按 NuxtApp 隔离恢复去重，实现 checking/anonymous/authenticated/error 状态、attempt id 防迟到响应、登录/注册/退出、非 STUDENT 登录时用未持久化 token 显式注销，以及 STUDENT+ACTIVE 校验，并提供测试重置入口；等待网络响应后通过 `callWithNuxt` 回到请求上下文；运行 `pnpm --filter web exec vitest run tests/nuxt/composables/useAuth.test.ts` 验证状态机、非 STUDENT 注销和退出竞态
- [x] 3.5 创建 `app/middleware/auth.global.ts`，处理公开/受保护路由、单个合法 `returnTo`（拒绝外部、`//`、反斜杠、认证页和重复参数）、已登录访问认证页和公开的 404 catch-all；运行 `pnpm --filter web exec vitest run tests/nuxt/middleware/auth.test.ts` 验证重定向和 404 不被误拦
- [x] 3.6 创建 `app/utils/auth-events.ts` 和 `app/plugins/auth.client.ts`，把 401 事件连接到清理登录态；仅在受保护路由跳转登录页并携带当前 fullPath，公开页静默清理；运行 `pnpm --filter web exec vitest run tests/nuxt/utils/auth-events.test.ts` 验证只触发一次且不误报登录失败

## 4. Web 页面与壳

- [x] 4.1 更新 `app/app.vue` 为布局加页面结构，创建 `layouts/default.vue` 和 `layouts/auth.vue`；运行 `pnpm --filter web check-types` 验证布局和页面类型
- [x] 4.2 创建 `app/pages/login.vue`，实现邮箱/密码、邮箱去空白、必填校验、提交 loading、错误映射、注册链接和忘记密码提示；运行 `pnpm --filter web exec vitest run tests/nuxt/pages/login.test.ts` 验证交互
- [x] 4.3 创建 `app/pages/register.vue`，实现 QQ 邮箱、验证码发送与倒计时、429 重启倒计时、密码确认（密码不去空白）、完整资料、学号使用文本输入保留前导零、409 字段错误、邮箱已注册去登录、失败保留资料和注册后自动登录；运行 `pnpm --filter web exec vitest run tests/nuxt/pages/register.test.ts` 验证表单
- [x] 4.4 创建 `app/pages/index.vue`，用 `useAsyncData` 在服务端取资料并展示姓名、积分和在养绿植数，包含加载、零值和可重试失败状态；运行 `pnpm --filter web exec vitest run tests/nuxt/pages/home.test.ts` 验证页面
- [x] 4.5 创建 `app/pages/me.vue`，用 `useAsyncData` 展示完整资料、空字段占位和退出登录；运行 `pnpm --filter web exec vitest run tests/nuxt/pages/me.test.ts` 验证资料与退出
- [x] 4.6 创建 `app/pages/[...slug].vue` 404 页面，并补底部导航选中态、键盘焦点和 `aria-current` 测试；运行 `pnpm --filter web exec vitest run tests/nuxt/pages/not-found.test.ts tests/nuxt/components/ui-bottom-nav.test.ts` 验证
- [x] 4.7 创建 `tests/nuxt/setup.ts` 清理认证 Cookie、认证状态和异步数据缓存，并在 `vitest.config.ts` 配置 `setupFiles`；更新 `tests/nuxt/App.test.ts` 以覆盖新的根布局和默认页面；运行 `pnpm --filter web test` 确认全部 Nuxt 测试通过

## 5. 文档与项目上下文

- [x] 5.1 更新 `docs/product/student.md`：注册章节增加 QQ 邮箱和验证码行，登录改为邮箱+密码；首页未登录说明改为登录墙；资料章节增加邮箱并标明姓名/学号/邮箱由管理员更正、手机号/班级可自助修改；验收流程第 1 步加入邮箱验证码；明确当前 foundation 只交付登录/注册、首页摘要、我的只读和退出，绿植/任务/积分导航、完整首页六区块、资料编辑、通知/反馈标注为后续迭代；核对与 `student-auth` 规格一致
- [x] 5.2 更新 `docs/product/business-rules.md` 的身份规则：QQ 邮箱验证码、学号/手机号唯一、管理员预置；确认没有残留“学号登录”描述
- [x] 5.3 更新 `README.md` 的 web 说明：当前页面 `/login`、`/register`、`/`、`/me`，`/me` 当前只读资料和退出，绿植/任务/积分导航随模块落地；说明认证、API base/代理、纯 CSS 和测试命令；确认不再把 web 描述为骨架
- [x] 5.4 更新 `AGENTS.md`：删除 admin 占位路由和“apps still early skeletons”等过时描述，补充 web 的 SSR、`app/` + `server/` 结构、页面/布局/中间件、Cookie token、`runtimeConfig`、Nitro `server/api` 代理和测试位置；核对与当前代码一致
- [x] 5.5 更新 `openspec/config.yaml` 的项目上下文，说明 admin 与 web 都把 `/api` 代理到 Spring，`@repo/http-client` 供两者共用，并补充 web 认证基础；运行 `openspec context --json` 验证可解析

## 6. 集成验证

- [x] 6.1 运行根目录 `pnpm verify`，确认 lint、format:check、类型检查和全部测试通过
- [x] 6.2 运行 `pnpm --filter web build`，确认 Nuxt 生产构建成功并检查 `.output` 中的 API base 注入
- [x] 6.3 运行 `cd ../backend && ./mvnw verify`，确认后端完整测试、Spotless 和 Checkstyle 通过
- [x] 6.4 在本地后端未跟踪环境配置 QQ SMTP 的 `QQ_MAIL_USERNAME` 与 `QQ_MAIL_AUTH_CODE`，发送一次验证码并完成一次注册；确认返回 202/201 且邮件到达，不把凭据写入仓库
- [x] 6.5 使用浏览器在 375x812、320x800 和 768x1024 验证登录、注册、刷新恢复、退出、401 过期、离线失败和无横向滚动；检查底部导航 safe-area padding 和 `prefers-reduced-motion` 下动画关闭；确认控制台无错误
- [x] 6.6 检查接口行为：缺字段 400、重复邮箱/学号/手机号 409、错误密码 401、禁用账号 403、验证码 202、未配置邮件 503、邮件发送失败 503；确认响应不包含 token 或密码
- [x] 6.7 回归 admin：运行 `pnpm --filter admin test`，用管理账号登录并访问 `/dashboard`，确认学生 token 访问 `/api/v1/admin/**` 仍返回 403

## 7. SSR 与服务端转发修正

- [x] 7.1 按 Nuxt 目录约定启用默认 SSR，移除 `ssr:false`、SPA loading 模板和 `nitro.devProxy`；新增 `server/api/[...path].ts`，用 `proxyRequest` 把 `/api/*` 转发到 `SPRING_API_ORIGIN`，并用 `resolveSpringApiTarget` 保留 `/api` 前缀
- [x] 7.2 把 accessToken 从 localStorage 改为同源 `student-auth-token` Cookie，使 SSR 守卫和 `useAsyncData` 能读取登录态；`useAuth` 改用 `useState` 按请求隔离状态，并在等待响应后通过 `callWithNuxt` 恢复 Nuxt 上下文；`app/plugins/http.ts` 改为通用插件，SSR 直接访问 Spring
- [x] 7.3 首页和“我的”改用 `useAsyncData`；更新 Cookie、代理目标和测试 setup；运行 web 测试、类型检查、lint、生产构建，并冒烟验证 `/login` 返回 SSR HTML、未登录 `/` 服务端 302、无效 Cookie 被清除、`/api/v1/auth/login` 经 Nitro 返回 Spring 401

## Workflow follow-up

- 评审通过后运行 `/opsx:archive` 归档变更。
- 归档前确认所有任务完成、`openspec validate --specs --strict` 通过，且工作区没有未预期的 `.env*`、`.nuxt` 或构建产物变更。
