# Proposal

## Why

`/dashboard` 是管理员登录后的默认落地页，但当前只渲染占位内容。与此同时，领养、养护、任务、奖励和反馈模块都已具备真实数据，管理员需要一个页面集中看到待办数量、最近待处理记录和近期趋势，并能直接进入对应列表处理。现在完成工作台，可以把已有模块串成“查看待办 → 进入列表 → 处理完成 → 返回工作台”的闭环，同时为后续数据统计页建立可复用的图表基础。

## What Changes

- 新增工作台页面：展示 8 个待办/资源计数卡片、最近 10 条待处理记录和近 30 天绿植领养/积分发放趋势图。
- 引入 `echarts` 6.1.0，在 admin 内建立按需注册、可复用、跟随亮暗主题的图表组件。
- 工作台卡片和最近记录提供筛选深链，落到领养、养护、任务、兑换订单、反馈和单株库存的对应状态。
- 为兑换订单、单株库存增加 `?status=` 深链；为领养管理增加 `CHANGES` 组合筛选，覆盖取消审核中和归还审核中。
- 修改 `admin-shell`：工作台不再属于占位模块，剩余占位模块为学生管理、资讯管理、数据统计。
- 修改 `admin-login`：`/dashboard` 不再是“只显示标题、不请求业务数据”的占位页，改为真实工作台落地页。
- 复用现有 `GET /api/v1/admin/dashboard` 和 `GET /api/v1/admin/statistics`，不新增对外 Spring 接口；后端内部将工作台待办查询收敛为 Top N，并消除统计接口中重复的积分流水查询。
- 更新 README 和 `docs/product/admin.md` 的工作台说明。

## Capabilities

### New Capabilities

- `admin-workbench`: 定义管理端工作台的计数卡片、最近待处理记录、趋势图、筛选深链、加载/空/失败状态、响应式与主题行为。

### Modified Capabilities

- `admin-shell`: “模块路由与占位页”要求中，工作台不再是占位页，占位模块减少为 3 个。
- `admin-login`: “Dashboard 工作台占位页”要求改为真实工作台落地页，保留登录后默认进入 `/dashboard` 和未登录重定向。
- `admin-adoptions`: “领养申请筛选”要求新增 `CHANGES` 组合筛选值，覆盖取消审核中和归还审核中。
- `admin-plants`: “单株筛选”要求新增 `status` 查询参数作为状态初始筛选，并与现有 `speciesId` 共存。
- `admin-rewards`: “页面兑换订单”要求新增 `status` 查询参数作为状态初始筛选。

## Impact

- `apps/admin`：新增工作台 API 客户端、工作台页面、ECharts 通用组件和图表 option 构建函数；修改路由、兑换订单/单株库存/领养管理三个列表页的状态深链；补充单元测试；新增 `echarts` 依赖。
- Spring 后端：`DashboardService` 使用 Top N 查询并补服务/契约测试；`statistics` 合并重复积分流水查询；接口路径、请求参数和响应字段保持不变。
- 文档：README、`docs/product/admin.md` 的工作台章节。
- 不涉及 `apps/web`、共享包、环境变量、认证流程或数据库结构；不需要提交新的 `.env` 文件。
