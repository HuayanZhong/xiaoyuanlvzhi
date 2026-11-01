# Spec Delta

## ADDED Requirements

### Requirement: 学生端直连 Spring 的配置

web SHALL 声明并校验 `API_BASE_URL` 与 `SPRING_API_ORIGIN`。`API_BASE_URL` 默认 SHALL 为 `/api/v1/`，`SPRING_API_ORIGIN` 默认 SHALL 为 `http://localhost:8080`，且 SHALL 只接受不带路径、查询或片段的源地址；末尾斜杠 SHALL 被归一化。开发和生产的 Nitro `server/api` 路由 SHALL 把浏览器 `/api` 请求代理到 Spring 并保留前缀；SSR 取数 SHALL 直接访问 Spring。

#### Scenario: 本地开发使用默认值

- **WHEN** 没有环境文件启动 web
- **THEN** web 使用 `/api/v1/` 作为 API base，并由 Nitro 路由把 `/api` 转发到 `http://localhost:8080`

#### Scenario: 代理目标包含路径

- **WHEN** `SPRING_API_ORIGIN` 配置为 `http://localhost:8080/api` 或其他带路径/查询的 URL
- **THEN** web 配置校验失败并指出 `SPRING_API_ORIGIN`，不启动 web 服务

#### Scenario: 模板记录配置项

- **WHEN** 查看提交的 `.env.example`
- **THEN** 文件说明 `API_BASE_URL` 与 `SPRING_API_ORIGIN` 同时供 admin 和 web 使用

#### Scenario: 生产同源部署

- **WHEN** web 以相对 `/api/v1/` 构建并由 Nitro 服务托管
- **THEN** 浏览器请求保持同源，由 Nitro `server/api` 路由转发到 Spring，不需要 Spring 提供 CORS 响应头

## MODIFIED Requirements

### Requirement: 前端构建期注入

admin 与 web SHALL 在构建期把校验后的配置值写入各自的客户端可见配置通道，浏览器侧代码 SHALL 通过这些通道读取配置。

#### Scenario: admin 构建注入

- **WHEN** 以生产模式构建 admin，且根目录环境文件定义了 API base URL
- **THEN** 构建产物中嵌入该值，浏览器运行时读取到相同取值

#### Scenario: web 构建注入

- **WHEN** 以生产模式构建 web，且根目录环境文件定义了 API base URL
- **THEN** 构建产物中嵌入该值，浏览器运行时读取到相同取值

#### Scenario: 共享包不进入浏览器产物

- **WHEN** admin 或 web 完成构建
- **THEN** 浏览器产物不包含环境文件加载相关的依赖代码

### Requirement: 任务运行器环境变量传递

构建与启动任务在任务运行器中执行时 SHALL 能取得其声明依赖的环境变量，包括从进程环境传入的值。

#### Scenario: admin 代理目标从进程环境传入

- **WHEN** 通过任务运行器启动 admin 并在进程环境中设置 `SPRING_API_ORIGIN`
- **THEN** Vite 开发服务器把 `/api` 代理到该值，而不是回退到默认值

#### Scenario: web 代理目标从进程环境传入

- **WHEN** 通过任务运行器启动 web 并在进程环境中设置 `SPRING_API_ORIGIN`
- **THEN** Nitro `server/api` 路由把 `/api` 转发到该值，而不是回退到默认值
