# Spec Delta

## Purpose

定义管理端直接持有 Spring accessToken 的登录态：登录、刷新恢复、路由守卫、401 处理和退出，不依赖 BFF 会话。

## ADDED Requirements

### Requirement: 登录态持久化

admin SHALL 在登录成功后把 Spring `accessToken` 保存到同源 `localStorage`，用于刷新页面和重开浏览器后的会话恢复。当前管理员账号 SHALL 只保存在运行时状态，并在启动时通过 `/auth/me` 重新取得。admin SHALL NOT 保存密码，SHALL NOT 持久化其他凭据。

#### Scenario: 登录成功保存登录态

- **WHEN** 管理员登录成功且账号角色为 `ADMIN`
- **THEN** admin 把 accessToken 写入同源 localStorage

#### Scenario: 刷新后仍保持登录

- **WHEN** 已登录管理员刷新页面
- **THEN** admin 从 localStorage 读取 accessToken，并通过 `/auth/me` 重新取得账号

#### Scenario: 不保存密码

- **WHEN** 登录完成
- **THEN** localStorage、sessionStorage 和 URL 中都不存在密码

### Requirement: 启动会话恢复

admin SHALL 在应用启动时读取本地 accessToken。没有 token 时 SHALL 进入未登录状态且不调用 `/auth/me`；有 token 时 SHALL 调用 `GET /api/v1/auth/me`：返回 200 且角色为 `ADMIN` 时保存账号并渲染目标页面，返回 401 时清除登录态，网络错误或 5xx 时显示可重试错误且不清除登录态。校验完成前 SHALL 显示加载状态，不得渲染受保护内容。

#### Scenario: 有效 token 恢复

- **WHEN** 本地存在有效 accessToken 并启动 admin
- **THEN** `/auth/me` 返回 200，admin 保存账号并渲染目标页面

#### Scenario: 没有 token

- **WHEN** 本地没有 accessToken 并启动 admin
- **THEN** admin 直接进入未登录状态，不调用 `/auth/me`

#### Scenario: token 失效

- **WHEN** `/auth/me` 返回 401
- **THEN** admin 清除 accessToken 和账号，并显示登录页

#### Scenario: 校验时后端不可用

- **WHEN** `/auth/me` 因网络错误或 5xx 失败
- **THEN** admin 显示可重试的错误状态，不清除 accessToken

#### Scenario: 校验期间不渲染受保护内容

- **WHEN** `/auth/me` 尚未返回
- **THEN** admin 显示加载状态，不渲染后台壳内容

### Requirement: 登录与回跳

登录表单 SHALL 以 `POST /api/v1/auth/login` 提交 `{ email, password }`。登录成功且响应账号角色为 `ADMIN` 时 SHALL 保存 accessToken 和账号，并导航到登录前的内部路径，缺省为 `/dashboard`。凭据错误、账号禁用、网络错误或非管理员账号 SHALL 显示中文错误并停留在 `/login`；非管理员账号 SHALL 同时尽力调用 `POST /api/v1/auth/logout` 注销该 token。提交期间 SHALL 禁用重复提交。

#### Scenario: 登录成功并回到原路径

- **WHEN** 未登录用户从 `/plants/instances` 被引导到登录页并成功登录
- **THEN** admin 保存登录态并导航回 `/plants/instances`

#### Scenario: 登录成功无原路径

- **WHEN** 用户直接访问 `/login` 并成功登录
- **THEN** admin 导航到 `/dashboard`

#### Scenario: 凭据错误

- **WHEN** Spring 返回 401 `INVALID_CREDENTIALS`
- **THEN** 登录页显示“邮箱或密码错误”，路由保持 `/login`

#### Scenario: 账号禁用

- **WHEN** Spring 返回 403 `ACCOUNT_DISABLED`
- **THEN** 登录页显示“账号已被禁用”，路由保持 `/login`

#### Scenario: 非管理员账号

- **WHEN** 登录响应返回 200，但账号角色不是 `ADMIN`
- **THEN** admin 尽力注销该 token，显示“仅管理员账号可登录管理后台”，不保存登录态

#### Scenario: 后端不可用

- **WHEN** 登录请求因网络错误或 5xx 失败
- **THEN** 登录页显示中文错误，路由保持 `/login`

#### Scenario: 提交期间重复点击

- **WHEN** 登录请求尚未完成
- **THEN** 登录按钮显示 loading，不发起第二次请求

### Requirement: 业务路由守卫

admin SHALL 保护后台壳下的所有业务路由。未登录访问业务路由时 SHALL 重定向到 `/login` 并把原始内部路径写入 `returnTo`；已登录访问 `/login` 时 SHALL 重定向到 `/dashboard`。`returnTo` SHALL 只接受以单个 `/` 开头的站内路径，外部 URL 和以 `//` 开头的路径 SHALL 被忽略并回退到 `/dashboard`。

#### Scenario: 未登录访问业务路由

- **WHEN** 没有登录态的用户访问 `/dashboard`
- **THEN** admin 重定向到 `/login`，并保留 `/dashboard` 作为登录后的回跳目标

#### Scenario: 已登录访问登录页

- **WHEN** 已有登录态的用户访问 `/login`
- **THEN** admin 重定向到 `/dashboard`

#### Scenario: 拒绝外部回跳

- **WHEN** `returnTo` 是 `https://example.test` 或以 `//` 开头的路径
- **THEN** admin 忽略该值并导航到 `/dashboard`

### Requirement: 未认证响应处理

任一 admin API 收到 401 时 SHALL 清除本地 accessToken 和账号、显示“登录已过期，请重新登录”提示，并让路由守卫回到 `/login`。收到 403、5xx 或网络错误时 SHALL NOT 自动清除登录态。

#### Scenario: 业务请求返回 401

- **WHEN** 已登录用户调用任一 admin API 收到 401
- **THEN** admin 清除登录态、显示“登录已过期，请重新登录”提示，并重定向到 `/login`

#### Scenario: 业务请求返回 403

- **WHEN** 已登录用户收到 403
- **THEN** admin 保留登录态并显示错误，不自动退出

#### Scenario: 后端不可达

- **WHEN** 请求因网络错误或 5xx 失败
- **THEN** admin 保留登录态并显示可重试的错误

### Requirement: 请求认证头

admin SHALL 在所有 `/api/v1/*` 业务请求上附加 `Authorization: Bearer <accessToken>`。没有登录态时 SHALL NOT 附加该请求头；SHALL NOT 把 token 发送到未配置的第三方源。

#### Scenario: 已登录请求携带 Bearer

- **WHEN** 已登录管理员请求任一业务接口
- **THEN** 请求包含当前 accessToken 的 Bearer 请求头

#### Scenario: 未登录请求不携带 Bearer

- **WHEN** 没有登录态时请求公开接口
- **THEN** 请求不包含 Authorization 请求头

#### Scenario: 不向第三方源发送 token

- **WHEN** admin 请求非配置的 API 源
- **THEN** 请求不包含当前 accessToken

### Requirement: 退出登录

退出登录 SHALL 尽力调用 `POST /api/v1/auth/logout` 并携带当前 Bearer token。无论该请求成功与否，admin SHALL 清除本地 accessToken 和账号并导航到 `/login`；注销请求失败时 SHALL 提示服务端令牌可能仍未失效。

#### Scenario: 退出成功

- **WHEN** 管理员点击退出登录且 Spring 返回 2xx
- **THEN** admin 清除登录态并导航到 `/login`，刷新后仍停留在登录页

#### Scenario: 注销接口不可达

- **WHEN** Spring 注销接口因网络错误或 5xx 失败
- **THEN** admin 仍清除本地登录态并导航到 `/login`，同时提示服务端令牌可能仍未失效

### Requirement: 管理员角色校验

admin SHALL 只把 `role` 为 `ADMIN` 的账号视为已登录。登录响应或 `/auth/me` 返回其他角色时 SHALL 清除登录态并停留在登录页。该检查仅用于客户端体验，Spring 对 `/api/v1/admin/**` 的角色校验仍是权限边界。

#### Scenario: 非管理员登录响应

- **WHEN** 登录响应返回 `role` 不是 `ADMIN` 的账号
- **THEN** admin 不保存登录态并显示管理员登录页

#### Scenario: 非管理员 /me 响应

- **WHEN** `/auth/me` 返回 `role` 不是 `ADMIN` 的账号
- **THEN** admin 清除登录态并显示登录页
