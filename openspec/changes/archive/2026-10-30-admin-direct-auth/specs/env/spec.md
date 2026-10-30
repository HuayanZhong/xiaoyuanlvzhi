# Spec Delta

## ADDED Requirements

### Requirement: 管理端直连 Spring 的配置

admin SHALL 声明并校验 `API_BASE_URL` 与 `SPRING_API_ORIGIN`。`API_BASE_URL` 默认 SHALL 为 `/api/v1/`，`SPRING_API_ORIGIN` 默认 SHALL 为 `http://localhost:8080`。`.env.example` SHALL 记录这两个变量及默认值，SHALL NOT 再记录 BFF 的端口、会话或 CORS 变量。

#### Scenario: 本地开发使用默认值

- **WHEN** 没有环境文件启动 admin
- **THEN** admin 使用 `/api/v1/` 作为 API base，并把 `/api` 代理到 `http://localhost:8080`

#### Scenario: 模板记录配置项

- **WHEN** 查看提交的 `.env.example`
- **THEN** 文件列出 `API_BASE_URL` 与 `SPRING_API_ORIGIN`
- **AND** 文件不包含 `SESSION_SECRET`、`ADMIN_ORIGINS`、`BFF_COOKIE_SECURE` 或 `BFF_SESSION_DAYS`

#### Scenario: 生产同源部署

- **WHEN** admin 以相对 `/api/v1/` 构建并由与 Spring 同源的服务器托管
- **THEN** 浏览器请求保持同源，不需要 Spring 提供 CORS 响应头

### Requirement: 任务运行器环境变量传递

构建与启动任务在任务运行器中执行时 SHALL 能取得其声明依赖的环境变量，包括从进程环境传入的值。

#### Scenario: admin 代理目标从进程环境传入

- **WHEN** 通过任务运行器启动 admin 并在进程环境中设置 `SPRING_API_ORIGIN`
- **THEN** Vite 开发服务器把 `/api` 代理到该值，而不是回退到默认值

## MODIFIED Requirements

### Requirement: 根目录环境文件约定

仓库 SHALL 只提交 `.env.example` 作为模板；`.env`、`.env.<mode>` 与 `.local` 变体都只存在于本地。环境文件存在时按运行模式选择生效的那一个；不存在时应用 SHALL 以各应用 schema 声明的默认值运行。

#### Scenario: 按模式选择文件

- **WHEN** 以 `production` 模式启动或构建任一应用，且本地存在 `.env.production`
- **THEN** 配置来自 `.env.production` 与本地覆盖文件的合并结果
- **AND** `.env.development` 的内容不参与该次解析

#### Scenario: 未指定模式

- **WHEN** 脚本未指定模式
- **THEN** 按 `development` 处理

#### Scenario: 没有任何环境文件

- **WHEN** 新克隆仓库后直接启动应用
- **THEN** 应用以 schema 默认值运行，admin 与 web 分别监听 3000、4000

### Requirement: 共享 HTTP 客户端的环境无关性

`@repo/http-client` SHALL NOT 读取环境变量、环境文件或框架运行时配置。其 base URL SHALL 由调用方应用传入。

#### Scenario: 通过根环境提供 base URL

- **WHEN** admin 从根目录环境文件取得 API base URL 并创建 HTTP 客户端
- **THEN** 客户端使用该值，且共享包内不存在读取环境文件的代码

#### Scenario: 未配置时回退

- **WHEN** 根目录环境文件未定义 API base URL
- **THEN** admin 仍按 `/api/v1/` 创建客户端

## REMOVED Requirements

### Requirement: 任务运行时可见的环境变量

**Reason**: 原场景以 BFF 端口为例，BFF 已从工作区删除。

**Migration**: 由本 delta 新增的“任务运行器环境变量传递”取代，保留 Turbo 向任务传递环境变量的行为。
