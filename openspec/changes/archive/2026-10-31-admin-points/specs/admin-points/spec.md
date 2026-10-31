# Spec Delta

## Purpose

定义管理端积分规则配置、全量积分流水查询和人工积分调整的可观察行为，使管理员能够核对养护与任务发放的积分、配置频控并在余额异常时留下可审计的纠错记录。

## ADDED Requirements

### Requirement: 管理端积分规则列表接口

admin SHALL 通过 `GET /api/v1/admin/points/rules` 获取积分规则，按 `sourceType` 升序返回统一响应信封。每条规则 SHALL 包含 ID、来源 `CARE_CHECKIN` 或 `ECO_TASK`、每次积分、频控次数、频控周期、启用状态、生效时间和更新时间。未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 管理员获取规则列表

- **WHEN** 管理员请求 `GET /api/v1/admin/points/rules`
- **THEN** 返回 200，`data` 按来源升序包含 `CARE_CHECKIN` 和 `ECO_TASK` 两条规则及完整字段

#### Scenario: 规则列表为空

- **WHEN** 管理员请求规则列表且系统没有规则记录
- **THEN** 返回 200，`data` 为空数组，而不是 404

#### Scenario: 未授权访问规则列表

- **WHEN** 未登录用户请求规则列表
- **THEN** 返回 401 `UNAUTHORIZED`

#### Scenario: 学生访问规则列表

- **WHEN** 学生账号请求规则列表
- **THEN** 返回 403 `FORBIDDEN`

### Requirement: 积分规则更新接口

admin SHALL 通过 `PUT /api/v1/admin/points/rules/{sourceType}` 更新规则，请求体为 `{ points, frequencyLimit, frequencyPeriod, enabled }`。`sourceType` SHALL 为 `CARE_CHECKIN` 或 `ECO_TASK`；不存在时返回 404 `POINT_RULE_NOT_FOUND`。成功 SHALL 返回 200 和更新后的规则视图，并记录操作人、来源和前后配置的审计事件。

#### Scenario: 更新养护打卡规则

- **WHEN** 管理员提交合法的 `CARE_CHECKIN` 规则
- **THEN** 返回 200，规则视图包含新的积分、频控、启用状态和生效时间

#### Scenario: 更新环保任务规则

- **WHEN** 管理员提交合法的 `ECO_TASK` 规则
- **THEN** 返回 200，规则视图包含新的频控和启用状态

#### Scenario: 更新不存在的来源

- **WHEN** 管理员请求更新未知的 `sourceType`
- **THEN** 返回 404 `POINT_RULE_NOT_FOUND`，不修改任何规则

#### Scenario: 未授权更新规则

- **WHEN** 未登录用户或学生账号请求更新规则
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，规则不变

### Requirement: 积分规则积分与频控校验

`CARE_CHECKIN` 启用时 `points` SHALL 为大于 0 的整数，停用时 SHALL 允许为 0；`ECO_TASK` 的 `points` SHALL 为 0，因为任务积分由任务配置决定。`frequencyLimit` 与 `frequencyPeriod` SHALL 同时为空或同时填写；次数上限填写时 SHALL 大于 0；周期 SHALL 只接受 `DAILY` 或 `WEEKLY`。不合法的请求 SHALL 返回 400 和对应错误码，不修改规则。

#### Scenario: 启用养护规则但积分为零

- **WHEN** 管理员启用 `CARE_CHECKIN` 并把 `points` 提交为 0
- **THEN** 返回 400 `POINT_RULE_POINTS_INVALID`，规则不变

#### Scenario: 停用养护规则并保留零积分

- **WHEN** 管理员停用 `CARE_CHECKIN` 并把 `points` 提交为 0
- **THEN** 返回 200，规则保持停用且积分为 0

#### Scenario: 环保任务规则填写正积分

- **WHEN** 管理员把 `ECO_TASK` 的 `points` 提交为大于 0 的整数
- **THEN** 返回 400 `POINT_RULE_POINTS_INVALID`，规则不变

#### Scenario: 频控字段只填写一个

- **WHEN** 管理员只填写 `frequencyLimit` 或只填写 `frequencyPeriod`
- **THEN** 返回 400 `FREQUENCY_RULE_INVALID`，规则不变

#### Scenario: 频控次数非法

- **WHEN** 管理员填写 `frequencyLimit` 为 0 或负数
- **THEN** 返回 400 `FREQUENCY_LIMIT_INVALID`，规则不变

#### Scenario: 不支持的频控周期

- **WHEN** 管理员填写 `MONTHLY`、`PER_TASK` 或其他未知周期
- **THEN** 返回 400 `FREQUENCY_PERIOD_INVALID`，规则不变

#### Scenario: 取消频控

- **WHEN** 管理员把 `frequencyLimit` 和 `frequencyPeriod` 都提交为空
- **THEN** 返回 200，规则不限制发放次数

### Requirement: 积分规则来源语义

`CARE_CHECKIN` 的规则积分 SHALL 在启用且生效后优先于品种打卡积分；规则未启用、未生效或积分不大于 0 时 SHALL 使用品种积分。`ECO_TASK` 规则的积分 SHALL 不参与任务发放；任务审核 SHALL 始终使用任务的每人奖励积分，规则只限制每日或每周发放次数。

#### Scenario: 养护规则优先

- **WHEN** `CARE_CHECKIN` 规则已启用、已生效且积分大于 0
- **THEN** 养护审核通过时使用规则积分，而不是品种积分

#### Scenario: 养护规则停用后兜底

- **WHEN** `CARE_CHECKIN` 规则停用或尚未生效
- **THEN** 养护审核通过时使用品种打卡积分

#### Scenario: 环保任务不受全局积分覆盖

- **WHEN** `ECO_TASK` 规则配置了频控但任务配置了不同的每人奖励积分
- **THEN** 任务审核通过时仍按任务的每人奖励积分发放

#### Scenario: 规则更新后生效时间刷新

- **WHEN** 管理员成功更新任意规则
- **THEN** 规则的 `effectiveFrom` 更新为当前校园时间

### Requirement: 管理端积分流水接口

admin SHALL 通过 `GET /api/v1/admin/points/ledger` 获取全部账号的积分流水，按创建时间倒序、ID 倒序返回。每条流水 SHALL 包含 ID、账号 ID、学生邮箱、变动积分、变动后余额、来源类型、来源业务 ID、原因、操作人邮箱和创建时间。未登录 SHALL 返回 401，非管理员 SHALL 返回 403。

#### Scenario: 管理员获取全量流水

- **WHEN** 管理员请求 `GET /api/v1/admin/points/ledger`
- **THEN** 返回 200，`data` 按创建时间倒序、ID 倒序包含全部积分变动

#### Scenario: 空流水

- **WHEN** 系统没有任何积分流水
- **THEN** 返回 200，`data` 为空数组

#### Scenario: 流水包含多种来源

- **WHEN** 系统存在养护、任务、兑换、退款和人工调整流水
- **THEN** 每条流水返回原始 `sourceType` 和对应 `sourceId`，不合并或省略记录

#### Scenario: 未授权访问流水

- **WHEN** 未登录用户或学生账号请求全量流水
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 人工积分调整接口

admin SHALL 通过 `POST /api/v1/admin/points/adjustments` 人工调整学生积分，请求体为 `{ accountId, deltaPoints, reason, requestId? }`。`accountId` SHALL 对应存在的学生账号，管理员账号 SHALL 返回 404 `STUDENT_NOT_FOUND`；`deltaPoints` SHALL 为非 0 整数；`reason` 去除首尾空白后 SHALL 为 5–200 字。扣减不得使余额小于 0，否则返回 409 `POINTS_INSUFFICIENT`；成功 SHALL 写入一条 `ADJUSTMENT` 流水并返回 200。

#### Scenario: 增加积分

- **WHEN** 管理员为学生提交正数调整和合法原因
- **THEN** 返回 200，学生余额增加，流水记录增加值和调整后余额

#### Scenario: 扣减积分

- **WHEN** 管理员为学生提交负数调整且余额足够
- **THEN** 返回 200，学生余额减少，流水记录负值和调整后余额

#### Scenario: 扣减超过余额

- **WHEN** 管理员提交的负数绝对值大于学生当前余额
- **THEN** 返回 409 `POINTS_INSUFFICIENT`，余额和流水不变

#### Scenario: 调整值为零

- **WHEN** 管理员提交 `deltaPoints=0`
- **THEN** 返回 400 `POINTS_DELTA_REQUIRED`，不写流水

#### Scenario: 调整管理员账号

- **WHEN** 管理员提交的 `accountId` 对应管理员账号
- **THEN** 返回 404 `STUDENT_NOT_FOUND`，不写流水

#### Scenario: 原因去除空白后不足五字

- **WHEN** 管理员提交的原因去除首尾空白后少于 5 字或多于 200 字
- **THEN** 返回 400 `INVALID_REQUEST`，不写流水

### Requirement: 人工积分调整幂等

人工调整的 `requestId` 为可选字符串，提供时 SHALL 作为幂等键。相同 `requestId` 且相同学生、变动值和原因的重复请求 SHALL 返回首次生成的流水，不得重复改变余额或写入审计事件；相同 `requestId` 对应不同学生、变动值或原因时 SHALL 返回 409 `IDEMPOTENCY_KEY_REUSED`。

#### Scenario: 网络重试同一请求

- **WHEN** 管理员用相同 `requestId` 和相同内容重复提交调整
- **THEN** 返回 200 和首次生成的流水，余额只变化一次

#### Scenario: 相同请求键对应不同内容

- **WHEN** 相同 `requestId` 被用于不同学生、不同变动值或不同原因
- **THEN** 返回 409 `IDEMPOTENCY_KEY_REUSED`，不改变余额

#### Scenario: 未提供请求键

- **WHEN** 管理员提交调整时省略 `requestId`
- **THEN** 服务端生成新的流水键并正常执行一次调整

### Requirement: 页面积分规则

admin SHALL 在 `/points/rules` 显示“积分规则”和“积分流水”两个 tab，默认选中“积分规则”。规则表 SHALL 包含来源、每次积分、频控、状态、生效时间、更新时间和操作；来源和状态 SHALL 使用中文文案。`ECO_TASK` 的每次积分 SHALL 显示为“由任务配置决定”，不得展示可编辑的积分数。

#### Scenario: 默认打开规则 tab

- **WHEN** 管理员访问 `/points/rules`
- **THEN** 页面显示规则 tab、两条规则及中文来源和状态

#### Scenario: 养护规则展示

- **WHEN** 规则列表包含 `CARE_CHECKIN`
- **THEN** 行内显示可编辑积分、频控和“规则积分优先、品种积分兜底”的说明

#### Scenario: 环保任务规则展示

- **WHEN** 规则列表包含 `ECO_TASK`
- **THEN** 每次积分显示“由任务配置决定”，频控显示不限、每日或每周

#### Scenario: 打开规则编辑

- **WHEN** 管理员点击某条规则的“编辑”
- **THEN** 打开表单，预填启用状态、频控和养护规则的可编辑积分

#### Scenario: 保存规则失败

- **WHEN** 保存规则返回校验错误
- **THEN** 表单保持打开并保留输入，显示中文错误，不刷新为成功状态

### Requirement: 页面积分流水

admin SHALL 在“积分流水”tab 显示全部学生的积分变动，列 SHALL 包含流水 ID、学生、来源、变动积分、变动后余额、操作人、时间和原因。学生姓名和学号 SHALL 通过账号目录按账号 ID 关联，缺失时回退邮箱。筛选 SHALL 支持学生关键词、来源、正负方向和日期范围，点击“查询”生效，“重置”恢复默认；列表 SHALL 每页 10 条并显示总数。

#### Scenario: 流水默认列表

- **WHEN** 管理员打开“积分流水”tab
- **THEN** 按创建时间倒序显示流水，学生列显示姓名和学号或邮箱

#### Scenario: 按学生筛选

- **WHEN** 管理员输入学生姓名、学号或邮箱并点击“查询”
- **THEN** 只显示匹配学生的流水，分页回到第一页

#### Scenario: 按来源和方向筛选

- **WHEN** 管理员选择来源或“收入/支出”方向并点击“查询”
- **THEN** 只显示匹配来源和正负方向的流水

#### Scenario: 日期范围筛选

- **WHEN** 管理员设置开始或结束日期并点击“查询”
- **THEN** 只显示创建日期落在范围内的流水

#### Scenario: 流水分页

- **WHEN** 筛选结果超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数并可切换下一页

#### Scenario: 账号目录加载失败

- **WHEN** 账号目录请求失败但流水请求成功
- **THEN** 流水仍显示，学生列回退邮箱，并提示账号资料暂不可用

### Requirement: 页面人工调整

管理员 SHALL 从积分流水 tab 打开“人工调整”抽屉，选择学生、增加或扣减方向、正整数积分和 5–200 字原因。抽屉 SHALL 显示学生当前余额和调整后余额预览；调整后余额小于 0 时 SHALL 禁止提交并显示中文错误。提交前 SHALL 二次确认，确认后按钮进入处理中；成功 SHALL 关闭抽屉、提示并刷新流水和账号余额。

#### Scenario: 增加积分预览

- **WHEN** 管理员选择学生、增加方向并输入积分
- **THEN** 预览显示当前余额和增加后的余额

#### Scenario: 扣减积分预览

- **WHEN** 管理员选择学生、扣减方向并输入不超过余额的积分
- **THEN** 预览显示当前余额和扣减后的余额

#### Scenario: 扣减超过余额

- **WHEN** 扣减积分大于学生当前余额
- **THEN** 显示“调整后余额不能为负”，提交按钮禁用

#### Scenario: 提交成功

- **WHEN** 管理员确认合法调整
- **THEN** 页面提示成功，抽屉关闭，流水和账号目录重新加载

#### Scenario: 重复点击提交

- **WHEN** 管理员在处理中重复点击提交
- **THEN** 只发送一次有效调整，不生成重复流水

#### Scenario: 调整失败

- **WHEN** 服务端返回 `POINTS_INSUFFICIENT`、`STUDENT_NOT_FOUND` 或 `IDEMPOTENCY_KEY_REUSED`
- **THEN** 抽屉保持打开，保留输入并显示对应中文错误

### Requirement: 积分页面空态、失败与响应式

积分规则和流水在加载中 SHALL 显示加载状态；空数据 SHALL 显示中文空态和可执行的下一步；主列表失败 SHALL 显示中文错误和重试。视口小于 992px 时页面 SHALL NOT 产生横向滚动，表格 SHALL 在内容区内部滚动；规则表单和人工调整抽屉 SHALL 适配窄屏，320px 下可完成查看和提交。

#### Scenario: 规则加载失败

- **WHEN** 规则请求失败
- **THEN** 页面显示中文错误和“重试”，不显示空的成功状态

#### Scenario: 流水加载失败

- **WHEN** 流水请求失败
- **THEN** 页面显示中文错误和“重试”，保留页面标题和 tab

#### Scenario: 空流水

- **WHEN** 流水接口返回空数组
- **THEN** 显示“暂无积分流水”和刷新入口

#### Scenario: 窄屏适配

- **WHEN** 视口宽度为 320px
- **THEN** 页面不产生横向滚动，表格内部滚动，人工调整抽屉可完整操作
