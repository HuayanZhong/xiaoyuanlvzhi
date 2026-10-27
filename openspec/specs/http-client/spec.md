# http-client Specification

## Purpose

提供共享且与环境无关的 HTTP 客户端，让工作区内各应用使用一致的请求配置和传输错误处理，避免重复实现。

## Requirements

### Requirement: 共享客户端工厂

工作区 SHALL 提供私有包 `@repo/http-client`，通过导出的工厂函数使用调用方配置创建客户端。工厂 SHALL 要求传入 base URL，并返回一个将相对请求路径解析到该 base URL 的客户端。

#### Scenario: 相对请求路径

- **WHEN** 调用方使用 base URL `/api/` 创建客户端并请求 `health`
- **THEN** 实际请求地址为 `/api/health`

#### Scenario: 末尾斜杠归一化

- **WHEN** 调用方传入不带末尾斜杠的 `/api`
- **THEN** 客户端按 `/api/` 处理，并将 `health` 解析为 `/api/health`

### Requirement: 可覆盖的请求默认值

客户端 SHALL 默认使用 15 秒超时和最多两次重试。调用方 SHALL 能在客户端级或单次请求级覆盖超时、重试策略、headers、hooks 以及其他请求选项。

#### Scenario: 调用方覆盖默认值

- **WHEN** 调用方使用自定义超时或重试次数创建客户端
- **THEN** 请求使用调用方提供的值，而不是默认值

#### Scenario: 保留默认值

- **WHEN** 调用方创建客户端时没有传入超时或重试选项
- **THEN** 请求使用 15 秒超时和两次重试的默认配置

### Requirement: 传输错误传播

客户端 SHALL 将非 2xx 响应作为错误抛出，并暴露响应状态和已解析的响应数据。网络故障、超时和 HTTP 故障 SHALL 可被调用方区分，且调用方无需直接依赖底层 HTTP 库。

#### Scenario: HTTP 错误

- **WHEN** 服务端返回 404 响应和 JSON 响应体
- **THEN** 请求以错误拒绝，错误暴露状态码 404 和已解析的响应体

#### Scenario: 超时或网络故障

- **WHEN** 请求在收到响应前超时或网络失败
- **THEN** 拒绝原因标识为超时或网络错误，而不是 HTTP 错误

### Requirement: 由调用方管理环境配置

共享包 SHALL NOT 读取环境变量、框架运行时配置或应用全局对象。调用方应用 SHALL 负责传入 base URL 以及其他由环境派生的请求配置。

#### Scenario: admin 环境适配层

- **WHEN** admin 应用创建客户端
- **THEN** 它从 `VITE_API_BASE_URL` 读取 base URL，并在未配置时回退到 `/api/`
- **AND** 共享包内不存在直接读取环境变量的代码

#### Scenario: 未来根目录环境模块

- **WHEN** 根目录环境模块后续向所有应用提供类型化配置
- **THEN** 只需要修改 admin 适配层，共享 HTTP 客户端契约保持不变

### Requirement: admin 开发环境路由

开发环境下，admin SHALL 将 `/api/*` 请求转发到 `http://localhost:5000`，并在转发前去掉 `/api` 前缀。

#### Scenario: 通过代理访问健康检查

- **WHEN** admin 和 BFF 同时运行，admin 请求 `/api/health`
- **THEN** Vite 开发服务器将请求转发到 `http://localhost:5000/health`，并返回 BFF 响应

### Requirement: 不假设业务响应包络

客户端 SHALL 按调用方要求返回成功响应体，不假设存在业务响应包络。客户端 SHALL NOT 增加认证、持久化或领域 API 行为。

#### Scenario: 调用方解析响应体

- **WHEN** 调用方对成功响应调用带类型参数的 JSON 响应方法
- **THEN** 方法返回按指定类型解析后的响应体
- **AND** 不会自动解包 `{ code, data, message }`
