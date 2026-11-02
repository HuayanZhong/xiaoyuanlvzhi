# Design

## Context

See [proposal.md](proposal.md) for motivation and the delta spec for required behavior.

当前首页只有 `home-profile` 与共享的 `notifications` 两个 `useAsyncData`，页面结构是“在养记录 + 积分余额 + 消息条 + 档案条”。本次要补齐首页六区块，所需的读取接口都已存在：

| 区块                       | 接口                                                                                   | 现有工具                                                         |
| -------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 待处理事项                 | `GET care/checkins`、`GET adoptions`、`GET tasks/participations`、`GET rewards/orders` | `care-api.ts`、`adoption-api.ts`、`task-api.ts`、`reward-api.ts` |
| 环保任务                   | `GET tasks`                                                                            | `task-api.ts` + `task-status.ts` 的 `canJoin`                    |
| 养护提醒                   | `GET care/eligible-plants`                                                             | `care-api.ts`                                                    |
| 我的绿植 / 当前积分 / 消息 | `home-profile`、`notifications`                                                        | `profile-api.ts`、`notification-api.ts`                          |

数据流不变：浏览器经 Nitro `/api` 转发到 Spring，SSR 直接访问 `SPRING_API_ORIGIN`。

## Goals / Non-Goals

**Goals:**

- 首页首屏一次渲染六个区块，学生能直接看到待办、可报名任务和到期养护。
- 待处理分类、任务筛选和到期植株筛选由纯函数完成，页面只负责展示与跳转。
- 任一辅助请求失败只影响对应区块，不拖垮资料、积分和消息。

**Non-Goals:**

- 不新增统一待办页、不改任务或领养的状态机。
- 不把“待领取绿植”（领养 `WAITING_PICKUP`）纳入待处理分类。
- 不新增 Spring 聚合接口，不引入客户端懒加载或新的状态管理库。
- 不改首页之外的路由与页面。

## Decisions

### 1. 一个 `home-overview` 取数，六个请求并行

新增 `app/utils/home-overview.ts`，页面通过 `useAsyncData("home-overview", loadHomeOverview)` 获取待处理、任务和养护提醒。`loadHomeOverview` 用 `Promise.allSettled` 同时调用四个待处理来源、任务列表和可养护植株，返回：

```ts
{
  pendingGroups: PendingGroup[];
  pendingError: string;
  tasks: EcoTask[];
  tasksError: string;
  plants: CareEligiblePlant[];
  plantsError: string;
}
```

资料摘要继续使用 `home-profile`，消息继续使用共享的 `notifications`。这样资料更新后的 `home-profile` 失效、通知已读后的 `notifications` 失效都保持现状，不需要把首页所有数据塞进一个 key。

替代方案是全部放进一个 key：缓存失效粒度会变粗，资料或通知单独更新时也会重取全部六个请求。另一个替代是客户端懒加载，但首屏会出现三个骨架区块，和现有页面“SSR 一次渲染”的体验不一致。

### 2. 待处理分类由纯函数生成

`buildPendingGroups` 接收四个来源列表，按固定顺序返回非空分组：

1. 待审核打卡：`care` 中 `PENDING_REVIEW`，跳 `/care/{id}`
2. 待重提 · 领养：`adoptions` 中 `REJECTED`，跳 `/adoptions/{id}`
3. 待重提 · 养护：`care` 中 `REJECTED`，跳 `/care/{id}`
4. 待重提 · 任务：`participations` 中 `REJECTED`，跳 `/tasks/{taskId}`
5. 待领取奖励：`orders` 中 `WAITING_PICKUP`，跳 `/rewards/orders/{id}`

每组记录已由服务端按最近更新/创建时间倒序返回，纯函数取第一条作为跳转目标，不重新排序。分组在纯函数里计算，页面测试只需要提供列表数据，分类规则可以单独覆盖。

### 3. 任务与养护筛选复用现有状态工具

- 环保任务直接复用 `task-status.ts` 的 `canJoin`（`ONGOING`、未参与、未满额），再截取前 3 个；不复制状态判断。
- 养护提醒只保留 `eligible === true` 的植株，截取前 3 个。`eligible` 已经排除了“有待审核打卡”和“未到间隔”的情况。

### 4. 首页布局改为六个 FolioSection

页面顺序固定为 01 我的绿植、02 待处理事项、03 当前积分、04 环保任务、05 养护提醒、06 消息。桌面使用等宽两列网格，窄屏单列；档案条保留在最后。消息从原来的独立条改为第 06 区块，继续复用 `notifications` 的未读数与失败降级。

每个区块内部沿用现有组件：`Ledger`/`TagRow` 展示数字与字段，`UiEmptyState` 处理空态，`UiAlert` + `UiButton` 处理区块错误，链接使用 `NuxtLink`。

### 5. 区块错误只刷新概览

任一辅助请求失败时，区块显示 `resolveRequestError` 的结果与“重试”按钮；重试调用 `home-overview` 的 `refresh()`，重新执行六个请求。成功区块的已渲染内容在重试期间保留，避免整页闪烁。

资料请求失败仍按现有逻辑显示整页可重试错误；通知失败只让第 06 区块显示“消息暂时不可用”。

## Risks / Trade-offs

- **首屏请求数从 2 增到 8** → 六个请求并行发出，均为轻量列表；任一失败不阻塞其他区块。若后续数据量增长，再考虑 Spring 聚合接口。
- **待办分类跳“最近一条”可能不是学生最想先看的记录** → 分类数量与最近记录编号同时展示，学生仍可进入对应模块列表。
- **任务列表可能很长** → 只在客户端内存中筛选并截取 3 个，不发额外请求。
- **`eligible` 的语义依赖后端现状** → 规格明确以 `eligible === true` 为准；若后端改变语义，区块会随接口一起变化，不在前端重算养护间隔。
- **六个区块在 320px 下容易拥挤** → 单列布局、`TagRow` 折行与既有 `overflow-wrap` 规则；验收覆盖 320/375/768/1440。

## Migration Plan

纯前端首页改版，无数据迁移。旧首页的两个区块被并入六区块，URL 不变；回滚只需恢复 `pages/index.vue` 与删除 `home-overview.ts`，后端与路由无需回退。

## Open Questions

无。待领取绿植、统一待办页和客户端懒加载均已在 Non-Goals 中明确。
