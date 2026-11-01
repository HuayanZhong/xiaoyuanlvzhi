# Tasks

## 1. API 与上传基元

- [x] 1.1 在 `apps/web/app/utils/api.ts` 新增 `requestForm`，复用 Bearer、401 与信封解析，提交 `FormData` 且不手动设置 `Content-Type`；在 `tests/nuxt/utils/api.test.ts` 覆盖成功、401 与字段名，运行 `pnpm --filter web exec vitest run tests/nuxt/utils/api.test.ts` 通过
- [x] 1.2 新增 `apps/web/app/utils/upload-api.ts`，提供 `uploadImage(file)`，用字段名 `file` 调用 `files` 并返回 `{id,url,...}`；新增 `tests/nuxt/utils/upload-api.test.ts` 断言请求方法与 FormData 内容，`pnpm --filter web exec vitest run tests/nuxt/utils/upload-api.test.ts` 通过
- [x] 1.3 新增 `apps/web/app/utils/care-api.ts`，定义 `CareEligiblePlant`、`CareCheckin`、`CareSubmission` 类型与 `listEligiblePlants`、`listCheckins`、`getCheckin`、`submitCheckin`、`resubmitCheckin`，路径与请求体对齐 Spring；新增 `tests/nuxt/utils/care-api.test.ts` 覆盖五个请求，`pnpm --filter web exec vitest run tests/nuxt/utils/care-api.test.ts` 通过
- [x] 1.4 新增 `apps/web/app/utils/care-status.ts`，映射 `PENDING_REVIEW`/`APPROVED`/`REJECTED` 到中文标签、tone 与 `canCare` 判断，未知状态按只读处理；新增 `tests/nuxt/utils/care-status.test.ts` 覆盖三态与未知值，`pnpm --filter web exec vitest run tests/nuxt/utils/care-status.test.ts` 通过

## 2. 图片选择组件

- [x] 2.1 新增 `apps/web/app/components/UiImagePicker.vue`：支持 JPG/PNG/WebP、单张 ≤5 MB、最多 3 张，选择后立即调用 `uploadImage`，显示 1:1 本地预览与移除，上传失败保留已成功项并显示原因，移除或卸载时 `revokeObjectURL`；新增 `tests/nuxt/components/ui-image-picker.test.ts` 覆盖校验、上传、移除和上限，`pnpm --filter web exec vitest run tests/nuxt/components/ui-image-picker.test.ts` 通过

## 3. 我的绿植与打卡

- [x] 3.1 新增 `apps/web/app/pages/my-plants/index.vue`：用 `useAsyncData("my-plants", listEligiblePlants)` 渲染植株卡片，显示编号、名称、位置、养护间隔、上次通过、下次可打卡；待审核显示查看入口，未到间隔禁用提交，空态提供品种目录链接，失败提供重试；新增 `tests/nuxt/pages/my-plants.test.ts` 覆盖以上状态，`pnpm --filter web exec vitest run tests/nuxt/pages/my-plants.test.ts` 通过
- [x] 3.2 新增 `apps/web/app/pages/my-plants/[plantId].vue`：定位可打卡植株并展示本株打卡历史（由 `listCheckins` 按 `plantId` 过滤）；可打卡时渲染 `UiTextArea`（≤300 字）与 `UiImagePicker`，至少一项凭证，提交 `submitCheckin` 后跳转 `/care/{id}`；服务端 `CARE_INTERVAL_NOT_REACHED`、`CARE_CHECKIN_DUPLICATE`、`CARE_NOT_ACTIVE` 显示对应说明；新增 `tests/nuxt/pages/plant-care.test.ts` 覆盖提交、校验、三种冲突与不可打卡状态，`pnpm --filter web exec vitest run tests/nuxt/pages/plant-care.test.ts` 通过
- [x] 3.3 新增 `apps/web/app/pages/care/[id].vue`：显示打卡编号、植株、状态、凭证版本（说明、`UiFigure` 图片、提交时间、审核意见），已通过显示“积分按积分规则发放”，已驳回显示原因与重新提交表单；重提调用 `resubmitCheckin`，`CARE_SUBMISSION_ALREADY_REVIEWED` 提示刷新；记录不存在或无权限显示返回入口；新增 `tests/nuxt/pages/checkin-detail.test.ts` 覆盖三态、重提与冲突，`pnpm --filter web exec vitest run tests/nuxt/pages/checkin-detail.test.ts` 通过

## 4. 入口、守卫与文档

- [x] 4.1 在 `apps/web/app/utils/auth-route.ts` 的 `PROTECTED_PREFIXES` 增加 `/my-plants` 与 `/care`，更新 `tests/nuxt/middleware/auth.test.ts` 断言未登录跳转与 `returnTo`；`pnpm --filter web exec vitest run tests/nuxt/middleware/auth.test.ts` 通过
- [x] 4.2 在 `/me` 增加“我的绿植”入口、在 `/` 把在养数链接到 `/my-plants`、在 `/adoptions/[id]` 的养护中状态增加入口；更新 `tests/nuxt/pages/me.test.ts`、`tests/nuxt/pages/home.test.ts`、`tests/nuxt/pages/adoption-detail.test.ts` 断言链接存在，三个测试文件通过
- [x] 4.3 更新 `docs/design/web-visual-system.md` 与 `AGENTS.md`，补充 `/my-plants`、`/care/{id}`、凭证图 1:1 画框、上传组件与“学生只能上传私有图”；用 `pnpm format:check` 确认文档格式
- [x] 4.4 确认底部导航与横向导航仍只有首页、绿植、我的；更新 `tests/nuxt/utils/navigation.test.ts` 与 `tests/nuxt/components/ui-bottom-nav.test.ts`（若断言受影响），`pnpm --filter web exec vitest run tests/nuxt/utils/navigation.test.ts tests/nuxt/components/ui-bottom-nav.test.ts` 通过

## 5. 集成验证

- [x] 5.1 在 4000 端口用真实后端验证：上传一张接近 5 MB 的图片经 Nitro 转发成功、返回文件 ID 并能在画框显示；记录结果，若代理缓冲或 413 则修复 `server/api/[...path].ts` 后复测
- [ ] 5.2 在 1440、768、375、320 视口与日间/暗夜下检查 `/my-plants`、`/my-plants/{plantId}`、`/care/{id}`：无横向滚动、卡片与凭证网格不溢出、焦点可见；记录截图或检查结果
- [x] 5.3 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test`、`pnpm format:check`，全部通过；再从根目录运行 `pnpm verify`，确认全量检查通过

## Workflow follow-up

- 需求与实现评审通过后归档变更。
- 归档前运行 `openspec validate student-care-checkins --strict`。
