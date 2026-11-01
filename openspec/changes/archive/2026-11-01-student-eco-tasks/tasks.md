# Tasks

## 1. 任务 API 与状态工具（apps/web）

- [x] 1.1 新增 `apps/web/app/utils/task-api.ts`：定义任务、凭证、参与记录类型，封装 `listTasks`、`getTask`、`joinTask`、`listParticipations`、`submitTaskEvidence` 五个请求，路径相对 `/api/v1/`；新增 `apps/web/tests/nuxt/utils/task-api.test.ts` 覆盖请求路径、方法、请求体与无返回值处理；验证 `pnpm --filter web exec vitest run tests/nuxt/utils/task-api.test.ts`
- [x] 1.2 新增 `apps/web/app/utils/task-status.ts`：提供任务状态（尚未开始、进行中、已结束）与参与状态（已报名、待审核、已通过、已驳回）的标签、印章色调与只读标记，并导出 `canJoin`、`isFull`、`canSubmit`、`remainingQuota`；新增 `apps/web/tests/nuxt/utils/task-status.test.ts` 覆盖满额、未开始、已报名、已驳回和未知状态；验证 `pnpm --filter web exec vitest run tests/nuxt/utils/task-status.test.ts`
- [x] 1.3 将 `apps/web/app/utils/care-errors.ts` 重命名为 `apps/web/app/utils/action-errors.ts`，导出 `resolveActionError`，同步更新 `UiImagePicker`、`my-plants/[plantId]` 与 `care/[id]` 的引用；验证 `pnpm --filter web check-types` 和 `pnpm --filter web exec vitest run tests/nuxt/components/ui-image-picker.test.ts tests/nuxt/pages/plant-care.test.ts tests/nuxt/pages/checkin-detail.test.ts`

## 2. 任务列表与导航入口（apps/web）

- [x] 2.1 新增 `apps/web/app/pages/tasks/index.vue`：并行加载任务列表与参与列表，提供全部、可报名、已参加、已结束四档筛选，卡片显示标题、开放时间、剩余名额、单人奖励积分与状态，并包含空态与可重试错误；新增 `apps/web/tests/nuxt/pages/tasks.test.ts` 覆盖四档筛选、尚未开始的任务只在全部出现、空态和加载失败；验证 `pnpm --filter web exec vitest run tests/nuxt/pages/tasks.test.ts`
- [x] 2.2 在 `apps/web/app/utils/navigation.ts` 的 `STUDENT_NAV` 中加入「任务」（位于绿植之后、我的之前），并在 `apps/web/app/utils/auth-route.ts` 的保护前缀中加入 `/tasks`；更新 `apps/web/tests/nuxt/utils/navigation.test.ts` 与 `apps/web/tests/nuxt/middleware/auth.test.ts`，覆盖四项导航和 `/tasks`、`/tasks/{id}` 的登录重定向；验证 `pnpm --filter web exec vitest run tests/nuxt/utils/navigation.test.ts tests/nuxt/middleware/auth.test.ts`
- [x] 2.3 更新 `AGENTS.md`：在 `apps/web` 路由清单中加入 `/tasks` 与 `/tasks/{id}`，在保护前缀中加入 `/tasks`，并补充 `task-api.ts`、`task-status.ts` 与 `action-errors.ts` 的职责说明；验证文档中的路由与 `apps/web/app/pages/tasks/`、`auth-route.ts` 实际一致

## 3. 任务详情、报名与凭证（apps/web）

- [x] 3.1 新增 `apps/web/app/pages/tasks/[id].vue`：展示任务标题、说明、完成标准与凭证要求、开放时间、名额与已报名人数、奖励积分与状态；按 `canJoin`/`isFull` 控制报名入口，报名成功后整页刷新，报名冲突显示服务端原因；不存在或已停用任务显示无法查看并提供返回列表入口；新增 `apps/web/tests/nuxt/pages/task-detail.test.ts` 覆盖详情渲染、报名成功、满额/未开始/已报名状态与任务不可见；验证 `pnpm --filter web exec vitest run tests/nuxt/pages/task-detail.test.ts`
- [x] 3.2 在 `apps/web/app/pages/tasks/[id].vue` 内嵌参与记录与凭证表单：展示参与状态、报名时间、全部凭证版本、驳回原因；说明最多 500 字、图片最多 3 张，按任务的 `requireText`/`requirePhoto` 校验，未配置凭证要求时禁用提交并提示联系管理员，驳回且未截止时可重提；扩充 `apps/web/tests/nuxt/pages/task-detail.test.ts` 覆盖凭证必填、超长说明、`TASK_EVIDENCE_UNCONFIGURED`、重提保留版本与 `TASK_SUBMISSION_ALREADY_REVIEWED`；验证同一测试文件通过

## 4. 集成检查

- [x] 4.1 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test`，确认全部通过
- [x] 4.2 启动 4000 端口的 web，在 320px、375px、768px、1440px 视口和日间/暗夜两套主题下检查 `/tasks`、`/tasks/{id}` 与底部导航四项：无横向滚动、状态不只靠颜色区分、任务不可查看时有返回入口

## Workflow follow-up

- 归档前确认四项导航、路由清单与保护前缀在主 spec 与代码中一致。
- 通过 `/opsx:archive` 归档 `student-eco-tasks`。
