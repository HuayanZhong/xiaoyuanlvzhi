# admin-care Specification

## Purpose

定义管理端养护审核的完整可观察行为：管理员查看和筛选养护打卡、核对凭证版本与照片、通过并发放积分或驳回并说明原因；同时定义支撑这些操作的积分来源、证据完整性、养护间隔、重复打卡和并发审核约束。

## Requirements

### Requirement: 养护审核列表接口

admin SHALL 通过 `GET /api/v1/admin/care/checkins` 获取养护打卡列表，可选 `status` 查询参数，值为 `PENDING_REVIEW`、`APPROVED` 或 `REJECTED`。接口 SHALL 按创建时间倒序、ID 倒序返回全部记录，使用统一响应信封。未知状态 SHALL 返回 400 `INVALID_REQUEST`；未登录返回 401 `UNAUTHORIZED`，非管理员返回 403 `FORBIDDEN`。

#### Scenario: 获取全部打卡

- **WHEN** 管理员请求 `GET /api/v1/admin/care/checkins`
- **THEN** 服务端返回 200，`success=true`，`data` 为按 `createdAt` 倒序、同时间按 ID 倒序的打卡审核视图数组

#### Scenario: 按状态筛选

- **WHEN** 管理员请求 `GET /api/v1/admin/care/checkins?status=PENDING_REVIEW`
- **THEN** 服务端只返回状态为 `PENDING_REVIEW` 的打卡

#### Scenario: 未知状态

- **WHEN** 管理员请求 `GET /api/v1/admin/care/checkins?status=UNKNOWN`
- **THEN** 服务端返回 400，`error.code=INVALID_REQUEST`，不返回空数组冒充成功

#### Scenario: 未授权访问

- **WHEN** 请求未携带有效 Bearer token，或携带学生账号 token
- **THEN** 服务端分别返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 养护审核详情与操作记录接口

admin SHALL 通过 `GET /api/v1/admin/care/checkins/{id}` 获取单条打卡的完整审核视图，并通过 `GET /api/v1/admin/care/checkins/{id}/events` 获取按时间升序排列的审核操作记录。打卡不存在时 SHALL 返回 404 `CARE_CHECKIN_NOT_FOUND`；未登录或非管理员 SHALL 返回 401/403。

#### Scenario: 获取详情

- **WHEN** 管理员请求存在打卡的详情
- **THEN** 服务端返回 200 和该打卡的审核视图，包含学生、单株、品种、积分、凭证版本和重复待审信息

#### Scenario: 获取操作记录

- **WHEN** 管理员请求 `GET /api/v1/admin/care/checkins/{id}/events`
- **THEN** 服务端返回 200，`data` 为按 `createdAt` 升序排列的审核事件，包含操作类型、前后状态、原因、操作人邮箱/姓名和时间

#### Scenario: 打卡不存在

- **WHEN** 管理员请求不存在的打卡 ID
- **THEN** 服务端返回 404，`error.code=CARE_CHECKIN_NOT_FOUND`

#### Scenario: 非管理员访问详情

- **WHEN** 学生账号请求管理端详情或操作记录
- **THEN** 服务端返回 403 `FORBIDDEN`

### Requirement: 管理端打卡审核视图

管理端打卡视图 SHALL 包含学生姓名、学号、账号状态和邮箱，单株编号、展示名、位置和状态，品种名称、养护间隔、光照和浇水说明，上次通过时间，待发积分及来源，最新凭证是否有证据，是否存在同株重复待审，以及每个凭证版本的说明、图片、状态、驳回原因、审核人姓名/邮箱、提交/审核时间和实际发放积分。可选字段缺失 SHALL 返回 null 或空数组，必需字段不得省略。

#### Scenario: 返回完整审核字段

- **WHEN** 打卡关联的学生、单株和品种资料存在
- **THEN** 审核视图同时返回学生姓名/学号/账号状态、单株状态、品种名称与养护说明、上次通过时间、待发积分及来源

#### Scenario: 可选字段缺失

- **WHEN** 打卡没有照片、驳回原因、上次通过时间或实际发放积分
- **THEN** 对应字段返回空数组或 null，页面显示“—”或空态，不伪造数据

#### Scenario: 已通过凭证的实际积分

- **WHEN** 某个凭证版本已通过并生成积分流水
- **THEN** 该版本返回实际发放积分；未通过版本返回 null

#### Scenario: 待审凭证的预计积分

- **WHEN** 打卡处于待审核且最新凭证待审
- **THEN** 审核视图返回按当前有效积分来源计算的待发积分和来源标识

### Requirement: 审核通过

admin SHALL 通过 `POST /api/v1/admin/care/checkins/{id}/approve` 通过待审核打卡，无请求体。服务端 SHALL 在行锁内校验打卡和最新凭证均为 `PENDING_REVIEW`、最新凭证有证据、无同株重复待审、养护间隔已到、积分来源有效；通过后 SHALL 只写一条积分流水，更新状态，通知学生并记录审核操作。成功 SHALL 返回更新后的审核视图。

#### Scenario: 通过成功

- **WHEN** 管理员通过对满足全部条件的打卡
- **THEN** 服务端返回 200，打卡和最新凭证变为 `APPROVED`，生成一条积分流水，学生收到通知，审核事件新增一条通过记录

#### Scenario: 状态已变化

- **WHEN** 打卡或最新凭证已不是 `PENDING_REVIEW`
- **THEN** 服务端返回 409 `CARE_STATUS_INVALID` 或 `CARE_SUBMISSION_ALREADY_REVIEWED`，不更新状态、不发积分

#### Scenario: 证据缺失

- **WHEN** 最新凭证的说明为空白且没有图片
- **THEN** 服务端返回 409 `CARE_EVIDENCE_REQUIRED`，不通过、不发积分

#### Scenario: 养护间隔未到

- **WHEN** 距上次通过或交接时间未达到品种养护间隔
- **THEN** 服务端返回 409 `CARE_INTERVAL_NOT_REACHED`，不通过、不发积分

#### Scenario: 同株存在重复待审

- **WHEN** 同一学生同一单株存在另一条 `PENDING_REVIEW` 打卡
- **THEN** 服务端返回 409 `CARE_CHECKIN_DUPLICATE`，不通过

#### Scenario: 积分未配置

- **WHEN** `CARE_CHECKIN` 规则和品种 `carePoints` 都没有大于 0 的有效积分
- **THEN** 服务端返回 409 `CARE_POINTS_UNCONFIGURED`，不通过

#### Scenario: 积分频控已达上限

- **WHEN** 学生本周期已达到启用的 `CARE_CHECKIN` 规则发放次数上限
- **THEN** 服务端返回 409 `POINTS_FREQUENCY_LIMIT`，打卡保持待审核且不生成流水

#### Scenario: 重复通过不重复发分

- **WHEN** 同一凭证版本被重复提交通过请求
- **THEN** 最多生成一条积分流水；后续请求返回状态冲突，不重复发分

### Requirement: 审核驳回

admin SHALL 通过 `POST /api/v1/admin/care/checkins/{id}/reject` 驳回待审核打卡，请求体为 `{ "reason": string }`。原因去除首尾空白后 SHALL 为 5–200 字；不满足返回 400 `INVALID_REQUEST`。服务端 SHALL 校验打卡和最新凭证均为 `PENDING_REVIEW`，成功后更新状态、保存原因、通知学生并记录审核操作，不产生积分流水。

#### Scenario: 驳回成功

- **WHEN** 管理员填写合法原因并驳回待审核打卡
- **THEN** 服务端返回 200，打卡和最新凭证变为 `REJECTED`，原因保存，学生收到通知，审核事件新增一条驳回记录

#### Scenario: 原因长度不合法

- **WHEN** 去除首尾空白后的原因为 4 字、201 字或纯空白
- **THEN** 服务端返回 400 `INVALID_REQUEST`，不更新状态

#### Scenario: 原因前后有空格

- **WHEN** 原因为 `"  照片不清晰，请重新上传  "`
- **THEN** 服务端按去除首尾空白后的内容校验并保存，不把空格计入长度

#### Scenario: 驳回已处理记录

- **WHEN** 打卡或最新凭证已不是 `PENDING_REVIEW`
- **THEN** 服务端返回 409，不覆盖已有审核结果、不发送成功通知

#### Scenario: 请求体缺失

- **WHEN** 请求缺少 `reason` 或 JSON 格式错误
- **THEN** 服务端返回 400 `INVALID_REQUEST`

### Requirement: 证据完整性

学生提交或重新提交养护打卡时 SHALL 至少提供去除首尾空白后非空的说明，或至少一张图片；否则 SHALL 返回 400 `CARE_EVIDENCE_REQUIRED`。管理员通过打卡时 SHALL 复核最新凭证的证据完整性；历史空证据记录 SHALL 返回 409 `CARE_EVIDENCE_REQUIRED`，但仍可驳回。

#### Scenario: 仅填写说明

- **WHEN** 学生提交说明非空、图片为空的打卡
- **THEN** 服务端接受提交并进入 `PENDING_REVIEW`

#### Scenario: 仅上传图片

- **WHEN** 学生提交说明为空、至少一张合法图片的打卡
- **THEN** 服务端接受提交并进入 `PENDING_REVIEW`

#### Scenario: 说明和图片都为空

- **WHEN** 学生提交说明为空白且图片为空的打卡
- **THEN** 服务端返回 400 `CARE_EVIDENCE_REQUIRED`，不创建打卡

#### Scenario: 历史空证据记录

- **WHEN** 管理员尝试通过一条说明和图片都为空的既有打卡
- **THEN** 服务端返回 409 `CARE_EVIDENCE_REQUIRED`，但允许驳回并填写原因

### Requirement: 养护间隔与交接基线

养护间隔 SHALL 以最近一次审核通过时间为基线；首次打卡 SHALL 以管理员确认交接时间为基线。未到下次可打卡时间时，提交 SHALL 返回 409 `CARE_INTERVAL_NOT_REACHED`，审核通过 SHALL 再次校验并返回同一错误。可打卡绿植接口 SHALL 返回基于同一基线的下次可打卡时间。

#### Scenario: 交接后立即提交

- **WHEN** 管理员刚确认交接，学生立即尝试打卡
- **THEN** 服务端返回 409 `CARE_INTERVAL_NOT_REACHED`，并返回下次可打卡时间

#### Scenario: 间隔到期后提交

- **WHEN** 当前时间已达到交接时间或上次通过时间加品种养护间隔
- **THEN** 服务端接受提交并进入待审核

#### Scenario: 通过时发现间隔未到

- **WHEN** 打卡创建后，同株已有更近的通过记录导致间隔未到
- **THEN** 服务端返回 409 `CARE_INTERVAL_NOT_REACHED`，不通过、不发积分

#### Scenario: 可打卡绿植的到期时间

- **WHEN** 学生查询可打卡绿植
- **THEN** 每株返回基于交接或上次通过时间计算的下次可打卡时间和当前是否可打卡

### Requirement: 重复打卡防护

同一学生同一单株 SHALL 最多存在一条 `PENDING_REVIEW` 打卡；重新提交 SHALL 拒绝同株其他待审或已通过打卡；通过 SHALL 再次检查重复。违反时 SHALL 返回 409 `CARE_CHECKIN_DUPLICATE`。数据库 SHALL 以唯一约束作为最终兜底。

#### Scenario: 新建重复待审

- **WHEN** 同一学生同一单株已有待审核打卡，学生再次新建
- **THEN** 服务端返回 409 `CARE_CHECKIN_DUPLICATE`，不创建第二条待审记录

#### Scenario: 驳回后新建再重提旧记录

- **WHEN** 旧打卡被驳回后，学生新建打卡并已通过，再重提旧记录
- **THEN** 服务端返回 409 `CARE_CHECKIN_DUPLICATE`，不产生第二个有效奖励

#### Scenario: 通过时发现重复

- **WHEN** 管理员通过时同株存在另一条待审或已通过记录
- **THEN** 服务端返回 409 `CARE_CHECKIN_DUPLICATE`，不通过

#### Scenario: 数据库唯一约束兜底

- **WHEN** 并发请求绕过应用层检查
- **THEN** 数据库唯一约束拒绝第二条待审记录，接口返回 409 而不是 500

### Requirement: 积分来源与预览

养护积分 SHALL 优先使用启用、已生效且积分大于 0 的 `CARE_CHECKIN` 规则；否则使用品种 `carePoints`；两者都无有效积分时来源为 `NONE`。审核视图 SHALL 返回 `pendingPoints` 和 `pointsSource`（`RULE`、`SPECIES` 或 `NONE`）。来源为 `NONE` 时通过 SHALL 返回 409 `CARE_POINTS_UNCONFIGURED`；已通过凭证 SHALL 返回实际发放积分。频控上限返回 409 `POINTS_FREQUENCY_LIMIT`。

#### Scenario: 启用规则优先

- **WHEN** 存在启用、已生效且积分大于 0 的 `CARE_CHECKIN` 规则
- **THEN** 待发积分使用规则积分，`pointsSource=RULE`，通过后按该积分发放

#### Scenario: 品种积分兜底

- **WHEN** 没有有效规则，但品种 `carePoints` 大于 0
- **THEN** 待发积分使用品种积分，`pointsSource=SPECIES`，通过后按该积分发放

#### Scenario: 两种来源都不可用

- **WHEN** 没有有效规则且品种 `carePoints` 不大于 0
- **THEN** `pendingPoints=0`、`pointsSource=NONE`，通过返回 409 `CARE_POINTS_UNCONFIGURED`

#### Scenario: 频控上限

- **WHEN** 启用规则设置了本周期发放上限且学生已达到上限
- **THEN** 通过返回 409 `POINTS_FREQUENCY_LIMIT`，打卡保持待审核

#### Scenario: 已通过凭证返回实际积分

- **WHEN** 凭证版本已通过并生成积分流水
- **THEN** 审核视图返回该版本的实际发放积分，页面不以预计值冒充

### Requirement: 并发与幂等审核

审核通过、驳回和重新提交 SHALL 在打卡行锁内执行；并发审核同一打卡时只能有一个操作成功，另一个 SHALL 返回 409 `CARE_STATUS_INVALID` 或 `CARE_SUBMISSION_ALREADY_REVIEWED`。同一凭证版本重复通过 SHALL NOT 重复生成积分流水。

#### Scenario: 两个管理员同时通过

- **WHEN** 两个管理员同时通过同一打卡
- **THEN** 一个请求成功，另一个返回 409；最终只有一条积分流水和一条通过审核事件

#### Scenario: 通过和驳回并发

- **WHEN** 一个管理员通过、另一个同时驳回
- **THEN** 最终状态只保留先完成操作的结果；不会出现“已驳回但已发积分”或“已通过但凭证被驳回”

#### Scenario: 重新提交和审核并发

- **WHEN** 学生重新提交与管理员审核同时发生
- **THEN** 行锁串行化两个操作；失败方收到状态冲突并刷新，不产生混合状态

### Requirement: 页面列表与筛选

admin SHALL 在 `/care-reviews` 显示养护审核列表，包含打卡编号、学生、学号、单株、品种、提交时间、说明摘要、状态、预计积分和操作。列表 SHALL 默认按创建时间倒序、每页 10 条并在客户端分页；状态 SHALL 使用中文文案。筛选 SHALL 支持关键词、状态、品种和提交日期范围，点击“查询”生效，“重置”恢复默认；`?status=` SHALL 作为初始状态筛选，非法值忽略。

#### Scenario: 查看列表

- **WHEN** 管理员访问 `/care-reviews`
- **THEN** 页面请求养护审核列表并按创建时间倒序显示打卡编号、学生、学号、单株、品种、提交时间、说明摘要、状态、预计积分和操作

#### Scenario: 关键词筛选

- **WHEN** 管理员输入学生姓名、学号、打卡编号或单株编号的一部分并点击“查询”
- **THEN** 列表只显示匹配关键词的记录，分页重置到第一页

#### Scenario: URL 初始状态

- **WHEN** 管理员访问 `/care-reviews?status=PENDING_REVIEW`
- **THEN** 状态筛选初始为“待审核”，列表只显示待审核打卡

#### Scenario: 组合筛选

- **WHEN** 管理员同时选择状态、品种和提交日期范围并点击“查询”
- **THEN** 列表只显示同时满足条件的记录

#### Scenario: 客户端分页

- **WHEN** 筛选后的记录超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数并可切换到下一页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、状态、品种和日期范围恢复默认，列表显示全部记录并回到第一页

### Requirement: 页面详情与版本

点击“查看” SHALL 打开详情抽屉并请求详情与操作记录接口，显示学生、单株、品种、养护说明、状态、时间、上次通过时间、最新凭证说明/照片、所有凭证版本和审核操作记录。照片 SHALL 可预览；版本 SHALL 按版本号升序并标注最新版本；详情或操作记录失败 SHALL 显示中文错误和重试入口，操作记录失败 SHALL NOT 阻塞详情主体。

#### Scenario: 打开详情

- **WHEN** 管理员点击某条打卡的“查看”
- **THEN** 抽屉显示学生、单株、品种、养护说明、状态、时间、上次通过时间、最新凭证和审核操作记录

#### Scenario: 凭证版本历史

- **WHEN** 打卡有多个凭证版本
- **THEN** 抽屉按版本号升序显示每个版本的说明、照片、提交时间、状态、驳回原因、审核人和审核时间，并标注最新版本

#### Scenario: 照片预览

- **WHEN** 凭证包含图片
- **THEN** 页面显示缩略图，点击可放大预览；图片加载失败显示失败占位而不是永久骨架

#### Scenario: 操作记录失败降级

- **WHEN** 详情加载成功但操作记录请求失败
- **THEN** 详情主体仍显示，操作记录区域显示中文错误和重试入口

#### Scenario: 详情加载失败

- **WHEN** 详情请求失败
- **THEN** 抽屉显示中文错误和“重试”按钮，点击后重新请求

### Requirement: 页面审核交互与防御

只有 `PENDING_REVIEW` 且最新凭证待审、有证据、无重复待审、积分来源有效的记录 SHALL 显示可用“通过”；通过前 SHALL 二次确认并展示学生、单株和预计积分。驳回 SHALL 复用原因弹窗，去除首尾空白后 5–200 字。操作进行中 SHALL 禁用按钮；收到状态冲突 SHALL 刷新详情和列表，不乐观改写状态。

#### Scenario: 通过成功

- **WHEN** 管理员在满足条件的记录上确认通过
- **THEN** 页面显示成功提示，详情和列表刷新为服务端返回的已通过状态，并显示实际发放积分或“以积分流水为准”

#### Scenario: 驳回成功

- **WHEN** 管理员填写合法原因并确认驳回
- **THEN** 页面显示成功提示，详情和列表刷新为已驳回，详情显示驳回原因

#### Scenario: 证据缺失时禁用通过

- **WHEN** 最新凭证没有说明也没有图片
- **THEN** 通过按钮禁用并提示“证据缺失，请驳回并让学生补充”，驳回仍可用

#### Scenario: 重复待审时禁用通过

- **WHEN** 同一学生同一单株存在另一条待审核打卡
- **THEN** 通过按钮禁用并提示先处理重复记录，仍可驳回

#### Scenario: 积分来源不可用时禁用通过

- **WHEN** 服务端返回 `pointsSource=NONE` 或待发积分不大于 0
- **THEN** 通过按钮禁用并提示“未配置养护积分”，仍可驳回

#### Scenario: 状态冲突

- **WHEN** 审核请求返回 409 状态冲突或凭证已处理
- **THEN** 页面提示“记录已被处理/状态已变化”，刷新详情和列表，不显示审核成功

#### Scenario: 已处理记录只读

- **WHEN** 打卡状态为 `APPROVED` 或 `REJECTED`
- **THEN** 页面不显示通过/驳回按钮，只能查看详情、凭证版本和审核记录

### Requirement: 空态、失败与响应式

列表加载中 SHALL 显示加载状态；空列表 SHALL 显示中文空态并提供刷新、清空筛选或返回工作台入口；主列表失败 SHALL 显示中文错误和重试；详情失败 SHALL 在详情内重试。视口小于 992px 时页面 SHALL NOT 产生横向滚动，表格在内容区内部滚动，抽屉和弹窗适配窄屏，320px 下可完成查看、通过和驳回。

#### Scenario: 空列表

- **WHEN** 当前筛选没有匹配记录
- **THEN** 列表显示中文空态和刷新/清空筛选/返回工作台入口，不显示错误页

#### Scenario: 列表加载失败

- **WHEN** 养护审核列表请求失败
- **THEN** 页面显示中文错误和“重试”按钮，点击后重新请求

#### Scenario: 窄屏布局

- **WHEN** 视口宽度小于 992px
- **THEN** 页面本身不出现横向滚动，表格在内容区内部横向滚动，筛选区和抽屉底部按钮可完整操作

#### Scenario: 320px 审核

- **WHEN** 视口宽度为 320px
- **THEN** 管理员可打开详情、查看凭证、完成通过或驳回，按钮和弹窗不被裁切
