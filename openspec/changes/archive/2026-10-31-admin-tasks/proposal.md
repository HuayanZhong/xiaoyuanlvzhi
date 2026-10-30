# Proposal

## Why

管理端还缺最后一条核心运营闭环：环保任务的配置与凭证审核。当前 `/tasks` 只是占位页，管理员无法发布任务、查看报名或审核凭证；工作台的“待审核任务”和数据统计也因此没有可用入口。

后端任务模块是早期一次性生成的代码。审计发现学生报名会因 `task_participations.joined_at` 未赋值且无默认值而直接失败，报名、重提和审核也存在并发竞态。本次必须把任务链路作为整体修复，而不是只补管理端页面。

## What Changes

- 新增管理端 `/tasks` 页面，包含“任务配置”和“凭证审核”两个 tab，支持 `?tab=review&status=PENDING_REVIEW&taskId=` 深链。
- 任务配置：列表筛选与分页、新建/编辑/复制、保存草稿/发布、停用；已有报名后锁定时间、人数上限和奖励积分。
- 凭证审核：全局待审队列和按任务筛选；审核抽屉展示任务与学生上下文、凭证版本与图片、审核记录、实际发放积分；支持通过和驳回。
- Spring 管理端接口：新增管理端任务视图、参与审核视图、参与详情和审核事件；参与列表不再只返回待审凭证。
- Spring 完整性修复：报名时间写入与数据库默认值、报名/重提/审核行锁、批量凭证查询、实际发放积分和审核人信息、停用任务不可重新发布、统一 `Clock`。
- 数据库 V7：任务、参与、凭证状态 CHECK；`joined_at` 默认值；任务参与列表索引。
- 测试与文档：后端服务/控制器/并发测试，admin API/页面/表单/审核抽屉测试，README、API 文档和 OpenAPI。
- **BREAKING**：管理端 `/api/v1/admin/tasks` 与 `/api/v1/admin/tasks/participations` 的响应结构和参与列表语义升级；当前仅本仓库 admin 使用，学生端 `/api/v1/tasks` 接口保持兼容。

## Capabilities

### New Capabilities

- `admin-tasks`: 管理端环保任务配置、报名与凭证审核、任务状态与积分发放的可观察行为。

### Modified Capabilities

无。现有 `admin-care`、`admin-adoptions`、`admin-plants` 等能力的需求不变。

## Impact

- 应用：`apps/admin`（页面、API、路由、测试）。
- 后端：`backend/`（task 模块、points 查询、管理端控制器与 DTO、V7 Flyway 迁移、测试）。
- 数据：`eco_tasks`、`task_participations`、`task_submissions` 的约束与默认值。
- 文档：`README.md`、`backend/docs/api.md`、`backend/docs/openapi.yaml`。
- 不涉及共享包、认证流程、端口或工具链变更；Spring 仍是认证与角色边界。
