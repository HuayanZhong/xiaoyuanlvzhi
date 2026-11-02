# student-notifications Specification

## Purpose

定义学生查看站内通知、未读状态并从通知进入对应业务记录的规则，使领养、打卡、任务、兑换和反馈的结果都能被学生及时看到。

## Requirements

### Requirement: 通知列表

学生端 SHALL 在 `/notifications` 显示当前学生的通知，来源为 `GET /api/v1/notifications`，成功响应体 `data` 为 `{ items, unreadCount }`。每条通知 SHALL 显示标题、摘要、业务类型、发生时间和已读状态，列表按服务端返回的创建时间倒序展示。没有通知时 SHALL 显示空态；请求失败 SHALL 显示可重试错误，页面壳与其他导航保持可用。

#### Scenario: 浏览通知

- **WHEN** 已登录学生访问 `/notifications` 且有通知
- **THEN** 页面逐条显示标题、摘要、业务类型、发生时间和已读状态，最新的通知在最前

#### Scenario: 没有通知

- **WHEN** 学生没有任何通知
- **THEN** 页面显示空态说明，不显示空白列表

#### Scenario: 通知加载失败

- **WHEN** 通知请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，顶部导航与底部导航仍可使用

### Requirement: 业务类型标识

通知 SHALL 用固定中文标签标识业务类型：`ADOPTION` 为领养申请、`CARE` 为养护打卡、`TASK` 为环保任务、`REDEMPTION` 为兑换订单、`FEEDBACK` 为问题反馈。未识别的业务类型 SHALL 显示「系统通知」并保留该条通知，不隐藏也不合并。

#### Scenario: 识别已知类型

- **WHEN** 通知的业务类型为 `CARE`
- **THEN** 页面显示「养护打卡」

#### Scenario: 未知类型

- **WHEN** 通知的业务类型不在固定标签内
- **THEN** 页面显示「系统通知」，仍显示标题、摘要和时间

### Requirement: 未读数与入口

首页和「我的」页面 SHALL 提供通知入口并显示当前未读数，数据来源为同一 `GET /api/v1/notifications`。未读数为 0 时入口 SHALL 显示「暂无未读」，不显示未读标记。通知页 SHALL 显示未读数，且三个位置的数字 SHALL 在标记已读后保持一致。

#### Scenario: 显示未读数

- **WHEN** 学生有 2 条未读通知
- **THEN** 首页消息入口、「我的」通知入口和通知页都显示 2

#### Scenario: 没有未读通知

- **WHEN** 学生的未读数为 0
- **THEN** 入口显示「暂无未读」，不显示未读标记

#### Scenario: 入口跳转

- **WHEN** 学生点击首页消息入口或「我的」通知入口
- **THEN** 页面进入 `/notifications`

### Requirement: 标记已读

未读通知 SHALL 在打开其业务记录前调用 `POST /api/v1/notifications/{id}/read`；成功后该条显示为已读并减少未读数。已读通知 SHALL 直接打开业务记录，不重复调用。标记失败时 SHALL 显示可读原因并留在列表，不跳转。「全部标记已读」SHALL 调用 `POST /api/v1/notifications/read-all`，未读数为 0 时不可用；成功后所有通知显示已读、未读数归零。

#### Scenario: 单条标记已读

- **WHEN** 学生点击一条未读通知且标记成功
- **THEN** 该条显示为已读，未读数减 1，页面随后打开对应业务记录

#### Scenario: 标记失败

- **WHEN** 标记已读请求因网络或服务错误失败
- **THEN** 页面显示原因并停留在通知列表，不打开业务记录

#### Scenario: 全部标记已读

- **WHEN** 学生点击「全部标记已读」且存在未读通知
- **THEN** 所有通知显示为已读，未读数变为 0

#### Scenario: 没有未读时不可全部标记

- **WHEN** 未读数为 0
- **THEN** 「全部标记已读」不可用

### Requirement: 从通知进入业务记录

通知 SHALL 按业务类型跳转：`ADOPTION` 到 `/adoptions/{businessId}`、`CARE` 到 `/care/{businessId}`、`REDEMPTION` 到 `/rewards/orders/{businessId}`、`FEEDBACK` 到 `/feedback/{businessId}`。`TASK` 的 `businessId` 是参与记录 ID，页面 SHALL 通过 `GET /api/v1/tasks/participations` 找到对应的 `taskId` 后进入 `/tasks/{taskId}`；解析失败时 SHALL 进入 `/tasks`。未知业务类型或缺少 `businessId` 时 SHALL 只标记已读、不跳转。

#### Scenario: 打开领养通知

- **WHEN** 学生打开业务类型为 `ADOPTION`、`businessId` 为 `12` 的通知
- **THEN** 页面进入 `/adoptions/12`

#### Scenario: 打开任务通知

- **WHEN** 学生打开业务类型为 `TASK`、`businessId` 为 `34` 的通知，且参与记录 34 属于任务 7
- **THEN** 页面进入 `/tasks/7`

#### Scenario: 任务参与记录无法解析

- **WHEN** 任务通知对应的参与记录不存在或参与记录请求失败
- **THEN** 页面进入 `/tasks`，不显示空白页

#### Scenario: 未知业务类型

- **WHEN** 通知的业务类型不在固定标签内
- **THEN** 页面只标记已读，不跳转

### Requirement: 兑换通知领取截止时间

兑换成功通知的摘要 SHALL 使用 `yyyy-MM-dd HH:mm`（Asia/Shanghai）显示领取截止时间，SHALL NOT 出现原始 ISO 时间戳、`T` 分隔符或纳秒。通知列表 SHALL 原样展示该摘要，不再二次解析时间。

#### Scenario: 兑换成功通知

- **WHEN** 学生在 2026-11-02 20:48 兑换奖励，领取截止为 7 天后
- **THEN** 通知摘要为「请在 2026-11-09 20:48 前到 学生活动中心 101 领取。」，不包含 `T` 或纳秒

#### Scenario: 历史通知兼容

- **WHEN** 通知列表展示此前生成的兑换通知
- **THEN** 每条摘要独立显示，不因时间格式不同而隐藏或合并
