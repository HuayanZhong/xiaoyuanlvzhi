# Design

## Context

管理端 `/articles` 目前仍是占位页。Spring `content` 模块已有管理端列表、新增、编辑、发布和撤回接口，但管理端列表复用公开的 `ArticleView`，响应包含 `content`；没有管理端详情接口；列表按 `updatedAt` 倒序；`RecordAssembler` 在映射文章时逐条查询作者账号，存在 N+1；`content` 模块没有后端测试。

admin 使用 `apps/admin/src/api/client.ts` 的统一响应信封和 `apps/admin/src/lib/http.ts` 的认证请求。现有列表页普遍采用 `ModulePage` + `AdminTable` + 客户端筛选/分页，表单采用抽屉并复用 `SingleImageUpload`、`AuthenticatedImage`、`notifyError` 和 `emitToast`。

约束：

- Spring 是认证和角色边界，`/api/v1/admin/**` 需要 `ROLE_ADMIN`。
- 不跨应用导入；本次不新增共享包。
- Oxc 是唯一 lint/format 工具链，不新增 ESLint/Prettier。
- 不修改环境变量、tsconfig、Vitest include、覆盖率 include 或 Turbo 任务输入。
- 公开接口 `GET /api/v1/articles` 保持现有行为。

## Goals / Non-Goals

**Goals:**

- 管理端资讯列表、筛选、分页、详情、编辑、发布、重新发布和撤回。
- 管理端列表只返回摘要，详情单独返回正文。
- 统一状态语义、去除首尾空白后的字段校验和错误码。
- 消除列表逐条查询作者的 N+1。
- 补齐 Spring 和 admin 测试，更新规格和文档。

**Non-Goals:**

- 学生端 `apps/web` 资讯阅读页。
- 资讯阅读记录、阅读量统计或相关数据库表。
- 资讯积分或任何积分流水。
- 富文本编辑器、图片裁剪、资讯物理删除。
- 后端分页、全文检索或资讯导出。
- 修改公开资讯接口的响应结构。

## Decisions

### 1. 管理端 DTO 拆成摘要与详情

新增 `ArticleDtos.AdminArticleSummaryView` 和 `ArticleDtos.AdminArticleView`：

- 摘要：`id/title/category/summary/coverFileId/status/authorId/authorEmail/authorName/publishedAt/createdAt/updatedAt`。
- 详情：摘要字段 + `content`。
- 公开 `ArticleDtos.ArticleView` 保持不变，公开接口继续返回完整视图。

理由：列表不需要 `MEDIUMTEXT` 正文；独立 DTO 让“列表无正文”成为可验证的接口契约，而不是依赖调用方忽略字段。备选方案是复用 `ArticleView` 并允许 `content=null`，但这样列表和详情共用弱类型，容易让后续消费者误判。

### 2. 列表查询排除正文并批量加载作者

`ArticleRepository` 增加按创建时间倒序、ID 倒序的方法：

- `findAllByOrderByCreatedAtDescIdDesc()`
- `findAllByStatusOrderByCreatedAtDescIdDesc(String status)`

`ArticlePersistenceAdapter` 使用 MyBatis-Plus 的 `.select(...)` 显式排除 `content`，并通过 `RecordAssembler.accounts(Collection<Long>)` 一次性加载本页所有作者，再映射为领域对象。公开列表也复用同一批加载逻辑。

理由：既避免响应携带正文，也避免逐篇文章查询账号。备选方案是自定义 join 查询直接返回 DTO，但会绕过现有领域映射，改动面更大。

### 3. 状态语义

- 新建：`publish=false` → `DRAFT`；`publish=true` → `PUBLISHED`，`publishedAt` 为空时写入当前时间。
- 编辑：`publish=false` 只更新内容，保持当前状态；`publish=true` 置为 `PUBLISHED`，`publishedAt` 为空时写入。
- 发布接口：草稿或已撤回 → `PUBLISHED`；已发布再次调用保持 `PUBLISHED`，不覆盖首次发布时间。
- 撤回接口：仅 `PUBLISHED` → `WITHDRAWN`；其他状态返回 409 `ARTICLE_STATUS_INVALID`。
- 不提供删除；撤回保留记录和 `publishedAt`。

备选方案是让编辑接口始终根据请求设置状态，但“保存”会意外取消发布或重新发布已撤回资讯，因此不采用。

### 4. 去除首尾空白后的字段校验

`ArticleRequest` 保留标题、分类、正文的 `@NotBlank`，移除标题/分类/摘要的 `@Size` 上限，由 `ArticleService` 在 `trim()` 后校验：

- 标题 1–80 字。
- 分类 1–40 字。
- 摘要最多 200 字；空白摘要保存为 `null`。
- 正文不能为空。
- 封面可选；非空时必须是存在且公开的图片。

违反规则抛出 `DomainException(BAD_REQUEST, "INVALID_REQUEST", 中文消息)`；封面错误继续使用 `FILE_NOT_FOUND` 和 `FILE_NOT_PUBLIC`。理由：`@Size` 统计原始字符，和产品定义的“去除首尾空白后”不一致；后端仍是最终边界，前端校验只负责即时反馈。

### 5. 列表状态过滤校验

`adminList(status)` 接受空值或 `DRAFT`、`PUBLISHED`、`WITHDRAWN`；其他值返回 400 `INVALID_REQUEST`。理由：避免拼写错误静默返回空列表，便于接口消费者定位问题。

### 6. 前端数据流

新增 `apps/admin/src/api/articles.ts`：

- `listArticles(status?)` → 摘要数组。
- `getArticle(id)` → 详情。
- `createArticle(input)` / `updateArticle(id, input)` → 详情。
- `publishArticle(id)` / `withdrawArticle(id)` → 详情。

`ArticlesPage` 首次加载摘要列表，筛选、排序和每页 10 条分页在客户端完成；点击“编辑”时再请求详情。`ArticleFormDrawer` 负责新建和编辑：

- 标题 `Input`，`maxLength=80`，`showCount`。
- 分类 `AutoComplete`，选项来自现有资讯分类和常用分类，允许自由输入。
- 摘要 `Input.TextArea`，`maxLength=200`，`showCount`。
- 封面 `SingleImageUpload`。
- 正文 `Input.TextArea`，纯文本，保留换行。
- 底部按钮按状态变化：保存草稿、发布、保存修改、重新发布、撤回。
- 撤回使用 `Popconfirm` 二次确认；保存失败保留表单内容。

作者显示 `authorName || authorEmail`；状态使用固定中文文案和颜色。列表复用 `ModulePage`、`AdminTable`、`LoadFailure`；抽屉复用 `ReasonModal` 之外的现有模式，不新增通用组件。

### 7. 测试与配置

- Spring：`ArticleServiceTest` 覆盖创建、编辑、发布、撤回、trim 校验、封面校验、404/409；`AdminArticleControllerContractTest` 覆盖 401/403、摘要列表无正文、详情和写接口；`ArticlePersistenceAdapterTest` 覆盖排序、状态过滤和作者批量加载。
- admin：`tests/unit/api/articles.test.ts`、`tests/unit/pages/articles/ArticlesPage.test.tsx`、`ArticleFormDrawer.test.tsx`、`labels.test.ts`、`fixtures.ts`，并更新 `router.test.tsx`。
- 不修改 `apps/admin/tsconfig.json`：现有 `include` 已覆盖 `src` 和 `tests`。
- 不修改 `apps/admin/vite.config.ts`：现有 Vitest `include` 已覆盖 `tests/**/*.test.{ts,tsx}`。
- 不修改 `packages/vitest-config/src/base.ts`：覆盖率 `include` 已覆盖 `src/**/*.{ts,tsx}`。
- 不修改 `turbo.json`：现有 `test`、`check-types`、`lint` 输入已覆盖新增源码和测试。
- 不新增依赖，继续使用 Oxc。

### 8. 数据流

```text
admin /articles
  |
  | GET /api/v1/admin/articles?status=      -> 摘要列表（无 content）
  | GET /api/v1/admin/articles/{id}         -> 详情（含 content）
  | POST/PUT /api/v1/admin/articles[/{id}]  -> 新建/编辑
  | POST /api/v1/admin/articles/{id}/publish
  | POST /api/v1/admin/articles/{id}/withdraw
  v
Spring content 模块 -> MySQL articles / accounts / file_assets
  ^
  | GET /api/v1/articles（公开接口，保持现状）
web 学生端（本次未集成）
```

admin 通过现有 `request` 自动附加 accessToken；401 交给现有登录态处理，403 和业务错误显示中文提示。公开接口不改，学生端资讯页不在本次范围。

## Risks / Trade-offs

- **管理端列表响应结构变化** → 当前 admin 页面是唯一管理端消费者且仍为占位页；同一次变更内更新前端和契约测试，公开接口不变。
- **批量加载作者增加适配器复杂度** → 用 `ArticlePersistenceAdapterTest` 验证只调用一次作者批量查询，并保持排序和状态过滤。
- **trim 校验与 DTO 校验存在两层** → 前端负责即时反馈，后端负责最终边界；两边使用一致的 1–80、1–40、0–200 规则。
- **纯文本正文表现力有限** → 不引入富文本依赖；后续如需富文本，单独变更并补充存储/渲染规则。
- **没有阅读记录** → 产品文档中的“历史阅读记录保留”本次不实现，也不在 UI 承诺阅读统计；需要时单独建表和行为规格。
- **客户端分页** → 与现有管理端列表一致；资讯量增长后再引入后端分页，不改变当前页面交互。
- **撤回只允许已发布状态** → UI 只对已发布资讯显示撤回；其他状态由后端返回 409，前端显示中文错误。

## Migration Plan

1. 先发布 Spring 变更：管理端列表改为摘要并新增详情接口，公开接口不变；现有 admin 页面仍是占位页，无消费者受影响。
2. 再发布 admin 变更：替换 `/articles` 占位路由，接入新接口。
3. 回滚：恢复 admin 路由为占位页并回退 Spring DTO/控制器；没有数据库迁移或数据改写，已有资讯和状态不受影响。

## Open Questions

无阻塞实现的未决问题。富文本、阅读记录和资讯积分均明确排除在本次范围之外。
