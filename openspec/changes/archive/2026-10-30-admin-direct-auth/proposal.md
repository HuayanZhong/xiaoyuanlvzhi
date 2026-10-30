# Proposal

## Why

管理端目前是静态登录，而 Spring 后端已经提供登录、当前账号和注销接口。为单后端、单管理端的场景引入完整 BFF 会话层，需要额外进程、会话存储和转发代码，收益不足以抵消复杂度。改为管理端直连 Spring，可以缩短链路并复用现有 HTTP 客户端。

## What Changes

- **BREAKING** 删除 `apps/bff` 整个应用，以及它的端口、环境变量、测试、构建产物和文档说明；工作区从三个应用变为两个。
- 管理端登录改为真实调用 Spring `POST /api/v1/auth/login`，浏览器侧持久化 accessToken；启动时通过 `GET /api/v1/auth/me` 恢复会话。
- 新增 `admin-auth` 能力：登录、会话恢复、退出、非管理员拒绝、路由守卫和任意请求 401 后的清理。
- 登录页移除静态演示提示和“密码至少 6 位”校验，改为展示真实登录错误并提交中禁用按钮。
- 登录成功、登录失败、登录过期和退出成功提供页面级消息提示。
- 后台壳账号菜单接入真实退出登录；受保护路由未登录时跳转 `/login` 并携带返回路径。
- 开发环境 Vite 将 `/api` 原样代理到 Spring `http://localhost:8080`；生产环境假定管理端与 Spring 同源反向代理，因此不要求 Spring 开启 CORS。
- 环境变量移除 `PORT`、`SPRING_API_BASE_URL`、`SESSION_SECRET`、`ADMIN_ORIGINS`、`BFF_COOKIE_SECURE`、`BFF_SESSION_DAYS`；新增 `SPRING_API_ORIGIN`；admin 的 API base 改为 `/api/v1/`。
- 不修改 Spring 后端接口；Spring 仍是最终认证和角色边界。

## Capabilities

### New Capabilities

- `admin-auth`: 管理端直接持有 Spring accessToken，负责登录、会话恢复、退出、角色校验和 401 处理。

### Modified Capabilities

- `admin-login`: 静态提交改为真实登录，更新表单校验、错误提示和 dashboard 访问行为。
- `admin-shell`: 账号菜单提供真实退出登录。
- `env`: 移除 BFF 变量和端口，新增 Spring origin。
- `http-client`: 开发代理目标从 BFF 改为 Spring，并保留 `/api` 前缀。

## Impact

- 受影响应用：`apps/admin`（新增认证层与页面行为）、`apps/bff`（删除）。
- 受影响配置：根目录 `.env.example`、`.env.development`、`.env.production`、`turbo.json`、`pnpm-lock.yaml`。
- 受影响文档与规格：`README.md`、`AGENTS.md`、`.github/PULL_REQUEST_TEMPLATE.md`、`openspec/config.yaml`，以及 `admin-login`、`admin-shell`、`env`、`http-client` 四个主规格。
- 不修改 Spring API，不修改共享包 `@repo/http-client` 的运行时契约。
