# Proposal

## Why

学生已经可以提交问题反馈，Spring 在创建反馈时会通知管理员，工作台也统计了待处理反馈，但管理端 `/feedback` 仍然是占位页。管理员没有入口查看描述和照片、开始处理、回复学生或关闭反馈，反馈流程在管理端断开。现有后端反馈模块是一次性生成的代码，还存在状态筛选未校验、列表逐条查询时间线、处理操作没有真实行锁、回复和结论未按去除空白后的长度校验等问题，需要在页面接入前一起收紧。

## What Changes

- 将 `/feedback` 从占位页替换为问题反馈管理页：反馈列表、关键词/类型/状态/提交日期筛选、客户端分页和 `?status=` 深链。
- 新增反馈详情抽屉：展示学生、类型、关联业务、描述、最多 3 张图片、回复内容、处理人和处理时间线。
- 新增处理操作：待处理可开始处理或直接回复；处理中可回复或关闭；已回复可关闭；已关闭只读。回复和关闭结论均按去除首尾空白后 5–500 字校验，关闭前二次确认。
- 收紧 Spring 管理端反馈接口：状态筛选白名单、列表与时间线稳定排序、处理操作行锁、回复和结论 trim 后长度校验，以及列表批量加载时间线避免逐条查询；不新增接口，不修改数据库结构。
- 补充 Spring 服务测试和控制器契约测试，补充 admin API、页面、详情和操作弹窗测试。
- 更新 README、管理端产品说明、后端接口文档和生成的 OpenAPI。

明确不做：学生管理、资讯管理、工作台、数据统计，以及学生端反馈页面。不修改认证、角色边界、端口、共享包或工具链；`/feedback` 路径不变，不构成 BREAKING。

## Capabilities

### New Capabilities

- `admin-feedback`: 管理端问题反馈的列表查询、筛选、详情、处理时间线、开始处理、回复和关闭行为，以及支撑这些行为的接口校验、稳定排序和并发约束。

### Modified Capabilities

- 无。`admin-shell` 的“尚未实现的模块显示占位页”要求继续适用于剩余模块；本变更只把 `/feedback` 替换为真实页面，不改变后台壳、导航或占位页要求。

## Impact

- `apps/admin`：新增反馈 API 客户端、列表页、详情抽屉、回复/关闭弹窗、状态与类型文案、路由和组件测试；替换 `/feedback` 占位路由；README 更新模块状态。
- Spring 后端：修改 `AdminFeedbackController`、`FeedbackService`、`FeedbackDtos`、反馈仓储适配器和事件仓储；新增 `FeedbackServiceTest` 与 `AdminFeedbackControllerContractTest`。管理端接口路径和响应字段保持不变，仅收紧筛选、排序、校验与并发行为。
- 文档：`docs/product/admin.md`、`backend/docs/api.md`、`backend/docs/openapi.json`、`backend/docs/openapi.yaml`。
- 数据：不新增 Flyway 迁移；现有 `feedback` 和 `feedback_events` 索引已覆盖状态筛选与时间线查询。
- 依赖与边界：不新增运行时依赖，不修改共享包，不跨应用导入；Spring 仍是最终认证与角色边界。
