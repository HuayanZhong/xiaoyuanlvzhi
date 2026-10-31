# Proposal

## Why

积分模块已经能发放、查询和人工调整积分，但管理端还没有奖励商品与兑换订单页面，学生兑换后的核销、取消和超时退分没有管理员入口，积分闭环缺少“消费与履约”这一段。Spring 已有奖励与订单接口，却缺少服务测试和契约测试，部分输入校验与列表行为也需要在页面接入前收紧。

## What Changes

- 将 `/points/rewards` 从占位页替换为奖励商品管理页：奖励列表、关键词/状态筛选、客户端分页、新增与编辑抽屉、公开图片上传、上下架，以及总库存、已预留、已领取和剩余可兑换库存的分开展示。
- 将 `/points/orders` 从占位页替换为兑换订单页：订单列表、状态筛选、学生姓名/学号关联、领取截止时间、确认领取、取消订单并填写原因，以及已超时订单的只读提示。
- 收紧 Spring 管理端奖励接口：订单状态筛选白名单、取消原因去除首尾空白后校验 5–200 字、订单列表按创建时间和 ID 稳定倒序；保持库存扣减与订单状态转换的可审计性。
- 为奖励与订单补充 Spring 服务测试和控制器契约测试，覆盖库存约束、重复领取/取消、超时退分、鉴权与错误码。
- 更新 README、管理端产品说明、后端接口文档和生成的 OpenAPI。

## Capabilities

### New Capabilities

- `admin-rewards`: 管理端奖励商品维护、库存展示、兑换订单查询、核销、取消和超时退分的可观察行为。

### Modified Capabilities

无。积分流水已经支持 `REDEMPTION` 和 `REDEMPTION_REFUND` 来源，本次不改变 `admin-points` 的要求。

## Impact

- `apps/admin`：新增奖励与订单 API 客户端、两个业务页面、表单/取消弹窗、状态文案与组件测试；替换两条占位路由。
- Spring 后端：修改 `AdminRewardController`/`RewardService`/`RewardDtos`/订单仓储排序，新增 `RewardServiceTest` 与 `AdminRewardControllerContractTest`；不新增数据库迁移。
- 文档：README 页面清单、`docs/product/admin.md` 的库存与订单操作口径、`backend/docs/api.md` 和 `backend/docs/openapi.yaml`。
- 不修改认证、角色边界、共享包、端口或工具链；管理端仍由 Spring 做最终鉴权。无 **BREAKING** 变更。
