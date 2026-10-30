# Spec Delta

## ADDED Requirements

### Requirement: 真实登录提交

登录表单校验通过后，admin SHALL 向 Spring `POST /api/v1/auth/login` 提交 `{ email: identifier, password }`。成功时 SHALL 建立登录态并离开 `/login`；失败时 SHALL 显示中文错误并停留在 `/login`；请求进行中 SHALL 显示 loading 且禁止重复提交。admin SHALL NOT 保存密码。

#### Scenario: 合法表单提交

- **WHEN** 用户填写合法的管理员账号和非空密码并提交
- **THEN** admin 发起登录请求，成功后离开 `/login`

#### Scenario: 凭据错误

- **WHEN** Spring 返回 401 `INVALID_CREDENTIALS`
- **THEN** 登录页显示“邮箱或密码错误”，路由保持 `/login`

#### Scenario: 账号禁用

- **WHEN** Spring 返回 403 `ACCOUNT_DISABLED`
- **THEN** 登录页显示后端返回的中文错误，路由保持 `/login`

#### Scenario: 非管理员账号

- **WHEN** 登录成功但响应账号角色不是 `ADMIN`
- **THEN** 登录页显示“仅管理员账号可登录管理后台”，路由保持 `/login`

#### Scenario: 后端不可用

- **WHEN** 登录请求因网络错误或 5xx 失败
- **THEN** 登录页显示中文错误，路由保持 `/login`

#### Scenario: 提交期间重复点击

- **WHEN** 登录请求尚未完成
- **THEN** 登录按钮显示 loading，不发起第二次请求

### Requirement: 登录页提示与入口

登录页 SHALL 表明这是真实的管理员登录入口；SHALL NOT 标注“静态演示”或“不会发起真实请求”。页面 SHALL NOT 提供注册、忘记密码或记住我入口。

#### Scenario: 查看登录页

- **WHEN** 用户查看登录页
- **THEN** 页面不出现静态演示提示，并表明使用管理员账号登录

#### Scenario: 不提供注册、忘记密码和记住我

- **WHEN** 用户查看登录页
- **THEN** 页面不显示注册入口、忘记密码入口或记住我选项

### Requirement: 认证反馈提示

登录成功、登录失败、登录过期和退出成功 SHALL 以页面级消息提示反馈。登录接口自身的 401 SHALL NOT 触发“登录已过期”提示。

#### Scenario: 登录成功

- **WHEN** 管理员登录成功
- **THEN** 页面显示“登录成功”提示，并导航到目标页面

#### Scenario: 登录失败

- **WHEN** 登录请求失败
- **THEN** 页面显示错误弹窗

#### Scenario: 登录过期

- **WHEN** 业务请求返回 401
- **THEN** 页面显示“登录已过期，请重新登录”提示

#### Scenario: 退出成功

- **WHEN** 管理员退出登录且注销请求成功
- **THEN** 页面显示“已退出登录”提示

#### Scenario: 登录失败不误报过期

- **WHEN** `POST /api/v1/auth/login` 返回 401
- **THEN** 只显示凭据错误，不显示“登录已过期”提示

## MODIFIED Requirements

### Requirement: 登录表单校验

登录表单 SHALL 要求账号和密码，账号和密码 SHALL NOT 为空白。密码最小长度 SHALL NOT 由前端强制，凭据是否有效由 Spring 后端判断。校验失败时 SHALL 显示中文错误信息并停留在 `/login`，不得跳转。

#### Scenario: 账号或密码为空

- **WHEN** 用户未填写账号或密码并提交
- **THEN** 系统显示对应的必填错误，路由保持 `/login`

#### Scenario: 密码长度不足

- **WHEN** 用户输入的密码少于 6 个字符并提交
- **THEN** 前端不因长度阻止提交，由 Spring 返回登录结果

#### Scenario: 密码为空白

- **WHEN** 用户只输入空白字符作为密码并提交
- **THEN** 系统显示中文错误，路由保持 `/login`

#### Scenario: 任意非空密码可提交

- **WHEN** 用户填写账号和任意非空密码并提交
- **THEN** 前端不因密码长度阻止提交，由 Spring 返回登录结果

### Requirement: Dashboard 工作台占位页

`/dashboard` SHALL 在管理端后台壳内渲染最小落地页，只显示“工作台”标题；只有已认证管理员可以访问，未认证访问 SHALL 重定向到 `/login`；页面 SHALL NOT 请求业务数据。待办、统计、队列等业务内容，以及原“数据概览”占位标题、三张静态统计卡片和“后续模块”列表 SHALL NOT 显示。

#### Scenario: 登录后进入 dashboard

- **WHEN** 管理员从登录页成功登录
- **THEN** 系统导航到 `/dashboard`，显示后台壳和“工作台”标题

#### Scenario: 待处理为空

- **WHEN** 管理员查看 `/dashboard`
- **THEN** 页面不显示任何待处理内容，也不展示伪造待办

#### Scenario: 未登录直接访问 dashboard

- **WHEN** 未认证用户直接访问 `/dashboard`
- **THEN** 系统重定向到 `/login`，不渲染后台壳

#### Scenario: 占位内容不再显示

- **WHEN** `/dashboard` 渲染
- **THEN** 页面不显示“数据概览”占位标题、三张静态统计卡片或“后续模块”列表

#### Scenario: 窄屏 dashboard

- **WHEN** 管理员在小于 992px 的视口查看 `/dashboard`
- **THEN** 后台壳使用抽屉导航，页面不产生横向滚动

#### Scenario: 静态统计值

- **WHEN** `/dashboard` 渲染
- **THEN** 页面不渲染静态统计值，系统不请求业务数据

## REMOVED Requirements

### Requirement: 静态登录提交

**Reason**: 登录改为直连 Spring 的真实认证，静态跳转行为不再成立。

**Migration**: 由 `admin-auth` 的登录态要求和本 delta 的“真实登录提交”取代；无需数据迁移。

### Requirement: 静态演示提示

**Reason**: 管理端登录页不再静态演示，提示文案随之移除。

**Migration**: 由本 delta 的“登录页提示与入口”取代；继续不提供注册、忘记密码和记住我。
