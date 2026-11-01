# Tasks

## 1. 数据层与工具

- [x] 1.1 在 `apps/web/app/utils/api.ts` 的 `ApiClient` 增加 `requestBlob(path)`：复用同一 ky 实例、Bearer 注入和 401 事件，但不解析 JSON 信封；验证：`pnpm --filter web test` 中 `tests/nuxt/utils/api.test.ts` 新增用例通过——携带 Bearer、返回 Blob、401 触发一次未认证事件、404 抛错且不清除登录态。
- [x] 1.2 新增 `apps/web/app/composables/useFileUrl.ts`：客户端取 blob、创建对象 URL，`fileId` 变化/重试/卸载时 revoke；验证：`tests/nuxt/composables/useFileUrl.test.ts` 断言成功、失败、重试和 revoke 调用。
- [x] 1.3 新增 `apps/web/app/utils/datetime.ts`，用 `Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai" })` 输出日期与日期时间，空值返回“—”；验证：`tests/nuxt/utils/datetime.test.ts` 覆盖日期、日期时间、空值和跨时区输入。
- [x] 1.4 新增 `apps/web/app/utils/adoption-status.ts`，导出 8 个状态的 `{ label, tone, hint, actions }` 与未知状态回退；验证：`tests/nuxt/utils/adoption-status.test.ts` 覆盖全部状态标签、语气、可用操作和未知状态只读。
- [x] 1.5 新增 `apps/web/app/utils/plant-api.ts` 与 `apps/web/app/utils/adoption-api.ts`：类型对齐 `backend/docs/openapi.yaml` 的 `SpeciesView`、`ApplicationView`，函数覆盖列表、详情、创建、撤回、重提、取消申请、申请归还；验证：`tests/nuxt/utils/plant-api.test.ts` 与 `adoption-api.test.ts` 断言路径、方法、请求体与返回值。

## 2. 共享组件

- [x] 2.1 新增 `apps/web/app/components/UiFigure.vue`：固定比例画框（`square` 1:1、`wide` 4:3）、1px 线框、编号条、加载中/失败可重试/无图三种状态，加载中不用脉冲；验证：`tests/nuxt/components/ui-figure.test.ts` 覆盖三种状态、比例类名和重试事件。
- [x] 2.2 新增 `apps/web/app/components/UiTextArea.vue`：复用 `.ui-control` 表单样式，支持 `maxlength` 字数计数、`error`、`hint` 和 `aria-describedby`；验证：`tests/nuxt/components/ui-text-area.test.ts` 断言计数、错误替代 hint、禁用态和 `aria-invalid`。
- [x] 2.3 新增 `apps/web/app/components/UiTimeline.vue`：1px 竖线 + 方形节点 + 时间 + 标题 + 说明，最新事件在顶部；验证：`tests/nuxt/components/ui-timeline.test.ts` 断言节点数量、时间和空时间线回退文案。

## 3. 路由、导航与既有修正

- [x] 3.1 将 `apps/web/app/utils/auth-route.ts` 的 `PROTECTED_PAGES` 改为前缀判断：`/`、`/me` 精确匹配，`/plants`、`/adoptions` 及其子路径受保护，登录注册与未知路径保持公开；验证：`tests/nuxt/middleware/auth.test.ts` 覆盖未登录访问 `/plants/3` 带 `returnTo` 跳转、已登录访问登录页回首页、未知路径仍公开。
- [x] 3.2 在 `apps/web/app/layouts/default.vue` 的 `navItems` 加入「绿植」，顶栏与底部导航同步；验证：`tests/nuxt/components/ui-bottom-nav.test.ts` 与页面壳相关测试断言 `/plants` 入口存在且选中态正确。
- [x] 3.3 修正 `apps/web/app/pages/me.vue` 中未注册的 `<UiLedger>` 为 `<Ledger>`，与本变更新增列表保持一致；验证：`tests/nuxt/pages/me.test.ts` 断言页面渲染 `.ui-ledger` 且无 Vue 未解析组件警告。

## 4. 绿植页面

- [x] 4.1 新增 `apps/web/app/pages/plants/index.vue`：品种画框栅格、关键词与位置筛选、URL 查询同步、空目录与无匹配结果两种空态、清空筛选、顶部「我的申请」入口；验证：`tests/nuxt/pages/plants.test.ts` 覆盖列表渲染、筛选写回 URL、无结果、清空筛选和封面缺失。
- [x] 4.2 新增 `apps/web/app/pages/plants/[id].vue`：详情画框、养护字段行、领取说明、主操作三态（申请领养/查看申请/暂无可领养植株）和返回目录；验证：`tests/nuxt/pages/plant-detail.test.ts` 覆盖三种主操作、不可申请品种和加载失败重试。
- [x] 4.3 新增申请确认：在品种详情内展开确认区或独立确认视图，展示品种、备注（≤200 字）、领取说明，提交后跳转申请详情；验证：`tests/nuxt/pages/plant-detail.test.ts` 断言备注超长阻止提交、提交调用 `POST adoptions`、成功后 `navigateTo` 申请详情。

## 5. 领养页面

- [x] 5.1 新增 `apps/web/app/pages/adoptions/index.vue`：按更新时间倒序的申请字段行、状态标签与印章、最近处理意见、空态入口和加载失败重试；验证：`tests/nuxt/pages/adoptions.test.ts` 覆盖排序、状态文案、空态和失败重试。
- [x] 5.2 新增 `apps/web/app/pages/adoptions/[id].vue`：状态头、时间线、资料字段行、分配单株与领取信息、驳回/归还原因，以及按状态显示的操作区；验证：`tests/nuxt/pages/adoption-detail.test.ts` 覆盖 8 个状态的操作可见性与只读状态。
- [x] 5.3 接通四类写操作：撤回、修改备注重提、取消申请、申请归还，均经 `UiConfirmDialog` 或表单确认，提交中禁用，成功后 `refresh()`，冲突时提示刷新；验证：`tests/nuxt/pages/adoption-detail.test.ts` 断言每种操作的请求路径、请求体、成功刷新和失败保留备注。

## 6. 入口与文档

- [x] 6.1 首页“暂无在养绿植”空态增加前往 `/plants` 的动作，保留现有文案；验证：`tests/nuxt/pages/home.test.ts` 断言文案不变且链接指向 `/plants`。
- [x] 6.2 更新 `docs/design/web-visual-system.md`：记录 `UiFigure` 画框比例与三种状态、`UiTextArea` 和 `UiTimeline`，并说明封面图按认证读取、服务端先出占位；验证：文档描述与组件实际类名和状态一致。
- [x] 6.3 更新 `AGENTS.md` 的组件与页面约定，补充绿植/领养路由、状态映射模块和图片读取方式；验证：`AGENTS.md` 中的路径与命令可对应到实际文件。

## 7. Verification

- [x] 7.1 运行 `pnpm --filter web format`、`lint`、`check-types`、`test`、`format:check`；验证：全部通过。
- [x] 7.2 运行 `pnpm --filter web build`；验证：构建成功，Nitro `/api` 代理路由仍在产物中。
- [x] 7.3 浏览器检查 1440 / 768 / 375 / 320 的日间与暗夜：品种列表与详情、筛选 URL 回放、申请列表与详情、四种写操作、图片加载与失败占位、键盘焦点、无横向滚动；验证：逐项记录，320px 下 `scrollWidth === innerWidth`。
- [x] 7.4 运行根目录 `pnpm verify`；验证：全部任务通过。
- [x] 7.5 运行 `openspec validate student-plants-adoption --strict`；验证：通过。

## Workflow follow-up

- 在评审通过后归档本变更。
- 归档后验证主 specs 与归档结果。
