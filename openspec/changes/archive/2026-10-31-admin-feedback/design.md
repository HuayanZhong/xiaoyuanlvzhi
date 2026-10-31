# Design

## Context

见 `proposal.md` 的 Why。当前 `/feedback` 是占位页；Spring 已有学生提交、管理端列表/详情/开始处理/回复/关闭接口，`feedback` 与 `feedback_events` 表已有状态和时间线索引。管理端页面需要复用现有账号目录与学生图片读取能力，但不修改学生端接口。

本次不涉及 `apps/web` 的运行时改动；学生端反馈页面不在本仓库当前实现范围内。管理端只通过 Spring 的 `/api/v1/admin/feedback`、`/api/v1/admin/accounts` 和 `/api/v1/files/{id}` 读取数据。

```text
apps/admin
  FeedbackPage / FeedbackDetailDrawer
        |
        | Bearer accessToken
        v
  @repo/http-client
        |
        v
Spring /api/v1
  +-- /admin/feedback            列表、详情、开始、回复、关闭
  +-- /admin/accounts            学生姓名/学号目录（只读）
  +-- /files/{id}                反馈私有图片，管理员可读
```

## Goals / Non-Goals

**Goals:**

- 管理端可完成反馈从查看到关闭的完整处理流程。
- 列表筛选、分页、详情时间线和操作反馈符合现有 admin 页面模式。
- 后端在页面接入前收紧状态筛选、排序、长度校验和并发行为。
- 保持现有 API 路径与响应字段不变，避免为页面接入引入破坏性变更。

**Non-Goals:**

- 不实现学生端反馈页面、学生管理、资讯管理、工作台或数据统计。
- 不新增反馈状态、不增加多次回复、不增加删除反馈能力。
- 不引入服务端分页、服务端关键词搜索或新的数据库迁移。
- 不修改认证、角色边界、共享包、端口或工具链。

## Decisions

### 1. 保留现有响应结构，用批量查询消除列表 N+1

`GET /api/v1/admin/feedback` 继续返回包含 `timeline` 的 `FeedbackView`，不新增 `FeedbackSummaryView`。列表阶段一次性按反馈 ID 集合查询事件，再按反馈 ID 分组装配；详情仍单条查询事件。这样既保持响应字段不变，也避免逐条反馈查询时间线。

替代方案是列表不返回时间线或引入新的列表 DTO，但会改变现有响应语义，收益只是减少列表负载；当前数据规模下批量查询更稳妥。

### 2. 状态筛选和文案以后端白名单为准

服务层维护 `PENDING`、`IN_PROGRESS`、`REPLIED`、`CLOSED` 白名单。查询参数去除首尾空白后为空则返回全部，未知值直接返回 400 `INVALID_REQUEST`，不把未知状态当作空结果。前端只发送白名单值，页面标签负责中文映射。

### 3. 处理操作使用真实行锁和统一 Clock

`startHandling`、`reply`、`adminClose` 共用 `findForUpdate` 语义；反馈仓储的 `findFirstById` 改为带 `FOR UPDATE` 的查询，确保同一反馈的并发操作串行化。状态校验在锁内完成，失败请求不写事件、不通知学生。

`FeedbackService` 注入现有业务 `Clock`，处理时间改为 `LocalDateTime.now(clock)`，便于服务测试固定时间；页面展示仍使用接口返回值。

### 4. 回复和关闭结论按 trim 后长度校验

DTO 保留 `@NotBlank` 和 `@Size(max = 500)`，负责拒绝空值和超大请求；服务层先 `trim()`，再校验 5–500 字。这样能覆盖 `"a    "` 这类原始长度达标、去除空白后不足 5 字的输入。错误统一为 400 `INVALID_REQUEST`，中文消息由服务层给出。

### 5. 页面采用容器 + 抽屉 + 操作弹窗

- `FeedbackPage`：加载反馈与账号目录、筛选、排序、分页、列表操作。
- `FeedbackDetailDrawer`：详情、图片、时间线、状态操作入口。
- `FeedbackActionModal`：回复和关闭共用，配置标题、字段标签、确认文案和是否二次确认；关闭使用 `Popconfirm` 二次确认。
- `labels.ts`：状态、类型、关联业务和颜色的中文映射。
- `api/feedback.ts`：类型与五个接口函数。

不扩展通用 `ReasonModal`：它的 5–200 字和“原因”语义与本模块的 5–500 字“回复/结论”不同，独立组件可避免影响已有领养、任务等页面。

### 6. 学生资料在前端关联，失败不阻塞反馈列表

页面并行请求反馈列表和 `GET /admin/accounts`，用 `studentId` 建立映射，显示姓名和学号；缺失时回退 `studentEmail`。账号目录失败时仍展示反馈，并提示“学生资料暂不可用”。这与兑换订单页的学生列策略一致，避免为反馈接口新增账号字段或跨模块查询。

### 7. 客户端筛选与分页保持一致体验

沿用现有管理端模式：接口返回全量，页面做关键词/类型/状态/日期筛选，按 `createdAt DESC, id DESC` 防御性排序，每页 10 条。`?status=` 通过 `useSearchParams` 初始化筛选，查询和重置时同步 URL，便于工作台后续深链。

### 8. 操作后刷新列表与详情

开始处理直接提交并显示加载；回复/关闭在弹窗内提交。成功时关闭弹窗、显示中文 toast、重新加载列表，并用接口返回值更新当前详情；409 时提示状态已变化并刷新，避免页面停留在旧状态。提交期间用 ref 和 loading 双重防重复点击。

## Risks / Trade-offs

- [列表仍携带完整时间线，负载高于纯列表 DTO] → 批量查询避免 N+1；当前反馈量有限，后续需要时再引入摘要 DTO 与服务端分页。
- [客户端筛选与分页需要全量数据] → 与现有 admin 页面一致；数据规模增长后再统一迁移到服务端分页。
- [行锁效果依赖 InnoDB 与事务边界] → 三个处理入口均保持 `@Transactional`，`FOR UPDATE` 放在仓储查询中；单元测试验证状态分支，联调时用并发请求补充验证。
- [账号目录失败时只有邮箱] → 页面明确提示降级状态，不把资料缺失当成反馈加载失败。
- [反馈图片是私有文件] → 复用 `AuthenticatedImage` 带 Bearer 读取，避免直接使用无认证的图片 URL。
- [审计记录不可删除] → 联调产生的测试反馈可以清理，但操作审计按现有规则保留，不在本变更中增加删除能力。

## Migration Plan

无数据库迁移。部署顺序为先发布 Spring 后端，再替换 admin 的 `/feedback` 路由；旧占位页与后端接口兼容，回滚时只需恢复前端路由。接口路径和响应字段不变，不涉及数据回填。

## Open Questions

无。状态转换、回复/关闭从哪些状态可用、列表是否保留时间线均已在规格中确定。
