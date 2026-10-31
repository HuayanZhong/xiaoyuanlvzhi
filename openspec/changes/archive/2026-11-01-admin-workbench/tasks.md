# Tasks

## 1. Spring 工作台查询加固

- [x] 1.1 为领养申请仓储增加“待审核 Top 10”和“变更审核 Top 10”查询，为养护打卡和反馈仓储增加“待处理 Top 10”查询；在对应适配器中按时间倒序、ID 倒序和常量 `LIMIT 10` 实现，并用适配器测试验证排序和条数。
- [x] 1.2 为任务凭证和兑换订单仓储增加“待处理/待领取 Top 10”查询；在适配器中按 `submittedAt`/`createdAt` 倒序、ID 倒序和常量 `LIMIT 10` 实现，并用适配器测试验证排序和条数。
- [x] 1.3 重构 `DashboardService.dashboard()`：使用计数和上述 Top N 查询，合并最近记录后按 `submittedAt` 倒序、`businessId` 倒序取前 10；新增 `DashboardServiceTest` 覆盖计数、排序、超过 10 条截断和空队列，运行 `cd ../backend && ./mvnw -Dtest=DashboardServiceTest test`。
- [x] 1.4 新增 `AdminDashboardControllerContractTest`，覆盖未登录 401、非管理员 403、成功响应的 8 个计数字段和 `recentItems`；运行 `cd ../backend && ./mvnw -Dtest=AdminDashboardControllerContractTest test`。
- [x] 1.5 运行 `cd ../backend && ./mvnw verify`，确认 Spotless、Checkstyle、全部服务测试和契约测试通过。

## 2. Spring 统计接口优化

- [x] 2.1 为 `DashboardService.statistics()` 注入 `Clock`，默认日期改用 `LocalDate.now(clock)`；新增测试覆盖默认近 30 天、显式日期范围和结束日期早于开始日期的 400 错误，运行 `cd ../backend && ./mvnw -Dtest=DashboardServiceTest test`。
- [x] 2.2 将统计接口中的积分流水查询合并为一次，并从同一结果计算 `pointsGranted` 和 `pointGrantTrend`；用 Mockito `verify(..., times(1))` 验证仓储只被调用一次。
- [x] 2.3 为任务参与仓储增加按任务结束时间范围查询的方法，替换 `statistics()` 中的全量 `findAll()`；补测试验证只统计任务结束时间落在区间内的参与记录。
- [x] 2.4 运行 `cd ../backend && ./mvnw verify`，确认统计接口路径、参数、响应字段和既有测试均未变化。

## 3. admin 图表基础设施

- [x] 3.1 在 `apps/admin/package.json` 添加 `echarts` 6.1.0 依赖，运行 `pnpm install`，再运行 `pnpm --filter admin check-types` 确认依赖可解析。
- [x] 3.2 新增 `apps/admin/src/components/common/EChart.tsx`：按需注册 `LineChart`、`BarChart`、`GridComponent`、`TooltipComponent`、`LegendComponent` 和 `CanvasRenderer`，负责 `init`、`setOption`、`ResizeObserver`、`dispose` 与可访问名称；用 mock `echarts/core` 的单元测试验证初始化、更新、尺寸变化和卸载清理。
- [x] 3.3 新增 `apps/admin/src/pages/dashboard/charts.ts`，实现领养趋势折线图和积分发放柱状图的纯函数 option 构建，接受显式 token 和每日数据；单元测试验证标题、日期、数值、图例和口径文案。
- [x] 3.4 新增 `apps/admin/src/api/dashboard.ts`，定义 `DashboardView`、`PendingItem`、`StatisticsView`、`DailyValue` 等类型和 `getDashboard()`、`getStatistics()`；API 测试验证请求路径、无日期参数和统一响应解析，运行 `pnpm --filter admin test -- dashboard`。

## 4. admin 工作台页面

- [x] 4.1 实现工作台计数卡片区域：8 个中文卡片、真实数值、加载态和零值展示；卡片支持鼠标和键盘触发导航，用页面测试验证每个卡片的目标路径。
- [x] 4.2 实现最近待处理记录：最多 10 条、业务类型中文文案、事项、学生、提交时间、状态和“去处理”；空队列显示“当前没有待处理事项”，用页面测试验证排序、截断、空态和导航。
- [x] 4.3 集成两张趋势图、刷新按钮和错误隔离：主数据失败显示整页重试，统计失败保留卡片和最近记录并显示“重试趋势”；页面测试 mock `EChart`，验证图表标题、数据传递和两种失败状态。
- [x] 4.4 用真实 `DashboardPage` 替换 `apps/admin/src/router/index.tsx` 中的 `/dashboard` 占位路由，更新路由测试和 `admin-login` 相关测试中断言占位页的用例；运行 `pnpm --filter admin test -- router`。
- [x] 4.5 处理 992px 与 320px 响应式布局和亮暗主题：卡片自适应列数、图表与最近记录纵向堆叠、表格内部横向滚动、主题切换后图表更新；用页面测试覆盖关键断言，并运行 `pnpm --filter admin lint && pnpm --filter admin check-types && pnpm --filter admin test`。
- [x] 4.6 更新 `README.md` 的 `/dashboard` 说明和 `docs/product/admin.md` 的工作台章节，写明计数、最近记录、两张趋势图、深链和口径说明；人工核对文档中的路径和字段与实现一致。

## 5. admin 跨模块深链

- [x] 5.1 为 `AdoptionsPage` 增加 `CHANGES` 组合筛选：类型、下拉选项、URL 解析、过滤逻辑和查询同步；单元测试验证 `/adoptions?status=CHANGES` 只显示取消审核中和归还审核中，且无效值回退全部。
- [x] 5.2 为 `OrdersPage` 增加 `?status=` 初始筛选和查询同步，使用现有订单状态白名单，无效值忽略；单元测试验证 `/points/orders?status=WAITING_PICKUP` 的初始状态和过滤结果。
- [x] 5.3 为 `InstancesPage` 增加 `?status=` 初始筛选，并与 `?speciesId=` 同时工作；单元测试验证单参数、双参数和无效状态回退。
- [x] 5.4 在工作台页面测试中断言 8 个卡片和最近记录的导航目标，覆盖领养、养护、任务、订单、反馈和单株库存的完整路径；运行 `pnpm --filter admin test`。

## 6. 集成与验收

- [x] 6.1 运行根目录 `pnpm verify`，确认 admin lint、format:check、check-types 和全部测试通过。
- [x] 6.2 运行 `cd ../backend && ./mvnw verify`，确认后端测试、Spotless 和 Checkstyle 通过。
- [x] 6.3 运行 `pnpm --filter admin build`，检查 ECharts 按需引入后的产物大小；若出现体积警告，将图表区域改为懒加载并重新验证构建。
- [x] 6.4 在浏览器中验证 1440×900：8 个卡片、最近记录、两张图、刷新、8 个深链、主数据失败重试、统计失败重试和暗色主题；记录控制台无错误。
- [x] 6.5 在浏览器中验证 320×800：卡片单列、图表不溢出、最近记录内部横向滚动、页面 `scrollWidth` 不超出视口；记录控制台无错误。
- [x] 6.6 运行 `openspec validate admin-workbench --strict`，确认变更和全部 delta spec 合法。

## Workflow follow-up

- 归档时同步 `admin-workbench` 新主规格，并更新 `admin-login` 主规格的 Purpose，使其不再描述“dashboard 占位页”。
- 归档前确认浏览器验证记录、后端与前端测试结果，以及 ECharts 构建体积检查结果。
