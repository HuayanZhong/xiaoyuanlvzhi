# Spec Delta

## ADDED Requirements

### Requirement: Dashboard 工作台落地页

`/dashboard` SHALL 在管理端后台壳内渲染真实工作台，包含计数卡片、最近待处理记录和趋势图；只有已认证管理员可以访问，未认证访问 SHALL 重定向到 `/login`。页面 SHALL 请求工作台数据，并在加载失败时显示中文错误和重试；不得渲染静态演示数据。

#### Scenario: 登录后进入工作台

- **WHEN** 管理员从登录页成功登录
- **THEN** 系统导航到 `/dashboard`，显示后台壳和工作台内容

#### Scenario: 页面请求真实数据

- **WHEN** 管理员查看 `/dashboard`
- **THEN** admin 请求工作台和统计接口，显示接口返回的计数、最近记录和趋势

#### Scenario: 待处理为空

- **WHEN** 工作台接口返回零待办和空最近记录
- **THEN** 页面显示真实零值和“当前没有待处理事项”，不展示伪造待办

#### Scenario: 未登录直接访问

- **WHEN** 未认证用户直接访问 `/dashboard`
- **THEN** 系统重定向到 `/login`，不渲染后台壳

#### Scenario: 占位内容不再显示

- **WHEN** `/dashboard` 渲染
- **THEN** 页面不显示“数据概览”占位标题、三张静态统计卡片或“后续模块”列表

#### Scenario: 窄屏工作台

- **WHEN** 管理员在小于 992px 的视口查看 `/dashboard`
- **THEN** 后台壳使用抽屉导航，工作台纵向排列且页面不产生横向滚动

## REMOVED Requirements

### Requirement: Dashboard 工作台占位页

**Reason**: 工作台已实现真实待办、队列和趋势数据，原“只显示标题、不请求业务数据”的占位行为不再成立。

**Migration**: 使用同一 `/dashboard` 路由下的“Dashboard 工作台落地页”要求；登录后默认跳转和未登录重定向保持不变。
