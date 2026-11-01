# Tasks

## 1. Spring 统计接口与口径

- [x] 1.1 为领养事件查询增加 `fromStatus` 和 `toStatus` 条件，只统计 `WAITING_PICKUP -> ACTIVE`；更新持久化适配器和相关测试，运行 `./mvnw -Dtest=AdminDashboardQueryAdapterTest test` 验证查询条件
- [x] 1.2 在 `DashboardService.statistics` 中实现日期归一化：都省略取近 30 天、只传 `from` 取至今天、只传 `to` 取前 30 天至 `to`，并保留 `from <= to` 和 367 天上限；在 `DashboardServiceTest` 覆盖五种输入并运行 `./mvnw -Dtest=DashboardServiceTest test`
- [x] 1.3 为学生积分排行增加按余额、最近正积分时间、账号 ID 排序的查询，最多 10 条；更新账号仓储适配器和适配器测试，运行相关测试验证排序 SQL 与条数
- [x] 1.4 修正 `DashboardDtos` 中 `participatingStudents`、任务完成数和完成率等字段描述；在 `AdminDashboardControllerContractTest` 增加统计接口 200、401、403、日期错误的契约测试并运行该测试类
- [x] 1.5 在 backend 目录运行 `./mvnw spotless:apply` 和 `./mvnw verify`，确认全量测试、Spotless 和 Checkstyle 通过

## 2. admin 数据与图表基础

- [x] 2.1 在 `apps/admin/package.json` 增加 `dayjs@1.11.23` 直接依赖并更新锁文件，运行 `pnpm install` 和 `pnpm --filter admin check-types` 验证依赖可解析
- [x] 2.2 将工作台图表构建函数和 `ChartTokens` 抽取到 `apps/admin/src/lib/charts.ts`，增加任务完成率构成图和积分排行横向条形图构建函数；更新工作台引用和图表测试，运行 `pnpm --filter admin test -- tests/unit/lib/charts.test.ts` 验证两种趋势图和两种新图的 option
- [x] 2.3 新建 `apps/admin/src/api/statistics.ts`，迁入统计类型和 `getStatistics(range?)`，仅在有完整范围时传 `searchParams`；工作台改为从该模块导入，新增 `tests/unit/api/statistics.test.ts` 覆盖无范围、带范围、信封失败并运行该测试
- [x] 2.4 更新 `DashboardPage`、仪表盘 fixtures 和测试的统计 API mock 到新模块，运行 `pnpm --filter admin test -- tests/unit/pages/dashboard/DashboardPage.test.tsx` 确认工作台行为不变

## 3. admin 数据统计页面

- [x] 3.1 实现 `apps/admin/src/pages/statistics/StatisticsPage.tsx`：日期范围选择器、查询/重置/刷新、4 个指标卡、4 张图、加载/失败/空态和窄屏布局；运行 `pnpm --filter admin check-types` 确认类型正确
- [x] 3.2 为统计页增加 `tests/unit/pages/statistics/StatisticsPage.test.tsx`，覆盖首次加载、指标卡值、四张图/口径说明、空态、失败重试和刷新防重复，运行该测试文件验证
- [x] 3.3 接入近 7/30/90 天快捷范围、未来日期禁用和 367 天前端校验；通过页面测试和后续浏览器验证确认查询与重置使用正确范围
- [x] 3.4 将 `/statistics` 路由改为真实页面，删除不再使用的 `PlaceholderPage` 及其测试，更新 `router.test.tsx`；运行 `pnpm --filter admin test -- tests/unit/router.test.tsx` 确认统计页不再是占位页
- [x] 3.5 更新 `README.md` 和 `docs/product/admin.md`，补充数据统计页面、指标口径、图表和空态说明，删除“数据统计占位页”描述；运行 `pnpm --filter admin format:check` 验证格式

## 4. 集成验证

- [x] 4.1 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types` 和 `pnpm --filter admin test`，确认 admin 全部检查通过
- [x] 4.2 运行根目录 `pnpm verify` 和 `pnpm --filter admin build`，确认多包校验与生产构建通过
- [x] 4.3 在浏览器中分别以 1440×900 和 320×800 验证 `/statistics`：默认范围、快捷范围、查询/重置、指标卡、四张图、空态、失败重试、暗色模式、无横向滚动、表格/图表不溢出；用 Chrome DevTools 检查控制台无错误
- [x] 4.4 使用已登录管理员会话检查 `GET /api/v1/admin/statistics` 的默认范围、指定范围、单日期参数和 401/403 行为，确认页面数字与接口返回一致且未泄露令牌或 Cookie

## Workflow follow-up

- 在代码审查和验证通过后同步 delta specs。
- 归档 `admin-statistics` 变更并核对归档摘要。
