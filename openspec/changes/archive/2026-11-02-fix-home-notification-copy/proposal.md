# Proposal

## Why

真实联调发现：学生已有 1 株在养绿植时，首页“我的绿植”区块仍显示空态说明“领养审核通过后，植株会登记在这里”，与“在养数量 1”和“在养中”标记矛盾，让学生怀疑领养是否成功。

同一个联调还发现后端兑换通知的领取截止时间以 `2026-11-09T20:48:07.073619700` 这样的原始时间戳显示。该问题位于兄弟仓库 `backend`，本次只记录为后续项，不在本变更内修改。

## What Changes

- `apps/web` 首页“我的绿植”区块的空态说明只在学生没有在养绿植时显示；有在养绿植时不再显示该说明。
- 补充首页页面测试：有在养绿植时不出现该说明，空态时仍显示。
- 不修改 API、认证、持久化、共享包或工具链，也不修改 Spring 接口。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `web-shell`: 首页摘要中的零值说明只在没有在养绿植时出现，有在养绿植时以数量为准。

## Impact

- 受影响应用：`apps/web`，涉及首页页面与其 Nuxt 运行测试。
- 不涉及 `apps/admin`、`packages/*` 或 Spring 接口；无 API、认证或持久化变化。
- 已知后续（不在本变更范围）：`backend` 仓库 `RewardService` 的兑换成功通知直接拼接 `LocalDateTime`，产生带纳秒的原始时间戳，应在后端格式化为 `yyyy-MM-dd HH:mm`。本 OpenSpec 根只允许编辑 `frontend`，该项在 `backend` 仓库单独提交；它不改变接口字段或状态码。
