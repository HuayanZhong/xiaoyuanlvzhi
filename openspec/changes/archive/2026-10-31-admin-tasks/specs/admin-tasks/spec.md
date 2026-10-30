# Spec Delta

## Purpose

定义管理端环保任务配置与凭证审核的完整可观察行为：管理员发布、编辑、停用和复制任务，查看报名与凭证版本，通过并发放积分或驳回并说明原因；同时约束任务状态、学生报名、凭证提交、并发审核和任务结束后的补审行为。

## ADDED Requirements

### Requirement: 管理端任务列表接口

admin SHALL 通过 `GET /api/v1/admin/tasks` 获取全部环保任务，按创建时间倒序、ID 倒序返回统一响应信封。响应 SHALL 为管理端任务视图数组，包含任务配置、显示状态、报名人数和通过人数。未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 管理员获取任务列表

- **WHEN** 管理员请求 `GET /api/v1/admin/tasks`
- **THEN** 返回 200，`data` 为按创建时间倒序、ID 倒序排列的任务视图数组

#### Scenario: 空任务列表

- **WHEN** 管理员请求任务列表且系统没有任务
- **THEN** 返回 200，`data` 为空数组，而不是 404

#### Scenario: 未授权访问任务列表

- **WHEN** 未登录用户请求 `GET /api/v1/admin/tasks`
- **THEN** 返回 401 `UNAUTHORIZED`

#### Scenario: 学生访问任务列表

- **WHEN** 学生账号请求 `GET /api/v1/admin/tasks`
- **THEN** 返回 403 `FORBIDDEN`

### Requirement: 任务创建接口

admin SHALL 通过 `POST /api/v1/admin/tasks` 创建任务。请求体 SHALL 包含标题、封面文件 ID（可选）、任务说明、开始时间、结束时间、人数上限（可选）、每人奖励积分、是否要求文字、是否要求照片和是否立即发布。标题去除首尾空白后 SHALL 为 1–60 字，说明 SHALL 为 1–2000 字，结束时间 SHALL 晚于开始时间，人数上限为空或大于 0，每人积分 SHALL 大于 0，文字和照片 SHALL 至少要求一项。封面提供时 SHALL 是公开图片。`publish=false` SHALL 保存为 `DRAFT`，`publish=true` SHALL 保存为 `PUBLISHED`。成功 SHALL 返回创建后的任务视图。

#### Scenario: 保存任务草稿

- **WHEN** 管理员提交合法任务且 `publish=false`
- **THEN** 返回 200，任务状态为 `DRAFT`，列表中可见

#### Scenario: 立即发布任务

- **WHEN** 管理员提交合法任务且 `publish=true`
- **THEN** 返回 200，任务状态按当前时间计算为 `UPCOMING`、`ONGOING` 或 `ENDED`

#### Scenario: 结束时间不晚于开始时间

- **WHEN** 管理员提交的任务结束时间等于或早于开始时间
- **THEN** 返回 400 `TASK_TIME_INVALID`，不创建任务

#### Scenario: 未选择凭证要求

- **WHEN** 管理员提交的任务既不要求文字也不要求照片
- **THEN** 返回 400 `TASK_EVIDENCE_REQUIRED`，不创建任务

#### Scenario: 封面不是公开图片

- **WHEN** 管理员提交的封面文件不存在或不是公开图片
- **THEN** 返回 400 `FILE_NOT_FOUND` 或 `FILE_NOT_PUBLIC`，不创建任务

#### Scenario: 人数上限非法

- **WHEN** 管理员提交人数上限为 0 或负数
- **THEN** 返回 400 `TASK_CAPACITY_INVALID`，不创建任务

### Requirement: 任务编辑与规则锁定

admin SHALL 通过 `PUT /api/v1/admin/tasks/{id}` 编辑任务，请求体与创建接口一致。已有报名记录时，开始时间、结束时间、人数上限和每人奖励积分 SHALL 保持不变，否则返回 409 `TASK_RULES_LOCKED`。`STOPPED` 任务 SHALL 只读，编辑返回 409 `TASK_STATUS_INVALID`。`publish=true` 只 SHALL 将 `DRAFT` 发布为 `PUBLISHED`；其他状态 SHALL 保持原状态。成功 SHALL 返回更新后的任务视图。

#### Scenario: 无报名时修改规则

- **WHEN** 任务没有报名记录，管理员修改时间、人数上限或奖励积分
- **THEN** 返回 200，任务视图显示新规则

#### Scenario: 已有报名时修改规则

- **WHEN** 任务已有至少一条报名，管理员修改开始时间、结束时间、人数上限或奖励积分
- **THEN** 返回 409 `TASK_RULES_LOCKED`，原任务不变

#### Scenario: 编辑已停用任务

- **WHEN** 管理员编辑状态为 `STOPPED` 的任务
- **THEN** 返回 409 `TASK_STATUS_INVALID`，任务保持只读

#### Scenario: 发布草稿

- **WHEN** 管理员编辑 `DRAFT` 任务并提交 `publish=true`
- **THEN** 返回 200，任务变为 `PUBLISHED`

#### Scenario: 编辑已发布任务不改变发布状态

- **WHEN** 管理员编辑 `PUBLISHED` 任务并提交 `publish=false`
- **THEN** 返回 200，任务仍为 `PUBLISHED`

### Requirement: 任务停用接口

admin SHALL 通过 `POST /api/v1/admin/tasks/{id}/stop` 停用任务，无请求体。只有数据库状态为 `PUBLISHED` 的任务可以停用，包括显示为未开始、进行中或已结束的任务；成功后状态 SHALL 变为 `STOPPED`。`DRAFT` 或 `STOPPED` 任务停用 SHALL 返回 409 `TASK_STATUS_INVALID`；任务不存在 SHALL 返回 404 `TASK_NOT_FOUND`。

#### Scenario: 停用已发布任务

- **WHEN** 管理员停用 `PUBLISHED` 任务
- **THEN** 返回 200，任务显示状态为 `STOPPED`

#### Scenario: 停用草稿任务

- **WHEN** 管理员停用 `DRAFT` 任务
- **THEN** 返回 409 `TASK_STATUS_INVALID`，任务状态不变

#### Scenario: 重复停用

- **WHEN** 管理员停用已经是 `STOPPED` 的任务
- **THEN** 返回 409 `TASK_STATUS_INVALID`

### Requirement: 任务显示状态

任务视图中的 `status` SHALL 由数据库状态和校园时间计算：`DRAFT` 显示为草稿，`STOPPED` 显示为已停用；`PUBLISHED` 且当前时间早于开始时间显示为未开始，当前时间等于开始时间或在开始与结束之间显示为进行中，当前时间等于或晚于结束时间显示为已结束。边界判断 SHALL 使用同一校园时钟。

#### Scenario: 开始前

- **WHEN** 已发布任务的开始时间晚于当前时间
- **THEN** 显示状态为 `UPCOMING`

#### Scenario: 正好开始

- **WHEN** 当前时间等于任务开始时间
- **THEN** 显示状态为 `ONGOING`

#### Scenario: 进行中

- **WHEN** 当前时间晚于开始时间且早于结束时间
- **THEN** 显示状态为 `ONGOING`

#### Scenario: 正好结束

- **WHEN** 当前时间等于任务结束时间
- **THEN** 显示状态为 `ENDED`

#### Scenario: 草稿和停用状态

- **WHEN** 任务数据库状态为 `DRAFT` 或 `STOPPED`
- **THEN** 显示状态分别为 `DRAFT` 或 `STOPPED`，不按时间改写

### Requirement: 管理端任务视图

管理端任务视图 SHALL 包含任务 ID、标题、封面文件 ID、说明、开始时间、结束时间、人数上限、报名人数、通过人数、每人奖励积分、文字要求、照片要求、显示状态、是否允许修改规则、创建时间和更新时间。可选字段缺失 SHALL 返回 null；报名人数和通过人数 SHALL 为当前实时统计；`canEditRules` SHALL 仅在报名人数为 0 且任务不是 `STOPPED` 时为 true。

#### Scenario: 任务视图字段完整

- **WHEN** 管理员获取任意任务
- **THEN** 视图包含全部必需字段，可选封面和人数上限缺失时为 null

#### Scenario: 实时人数统计

- **WHEN** 任务新增或处理报名记录
- **THEN** 后续任务视图的报名人数和通过人数反映最新统计

#### Scenario: 规则可编辑标记

- **WHEN** 任务没有报名且未停用
- **THEN** `canEditRules` 为 true；任务已有报名或已停用时为 false

### Requirement: 学生报名接口

学生 SHALL 通过 `POST /api/v1/tasks/{id}/join` 报名任务。任务必须存在、数据库状态为 `PUBLISHED` 且当前时间在开始时间与结束时间之间；否则 SHALL 返回 409 `TASK_NOT_OPEN`。同一学生同一任务 SHALL 只能有一条参与记录，重复报名返回 409 `TASK_ALREADY_JOINED`。人数上限不为空且报名人数达到上限时 SHALL 返回 409 `TASK_FULL`。服务端 SHALL 在任务行锁内检查名额并写入报名时间；并发报名 SHALL NOT 超过人数上限。非学生账号 SHALL 返回 403 `STUDENT_ONLY`。

#### Scenario: 报名成功

- **WHEN** 学生在任务开放时间内报名且名额未满
- **THEN** 返回 200，参与记录状态为 `JOINED`，`joinedAt` 非空且为服务端时间

#### Scenario: 任务未开放

- **WHEN** 学生在未开始、已结束或已停用的任务上报名的
- **THEN** 返回 409 `TASK_NOT_OPEN`

#### Scenario: 重复报名

- **WHEN** 同一学生再次报名同一任务
- **THEN** 返回 409 `TASK_ALREADY_JOINED`，不新增参与记录

#### Scenario: 名额已满

- **WHEN** 任务报名人数已达到人数上限
- **THEN** 返回 409 `TASK_FULL`，不新增参与记录

#### Scenario: 并发报名不超员

- **WHEN** 多个学生在同一时刻报名且剩余名额只有一个
- **THEN** 只有符合名额的请求成功，其余返回 409 `TASK_FULL`

### Requirement: 学生凭证提交与重提

学生 SHALL 通过 `POST /api/v1/tasks/participations/{id}/submissions` 提交或重提凭证。参与记录必须属于当前学生；任务必须为 `PUBLISHED` 且当前时间早于结束时间，否则返回 409 `TASK_CLOSED`。参与状态必须为 `JOINED` 或 `REJECTED`，否则返回 409 `TASK_SUBMISSION_STATE_INVALID`。任务要求文字时说明去除首尾空白后不得为空，否则返回 400 `TASK_TEXT_REQUIRED`；要求照片时至少一张图片，否则返回 400 `TASK_PHOTO_REQUIRED`；说明最多 500 字，图片最多 3 张且必须属于当前学生，否则返回 400 `INVALID_IMAGE_FILES`。提交成功后参与状态变为 `PENDING_REVIEW`，版本号递增，保存新的 `PENDING_REVIEW` 凭证并通知管理员。

#### Scenario: 首次提交凭证

- **WHEN** 已报名学生在截止前提交符合要求的凭证
- **THEN** 返回 200，参与状态为 `PENDING_REVIEW`，凭证版本为 1

#### Scenario: 驳回后重新提交

- **WHEN** 参与状态为 `REJECTED` 的学生在截止前重新提交
- **THEN** 返回 200，新增版本号更高的 `PENDING_REVIEW` 凭证，历史版本保留

#### Scenario: 任务已结束

- **WHEN** 学生在任务结束时间之后提交凭证
- **THEN** 返回 409 `TASK_CLOSED`，不新增凭证

#### Scenario: 参与状态不允许提交

- **WHEN** 参与状态为 `PENDING_REVIEW` 或 `APPROVED` 时提交凭证
- **THEN** 返回 409 `TASK_SUBMISSION_STATE_INVALID`

#### Scenario: 缺少必填文字

- **WHEN** 任务要求文字说明，学生提交空白说明
- **THEN** 返回 400 `TASK_TEXT_REQUIRED`

#### Scenario: 缺少必填照片

- **WHEN** 任务要求照片，学生未提交图片
- **THEN** 返回 400 `TASK_PHOTO_REQUIRED`

#### Scenario: 并发重提版本递增

- **WHEN** 同一参与记录同时收到两个重提请求
- **THEN** 版本号不得重复，只有一个请求成功，另一个返回状态冲突错误

### Requirement: 管理端参与审核列表接口

admin SHALL 通过 `GET /api/v1/admin/tasks/participations` 获取参与审核列表，可选 `taskId` 和 `status` 查询参数。`status` 允许 `JOINED`、`PENDING_REVIEW`、`REJECTED`、`APPROVED`；未知值 SHALL 返回 400 `INVALID_REQUEST`。不传 `status` SHALL 返回全部状态的参与记录，而不是只返回待审核凭证；不传 `taskId` SHALL 返回全部任务。结果 SHALL 按报名时间倒序、ID 倒序返回管理端参与视图数组。未登录返回 401，非管理员返回 403。

#### Scenario: 获取全部参与记录

- **WHEN** 管理员请求参与列表且不传筛选参数
- **THEN** 返回所有任务的 JOINED、PENDING_REVIEW、REJECTED 和 APPROVED 参与记录

#### Scenario: 按任务筛选

- **WHEN** 管理员传入 `taskId`
- **THEN** 只返回该任务的参与记录

#### Scenario: 按状态筛选

- **WHEN** 管理员传入合法 `status=PENDING_REVIEW`
- **THEN** 只返回待审核参与记录

#### Scenario: 未知状态

- **WHEN** 管理员传入不支持的 `status`
- **THEN** 返回 400 `INVALID_REQUEST`

#### Scenario: 空参与列表

- **WHEN** 筛选条件下没有参与记录
- **THEN** 返回 200，`data` 为空数组

### Requirement: 管理端参与详情与审核事件接口

admin SHALL 通过 `GET /api/v1/admin/tasks/participations/{id}` 获取单条参与审核视图，并通过 `GET /api/v1/admin/tasks/participations/{id}/events` 获取按创建时间升序、ID 升序排列的审核操作记录。参与记录不存在时 SHALL 返回 404 `TASK_PARTICIPATION_NOT_FOUND`；参与存在但没有审核事件时 SHALL 返回空数组。未登录或非管理员 SHALL 返回 401/403。

#### Scenario: 获取参与详情

- **WHEN** 管理员请求存在的参与记录详情
- **THEN** 返回 200，包含任务、学生、参与状态和全部凭证版本

#### Scenario: 参与记录不存在

- **WHEN** 管理员请求不存在的参与记录
- **THEN** 返回 404 `TASK_PARTICIPATION_NOT_FOUND`

#### Scenario: 获取审核事件

- **WHEN** 管理员请求参与记录的审核事件
- **THEN** 返回 200，事件按时间升序排列，包含通过或驳回操作

### Requirement: 管理端参与审核视图

管理端参与视图 SHALL 包含参与 ID、任务 ID、任务标题、任务显示状态、任务开始/结束时间、每人奖励积分、学生 ID、姓名、学号、邮箱、账号状态、参与状态、报名时间、最新版本号、最新提交时间、最新说明、是否有证据、实际发放积分和全部凭证版本。凭证版本 SHALL 包含版本号、说明、图片文件 ID、状态、驳回原因、审核人姓名/邮箱、提交时间、审核时间和实际发放积分。可选字段缺失 SHALL 返回 null 或空数组。

#### Scenario: 待审核参与视图

- **WHEN** 管理员查看已提交待审的参与记录
- **THEN** 视图包含学生姓名/学号/账号状态、最新提交时间、证据标记和待审凭证版本

#### Scenario: 已通过参与视图

- **WHEN** 管理员查看已通过的参与记录
- **THEN** 视图返回实际发放积分和审核人信息

#### Scenario: 仅报名未提交

- **WHEN** 参与状态为 `JOINED` 且没有凭证
- **THEN** 最新提交时间、最新说明和实际发放积分为 null，凭证数组为空

### Requirement: 审核通过

admin SHALL 通过 `POST /api/v1/admin/tasks/participations/{id}/approve` 通过凭证，无请求体。服务端 SHALL 在参与记录行锁内校验参与状态为 `PENDING_REVIEW` 且最新凭证为 `PENDING_REVIEW`；否则返回 409 `TASK_PARTICIPATION_STATUS_INVALID` 或 `TASK_SUBMISSION_ALREADY_REVIEWED`。奖励积分 SHALL 取任务 `pointsPerPerson`；若启用中的 `ECO_TASK` 积分规则配置了日/周频率上限且已用尽，SHALL 返回 409 `POINTS_FREQUENCY_LIMIT`，参与和凭证状态不变。成功 SHALL 只生成一条积分流水，更新凭证和参与状态，记录审核人/时间，通知学生并记录审核事件，返回更新后的参与视图。

#### Scenario: 审核通过成功

- **WHEN** 管理员通过待审核参与记录
- **THEN** 返回 200，参与和最新凭证状态为 `APPROVED`，实际发放积分等于任务奖励积分

#### Scenario: 重复通过

- **WHEN** 管理员再次通过已处理的参与记录
- **THEN** 返回 409 `TASK_PARTICIPATION_STATUS_INVALID`，不重复发放积分

#### Scenario: 最新凭证已处理

- **WHEN** 参与状态为待审但最新凭证已被其他操作处理
- **THEN** 返回 409 `TASK_SUBMISSION_ALREADY_REVIEWED`

#### Scenario: 积分频率上限

- **WHEN** 任务奖励积分触发 `ECO_TASK` 日/周频率上限
- **THEN** 返回 409 `POINTS_FREQUENCY_LIMIT`，参与和凭证仍为 `PENDING_REVIEW`

#### Scenario: 并发审核只发一次积分

- **WHEN** 两个管理员同时通过同一参与记录
- **THEN** 只有一个请求成功，另一个返回 409，积分流水只有一条

### Requirement: 审核驳回

admin SHALL 通过 `POST /api/v1/admin/tasks/participations/{id}/reject` 驳回凭证，请求体为 `{ "reason": string }`。原因去除首尾空白后 SHALL 为 5–200 字，否则返回 400 `INVALID_REQUEST`。服务端 SHALL 在参与记录行锁内校验参与状态和最新凭证均为 `PENDING_REVIEW`；成功后凭证和参与状态变为 `REJECTED`，保存去除首尾空白后的原因，记录审核人/时间，通知学生并记录审核事件，不产生积分流水。

#### Scenario: 驳回成功

- **WHEN** 管理员提交 5–200 字原因驳回待审核参与记录
- **THEN** 返回 200，参与和最新凭证状态为 `REJECTED`，原因已保存

#### Scenario: 原因过短

- **WHEN** 管理员提交去除首尾空白后少于 5 字的原因
- **THEN** 返回 400 `INVALID_REQUEST`，状态不变

#### Scenario: 重复驳回

- **WHEN** 管理员驳回已处理的参与记录
- **THEN** 返回 409 `TASK_PARTICIPATION_STATUS_INVALID`

#### Scenario: 并发驳回

- **WHEN** 两个管理员同时驳回同一参与记录
- **THEN** 只有一个请求成功，另一个返回 409

### Requirement: 任务结束后的审核

任务显示为 `ENDED` 或 `STOPPED` 时，学生 SHALL NOT 新增报名或提交凭证；但截止前已经提交且仍为 `PENDING_REVIEW` 的参与记录 SHALL 仍可被管理员通过或驳回。任务状态 SHALL NOT 阻止对已提交凭证的审核。

#### Scenario: 已结束任务补审

- **WHEN** 任务已结束，管理员通过截止前提交的待审凭证
- **THEN** 返回 200，凭证变为 `APPROVED`，积分正常发放

#### Scenario: 已停用任务补审

- **WHEN** 任务已停用，管理员驳回截止前提交的待审凭证
- **THEN** 返回 200，凭证变为 `REJECTED`，不发放积分

#### Scenario: 已结束任务报名

- **WHEN** 学生在任务结束后报名
- **THEN** 返回 409 `TASK_NOT_OPEN`

#### Scenario: 已结束任务提交

- **WHEN** 学生在任务结束后提交凭证
- **THEN** 返回 409 `TASK_CLOSED`

### Requirement: 页面任务配置

admin SHALL 在 `/tasks` 的“任务配置”tab 显示任务列表，默认按创建时间倒序、每页 10 条并在客户端分页。列表列 SHALL 包含标题、开放时间、报名人数/上限、通过人数、每人积分、状态和操作。筛选 SHALL 支持标题关键词、状态和开放时间范围；点击“查询”生效，“重置”恢复默认。状态 SHALL 使用中文文案。操作 SHALL 包含新建、编辑、复制新建、停用和查看报名；`STOPPED` 任务 SHALL 不显示编辑和停用，`DRAFT` 任务 SHALL 不显示停用。

#### Scenario: 默认列表与分页

- **WHEN** 管理员打开 `/tasks`
- **THEN** 显示任务配置 tab，列表按创建时间倒序，每页 10 条并显示总数

#### Scenario: 关键词和状态筛选

- **WHEN** 管理员输入标题关键词并选择状态后点击“查询”
- **THEN** 列表只显示同时匹配的任务

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、状态和日期恢复默认，列表显示全部任务

#### Scenario: 操作按钮按状态显示

- **WHEN** 任务为 `STOPPED` 或 `DRAFT`
- **THEN** 分别隐藏编辑/停用或仅隐藏停用，复制新建仍可用

#### Scenario: 空列表

- **WHEN** 没有任务或筛选无结果
- **THEN** 显示中文空态和“新建任务”入口

#### Scenario: 列表加载失败

- **WHEN** 任务列表请求失败
- **THEN** 显示中文错误和重试入口

### Requirement: 页面任务表单

admin SHALL 通过抽屉新建、编辑或复制任务。表单 SHALL 包含标题、封面、任务说明、开始/结束时间、人数上限、每人积分、文字要求、照片要求和发布方式。新建 SHALL 支持“保存草稿”和“立即发布”；编辑 `DRAFT` SHALL 支持发布；`STOPPED` 任务 SHALL 只读。已有报名时 SHALL 禁用时间、人数上限和每人积分并显示锁定提示。复制新建 SHALL 预填标题副本、说明、封面、人数上限、积分和凭证要求，但 SHALL 清空时间并以草稿保存。提交失败 SHALL 保留已填写内容并显示中文原因；成功后关闭抽屉、刷新列表并提示。

#### Scenario: 新建并保存草稿

- **WHEN** 管理员填写合法表单并点击“保存草稿”
- **THEN** 抽屉关闭，列表出现状态为草稿的任务

#### Scenario: 新建并立即发布

- **WHEN** 管理员填写合法表单并点击“立即发布”
- **THEN** 抽屉关闭，列表出现已发布任务

#### Scenario: 编辑有报名任务

- **WHEN** 管理员编辑已有报名的任务
- **THEN** 时间、人数上限和积分字段禁用，提交时保持不变

#### Scenario: 编辑已停用任务

- **WHEN** 管理员查看 `STOPPED` 任务
- **THEN** 表单只读，不提供保存或发布按钮

#### Scenario: 复制新建

- **WHEN** 管理员点击“复制新建”
- **THEN** 表单预填除时间外的配置，保存后生成新的草稿任务

#### Scenario: 表单校验失败

- **WHEN** 管理员提交缺少标题、非法时间或未选凭证要求的表单
- **THEN** 字段旁显示中文原因，已填写内容保留

#### Scenario: 窄屏表单

- **WHEN** 视口宽度为 320px
- **THEN** 抽屉占满宽度，字段和按钮可操作且页面不横向滚动

### Requirement: 页面凭证审核

admin SHALL 在 `/tasks` 的“凭证审核”tab 显示参与审核列表，默认筛选 `PENDING_REVIEW`。列表列 SHALL 包含任务、学生、报名时间、最新提交时间、凭证摘要、状态、奖励积分和操作。筛选 SHALL 支持任务、审核状态、学生/任务关键词和提交日期范围；列表 SHALL 每页 10 条并支持总数显示。`?tab=review&status=PENDING_REVIEW&taskId=` SHALL 作为初始 tab 和筛选条件，非法状态忽略。审核状态 SHALL 使用中文文案。

#### Scenario: 默认待审队列

- **WHEN** 管理员打开 `/tasks?tab=review`
- **THEN** 显示凭证审核 tab，默认只显示待审核参与记录

#### Scenario: 按任务筛选

- **WHEN** 管理员从任务配置点击“查看报名”
- **THEN** 切换到凭证审核 tab，并只显示该任务的参与记录

#### Scenario: 深链状态筛选

- **WHEN** 管理员打开 `/tasks?tab=review&status=APPROVED`
- **THEN** 凭证审核 tab 默认筛选已通过记录

#### Scenario: 非法深链状态

- **WHEN** `status` 不是合法审核状态
- **THEN** 忽略该值并按默认待审核筛选

#### Scenario: 空审核列表

- **WHEN** 没有匹配的参与记录
- **THEN** 显示中文空态和刷新/清空筛选入口

### Requirement: 页面审核抽屉与防御

点击参与记录的“查看”SHALL 打开审核抽屉，显示任务与学生上下文、最新凭证、全部凭证版本、图片和审核记录。只有参与状态为 `PENDING_REVIEW`、最新凭证待审且证据完整时 SHALL 显示可用“通过”；通过前 SHALL 二次确认并展示学生、任务和奖励积分。驳回 SHALL 复用原因弹窗，原因去除首尾空白后 5–200 字。操作进行中 SHALL 禁用按钮；收到状态冲突 SHALL 刷新详情和列表，不乐观改写状态；详情或审核记录失败 SHALL 显示中文错误和重试入口。

#### Scenario: 待审核记录可操作

- **WHEN** 管理员打开待审核参与记录
- **THEN** 显示可用“通过”和“驳回”，并展示最新凭证与审核记录

#### Scenario: 已处理记录只读

- **WHEN** 管理员打开已通过、已驳回或仅报名的参与记录
- **THEN** 不显示可用审核按钮，显示实际发放积分或未提交说明

#### Scenario: 证据缺失

- **WHEN** 参与记录待审但最新凭证没有满足证据要求
- **THEN** “通过”禁用并提示原因，“驳回”仍可用

#### Scenario: 审核冲突

- **WHEN** 审核时服务端返回状态冲突
- **THEN** 显示中文提示并刷新详情和列表

#### Scenario: 审核记录加载失败

- **WHEN** 审核事件请求失败
- **THEN** 详情主体仍显示，审核记录区域显示错误和重试入口

### Requirement: 空态、失败与响应式

任务列表、审核列表和抽屉在加载中 SHALL 显示加载状态；空数据 SHALL 显示中文空态和可执行的下一步；主列表失败 SHALL 显示中文错误和重试。视口小于 992px 时页面 SHALL NOT 产生横向滚动，表格 SHALL 在内容区内部滚动；抽屉和原因弹窗 SHALL 适配窄屏，320px 下可完成查看、通过和驳回。

#### Scenario: 加载状态

- **WHEN** 页面首次加载任务或审核列表
- **THEN** 显示加载状态，不显示旧数据

#### Scenario: 主列表失败

- **WHEN** 任务列表或审核列表请求失败
- **THEN** 显示中文错误和重试按钮

#### Scenario: 320px 查看与审核

- **WHEN** 在 320px 视口打开待审核参与记录并完成通过或驳回
- **THEN** 页面无横向滚动，抽屉和弹窗可操作，操作成功

#### Scenario: 详情加载失败

- **WHEN** 审核抽屉详情请求失败
- **THEN** 抽屉内显示中文错误和重试入口，可关闭抽屉
