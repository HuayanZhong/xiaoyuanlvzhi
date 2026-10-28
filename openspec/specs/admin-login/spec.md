# admin-login Specification

## Purpose

定义管理端登录入口的可用行为，包括登录页布局、表单校验、静态提交、静态演示提示、路由重定向，以及登录后 dashboard 占位页的落地表现。

## Requirements

### Requirement: 登录入口与响应式布局

admin SHALL 在 `/login` 提供左右分屏的 B 端登录页：桌面端显示品牌区和登录表单区，窄屏隐藏品牌区并保留完整可用的登录表单，且不产生横向滚动。

#### Scenario: 访问登录页

- **WHEN** 用户访问 `/login`
- **THEN** 系统显示包含品牌信息、账号输入、密码输入和登录按钮的登录页

#### Scenario: 窄屏访问

- **WHEN** 用户在 320px 宽的窄屏视口访问 `/login`
- **THEN** 品牌区隐藏，登录表单不产生横向滚动且可完整填写和提交

### Requirement: 登录表单校验

登录表单 SHALL 要求账号和密码，密码 SHALL 至少包含 6 个字符；校验失败时 SHALL 显示中文错误信息并停留在 `/login`，不得跳转。

#### Scenario: 账号或密码为空

- **WHEN** 用户未填写账号或密码并提交
- **THEN** 系统显示对应的必填错误，路由保持 `/login`

#### Scenario: 密码长度不足

- **WHEN** 用户输入的密码少于 6 个字符并提交
- **THEN** 系统显示密码长度错误，路由保持 `/login`

### Requirement: 静态登录提交

表单校验通过后，登录 SHALL 仅执行前端跳转到 `/dashboard`；系统 SHALL NOT 发起登录请求、保存账号密码或 token，也不得建立会话。

#### Scenario: 合法表单提交

- **WHEN** 用户填写合法账号和至少 6 位密码并提交
- **THEN** 系统跳转到 `/dashboard`

#### Scenario: 不发起认证请求

- **WHEN** 用户提交合法表单
- **THEN** 系统不调用 BFF 登录接口，也不保存 token、账号或密码

### Requirement: 静态演示提示

登录页 SHALL 明确标注当前为静态演示，并 SHALL NOT 提供注册、忘记密码或记住我入口。

#### Scenario: 查看静态提示

- **WHEN** 用户查看登录页
- **THEN** 页面显示静态演示提示，说明不会发起真实登录请求

#### Scenario: 不提供注册、忘记密码和记住我

- **WHEN** 用户查看登录页
- **THEN** 页面不显示注册入口、忘记密码入口或记住我选项

### Requirement: Dashboard 工作台占位页

`/dashboard` SHALL 以工作台形式显示“数据概览”、待处理事项空状态和静态统计卡片；静态阶段 SHALL 允许直接访问，不执行认证检查，也不请求业务数据。

#### Scenario: 登录后进入 dashboard

- **WHEN** 用户从登录页成功提交
- **THEN** 系统显示 `/dashboard` 的数据概览、待处理区域和统计卡片

#### Scenario: 待处理为空

- **WHEN** dashboard 渲染待处理区域
- **THEN** 系统显示“暂无待审核事项”空状态，不展示伪造待办

#### Scenario: 未登录直接访问 dashboard

- **WHEN** 用户未经过登录直接访问 `/dashboard`
- **THEN** 页面仍显示，系统不重定向到登录页，也不发起认证请求

#### Scenario: 窄屏 dashboard

- **WHEN** 用户在窄屏视口查看 `/dashboard`
- **THEN** 统计卡片纵向堆叠，待处理和后续模块保持可读且不产生横向滚动

#### Scenario: 静态统计值

- **WHEN** dashboard 渲染统计卡片
- **THEN** 统计值来自静态占位数据，系统不请求业务数据

### Requirement: 根路由与未知路径

admin SHALL 将根路径 `/` 和未知路径重定向到 `/login`。

#### Scenario: 访问根路径

- **WHEN** 用户访问 `/`
- **THEN** 系统重定向到 `/login`

#### Scenario: 访问未知路径

- **WHEN** 用户访问 admin 中不存在的路径
- **THEN** 系统重定向到 `/login`

### Requirement: 中文界面与统一主题

登录页和 dashboard SHALL 使用中文界面文案，并以统一的绿色主色呈现主要操作和强调元素。

#### Scenario: 渲染管理端页面

- **WHEN** 登录页或 dashboard 渲染
- **THEN** 可见文案为中文，主按钮和强调色使用统一绿色主题

### Requirement: 主题切换与持久化

admin SHALL 在登录页和 dashboard 的右上角提供主题切换按钮，在亮色与暗色模式间切换；选择 SHALL 持久化并在刷新后恢复。亮暗模式下主要文字、表单、卡片和按钮 SHALL 保持可读。

#### Scenario: 切换主题

- **WHEN** 用户点击右上角主题切换按钮
- **THEN** 页面在亮色和暗色模式间切换，登录表单和 dashboard 仍然可读

#### Scenario: 刷新后恢复主题

- **WHEN** 用户刷新 admin 页面
- **THEN** 系统恢复上次选择的主题
