# web-api Specification

## Purpose

定义学生端访问 Spring 的统一 API 适配层，包括 base URL、服务端代理、响应信封、错误模型、认证头和 401 事件，使后续学生模块复用同一套请求行为。

## Requirements

### Requirement: API base 与服务端代理

The web SHALL use `API_BASE_URL` as the API base, defaulting to `/api/v1/`. Browser requests to `/api/*` SHALL be handled by the Nitro server route `server/api/[...path].ts`, which SHALL forward the method, query, body and headers to `SPRING_API_ORIGIN` with the `/api` prefix preserved, in both development and production. SSR data fetching SHALL call Spring directly. Spring SHALL NOT need CORS.

#### Scenario: 开发环境调用登录接口

- **WHEN** web 在开发环境请求 `auth/login`
- **THEN** 浏览器请求 `/api/v1/auth/login`，Nitro server/api 路由将其转发到 `SPRING_API_ORIGIN/api/v1/auth/login`

#### Scenario: 生产环境调用登录接口

- **WHEN** 生产环境的 Nitro 服务收到 `/api/v1/auth/login`
- **THEN** 它按相同路径转发到 Spring，不依赖额外的反向代理

#### Scenario: 未配置 API base

- **WHEN** 根环境文件没有定义 `API_BASE_URL`
- **THEN** web 仍以 `/api/v1/` 创建 API 客户端

#### Scenario: 相对请求路径

- **WHEN** web 以 `/api/v1/` 为 base URL 请求 `auth/login`
- **THEN** 实际请求地址为 `/api/v1/auth/login`，不会绕过 base URL 打到站点根路径

#### Scenario: 代理保留方法和请求体

- **WHEN** 浏览器提交 `POST /api/v1/auth/register` 和 JSON 请求体
- **THEN** Nitro 路由保留 POST 方法、请求体和认证头转发到 Spring

#### Scenario: SSR 期间取数

- **WHEN** 首页在服务端渲染时请求资料
- **THEN** Nuxt 服务端直接请求 `SPRING_API_ORIGIN/api/v1/profile`，并把结果写入首屏 HTML

#### Scenario: 代理目标来自进程环境

- **WHEN** 通过任务运行器启动 web 并在进程环境中设置 `SPRING_API_ORIGIN`
- **THEN** Nitro server/api 路由使用该地址，而不是回退到 `http://localhost:8080`

### Requirement: Spring 响应信封

The web SHALL parse the Spring envelope `{success, data, error}`. A successful response with non-null data SHALL return that data; `success=false` or a null data payload SHALL raise a business error carrying the envelope code and message. Void requests SHALL accept a null data payload.

#### Scenario: 成功响应

- **WHEN** Spring 返回 `{success:true, data:{...}, error:null}`
- **THEN** 调用方收到 `data` 对象

#### Scenario: 业务失败

- **WHEN** Spring 返回 `{success:false, data:null, error:{code,message}}`
- **THEN** 调用方收到带 `code` 和 `message` 的业务错误

#### Scenario: 无返回数据的操作

- **WHEN** 注销接口返回 `{success:true, data:null, error:null}`
- **THEN** 调用方把请求视为成功，不把 null data 当作错误

### Requirement: 业务错误与传输错误

The web SHALL expose a stable error object with `code`, `message` and optional HTTP `status`. It SHALL distinguish envelope business failures, HTTP 401/403/5xx, network failures and timeouts, and SHALL present Chinese messages for each transport failure.

#### Scenario: 非 2xx 且带业务信封

- **WHEN** Spring 返回 409 和 `{success:false,error:{code:"STUDENT_NUMBER_ALREADY_USED",message:"..."}}`
- **THEN** 错误对象保留状态码 409、业务码和中文消息

#### Scenario: 网络不可达

- **WHEN** 请求因网络故障失败
- **THEN** 错误对象使用 `NETWORK_ERROR` 和“无法连接后端服务，请稍后重试”

#### Scenario: 请求超时

- **WHEN** 请求超过客户端超时时间
- **THEN** 错误对象使用 `REQUEST_TIMEOUT` 和“请求超时，请稍后重试”

#### Scenario: 无信封的 5xx

- **WHEN** Spring 返回 5xx 且响应体不是业务信封
- **THEN** 错误对象使用通用上游错误码和服务端暂不可用提示

### Requirement: 认证头注入

The web SHALL attach `Authorization: Bearer <accessToken>` to `/api/v1/*` requests when a token exists, SHALL omit the header when anonymous, and SHALL NOT send the token to unconfigured third-party origins, URLs or logs.

#### Scenario: 已登录请求携带 Bearer

- **WHEN** 本地存在学生 accessToken 并请求业务接口
- **THEN** 请求头包含当前 token 的 Bearer 值

#### Scenario: 未登录请求不携带 Bearer

- **WHEN** 本地没有 accessToken 并请求公开接口
- **THEN** 请求不包含 Authorization 请求头

#### Scenario: 不向第三方源发送 token

- **WHEN** 请求目标不是配置的 API 源
- **THEN** 请求不携带当前 accessToken

### Requirement: 401 事件

The web SHALL clear the token and emit a single unauthorized event when a business request returns 401. Login, registration, verification-code and logout requests SHALL NOT emit session-expiry events. 403, 5xx, network and timeout failures SHALL NOT clear the token.

#### Scenario: 业务请求返回 401

- **WHEN** 已登录学生调用业务接口收到 401
- **THEN** 适配层清除 token 并触发一次未认证事件

#### Scenario: 登录请求返回 401

- **WHEN** 登录接口返回 401 `INVALID_CREDENTIALS`
- **THEN** 适配层不触发“登录已过期”事件，由登录页显示凭据错误

#### Scenario: 403 不清除登录态

- **WHEN** 业务接口返回 403
- **THEN** 适配层保留 token，仅把错误交给页面

### Requirement: 请求方法与请求体

The adapter SHALL support GET, POST and PUT requests with JSON bodies. Any 2xx response containing a valid envelope SHALL be treated as successful, including 201 and 202. Authentication POSTs SHALL NOT retry automatically, so a timeout cannot create a duplicate registration or code send.

#### Scenario: POST 登录

- **WHEN** 登录页提交邮箱和密码
- **THEN** 适配层发送 `POST /api/v1/auth/login` 和 JSON 请求体

#### Scenario: 认证 POST 不自动重试

- **WHEN** 登录、注册或发送验证码的 POST 请求超时或网络失败
- **THEN** 适配层直接把错误交给页面，不自动重发请求

#### Scenario: GET 当前账号

- **WHEN** 应用启动恢复会话
- **THEN** 适配层发送 `GET /api/v1/auth/me`

#### Scenario: 202 验证码响应

- **WHEN** 验证码接口返回 202 和成功信封
- **THEN** 适配层把响应作为成功结果交给注册页

### Requirement: 共享客户端边界

The web SHALL use the workspace shared HTTP client as the transport layer. Environment access, envelope parsing, authentication headers and 401 handling SHALL remain in the web adapter. The web SHALL NOT import code from another app.

#### Scenario: 使用共享客户端

- **WHEN** web 创建 API 客户端
- **THEN** 它把普通 base URL 传给工作区共享 HTTP 客户端，共享包内不存在环境变量读取代码

#### Scenario: 不跨应用导入

- **WHEN** web 需要认证、错误处理或页面结构
- **THEN** 它使用 web 本地模块或工作区包，不直接引用 `apps/admin` 的文件

### Requirement: 认证图片读取

The web SHALL load Spring file resources through an authenticated request that carries the current Bearer token, and SHALL return the raw binary content without parsing it as a JSON envelope. The token SHALL NOT appear in URLs, logs or third-party origins. A 401 SHALL follow the existing unauthorized handling, while a missing or unreadable file SHALL surface as an image failure without clearing the session.

#### Scenario: 读取品种封面

- **WHEN** 已登录学生打开带封面的品种
- **THEN** web 携带 Bearer 请求 `/api/v1/files/{id}`，把二进制内容交给图片画框渲染

#### Scenario: 未登录读取图片

- **WHEN** 请求图片时没有有效登录态并收到 401
- **THEN** 适配层按既有规则触发未认证处理，页面不渲染该图片

#### Scenario: 文件不存在

- **WHEN** 文件接口返回 404
- **THEN** 调用方收到图片失败结果，登录态保持不变，页面显示图片失败占位

#### Scenario: 令牌不进入 URL

- **WHEN** web 请求任何图片资源
- **THEN** accessToken 只出现在 Authorization 请求头，不出现在 URL、查询参数或第三方源

### Requirement: 图片上传

The web SHALL upload images as `multipart/form-data` to `POST /api/v1/files`, with the file in a field named `file`, carrying the current Bearer token, and SHALL use the returned `data.id` as the image file ID in later business requests. The web SHALL NOT set the multipart `Content-Type` header manually, SHALL NOT send the token in the URL, and SHALL treat student uploads as private images only.

#### Scenario: 上传成功

- **WHEN** 已登录学生上传一张合法图片
- **THEN** web 以 multipart 请求 `/api/v1/files` 并收到 `{success:true,data:{id,url,...}}`，调用方拿到文件 ID

#### Scenario: 未登录上传

- **WHEN** 没有有效登录态时请求上传并收到 401
- **THEN** 适配层按既有规则触发未认证处理，不把文件 ID 交给页面

#### Scenario: 文件过大

- **WHEN** 上传文件超过 5 MB 并收到 `INVALID_FILE_SIZE`
- **THEN** 页面显示“图片不能为空且不能超过 5 MB”，保留表单其他内容

#### Scenario: 不支持的格式

- **WHEN** 上传文件不是 JPG、PNG 或 WebP 并收到 `UNSUPPORTED_FILE_TYPE`
- **THEN** 页面显示“只支持 JPG、PNG 或 WebP 图片”

#### Scenario: 学生请求公开图片

- **WHEN** 学生上传时请求公开图片并收到 403 `PUBLIC_UPLOAD_ADMIN_ONLY`
- **THEN** 页面显示该错误，登录态保持不变

#### Scenario: 代理转发 multipart

- **WHEN** 浏览器向 `/api/v1/files` 提交 multipart 请求
- **THEN** Nitro 路由保留 POST 方法、multipart 请求体和认证头转发到 Spring，不解析或改写文件内容

#### Scenario: 令牌不进入 URL

- **WHEN** web 上传任何图片
- **THEN** accessToken 只出现在 Authorization 请求头，不出现在 URL、查询参数或第三方源
