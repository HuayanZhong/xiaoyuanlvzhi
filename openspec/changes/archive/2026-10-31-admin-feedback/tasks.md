# Tasks

## 1. Spring 反馈接口与仓储加固

- [x] 1.1 在 `feedback/application/FeedbackService.java` 增加 `PENDING`、`IN_PROGRESS`、`REPLIED`、`CLOSED` 状态白名单和首尾空白规范化；未知 `status` 返回 400 `INVALID_REQUEST`。注入现有 `Clock`，开始处理、回复和关闭的处理时间统一使用 `LocalDateTime.now(clock)`；验证：相关服务测试通过，固定时钟下处理时间可断言。
- [x] 1.2 在服务层对回复和关闭结论先 `trim()` 再校验 5–500 字；更新 `FeedbackDtos.ReplyRequest` 与 `CloseRequest` 的注解描述。验证：空白、去除后不足 5 字、超过 500 字的用例返回 400 `INVALID_REQUEST`，且不写入事件。
- [x] 1.3 修改 `FeedbackPersistenceAdapter`：`findFirstById` 使用 `FOR UPDATE`；反馈列表按 `created_at DESC, id DESC` 排序；事件查询按 `created_at ASC, id ASC` 排序。验证：适配器编译通过，服务测试覆盖同时间排序与状态校验。
- [x] 1.4 为 `FeedbackEventRepository` 增加按反馈 ID 集合批量查询时间线的方法，`adminList` 批量装配事件，避免逐条反馈查询；详情保持单条查询。验证：服务测试断言列表只调用一次批量事件查询，返回的每条反馈时间线正确分组。
- [x] 1.5 新增或补齐 `FeedbackServiceTest`，覆盖状态筛选与未知状态、开始/回复/关闭的状态分支、trim 长度校验、重复操作不重复写事件、404 和批量时间线分组；验证：`cd ../backend && ./mvnw -Dtest=FeedbackServiceTest test`。
- [x] 1.6 新增 `AdminFeedbackControllerContractTest`，覆盖未登录 401、学生 403、列表字段与状态筛选、未知状态 400、详情 404、开始/回复/关闭 409、回复和结论请求体校验；验证：`cd ../backend && ./mvnw -Dtest=AdminFeedbackControllerContractTest test`。
- [x] 1.7 更新 `../backend/docs/api.md` 的反馈接口说明，并启动服务后重新导出 `docs/openapi.json` 与 `docs/openapi.yaml`；验证：快照包含状态白名单、5–500 字校验和稳定排序描述。

## 2. Admin 反馈 API 与文案

- [x] 2.1 新增 `apps/admin/src/api/feedback.ts`，定义 `FeedbackView`、`FeedbackEventView`、`FeedbackType`、`FeedbackStatus`、`ReplyRequest`、`CloseRequest` 类型，以及 `listFeedback(status?)`、`getFeedback(id)`、`startFeedback(id)`、`replyFeedback(id, reply)`、`closeFeedback(id, conclusion)`；验证：`apps/admin/tests/unit/api/feedback.test.ts` 断言请求路径、查询参数和请求体。
- [x] 2.2 新增 `apps/admin/src/pages/feedback/labels.ts`，提供四种状态、四种类型、关联业务和颜色的中文映射，未知值回退原始值；验证：`apps/admin/tests/unit/pages/feedback/labels.test.ts` 覆盖已知值、未知值和状态颜色。
- [x] 2.3 运行 `pnpm --filter admin exec vitest run tests/unit/api/feedback.test.ts tests/unit/pages/feedback/labels.test.ts`，确认 API 与文案测试通过。

## 3. Admin 反馈列表页与路由

- [x] 3.1 新增 `apps/admin/src/pages/feedback/FeedbackPage.tsx`：列表列、关键词/类型/状态/提交日期筛选、查询与重置、每页 10 条分页、学生姓名/学号目录关联、邮箱回退、`?status=` 深链、操作按钮按状态显示、空态/失败/重试；验证：页面测试覆盖默认列表、筛选、重置、分页、深链、空态和列表失败。
- [x] 3.2 新增 `apps/admin/tests/unit/pages/feedback/FeedbackPage.test.tsx` 和 `fixtures.ts`，覆盖学生目录加载成功与失败、操作按钮可见性、筛选后分页回到第一页；验证：`pnpm --filter admin exec vitest run tests/unit/pages/feedback/FeedbackPage.test.tsx`。
- [x] 3.3 更新 `apps/admin/src/router/index.tsx`，将 `/feedback` 从 `PlaceholderPage` 替换为 `FeedbackPage`；验证：`apps/admin/tests/unit/router.test.tsx` 增加 `/feedback` 渲染真实页面而非占位页的断言。
- [x] 3.4 更新 `README.md` 的 admin 页面清单，补充 `/feedback` 的筛选、详情、回复与关闭能力；验证：文档描述与页面实际行为一致。

## 4. Admin 反馈详情与操作

- [x] 4.1 新增 `apps/admin/src/pages/feedback/FeedbackDetailDrawer.tsx`：展示反馈编号、学生、类型、关联业务、描述、最多 3 张图片、回复内容、处理人和时间线；图片使用 `AuthenticatedImage`，加载失败可重试；验证：抽屉测试覆盖详情字段、图片、时间线和加载失败。
- [x] 4.2 新增 `apps/admin/src/pages/feedback/FeedbackActionModal.tsx`：回复与关闭共用表单，回复 5–500 字、关闭结论 5–500 字，trim 后校验；关闭使用二次确认；提交中禁用并防止重复提交；验证：弹窗测试覆盖合法提交、空白、过短、过长、服务端错误保留输入和重复点击只提交一次。
- [x] 4.3 在 `FeedbackPage` 与 `FeedbackDetailDrawer` 接通开始处理、回复、关闭：成功后更新详情、刷新列表并显示中文 toast；409 提示状态已变化并刷新；关闭弹窗后保留详情；验证：页面/抽屉集成测试覆盖三条操作和状态冲突。
- [x] 4.4 更新 `docs/product/admin.md` 的问题反馈章节，明确列表筛选、学生关联、状态操作、5–500 字回复/结论和关闭二次确认；验证：文档与规格及页面行为一致。

## 5. 集成验证

- [x] 5.1 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`，确认 admin 检查与测试全部通过。
- [x] 5.2 运行 `cd ../backend && ./mvnw verify`，确认后端测试、Spotless 和 Checkstyle 全部通过。
- [x] 5.3 运行根目录 `pnpm verify`，确认 lint、format:check、类型检查和测试全部通过。
- [x] 5.4 在浏览器以 1440×900 验证：状态筛选、详情时间线、开始处理、回复、关闭、学生目录失败回退、空态与失败重试；确认控制台无错误。
- [x] 5.5 在浏览器以 320×800 验证：页面无横向滚动、表格内部滚动、详情抽屉和操作弹窗可完整提交。
- [x] 5.6 清理联调产生的测试反馈和通知，保留不可删除的操作审计；验证：反馈列表恢复干净，学生通知无测试残留。

## Workflow follow-up

- 所有任务完成后运行 `openspec validate admin-feedback --type change --strict`，再按项目流程归档。
- 归档前确认主规格同步只新增 `admin-feedback`，不修改既有能力。
