# Tasks

## 1. Spring 后端：资讯接口与领域约束

- [x] 1.1 在 `Article` 增加 `DRAFT`、`PUBLISHED`、`WITHDRAWN` 常量，在 `ArticleDtos` 增加 `AdminArticleSummaryView` 和 `AdminArticleView`，保持公开 `ArticleView` 不变；运行 `cd ../backend && ./mvnw -q -DskipTests compile` 验证编译通过。
- [x] 1.2 更新 `ArticleRepository` 和 `ArticlePersistenceAdapter`：替换旧的 `updatedAt` 列表排序，改为按 `created_at DESC, id DESC`，列表显式排除 `content`，通过 `RecordAssembler.accounts(...)` 批量加载作者；新增 `ArticlePersistenceAdapterTest` 验证排序、状态过滤和只调用一次作者批量查询；运行 `cd ../backend && ./mvnw -Dtest=ArticlePersistenceAdapterTest test`。
- [x] 1.3 更新 `ArticleService.adminList` 返回摘要并校验 `status`（空值或 `DRAFT`/`PUBLISHED`/`WITHDRAWN`，否则 400 `INVALID_REQUEST`），新增 `adminGet`；在 `ArticleServiceTest` 覆盖摘要映射、状态过滤和 404；运行 `cd ../backend && ./mvnw -Dtest=ArticleServiceTest test`。
- [x] 1.4 在 `ArticleService`/`ArticleRequest` 实现去除首尾空白后的字段校验（标题 1–80、分类 1–40、摘要不超过 200、正文非空、空白摘要转 `null`）和发布/撤回状态语义；扩展 `ArticleServiceTest` 覆盖创建、编辑、发布、重新发布、撤回、封面错误和 409；运行 `cd ../backend && ./mvnw -Dtest=ArticleServiceTest test`。
- [x] 1.5 更新 `AdminArticleController`：列表返回 `AdminArticleSummaryView`，新增 `GET /{id}`，写接口返回 `AdminArticleView`；新增 `AdminArticleControllerContractTest` 覆盖 401/403、摘要不含 `content`、详情 404、创建/编辑/发布/撤回状态码；运行 `cd ../backend && ./mvnw -Dtest=AdminArticleControllerContractTest test`。
- [x] 1.6 运行 `cd ../backend && ./mvnw verify`，确认 Spotless、Checkstyle 和全部测试通过；若格式化失败先运行 `./mvnw spotless:apply` 后重跑。

## 2. admin API 客户端

- [x] 2.1 新增 `apps/admin/src/api/articles.ts`，定义 `ArticleStatus`、摘要/详情/请求类型及 `listArticles`、`getArticle`、`createArticle`、`updateArticle`、`publishArticle`、`withdrawArticle`；新增 `tests/unit/api/articles.test.ts` 覆盖状态查询参数、请求体、响应信封和错误；运行 `pnpm --filter admin test -- tests/unit/api/articles.test.ts`。

## 3. admin 资讯列表

- [x] 3.1 新增 `apps/admin/src/pages/articles/labels.ts`，定义状态文案/颜色、作者姓名/邮箱回退和筛选项；新增 `tests/unit/pages/articles/labels.test.ts` 覆盖状态映射和作者回退；运行 `pnpm --filter admin test -- tests/unit/pages/articles/labels.test.ts`。
- [x] 3.2 新增 `apps/admin/src/pages/articles/ArticlesPage.tsx`，实现列、状态/关键词/分类筛选、查询/重置、客户端分页每页 10 条、空态、失败重试和打开编辑，并处理筛选区换行与表格内部横向滚动；新增 `ArticlesPage.test.tsx` 覆盖列、筛选、分页、空态和失败重试；运行 `pnpm --filter admin test -- tests/unit/pages/articles/ArticlesPage.test.tsx`。
- [x] 3.3 更新 `apps/admin/src/router/index.tsx` 用 `ArticlesPage` 替换 `/articles` 占位，更新 `tests/unit/router.test.tsx` 断言 `/articles` 渲染真实页面且 `/statistics` 仍为占位；运行 `pnpm --filter admin test -- tests/unit/router.test.tsx`。

## 4. admin 编辑抽屉与页面集成

- [x] 4.1 新增 `apps/admin/src/pages/articles/ArticleFormDrawer.tsx`，实现详情加载、标题/分类 AutoComplete/摘要/封面/纯文本正文表单、保存草稿/发布/保存修改/重新发布/撤回、404 和保存失败处理，并在窄屏占满可用宽度；新增 `ArticleFormDrawer.test.tsx` 覆盖新建草稿、直接发布、编辑已发布、撤回、校验和失败保留；运行 `pnpm --filter admin test -- tests/unit/pages/articles/ArticleFormDrawer.test.tsx`。
- [x] 4.2 在 `ArticlesPage` 接入 `ArticleFormDrawer`，处理保存成功后刷新列表、详情 404 关闭抽屉、撤回二次确认；扩展 `ArticlesPage.test.tsx` 覆盖打开抽屉、保存后刷新和撤回；运行 `pnpm --filter admin test -- tests/unit/pages/articles/ArticlesPage.test.tsx`。

## 5. 文档

- [x] 5.1 更新 `README.md` 的 `/articles` 说明和剩余占位数量；更新 `docs/product/admin.md` 第 9 节，补充筛选、分页、空态/失败、作者姓名/邮箱回退、字段规则、发布/撤回，以及“不删除、不发积分、不记录阅读”的边界；核对文档中的路由、按钮和状态文案与实现一致。

## 6. 集成验证

- [x] 6.1 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`，确认全部通过。
- [x] 6.2 运行根目录 `pnpm verify` 和 `pnpm --filter admin build`，记录构建结果和大于 500 kB 的 chunk 警告。
- [x] 6.3 启动 admin 和后端，在 1440×900 与 320×800 浏览器验证：列表、筛选、分页、新建草稿、发布、编辑已发布、撤回、重新发布、封面预览、失败重试和暗色模式；确认控制台无错误，验证后清理临时资讯和上传文件。
- [x] 6.4 通过公开接口验证：发布后 `GET /api/v1/articles` 返回该资讯，撤回后不再返回；确认学生积分余额和积分流水未变化。
- [x] 6.5 运行 `git status --short` 检查变更范围，确认未修改 `.env*`、共享包、tsconfig、Vitest 配置或 Turbo 输入，且未执行 git commit。

## Workflow follow-up

- 将 `admin-articles` 和 `admin-shell` 的 delta specs 同步到主规格，运行 `openspec validate --specs --strict`。
- 评审通过后用 `/opsx:archive` 归档本次变更。
- 未明确要求时不要执行 git commit。
