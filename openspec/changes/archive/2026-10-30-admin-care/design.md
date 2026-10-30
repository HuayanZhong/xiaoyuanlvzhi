# Design

## Context

管理端领养流程已完成，`/care-reviews` 仍是占位页。养护打卡是学生进入积分账本的关键业务，但当前 Spring 养护模块是一次性生成的代码，审计发现多处不能直接信任的逻辑：

- `care_submissions.submitted_at` 在创建凭证时从未赋值，而数据库列是 `NOT NULL` 且无默认值；严格 MySQL 下学生新建/重提打卡会返回 `409 DATA_CONFLICT`，管理端可能永远没有待审数据。
- `approve`/`reject` 对打卡和凭证没有行锁或条件更新，并发审核可能互相覆盖。
- 提交/重提允许说明和图片同时为空，审核通过也不复核证据。
- 首次打卡没有以交接时间为养护间隔起点。
- 同株可以出现多条活动打卡，驳回后新建再重提旧记录可能重复发分。
- 管理端视图缺少学生姓名/学号、品种、养护说明、待发积分、上次通过时间、审核人姓名、实际发放积分等字段。
- 驳回原因先按原始字符串校验、再 trim 入库，前后空格可绕过 5 字下限。
- 任务凭证存在同类的 `submitted_at` 遗漏。

前端现有模式可复用：`AdoptionsPage` 的客户端筛选/分页和详情抽屉、`ReasonModal`、`AuthenticatedImage`、`LoadFailure`、`ModulePage`、`useIsMobile`、`formatDateTime`。管理端页面只允许依赖 `api`、`components/common`、`hooks`、`lib`，不跨页面 import。

产品文档对积分来源的表述需要与本次决策对齐：启用的 `CARE_CHECKIN` 规则优先，品种 `carePoints` 兜底，二者都无有效积分时才禁止通过。

## Goals / Non-Goals

**Goals:**

- 修复养护打卡从提交、重提、审核到积分发放的端到端一致性，使管理端审核可以真实验收。
- 提供管理端 `/care-reviews` 列表、筛选、详情、版本历史、照片预览、审核操作记录、通过和驳回。
- 把学生、单株、品种、积分、审核人、实际发放积分等审核所需字段收敛到管理端专用视图，减少前端拼接和降级分支。
- 用行锁、状态校验、唯一约束和幂等流水键保证并发审核不重复发分、不产生混合状态。
- 明确证据完整性、养护间隔、重复打卡和积分来源的服务端规则，并在前端做防御性禁用和错误提示。

**Non-Goals:**

- 不做独立积分规则配置页；积分规则页面仍是后续模块。首版通过品种 `carePoints` 保证默认可用。
- 不做工作台卡片和统计页；本变更只保证 `/care-reviews?status=PENDING_REVIEW` 可被后续工作台调用。
- 不引入 outbox、消息队列或独立通知重试系统；通知/审计仍与审核同事务。
- 不实现通用审计查询平台；只新增养护打卡的审核事件查询。
- 不改变 `apps/web`；学生端页面不在本变更范围。
- 不改变端口、包边界、认证方式或共享包。

## Decisions

### D1 联合变更与信任边界

本变更同时修改 `apps/admin` 和 `backend/`。产品规格作为行为基准；后端现有实现只作为待修复对象，不把它的缺陷写成需求。管理端仍只保存 Bearer token，Spring 仍是最终认证和角色边界。

替代方案：只做前端并把后端 P0 登记为阻塞。该方案无法端到端验收通过/驳回，且会把“没有数据”误判为正常空态，因此不采用。

### D2 管理端专用审核视图

新增 `AdminCheckinView` 和 `AdminSubmissionView`，管理端四个接口返回该视图；学生端 `CheckinView` 保持不变。管理端视图包含：

- 学生：`studentId`、`studentName`、`studentNumber`、`studentEmail`、`studentStatus`
- 单株：`plantId`、`plantCode`、`plantDisplayName`、`plantName`、`location`、`plantStatus`
- 品种：`speciesId`、`speciesName`、`careIntervalDays`、`lightDescription`、`waterDescription`
- 审核上下文：`lastApprovedAt`（不含当前记录）、`pendingPoints`、`pointsSource`、`hasEvidence`、`duplicatePending`
- 凭证版本：`id`、`version`、`note`、`imageFileIds`、`status`、`reviewReason`、`reviewerName`、`reviewerEmail`、`submittedAt`、`reviewedAt`、`awardedPoints`

这样前端列表/详情不再需要请求账号、单株、品种、积分规则四个目录，也不会把“关联失败”误判为“未配置”。缺失的可选字段返回 null 或空数组。

替代方案：继续用前端 join。它需要 5 个请求、多个降级分支，并且无法可靠判断积分来源和实际发放积分；不采用。

### D3 审核并发：行锁、状态校验、幂等流水

- `CareCheckinRepository` 增加 `findByIdForUpdate`，使用 `SELECT ... FOR UPDATE`。
- `approve`、`reject`、`resubmit` 先锁定打卡行，再读取最新凭证并校验状态。
- `approve` 校验：打卡 `PENDING_REVIEW`、最新凭证 `PENDING_REVIEW`、`latestVersion` 与最大版本号一致、证据完整、无同株重复待审、养护间隔已到、积分来源有效。
- `reject` 校验：打卡和最新凭证均为 `PENDING_REVIEW`，原因 trim 后 5–200 字。
- 积分流水继续使用 `CARE_SUBMISSION:{submissionId}` 作为 `entryKey`；重复通过最多一条流水。
- `PointService.changeBalance` 在 `entryKey` 已存在时返回已有流水；审核服务据此跳过重复通知和审计，避免重复副作用。

替代方案：只用 `entryKey` 防重复发分。它不能阻止状态互相覆盖，也不能阻止“已驳回但已发积分”；不采用。

### D4 证据完整性

- 提交/重提：`note` trim 后非空或 `imageFileIds` 非空，否则 400 `CARE_EVIDENCE_REQUIRED`。
- 通过：再次检查最新凭证；历史空证据记录返回 409 `CARE_EVIDENCE_REQUIRED`，仍允许驳回。
- 前端：`hasEvidence=false` 时禁用“通过”，保留“驳回”，提示“证据缺失，请驳回并让学生补充”。

替代方案：只在提交侧校验。历史脏数据仍可能被通过；不采用。

### D5 养护间隔与交接基线

- 新增 `CareInterval` 计算：基线为 `lastApprovedAt`，没有通过记录时使用当前有效领养的 `handedOverAt`。
- `submit` 和 `eligiblePlants` 共用该基线；未到时间返回 409 `CARE_INTERVAL_NOT_REACHED`，并返回 `nextEligibleAt`。
- `approve` 再次按同一基线复核；如果打卡创建后同株已有更近的通过记录，返回 409 `CARE_INTERVAL_NOT_REACHED`。
- 当前领养不是 `ACTIVE`（如归还审核中）时，提交/重提/可打卡列表返回 409 `CARE_NOT_ACTIVE` 或不提供可打卡入口；已提交的待审打卡仍可由管理员补审，审核基线使用当前有效领养或最近通过时间。
- `eligiblePlants` 返回 `pendingCheckinId`、`pendingSubmittedAt` 和不可打卡原因，已有待审打卡时不再显示“可打卡”。

替代方案：只在提交时校验。审核时数据可能已经变化；不采用。

### D6 重复打卡与数据库兜底

- 新建：同学生同单株已有 `PENDING_REVIEW` 时返回 409 `CARE_CHECKIN_DUPLICATE`。
- 重提：同学生同单株存在其他 `PENDING_REVIEW` 或 `APPROVED` 打卡时返回 409 `CARE_CHECKIN_DUPLICATE`。
- 通过：再次检查重复。
- Flyway V6 增加生成列和唯一索引：

```sql
ALTER TABLE care_checkins
    ADD COLUMN active_checkin_key VARCHAR(64)
        GENERATED ALWAYS AS (
            CASE WHEN status = 'PENDING_REVIEW'
                 THEN CONCAT(student_id, ':', plant_id)
                 ELSE NULL END
        ) STORED,
    ADD UNIQUE KEY uk_care_checkins_active (active_checkin_key);
```

MySQL 唯一索引允许多个 NULL，因此已通过/已驳回记录不会占用活动位。应用层仍先做友好检查，数据库约束作为并发兜底。

替代方案：只靠应用层查询。并发下仍可能插入两条待审；不采用。

### D7 积分来源：规则优先，品种兜底

- `PointService` 增加 `previewAward(sourceType, fallback)`，返回积分和来源：`RULE`（启用、已生效、points>0）、`SPECIES`（品种 `carePoints`>0）、`NONE`。
- `CareService` 在管理端视图和 `approve` 中使用同一方法，确保展示值和实际发放值一致。
- `pointsSource=NONE` 时通过返回 409 `CARE_POINTS_UNCONFIGURED`；错误文案同时提到“积分规则或品种积分”。
- 已通过凭证通过 `CARE_SUBMISSION:{id}` 查询流水，返回 `awardedPoints`。
- `POINTS_FREQUENCY_LIMIT` 保持待审并回滚，不自动重试。
- 同步修订 `docs/product/admin.md` 和 `docs/product/business-rules.md`，明确规则优先、品种兜底。

替代方案：严格只认启用的规则。默认规则是 0/停用且积分规则页仍是占位，首版所有打卡都无法通过；不采用。只用品种积分也放弃规则覆盖能力；不采用。

### D8 审核操作记录

新增 `GET /api/v1/admin/care/checkins/{id}/events`，读取 `operation_logs` 中 `entityType=CARE_CHECKIN`、`entityId={id}` 的记录，按时间升序返回操作类型、前后状态、原因、操作人邮箱/姓名和时间。

提交/重提不写审计日志，凭证版本历史负责展示提交/重提；审核事件只展示通过/驳回。前端详情把两者分区展示，避免把版本历史伪装成完整审计日志。

替代方案：不提供事件接口，只展示凭证版本。产品明确要求操作记录；不采用。

### D9 提交时间与同类任务修复

- `CareService.addSubmission` 显式设置 `submittedAt = LocalDateTime.now(clock)`。
- Flyway V6 将 `care_submissions.submitted_at` 和 `task_submissions.submitted_at` 的默认值设为 `CURRENT_TIMESTAMP(6)`，作为持久层兜底。
- `TaskService.addSubmission` 做同样的显式赋值，避免任务模块上线时重现 P0。
- 增加 Mockito 测试捕获 `submissionRepository.save` 的参数，断言 `submittedAt` 非空；真实 MySQL 插入通过运行中的后端做手工验收。

替代方案：只加数据库默认值。MyBatis-Plus 仍可能省略列，默认值能兜底，但业务时间应显式写入；两者都做。

### D10 前端数据流与页面结构

- 页面启动只请求 `GET /api/v1/admin/care/checkins`；服务端返回全部记录和管理端视图字段。
- 客户端按 `createdAt` 倒序、`id` 倒序稳定排序，派生筛选、分页和总数。
- `?status=` 只作为初始 UI 筛选值；非法值忽略。前端不把 `status` 传给服务端，避免未知状态返回 400 或空数组的差异。
- 筛选字段：关键词（学生姓名/学号/邮箱、打卡编号、单株编号/展示名/位置）、状态、品种、提交日期范围。
- 每页 10 条，`currentPage = min(page, totalPages)`；查询/重置归第一页。
- 页面文件：`apps/admin/src/pages/care/CareReviewsPage.tsx`、`CareDetailDrawer.tsx`、`labels.ts`；API：`apps/admin/src/api/care.ts`。

替代方案：服务端分页/筛选。当前接口没有分页参数，且客户端需要跨记录派生重复标记和上次通过时间；首版继续客户端处理，后续再引入服务端分页。

### D11 详情、版本与图片

- 点击“查看”并行请求详情和 `events`；详情失败整体重试，事件失败只降级事件区域。
- 最新版本用 `max(version)` 判定，不依赖数组位置。
- 详情展示学生、单株、品种、养护说明、状态、创建/提交/审核时间、上次通过时间、最新凭证、版本历史、审核事件。
- 图片使用 `AuthenticatedImage` 和 `useFileUrl`；`useFileUrl` 在 `fileId` 变化或为空时清空旧 URL，增加 loading/error；`AuthenticatedImage` 失败显示“图片加载失败/重试”，不再永久骨架。
- 列表不渲染凭证图片，避免一次加载大量 blob。

替代方案：列表直接返回图片 URL。文件接口需要 Bearer，且列表图片会造成大量请求；不采用。

### D12 审核交互与错误映射

- 通过：`Popconfirm` 或确认框展示学生、单株、预计积分；提交中禁用通过/驳回。
- 驳回：复用提取后的 `ReasonModal`，trim 后 5–200 字；失败保留输入。
- 前端禁用通过的条件：非 `PENDING_REVIEW`、最新凭证非 `PENDING_REVIEW`、`hasEvidence=false`、`duplicatePending=true`、`pointsSource=NONE` 或 `pendingPoints<=0`、`latestVersion` 与最大版本不一致。
- 错误映射：

| 错误码                             | 页面行为                                 |
| ---------------------------------- | ---------------------------------------- |
| `CARE_CHECKIN_NOT_FOUND`           | 关闭抽屉，刷新列表，提示记录不存在       |
| `CARE_STATUS_INVALID`              | 刷新详情和列表，提示“记录已被处理”       |
| `CARE_SUBMISSION_ALREADY_REVIEWED` | 刷新详情和列表，提示“凭证已处理”         |
| `CARE_EVIDENCE_REQUIRED`           | 保留详情，提示证据缺失，禁用通过         |
| `CARE_INTERVAL_NOT_REACHED`        | 保留详情，提示养护间隔未到               |
| `CARE_CHECKIN_DUPLICATE`           | 刷新详情和列表，提示存在重复待审         |
| `CARE_POINTS_UNCONFIGURED`         | 提示先配置积分规则或品种积分，禁用通过   |
| `POINTS_FREQUENCY_LIMIT`           | 提示本周期上限已满，保持待审，不自动重试 |
| `DATA_CONFLICT`                    | 刷新详情和列表，提示记录冲突             |
| 401/403                            | 交给全局登录态/权限处理                  |
| 500/网络/超时                      | 中文错误和重试入口，不自动循环           |

- 成功提示不写死积分；以服务端返回的 `awardedPoints` 或“以积分流水为准”展示。

### D13 通用组件与移动端

- `ReasonModal` 从 `pages/adoptions` 提取到 `components/common/ReasonModal.tsx`，领养详情同步改导入；保留 trim 校验、失败保留输入、移动端 94% 宽度。
- 复用 `ModulePage`、`LoadFailure`、`AuthenticatedImage`、`useIsMobile`、`formatDateTime`、`emitToast`、`notifyError`。
- antd 6 约束：使用 `Space orientation` 而不是 `direction`；`Drawer size` 而不是 `width`；`Descriptions` 的 `span` 与 `column` 匹配；`Modal mask={{ closable: false }}`；中文两字按钮的 accessible name 在测试中用 `/通\s*过/` 这类正则。
- React 19 StrictMode：详情/事件加载使用 `active` 标志或 `AbortController`，避免快速切换或卸载后回写状态。
- 991px 断点：抽屉 100%（桌面 640），原因弹窗 94%，筛选区和 footer `Flex wrap`，表格 `scroll.x` 在内容区内部滚动，长说明/原因 `pre-wrap` + `break-word`，状态 Tag 带文字。

### D14 测试策略

- 后端：新增 `CareServiceTest`（Mockito）覆盖提交时间、证据、间隔、重复、积分预览、通过/驳回状态、行锁调用、错误码；新增 `CareController`/DTO 映射测试；扩展 `PointServiceTest` 覆盖 `previewAward`；真实 MySQL 通过运行中的后端手工验收。
- 前端：`api/care.test.ts` 覆盖路径/方法/请求体/错误透传；`CareReviewsPage.test.tsx` 覆盖列表、筛选/URL/分页、详情/版本/事件、通过/驳回、防御性禁用、409/404、空态/失败；`ReasonModal`/`useFileUrl`/`AuthenticatedImage` 组件测试；领养页回归测试。
- 验证命令：`pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`、`pnpm verify`；后端 `./mvnw test`；真实后端 + MySQL 的浏览器验收。

## Data Flow

```
学生提交/重提
      |
      v
CareService (事务)
  - 校验领养/单株/证据/间隔/重复
  - 锁单株或打卡行
  - 写入 checkin + submission(submittedAt)
      |
      v
MySQL care_checkins / care_submissions
      |
      v
管理端 GET /admin/care/checkins
  - 批量装配 AdminCheckinView
  - 预览积分（RULE/SPECIES/NONE）
  - 上次通过时间、重复待审、证据标记
      |
      v
CareReviewsPage --筛选/分页--> 详情抽屉
      |                         |
      |                         +--> GET /{id}/events (operation_logs)
      v
通过/驳回
  - 锁打卡行
  - 再次校验状态/证据/间隔/重复/积分
  - 通过: submission/checkin + point_ledger(entryKey) + notification + audit
  - 驳回: submission/checkin + notification + audit
      |
      v
刷新详情和列表，展示服务端最终状态与实际发放积分
```

## API Contract Summary

| 方法与路径                                      | 用途                    | 主要成功/失败                                                |
| ----------------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `GET /api/v1/admin/care/checkins`               | 列表，可选合法 `status` | 200 数组；400 未知状态；401/403                              |
| `GET /api/v1/admin/care/checkins/{id}`          | 详情                    | 200；404 `CARE_CHECKIN_NOT_FOUND`；401/403                   |
| `GET /api/v1/admin/care/checkins/{id}/events`   | 审核操作记录            | 200 数组；404；401/403                                       |
| `POST /api/v1/admin/care/checkins/{id}/approve` | 通过并发分              | 200；404；409 状态/证据/间隔/重复/积分/频控                  |
| `POST /api/v1/admin/care/checkins/{id}/reject`  | 驳回                    | 200；400 原因；404；409 状态                                 |
| `POST /api/v1/care/checkins`                    | 学生新建打卡            | 200；400 证据；409 间隔/重复/非养护中                        |
| `POST /api/v1/care/checkins/{id}/resubmit`      | 学生重提                | 200；400 证据；404；409 重复/状态                            |
| `GET /api/v1/care/eligible-plants`              | 可打卡绿植              | 200；包含 `nextEligibleAt`、`pendingCheckinId`、不可打卡原因 |

## Error Mapping

| 错误码                             | HTTP    | 含义                   | 前端处理                  |
| ---------------------------------- | ------- | ---------------------- | ------------------------- |
| `CARE_STATUS_INVALID`              | 409     | 打卡状态已变化         | 刷新详情/列表，不显示成功 |
| `CARE_SUBMISSION_ALREADY_REVIEWED` | 409     | 最新凭证已处理         | 刷新详情/列表             |
| `CARE_EVIDENCE_REQUIRED`           | 400/409 | 说明和图片都为空       | 禁用通过，保留驳回        |
| `CARE_INTERVAL_NOT_REACHED`        | 409     | 养护间隔未到           | 提示下次可打卡时间        |
| `CARE_CHECKIN_DUPLICATE`           | 409     | 同株存在重复活动打卡   | 刷新并提示先处理重复记录  |
| `CARE_POINTS_UNCONFIGURED`         | 409     | 规则和品种积分都无效   | 禁用通过，提示配置积分    |
| `POINTS_FREQUENCY_LIMIT`           | 409     | 本周期发放次数已达上限 | 保持待审，不自动重试      |
| `DATA_CONFLICT`                    | 409     | 数据库唯一/完整性冲突  | 刷新，提示记录冲突        |
| `CARE_CHECKIN_NOT_FOUND`           | 404     | 打卡不存在             | 关闭抽屉，刷新列表        |
| `INVALID_REQUEST`                  | 400     | 参数/原因/状态不合法   | 显示中文原因，保留输入    |
| `UNAUTHORIZED` / `FORBIDDEN`       | 401/403 | 未登录/无权限          | 全局登录态/权限处理       |
| `INTERNAL_ERROR` / 网络/超时       | 500/—   | 服务异常               | 中文提示和重试            |

## Migration Plan

1. 部署前检查重复待审：`SELECT student_id, plant_id, COUNT(*) FROM care_checkins WHERE status='PENDING_REVIEW' GROUP BY student_id, plant_id HAVING COUNT(*) > 1`；如有，先人工驳回多余记录，否则唯一索引会创建失败。
2. 新增 `V6__care_review_integrity.sql`：
   - `care_submissions.submitted_at` 和 `task_submissions.submitted_at` 设置 `DEFAULT CURRENT_TIMESTAMP(6)`。
   - `care_checkins` 增加 `active_checkin_key` 生成列和 `uk_care_checkins_active` 唯一索引。
   - `care_checkins`、`care_submissions` 增加状态 CHECK 约束。
   - 可选：修复零日期 `submitted_at`。
3. 部署后端，确认 Flyway 迁移成功。
4. 部署 admin，确认 `/care-reviews` 替换占位页。
5. 回滚：应用回滚到上一版本；V6 的列/索引/默认值可保留（向后兼容），如需完全回滚再执行反向 DDL。生产回滚前先备份。

## Risks / Trade-offs

- [迁移失败] 现有重复待审会导致唯一索引创建失败 → 部署前执行检查 SQL，必要时人工处理。
- [并发测试不足] Mockito 只能验证锁调用和状态分支，不能证明 MySQL 并发行为 → 用真实后端 + MySQL 做双请求手工验收，并保留集成验证记录。
- [同事务副作用] 通知/审计写失败会回滚审核 → 首版接受；不引入 outbox，避免扩大范围。
- [客户端分页] 一次返回全部记录，数据量大时首屏变慢 → 首版数据量可控；后续可加服务端分页和聚合字段。
- [积分规则语义] 规则优先、品种兜底是对产品文档的明确修订 → 同步更新 `docs/product/admin.md` 和 `business-rules.md`，避免两处口径不一致。
- [时间口径] 后端 `LocalDateTime` 无时区，页面按墙钟展示 → 不依赖客户端时钟判断规则生效；积分由后端计算并返回 `pendingPoints`/`pointsSource`。
- [任务凭证同类修复] 修改 `TaskService` 超出养护页面范围 → 作为同类 P0 防御性修复记录在 proposal/tasks，避免任务模块上线时重复踩坑。
- [旧客户端兼容] 学生端提交规则收紧（证据、间隔、重复） → 产品文档本就要求这些规则；在 proposal 标注行为变更，管理端不受影响。

## Config / Tooling Impact

- 无 `tsconfig`、Vitest、覆盖率 include 或 Turbo 输入变化；新增测试放在 `apps/admin/tests/unit/pages/care` 和 `apps/admin/tests/unit/api`，现有配置已覆盖。
- 不新增前端运行时依赖；继续使用 antd 6、React 19、Vitest 5。
- Oxc 仍是唯一 lint/format 工具链；不添加 ESLint/Prettier。
- 共享包 `@repo/http-client`、`@repo/env` 不变；前端仍通过 `src/lib/http.ts` 读取环境，页面不直接访问环境变量。
- 后端新增 Flyway V6 迁移；`backend/` 不属于 pnpm workspace，不需要 Turbo 配置变更。
- `apps/web` 不参与本变更，不新增跨应用 import。

## Open Questions

- 工作台“待审核打卡”卡片和计数是否在后续 `admin-dashboard` 变更中接入；本变更只保证 `?status=PENDING_REVIEW` 可用。
- 是否需要在后续积分模块中把 `CARE_CHECKIN` 规则的频控周期展示到管理端详情；本变更只处理 `POINTS_FREQUENCY_LIMIT` 错误和保持待审。
