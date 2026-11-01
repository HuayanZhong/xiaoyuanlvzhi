# Spec Delta

## MODIFIED Requirements

### Requirement: 由调用方管理环境配置

共享包 SHALL NOT 读取环境变量、框架运行时配置或应用全局对象。调用方应用 SHALL 负责传入 base URL 以及其他由环境派生的请求配置。

#### Scenario: admin 环境适配层

- **WHEN** admin 应用创建客户端
- **THEN** 它从 `VITE_API_BASE_URL` 读取 base URL，并在未配置时回退到 `/api/v1/`
- **AND** 共享包内不存在直接读取环境变量的代码

#### Scenario: web 环境适配层

- **WHEN** web 应用创建客户端
- **THEN** 它从应用可见的公共运行时配置读取 API base URL，并在未配置时回退到 `/api/v1/`
- **AND** 共享包内不存在直接读取环境变量的代码

#### Scenario: 未来根目录环境模块

- **WHEN** 根目录环境模块后续向所有应用提供类型化配置
- **THEN** 只需要修改各应用适配层，共享 HTTP 客户端契约保持不变

### Requirement: 不假设业务响应包络

客户端 SHALL 按调用方要求返回成功响应体，不假设存在业务响应包络。客户端 SHALL NOT 增加认证、持久化或领域 API 行为。

#### Scenario: 调用方解析响应体

- **WHEN** 调用方对成功响应调用带类型参数的 JSON 响应方法
- **THEN** 方法返回按指定类型解析后的响应体
- **AND** 不会自动解包 Spring 的 `{ success, data, error }` 或其他业务包络
