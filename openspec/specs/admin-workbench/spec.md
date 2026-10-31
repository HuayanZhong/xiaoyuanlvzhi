# admin-workbench Specification

## Purpose

定义管理端工作台的可观察行为：汇总各业务模块的待办与资源状态，展示最近待处理记录和近 30 天趋势，并提供进入对应筛选列表的深链，让管理员从默认落地页直接开始处理。

## Requirements

### Requirement: 工作台加载与刷新

管理员访问 `/dashboard` 时，admin SHALL 显示加载状态并加载工作台数据；加载成功后 SHALL 展示计数卡片、最近待处理记录和趋势图。页面 SHALL 提供手动刷新；刷新期间 SHALL 防止重复触发，并 SHALL 保留当前可读内容直到新数据返回。

#### Scenario: 首次加载

- **WHEN** 已认证管理员访问 `/dashboard`
- **THEN** 页面显示加载状态，随后展示计数卡片、最近待处理记录和趋势图

#### Scenario: 手动刷新

- **WHEN** 管理员点击“刷新”
- **THEN** admin 重新请求工作台数据，刷新期间按钮显示加载状态且不能重复触发

#### Scenario: 加载失败

- **WHEN** 工作台主数据首次加载失败
- **THEN** 页面显示中文错误和“重试”入口，点击重试后重新请求

### Requirement: 工作台数据接口

admin SHALL 通过 `GET /api/v1/admin/dashboard` 获取 8 个计数和最近待处理记录，并通过 `GET /api/v1/admin/statistics`（不传日期）获取默认近 30 天趋势。两个接口 SHALL 返回统一响应信封（`success`、`data`、`error.code`、`error.message`）；401 SHALL 交给现有登录态处理，403、5xx、网络错误和超时 SHALL 转换为中文提示。

#### Scenario: 工作台接口成功

- **WHEN** `GET /api/v1/admin/dashboard` 返回 200 且 `success=true`
- **THEN** admin 使用 `data` 中的计数和最近记录渲染页面

#### Scenario: 统计接口默认日期

- **WHEN** admin 请求 `GET /api/v1/admin/statistics` 且不传日期
- **THEN** 服务端按最近 30 天返回 `from`、`to`、`adoptionTrend` 和 `pointGrantTrend`

#### Scenario: 未登录

- **WHEN** 工作台接口返回 401
- **THEN** admin 交给现有登录态处理，不把 401 渲染成普通业务错误

#### Scenario: 管理员权限不足

- **WHEN** 工作台接口返回 403
- **THEN** 页面显示中文权限提示，不展示伪造数据

### Requirement: 待办与资源计数

工作台 SHALL 展示 8 个计数卡片：待审核领养、待处理领养变更、待审核打卡、待审核任务、待领取奖励、待处理反馈、可领养绿植和在养绿植。计数 SHALL 来自 `GET /api/v1/admin/dashboard`，不得使用静态值或前端推算。

#### Scenario: 展示全部计数

- **WHEN** 工作台数据加载成功
- **THEN** 页面显示 8 个中文计数卡片，数值与接口字段一致

#### Scenario: 零值

- **WHEN** 某个计数为 0
- **THEN** 对应卡片显示 `0`，不隐藏卡片也不显示错误状态

#### Scenario: 无伪造待办

- **WHEN** 接口返回的计数和最近记录都为空
- **THEN** 页面显示真实的零值和空状态，不显示静态演示数据

### Requirement: 计数卡片深链

每张计数卡片 SHALL 可点击并导航到对应筛选列表；目标页面 SHALL 以 URL 查询参数作为初始筛选。待审核领养 SHALL 打开 `/adoptions?status=PENDING_REVIEW`；待处理领养变更 SHALL 打开 `/adoptions?status=CHANGES`；待审核打卡 SHALL 打开 `/care-reviews?status=PENDING_REVIEW`；待审核任务 SHALL 打开 `/tasks?tab=review&status=PENDING_REVIEW`；待领取奖励 SHALL 打开 `/points/orders?status=WAITING_PICKUP`；待处理反馈 SHALL 打开 `/feedback?status=PENDING`；可领养绿植 SHALL 打开 `/plants/instances?status=AVAILABLE`；在养绿植 SHALL 打开 `/plants/instances?status=ACTIVE`。

#### Scenario: 待审核领养

- **WHEN** 管理员点击“待审核领养”卡片
- **THEN** 导航到 `/adoptions?status=PENDING_REVIEW`，领养列表状态初始为“待审核”

#### Scenario: 待处理领养变更

- **WHEN** 管理员点击“待处理领养变更”卡片
- **THEN** 导航到 `/adoptions?status=CHANGES`，列表只显示取消审核中和归还审核中的申请

#### Scenario: 待审核任务

- **WHEN** 管理员点击“待审核任务”卡片
- **THEN** 导航到 `/tasks?tab=review&status=PENDING_REVIEW`，环保任务页打开“凭证审核”tab 并筛选待审核

#### Scenario: 资源计数

- **WHEN** 管理员点击“可领养绿植”或“在养绿植”卡片
- **THEN** 分别导航到 `/plants/instances?status=AVAILABLE` 或 `/plants/instances?status=ACTIVE`，单株列表应用对应状态初始筛选

### Requirement: 最近待处理记录

工作台 SHALL 展示最多 10 条最近待处理记录，包含业务类型、事项标题、学生、提交时间、状态和“去处理”操作。记录 SHALL 按提交时间倒序排列，并 SHALL NOT 展示已处理记录或伪造记录。没有记录时 SHALL 显示“当前没有待处理事项”。

#### Scenario: 展示最近记录

- **WHEN** 工作台接口返回最近待处理记录
- **THEN** 页面按提交时间倒序最多显示 10 条，并显示业务类型中文文案

#### Scenario: 去处理

- **WHEN** 管理员点击某条记录的“去处理”
- **THEN** 导航到该业务类型对应的筛选列表

#### Scenario: 空队列

- **WHEN** 最近待处理记录为空
- **THEN** 页面显示“当前没有待处理事项”，不显示空表格或错误页

#### Scenario: 超过十条

- **WHEN** 接口返回超过 10 条记录
- **THEN** 页面只展示时间最新的 10 条，不展示分页器

### Requirement: 近 30 天趋势图

工作台 SHALL 展示“绿植领养趋势”和“积分发放趋势”两张图表。绿植领养趋势 SHALL 使用折线图，积分发放趋势 SHALL 使用柱状图；两张图 SHALL 覆盖统计接口返回的每日数据点，并 SHALL 在悬停或聚焦时显示日期和数值。

#### Scenario: 领养趋势

- **WHEN** 统计接口返回 `adoptionTrend`
- **THEN** 页面按日期显示折线图，点的数值与接口每日值一致

#### Scenario: 积分发放趋势

- **WHEN** 统计接口返回 `pointGrantTrend`
- **THEN** 页面按日期显示柱状图，柱的数值与接口每日值一致

#### Scenario: 图表提示

- **WHEN** 管理员把指针移到某个数据点上
- **THEN** 图表显示该日期和对应数值的中文提示

#### Scenario: 无趋势数据

- **WHEN** 两张趋势图的所有每日值都为 0
- **THEN** 图表区域仍可渲染，并显示“近 30 天暂无数据”的中文提示

### Requirement: 趋势口径说明

每张趋势图 SHALL 在图表附近显示中文标题和计算口径。绿植领养趋势 SHALL 说明按领养关系进入“养护中”的日期统计；积分发放趋势 SHALL 说明只统计打卡和任务通过产生的奖励积分，不包含兑换退款、人工调整和冲正。

#### Scenario: 查看领养口径

- **WHEN** 管理员查看“绿植领养趋势”
- **THEN** 图表附近显示“按领养关系进入养护中的日期统计”

#### Scenario: 查看积分口径

- **WHEN** 管理员查看“积分发放趋势”
- **THEN** 图表附近说明不包含兑换退款、人工调整和冲正

### Requirement: 部分失败与重试

工作台主数据请求失败时 SHALL 显示整页中文错误和重试入口；仅趋势数据请求失败时 SHALL 保留计数卡片和最近待处理记录，并在图表区域显示中文错误和“重试趋势”入口。重试 SHALL 只重新请求失败的部分。

#### Scenario: 主数据失败

- **WHEN** `GET /api/v1/admin/dashboard` 失败
- **THEN** 页面显示整页中文错误和“重试”，不显示零值或伪造卡片

#### Scenario: 仅趋势失败

- **WHEN** 工作台主数据成功但统计接口失败
- **THEN** 计数卡片和最近记录保持可见，图表区域显示错误和“重试趋势”

#### Scenario: 重试趋势

- **WHEN** 管理员点击“重试趋势”
- **THEN** admin 只重新请求统计接口，成功后恢复两张图表

### Requirement: 响应式布局

工作台 SHALL 在桌面端合理排列卡片、最近记录和趋势图；视口宽度小于 992px 时 SHALL 改为纵向排列，计数卡片 SHALL 自适应列数。视口宽度为 320px 时，页面 SHALL NOT 产生横向滚动，最近记录表格 SHALL 在内容区内部横向滚动。

#### Scenario: 桌面端布局

- **WHEN** 管理员在宽度大于等于 992px 的视口查看工作台
- **THEN** 卡片、最近记录和趋势图完整显示，页面无横向滚动

#### Scenario: 窄屏布局

- **WHEN** 管理员在小于 992px 的视口查看工作台
- **THEN** 卡片、最近记录和趋势图纵向排列，页面无横向滚动

#### Scenario: 320px 视口

- **WHEN** 管理员在 320px 宽视口查看工作台
- **THEN** 卡片单列显示，最近记录在内容区内部横向滚动，图表宽度不超出内容区

### Requirement: 主题与可访问性

工作台 SHALL 使用 antd 设计 token 呈现文字、卡片、状态和图表颜色；亮色和暗色模式下 SHALL 保持可读，切换主题后图表 SHALL 无需刷新页面即可更新。计数卡片 SHALL 支持键盘聚焦和 Enter/Space 触发；图表 SHALL 提供可访问名称，不得只依赖颜色传达状态。

#### Scenario: 暗色模式

- **WHEN** 管理员切换到暗色模式
- **THEN** 卡片、最近记录和图表文字保持可读，图表背景和网格线跟随主题

#### Scenario: 键盘操作卡片

- **WHEN** 管理员使用 Tab 聚焦计数卡片并按 Enter 或 Space
- **THEN** 页面执行与鼠标点击相同的导航

#### Scenario: 图表可访问名称

- **WHEN** 辅助技术读取趋势图
- **THEN** 图表具有包含标题和统计范围的可访问名称
