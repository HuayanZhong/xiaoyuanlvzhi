# Spec Delta

## ADDED Requirements

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
