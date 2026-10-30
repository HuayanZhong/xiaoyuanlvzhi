# Tasks

## 1. 数据库与持久化基础

- [x] 1.1 新增 `backend/src/main/resources/db/migration/V7__task_review_integrity.sql`：为 `task_participations.joined_at` 增加 `CURRENT_TIMESTAMP(6)` 默认值，为 `eco_tasks`、`task_participations`、`task_submissions` 增加状态 CHECK，并新增 `(task_id, joined_at)` 索引；在真实 MySQL 启动后端，确认 `flyway_schema_history` 版本 7 成功。
- [x] 1.2 为 `EcoTaskRepository` 和 `TaskParticipationRepository` 增加 `findByIdForUpdate`，在 MyBatis 适配器中使用 `SELECT ... FOR UPDATE`；执行 `cd backend && ./mvnw -q -DskipTests compile` 通过。
- [x] 1.3 为 `TaskSubmissionRepository` 增加按参与 ID 批量查询凭证的方法，供管理端参与列表使用；执行 `cd backend && ./mvnw -q -DskipTests compile` 通过，批量查询行为在 2.3 的测试中验证。
- [x] 1.4 在 `PointService` 增加按任务凭证 ID 批量读取实际发放积分的方法，流水键为 `TASK_SUBMISSION:{id}`；在 `PointServiceTest` 增加命中、缺失和空集合用例，执行 `cd backend && ./mvnw -Dtest=PointServiceTest test` 通过。
- [x] 1.5 在 `TaskService` 注入 `Clock`，报名时显式写入 `joinedAt`，提交凭证使用同一时钟；执行 `cd backend && ./mvnw -q -DskipTests compile` 通过，时间行为在 3.1 和 3.2 的测试中验证。

## 2. 管理端视图与接口

- [x] 2.1 在 `TaskDtos` 新增 `AdminTaskView`、`AdminSubmissionView`、`AdminParticipationView` 和 `TaskEventView`，字段覆盖任务、学生、凭证、审核人和实际发放积分；执行 `cd backend && ./mvnw -q -DskipTests compile` 通过。
- [x] 2.2 `TaskService.adminTasks` 组装 `AdminTaskView`，包含实时报名/通过人数、显示状态和 `canEditRules`；在 `TaskServiceTest` 覆盖计数、状态和可编辑标记并通过。
- [x] 2.3 `TaskService.adminParticipations` 返回全部状态的参与记录，支持 `taskId` 和 `status` 筛选，批量读取凭证与实际积分；在 `TaskServiceTest` 覆盖无筛选、按任务、按状态、未知状态和空结果。
- [x] 2.4 `AdminTaskController` 增加 `GET /api/v1/admin/tasks/participations/{id}` 和 `GET /api/v1/admin/tasks/participations/{id}/events`，并让列表、详情和审核接口返回管理端视图；执行 `cd backend && ./mvnw -q -DskipTests compile` 通过。
- [x] 2.5 新增 `AdminTaskControllerContractTest`，覆盖任务列表、创建、编辑、停用、参与列表、参与详情、审核事件、通过和驳回的路径、状态码、响应字段、401/403/404/400；执行 `cd backend && ./mvnw -Dtest=AdminTaskControllerContractTest test` 通过。
- [x] 2.6 更新 `backend/docs/api.md` 和 `backend/docs/openapi.yaml` 的任务管理、参与审核和审核事件接口；用 `grep` 确认新路径存在，并检查 OpenAPI 文档可解析。

## 3. 状态机与并发修复

- [x] 3.1 修复 `join`：在任务行锁内校验开放时间、名额和重复报名，显式写入 `joinedAt`，唯一键冲突转换为 409；在 `TaskServiceTest` 覆盖成功、未开放、重复报名、满额，并确认报名时间非空。
- [x] 3.2 修复 `submit`：在参与记录行锁内校验归属、任务截止、参与状态、文字/照片证据和图片归属，原子递增版本号；在 `TaskServiceTest` 覆盖首次提交、驳回后重提、任务结束、状态错误、缺文字、缺照片和非法图片。
- [x] 3.3 修复 `approve`：在参与记录行锁内校验最新凭证，按任务 `pointsPerPerson` 发放积分，处理 `POINTS_FREQUENCY_LIMIT`、积分幂等、学生通知和审核事件；在 `TaskServiceTest` 覆盖成功、重复、凭证已处理、频控和并发只发一次。
- [x] 3.4 修复 `reject`：在参与记录行锁内校验状态，原因去除首尾空白后要求 5–200 字，更新凭证和参与状态、通知学生并记录审核事件；在 `TaskServiceTest` 覆盖成功、原因过短、重复驳回和并发。
- [x] 3.5 修复 `update` 和 `stop`：`STOPPED` 只读，`publish=true` 只发布 `DRAFT`，已有报名时拒绝修改时间/人数上限/积分，只有 `PUBLISHED` 可停用；在 `TaskServiceTest` 覆盖各分支和错误码。
- [x] 3.6 任务显示状态按注入的 `Clock` 计算，覆盖开始前、正好开始、进行中、正好结束、草稿和停用；在 `TaskServiceTest` 使用固定时钟断言。
- [x] 3.7 任务为 `ENDED` 或 `STOPPED` 时仍允许审核已提交的待审凭证，但拒绝新报名和新提交；在 `TaskServiceTest` 覆盖补审、结束报名和结束提交。
- [x] 3.8 执行 `cd backend && ./mvnw test`，任务模块全部单元测试和契约测试通过。

## 4. Admin API 客户端与标签

- [x] 4.1 新增 `apps/admin/src/api/tasks.ts`，定义任务状态、参与状态、管理端类型，以及列表、详情、创建、编辑、停用、参与列表、参与详情、审核事件、通过和驳回函数；执行 `pnpm --filter admin check-types` 通过。
- [x] 4.2 新增 `apps/admin/src/pages/tasks/labels.ts`，提供任务状态、参与状态、中文文案和颜色映射，未知值有中文回退；新增标签测试并通过。
- [x] 4.3 新增 `tests/unit/api/tasks.test.ts` 和 `tests/unit/pages/tasks/labels.test.ts`，覆盖查询参数、错误传递和标签映射；执行 `pnpm --filter admin exec vitest run tests/unit/api/tasks.test.ts tests/unit/pages/tasks/labels.test.ts` 通过。

## 5. 任务配置页面

- [x] 5.1 新增 `apps/admin/src/pages/tasks/TasksPage.tsx`，建立页面壳、tab 状态和“任务配置”列表，包含标题、开放时间、报名/上限、通过人数、积分、状态和操作，支持关键词/状态/日期筛选、查询/重置和每页 10 条分页；在 `TasksPage.test.tsx` 覆盖默认列表、筛选、重置和分页。
- [x] 5.2 新增 `apps/admin/src/pages/tasks/TaskFormDrawer.tsx`，支持新建、编辑、复制新建，包含标题、单图封面、说明、时间范围、人数上限、积分、文字/照片要求和保存草稿/立即发布；在 `TaskFormDrawer.test.tsx` 覆盖创建、发布、已有报名锁定、停用只读、复制预填和失败保留。
- [x] 5.3 在 `TasksPage` 接入停用确认、复制新建和操作后的列表刷新；页面测试覆盖不同状态的按钮可见性和停用调用。
- [x] 5.4 更新 `apps/admin/src/router/index.tsx`，让 `/tasks` 渲染 `TasksPage`；路由测试确认 `/tasks` 不再渲染占位页。
- [x] 5.5 更新 `README.md` 的 `/tasks` 说明和占位模块数量；用 `grep` 确认文案存在且数字一致。
- [x] 5.6 执行 `pnpm --filter admin lint`、`pnpm --filter admin check-types` 和 `pnpm --filter admin test`，全部通过。

## 6. 凭证审核页面

- [x] 6.1 新增 `apps/admin/src/pages/tasks/TaskReviewPanel.tsx`，包含审核列表、任务/状态/关键词/提交日期筛选、每页 10 条分页、空态和失败重试；测试覆盖默认待审、按任务筛选和状态筛选。
- [x] 6.2 新增 `apps/admin/src/pages/tasks/TaskReviewDrawer.tsx`，展示任务与学生上下文、最新凭证、全部版本、图片预览和审核事件，提供通过 Popconfirm 与驳回原因弹窗；测试覆盖待审可操作、已处理只读、证据缺失和冲突刷新。
- [x] 6.3 在 `TasksPage` 中组合“任务配置”和“凭证审核”两个 tab，接入 `?tab=review&status=&taskId=` 深链，并支持从任务配置点击“查看报名”切换到审核 tab；页面测试覆盖 tab 切换、深链和非法状态回退。
- [x] 6.4 新增 `tests/unit/pages/tasks/TaskReviewPanel.test.tsx` 和 `tests/unit/pages/tasks/TaskReviewDrawer.test.tsx`；执行 `pnpm --filter admin exec vitest run tests/unit/pages/tasks` 通过。
- [x] 6.5 更新 `docs/product/admin.md` 和 `docs/product/business-rules.md`，记录复制新建、停用只读、任务结束补审和任务积分频控；核对文案与实现一致。

## 7. 集成验证

- [x] 7.1 后端全量验证：执行 `cd backend && ./mvnw test`，所有测试通过。
- [x] 7.2 真实 MySQL 流程验证：创建草稿 → 发布 → 学生报名 → 提交 → 驳回 → 重提 → 通过 → 重复通过 → 停用 → 结束补审；记录每步状态码、积分流水数和通知数，确认只有一条任务积分流水。
- [x] 7.3 并发验证：最后一个名额并发报名只成功一个；同一参与记录并发通过只成功一个且只有一条积分流水；记录实际响应码。
- [x] 7.4 前端与规格全量验证：执行根目录 `pnpm verify` 全部任务通过，执行 `openspec validate admin-tasks --strict` 通过。
- [x] 7.5 浏览器验证：桌面完成任务创建、发布、审核；320px 打开任务与审核抽屉，确认页面无横向滚动、通过/驳回可操作、控制台无错误。

## Workflow follow-up

- Archive the change after review and verification.
- Verify the archived main spec and summary.
