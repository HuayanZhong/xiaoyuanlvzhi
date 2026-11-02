# Proposal

## Why

学生端与管理端的功能已经全部落地，但仓库文档仍停留在 foundation 和占位页阶段；`web-shell` 主 spec 内部还对导航项数量给出两种互相矛盾的断言。文档与规范是后续变更和验收的判断依据，先让它们与当前实现一致，避免把过期描述当成需求继续沿用。

## What Changes

- 更新 README 的 web 页面清单：补齐绿植、领养、任务、积分、奖励订单、通知、反馈、我的绿植与打卡、个人中心等全部路由，说明六区块首页、资料编辑和五项主导航。
- 更新 AGENTS.md 中管理端的路由与页面结构描述，移除已不存在的 `PlaceholderPage` 引用及其“模块路由仍为占位页”的说法。
- 删除 `docs/product/student.md` 顶部“当前 foundation 迭代只交付……”的过期说明。
- 修正 `web-shell` 中两处与已实现导航矛盾的场景：
  - 「底部导航」的模块可见性场景不再以“通知或问题反馈尚未实现”为前提。
  - 「养护入口」的导航断言由三项改为当前五项主导航。
- 不新增代码行为，不修改 Spring 接口、认证、持久化、共享包或工具链。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `web-shell`: 「底部导航」与「养护入口」两条需求的场景描述需要与当前五项主导航一致；需求行为本身不变。

## Impact

- 文档：`README.md`、`AGENTS.md`、`docs/product/student.md`。
- 规范：`openspec/specs/web-shell/spec.md`（通过本变更的 delta 同步）。
- 不涉及 `apps/web`、`apps/admin`、`packages/*` 的代码改动。
- 不涉及 API、认证、持久化或共享包变更。
