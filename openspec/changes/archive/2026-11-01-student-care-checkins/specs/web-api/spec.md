# Spec Delta

## ADDED Requirements

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
