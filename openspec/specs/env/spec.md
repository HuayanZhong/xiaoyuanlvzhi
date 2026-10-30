# env Specification

## Purpose

让工作区 admin 与 web 两个应用从同一套根目录环境文件读取配置，在启动或构建时按环境完成类型化校验，避免每个应用各自摸索环境变量的来源与格式。

## Requirements

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

### Requirement: 环境文件加载优先级

配置加载 SHALL 按由窄到宽的优先级合并，越具体的文件越优先：`.env.<mode>.local`、`.env.local`、`.env.<mode>`、`.env`。同名变量只取优先级最高的来源，后续来源 SHALL NOT 覆盖它。进程环境中已存在的变量 SHALL 优先于所有环境文件。

#### Scenario: 本地文件覆盖提交的环境文件

- **WHEN** `.env.development` 与 `.env.local` 都定义了 `API_BASE_URL`
- **THEN** 最终取值来自 `.env.local`

#### Scenario: 模式文件覆盖本地基础层

- **WHEN** `.env` 与 `.env.development` 都定义了 `WEB_PORT`
- **THEN** 最终取值来自 `.env.development`

#### Scenario: 进程环境优先

- **WHEN** shell 中已设置 `PORT`，且 `.env` 中也定义了 `PORT`
- **THEN** 最终取值来自 shell，环境文件不覆盖它

### Requirement: 版本控制的文件范围

仓库 SHALL 只提交 `.env.example`，并 SHALL NOT 提交 `.env`、`.env.<mode>`、`.env.local` 与 `.env.<mode>.local`，以免密钥随环境文件进入版本控制。

#### Scenario: 环境文件不被提交

- **WHEN** 在根目录创建 `.env`、`.env.development`、`.env.production` 或任一 `.local` 变体
- **THEN** 版本控制将这些文件视为未跟踪

#### Scenario: 新克隆仓库不含环境配置

- **WHEN** 新克隆仓库后查看根目录
- **THEN** 只有 `.env.example` 存在，`.env`、`.env.development` 与 `.env.production` 均不存在
- **AND** 应用仍能按 schema 默认值启动

### Requirement: 类型化校验与失败行为

配置解析 SHALL 在启动或构建阶段校验环境变量，并在校验失败时终止该过程。失败信息 SHALL 列出全部不合法变量的名称和原因，而不是只报第一个。

#### Scenario: 变量格式不合法

- **WHEN** 某个应用声明的环境变量不符合其声明的格式
- **THEN** 该应用的启动或构建以非零状态退出
- **AND** 输出包含每个不合法变量的名称和原因

#### Scenario: 缺失必需变量

- **WHEN** 某个应用声明为必需的环境变量在合并后的配置中不存在
- **THEN** 该应用不进入运行状态，并指出缺失的变量名

### Requirement: 应用各自声明环境变量

每个应用 SHALL 在自己的配置声明中定义其所需的环境变量及格式。共享配置包 SHALL NOT 认识任何业务变量名，只提供解析与校验能力。

#### Scenario: 共享包不绑定业务变量

- **WHEN** 向共享配置包新增一个消费应用
- **THEN** 只需在该应用内声明变量，共享包无需修改

#### Scenario: 应用间互不影响

- **WHEN** 一个应用声明的变量在另一个应用中缺失
- **THEN** 只有声明方因该校验失败而中止

### Requirement: 前端构建期注入

admin 与 web SHALL 在构建期把校验后的配置值写入各自的客户端可见配置通道，浏览器侧代码 SHALL 通过这些通道读取配置。

#### Scenario: admin 构建注入

- **WHEN** 以生产模式构建 admin，且根目录环境文件定义了 API base URL
- **THEN** 构建产物中嵌入该值，浏览器运行时读取到相同取值

#### Scenario: 共享包不进入浏览器产物

- **WHEN** admin 或 web 完成构建
- **THEN** 浏览器产物不包含环境文件加载相关的依赖代码

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

### Requirement: 共享 HTTP 客户端的环境无关性

`@repo/http-client` SHALL NOT 读取环境变量、环境文件或框架运行时配置。其 base URL SHALL 由调用方应用传入。

#### Scenario: 通过根环境提供 base URL

- **WHEN** admin 从根目录环境文件取得 API base URL 并创建 HTTP 客户端
- **THEN** 客户端使用该值，且共享包内不存在读取环境文件的代码

#### Scenario: 未配置时回退

- **WHEN** 根目录环境文件未定义 API base URL
- **THEN** admin 仍按 `/api/v1/` 创建客户端

### Requirement: 任务运行器环境变量传递

构建与启动任务在任务运行器中执行时 SHALL 能取得其声明依赖的环境变量，包括从进程环境传入的值。

#### Scenario: admin 代理目标从进程环境传入

- **WHEN** 通过任务运行器启动 admin 并在进程环境中设置 `SPRING_API_ORIGIN`
- **THEN** Vite 开发服务器把 `/api` 代理到该值，而不是回退到默认值

### Requirement: 任务缓存感知环境文件

构建任务的缓存哈希 SHALL 覆盖根目录环境文件，使其内容变化时相关任务不再命中旧缓存。

#### Scenario: 修改环境文件后重建

- **WHEN** 修改根目录某个环境文件后重新执行构建
- **THEN** 依赖该文件的任务重新执行，而不是复用缓存产物
