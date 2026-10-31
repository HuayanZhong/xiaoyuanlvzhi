# Spec Delta

## Purpose

定义管理端问题反馈的列表查询、筛选、详情、处理时间线、开始处理、回复和关闭的可观察行为，使管理员能够处理学生提交的异常，并保证每次状态转换只产生一次有效结果和一次学生通知。

## ADDED Requirements

### Requirement: 管理端反馈列表接口

admin SHALL 通过 `GET /api/v1/admin/feedback` 获取反馈列表，可选 `status` 查询参数。`status` 只接受 `PENDING`、`IN_PROGRESS`、`REPLIED` 或 `CLOSED`；省略或为空白时返回全部，未知值 SHALL 返回 400 `INVALID_REQUEST`。列表 SHALL 按创建时间倒序、ID 倒序返回统一响应信封，并包含反馈编号、学生账号 ID、学生邮箱、类型、关联业务、描述、图片文件 ID、状态、管理员回复、处理人邮箱、处理时间、创建时间、更新时间和处理时间线。未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 管理员获取全部反馈

- **WHEN** 管理员请求 `GET /api/v1/admin/feedback`
- **THEN** 返回 200，`data` 包含全部反馈及完整状态与时间线字段

#### Scenario: 按状态筛选反馈

- **WHEN** 管理员请求 `GET /api/v1/admin/feedback?status=PENDING`
- **THEN** 返回 200，`data` 只包含待处理反馈

#### Scenario: 未知状态筛选

- **WHEN** 管理员请求 `GET /api/v1/admin/feedback?status=UNKNOWN`
- **THEN** 返回 400 `INVALID_REQUEST`，不返回空列表

#### Scenario: 反馈列表为空

- **WHEN** 系统没有任何反馈记录
- **THEN** 返回 200，`data` 为空数组，而不是 404

#### Scenario: 同一创建时间稳定排序

- **WHEN** 多条反馈的创建时间相同
- **THEN** 返回结果按 ID 倒序排列，后创建的反馈在前

#### Scenario: 未授权访问反馈列表

- **WHEN** 未登录用户或学生账号请求管理端反馈列表
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 反馈详情接口

admin SHALL 通过 `GET /api/v1/admin/feedback/{id}` 获取单条反馈详情，返回完整反馈视图和处理时间线。时间线 SHALL 按创建时间正序、ID 正序返回。反馈不存在 SHALL 返回 404 `FEEDBACK_NOT_FOUND`；未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 获取反馈详情

- **WHEN** 管理员请求存在的反馈 ID
- **THEN** 返回 200，包含描述、图片文件 ID、回复、处理人和按时间正序排列的时间线

#### Scenario: 反馈详情包含完整时间线

- **WHEN** 反馈已提交、开始处理并回复
- **THEN** 时间线按顺序包含提交、开始处理和回复事件，每条事件包含前后状态、说明、操作人和发生时间

#### Scenario: 反馈不存在

- **WHEN** 管理员请求不存在的反馈 ID
- **THEN** 返回 404 `FEEDBACK_NOT_FOUND`

#### Scenario: 未授权访问反馈详情

- **WHEN** 未登录用户或学生账号请求管理端反馈详情
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 开始处理接口

admin SHALL 通过 `POST /api/v1/admin/feedback/{id}/start` 开始处理反馈。仅 `PENDING` 状态 SHALL 成功：状态变为 `IN_PROGRESS`，记录处理人和处理时间，追加一条处理事件和操作审计，返回 200 和更新后的反馈视图。反馈不存在 SHALL 返回 404 `FEEDBACK_NOT_FOUND`；其他状态 SHALL 返回 409 `FEEDBACK_STATUS_INVALID`。重复或并发请求 SHALL 只有一次成功，其余返回 409。

#### Scenario: 开始处理待反馈

- **WHEN** 管理员开始处理 `PENDING` 反馈
- **THEN** 返回 200，状态为 `IN_PROGRESS`，时间线新增开始处理事件

#### Scenario: 重复开始处理

- **WHEN** 管理员再次开始处理已处于 `IN_PROGRESS` 的反馈
- **THEN** 返回 409 `FEEDBACK_STATUS_INVALID`，状态和时间线不变

#### Scenario: 开始处理不存在的反馈

- **WHEN** 管理员开始处理不存在的反馈 ID
- **THEN** 返回 404 `FEEDBACK_NOT_FOUND`

#### Scenario: 并发开始处理

- **WHEN** 两个管理员同时开始处理同一条 `PENDING` 反馈
- **THEN** 只有一个请求返回 200，另一个返回 409 `FEEDBACK_STATUS_INVALID`

#### Scenario: 未授权开始处理

- **WHEN** 未登录用户或学生账号请求开始处理
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，反馈不变

### Requirement: 回复接口

admin SHALL 通过 `POST /api/v1/admin/feedback/{id}/reply` 回复反馈，请求体为 `{ reply }`。`reply` 去除首尾空白后 SHALL 为 5–500 字，否则返回 400 `INVALID_REQUEST`。仅 `PENDING` 或 `IN_PROGRESS` 状态 SHALL 成功：保存回复内容，状态变为 `REPLIED`，记录处理人和处理时间，追加处理事件、操作审计并通知学生，返回 200。反馈不存在 SHALL 返回 404；已回复或已关闭 SHALL 返回 409 `FEEDBACK_STATUS_INVALID`。

#### Scenario: 回复待处理反馈

- **WHEN** 管理员直接回复 `PENDING` 反馈
- **THEN** 返回 200，状态为 `REPLIED`，回复内容和处理时间被保存

#### Scenario: 回复处理中反馈

- **WHEN** 管理员回复 `IN_PROGRESS` 反馈
- **THEN** 返回 200，状态为 `REPLIED`，时间线新增回复事件

#### Scenario: 回复内容去除首尾空白

- **WHEN** 管理员提交首尾带空白的合法回复
- **THEN** 返回 200，保存的回复内容已去除首尾空白

#### Scenario: 回复内容不合法

- **WHEN** 回复为空、去除空白后少于 5 字或超过 500 字
- **THEN** 返回 400 `INVALID_REQUEST`，反馈状态、回复内容和时间线不变

#### Scenario: 回复已处理反馈

- **WHEN** 管理员回复已回复或已关闭的反馈
- **THEN** 返回 409 `FEEDBACK_STATUS_INVALID`，不重复写事件或通知

#### Scenario: 回复不存在的反馈

- **WHEN** 管理员回复不存在的反馈 ID
- **THEN** 返回 404 `FEEDBACK_NOT_FOUND`

#### Scenario: 未授权回复

- **WHEN** 未登录用户或学生账号请求回复
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，反馈不变

### Requirement: 管理员关闭接口

admin SHALL 通过 `POST /api/v1/admin/feedback/{id}/close` 关闭反馈，请求体为 `{ conclusion }`。`conclusion` 去除首尾空白后 SHALL 为 5–500 字，否则返回 400 `INVALID_REQUEST`。仅 `IN_PROGRESS` 或 `REPLIED` 状态 SHALL 成功：状态变为 `CLOSED`，记录处理人和处理时间，追加包含结论的处理事件、操作审计并通知学生，返回 200。反馈不存在 SHALL 返回 404；待处理或已关闭 SHALL 返回 409 `FEEDBACK_STATUS_INVALID`。

#### Scenario: 关闭处理中反馈

- **WHEN** 管理员填写合法结论并关闭 `IN_PROGRESS` 反馈
- **THEN** 返回 200，状态为 `CLOSED`，时间线新增关闭事件

#### Scenario: 关闭已回复反馈

- **WHEN** 管理员关闭 `REPLIED` 反馈
- **THEN** 返回 200，状态为 `CLOSED`，原回复内容保留

#### Scenario: 关闭待处理反馈

- **WHEN** 管理员关闭 `PENDING` 反馈
- **THEN** 返回 409 `FEEDBACK_STATUS_INVALID`，状态不变

#### Scenario: 重复关闭反馈

- **WHEN** 管理员再次关闭已关闭反馈
- **THEN** 返回 409 `FEEDBACK_STATUS_INVALID`，不重复写事件或通知

#### Scenario: 关闭结论不合法

- **WHEN** 结论为空、去除空白后少于 5 字或超过 500 字
- **THEN** 返回 400 `INVALID_REQUEST`，反馈状态和时间线不变

#### Scenario: 关闭不存在的反馈

- **WHEN** 管理员关闭不存在的反馈 ID
- **THEN** 返回 404 `FEEDBACK_NOT_FOUND`

#### Scenario: 未授权关闭

- **WHEN** 未登录用户或学生账号请求关闭
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，反馈不变

### Requirement: 反馈状态流转与时间线唯一性

反馈状态 SHALL 只允许 `PENDING` → `IN_PROGRESS`、`PENDING` → `REPLIED`、`IN_PROGRESS` → `REPLIED`、`IN_PROGRESS` → `CLOSED` 和 `REPLIED` → `CLOSED`。`CLOSED` SHALL 为终态。每次成功状态转换 SHALL 追加一条包含前状态、后状态、说明、操作人和发生时间的事件；失败或重复操作 SHALL NOT 追加事件或重复通知。

#### Scenario: 完整处理时间线

- **WHEN** 反馈依次经历提交、开始处理、回复和关闭
- **THEN** 时间线按发生顺序包含四个事件，前后状态连续

#### Scenario: 失败操作不写时间线

- **WHEN** 管理员对已关闭反馈执行回复或关闭
- **THEN** 返回 409，时间线长度和通知次数不变

#### Scenario: 已关闭反馈只读

- **WHEN** 管理员查看已关闭反馈
- **THEN** 不提供开始处理、回复或关闭操作

### Requirement: 反馈状态与类型文案

管理端 SHALL 将 `PENDING`、`IN_PROGRESS`、`REPLIED`、`CLOSED` 显示为“待处理”“处理中”“已回复”“已关闭”，将 `PLANT_ISSUE`、`ACCOUNT_ISSUE`、`REWARD_ISSUE`、`OTHER` 显示为“绿植问题”“账号问题”“奖励问题”“其他”。未知状态或类型 SHALL 显示原始值，而不是空白或报错。

#### Scenario: 已知状态与类型

- **WHEN** 管理员查看反馈列表或详情
- **THEN** 状态和类型显示对应中文文案

#### Scenario: 未知值回退

- **WHEN** 接口返回未识别的状态或类型
- **THEN** 页面显示原始值，其他反馈仍正常展示

### Requirement: 页面反馈列表

admin SHALL 在 `/feedback` 显示反馈列表，列包含反馈编号、学生、问题类型、关联业务、提交时间、处理状态和操作。学生姓名和学号 SHALL 通过账号目录按学生账号 ID 关联，缺失时回退学生邮箱。筛选 SHALL 支持关键词、类型、状态和提交日期，点击“查询”生效，“重置”恢复默认；列表每页 10 条并显示总数。`?status=` SHALL 可带入合法状态筛选。

#### Scenario: 反馈默认列表

- **WHEN** 管理员访问 `/feedback`
- **THEN** 按创建时间倒序、ID 倒序显示反馈，学生列显示姓名和学号或邮箱

#### Scenario: 筛选反馈

- **WHEN** 管理员输入关键词或选择类型、状态、提交日期并点击“查询”
- **THEN** 只显示匹配反馈，分页回到第一页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、类型、状态和日期恢复默认，列表显示全部反馈

#### Scenario: 状态深链

- **WHEN** 管理员访问 `/feedback?status=PENDING`
- **THEN** 页面打开时状态筛选为“待处理”，只显示待处理反馈

#### Scenario: 反馈分页

- **WHEN** 反馈或筛选结果超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数并可切换下一页

#### Scenario: 学生目录加载失败

- **WHEN** 反馈请求成功但账号目录请求失败
- **THEN** 反馈仍显示，学生列回退邮箱，并提示学生资料暂不可用

### Requirement: 页面反馈详情与处理操作

管理员点击“详情”SHALL 打开反馈详情抽屉，展示反馈编号、学生、类型、关联业务、描述、最多 3 张图片、回复内容、处理人和处理时间线。待处理 SHALL 提供“开始处理”和“回复”；处理中 SHALL 提供“回复”和“关闭”；已回复 SHALL 提供“关闭”；已关闭 SHALL 只读。回复和关闭结论去除首尾空白后 SHALL 为 5–500 字；关闭前 SHALL 二次确认。操作成功后 SHALL 刷新列表和详情，并显示中文结果提示。

#### Scenario: 查看反馈详情

- **WHEN** 管理员点击某条反馈的“详情”
- **THEN** 抽屉展示描述、图片、关联业务和完整处理时间线

#### Scenario: 开始处理

- **WHEN** 管理员在详情中点击“开始处理”
- **THEN** 状态更新为“处理中”，列表和详情刷新

#### Scenario: 回复学生

- **WHEN** 管理员填写合法回复并提交
- **THEN** 状态更新为“已回复”，详情显示回复内容和新的时间线事件

#### Scenario: 关闭反馈

- **WHEN** 管理员填写合法结论并在二次确认中确认
- **THEN** 状态更新为“已关闭”，详情显示关闭事件

#### Scenario: 回复或结论不合法

- **WHEN** 回复或结论为空、去除空白后少于 5 字或多于 500 字
- **THEN** 弹窗保持打开并显示中文错误，不发送请求

#### Scenario: 重复提交操作

- **WHEN** 管理员连续点击开始处理、回复或关闭按钮
- **THEN** 接口最多提交一次，提交期间按钮显示加载并禁用

#### Scenario: 状态冲突

- **WHEN** 操作返回 409 `FEEDBACK_STATUS_INVALID`
- **THEN** 页面提示状态已变化并刷新列表和详情，不显示成功提示

#### Scenario: 操作后保持详情

- **WHEN** 回复或关闭成功
- **THEN** 详情抽屉保持打开并展示最新状态，操作弹窗关闭

### Requirement: 反馈页面空态、失败与窄屏

反馈页面加载中 SHALL 显示加载状态；空数据 SHALL 显示中文空态和刷新入口；列表失败 SHALL 显示中文错误和“重试”；详情失败 SHALL 显示中文错误和“重试”，不显示空的成功状态。视口小于 992px 时页面 SHALL NOT 产生横向滚动，表格 SHALL 在内容区内部滚动；320px 下详情抽屉和操作弹窗 SHALL 可完整查看和提交。

#### Scenario: 反馈列表加载失败

- **WHEN** 反馈列表请求失败
- **THEN** 页面显示中文错误和“重试”，保留页面标题和筛选区

#### Scenario: 反馈详情加载失败

- **WHEN** 反馈详情请求失败
- **THEN** 抽屉显示中文错误和“重试”

#### Scenario: 空反馈

- **WHEN** 反馈接口返回空数组
- **THEN** 显示“暂无问题反馈”空态和刷新入口

#### Scenario: 窄屏适配

- **WHEN** 视口宽度为 320px
- **THEN** 页面不产生横向滚动，表格内部滚动，详情抽屉和操作弹窗可完整操作
