# Tasks

## 1. 通用 API 客户端

- [x] 1.1 新建 `apps/admin/src/api/client.ts`，提供 `ApiEnvelope<T>`、`ApiError`、`request<T>`、`requestVoid` 以及 HTTP/超时/网络错误映射；验证：单元测试覆盖成功信封、`success=false`、401/403/5xx、超时和网络错误，`pnpm --filter admin test` 通过
- [x] 1.2 将 `api/auth.ts` 迁移到 `client.ts`，删除本地 `AuthApiError` 与重复的解包函数；验证：`apps/admin/tests/unit/api/auth.test.ts` 全部通过，登录、会话恢复和退出行为不变

## 2. 绿植与文件 API

- [x] 2.1 在 `api/plants.ts` 定义品种/单株类型、列表与写操作，覆盖 `GET/POST/PUT /admin/plant-species`、`GET/POST/PUT /admin/plant-individuals` 及状态操作子路径；验证：类型检查通过，单元测试 mock `@/lib/http` 并断言每个方法的路径、HTTP 方法和请求体
- [x] 2.2 在 `api/files.ts` 实现 `uploadImage` 与 `fileUrl`，使用 multipart 字段 `file` 并携带 `isPublic=true`；验证：单元测试断言 FormData 字段、查询参数和返回的文件 ID
- [x] 2.3 为 `plants.ts` 的已知业务错误补充测试，确认 `ApiError.code` 保留 `PLANT_SPECIES_EXISTS`、`PLANT_CODE_EXISTS`、`PLANT_SPECIES_DISABLED`；验证：`pnpm --filter admin test` 通过

## 3. 图片上传组件

- [x] 3.1 实现 `components/common/ImageUpload.tsx`：受控 `number[]`、`max`、类型与大小校验、上传、移除和预览；验证：组件测试覆盖上传成功回填 ID、达到上限后禁用上传、移除图片
- [x] 3.2 补充上传失败、格式不支持、超过 5 MB 的测试；验证：失败时 `onChange` 不被调用且显示中文提示

## 4. 品种档案页面

- [x] 4.1 实现 `/plants/species` 列表：请求、加载状态、失败重试、空态、名称与状态筛选、客户端分页和状态文案；验证：页面测试覆盖渲染、筛选、分页、失败重试与空态
- [x] 4.2 实现品种抽屉表单：8 个字段、校验、新增/编辑、409 映射到名称字段、保存失败保留输入；验证：页面测试覆盖必填校验、名称重复、编辑提交和后端异常
- [x] 4.3 实现启用/停用：二次确认、成功后刷新列表、失败提示；验证：测试覆盖确认、取消和请求失败
- [x] 4.4 实现“查看单株”跳转到 `/plants/instances?speciesId=<id>`；验证：路由或页面测试断言跳转地址
- [x] 4.5 更新 `README.md` 的 admin 页面说明，标明品种档案已实现；验证：文档描述与实际路由一致

## 5. 单株库存页面

- [x] 5.1 实现 `/plants/instances` 列表：请求、关键词/品种/状态筛选、`speciesId` 初始筛选与 URL 同步、客户端分页和状态文案；验证：页面测试覆盖初始筛选、无效参数、组合筛选和重置
- [x] 5.2 实现单株抽屉表单：新增/编辑、编辑时编号与品种只读、仅启用品种可选、图片最多 3 张、409 映射；验证：页面测试覆盖新增、编号重复、编辑只读和图片上限
- [x] 5.3 实现送修、维护完成、停用：状态可用性、二次确认、成功后刷新、失败保留原状态；验证：测试覆盖三种操作及不满足状态时不可用
- [x] 5.4 更新 `README.md` 的单株库存说明；验证：文档与页面行为一致

## 6. 路由与集成

- [x] 6.1 在 `router/index.tsx` 用真实页面替换两个占位路由；验证：`apps/admin/tests/unit/router.test.tsx` 断言两个路径渲染真实页面标题而不是占位说明
- [x] 6.2 启动 admin 与 Spring，按规格走通“新建品种 → 新建单株 → 筛选/分页 → 送修/维护完成 → 停用 → 查看关联单株”；验证：浏览器操作结果与规格场景一致，控制台无错误
- [x] 6.3 在 320px 视口检查两个列表和抽屉，确认页面无横向滚动且表单可完成填写与保存；验证：浏览器检查通过

## 7. 验证

- [x] 7.1 分别运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`；验证：三条命令均以 0 退出
- [x] 7.2 从仓库根目录运行 `pnpm verify`；验证：全部任务通过，格式检查无未格式化文件

## Workflow follow-up

- 归档前确认 `openspec validate admin-plant-resources --strict` 通过。
- 归档时把 `admin-plants` 增量规格同步到主规格。
