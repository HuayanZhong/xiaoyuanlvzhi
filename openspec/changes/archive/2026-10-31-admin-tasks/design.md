# Design

## Context

见 `proposal.md` 的动机和 `specs/admin-tasks/spec.md` 的行为契约。当前状态：

- `apps/admin` 的 `/tasks` 仍是占位页，导航、后台壳、登录和路由守卫已可用；养护审核已经建立了列表、详情抽屉、凭证版本、图片预览、原因弹窗和错误映射的成熟模式。
- Spring 已有 `TaskController`、`AdminTaskController` 和 `TaskService`，但任务模块没有任何测试；报名、重提和审核都是“先读后写”，没有行锁。
- 学生端 `apps/web` 仍是 Nuxt 空壳，尚未接入 Spring；本次只修共享的后端任务接口，不新增学生页面。
- `task_participations.joined_at` 为 `NOT NULL` 且无默认值，`TaskService.join` 又没有赋值，当前报名会直接 SQL 失败。

数据流：

```text
admin React (3000)
  |
  |  Bearer accessToken, /api/v1/admin/tasks/**
  v
Spring Boot (8080)  TaskService  --->  MySQL
  ^
  |  /api/v1/tasks/**（学生接口，web 尚未接入）
  |
web Nuxt (4000, 空壳)

admin 不直接访问数据库；Spring 仍是认证、角色和业务状态边界。
```

## Goals / Non-Goals

**Goals:**

- 管理端可完成任务配置、发布/停用/复制、报名查看和凭证审核。
- 修复报名时间、报名名额、重提版本和审核并发的数据完整性问题。
- 管理端审核视图一次返回学生、任务、凭证、审核人和实际发放积分，避免前端拼装。
- 用可复现的测试覆盖状态机、并发和管理端接口契约。

**Non-Goals:**

- 学生端 Nuxt 页面、学生任务列表和报名交互。
- 工作台卡片、数据统计、积分规则、奖励商品和兑换订单页面。
- 任务的服务端分页、定时把 `PUBLISHED` 改成 `ENDED`、任务提交事件时间线。
- 新增共享运行时包、修改认证流程或引入新的 UI/格式化工具。

## Decisions

### D1: 管理端专用视图，不复用学生 DTO

新增 `AdminTaskView`、`AdminParticipationView`、`AdminSubmissionView`、`TaskEventView`，由 `AdminTaskController` 返回；学生端 `TaskView`、`ParticipationView` 保持兼容。管理端视图补齐学生姓名/学号/账号状态、任务显示状态、实际发放积分、审核人姓名/邮箱和最新提交摘要。

**替代方案**：直接扩展现有学生 DTO。放弃原因是学生会看到审核人、账号状态等管理字段，且响应结构变化会破坏学生接口兼容性。

### D2: 数据库只存三种任务状态，显示状态由服务端计算

`eco_tasks.status` 继续只存 `DRAFT`、`PUBLISHED`、`STOPPED`；`UPCOMING`、`ONGOING`、`ENDED` 由服务端按校园时钟计算。边界为：`now < startsAt` 未开始，`startsAt <= now < endsAt` 进行中，`now >= endsAt` 已结束。

**替代方案**：定时任务把到期任务改成 `ENDED`。放弃原因是引入调度器、状态漂移和补偿逻辑，而显示状态完全可由时间推导。

### D3: 报名锁任务行，提交/审核锁参与记录行

- `join`：在事务内对 `eco_tasks` 行执行 `SELECT ... FOR UPDATE`，再检查报名时间、名额和重复报名，最后插入参与记录。任务行锁把同一任务的名额检查串行化。
- `submit`、`approve`、`reject`：对 `task_participations` 行执行 `SELECT ... FOR UPDATE`，在锁内重新读取状态和最新凭证，再写入。
- `(task_id, student_id)` 和 `(participation_id, version_no)` 唯一键作为最终兜底；捕获唯一键冲突时返回业务冲突而不是 500。

**替代方案**：只依赖唯一键或乐观锁。放弃原因是唯一键只能防止重复行，不能防止名额超卖、重复通知和重复审核事件；乐观锁需要新增版本列并处理重试。

### D4: 报名时间显式写入，数据库默认值兜底

`TaskService.join` 使用注入的 `Clock` 设置 `participants.joinedAt`；V7 同时把 `joined_at` 改为 `NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`。应用时间是主路径，数据库默认值只作为持久化兜底。与养护模块 `submitted_at` 的处理保持一致。

**替代方案**：只依赖数据库默认值。放弃原因是业务时间应可测试、可审计，且默认值使用数据库服务器时区，跨环境可能不一致。

### D5: 任务积分以 `pointsPerPerson` 为准，积分规则只做频率上限

审核通过时奖励积分取任务配置的 `pointsPerPerson`，通过 `PointService.changeBalance` 写入 `TASK_SUBMISSION:{submissionId}` 流水键，保证同一凭证只发一次。启用中的 `ECO_TASK` 规则如果配置了日/周频率上限，仍由 `PointService` 校验；触发时返回 409 `POINTS_FREQUENCY_LIMIT`，事务回滚，参与和凭证保持待审。

**替代方案**：像养护一样“规则优先、品种兜底”。放弃原因是任务配置本身就有明确的每人积分，规则不应覆盖任务金额；规则只承担全局频率保护。

### D6: 停用只读，复制新建在前端完成

`STOPPED` 任务不允许编辑和重新发布；需要调整规则时使用“复制新建”。复制只发生在 admin 前端：预填标题副本、说明、封面、人数上限、积分和凭证要求，清空时间，保存为新的 `DRAFT`，不新增后端接口。`publish=true` 只把 `DRAFT` 发布，其他状态保持原状态。

**替代方案**：允许编辑已停用任务并重新发布。放弃原因是产品明确要求“停用旧任务并复制创建新任务”，且重新发布会改变已报名学生的规则预期。

### D7: `/tasks` 使用两个 tab，URL 保留筛选状态

任务配置和凭证审核放在同一个 `/tasks` 页面，用 `?tab=config|review`、`?status=`、`?taskId=` 表示状态。导航仍只有一个“环保任务”入口；工作台后续可以直接链接到 `/tasks?tab=review&status=PENDING_REVIEW`。

**替代方案**：拆成 `/tasks` 和 `/tasks/reviews` 两个路由。放弃原因是导航需要新增二级项，且工作台和面包屑要维护两个入口；tab 方案更贴合现有单菜单结构。

### D8: 首版客户端筛选和分页，接口保留服务端筛选参数

admin 首次加载全部任务和参与记录，在浏览器内做关键词、日期、状态筛选和每页 10 条分页，与养护审核保持一致。管理端接口仍支持 `taskId` 和 `status` 查询参数，供深链、测试和后续数据量增长时使用。

**替代方案**：首版就做服务端分页。放弃原因是当前管理端数据量小，客户端筛选能减少请求次数和加载态切换；服务端分页留到数据量证明需要时再做。

### D9: 复用操作日志作为审核事件来源

审核通过/驳回继续由 `AuditService.record` 写入 `operation_log`，实体类型为 `TASK_PARTICIPATION`，动作分别为 `TASK_APPROVE`、`TASK_REJECT`；新增 `GET /participations/{id}/events` 直接读取并按时间升序返回。凭证版本本身已经记录每次提交和审核结果，不新增提交事件表。

**替代方案**：新建任务事件表。放弃原因是操作日志已经记录操作人、前后状态、原因和时间，足够支撑审核时间线，避免重复存储。

### D10: 批量读取凭证和实际积分

参与列表先批量读取全部参与记录的凭证版本（按参与 ID 分组），再批量读取 `TASK_SUBMISSION:{id}` 流水，拼装 `awardedPoints`。避免养护审核早期“每行单独查凭证”的 N+1。

任务列表的报名/通过人数仍按任务逐条统计；当前任务数量有限，优先保证实现简单，后续可改为分组聚合查询。

### D11: 前端复用现有通用组件和错误处理

- 封面使用 `SingleImageUpload`，审核图片使用 `AuthenticatedImage` 和 `useFileUrl`。
- 驳回复用 `ReasonModal`；通过使用 `Popconfirm`；详情和列表失败复用 `LoadFailure`。
- 错误码映射集中在任务页面：`TASK_RULES_LOCKED`、`TASK_STATUS_INVALID`、`TASK_PARTICIPATION_STATUS_INVALID`、`TASK_SUBMISSION_ALREADY_REVIEWED`、`TASK_NOT_FOUND`、`TASK_PARTICIPATION_NOT_FOUND`、`POINTS_FREQUENCY_LIMIT` 等。
- 样式继续使用 antd 默认主题和现有设计 token，不新增品牌色或第二套样式方案。

### D12: 测试分层

- 后端单元测试：`TaskServiceTest` 覆盖创建、编辑锁定、停用、状态计算、报名、提交/重提、通过、驳回、频率上限和异常映射。
- 后端契约测试：`AdminTaskControllerContractTest` 覆盖路径、状态码、响应字段、401/403 和参数校验。
- 后端并发测试：至少覆盖“最后一个名额并发报名”和“同一参与记录并发通过”，验证只有一条成功、只产生一条积分流水。
- 前端：`api/tasks.test.ts`、`TasksPage.test.tsx`、`TaskFormDrawer.test.tsx`、`TaskReviewDrawer.test.tsx`、路由和 `labels` 测试；使用 Testing Library，不引入新测试库。
- 浏览器验收：桌面完成新建、发布、报名查看、通过、驳回；320px 视口完成查看和审核，无页面横向滚动。

### D13: V7 迁移

```sql
ALTER TABLE task_participations
    MODIFY COLUMN joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    ADD CONSTRAINT chk_task_participations_status
        CHECK (status IN ('JOINED', 'PENDING_REVIEW', 'REJECTED', 'APPROVED')),
    ADD KEY idx_task_participations_task_joined (task_id, joined_at);

ALTER TABLE eco_tasks
    ADD CONSTRAINT chk_eco_tasks_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'STOPPED'));

ALTER TABLE task_submissions
    ADD CONSTRAINT chk_task_submissions_status
        CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED'));
```

部署前先检查非法状态：

```sql
SELECT status, COUNT(*) FROM eco_tasks GROUP BY status;
SELECT status, COUNT(*) FROM task_participations GROUP BY status;
SELECT status, COUNT(*) FROM task_submissions GROUP BY status;
```

存在非法值时先人工修正，否则 CHECK 约束会阻止迁移。

### D14: 时间源和时区

`TaskService` 注入现有 `Clock`（`Asia/Shanghai`），所有业务判断和 `joinedAt`/`submittedAt` 使用 `LocalDateTime.now(clock)`；状态计算和报名/提交截止使用同一时钟。数据库默认值仅兜底，不参与业务判断。

### D15: 工具链和配置

- 不新增共享包、不跨应用导入；admin 只通过 `@/api/tasks` 调用 Spring。
- 不修改 tsconfig、Vitest、覆盖率 include 或 Turbo 输入；新增源码在现有 `src`/`tests` 范围内。
- 继续使用 Oxc（oxlint/oxfmt），不引入 ESLint、Prettier 或新格式化工具。
- 不修改环境变量和共享包；admin 仍通过 `@repo/http-client` 和现有 `src/lib/http.ts` 访问 API。

## Risks / Trade-offs

- **管理端 API 响应结构变化** → 当前只有本仓库 admin 使用；前后端同一变更内同步升级，学生端 DTO 不变，并在契约测试中固定新结构。
- **行锁增加数据库争用** → 事务只包住状态检查和一次写入，不在锁内做文件、通知等外部操作；积分流水写入与状态更新保持同一事务。
- **任务列表仍有按任务计数查询** → 当前任务量小，先保证正确；数据量增长后改为分组聚合。
- **客户端筛选在数据量大时变慢** → 接口保留 `taskId`/`status` 服务端筛选；后续可平滑切换为服务端分页。
- **MySQL CHECK 约束可能因历史脏数据失败** → V7 前执行状态预检查，先修正非法值再迁移。
- **数据库默认值使用服务器时区** → 业务时间全部由应用显式写入；默认值只防止空值插入。
- **`STOPPED` 只读可能不符合个别运营习惯** → 复制新建提供替代路径，且与产品“停用旧任务、新建任务”的规则一致。

## Migration Plan

1. 备份开发/目标数据库，执行 D13 的状态预检查。
2. 部署后端前应用 V7 Flyway 迁移；确认 `flyway_schema_history` 版本 7 成功。
3. 部署后端，新增管理端视图和接口；学生端接口保持路径和响应结构兼容。
4. 部署 admin，启用 `/tasks`；README 和 API 文档同步。
5. 用真实 MySQL 走通：创建草稿 → 发布 → 学生报名 → 提交 → 驳回 → 重提 → 通过 → 重复通过 → 停用 → 已结束补审。
6. 回滚：先回滚 admin；后端回滚前如需保留数据，手动删除 V7 的三个 CHECK 约束、索引，并把 `joined_at` 默认值改回无默认；应用层始终显式写 `joinedAt`，不依赖默认值。
