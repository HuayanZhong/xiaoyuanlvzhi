# Spec Delta

## REMOVED Requirements

### Requirement: 模块路由与占位页

**Reason**: 管理端所有已列出模块均已实现，数据统计不再需要占位页。

**Migration**: 使用新的“模块路由”要求；所有已列出模块渲染真实业务内容，未注册路径仍重定向到 `/login`。

## ADDED Requirements

### Requirement: 模块路由

管理端 SHALL 为工作台、领养管理、养护审核、环保任务、问题反馈、品种档案、单株库存、积分规则与流水、奖励商品、兑换订单、学生管理、资讯管理、数据统计提供可访问路由；所有列出的模块 SHALL 渲染真实业务内容，不再显示占位页。`/dashboard`、`/students`、`/articles` 和 `/statistics` SHALL 渲染真实业务内容。

#### Scenario: 访问工作台

- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面显示后台壳和工作台内容，不显示占位说明

#### Scenario: 访问学生管理

- **WHEN** 用户访问 `/students`
- **THEN** 页面显示后台壳和学生目录，不显示占位说明

#### Scenario: 访问资讯管理

- **WHEN** 用户访问 `/articles`
- **THEN** 页面显示后台壳和资讯目录，不显示占位说明

#### Scenario: 访问数据统计

- **WHEN** 用户访问 `/statistics`
- **THEN** 页面显示后台壳和数据统计内容，不显示占位说明

#### Scenario: 未知路径

- **WHEN** 用户访问未注册路径
- **THEN** 系统重定向到 `/login`
