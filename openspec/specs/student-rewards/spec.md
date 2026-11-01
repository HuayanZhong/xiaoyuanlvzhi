# student-rewards Specification

## Purpose

定义学生浏览上架奖励、兑换奖励、查看兑换订单并取消待领取订单的行为，使积分可以换成奖励，并在取消或超时后正确退回。

## Requirements

### Requirement: 奖励商城列表

学生端 SHALL 在 `/rewards` 显示奖励列表，来源为 `GET /api/v1/rewards`，该接口只返回启用中的奖励。每张卡片 SHALL 显示名称、图片（有图时最多 3 张）、所需积分、剩余可兑换数量和领取地点。无奖励时 SHALL 显示空态；加载失败 SHALL 显示可重试错误，导航保持可用。

#### Scenario: 浏览奖励

- **WHEN** 已登录学生访问 `/rewards`
- **THEN** 页面逐项显示奖励名称、所需积分、剩余可兑换数量和领取地点

#### Scenario: 奖励没有图片

- **WHEN** 奖励没有图片文件
- **THEN** 卡片不显示图片区域，也不显示裂图或占位图

#### Scenario: 没有可兑换奖励

- **WHEN** 当前没有上架奖励
- **THEN** 页面显示空态说明，不显示空白列表

#### Scenario: 商城加载失败

- **WHEN** 奖励列表请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，底部导航与横向导航仍可使用

### Requirement: 兑换前置条件

商城页 SHALL 同时取得当前积分余额，并与奖励所需积分和剩余可兑换数量一起判断能否兑换。余额不足时 SHALL 禁用该奖励的兑换入口并显示「积分不足」；剩余可兑换数量为 0 时 SHALL 显示「库存不足」；无法取得余额时 SHALL 说明暂时无法核对积分并禁用兑换。

#### Scenario: 积分不足

- **WHEN** 奖励所需积分高于当前余额
- **THEN** 兑换按钮不可用，并就地显示所需积分与当前余额

#### Scenario: 库存不足

- **WHEN** 奖励剩余可兑换数量为 0
- **THEN** 兑换按钮不可用，并显示「库存不足」

#### Scenario: 可以兑换

- **WHEN** 余额足够且剩余可兑换数量大于 0
- **THEN** 兑换按钮可用

### Requirement: 兑换确认与下单

点击兑换 SHALL 先打开确认弹窗，列出奖励名称、将扣除的积分、兑换后余额、领取地点和领取期限（天数）。确认后 SHALL 调用 `POST /api/v1/rewards/{id}/redeem`；成功后 SHALL 显示新订单的订单号、领取地点和领取截止时间，并刷新积分余额与商城剩余数量，同一个确认操作 SHALL NOT 重复提交。

#### Scenario: 取消确认

- **WHEN** 学生在确认弹窗选择取消
- **THEN** 弹窗关闭，不发送兑换请求，余额与库存不变

#### Scenario: 兑换成功

- **WHEN** 学生确认兑换且服务端返回待领取订单
- **THEN** 页面显示订单号、领取地点和领取截止时间，余额减少、商城剩余数量同步更新

#### Scenario: 重复点击

- **WHEN** 请求处理中再次点击确认
- **THEN** 不发送第二次请求

### Requirement: 兑换失败反馈

兑换被服务端拒绝时 SHALL 显示服务端给出的中文原因，并刷新积分余额与奖励列表，SHALL NOT 显示为已兑换。`POINTS_INSUFFICIENT` SHALL 说明积分不足，`REWARD_OUT_OF_STOCK` SHALL 说明库存不足，`REWARD_DISABLED` SHALL 说明奖励已下架。

#### Scenario: 余额已变化

- **WHEN** 兑换时服务端返回 `POINTS_INSUFFICIENT`
- **THEN** 页面显示「积分余额不足」并刷新余额与商城，按钮状态随最新数据更新

#### Scenario: 库存已变化

- **WHEN** 兑换时服务端返回 `REWARD_OUT_OF_STOCK`
- **THEN** 页面显示库存不足并刷新商城，不生成订单

#### Scenario: 网络失败

- **WHEN** 兑换请求因网络或服务错误失败
- **THEN** 页面显示可读原因，保留商城内容和当前余额

### Requirement: 兑换订单列表

学生端 SHALL 在 `/rewards/orders` 按创建时间倒序显示当前学生的兑换订单，来源为 `GET /api/v1/rewards/orders`。每条 SHALL 显示订单号、奖励名称、消耗积分、下单时间、领取地点、领取截止时间和状态。状态 SHALL 使用固定中文标签：`WAITING_PICKUP` 待领取、`CLAIMED` 已领取、`CANCELLED` 已取消、`EXPIRED` 已超时；未知状态 SHALL 显示「状态未知」并保持只读。

#### Scenario: 浏览订单

- **WHEN** 学生访问 `/rewards/orders`
- **THEN** 页面按时间倒序显示订单号、奖励、消耗积分、领取地点、截止时间和状态

#### Scenario: 没有订单

- **WHEN** 学生没有兑换订单
- **THEN** 页面显示空态说明，并提供进入奖励商城的入口

#### Scenario: 订单加载失败

- **WHEN** 订单请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，导航保持可用

### Requirement: 取消待领取订单

只有待领取订单 SHALL 显示取消入口。取消 SHALL 二次确认，并说明积分将退回、库存将释放；确认后调用 `POST /api/v1/rewards/orders/{id}/cancel`。成功后 SHALL 显示「已取消」和退分时间，并刷新积分余额与库存。服务端返回 `ORDER_STATUS_INVALID` 时 SHALL 显示原因并刷新订单，SHALL NOT 把订单显示为已取消。

#### Scenario: 取消成功

- **WHEN** 学生确认取消待领取订单
- **THEN** 订单显示「已取消」和退分时间，积分余额与商城库存同步更新

#### Scenario: 订单已处理

- **WHEN** 取消时服务端返回 `ORDER_STATUS_INVALID`
- **THEN** 页面显示「该订单已处理」，刷新后按最新状态展示，不提供重复取消

#### Scenario: 已领取不可取消

- **WHEN** 订单状态为已领取、已取消或已超时
- **THEN** 页面不显示取消入口

### Requirement: 兑换订单详情

学生端 SHALL 在 `/rewards/orders/{id}` 显示订单号、奖励名称、消耗积分、状态、领取地点、领取截止时间、下单时间，以及存在时的领取时间、退分时间、取消或超时原因，数据来源为 `GET /api/v1/rewards/orders/{id}`。订单不存在或不属于当前学生时 SHALL 说明无法查看并提供返回订单列表的入口。

#### Scenario: 查看订单详情

- **WHEN** 学生打开自己的订单详情
- **THEN** 页面显示订单字段，待领取订单同时提供取消入口

#### Scenario: 订单不可查看

- **WHEN** 学生打开不存在或不属于自己的订单
- **THEN** 页面说明无法查看该订单，并提供返回订单列表的入口
