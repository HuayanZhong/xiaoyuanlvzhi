# Design

## Context

学生端现有的页面只有首页、我的、登录注册和 404；数据获取统一走 `useAsyncData` + `useApi().request`（见 [proposal.md](proposal.md)）。三个约束直接影响本次实现：

- Spring 的 `anyRequest().authenticated()` 让文件接口即使在 `isPublic=true` 时也要求登录态，`<img src>` 无法附带 Bearer；admin 已用“带认证取 blob，再 `URL.createObjectURL`”解决。
- web 是 SSR 应用，服务端没有对象 URL；首屏图片只能先渲染画框占位，再由客户端补图。
- 路由守卫的保护范围目前是硬编码的 `["/", "/me"]`，新增业务页必须同步，否则未登录访问会先拿到 401 而不是登录页。

列表接口（plants / adoptions）都是直接返回数组，没有分页。

## Goals / Non-Goals

**Goals:**

- 用一套可复用的领域数据模块、图片读取和状态映射，支撑绿植目录与领养申请两个页面组。
- 保持 SSR 首屏可用：品种名称、数量、状态在服务端渲染，封面可以后到。
- 让后续模块（养护、任务、积分、反馈）可以直接复用图片画框、时间线和表单控件。

**Non-Goals:**

- 不新增或修改 Spring 接口，不做分页、搜索联想和图片上传。
- 不做表单草稿保存、跨设备同步和离线缓存。
- 不改造 admin 端的图片实现，也不把 blob 方案下沉到共享包。

## Decisions

### 1. 领域 API 模块沿用 `utils/*-api.ts`

新增 `utils/plant-api.ts` 和 `utils/adoption-api.ts`，与 `auth-api.ts`、`profile-api.ts` 保持同一形态：导出类型 + 薄函数，内部只调用 `useApi().request`。类型按 `backend/docs/openapi.yaml` 的 `SpeciesView`、`ApplicationView` 手写，字段名与 Spring 一致。

页面不直接拼 URL，也不在组件里写 `request` 调用，保证后续模块复制的是同一层。

**替代方案**：把所有调用集中在 composable 里。会让 SSR 取数和客户端刷新出现两套入口，放弃。

### 2. 列表页由 URL 查询参数驱动

`/plants` 的 `keyword` / `location` 从 `route.query` 读取，筛选表单提交时用 `router.replace` 更新查询参数；`useAsyncData` 的 key 包含这两个值，参数变化自动重新取数。详情页的 key 包含路由参数。

这样刷新、后退和分享都能回到同一结果，不需要额外的 client state 同步。

**替代方案**：本地 `ref` 存筛选并手动 `refresh()`。URL 不反映状态，返回时筛选丢失。

### 3. 图片：客户端取 blob，画框先占位

在 `ApiClient` 上增加 `requestBlob(path)`：复用同一 ky 实例、Bearer 注入和 401 事件，但跳过 JSON 信封解析。新增 `useFileUrl(fileId)` composable，在 `onMounted` 后取 blob 并创建对象 URL，在 `fileId` 变化和卸载时 `revokeObjectURL`。

`UiFigure` 组件负责固定画框（列表 `1:1`、详情 `4:3`）、1px 线框、角标编号条和三种状态：加载中、失败可重试、无图。服务端渲染时一律输出加载中占位，画框尺寸由 CSS 固定，图片到达后不产生布局位移。

**替代方案 A**：新增只处理 GET 的 Nitro 媒体路由，用 Cookie 换 Bearer。SSR 可直接出图，但把令牌注入从“应用适配层显式携带”扩大到“服务端按 Cookie 隐式授权”，与现有安全边界冲突，且需要新路由与缓存策略。

**替代方案 B**：SSR 时把图片转 base64 内联。单图上限 5 MB，会显著放大首屏 HTML，放弃。

### 4. 状态映射集中在一个模块

新增 `utils/adoption-status.ts`，为 8 个状态导出 `{ label, tone, hint, actions }`：

| 状态             | 标签       | 语气    | 可用操作       |
| ---------------- | ---------- | ------- | -------------- |
| `PENDING_REVIEW` | 待审核     | pending | 撤回           |
| `REJECTED`       | 已驳回     | danger  | 修改备注后重提 |
| `WAITING_PICKUP` | 待领取     | pending | 取消申请       |
| `CANCEL_REVIEW`  | 取消审核中 | neutral | 只读           |
| `ACTIVE`         | 养护中     | alive   | 申请归还       |
| `RETURN_REVIEW`  | 归还审核中 | neutral | 只读           |
| `ENDED`          | 已结束     | neutral | 只读           |
| `CANCELLED`      | 已取消     | neutral | 只读           |

语气直接复用现有 `Stamp` 的 `alive / pending / danger / neutral`，不新增颜色。未知状态回退到「状态未知」并保持只读，避免把后端新增状态渲染成可操作。

**替代方案**：在每个页面里写 `v-if` 判断。状态分散、无法测试，后续养护/任务状态会重复同样的问题。

### 5. 路由守卫改为前缀匹配

把 `PROTECTED_PAGES` 集合换成 `isProtectedPath(path)`：`/`、`/me` 精确匹配，`/plants`、`/adoptions` 及其子路径前缀匹配；登录注册仍是公开页，其余路径（含 404）保持公开。`resolveUnauthorizedRedirect` 复用同一判断。

这样未登录访问 `/plants/3` 会带着 `returnTo` 去登录页，登录后回跳，而不是先渲染一个 401 错误页。

### 6. 页面结构与新增组件

- `/plants`：页眉 + 筛选条 + 品种画框栅格（1px 线框，无阴影），底部「我的申请」次级入口。
- `/plants/[id]`：详情画框 + 养护说明字段行 + 领取说明 + 主操作和「返回目录」。
- `/adoptions`：页眉 + 申请字段行列表，状态用 `Stamp`，最近处理意见作为次行文字。
- `/adoptions/[id]`：状态头 + 时间线 + 资料字段行 + 按状态操作区；撤回/取消/归还复用 `UiConfirmDialog`。

新增可复用组件：`UiFigure`（画框）、`UiTextArea`（备注，带字数计数）、`UiTimeline`（状态时间线）。三者都按视觉规范实现，后续养护和任务直接复用。

### 7. 时间格式固定时区

新增 `utils/datetime.ts`，用 `Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai" })` 输出日期和日期时间。固定时区避免服务端与浏览器时区不同造成 SSR 水合不一致。

### 8. 写操作的状态处理

每个操作按钮在提交期间禁用并显示进行中；成功后 `refresh()` 详情并保留当前页面；失败时展示 `resolveRequestError` 的文案，不清空已填备注，不本地推断新状态。冲突类错误额外提供「刷新详情」。

## Risks / Trade-offs

- **封面后加载** → 固定画框尺寸 + 加载占位，避免布局位移；首屏没有图片但仍可完成品种判断。
- **对象 URL 泄漏** → `useFileUrl` 在 `fileId` 变化、重试和卸载时统一释放；组件测试断言 revoke 调用。
- **图片 401 触发登出** → 图片请求复用 401 事件，登录失效时按既有规则回登录页；404 只置为失败状态，不清除登录态。
- **状态映射与后端漂移** → 映射集中且带未知状态回退；针对 8 个状态写单元测试。
- **守卫前缀写宽** → 只匹配 `/plants`、`/adoptions` 及其子路径，未知路径仍走 404，测试覆盖 `anonymous` 与 `authenticated` 两种情况。
- **表单与 URL 循环** → 筛选提交只 `router.replace`，不在 watch 里再次写 URL。

## Migration Plan

纯前端新增页面，无数据迁移和部署顺序要求。回滚即移除新增路由与导航入口，已有首页和“我的”不受影响。

## Open Questions

无影响规格或任务拆解的未知项。图片缓存策略、品种列表分页可以等数据量增长后再处理。
