# Spec Delta

## ADDED Requirements

### Requirement: 首页区块布局

首页 SHALL 依次展示六个区块：我的绿植、待处理事项、当前积分、环保任务、养护提醒、消息。桌面视口 SHALL 使用两列布局，窄屏 SHALL 使用单列布局；原有档案编号、建档日期和档案状态条 SHALL 保留在区块之后。

#### Scenario: 桌面查看首页

- **WHEN** 已登录学生在 768px 及以上视口访问 `/`
- **THEN** 页面按顺序显示六个区块，并以两列排列

#### Scenario: 窄屏查看首页

- **WHEN** 已登录学生在窄屏访问 `/`
- **THEN** 六个区块按顺序单列显示，不产生横向滚动

### Requirement: 首页待处理事项

首页 SHALL 汇总当前学生的待处理记录并显示各分类数量：待审核打卡来源为 `GET /api/v1/care/checkins` 中 `PENDING_REVIEW` 的记录；待重提领养、养护和任务分别来源为 `GET /api/v1/adoptions`、`GET /api/v1/care/checkins`、`GET /api/v1/tasks/participations` 中 `REJECTED` 的记录；待领取奖励来源为 `GET /api/v1/rewards/orders` 中 `WAITING_PICKUP` 的记录。数量为 0 的分类 SHALL 不显示。

#### Scenario: 显示待办分类

- **WHEN** 学生有 2 条待审核打卡、1 条被驳回的领养和 1 个待领取订单
- **THEN** 待处理事项显示「待审核打卡 2」「待重提 · 领养 1」「待领取奖励 1」，不显示其他为 0 的分类

#### Scenario: 进入待审核打卡

- **WHEN** 学生点击「待审核打卡」
- **THEN** 页面进入该分类最近一条打卡的 `/care/{id}`

#### Scenario: 进入待重提任务

- **WHEN** 学生点击「待重提 · 任务」
- **THEN** 页面进入该参与记录对应任务的 `/tasks/{taskId}`

#### Scenario: 进入待领取奖励

- **WHEN** 学生点击「待领取奖励」
- **THEN** 页面进入该分类最近一个订单的 `/rewards/orders/{id}`

#### Scenario: 没有待处理事项

- **WHEN** 五类记录的数量都为 0
- **THEN** 区块显示「暂无待处理事项」，不显示空白行或死链

### Requirement: 首页环保任务

首页 SHALL 从 `GET /api/v1/tasks` 中筛选可报名任务：状态为 `ONGOING`、当前学生未参与且名额未满。区块 SHALL 最多显示 3 个任务，每个显示标题、奖励积分和剩余名额，并进入 `/tasks/{id}`；没有可报名任务时 SHALL 显示空态和进入 `/tasks` 的入口。

#### Scenario: 显示可报名任务

- **WHEN** 学生有 4 个可报名任务
- **THEN** 区块按服务端顺序显示前 3 个任务及奖励积分、剩余名额

#### Scenario: 排除不可报名任务

- **WHEN** 任务已结束、学生已参与或名额已满
- **THEN** 该任务不出现在首页环保任务区块

#### Scenario: 没有可报名任务

- **WHEN** 当前没有满足条件的任务
- **THEN** 区块显示空态，并提供进入 `/tasks` 的入口

#### Scenario: 进入任务详情

- **WHEN** 学生点击一个可报名任务
- **THEN** 页面进入该任务的 `/tasks/{id}`

### Requirement: 首页养护提醒

首页 SHALL 从 `GET /api/v1/care/eligible-plants` 中筛选当前可以打卡的植株（`eligible` 为 `true`），最多显示 3 株。每株 SHALL 显示展示名称和摆放位置，并进入 `/my-plants/{plantId}`；没有到期植株时 SHALL 显示空态，不显示空白列表。

#### Scenario: 显示到期植株

- **WHEN** 学生有 2 株已达到养护间隔且没有待审核打卡的绿植
- **THEN** 养护提醒显示这 2 株的名称和位置

#### Scenario: 进入养护页面

- **WHEN** 学生点击一株到期绿植
- **THEN** 页面进入 `/my-plants/{plantId}`

#### Scenario: 没有到期植株

- **WHEN** 当前没有 `eligible` 为 `true` 的植株
- **THEN** 区块显示「暂无到期养护」，不显示空白行

### Requirement: 首页区块容错

首页的资料摘要、消息和首页概览 SHALL 独立取数。待处理事项、环保任务或养护提醒任一请求失败时，该区块 SHALL 显示可读原因和重试入口，其他区块 SHALL 保持可用；重试 SHALL 重新获取概览数据并恢复对应区块。

#### Scenario: 单个请求失败

- **WHEN** 待处理事项的其中一个请求因网络或 5xx 失败
- **THEN** 待处理事项显示可重试错误，我的绿植、当前积分、消息和其余可成功加载的区块仍显示数据

#### Scenario: 重试恢复

- **WHEN** 学生在区块错误提示中点击重试且请求恢复成功
- **THEN** 该区块显示最新数据，错误提示消失

#### Scenario: 环保任务与养护提醒失败

- **WHEN** 任务或可养护植株请求失败
- **THEN** 对应区块显示可读错误，待处理事项与其他区块不受影响
