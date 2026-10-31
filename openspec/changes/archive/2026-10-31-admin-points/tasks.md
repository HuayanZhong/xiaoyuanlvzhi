# Tasks

## 1. Spring 积分规则接口与语义

- [x] 1.1 修改 `backend/src/main/java/cn/campusgreen/backend/points/api/dto/PointDtos.java`：`RuleRequest.points` 允许 0 并在服务层按来源校验；更新 OpenAPI 描述；运行 `./mvnw -DskipTests compile` 验证编译。
- [x] 1.2 修改 `PointService.updateRule`：`CARE_CHECKIN` 启用时积分必须大于 0、停用时允许 0，`ECO_TASK` 积分必须为 0；频控只接受 `DAILY`、`WEEKLY` 或空；成功刷新 `effectiveFrom` 并记录 `POINT_RULE_UPDATE` 审计事件（原因字段保存前后快照）。
- [x] 1.3 修改 `PointService.rules()`：历史 `PER_TASK` 行按“不限”返回，避免页面展示后端不执行的周期；不新增数据库结构或迁移。
- [x] 1.4 修改 `PointLedgerPersistenceAdapter.findAllByOrderByCreatedAtDesc`：按 `created_at DESC, id DESC` 排序，保证同一时间戳下的稳定顺序。
- [x] 1.5 扩展 `PointServiceTest`：覆盖养护启用时积分 0、停用时 0、环保积分大于 0、`PER_TASK`、每日/每周、规则更新审计和历史 `PER_TASK` 归一化；运行 `./mvnw -Dtest=PointServiceTest test` 验证。
- [x] 1.6 更新 `docs/product/business-rules.md` 与 `docs/product/admin.md`：写明任务积分取任务配置、`ECO_TASK` 规则只做频控、首版只支持不限/每日/每周；人工核对文档与规格一致。

## 2. Spring 人工调整接口与契约

- [x] 2.1 修改 `PointDtos.AdjustRequest`：增加可选 `requestId`（最多 64 字符），保留 `accountId`、`deltaPoints` 和 `reason`；运行 `./mvnw -DskipTests compile` 验证。
- [x] 2.2 重构 `PointService.changeBalance` 返回“流水 + 是否新建”的结果，保留现有调用方兼容的返回方式；运行 `./mvnw -Dtest=PointServiceTest test` 验证既有审核发分不受影响。
- [x] 2.3 修改 `PointService.adjust`：目标账号必须是 `STUDENT`（否则 404 `STUDENT_NOT_FOUND`）；原因按 `trim()` 后校验 5–200 字；使用 `ADJUSTMENT:{requestId}` 作为幂等键；重复同内容请求返回首次流水，不同内容返回 409 `IDEMPOTENCY_KEY_REUSED`；只有新建流水时写 `POINT_ADJUSTMENT` 审计。
- [x] 2.4 扩展 `PointServiceTest`：覆盖扣减超过余额、目标管理员、原因前后空格、同请求键重试、同键不同内容、审计只写一次；运行 `./mvnw -Dtest=PointServiceTest test` 验证。
- [x] 2.5 新增 `backend/src/test/java/cn/campusgreen/backend/points/api/AdminPointControllerContractTest.java`：覆盖规则列表、规则更新 400/404、流水 200/401/403、人工调整 400/404/409 和响应字段；运行 `./mvnw -Dtest=AdminPointControllerContractTest test` 验证。
- [x] 2.6 更新 `backend/docs/api.md`，并从运行中的 Spring `/v3/api-docs.yaml` 重新生成 `backend/docs/openapi.yaml`；用 Node 解析 YAML 并核对规则、流水和调整接口的 paths/schemas。

## 3. Admin API 与账号目录类型

- [x] 3.1 新增 `apps/admin/src/api/points.ts`：定义 `PointRuleView`、`PointLedgerView`、`PointAdjustmentRequest`、频控和来源常量，提供 `listPointRules`、`updatePointRule`、`listPointLedger`、`adjustPoints`；运行 `pnpm --filter admin check-types` 验证。
- [x] 3.2 新增 `apps/admin/tests/unit/api/points.test.ts`：覆盖路径、请求体、查询参数、错误码保留；运行 `pnpm --filter admin test -- tests/unit/api/points.test.ts` 验证。
- [x] 3.3 扩展 `apps/admin/src/api/accounts.ts` 的 `StudentView` 增加 `pointsBalance: number`，同步更新 `apps/admin/tests/unit/api/accounts.test.ts` 和相关 mock；运行 `pnpm --filter admin test -- tests/unit/api/accounts.test.ts` 验证。
- [x] 3.4 新增 `apps/admin/src/pages/points/labels.ts` 与 `apps/admin/tests/unit/pages/points/labels.test.ts`：覆盖规则来源、频控周期、流水来源、方向和状态文案；运行 `pnpm --filter admin test -- tests/unit/pages/points/labels.test.ts` 验证。

## 4. Admin 积分规则页面

- [x] 4.1 新增 `apps/admin/src/pages/points/PointsPage.tsx`，替换 `apps/admin/src/router/index.tsx` 中 `/points/rules` 的占位页；使用 `ModulePage` 和两个 tab，首次并行加载规则、流水和账号目录；运行 `pnpm --filter admin check-types` 验证路由和类型。
- [x] 4.2 新增 `apps/admin/src/pages/points/PointRulesPanel.tsx`：规则表、中文来源/状态、频控文案、养护规则说明、`ECO_TASK` 积分显示“由任务配置决定”；新增 `PointRulesPanel.test.tsx` 覆盖加载、空态、失败和字段展示。
- [x] 4.3 新增 `apps/admin/src/pages/points/PointRuleDrawer.tsx`：养护规则可编辑积分，环保规则只编辑频控和启用状态；“不限”清空次数；保存失败保留表单并显示中文错误；新增 `PointRuleDrawer.test.tsx` 覆盖校验、成功和失败。
- [x] 4.4 在 `PointsPage` 接入规则保存后的刷新和 tab 状态；新增 `PointsPage.test.tsx` 覆盖默认规则 tab、切换到流水 tab、规则保存后刷新；更新 `apps/admin/tests/unit/router.test.tsx` 验证 `/points/rules` 不再显示占位页。
- [x] 4.5 更新 `README.md` 的 admin 页面列表，把 `/points/rules` 从占位模块改为积分规则与流水；人工核对 README 与路由一致。

## 5. Admin 积分流水与人工调整

- [x] 5.1 新增 `apps/admin/src/pages/points/PointLedgerPanel.tsx`：流水表、学生/来源/方向/日期筛选、10 条分页、账号目录关联、账号缺失回退邮箱；新增 `PointLedgerPanel.test.tsx` 覆盖排序、筛选、分页和回退显示。
- [x] 5.2 新增 `apps/admin/src/pages/points/PointAdjustmentDrawer.tsx`：学生搜索选择、增加/扣减、整数积分、5–200 字原因、余额预览、负余额禁用、二次确认、错误映射；新增 `PointAdjustmentDrawer.test.tsx` 覆盖成功、余额不足、目标不存在和重复提交。
- [x] 5.3 在 `PointsPage` 接入“人工调整”按钮、抽屉和成功后的流水/账号刷新；新增页面集成测试，验证调整成功后流水新增且学生余额更新。
- [x] 5.4 在 `PointLedgerPanel` 或 `PointsPage` 中实现幂等请求键：首次提交生成 UUID，失败重试复用，表单字段变化后重置；用测试验证重复点击只发送一次有效请求。
- [x] 5.5 更新 `docs/product/admin.md` 的积分页面行为说明，补充流水筛选、人工调整预览和幂等重试；人工核对与规格一致。

## 6. 集成验证

- [x] 6.1 在 `backend/` 运行 `./mvnw verify`，确认全部后端测试、Spotless 和 Checkstyle 通过。
- [x] 6.2 在仓库根目录运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`，确认 admin 全部通过。
- [x] 6.3 在仓库根目录运行 `pnpm verify`，确认 lint、format:check、类型检查和全量测试通过。
- [x] 6.4 使用真实 Spring 和 admin 完成端到端检查：更新两条规则、查看养护/任务产生的流水、按学生和来源筛选、人工调整正负积分、余额不足错误、重复提交幂等；记录接口响应和页面结果。
- [x] 6.5 使用 Chrome DevTools 在 320px 视口检查规则表、流水表、规则抽屉和人工调整抽屉：页面无横向滚动、表格内部滚动、提交按钮可见；记录控制台无错误。

## Workflow follow-up

- 在项目审查通过后执行 `/opsx:archive` 归档本变更。
- 归档前确认主规格同步结果和验证命令结果已写入归档摘要。
