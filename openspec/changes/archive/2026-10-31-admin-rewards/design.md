# Design

## Context

见 [proposal.md](proposal.md)。管理端已有统一后台壳、`AdminTable` 固定表头/仅表体滚动、`ModulePage`、`ImageUpload`、`AuthenticatedImage` 和账号目录 `listStudents()`；积分页已验证客户端筛选、分页和账号关联模式。Spring 侧 `AdminRewardController` 与 `RewardService` 已覆盖奖励维护和订单履约，但订单状态筛选未校验、取消原因按未 trim 字符串校验、订单与奖励列表缺少 ID 次级排序，且没有奖励模块测试。

`apps/web` 不在本次范围内，学生端兑换入口不修改；管理端只消费现有 Spring 接口。

## Goals / Non-Goals

**Goals:**

- 用两个管理端路由完成奖励商品维护和兑换订单履约，闭合积分消费链路。
- 在不改数据库结构和认证边界的前提下，收紧订单筛选、取消原因和稳定排序。
- 用共享表格、图片上传和账号关联组件保持与既有管理端页面一致。
- 为奖励模块补齐服务测试与接口契约测试。

**Non-Goals:**

- 不实现学生端奖励浏览、兑换或取消页面。
- 不新增奖励分类、库存流水、订单详情页或导出功能。
- 不修改积分规则、任务积分或人工调整逻辑。
- 不新增共享包、迁移脚本、端口或工具链配置。

## Decisions

### 1. 一个 `admin-rewards` 能力覆盖两个路由

奖励商品与兑换订单共用同一套库存字段和订单状态机，后端也在同一个控制器中。拆成两个能力会让“编辑库存但无法核销”的中间状态被单独发布，因此规格和实现都放在一个能力内；导航仍保留 `/points/rewards` 与 `/points/orders` 两个入口。

替代方案：拆成 `admin-rewards` 和 `admin-orders` 两个 change。代价是库存约束和订单状态需要跨 change 协调，且两次都要改同一批后端文件。

### 2. 前端沿用“全量列表 + 客户端筛选/分页”

后端现有管理端接口返回完整数组，没有分页参数。首版数据量小，继续使用 `AdminTable` 的客户端分页（每页 10 条），与积分流水、任务列表一致；筛选条件只在点击“查询”后应用，“重置”恢复初始值。

替代方案：给后端增加分页参数。会扩大接口改动、测试和前后端联调范围，当前数据规模不需要。

### 3. 订单学生信息由账号目录关联

订单视图已有 `studentId` 和 `studentEmail`，页面调用现有 `listStudents()` 建立 `Map<number, StudentView>`，显示姓名和学号；账号目录失败时回退邮箱并显示 warning，与积分流水一致。

替代方案：在 `OrderView` 增加 `studentName`/`studentNumber`。需要改 Spring DTO 和契约测试，但收益仅是少一次请求；首版账号数量有限，保留现有模式。

### 4. 超时状态在页面按截止时间计算，后端保持最终裁决

订单列表仍使用后端返回的 `WAITING_PICKUP` 状态；页面比较 `pickupDeadline` 与当前时间，超过截止时间时渲染“已超时”并禁用核销/取消。后端定时任务每个维护周期扫描并落库 `EXPIRED`；管理员仍直接调用确认领取时，`RewardService.claim()` 会把超时订单转为 `EXPIRED` 并退分。

这样既不新增“当前时间”接口，也不会把已过期的待领取订单显示成可操作。取消接口自身也会在检测到截止时间已过时按超时处理，避免绕过页面直接调用产生“已取消”而非“已超时”。

### 5. 后端最小改动

- `RewardService.adminOrders(status)`：状态只接受四个常量，未知值返回 400 `INVALID_REQUEST`；查询走稳定排序。
- `RewardService.adminCancel(id, request, principal)`：原因 `trim()` 后校验 5–200 字；若订单已过截止时间，按超时规则转 `EXPIRED` 并退分，否则转 `CANCELLED`。
- `RewardDtos.CancelRequest`：保留 Bean Validation 的长度上限和 `@NotBlank`，由服务层补充 trim 后的最小长度与超时分支。
- 仓储排序：奖励与订单统一 `created_at DESC, id DESC`，学生订单列表也同步，避免同秒创建时顺序漂移。
- `RewardDtos.RewardRequest` 的 `availableStock` 描述改为“总库存”；视图继续返回总库存、预留、已领取和剩余量。

替代方案：在控制器层做状态校验。服务层校验能覆盖直接调用服务的测试，并让契约测试只验证错误映射。

### 6. 页面组件划分

```text
apps/admin/src/
  api/rewards.ts                     RewardView / OrderView / 请求类型与四个接口
  pages/rewards/
    RewardsPage.tsx                  标题、筛选、表格、新增/编辑抽屉、上下架确认
    RewardFormDrawer.tsx             表单、库存提示、图片上传
    OrdersPage.tsx                   标题、筛选、订单表格、账号目录关联
    CancelOrderModal.tsx             原因输入与二次确认
    labels.ts                        状态/库存/订单文案与颜色
  router/index.tsx                   替换两个占位路由
```

复用 `AdminTable`、`ModulePage`、`LoadFailure`、`ImageUpload`、`useIsMobile`、`formatDateTime` 和 toast 事件；不复制积分页的表格外壳。

### 7. 数据流

```text
RewardsPage ──GET /admin/rewards──────────────> Spring AdminRewardController
     │──POST/PUT /admin/rewards───────────────> RewardService ──> RewardRepository
     │──画像上传 POST /files?isPublic=true───> FileController
     │
OrdersPage ──GET /admin/rewards/orders?status─> RewardService ──> RedemptionOrderRepository
     │──POST /orders/{id}/claim───────────────> RewardService ──> PointService（仅超时退分）
     │──POST /orders/{id}/cancel──────────────> RewardService ──> PointService + AuditService
     └──GET /admin/accounts──────────────────> AccountService（页面关联学生姓名/学号）
```

### 8. 工具链与测试配置

不修改 `tsconfig`、Vitest 配置、覆盖率 include 路径或 Turbo 输入：新增源码和测试都位于既有 `apps/admin/src`、`apps/admin/tests/unit` 和 `backend/src/test` 范围。继续只使用 Oxc（oxlint/oxfmt），不引入第二套 lint/format 工具。

后端新增 `RewardServiceTest`（库存、状态、原因、超时、重复操作）和 `AdminRewardControllerContractTest`（401/403、400/404/409、字段返回）；前端新增页面/抽屉/标签测试，覆盖筛选、分页、表单校验、确认操作和窄屏渲染。

## Risks / Trade-offs

- **库存算术错误导致超卖或负库存** → 继续使用奖励行锁和 `reservedStock`/`claimedCount` 双计数；服务测试覆盖编辑下限、重复领取、重复取消和超时释放。
- **浏览器与服务器时间不一致导致“已超时”显示偏差** → 页面仅把超时作为展示和禁用依据，最终状态由 Spring 按服务器时间判定；确认领取仍会返回真实状态。
- **账号目录请求失败时订单学生不可读** → 保留邮箱回退和 warning，不阻塞订单操作。
- **客户端全量列表在数据增长后变慢** → 首版接受；后续可增加后端分页，规格已把分页行为限定在页面层，不锁定接口形态。
- **未知状态筛选从“空列表”改为 400** → 管理端只发送白名单值；接口契约测试固定该行为，避免静默失败。

## Migration Plan

1. 先部署 Spring：新增校验和排序不改变数据库结构，旧管理端未接入时无影响。
2. 再部署 admin：替换两个占位路由并接入接口。
3. 回滚时先回滚 admin，再回滚 Spring；无数据迁移或双写。
4. 验证：`./mvnw verify`、`pnpm --filter admin lint && pnpm --filter admin check-types && pnpm --filter admin test`，最后根目录 `pnpm verify`。

## Open Questions

无。待实现阶段只按规格确认接口字段和错误码，不需要再决定产品范围。
