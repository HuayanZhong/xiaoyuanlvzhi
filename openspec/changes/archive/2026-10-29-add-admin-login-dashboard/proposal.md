# Proposal

## Why

admin 目前只有一个占位首页，没有登录入口，也没有登录后的落地页，管理端的进入流程无法验证。先建立 B 端登录页和 dashboard 占位页，可以在不引入真实认证的前提下固定路由、布局和交互契约，为后续接入认证和业务页面提供稳定入口。

## What Changes

- 新增 admin 登录页：`/login` 提供左右分屏的 B 端登录界面，包含账号和密码；管理端不提供注册、忘记密码或记住我入口。
- 登录表单校验通过后跳转到 `/dashboard`；静态阶段不发起登录请求、不保存 token、不做路由守卫。
- 新增 `/dashboard` 工作台占位页：展示数据概览、待处理事项空状态、静态统计卡片和后续模块入口，作为登录后的落地页。
- 调整 admin 根路由：`/` 重定向到 `/login`，未知路径回到 `/login`。
- 统一 admin 的绿色主题和中文界面文案，覆盖登录页与后续后台页面。
- 登录页和 dashboard 右上角提供亮/暗主题切换，选择持久化；宽屏使用全宽分栏，右侧登录抽屉贴住视口边缘；组件颜色交给 antd 算法，只保留绿色品牌 seed。
- **BREAKING（admin 路由）**：`/` 不再渲染旧的占位首页，改为重定向到 `/login`；web 与 bff 不受影响。
- 不修改 BFF 接口，不新增认证、token、持久化、路由守卫或共享包；不新增依赖。

## Capabilities

### New Capabilities

- `admin-login`: 管理端登录入口的展示、表单校验、静态提交跳转，以及登录后的 dashboard 占位落地行为。

### Modified Capabilities

无。

## Impact

- 影响 `apps/admin`：路由、页面、品牌标识、测试和 AGENTS/README 文档。
- 不修改 `apps/web`、`apps/bff`、`@repo/env`、`@repo/http-client` 或共享配置包；不修改 BFF 接口。
- 不新增运行时依赖；继续使用现有 antd 6、Tailwind 4、React Router 8 和 Zustand 5。
- 不新增环境变量或 env 文件；不修改 tsconfig、Vitest 配置、覆盖率 include 或 Turbo 输入。
- 静态阶段 `/dashboard` 可直接访问，真实认证与路由守卫留到后续 change。
