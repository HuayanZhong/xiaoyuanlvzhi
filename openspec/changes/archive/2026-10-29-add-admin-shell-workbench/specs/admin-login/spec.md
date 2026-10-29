# Spec Delta

## MODIFIED Requirements

### Requirement: Dashboard 工作台占位页

`/dashboard` SHALL 在管理端后台壳内渲染最小落地页，只显示“工作台”标题；静态阶段 SHALL 允许直接访问，不执行认证检查，也不请求业务数据。待办、统计、队列等业务内容，以及原“数据概览”占位标题、三张静态统计卡片和“后续模块”列表 SHALL NOT 显示。

#### Scenario: 登录后进入 dashboard

- **WHEN** 用户从登录页成功提交
- **THEN** 系统导航到 `/dashboard`，显示后台壳和“工作台”标题

#### Scenario: 待处理为空

- **WHEN** 用户查看 `/dashboard`
- **THEN** 页面不显示任何待处理内容，也不展示伪造待办

#### Scenario: 未登录直接访问 dashboard

- **WHEN** 用户未经过登录直接访问 `/dashboard`
- **THEN** 页面仍显示，系统不重定向到登录页，也不发起认证请求

#### Scenario: 占位内容不再显示

- **WHEN** `/dashboard` 渲染
- **THEN** 页面不显示“数据概览”占位标题、三张静态统计卡片或“后续模块”列表

#### Scenario: 窄屏 dashboard

- **WHEN** 用户在小于 992px 的视口查看 `/dashboard`
- **THEN** 后台壳使用抽屉导航，页面不产生横向滚动

#### Scenario: 静态统计值

- **WHEN** `/dashboard` 渲染
- **THEN** 页面不渲染静态统计值，系统不请求业务数据

### Requirement: 中文界面与统一主题

登录页和 dashboard SHALL 使用中文界面文案，并使用 antd 默认主色呈现主要操作和强调元素；不得注入自定义品牌主色或强调色。

#### Scenario: 渲染管理端页面

- **WHEN** 登录页或 dashboard 渲染
- **THEN** 可见文案为中文，主按钮和强调元素使用 antd 默认主题颜色
