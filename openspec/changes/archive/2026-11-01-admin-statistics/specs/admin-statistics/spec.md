# Spec Delta

## Purpose

定义管理端数据统计页的可观察行为：按日期范围汇总领养、参与学生、任务完成率、积分发放和积分余额排行，用指标卡与图表帮助管理员量化校园环保参与成果。

## ADDED Requirements

### Requirement: 数据统计页面与加载

admin SHALL 在 `/statistics` 渲染后台壳内的数据统计页，包含日期范围筛选、4 个指标卡和 4 张图。首次进入 SHALL 显示加载状态，成功后显示服务端返回的数据；页面 SHALL 提供手动刷新，刷新期间按钮显示加载状态且不能重复触发。

#### Scenario: 访问数据统计

- **WHEN** 已认证管理员访问 `/statistics`
- **THEN** 页面显示后台壳和数据统计内容，不显示占位说明

#### Scenario: 首次加载

- **WHEN** 管理员首次进入数据统计页
- **THEN** 页面先显示加载状态，随后展示筛选区、指标卡和图表

#### Scenario: 手动刷新

- **WHEN** 管理员点击“刷新”
- **THEN** admin 重新请求最近一次已应用的范围，刷新期间按钮显示加载状态且不能重复触发

### Requirement: 日期范围筛选

统计页 SHALL 提供日期范围选择器，默认显示服务端返回的近 30 天范围；选择器 SHALL 提供近 7、30、90 天快捷范围，并禁止选择今天之后的日期。更改范围后 SHALL 在点击“查询”后重新请求，“重置” SHALL 恢复默认近 30 天并重新请求。范围超过 367 天时 SHALL 不发起请求并显示中文提示。

#### Scenario: 默认范围

- **WHEN** 管理员首次进入页面且未选择日期
- **THEN** 日期选择器显示服务端返回的 `from` 和 `to`，图表说明使用同一范围

#### Scenario: 应用范围

- **WHEN** 管理员选择新的起止日期并点击“查询”
- **THEN** admin 使用该范围请求统计接口，成功后页面数字和图表更新

#### Scenario: 重置范围

- **WHEN** 管理员点击“重置”
- **THEN** 日期选择器恢复默认近 30 天，页面重新请求默认范围

#### Scenario: 未来日期

- **WHEN** 管理员打开日期选择器
- **THEN** 今天之后的日期不可选择

#### Scenario: 范围过长

- **WHEN** 管理员选择的起止日期超过 367 天
- **THEN** 页面不发起请求，并显示“统计范围最多为 367 天”的中文提示

### Requirement: 指标卡

统计页 SHALL 展示 4 个指标卡：当前在养数、累计领养数、参与学生数、积分发放量。值 SHALL 来自统计接口，不得使用静态值或前端推算；当前在养数 SHALL 标注为当前快照，其余三项 SHALL 标注为所选日期范围口径；值为 0 时 SHALL 显示 `0`。

#### Scenario: 展示指标

- **WHEN** 统计接口成功返回
- **THEN** 4 个指标卡分别显示 `currentActivePlants`、`adoptionsStarted`、`participatingStudents` 和 `pointsGranted` 的值

#### Scenario: 零值

- **WHEN** 某个指标值为 0
- **THEN** 对应卡片显示 `0`，不隐藏卡片也不显示错误状态

#### Scenario: 当前快照标注

- **WHEN** 管理员查看“当前在养数”
- **THEN** 卡片说明该值不受日期范围影响，是当前时点的单株状态快照

### Requirement: 绿植领养趋势

统计页 SHALL 展示“绿植领养趋势”折线图，覆盖 `adoptionTrend` 的每个日期；悬停或聚焦 SHALL 显示日期和数值。图表附近 SHALL 说明按领养关系由待领取转为养护中的日期统计。所有每日值为 0 时 SHALL 保留图表并显示“所选范围内暂无领养数据”。

#### Scenario: 展示领养趋势

- **WHEN** 统计接口返回 `adoptionTrend`
- **THEN** 页面按日期显示折线图，点的数值与接口每日值一致

#### Scenario: 悬停提示

- **WHEN** 管理员把指针移到某个数据点或聚焦图表
- **THEN** 图表显示该日期和对应领养数的中文提示

#### Scenario: 空趋势

- **WHEN** `adoptionTrend` 的所有每日值都为 0
- **THEN** 图表区域显示“所选范围内暂无领养数据”

#### Scenario: 领养口径说明

- **WHEN** 管理员查看“绿植领养趋势”
- **THEN** 图表附近显示“按领养关系由待领取转为养护中的日期统计”

### Requirement: 任务完成率

统计页 SHALL 展示任务完成率及其构成：已通过凭证的参与记录数和未完成或未通过的参与记录数。完成率 SHALL 为已通过数除以已结束任务的参与记录数，以百分比显示并保留一位小数；分母为 0 时 SHALL 显示“—”，并说明所选范围内没有已结束的任务。

#### Scenario: 显示完成率

- **WHEN** `endedTaskParticipants` 大于 0
- **THEN** 页面显示 `completedTaskParticipants ÷ endedTaskParticipants` 的百分比和已通过、未完成或未通过的构成图

#### Scenario: 分母为零

- **WHEN** `endedTaskParticipants` 为 0
- **THEN** 完成率显示“—”，构成图显示“所选范围内没有已结束的任务”

#### Scenario: 构成图

- **WHEN** 统计接口同时返回已通过和未通过的参与记录数
- **THEN** 构成图的两段数值与接口字段一致，不只依赖颜色区分

#### Scenario: 任务口径说明

- **WHEN** 管理员查看任务完成率
- **THEN** 图表附近说明按任务参与记录统计，同一学生参加多个任务会分别计入

### Requirement: 积分发放趋势

统计页 SHALL 展示“积分发放趋势”柱状图，覆盖 `pointGrantTrend` 的每个日期；悬停或聚焦 SHALL 显示日期和积分值。图表附近 SHALL 说明只统计打卡和任务通过产生的奖励积分，不包含兑换退款、人工调整和冲正。所有每日值为 0 时 SHALL 显示“所选范围内暂无积分发放”。

#### Scenario: 展示积分趋势

- **WHEN** 统计接口返回 `pointGrantTrend`
- **THEN** 页面按日期显示柱状图，柱的数值与接口每日值一致

#### Scenario: 悬停提示

- **WHEN** 管理员把指针移到某个柱体或聚焦图表
- **THEN** 图表显示该日期和对应积分值的中文提示

#### Scenario: 空趋势

- **WHEN** `pointGrantTrend` 的所有每日值都为 0
- **THEN** 图表区域显示“所选范围内暂无积分发放”

#### Scenario: 积分口径说明

- **WHEN** 管理员查看“积分发放趋势”
- **THEN** 图表附近说明不包含兑换退款、人工调整和冲正

### Requirement: 积分余额排行

统计页 SHALL 展示“积分余额排行”横向条形图，最多 10 名学生，按当前积分余额倒序；同分 SHALL 按最近一次获得正积分的时间倒序，仍相同 SHALL 按账号 ID 升序。排行 SHALL 显示学生姓名、学号和余额，并说明按当前余额排序；没有数据时 SHALL 显示“暂无积分排行”。

#### Scenario: 展示前 10 名

- **WHEN** 统计接口返回 `pointRanking`
- **THEN** 页面按接口顺序展示最多 10 名学生的姓名、学号和当前余额

#### Scenario: 同分排序

- **WHEN** 多个学生的积分余额相同
- **THEN** 最近获得正积分时间更晚的学生排在前面；时间仍相同则账号 ID 更小的排在前面

#### Scenario: 空排行

- **WHEN** `pointRanking` 为空数组
- **THEN** 页面显示“暂无积分排行”，不显示空坐标轴

#### Scenario: 排行口径说明

- **WHEN** 管理员查看积分余额排行
- **THEN** 图表附近说明该排行按当前积分余额排序，并包含全部学生账号

### Requirement: 统计接口

admin SHALL 通过 `GET /api/v1/admin/statistics` 获取统计数据，可传 `from` 和 `to` 日期参数。成功 SHALL 返回 200 和统一响应信封；`data` SHALL 包含 `from`、`to`、`currentActivePlants`、`adoptionsStarted`、`participatingStudents`、`completedTaskParticipants`、`endedTaskParticipants`、`taskCompletionRate`、`pointsGranted`、`pointRanking`、`adoptionTrend` 和 `pointGrantTrend`。

#### Scenario: 按范围查询

- **WHEN** admin 请求 `GET /api/v1/admin/statistics?from=2026-10-01&to=2026-10-31`
- **THEN** 服务端返回 200，`data.from` 和 `data.to` 与请求一致，所有指标和趋势覆盖该范围

#### Scenario: 默认范围查询

- **WHEN** admin 请求 `GET /api/v1/admin/statistics` 且不传日期
- **THEN** 服务端按近 30 天返回 `from`、`to` 和全部统计字段

#### Scenario: 未登录

- **WHEN** 未认证请求访问统计接口
- **THEN** 服务端返回 401 和 `UNAUTHORIZED`，admin 交给现有登录态处理

#### Scenario: 权限不足

- **WHEN** 学生账号访问统计接口
- **THEN** 服务端返回 403 和 `FORBIDDEN`，admin 显示中文权限提示

### Requirement: 日期参数与错误

统计接口 SHALL 在 `from` 和 `to` 都省略时返回近 30 天；只传 `from` 时返回 `from` 至今天；只传 `to` 时返回 `to` 前 30 天至 `to`。`from` 晚于 `to` SHALL 返回 400 `DATE_RANGE_INVALID`；范围超过 367 天 SHALL 返回 400 `DATE_RANGE_TOO_LARGE`；日期格式非法 SHALL 返回 400 `INVALID_REQUEST`。

#### Scenario: 只传开始日期

- **WHEN** admin 请求 `GET /api/v1/admin/statistics?from=2026-10-01`
- **THEN** 服务端返回 `from=2026-10-01`，`to` 为服务端当天

#### Scenario: 只传结束日期

- **WHEN** admin 请求 `GET /api/v1/admin/statistics?to=2026-10-31`
- **THEN** 服务端返回 `to=2026-10-31`，`from` 为 `to` 前 30 天

#### Scenario: 起止日期颠倒

- **WHEN** `from` 晚于 `to`
- **THEN** 服务端返回 400 和 `DATE_RANGE_INVALID`

#### Scenario: 范围过长

- **WHEN** 起止日期跨度超过 367 天
- **THEN** 服务端返回 400 和 `DATE_RANGE_TOO_LARGE`

#### Scenario: 日期格式非法

- **WHEN** `from` 或 `to` 不是 `yyyy-MM-dd`
- **THEN** 服务端返回 400 和 `INVALID_REQUEST`

### Requirement: 累计领养口径

统计接口的 `adoptionsStarted` 和 `adoptionTrend` SHALL 只统计领养关系由 `WAITING_PICKUP` 转为 `ACTIVE` 的事件，同一领养关系 SHALL 最多计数一次；归还审核被拒绝后回到 `ACTIVE` SHALL NOT 再次计数。

#### Scenario: 交接计入

- **WHEN** 管理员确认线下交接，领养关系由 `WAITING_PICKUP` 变为 `ACTIVE`
- **THEN** 该领养关系在交接日期计入 `adoptionsStarted` 和 `adoptionTrend`

#### Scenario: 拒绝归还不重复计入

- **WHEN** 学生申请归还后管理员拒绝，领养关系由 `RETURN_REVIEW` 回到 `ACTIVE`
- **THEN** `adoptionsStarted` 和 `adoptionTrend` 不增加

#### Scenario: 趋势与累计一致

- **WHEN** 查询某个日期范围
- **THEN** `adoptionTrend` 的每日值之和等于 `adoptionsStarted`

### Requirement: 参与学生与任务完成口径

`participatingStudents` SHALL 统计所选范围内至少有一条审核通过打卡或任务凭证的去重学生数。`completedTaskParticipants` SHALL 统计所选范围内结束任务中凭证状态为 `APPROVED` 的参与记录数；`endedTaskParticipants` SHALL 统计这些任务的参与记录总数；同一学生参加多个任务 SHALL 分别计入任务完成统计。

#### Scenario: 参与学生去重

- **WHEN** 同一学生在所选范围内有多条审核通过的打卡或任务凭证
- **THEN** `participatingStudents` 只计数一次

#### Scenario: 任务记录计数

- **WHEN** 同一学生参加两个在所选范围内结束的任务
- **THEN** 两条参与记录分别计入 `completedTaskParticipants` 和 `endedTaskParticipants`

#### Scenario: 未通过计入分母

- **WHEN** 已结束任务的参与记录状态为 `JOINED`、`PENDING_REVIEW` 或 `REJECTED`
- **THEN** 该记录计入 `endedTaskParticipants`，但不计入 `completedTaskParticipants`

### Requirement: 积分发放口径

`pointsGranted` SHALL 为所选范围内 `CARE_CHECKIN` 和 `ECO_TASK` 来源的正积分流水之和；`pointGrantTrend` SHALL 按流水创建日期汇总同一口径。兑换退款、人工调整、冲正和其他来源 SHALL NOT 计入。

#### Scenario: 汇总奖励积分

- **WHEN** 所选范围内有打卡和任务通过产生的正积分流水
- **THEN** `pointsGranted` 等于这些流水积分之和

#### Scenario: 排除其他来源

- **WHEN** 所选范围内有兑换退款、人工调整、冲正或其他来源的积分流水
- **THEN** 这些流水不计入 `pointsGranted` 和 `pointGrantTrend`

#### Scenario: 趋势与总量一致

- **WHEN** 查询某个日期范围
- **THEN** `pointGrantTrend` 的每日值之和等于 `pointsGranted`

### Requirement: 加载失败与重试

统计请求失败时 SHALL 保留筛选区并显示中文错误和“重试”入口；重试 SHALL 重新请求最近一次已应用的范围。401 SHALL 交给现有登录态处理；403、5xx、网络错误和超时 SHALL 转换为中文提示，不得显示零值或伪造数据。

#### Scenario: 加载失败

- **WHEN** 统计请求返回 5xx 或网络错误
- **THEN** 页面显示中文错误和“重试”，不显示伪造的指标卡或图表

#### Scenario: 重试最近范围

- **WHEN** 管理员在失败后点击“重试”
- **THEN** admin 使用最近一次已应用的范围重新请求统计接口

#### Scenario: 未登录

- **WHEN** 统计请求返回 401
- **THEN** admin 交给现有登录态处理，不把 401 渲染成普通业务错误

#### Scenario: 权限不足

- **WHEN** 统计请求返回 403
- **THEN** 页面显示中文权限提示，不展示伪造数据

### Requirement: 空数据状态

统计接口返回全零或空数组时，页面 SHALL 显示真实的 0 值和各图表空态，不得显示静态演示数据；任务完成率分母为 0 时 SHALL 显示“—”，排行数组为空时 SHALL 显示“暂无积分排行”。

#### Scenario: 全零数据

- **WHEN** 接口返回的所有指标为 0 且趋势数组全为 0
- **THEN** 指标卡显示 0，趋势图显示对应空态，不显示错误页

#### Scenario: 空排行

- **WHEN** `pointRanking` 为空数组
- **THEN** 页面显示“暂无积分排行”

#### Scenario: 空趋势

- **WHEN** `adoptionTrend` 或 `pointGrantTrend` 为空数组
- **THEN** 对应图表显示空态说明，不渲染伪造数据点

### Requirement: 响应式布局

视口宽度大于等于 992px 时，指标卡 SHALL 多列排列，图表 SHALL 两列排列；小于 992px 时 SHALL 改为单列。视口宽度为 320px 时，页面 SHALL NOT 产生横向滚动，日期选择器、指标卡和图表 SHALL 适应内容区宽度。

#### Scenario: 桌面端布局

- **WHEN** 管理员在宽度大于等于 992px 的视口查看数据统计
- **THEN** 指标卡多列显示，图表两列显示，页面无横向滚动

#### Scenario: 窄屏布局

- **WHEN** 管理员在小于 992px 的视口查看数据统计
- **THEN** 指标卡和图表改为单列，页面无横向滚动

#### Scenario: 320px 视口

- **WHEN** 管理员在 320px 宽视口查看数据统计
- **THEN** 日期选择器、指标卡和图表不超出内容区宽度

### Requirement: 主题与可访问性

统计页 SHALL 使用 antd 设计 token 呈现文字、卡片、图表颜色和网格线，亮色与暗色模式 SHALL 保持可读；切换主题后图表 SHALL 无需刷新即可更新。图表 SHALL 提供包含标题和统计范围的可访问名称，日期选择器和按钮 SHALL 支持键盘操作，状态 SHALL NOT 只依赖颜色传达。

#### Scenario: 暗色模式

- **WHEN** 管理员切换到暗色模式
- **THEN** 指标卡、图表文字和网格线保持可读，图表颜色跟随主题

#### Scenario: 图表可访问名称

- **WHEN** 辅助技术读取图表
- **THEN** 图表具有包含标题和统计范围的可访问名称

#### Scenario: 键盘操作

- **WHEN** 管理员使用 Tab 和 Enter 操作日期选择器、查询和重置按钮
- **THEN** 可以完成范围选择和查询，不需要鼠标

#### Scenario: 非颜色表达

- **WHEN** 管理员查看任务完成率构成或排行
- **THEN** 文字、图例和数值同时表达状态，不只依赖颜色
