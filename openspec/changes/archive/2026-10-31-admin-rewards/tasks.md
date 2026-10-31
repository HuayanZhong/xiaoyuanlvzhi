# Tasks

## 1. Spring 奖励与订单接口

- [x] 1.1 收紧 `RewardService.adminOrders(String status)`：只接受 `WAITING_PICKUP`、`CLAIMED`、`CANCELLED`、`EXPIRED`，未知值返回 400 `INVALID_REQUEST`；验证 `./mvnw -q -Dtest=RewardServiceTest test` 覆盖合法筛选和未知状态。
- [x] 1.2 修改 `RewardService.adminCancel`：原因 `trim()` 后校验 5–200 字；订单已过领取截止时间时按超时规则转 `EXPIRED` 并退分，否则转 `CANCELLED`；验证服务测试覆盖空白原因、超时取消和重复取消。
- [x] 1.3 调整奖励与订单仓储排序为 `created_at DESC, id DESC`，包含管理端全部订单、按状态筛选和学生订单；在开发库构造同秒记录后请求订单接口，确认顺序稳定。
- [x] 1.4 更新 `RewardDtos` 的 `availableStock`、图片和取消原因描述，明确总库存与 trim 后校验口径；运行 `./mvnw -q spotless:apply` 后检查生成 OpenAPI 字段描述。
- [x] 1.5 新增 `RewardServiceTest`，覆盖奖励创建/编辑库存下限、上下架语义、兑换扣分与预留、确认领取、取消退分、超时退分、重复操作和库存异常；验证 `./mvnw -q -Dtest=RewardServiceTest test` 全部通过。
- [x] 1.6 新增 `AdminRewardControllerContractTest`，覆盖奖励与订单接口的 401/403、字段返回、400 `INVALID_REQUEST`、404 `REWARD_NOT_FOUND`/`ORDER_NOT_FOUND`、409 `REWARD_STOCK_RESERVED`/`ORDER_STATUS_INVALID`；验证 `./mvnw -q -Dtest=AdminRewardControllerContractTest test` 全部通过。
- [x] 1.7 运行 `./mvnw verify`，确认奖励改动通过 Spotless、Checkstyle 和全部后端测试。

## 2. admin 奖励商品页

- [x] 2.1 新增 `apps/admin/src/api/rewards.ts`，定义奖励与订单视图、请求类型，以及列表、创建、编辑、确认领取和取消接口；验证 `pnpm --filter admin check-types` 通过。
- [x] 2.2 新增 `pages/rewards/labels.ts` 与单元测试，覆盖上下架、订单状态、库存摘要、未知状态回退和超时判断；验证 `pnpm --filter admin test -- labels` 通过。
- [x] 2.3 实现 `RewardsPage`：列表、关键词/状态筛选、重置、客户端分页、库存分列展示、新增入口和上下架二次确认；验证页面测试覆盖默认列表、筛选、分页和停用确认。
- [x] 2.4 实现 `RewardFormDrawer`：新增/编辑、名称/描述/积分/总库存/地点/领取天数/上下架、最多 3 张公开图片、库存下限提示和错误保留；验证抽屉测试覆盖新增、编辑、图片校验和 `REWARD_STOCK_RESERVED` 错误。
- [x] 2.5 把 `/points/rewards` 路由从 `PlaceholderPage` 替换为 `RewardsPage`，并更新路由测试或页面测试确认占位页不再渲染；验证 `pnpm --filter admin test` 相关用例通过。

## 3. admin 兑换订单页

- [x] 3.1 实现 `OrdersPage`：订单列表、关键词/状态/日期筛选、客户端分页、账号目录关联、账号失败回退邮箱和 warning；验证页面测试覆盖列表、筛选、分页和账号回退。
- [x] 3.2 实现订单超时的页面判定：待领取且截止时间早于当前时间时显示“已超时”并禁用核销和取消；验证页面测试使用固定时间覆盖按钮禁用与状态文案。
- [x] 3.3 实现确认领取的二次确认、提交中防重复和刷新；验证测试断言接口只调用一次、成功提示和列表刷新。
- [x] 3.4 实现取消订单弹窗：原因必填、trim 后 5–200 字、二次确认、错误保留；验证测试覆盖合法提交、空白原因、超长原因和服务端错误。
- [x] 3.5 把 `/points/orders` 路由从 `PlaceholderPage` 替换为 `OrdersPage`，并验证两个奖励页面在 320px 下无横向滚动、表格内部滚动、抽屉和弹窗可操作。

## 4. 文档与集成验证

- [x] 4.1 更新 `README.md` 的 admin 页面清单：加入奖励商品和兑换订单，占位模块减少为问题反馈、学生管理、资讯管理、数据统计；验证描述与路由一致。
- [x] 4.2 更新 `docs/product/admin.md` 的奖励库存口径、订单学生列、超时展示和取消原因规则；验证与规格中的中文文案一致。
- [x] 4.3 更新 `backend/docs/api.md` 并重新生成 `backend/docs/openapi.yaml`；验证四个管理端奖励接口的方法、路径、参数和错误码与实现一致。
- [x] 4.4 运行 `pnpm --filter admin lint && pnpm --filter admin check-types && pnpm --filter admin test`，确认 admin 全部检查通过。
- [x] 4.5 启动 Spring 与 admin，在浏览器走通奖励新增/编辑/下架、订单筛选、确认领取、取消退分和超时展示；确认控制台无错误，并恢复测试数据。
- [x] 4.6 从仓库根目录运行 `pnpm verify`，确认 lint、format:check、类型检查和全部测试通过。

## Workflow follow-up

- 在满足项目评审要求后归档变更。
- 归档后验证主规格新增 `admin-rewards` 能力且 delta 已清空。
