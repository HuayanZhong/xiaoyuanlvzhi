# Tasks

## 1. 积分与奖励数据层

- [x] 1.1 新增 `apps/web/app/utils/point-api.ts`，封装余额与流水请求；在 `tests/nuxt/utils/point-api.test.ts` 断言方法、路径与返回类型，`pnpm --filter web exec vitest run tests/nuxt/utils/point-api.test.ts` 通过
- [x] 1.2 新增 `apps/web/app/utils/reward-api.ts`，封装奖励列表、兑换、订单列表、订单详情与取消；在 `tests/nuxt/utils/reward-api.test.ts` 断言路径与方法（尤其 `POST .../redeem` 与 `POST .../cancel` 无请求体），测试通过
- [x] 1.3 新增 `apps/web/app/utils/point-source.ts`，映射五种来源标签与未知来源兜底，并给出增减符号；`tests/nuxt/utils/point-source.test.ts` 覆盖每种来源与未知值
- [x] 1.4 新增 `apps/web/app/utils/reward-status.ts`，提供订单状态标签与印章语气、`canRedeem` 的积分不足/库存不足/无法核对积分分支；`tests/nuxt/utils/reward-status.test.ts` 覆盖四种状态、未知状态与三个禁用原因

## 2. 积分明细页

- [x] 2.1 新增 `apps/web/app/pages/points/index.vue`：余额、倒序流水、来源标签与变动后余额、空态与可重试错误，加载与失败不影响导航；`tests/nuxt/pages/points.test.ts` 断言余额、流水行、空态与失败重试
- [x] 2.2 页面提供「奖励商城」「我的订单」入口，键盘可聚焦；测试断言两个链接分别指向 `/rewards` 与 `/rewards/orders`

## 3. 奖励商城与兑换

- [x] 3.1 给 `apps/web/app/components/UiConfirmDialog.vue` 增加可选默认插槽（渲染在说明与操作区之间），未传插槽时行为不变；在 `tests/nuxt/components/ui-confirm-dialog.test.ts` 补一条插槽用例并保持既有用例通过
- [x] 3.2 新增 `apps/web/app/pages/rewards/index.vue`：奖励卡片（名称、图片、所需积分、剩余数量、领取地点）、空态与可重试错误；`tests/nuxt/pages/rewards.test.ts` 断言卡片字段、无图时不渲染图片与空态
- [x] 3.3 商城同时加载余额并禁用不可兑换项，就地显示积分不足、库存不足或无法核对积分；测试覆盖余额充足可兑换、余额不足与库存为零三种情况
- [x] 3.4 实现兑换确认弹窗（商品、扣除积分、兑换后余额、领取地点、领取期限）与提交中防重复；测试断言确认后调用 `redeem`，取消不发请求，处理中再次确认只发一次
- [x] 3.5 兑换成功后显示订单号、领取地点与领取截止时间，并 `refresh()` 当前页、清理 `points` 与 `rewards` 缓存键；测试断言成功后展示订单信息且 `clearNuxtData` 被调用
- [x] 3.6 兑换失败（`POINTS_INSUFFICIENT`、`REWARD_OUT_OF_STOCK`、`REWARD_DISABLED`、网络错误）显示服务端中文原因并刷新，不显示成功态；测试覆盖至少一个业务错误码与一个网络错误

## 4. 兑换订单

- [x] 4.1 新增 `apps/web/app/pages/rewards/orders/index.vue`：倒序订单列表、四种状态标签、空态（含进入商城入口）与可重试错误；`tests/nuxt/pages/rewards-orders.test.ts` 断言订单字段、状态标签与空态
- [x] 4.2 待领取订单提供二次确认取消；成功后显示已取消与退分时间，刷新订单并清理缓存；`ORDER_STATUS_INVALID` 显示服务端原因并刷新，不显示为已取消；测试覆盖成功与冲突两条路径
- [x] 4.3 新增 `apps/web/app/pages/rewards/orders/[id].vue`：完整订单字段与可选时间/原因，待领取时提供取消入口；403/404 显示无法查看并返回订单列表；`tests/nuxt/pages/reward-order-detail.test.ts` 覆盖详情渲染与不可查看状态

## 5. 导航与入口

- [x] 5.1 `apps/web/app/utils/navigation.ts` 增加「积分」入口（位于任务与我的之间），`tests/nuxt/utils/navigation.test.ts` 与 `tests/nuxt/components/ui-bottom-nav.test.ts` 断言 5 项顺序、`/points`、`/rewards`、`/rewards/orders` 与订单详情的高亮
- [x] 5.2 `apps/web/app/utils/auth-route.ts` 增加 `/points`、`/rewards` 保护前缀，`tests/nuxt/middleware/auth.test.ts` 断言未登录访问 `/points` 与 `/rewards/orders/3` 重定向到 `/login`
- [x] 5.3 首页积分区块与 `/me` 当前积分链接到 `/points`，`tests/nuxt/pages/home.test.ts` 与 `tests/nuxt/pages/me.test.ts` 断言链接存在

## 6. 文档与整体验证

- [x] 6.1 更新 `AGENTS.md`：web 路由清单加入 `/points`、`/rewards`、`/rewards/orders`、`/rewards/orders/[id]`，受保护前缀加入 `/points`、`/rewards`，API/状态/错误段落补充积分与兑换工具模块；改动后通读该段确认与代码一致
- [x] 6.2 运行 `pnpm --filter web exec nuxt prepare` 重新生成 `.nuxt`（不手工编辑生成文件），随后 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web format:check` 全部通过
- [x] 6.3 运行 `pnpm --filter web test`，全部测试通过；再从仓库根目录运行 `pnpm verify`，确认 lint、类型检查、格式与测试整体通过
- [x] 6.4 在 4000 端口用真实学生账号目视检查 `/points`、`/rewards`、`/rewards/orders` 与订单详情在 320px、375px、768px、1440px 下的日间/暗夜表现：无横向滚动、底部导航 5 项不挤压、状态文字可见、兑换与取消确认可键盘操作

## Workflow follow-up

- 按项目评审要求完成后，用 `/opsx:archive` 归档本次变更，并在归档摘要中写明受影响的 specs 与验证结果。
