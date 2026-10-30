# Spec Delta

## MODIFIED Requirements

### Requirement: 由调用方管理环境配置

共享包 SHALL NOT 读取环境变量、框架运行时配置或应用全局对象。调用方应用 SHALL 负责传入 base URL 以及其他由环境派生的请求配置。

#### Scenario: admin 环境适配层

- **WHEN** admin 应用创建客户端
- **THEN** 它从 `VITE_API_BASE_URL` 读取 base URL，并在未配置时回退到 `/api/v1/`
- **AND** 共享包内不存在直接读取环境变量的代码

#### Scenario: 未来根目录环境模块

- **WHEN** 根目录环境模块后续向所有应用提供类型化配置
- **THEN** 只需要修改 admin 适配层，共享 HTTP 客户端契约保持不变

### Requirement: admin 开发环境路由

开发环境下，admin SHALL 将 `/api/*` 请求原样转发到 `http://localhost:8080`，保留 `/api` 前缀，不经过 BFF。

#### Scenario: 通过代理访问健康检查

- **WHEN** admin 和 Spring 同时运行，admin 请求 `/api/v1/health`
- **THEN** Vite 开发服务器将请求转发到 `http://localhost:8080/api/v1/health`，并返回 Spring 响应

#### Scenario: 保留登录路径

- **WHEN** admin 请求 `/api/v1/auth/login`
- **THEN** Vite 开发服务器将请求转发到 `http://localhost:8080/api/v1/auth/login`
