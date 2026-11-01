# Spec Delta

## Purpose

定义学生查看积分余额与积分流水的方式，使每一笔积分的来源、增减和变动后余额都可以核对。

## ADDED Requirements

### Requirement: 积分余额

学生端 SHALL 在 `/points` 显示当前积分余额，来源为 `GET /api/v1/points/balance`（成功响应体 `data` 为整数余额）。加载中 SHALL 显示加载状态；请求失败 SHALL 显示可读原因和重试入口，导航保持可用。

#### Scenario: 显示余额

- **WHEN** 已登录学生访问 `/points`
- **THEN** 页面显示当前积分余额，并以 `PT` 标注单位

#### Scenario: 余额加载失败

- **WHEN** 余额请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，底部导航与横向导航仍可使用

### Requirement: 积分流水

学生端 SHALL 在 `/points` 按时间倒序显示积分流水，来源为 `GET /api/v1/points/ledger`。每条流水 SHALL 显示发生时间、来源业务、来源记录、增减积分和变动后余额；增加与扣减 SHALL 同时用正负号和文字表达，不只依赖颜色。

#### Scenario: 显示流水

- **WHEN** 学生有积分流水
- **THEN** 页面逐条显示时间、来源业务、来源记录、例如 `+10` 或 `-50` 的增减值和变动后余额

#### Scenario: 没有流水

- **WHEN** 学生没有任何积分流水
- **THEN** 页面显示空态说明，不显示空白列表

#### Scenario: 流水加载失败

- **WHEN** 流水请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，已能显示的余额不受影响

### Requirement: 积分来源标识

积分流水 SHALL 用固定中文标签标识来源业务：`CARE_CHECKIN` 为养护打卡、`ECO_TASK` 为环保任务、`REDEMPTION` 为兑换扣减、`REDEMPTION_REFUND` 为兑换退回、`ADJUSTMENT` 为管理员调整。未识别的来源 SHALL 显示「其他变动」并保留该条记录，不隐藏也不合并。

#### Scenario: 识别已知来源

- **WHEN** 流水来源类型为 `ECO_TASK`
- **THEN** 页面显示「环保任务」

#### Scenario: 未知来源

- **WHEN** 流水来源类型不在固定标签内
- **THEN** 页面显示「其他变动」，仍显示时间、增减值和变动后余额

### Requirement: 积分页入口

`/points` SHALL 提供进入奖励商城 `/rewards` 和我的兑换订单 `/rewards/orders` 的入口；两个入口 SHALL 可键盘聚焦，并通过 Enter 打开。

#### Scenario: 进入奖励商城

- **WHEN** 学生点击「奖励商城」
- **THEN** 页面进入 `/rewards`

#### Scenario: 进入我的订单

- **WHEN** 学生点击「我的订单」
- **THEN** 页面进入 `/rewards/orders`
