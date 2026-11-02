# Design

## Context

见 `proposal.md — Why`。当前后端已有一个固定 `Asia/Shanghai` 的 `ClockConfiguration`，但只有积分、养护、任务、反馈、工作台和奖励服务注入该时钟；领养、认证、资讯、通知、文件与植株适配器仍直接调用 `LocalDateTime.now()`，共 20 处、分布在 8 个类。

列表接口目前统一由 Controller 返回 `ApiResponse<List<T>>`，仓储端口返回完整 `List`，工程没有配置 MyBatis-Plus 分页拦截器；web 直接渲染列表，admin 在客户端分页。前后端数据流仍是浏览器 → Nitro/Vite 代理 → Spring，分页为可选项，不改变现有调用链。

## Goals / Non-Goals

**Goals:**

- 业务时间全部来自一个可注入、可测试的上海时钟。
- 兑换通知的截止时间在服务端格式化为分钟级可读文本。
- 列表接口在不传分页参数时保持数组响应；传入时返回分页信封。
- 接口文档与 OpenAPI 快照与实现一致。

**Non-Goals:**

- 不改变现有列表的默认排序、筛选语义和字段。
- 不在本次接入 web/admin 的服务端分页；现有客户端继续拿数组。
- 不新增数据库迁移，不修改认证、权限或共享包。
- 不处理学生端资讯阅读。

## Decisions

### 1. 用注入的 `Clock` 取代 `LocalDateTime.now()`

把 `Clock` 作为构造依赖注入 `AdoptionService`、`AuthService`、`ArticleService`、`NotificationService`、`SessionAuthenticationFilter`、`MybatisAuditMetaObjectHandler` 及两个植株持久化适配器，统一调用 `LocalDateTime.now(clock)`。

备选方案：启动时设置 JVM 默认时区。它依赖部署参数、影响所有库和日志，测试难以固定时间，因此不采用。逐处传 `ZoneId` 也优于默认时区，但仍会分散时钟来源，不如单一 `Clock` 可测。

### 2. 用共享格式化器输出通知时间

在 `common` 下提供业务时间格式化入口，固定 `yyyy-MM-dd HH:mm`，`RewardService` 用它格式化 `pickupDeadline`。时间值本身已由上海时钟生成，格式化只负责显示，不再做时区转换。

备选方案：在每个通知里各写 `DateTimeFormatter`。常量会重复且容易漂移，不采用。

### 3. 分页在 Controller 边界做“可选分支”

新增 `PageParams`（校验 `page`/`pageSize` 必须同时出现，`page >= 1`，`1 <= pageSize <= 100`）和 `PageResult<T>`（`items,total,page,pageSize`）。Controller 接收可选的 `page`、`pageSize`：两者都为空时走现有服务方法并返回数组；都不为空时走分页方法并返回 `PageResult`。只传一个或取值非法时抛出 400 `INVALID_REQUEST`。

备选方案：所有列表统一返回分页信封。更整洁，但会破坏现有 web/admin 调用和多个既有 spec，因此不采用。备选方案：新增独立分页端点。会让同一资源出现两套路径，文档和权限都翻倍，不采用。

### 4. 分页在服务层切分，SQL 下推延后

现有列表大多在 Service 层完成筛选、关联计数和 DTO 组装（账号、养护审核、任务参与、资讯等），直接下推到 SQL 需要重写筛选条件与多个仓储端口。首版采用统一的服务层切分：现有列表逻辑先生成完整结果，再由 `PageResult` 按 `page`/`pageSize` 截取，保证契约、排序和 `total` 正确，同时缩小响应体。

SQL 下推留作后续优化：当数据量或慢查询成为实际问题时，再按模块把筛选与分页下推到 mapper，并保持当前响应契约不变。通知接口返回 `{items,unreadCount}` 对象而非裸列表，不纳入本次分页。

### 5. 文档以运行中的服务为准

`backend/docs/api.md` 手工补 `GET /api/v1/admin/articles/{id}`；`openapi.json`/`openapi.yaml` 从重新启动后的 `/v3/api-docs` 导出，避免快照与实现再次漂移。

## Risks / Trade-offs

- [同一路径可能返回数组或分页对象，OpenAPI 需要表达两种形状] → 在接口说明和示例中明确“传分页参数才返回信封”，并用契约测试覆盖两种分支。
- [为列表加 `COUNT` 查询会增加数据库负载] → 本次不新增 `COUNT`，`total` 直接取现有结果集大小；SQL 下推后续再评估索引与计数成本。
- [给 Filter 和 MyBatis 元对象处理器注入 `Clock` 可能影响现有测试] → 构造器注入并提供测试用固定时钟；运行全量 `./mvnw verify` 回归。
- [服务层切分只缩小响应体，数据库仍全量读取] → 契约先交付，SQL 下推记录为后续优化；分页参数只在客户端显式传入时生效。
- [跨仓库编辑超出 frontend OpenSpec 根的默认范围] → 已由用户明确确认；申请时只改 `backend`，不改前端业务代码。

## Migration Plan

无数据库迁移。部署时重启 Spring 使新时钟、通知格式和分页参数生效；web/admin 无需改动，旧客户端继续收到数组。回滚只需回退后端代码和文档快照。

## Open Questions

无。
