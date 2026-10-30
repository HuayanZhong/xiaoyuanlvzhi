# Spec Delta

## MODIFIED Requirements

### Requirement: 管理端后台壳

管理端 SHALL 在已认证管理员的业务页面渲染统一后台壳，包含顶部一级导航、左侧二级导航和内容区；未认证访问业务路由 SHALL 重定向到 `/login`；登录页 SHALL NOT 渲染后台壳。

#### Scenario: 进入业务页面

- **WHEN** 已认证管理员访问 `/dashboard` 或其他已注册业务路由
- **THEN** 页面显示顶部导航、左侧导航和内容区

#### Scenario: 访问登录页

- **WHEN** 用户访问 `/login`
- **THEN** 页面不显示顶部导航和左侧导航

#### Scenario: 未登录访问业务路由

- **WHEN** 未认证用户访问 `/dashboard` 或其他业务路由
- **THEN** 系统重定向到 `/login`，不渲染后台壳

## ADDED Requirements

### Requirement: 账号菜单与退出登录

后台壳顶部账号菜单 SHALL 显示当前管理员的可识别名称（姓名或邮箱）和“退出登录”操作；该操作 SHALL 触发 `admin-auth` 定义的退出流程。

#### Scenario: 显示当前账号

- **WHEN** 管理员进入后台壳
- **THEN** 账号菜单显示当前管理员的姓名或邮箱

#### Scenario: 提供退出入口

- **WHEN** 管理员打开账号菜单
- **THEN** 菜单包含“退出登录”操作
