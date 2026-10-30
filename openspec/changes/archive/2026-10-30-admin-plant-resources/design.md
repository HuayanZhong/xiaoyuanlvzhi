# Design

## Context

见 `proposal.md` 的动机。当前 admin 已有真实的登录态、Bearer 注入、401 处理和后台壳，但 `/plants/species` 与 `/plants/instances` 仍是占位页。Spring 已实现 `GET/POST/PUT /api/v1/admin/plant-species`、`GET/POST/PUT /api/v1/admin/plant-individuals` 及其状态操作子路径，并提供 `POST /api/v1/files` 与 `GET /api/v1/files/{id}`。本次只改 admin，web 不参与。

数据流：

```
SpeciesPage / InstancesPage
        |
        v
  api/plants.ts ──> api/client.ts (request<T>, ApiError) ──> lib/http.ts
                                                               | ky + Bearer + 401 hook
                                                               v
                                                        /api/v1/admin/...
                                                               |
                                                               v
                                                     Vite 开发代理 -> Spring
ImageUpload
        |
        v
  api/files.ts ──multipart field=file, isPublic=true──> POST /api/v1/files
  预览：带 Bearer 的 GET /api/v1/files/{id}，转成 blob URL 后渲染
```

`api/client.ts` 只属于 admin，不放进共享包；共享包需要保持环境无关，且目前没有第二个应用使用它。

## Goals / Non-Goals

**Goals:**

- 两个资源页面可完成日常维护：查、筛、分页、建、改、启停、送修/维护完成/停用。
- 抽出通用响应信封与错误映射，后续模块不再复制 `auth.ts` 里的解析逻辑。
- 建立可复用的列表 + 抽屉表单 + 图片上传模式，供领养、养护、任务等页面沿用。
- 保持现有登录态、后台壳、主题和 toast 行为不变。

**Non-Goals:**

- 服务端分页、筛选或排序；本次接口仍全量返回。
- 删除品种或单株；Spring 没有删除接口，停用即下线。
- 展示“当前领养学生”；`IndividualView` 不包含该字段，等领养模块再补。
- 修改 Spring、共享包、环境配置或工具链。
- 学生端 web 的任何页面。

## Decisions

### D1：抽出 `api/client.ts`，auth 迁移复用

在 `apps/admin/src/api/client.ts` 提供：

- `ApiEnvelope<T>` 类型；
- `ApiError`（`code`、`message`、可选 `status`）；
- `request<T>(path, options)` 和 `requestVoid(path, options)`；
- HTTP、超时、网络错误的统一中文映射。

`api/auth.ts` 改为调用 `request`，删除本地的 `AuthApiError`、`unwrap`、`toAuthApiError`，行为保持不变；现有测试改为断言 `ApiError`。

备选：每个领域模块各写一份解包逻辑（重复且错误文案会漂移）；把客户端放进共享包（只有 admin 使用，且共享包不应读取应用环境）。

### D2：领域 API 按后端 DTO 建模

`api/plants.ts` 定义 `SpeciesView`、`SpeciesRequest`、`IndividualView`、`IndividualRequest` 和状态联合类型，字段与 Spring 返回一致。所有写操作返回更新后的视图，页面用返回值或重新拉取列表保持一致。

`api/files.ts` 提供 `uploadImage(file)`，用 `FormData` 以字段名 `file` 提交并携带 `isPublic=true`；`loadImage(id)` 通过现有 HTTP 客户端带 Bearer 读取图片内容。

### D3：客户端筛选与分页

两个列表接口都全量返回，本次在客户端完成筛选、排序和分页：

- 品种按 `updatedAt` 倒序；单株按 `createdAt` 倒序（后端已排序，前端再排一次保证确定性）。
- 每页 10 条；点击“查询”应用筛选并把页码重置为 1；“重置”清空筛选。
- 筛选用 `useMemo` 计算，分页用 antd `Pagination` 或 `Table` 内置分页。

备选：给 Spring 加分页参数。这需要改另一个仓库、影响学生端接口，超出本次范围；数据量增长后再单独提案。

### D4：抽屉表单，一个页面一个抽屉

两页各自维护 `editing: SpeciesView | IndividualView | null` 和 `open`，新增与编辑复用同一 Drawer。字段校验镜像后端约束；已知错误码映射到字段错误：

- `PLANT_SPECIES_EXISTS` → 品种名称；
- `PLANT_CODE_EXISTS` → 单株编号；
- `PLANT_SPECIES_DISABLED` → 品种选择。

其他错误用 toast 显示后端 `message`。保存期间按钮 loading 并禁止重复提交；成功后关闭抽屉、toast 提示并重新拉取列表。

备选：Modal（字段多、图片上传会内部滚动）；独立页面（多 4 个路由，当前字段量不需要）。

### D5：图片上传组件

`ImageUpload` 是受控组件：`value: number[]`、`onChange`、`max`。

- 用 antd `Upload` 的 `customRequest` 调 `uploadImage`，成功后把返回的 `id` 写入 value；
- `beforeUpload` 校验类型（JPG/PNG/WebP）和大小（≤5 MB）；
- 已有图片用 `AuthenticatedImage` 预览：它通过带 Bearer 的 `loadImage` 读取 blob，再用 `URL.createObjectURL` 渲染，组件卸载或文件变化时 `revokeObjectURL`；
- 品种 `max=1`，单株 `max=3`；
- 上传失败不写入 value，并 toast 提示。

Spring 的 `/api/v1/files/{id}` 仍要求认证，即使上传时 `isPublic=true`；因此不能把文件地址直接作为 `<img src>`。

备选：保存 URL 而不是文件 ID。后端字段是 `Long coverFileId` / `List<Long> imageFileIds`，只能存 ID。

### D6：路由与查询参数

`router/index.tsx` 把两个占位元素替换为真实页面组件；路径不变。单株页读取 `speciesId` 作为品种初始筛选，无效值忽略；点击“查询”时把 `speciesId` 同步回 URL（`replace`），保证刷新和分享后筛选一致。

### D7：页面结构与反馈

两页沿用占位页的 `Card` + `Breadcrumb` + `Typography.Title` 结构，内容为筛选工具栏、表格和分页。状态用带中文文案的 `Tag`；操作列按状态显示可用操作；停用、送修、维护完成使用 `Popconfirm` 或 `Modal.confirm` 二次确认。成功/失败复用现有 `emitToast`。不使用自定义品牌色，保持 antd 默认主题和现有设计 token。

### D8：测试与配置

- 测试沿用 `tests/unit` 的 Vitest + Testing Library 结构；API 层 mock `@/lib/http`（与 `auth.test.ts` 一致），页面测试 mock `@/api/plants` 和 `@/api/files`。
- 新增测试覆盖：列出/筛选/分页、表单必填与 409 映射、状态操作可用性、上传类型/大小/数量限制、加载失败重试、空态、URL 初始筛选。
- 覆盖率 include 已是 `src/**/*.{ts,tsx}`，新文件自动纳入；tsconfig 的 `@` 别名已存在；Turbo 的 test/check-types 输入无需新增；继续只用 Oxc，不新增依赖或第二套工具链。

## Risks / Trade-offs

- **全量列表 + 客户端分页**：数据量大时首屏变慢 → 先接受，后续用独立提案加后端分页；本设计不把分页写进接口契约。
- **图片预览需要认证请求**：每张图片单独读取并生成 blob URL，列表图片多时请求数增加 → 先接受；对象 URL 在卸载时释放，避免泄漏。后续可在需要时加缓存或缩略图。
- **移除图片不删除服务端文件**：后端没有删除文件接口，会产生孤儿文件 → 记录为已知成本，不在本次清理。
- **`carePoints` 与产品文档的积分规则重复**：当前以后端字段为准，表单必须收；后续积分规则模块可以决定是否废弃该字段。
- **错误文案依赖后端中文**：后端 `message` 已为中文，仍保留按状态码的兜底文案，避免空提示。
- **auth 重构回归**：`AuthApiError` 被 `ApiError` 取代 → 现有 auth 测试必须全部通过后再进入页面开发。
- **`availableCount` 不是总关联数**：列名使用“可领养单株”，避免管理员误解。

## Migration Plan

无数据迁移。两个路由从占位页切换为真实页面，属于纯前端增量；回滚时还原 `router/index.tsx` 和新增文件即可，不影响登录态与既有页面。

## Open Questions

无。后端分页和“当前领养学生”字段都属于后续模块，不影响本次规格与任务拆分。
