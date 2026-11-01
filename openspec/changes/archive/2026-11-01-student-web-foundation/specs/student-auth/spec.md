# Spec Delta

## Purpose

定义学生通过 QQ 邮箱注册和登录、恢复会话、访问受保护页面和退出的完整认证行为，并明确学生角色与账号状态的边界。

## ADDED Requirements

### Requirement: QQ 邮箱注册

`POST /api/v1/auth/register` SHALL accept a QQ email, 6-digit verification code, password, and required fullName/studentNumber/department/className/phone, and SHALL return 201 with an access token and a STUDENT account. The web SHALL store the token and enter the authenticated home.

#### Scenario: 成功注册并自动登录

- **WHEN** 学生提交唯一的 QQ 邮箱、有效验证码、合规密码和完整资料
- **THEN** Spring 返回 201 和 `AuthResult`，账号角色为 `STUDENT`
- **AND** web 保存 accessToken 并进入首页

#### Scenario: 缺少必填资料

- **WHEN** 注册请求缺少姓名、学号、院系、班级或手机号
- **THEN** Spring 返回 400 `INVALID_REQUEST`，不创建账号和会话

#### Scenario: 邮箱、密码或手机号格式不合规

- **WHEN** 邮箱格式不合法或超过 254 字符、密码不在 6–20 位，或手机号不符合中国大陆手机号格式
- **THEN** Spring 返回 400 `INVALID_REQUEST`，不创建账号和会话

#### Scenario: 注册时使用非 QQ 邮箱

- **WHEN** 学生提交格式合法但不是 `@qq.com` 的邮箱
- **THEN** Spring 返回 400 `QQ_EMAIL_REQUIRED`，不创建账号和会话

### Requirement: 注册唯一性约束

Registration SHALL reject an email, student number, or phone that already belongs to another account, returning 409 with a distinct error code. A database uniqueness race SHALL also return 409 rather than 500.

#### Scenario: 邮箱已注册

- **WHEN** 注册邮箱已被其他账号使用
- **THEN** Spring 返回 409 `EMAIL_ALREADY_REGISTERED`

#### Scenario: 学号已注册

- **WHEN** 学号已被其他账号使用
- **THEN** Spring 返回 409 `STUDENT_NUMBER_ALREADY_USED`

#### Scenario: 手机号已绑定

- **WHEN** 手机号已绑定其他账号
- **THEN** Spring 返回 409 `PHONE_ALREADY_USED`

#### Scenario: 并发注册触发唯一索引

- **WHEN** 两个注册请求同时通过预检查并触发数据库唯一约束
- **THEN** Spring 返回 409 `DATA_CONFLICT`，不返回 500

#### Scenario: 验证码优先于学号和手机号冲突

- **WHEN** 学号或手机号已被占用，但提交的验证码无效或已过期
- **THEN** Spring 返回验证码错误（400 `CODE_INVALID`/`CODE_EXPIRED`），不提前暴露学号或手机号是否存在

#### Scenario: 邮箱重复优先于验证码

- **WHEN** 邮箱已注册且提交的验证码无效
- **THEN** Spring 按现有行为返回 409 `EMAIL_ALREADY_REGISTERED`，不消费验证码

### Requirement: 注册资料完整性

`PUT /api/v1/profile` SHALL treat an omitted phone as keep-current and SHALL reject an empty or blank phone with 400. A student SHALL NOT be able to clear the required phone after registration.

#### Scenario: 清空手机号

- **WHEN** 学生通过资料接口提交空字符串手机号
- **THEN** Spring 返回 400 `INVALID_REQUEST`，原手机号保持不变

#### Scenario: 省略手机号

- **WHEN** 资料请求省略 phone 字段
- **THEN** Spring 保留当前手机号

#### Scenario: 修改手机号

- **WHEN** 学生提交格式正确且未被其他账号使用的手机号
- **THEN** Spring 更新手机号并返回最新资料

#### Scenario: 手机号已被使用

- **WHEN** 学生提交已被其他账号绑定的手机号
- **THEN** Spring 返回 409 `PHONE_ALREADY_USED`，原手机号保持不变

### Requirement: 注册验证码发送

`POST /api/v1/auth/email-code/registration` SHALL accept a QQ email, return 202 with `sent`, `expiresInSeconds` and `resendAfterSeconds`, and enforce the documented resend cooldown and mail errors.

#### Scenario: 验证码发送成功

- **WHEN** 学生提交尚未注册的 QQ 邮箱
- **THEN** Spring 返回 202，验证码有效期为 300 秒，重发等待为 60 秒

#### Scenario: 非 QQ 邮箱

- **WHEN** 学生提交非 `@qq.com` 邮箱
- **THEN** Spring 返回 400 `QQ_EMAIL_REQUIRED`

#### Scenario: 邮箱已注册

- **WHEN** 学生提交已注册邮箱
- **THEN** Spring 返回 409 `EMAIL_ALREADY_REGISTERED`

#### Scenario: 重发过于频繁

- **WHEN** 学生在 60 秒内重复获取验证码
- **THEN** Spring 返回 429 `CODE_RESEND_TOO_SOON`

#### Scenario: 邮件服务未配置

- **WHEN** 后端未配置 QQ SMTP 发件账号或授权码
- **THEN** Spring 返回 503 `MAIL_NOT_CONFIGURED`，web 显示可理解的提示

#### Scenario: 邮件发送失败

- **WHEN** SMTP 认证失败、连接失败或发送超时
- **THEN** Spring 返回 503 `MAIL_SEND_FAILED`，不保留未发送成功的验证码记录
- **AND** web 显示可重试的邮件发送失败提示，不退化为通用 500

### Requirement: 注册验证码校验

Registration SHALL require a valid, unexpired, unconsumed verification code. Each wrong attempt SHALL increment the failure count, and a code SHALL be rejected after five failures.

#### Scenario: 未获取验证码

- **WHEN** 学生直接提交注册且没有有效验证码记录
- **THEN** Spring 返回 400 `CODE_REQUIRED`

#### Scenario: 验证码过期或已使用

- **WHEN** 学生提交已过期或已消费的验证码
- **THEN** Spring 返回 400 `CODE_EXPIRED`

#### Scenario: 验证码错误

- **WHEN** 学生提交错误的 6 位验证码
- **THEN** Spring 返回 400 `CODE_INVALID`，并记录一次失败尝试

#### Scenario: 错误次数超限

- **WHEN** 同一验证码累计失败 5 次后再次提交
- **THEN** Spring 返回 429 `CODE_ATTEMPTS_EXCEEDED`，要求重新获取验证码

### Requirement: 邮箱登录

`POST /api/v1/auth/login` SHALL accept `{email, password}` and return 200 with an access token and account for an active student. Invalid credentials SHALL return 401, and disabled accounts SHALL return 403. The existing bare `admin` login SHALL remain supported.

#### Scenario: 学生登录成功

- **WHEN** 学生提交正确的邮箱和密码
- **THEN** Spring 返回 200 和 `AuthResult`，账号角色为 `STUDENT`，状态为 `ACTIVE`

#### Scenario: 邮箱或密码错误

- **WHEN** 学生提交不存在的邮箱或错误密码
- **THEN** Spring 返回 401 `INVALID_CREDENTIALS`，不暴露账号是否存在

#### Scenario: 账号被禁用

- **WHEN** 已禁用学生提交正确密码
- **THEN** Spring 返回 403 `ACCOUNT_DISABLED`，web 显示“账号暂不可用，请联系管理员”

#### Scenario: 管理员登录保持可用

- **WHEN** 管理员在 admin 应用使用默认种子账号输入 `admin` 和正确密码
- **THEN** Spring 返回 200 和 `ADMIN` 账号，admin 登录流程不变
- **AND** 若部署配置了自定义 `INITIAL_ADMIN_EMAIL`，管理员使用完整邮箱登录；裸 `admin` 只对应默认种子

### Requirement: 学生角色与账号状态

The web SHALL treat only `role=STUDENT` and `status=ACTIVE` as an authenticated student. Any other role or status SHALL clear the local token and remain anonymous. Spring SHALL remain the final authorization boundary.

#### Scenario: 学生端收到管理员账号

- **WHEN** 登录响应或 `/api/v1/auth/me` 返回 `role=ADMIN`
- **THEN** web 不把该 token 写入登录 Cookie，使用该 token 尽力注销，清除本地登录态，并显示“仅学生账号可登录学生端”

#### Scenario: 学生账号被禁用

- **WHEN** 已登录学生的账号被管理员禁用，后续 `/api/v1/auth/me` 或业务请求返回 401
- **THEN** web 清除本地登录态并回到登录页，按会话失效提示处理
- **AND** “账号暂不可用，请联系管理员”只在登录返回 403 `ACCOUNT_DISABLED` 时显示

#### Scenario: 管理接口仍受角色保护

- **WHEN** 学生 token 请求 `/api/v1/admin/**`
- **THEN** Spring 返回 403，管理端权限边界不因学生端上线而改变

### Requirement: 登录态持久化

The web SHALL persist only the accessToken in the same-origin `student-auth-token` cookie (`Path=/`, `SameSite=Lax`, 7-day `Max-Age`, `Secure` on HTTPS). The current account SHALL remain runtime state and be re-fetched through `/api/v1/auth/me`; passwords and other credentials SHALL NOT be persisted.

#### Scenario: 登录成功保存 token

- **WHEN** 学生登录或注册成功
- **THEN** web 把 accessToken 写入同源 `student-auth-token` Cookie

#### Scenario: 不持久化账号和密码

- **WHEN** 登录完成并刷新页面
- **THEN** 同源 Cookie 中只有学生 accessToken，没有密码或账号对象

#### Scenario: 服务端读取 token

- **WHEN** 浏览器携带 `student-auth-token` Cookie 首次请求受保护页面
- **THEN** Nuxt 服务端从请求 Cookie 读取 token 并完成会话校验

#### Scenario: 不在 URL 或日志中暴露 token

- **WHEN** web 发起认证或业务请求
- **THEN** accessToken 只出现在 Authorization 请求头中，不出现在 URL、页面文本或控制台日志中

### Requirement: 启动会话恢复

The web SHALL restore the session on startup. Without a token it SHALL become anonymous without calling `/auth/me`; with a token it SHALL call `/auth/me`. A 401 SHALL clear the token; network or 5xx failures SHALL keep the token and show a retryable error; protected content SHALL NOT render while checking.

#### Scenario: 没有本地 token

- **WHEN** 学生首次打开 web 且同源 Cookie 中没有 token
- **THEN** web 直接进入未登录状态，不调用 `/auth/me`

#### Scenario: 有效 token 恢复

- **WHEN** 本地 token 有效且 `/auth/me` 返回 200 的 ACTIVE STUDENT
- **THEN** web 进入已登录状态并渲染目标页面

#### Scenario: SSR 直接打开受保护页面

- **WHEN** 已登录学生直接访问或刷新 `/` 或 `/me`
- **THEN** Nuxt 服务端在返回 HTML 前用 Cookie 中的 token 完成 `/auth/me` 校验并渲染目标页面，不先返回登录页

#### Scenario: token 失效

- **WHEN** `/auth/me` 返回 401
- **THEN** web 清除 token 并显示登录页

#### Scenario: 恢复时后端不可用

- **WHEN** `/auth/me` 因网络错误或 5xx 失败
- **THEN** web 显示可重试错误，保留 token，不清除登录态

#### Scenario: 校验期间不渲染受保护内容

- **WHEN** 会话恢复尚未完成
- **THEN** web 显示加载状态，不渲染首页或“我的”内容

#### Scenario: 恢复期间退出或清理

- **WHEN** `/auth/me` 请求尚未返回时学生退出登录或清除登录态
- **THEN** 迟到的成功响应不得重新建立已登录状态

### Requirement: 路由守卫与回跳

The web SHALL treat `/login` and `/register` as public and `/` and `/me` as protected. Unauthenticated access to a protected route SHALL redirect to `/login` with the original path in `returnTo`; authenticated access to an auth page SHALL redirect to `/`. `returnTo` SHALL only accept internal paths starting with a single `/`.

#### Scenario: 未登录访问受保护页面

- **WHEN** 未登录学生访问 `/me`
- **THEN** web 重定向到 `/login?returnTo=%2Fme`

#### Scenario: 登录后回到原路径

- **WHEN** 学生从 `/me` 被引导到登录页并成功登录
- **THEN** web 导航回 `/me`

#### Scenario: 已登录访问登录页

- **WHEN** 已登录学生访问 `/login` 或 `/register`
- **THEN** web 重定向到 `/`

#### Scenario: 拒绝外部回跳

- **WHEN** `returnTo` 是 `https://example.test` 或以 `//` 开头的路径
- **THEN** web 忽略该值并导航到 `/`

#### Scenario: 回跳到认证页或重复参数

- **WHEN** `returnTo` 指向 `/login`、`/register`，或查询参数中出现多个 `returnTo`
- **THEN** web 只接受一个合法的站内业务路径，否则回退到 `/`，避免重定向循环

#### Scenario: 未知路径

- **WHEN** 学生访问未注册路径
- **THEN** web 显示带返回首页或登录入口的 404 页面，不显示空白页

### Requirement: 未认证响应处理

Any business API receiving 401 SHALL clear the local token, show “登录已过期，请重新登录”, and navigate to the login page. 403, 5xx, network and timeout failures SHALL NOT clear the session. Login, registration, verification-code and logout failures SHALL NOT be reported as session expiry.

#### Scenario: 业务请求返回 401

- **WHEN** 已登录学生调用任意业务接口收到 401
- **THEN** web 清除 token、提示登录过期并跳转登录页

#### Scenario: 业务请求返回 403

- **WHEN** 已登录学生收到 403
- **THEN** web 保留登录态并在当前页面显示错误

#### Scenario: 业务请求网络失败

- **WHEN** 请求因网络错误、超时或 5xx 失败
- **THEN** web 保留登录态并显示可重试错误

#### Scenario: 公开页面上的后台请求返回 401

- **WHEN** 公开页面上的后台请求收到 401
- **THEN** web 清除本地登录态，但不强制跳转登录页

#### Scenario: 登录失败不触发会话过期

- **WHEN** 登录请求返回 401 `INVALID_CREDENTIALS`
- **THEN** web 显示“邮箱或密码错误”，不显示“登录已过期”

### Requirement: 退出登录

The web SHALL best-effort call `POST /api/v1/auth/logout` with the current Bearer token. Regardless of the result, it SHALL clear the local token and account and navigate to `/login`; if revocation fails, it SHALL warn that the server token may still be valid.

#### Scenario: 退出成功

- **WHEN** 学生点击退出登录且注销接口返回 2xx
- **THEN** web 清除本地登录态并导航到 `/login`

#### Scenario: 注销时 token 已失效

- **WHEN** 注销接口返回 401
- **THEN** web 把该 token 视为已注销，清除本地登录态并导航到 `/login`，不显示“令牌可能仍未失效”的警告

#### Scenario: 注销接口不可达

- **WHEN** 注销请求因网络错误或 5xx 失败
- **THEN** web 仍清除本地登录态并导航到 `/login`，同时提示服务端令牌可能仍未失效

### Requirement: 登录表单行为

The login form SHALL submit email and password, validate both before submission, show inline errors for empty or invalid values, disable duplicate submission, and link to registration. It SHALL state that forgotten passwords require administrator contact.

#### Scenario: 空字段

- **WHEN** 学生未填写邮箱或密码就提交
- **THEN** 表单显示就地错误，不发起登录请求

#### Scenario: 提交期间重复点击

- **WHEN** 登录请求尚未完成
- **THEN** 登录按钮显示加载状态，不发起第二次请求

#### Scenario: 忘记密码

- **WHEN** 学生查看登录页
- **THEN** 页面提示联系管理员重置密码，不提供自助找回入口

### Requirement: 注册表单行为

The registration form SHALL collect QQ email, verification code, password, password confirmation, fullName, studentNumber, department, className and phone. It SHALL require password confirmation to match, send and resend the email code with a countdown, and auto-login after successful registration.

#### Scenario: 密码确认不一致

- **WHEN** 学生输入的确认密码与登录密码不同
- **THEN** 表单显示就地错误，不发起注册请求

#### Scenario: 发送验证码倒计时

- **WHEN** 验证码发送成功
- **THEN** 发送按钮按服务端返回的等待时间禁用并显示倒计时，结束后允许重发

#### Scenario: 重发冷却中再次点击

- **WHEN** 发送验证码返回 429 `CODE_RESEND_TOO_SOON`
- **THEN** 发送按钮按其默认冷却时间重新开始倒计时，不发起连续请求

#### Scenario: 注册失败保留资料

- **WHEN** 注册请求因验证码、唯一性冲突或网络错误失败
- **THEN** 表单保留邮箱和资料字段，只清空或聚焦需要修正的字段

#### Scenario: 邮箱已注册

- **WHEN** 注册或发送验证码返回 409 `EMAIL_ALREADY_REGISTERED`
- **THEN** 页面提示“这个邮箱已经注册”，并提供带当前邮箱去登录的入口

#### Scenario: 注册成功

- **WHEN** 注册接口返回 201
- **THEN** web 保存 token并进入首页，不需要再次登录

### Requirement: 认证错误呈现

The web SHALL present authentication API errors in Chinese and associate duplicate email, student number and phone errors with the corresponding form field. Unknown business errors SHALL use a general retryable message rather than a raw backend code.

#### Scenario: 学号冲突

- **WHEN** Spring 返回 409 `STUDENT_NUMBER_ALREADY_USED`
- **THEN** 注册表单在学号字段显示“这个学号已经注册”

#### Scenario: 手机号冲突

- **WHEN** Spring 返回 409 `PHONE_ALREADY_USED`
- **THEN** 注册表单在手机号字段显示“这个手机号已绑定其他账号”

#### Scenario: 邮箱冲突

- **WHEN** Spring 返回 409 `EMAIL_ALREADY_REGISTERED`
- **THEN** 注册表单在邮箱字段显示“这个邮箱已经注册”，并突出“去登录”入口

#### Scenario: 邮件发送失败

- **WHEN** Spring 返回 503 `MAIL_NOT_CONFIGURED` 或 `MAIL_SEND_FAILED`
- **THEN** 注册页在表单顶部显示对应的可重试提示，不把错误归到验证码输入框

#### Scenario: 未知业务错误

- **WHEN** Spring 返回未映射的业务错误码
- **THEN** web 显示通用中文提示，不直接展示原始错误码或堆栈
