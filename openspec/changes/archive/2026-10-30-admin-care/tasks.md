# Tasks

## 1. 后端审核视图与接口

- [x] 1.1 新增 `AdminCheckinView` 和 `AdminSubmissionView`，映射学生姓名/学号/状态、单株/品种/养护说明、上次通过时间、待发积分与来源、证据标记、重复待审标记、审核人姓名和实际发放积分；用 `CareServiceTest` 断言字段映射完整
- [x] 1.2 为管理端列表批量装配凭证版本和积分流水，避免逐条查询；用测试验证批量 repository 方法被调用且结果按版本升序
- [x] 1.3 为 `GET /api/v1/admin/care/checkins` 增加状态白名单校验（仅 `PENDING_REVIEW`、`APPROVED`、`REJECTED`）和 `created_at DESC, id DESC` 排序；用 `CareServiceTest` 覆盖合法/非法状态和排序
- [x] 1.4 新增 `GET /api/v1/admin/care/checkins/{id}/events`，从 `operation_logs` 读取 `CARE_CHECKIN` 事件并按时间升序返回；用服务/控制器测试覆盖成功、404 和空记录
- [x] 1.5 补管理端接口契约测试，覆盖列表 400 未知状态、详情 404、事件 404、未登录 401 和非管理员 403；测试通过后再改前端类型
- [x] 1.6 更新 `backend/docs/api.md` 和 `backend/docs/openapi.yaml`，写明新增字段、事件接口和错误码；用文档中的示例路径和响应字段做一次人工核对

## 2. 后端提交与审核完整性

- [x] 2.1 在 `CareService.addSubmission` 显式设置 `submittedAt`，并确认 `TaskService` 的同类遗漏一起修复；用 Mockito 捕获 `save` 参数断言提交时间非空
- [x] 2.2 新增 Flyway V6 迁移：为 `care_submissions.submitted_at` 和 `task_submissions.submitted_at` 设置默认值，为 `care_checkins` 增加活动唯一键生成列/唯一索引和状态 CHECK，为 `care_submissions` 增加状态 CHECK；在真实 MySQL 上执行迁移并验证成功
- [x] 2.3 迁移前执行重复待审检查 SQL，记录结果；如有重复数据，先按任务 2.6 的规则人工驳回多余记录，再重试迁移
- [x] 2.4 在提交、重提和通过三个入口校验证据完整性：说明 trim 后非空或图片非空；用 `CareServiceTest` 覆盖仅说明、仅图片、两者皆空、历史空证据通过和空证据驳回
- [x] 2.5 驳回原因改为按 trim 后长度校验 5–200 字；用测试覆盖 4/5/200/201 字、前后空格和纯空白
- [x] 2.6 实现养护间隔基线：优先最近通过时间，首次使用交接时间；`submit`、`eligiblePlants` 和 `approve` 共用；提交/重提/可打卡列表在非 `ACTIVE` 领养时返回 409 `CARE_NOT_ACTIVE` 或不提供入口，已提交的待审打卡仍可补审；用测试覆盖交接后立即提交、到期后提交、审核时复核和可打卡绿植的 `nextEligibleAt`/`pendingCheckinId`
- [x] 2.7 实现重复打卡防护：新建拒绝同株 `PENDING_REVIEW`，重提拒绝同株其他 `PENDING_REVIEW`/`APPROVED`，通过再次检查；用测试覆盖新建重复、驳回后新建再重提旧记录、通过时重复和数据库唯一冲突映射
- [x] 2.8 为 `approve`、`reject`、`resubmit` 增加打卡行锁（`findByIdForUpdate`）和 `latestVersion` 一致性校验；用测试验证锁方法被调用、状态冲突返回 409、重复通过只产生一条流水
- [x] 2.9 将打卡编号改为完整 UUID 或增加唯一冲突重试；用测试覆盖生成格式和一次冲突重试
- [x] 2.10 增加 `Asia/Shanghai` 业务时钟并在养护/积分服务中使用；用固定时钟测试养护间隔、规则生效时间和频控边界
- [x] 2.11 为路径参数类型错误增加 400 处理，避免非数字 ID 落入 500；用控制器测试覆盖
- [x] 2.12 运行 `./mvnw test`（在 `backend/` 目录）并记录结果；失败项必须修复后再进入前端任务

## 3. 后端积分来源

- [x] 3.1 在 `PointService` 增加 `previewAward(sourceType, fallback)`，返回积分和来源 `RULE`/`SPECIES`/`NONE`；用 `PointServiceTest` 覆盖启用规则、停用/未生效规则、品种兜底和两者皆无
- [x] 3.2 为已通过凭证返回实际发放积分，提供按 `submissionId` 批量查询流水的服务方法；用测试覆盖已通过、未通过和流水缺失
- [x] 3.3 让 `approve` 使用与预览一致的积分来源，`NONE` 返回 409 `CARE_POINTS_UNCONFIGURED`，频控上限返回 409 `POINTS_FREQUENCY_LIMIT` 且保持待审；用测试覆盖两个错误分支
- [x] 3.4 更新 `docs/product/admin.md` 和 `docs/product/business-rules.md` 的养护积分表述为“规则优先、品种兜底，二者都无有效积分时不能通过”；人工核对与 spec 一致

## 4. 前端 API 与通用组件

- [x] 4.1 新增 `apps/admin/src/api/care.ts`，定义 `AdminCheckinView`/`AdminSubmissionView`/`CareEventView`，提供列表、详情、事件、通过和驳回函数；用 `tests/unit/api/care.test.ts` 覆盖路径、方法、请求体、信封解包和错误码
- [x] 4.2 将 `ReasonModal` 移到 `apps/admin/src/components/common/ReasonModal.tsx` 并更新领养详情导入；运行领养页测试，确认原因校验、失败保留输入和移动端宽度不回归
- [x] 4.3 修复 `useFileUrl`：`fileId` 变化或为空时清空旧 URL，暴露 loading/error，组件卸载释放对象 URL；用 hook 测试覆盖切换、失败和卸载
- [x] 4.4 扩展 `AuthenticatedImage`：图片加载失败显示“图片加载失败/重试”占位并支持重试；用组件测试覆盖成功、失败、重试和 `fileId` 切换

## 5. 前端养护审核页面

- [x] 5.1 实现 `CareReviewsPage` 骨架和列表列：打卡编号、学生、学号、单株、品种、提交时间、说明摘要、状态、预计积分、操作；用页面测试断言默认倒序、中文状态和空态
- [x] 5.2 实现关键词/状态/品种/日期筛选、`?status=` 初始值、非法值忽略、查询/重置和客户端分页；用页面测试覆盖各筛选、URL、分页和重置
- [x] 5.3 实现详情抽屉：并行请求详情和事件，展示学生/单株/品种/养护说明/时间/上次通过时间/最新凭证/版本历史/审核事件；用页面测试覆盖加载、失败重试、版本排序、事件失败降级
- [x] 5.4 实现照片展示与预览，列表不加载图片；用页面测试确认详情图片以 `fileId` 为 key、加载失败占位和切换版本不闪旧图
- [x] 5.5 实现通过流程：确认框展示学生、单株、预计积分，提交中禁用，成功刷新详情和列表，失败按错误码处理；用页面测试覆盖成功、重复点击和 409
- [x] 5.6 实现驳回流程：复用通用原因弹窗，trim 后 5–200 字，失败保留输入，成功刷新详情和列表；用页面测试覆盖校验、成功、失败和取消
- [x] 5.7 实现防御性禁用：证据缺失、最新凭证非待审、状态不一致、版本不一致、重复待审、`pointsSource=NONE` 时禁用通过并提示，驳回仍可用；用页面测试逐项覆盖
- [x] 5.8 实现错误映射：404 关闭抽屉并刷新，409 状态/凭证/冲突刷新并提示，积分未配置提示配置，频控上限保持待审，500/网络显示重试；用页面测试覆盖每个分支
- [x] 5.9 实现空列表、加载失败、详情失败、事件失败和窄屏布局；用页面测试和浏览器检查 991px 以下无页面横向滚动、抽屉/弹窗可操作
- [x] 5.10 新增 `pages/care/labels.ts`，覆盖状态中文、颜色、积分来源文案和未知状态回退；用页面测试断言未知状态不显示空白/崩溃
- [x] 5.11 在 `router/index.tsx` 用 `CareReviewsPage` 替换占位页，更新 `tests/unit/router.test.tsx` 的 mock 和标题断言；运行 `pnpm --filter admin exec vitest run tests/unit/router.test.tsx`
- [x] 5.12 更新 `README.md` 的已实现页面列表，移除养护审核占位并写明 `/care-reviews`；人工核对 README 与路由一致

## 6. 集成验证

- [x] 6.1 启动真实 MySQL 和后端，执行 Flyway V6，确认 `care_submissions.submitted_at` 有默认值、活动唯一索引和状态 CHECK 生效；记录迁移日志
- [x] 6.2 用学生账号完成交接后的首次打卡、间隔未到被拒绝、间隔到期后提交成功；在管理端 `/care-reviews` 看到对应记录和完整字段
- [x] 6.3 在管理端通过一条打卡，确认状态变为已通过、积分流水只有一条、学生通知存在、详情显示实际发放积分和审核事件；重复点击不重复发分
- [x] 6.4 在管理端驳回一条打卡，确认原因 trim 后保存、学生通知存在、无积分流水；再验证证据缺失、重复待审、积分来源 NONE 时通过被禁用
- [x] 6.5 用两个并发请求通过同一打卡，确认一个 200、一个 409，最终只有一条积分流水和一条通过审核事件；记录请求和结果
- [x] 6.6 在 320px 视口打开详情、查看照片、完成一次通过和一次驳回，确认页面无横向滚动、按钮和弹窗不被裁切
- [x] 6.7 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test` 和根目录 `pnpm verify`，记录全部结果；任一失败不得归档

## Workflow follow-up

- 在代码评审和集成验证通过后归档 `admin-care`。
- 归档摘要中写明受影响的 `apps/admin`、`backend/`、`docs/product/` 和验证命令结果。
- 后端目录不在当前前端 git 仓库中，提交前单独确认后端改动已被保存或备份。
