# Proposal

## Why

完整性审计确认后端还有三项收尾问题：兑换成功通知把 `LocalDateTime` 原始值拼进摘要，学生看到带纳秒的时间戳；部分服务仍用 JVM 默认时区的 `LocalDateTime.now()`，部署时区不是上海时会与积分、养护时间相差 8 小时；`GET /api/v1/admin/articles/{id}` 已实现且被管理端调用，但接口文档和 OpenAPI 快照缺失。同时，列表接口仍一次返回全量数组，与后端重建计划中的分页要求不符。

## What Changes

- 统一后端业务时间源：所有业务时间戳使用注入的 `Clock`（`Asia/Shanghai`），不再使用 `LocalDateTime.now()`。
- 兑换成功通知的领取截止时间格式化为 `yyyy-MM-dd HH:mm`，不再出现原始 ISO 时间戳或纳秒。
- 列表接口增加可选分页：同时提供 `page` 和 `pageSize` 时返回 `{items,total,page,pageSize}`，不提供时保持现有数组响应。**不是 BREAKING**：现有调用方和响应形状不变。
- 在 `backend/docs/api.md` 补充 `GET /api/v1/admin/articles/{id}`，并从运行中的服务重新生成 `docs/openapi.json` 与 `docs/openapi.yaml`。
- 修改 Spring 接口：列表接口新增可选查询参数和分页响应分支；其余接口路径、状态码和现有响应不变。
- 不修改前端 `apps/web` 或 `apps/admin` 的业务代码；不涉及数据库迁移、认证、持久化结构或共享包。

## Capabilities

### New Capabilities

- `server-time`: 服务端业务时间源与时间值的一致性，保证任意 JVM 时区下都按上海本地时间生成和返回。
- `api-pagination`: 列表接口的可选分页契约，包括参数、响应形状与错误边界。

### Modified Capabilities

- `student-notifications`: 新增兑换成功通知的领取截止时间格式要求。

## Impact

- 受影响仓库：`backend`（应用代码、测试、`docs/api.md`、`docs/openapi.json`、`docs/openapi.yaml`）。
- 受影响应用：`apps/web` 与 `apps/admin` 只作为调用方验证，不改代码；分页响应为可选，现有客户端无需调整。
- 本变更在 `frontend` 的 OpenSpec 根下规划，但实现编辑发生在兄弟仓库 `backend`；这是已确认的跨仓库安排。
- 不做分页的前端接入、不改学生端资讯阅读、不改变列表默认排序。
