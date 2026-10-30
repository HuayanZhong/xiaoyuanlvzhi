# Tasks

## 1. 领养 API 与学生目录

- [x] 1.1 新增 `apps/admin/src/api/adoptions.ts`，定义申请状态、申请视图、状态事件和请求类型，实现 `listAdoptions()` 与 `getAdoption(id)`；运行 `pnpm --filter admin test -- tests/unit/api/adoptions.test.ts` 验证路径、方法和返回解包
- [x] 1.2 在同一模块实现 `approveAdoption(id, plantId)`、`rejectAdoption(id, reason)`、`confirmHandover(id)`、`decideCancel(id, approved, reason?)`、`decideReturn(id, approved, returnResult?, reason?)`；测试覆盖请求体字段和可选字段
- [x] 1.3 新增 `apps/admin/src/api/accounts.ts`，实现 `listStudents()` 并只声明列表展示需要的字段；运行 `pnpm --filter admin test -- tests/unit/api/accounts.test.ts` 验证 `GET /api/v1/admin/accounts`
- [x] 1.4 补充 API 错误用例：业务错误码、409、5xx 和网络错误都转换为 `ApiError`；由上述 API 测试覆盖

## 2. 列表、筛选与分页

- [x] 2.1 新增 `apps/admin/src/pages/adoptions/labels.ts`，提供 8 种状态的中文文案、Tag 颜色、筛选选项和归还结果文案；运行 `pnpm --filter admin check-types` 验证类型
- [x] 2.2 新增 `AdoptionsPage` 骨架，加载 `listAdoptions()` 与 `listStudents()`，实现加载态、失败重试、空态、10 条/页客户端分页和申请时间倒序；由页面测试覆盖
- [x] 2.3 实现列表列：申请编号、学生（姓名/学号/邮箱降级）、品种、单株、申请时间、状态和“查看”操作；测试覆盖学生映射和邮箱降级
- [x] 2.4 实现关键词、状态、品种和提交日期筛选，点击“查询”生效、“重置”恢复；日期范围使用两个 `Input type="date"`，按 `YYYY-MM-DD` 比较
- [x] 2.5 实现 `status` 查询参数的初始筛选与写回，无效值按“全部”处理；测试覆盖 `?status=PENDING_REVIEW` 和无效状态
- [x] 2.6 运行 `pnpm --filter admin test -- tests/unit/pages/adoptions/AdoptionsPage.test.tsx`，确认列表渲染、组合筛选、分页、空态、失败重试和学生映射用例通过

## 3. 详情抽屉与时间线

- [x] 3.1 新增 `AdoptionDetailDrawer`，打开时请求 `getAdoption(id)`，展示学生资料、品种、单株、备注、状态、截止时间、原因、归还结果和创建/更新时间
- [x] 3.2 在抽屉中渲染按时间排序的状态事件（前后状态、原因、时间），并处理未绑定单株的“未分配”展示
- [x] 3.3 为详情增加加载态、失败提示和“重试”；更新 `AdoptionsPage.test.tsx`，验证详情字段、时间线和重试

## 4. 审核通过并选株

- [x] 4.1 新增 `ApprovePlantModal`，打开时请求 `listIndividuals()`，只显示申请品种下状态为 `AVAILABLE` 的单株，支持关键词过滤和单行选择
- [x] 4.2 实现空库存状态和“去单株库存”入口（`/plants/instances?speciesId=<id>`），确认按钮在未选择或库存为空时禁用
- [x] 4.3 提交 `approveAdoption(id, plantId)`，处理 `PLANT_NOT_AVAILABLE`、`PLANT_SPECIES_DISABLED` 和 `ADOPTION_STATUS_INVALID` 的刷新与关闭逻辑
- [x] 4.4 补充页面测试：同品种可选、其他状态不出现、空库存、通过成功、单株被占用后刷新、状态冲突后刷新

## 5. 驳回、交接、取消与归还

- [x] 5.1 新增 `ReasonModal`（5–200 字、必填、保留输入），接入“驳回申请”并提交 `rejectAdoption`
- [x] 5.2 为“确认交接”增加 `Popconfirm` 二次确认，提交 `confirmHandover` 并刷新详情与列表
- [x] 5.3 实现取消审核操作：“同意取消”提交 `approved=true`，“拒绝取消”用 `ReasonModal` 提交 `approved=false` 和原因
- [x] 5.4 新增 `ReturnDecisionModal`，选择“重新开放领养 / 转入维护”后提交 `returnResult`；驳回归还复用 `ReasonModal`
- [x] 5.5 补充页面测试：驳回成功/原因過短、交接确认/取消、同意与拒绝取消、两种归还结果、驳回归还、提交中禁用
- [x] 5.6 运行 `pnpm --filter admin test -- tests/unit/pages/adoptions/AdoptionsPage.test.tsx`，确认所有状态操作与错误分支通过

## 6. 路由、文档与响应式

- [x] 6.1 更新 `apps/admin/src/router/index.tsx`，把 `/adoptions` 的占位页替换为 `AdoptionsPage`；运行 `pnpm --filter admin test -- tests/unit/router.test.tsx` 验证真实页面标题且不再出现占位文案
- [x] 6.2 更新 `apps/admin/README.md`（或现有 README）中的路由说明，加入 `/adoptions` 的领养管理描述
- [x] 6.3 设置列表横向滚动、详情抽屉窄屏 100% 宽度、选株与决策弹窗窄屏宽度；用浏览器在 320px 视口确认页面无横向滚动且操作可完成
- [x] 6.4 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types` 和 `pnpm --filter admin test`，确认无告警、类型错误或失败用例

## 7. 集成验证

- [x] 7.1 准备测试数据：在开发库插入一个测试学生（复用管理员密码哈希），通过管理端新增一株可领养单株，再用学生接口提交一条领养申请；用 `GET /api/v1/admin/adoptions` 和 `GET /api/v1/admin/accounts` 确认数据存在
- [x] 7.2 浏览器走通主流程：登录 admin -> `/adoptions` -> 通过并选株 -> 确认交接 -> 学生申请归还 -> 确认归还（转入维护）；在 `/plants/instances` 核对单株状态从 `AVAILABLE` 到 `WAITING_PICKUP` 到 `ACTIVE` 到 `MAINTENANCE`
- [x] 7.3 浏览器走通分支：驳回申请后状态为已驳回；学生申请取消后管理员同意，状态为已取消；拒绝取消和驳回归还后回到原状态
- [x] 7.4 在仓库根目录运行 `pnpm verify`，确认 lint、类型检查、测试和构建全部通过

## Workflow follow-up

- 代码评审通过后归档变更，并在归档摘要中记录受影响的应用、验证命令和开发库测试数据。
