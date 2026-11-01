# Design

## Context

学生端已经通过 `useAsyncData` 在服务端取数，`/points`、`/rewards` 和订单页要沿用同一套取数与错误处理方式：页面用函数键命名缓存、失败时返回结构化结果而不是抛错、变更后 `refresh()` 当前页。现有可复用件包括 `UiConfirmDialog`（无插槽，只接受文案）、`FolioSection`/`Ledger`/`TagRow`、`Stamp`、`UiFigure`（私有图片）、`UiAlert`/`UiEmptyState`/`UiLoading`、`resolveActionError`（业务错误显示服务端中文原因）。

后端已提供积分余额、流水、奖励、订单与取消接口，本次不修改 Spring。兑换与取消会同时改变余额、库存和订单三处数据，是本次唯一需要跨页面协调的地方。

## Goals / Non-Goals

**Goals:**

- 四页路由与主导航第 5 项接入现有页面壳。
- 兑换与取消之后，余额、商城剩余数量和订单状态在同一会话内保持一致。
- 状态与来源标签集中在纯函数模块，便于单测与后续通知复用。

**Non-Goals:**

- 不改 Spring 接口、不新增 BFF 聚合接口、不引入前端缓存库或状态管理库。
- 不做通知、首页六区块、资料编辑、问题反馈。
- 不做订单分页与商城筛选；接口返回全量数据，首版直接渲染。

## Decisions

### 1. 四个页面，各自用函数键缓存

```
/points            useAsyncData("points", () => Promise.all([balance, ledger]))
/rewards           useAsyncData("rewards", () => Promise.all([listRewards, balance]))
/rewards/orders    useAsyncData("rewards-orders", listOrders)
/rewards/orders/[id]  useAsyncData(`order:${id}`, () => getOrder(id))
```

每页把「数据 + 错误文案 + 是否不可查看」放进同一个返回对象，与 `/tasks/[id]` 一致；列表页失败返回可重试错误，详情页对 403/404 返回「无法查看」而不是错误提示。

### 2. 余额统一读 `GET /points/balance`

积分页和商城页需要余额做兑换前置判断，用专用余额接口而不是复用 `profile`：`profile` 还带在养绿植数和资料字段，商城里用不到，且多一次资料请求没有收益。首页与「我的」继续使用已经取到的 `profile.pointsBalance`，不新增请求。

### 3. 变更后用 `clearNuxtData` 让跨页缓存失效

`useAsyncData` 的缓存按 key 在会话内保留，从订单页返回商城会拿到旧库存。因此兑换成功和取消成功后：

- `refresh()` 当前页数据；
- 调用 `clearNuxtData("points")`、`clearNuxtData("rewards")`，让积分页和商城下次进入重新取数；
- 取消成功后同时 `refresh()` 订单页与余额。

选 `clearNuxtData` 而不是全局状态库：数据量小、页面少，引入 Pinia 或自建 store 会多一套需要维护的同步逻辑。

### 4. `UiConfirmDialog` 增加可选默认插槽

兑换确认需要展示商品、扣除积分、兑换后余额、领取地点和领取期限，纯文案拼不出可读结构。给 `UiConfirmDialog` 增加可选 `slot`，渲染在 `message` 与操作区之间；未传插槽时行为与现在完全一致（退出登录、撤回申请等既有调用不变）。替代方案是新建一个兑换专用弹窗组件，但会复制焦点管理与遮罩逻辑。

### 5. 兑换前置判断与状态标签收敛到纯函数模块

- `point-source.ts`：`CARE_CHECKIN`→养护打卡、`ECO_TASK`→环保任务、`REDEMPTION`→兑换扣减、`REDEMPTION_REFUND`→兑换退回、`ADJUSTMENT`→管理员调整，未知来源→其他变动；同时给出增减符号与语气。
- `reward-status.ts`：订单状态标签（待领取/已领取/已取消/已超时）与印章语气；`canRedeem(reward, balance)` 返回可兑换或禁用原因（积分不足/库存不足/无法核对积分）；剩余可兑换数量直接使用接口的 `remainingStock`，不在前端重算。

把判断放进纯函数而不是页面内联，是为了让「积分不足」「库存不足」这类分支能被单测覆盖，也避免商城卡片和兑换弹窗各算一遍。

### 6. 数据流

```
浏览器 / SSR (Nuxt)
  /points      --GET /api/v1/points/balance, /points/ledger--> Nitro /api/v1 转发 --|
  /rewards     --GET /api/v1/rewards, /points/balance------------------------------|--> Spring
  /rewards/orders --GET /api/v1/rewards/orders------------------------------------|
  兑换/取消     --POST redeem / orders/{id}/cancel-------------------------------|
                                                                                    |
  Spring: 扣分 + 占库存 + 建订单（同事务）；取消/超时：退分 + 释放库存 + 写流水
```

SSR 期间由 Nuxt 服务端带 Cookie 直连 Spring，浏览器端请求经 Nitro `server/api` 转发，与现有页面一致；前端不读取任何环境变量，API 基地址仍来自 `runtimeConfig.public.apiBaseUrl`。

### 7. 工具链与测试范围不变

新增代码都在 `apps/web/app` 与 `apps/web/tests` 内，`apps/web` 的 `tsconfig`、Vitest 配置、覆盖率 include（`app/**`、`utils/**`）和 Turbo 输入不需要改动；不新增依赖，Oxc 仍是唯一 lint/format 工具链。导航与未登录重定向测试需要补充第 5 项与 `/points`、`/rewards` 前缀。

## Risks / Trade-offs

- **两个请求的列表页**：`/points` 与 `/rewards` 各发两个请求，其中一个失败时页面可能半有数据。→ 每个请求独立收敛为 `{data, error}`，余额失败只影响余额与兑换可用性，不影响流水与商城展示。
- **兑换后缓存过期**：若遗漏 `clearNuxtData`，返回商城会看到旧库存。→ 兑换与取消成功后统一清 `points`、`rewards` 两个 key，并在测试中断言清理被调用。
- **服务端时钟与本地时钟不一致**：前端不计算领取截止时间，直接显示服务端返回的 `pickupDeadline`；确认弹窗只显示「领取期限 N 天」，避免用本地时间推出错误日期。
- **超时状态不是实时的**：后端每 60 秒扫描一次过期订单，学生看到的是上次加载时的状态。→ 订单页提供刷新入口，不在前端轮询或自行推算超时。
- **未知状态**：后端新增状态时前端可能不识别。→ 未知订单状态显示「状态未知」并保持只读，不显示取消入口。
- **确认弹窗内余额是快照**：停留期间余额可能被其他操作改变。→ 服务端校验兜底，`POINTS_INSUFFICIENT`/`REWARD_OUT_OF_STOCK` 走「显示原因 + 刷新」，不把失败当成功。
