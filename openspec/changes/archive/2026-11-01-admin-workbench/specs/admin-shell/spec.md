# Spec Delta

## MODIFIED Requirements

### Requirement: 模块路由与占位页

管理端 SHALL 为工作台、领养管理、养护审核、环保任务、问题反馈、品种档案、单株库存、积分规则与流水、奖励商品、兑换订单、学生管理、资讯管理、数据统计提供可访问路由；尚未实现的学生管理、资讯管理和数据统计 SHALL 显示包含模块名称的占位页。`/dashboard` SHALL 渲染真实工作台内容，不再显示占位页。

#### Scenario: 访问未实现模块

- **WHEN** 用户点击“学生管理”
- **THEN** 页面显示后台壳、模块名称和占位说明

#### Scenario: 访问工作台

- **WHEN** 用户访问 `/dashboard`
- **THEN** 页面显示后台壳和工作台内容，不显示占位说明

#### Scenario: 未知路径

- **WHEN** 用户访问未注册路径
- **THEN** 系统重定向到 `/login`
