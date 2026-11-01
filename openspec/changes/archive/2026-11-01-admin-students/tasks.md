# Tasks

## 1. Spring 后端加固与契约

- [x] 1.1 在领养仓储端口和持久化适配器新增按学生 ID 集合与 `ACTIVE` 状态分组计数的方法；空集合直接返回空结果。验证：新增 `AccountQueryAdapterTest`，运行 `./mvnw -Dtest=AccountQueryAdapterTest test`。
- [x] 1.2 修改 `AccountService.adminList`，先取学生列表、一次取活跃领养计数再映射，避免逐学生查询；新增 `AccountServiceTest` 覆盖有学生、无学生和未命中计数。验证：运行 `./mvnw -Dtest=AccountServiceTest test`。
- [x] 1.3 调整 `StatusRequest` 与 `AccountService.setStatus`，按去除首尾空白后的 5–200 字校验原因，并用去空白值写审计；在 `AccountServiceTest` 覆盖空白填充、过短、过长和合法原因。验证：运行 `./mvnw -Dtest=AccountServiceTest test`。
- [x] 1.4 新增 `AdminAccountControllerContractTest`，覆盖学生列表、详情和历史的 401、403、200、404，以及空学生列表返回空数组。验证：运行 `./mvnw -Dtest=AdminAccountControllerContractTest test`。
- [x] 1.5 在同一契约测试中覆盖禁用/启用的 200、400 `INVALID_REQUEST`、404 `STUDENT_NOT_FOUND` 和返回的账号状态字段。验证：运行 `./mvnw -Dtest=AdminAccountControllerContractTest test`。
- [x] 1.6 运行 `./mvnw verify`，确认全部后端测试、Spotless 和 Checkstyle 通过。验证：命令退出码为 0。

## 2. Admin API 客户端与文案

- [x] 2.1 扩展 `apps/admin/src/api/accounts.ts` 的 `StudentView` 为学生完整资料，新增历史类型和 `getStudent`、`getStudentHistory`、`disableStudent`、`enableStudent`；保持 `listStudents()` 无参签名不变。更新 `tests/unit/api/accounts.test.ts` 覆盖新路径、方法和请求体。验证：运行 `pnpm --filter admin test -- tests/unit/api/accounts.test.ts`。
- [x] 2.2 新增 `apps/admin/src/pages/students/labels.ts`，集中账号状态、历史状态、来源类型和空态文案；新增标签单元测试。验证：运行 `pnpm --filter admin test -- tests/unit/pages/students/labels.test.ts`。
- [x] 2.3 运行 `pnpm --filter admin lint` 和 `pnpm --filter admin check-types`，确认新增 API 与标签文件无 Oxc 或类型错误。

## 3. 学生列表页

- [x] 3.1 新增 `StudentsPage.tsx`：使用 `ModulePage`、筛选区、`AdminTable` 和客户端分页 10 条，列表包含姓名、学号、院系、班级、手机号、当前积分、在养绿植数、账号状态、注册时间和“查看”。验证：新增 `StudentsPage.test.tsx` 覆盖列、状态文案和加载/空态。
- [x] 3.2 在页面测试中覆盖关键词、院系、账号状态和注册日期筛选，查询前不生效、重置、组合筛选、分页、筛选无结果和列表失败重试。验证：运行 `pnpm --filter admin test -- tests/unit/pages/students/StudentsPage.test.tsx`。
- [x] 3.3 更新 `apps/admin/src/router/index.tsx`，用 `StudentsPage` 替换 `/students` 占位；更新 `tests/unit/router.test.tsx`，确认 `/students` 不再渲染占位页而资讯管理仍是占位页。验证：运行 `pnpm --filter admin test -- tests/unit/router.test.tsx`。
- [x] 3.4 更新 `README.md` 和 `docs/product/admin.md` 的学生管理章节，写明列表、筛选、详情入口和剩余占位模块。验证：文档中可检索到 `/students` 与“资讯管理、数据统计”占位说明。

## 4. 学生详情、历史与账号状态

- [x] 4.1 新增 `StudentDetailDrawer.tsx` 的基础资料区和详情加载/失败重试，打开时并行请求详情和历史但独立维护状态。验证：新增 `StudentDetailDrawer.test.tsx` 覆盖基础资料、缺失字段和详情重试。
- [x] 4.2 在抽屉中实现五个历史标签、字段、排序、空态、每页 10 条客户端分页和历史失败重试。验证：抽屉测试覆盖五个标签、空态、分页和历史请求失败。
- [x] 4.3 实现禁用/启用：根据状态显示唯一操作，复用 `ReasonModal`；成功同步列表与详情，失败保留弹窗和原因，404 关闭弹窗并刷新列表。验证：抽屉测试覆盖禁用、启用、取消、原因过短、失败保留和 404。
- [x] 4.4 在列表页测试中覆盖打开/关闭抽屉、状态变更后筛选结果重新计算，以及详情与历史独立失败。验证：运行 `pnpm --filter admin test -- tests/unit/pages/students/StudentsPage.test.tsx`。
- [x] 4.5 更新 `README.md` 和 `docs/product/admin.md` 的详情、五个历史分组和启用/禁用说明。验证：文档中可检索到五个历史标签、原因 5–200 字和“不删除历史记录”。
- [x] 4.6 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types` 和 `pnpm --filter admin test`，确认全部 admin 测试通过。

## 5. 集成验证

- [x] 5.1 从仓库根目录运行 `pnpm verify`，确认 admin 的 lint、类型检查、测试和构建任务全部通过。
- [x] 5.2 在浏览器 1440×900 验证学生列表、四类筛选、分页、详情五个标签、禁用/启用和失败重试；在 320×800 验证表格内部滚动、抽屉和原因弹窗不产生页面横向滚动；检查控制台无错误。验证：记录实际观察结果。
- [x] 5.3 使用临时测试学生数据验证，完成后清理该学生及其关联记录；确认测试数据未写入仓库，未提交 `.env` 或任何环境变量文件。验证：清理查询结果为 0。
- [x] 5.4 确认 `git diff --name-only` 只包含本变更预期的 `apps/admin`、`../backend` 和文档路径，未修改 `apps/web`、共享包、环境变量文件或工具链。

## Workflow follow-up

- 代码评审和验证通过后，运行 `/opsx:archive`，选择“先同步再归档”。
- 归档后检查 `admin-students` 主规格和 `admin-shell` 占位页要求已同步。
- 未明确要求不要执行 git commit。
