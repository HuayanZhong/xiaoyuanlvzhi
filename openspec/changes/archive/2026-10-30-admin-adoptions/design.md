# Design

## Context

见 `proposal.md`。当前 admin 已有统一请求封装 `src/api/client.ts`、品种/单株页面和抽屉表单模式；`/adoptions` 仍是占位页。Spring 已提供完整的领养管理接口，领养视图包含状态、单株、原因、截止时间和状态事件，但不包含学生姓名/学号、处理人或事件操作人。admin 目前没有学生目录 API 封装，也没有日期范围筛选的先例。

## Goals / Non-Goals

**Goals:**

- 在 `apps/admin` 内完成 `/adoptions` 列表、详情、审核选株、驳回、交接、取消和归还流程。
- 复用现有请求封装、错误提示、页面容器和响应式约定，保持与品种/单株页一致的交互。
- 用现有接口满足产品规格中的学生资料展示，不修改 Spring。
- 为后续工作台深链保留 `?status=` 入口。

**Non-Goals:**

- 不实现学生端领养流程、通知中心、批量操作、导出或服务端分页。
- 不修改 `admin-plants`、`admin-shell` 或其他应用的规格与路由语义。
- 不新增共享包或跨应用导入。

## Decisions

### D1: 复用现有请求层，新增两个领域 API 模块

新增 `src/api/adoptions.ts` 与 `src/api/accounts.ts`，所有请求经 `src/api/client.ts` 的 `request`/`requestVoid`，继续使用 Bearer 注入、统一信封解包和 `ApiError` 映射。领养 API 覆盖列表、详情、通过、驳回、交接、取消决策和归还决策；账号 API 只暴露 `listStudents()` 所需字段。

不把领养请求塞进页面组件，也不修改 `@repo/http-client`；共享包只接收普通配置值，不读取环境变量。

### D2: 客户端筛选与分页

Spring 列表接口返回全量数据并支持 `status` 参数，但品种/单株页已经采用“一次拉取、客户端筛选分页”的模式。领养页沿用该模式：一次 `GET /api/v1/admin/adoptions`，关键词、状态、品种、日期范围和分页都在客户端完成。这样切换筛选不会产生额外请求，便于测试，也与现有页面一致。

`status` 查询参数只作为状态初始筛选：进入页面时读取并校验，点击“查询”或“重置”时写回 URL（`replace`）。无效状态按“全部”处理，不渲染错误页。

### D3: 学生目录前端关联

`ApplicationView` 只有 `studentId` 和 `studentEmail`，而产品要求显示姓名和学号。页面并行请求 `GET /api/v1/admin/adoptions` 和 `GET /api/v1/admin/accounts`，以 `studentId` 建立映射，列表和详情显示姓名、学号、院系、班级和邮箱。账号请求失败时降级为空映射，学生列显示邮箱，不阻塞领养数据。

备选方案是让 Spring 在领养视图里补学生字段，但这会引入后端改动，超出本次范围；前端关联在首版数据规模下可接受，后续学生管理模块可以替换为更精确的查询。

### D4: 详情抽屉 + 动作后双刷新

列表行的“查看”打开右侧抽屉，打开时请求 `GET /api/v1/admin/adoptions/{id}`，避免使用可能过期的列表数据。抽屉展示学生资料、申请信息、原因、截止时间和时间线，底部按状态渲染操作。

动作成功后用接口返回的 `ApplicationView` 更新抽屉，并重新拉取列表；动作失败保留抽屉与表单内容。`ADOPTION_STATUS_INVALID` 额外触发一次列表和详情刷新，避免页面停留在过期状态。

### D5: 选株弹窗只展示同品种可领养单株

点击“通过”打开弹窗，打开时重新请求 `GET /api/v1/admin/plant-individuals`，过滤 `speciesId` 等于申请品种且状态为 `AVAILABLE` 的单株。弹窗用带单选行的表格展示编号、位置、展示名称，支持关键词过滤；没有可领养单株时显示空状态和“去单株库存”入口（`/plants/instances?speciesId=<id>`），确认按钮不可用。

提交 `POST /api/v1/admin/adoptions/{id}/approve`，请求体 `{ plantId }`。`PLANT_NOT_AVAILABLE` 时留在弹窗并刷新单株；`PLANT_SPECIES_DISABLED` 和 `ADOPTION_STATUS_INVALID` 时关闭弹窗并刷新详情与列表。

### D6: 决策弹窗复用与二次确认

- 驳回申请、拒绝取消、驳回归还共用 `ReasonModal`：TextArea 5–200 字，前端校验通过才发请求，失败保留输入。
- 确认归还使用 `ReturnDecisionModal`：单选“重新开放领养 / 转入维护”，未选择不提交；提交 `{ approved: true, returnResult }`。
- 同意取消和确认交接使用 `Popconfirm` 二次确认，分别提交 `{ approved: true }` 和无请求体。
- 所有提交按钮在请求期间显示加载并禁用，防止重复提交。

### D7: 状态元数据集中管理

在 `src/pages/adoptions/labels.ts` 集中维护状态选项、中文文案、Tag 颜色和归还结果文案。状态值使用与 Spring 一致的英文枚举，展示层只输出中文；颜色只作为辅助，文案必须完整可读。

### D8: 错误处理沿用现有约定

页面使用 `notifyError` 和 `ApiError`：401 交给现有登录态，403/5xx/网络错误显示中文提示；业务错误优先显示后端 `message`。状态冲突额外刷新，其他动作失败不关闭弹窗、不清空表单。

### D9: 日期范围使用原生 date 输入

筛选区的提交日期范围使用两个 antd `Input type="date"`（开始、结束），按 `YYYY-MM-DD` 字符串与 `createdAt` 的日期部分比较。选择该方案是因为 `dayjs` 目前只是 antd 的传递依赖，未在 `apps/admin` 声明；为两个日期边界引入直接依赖不划算，原生输入也更容易在 Vitest 中驱动。若后续筛选交互变复杂，再考虑引入 DatePicker 与 `dayjs`。

### D10: 响应式与内容布局

列表 `scroll={{ x: ... }}`，窄屏只在卡片内部横向滚动；详情抽屉在 `<992px` 时 `size="100%"`，否则固定 640；选株和决策弹窗在窄屏使用百分比宽度。沿用 `useIsMobile` 与现有抽屉模式。

## Testing and Configuration Impact

- 新增 `tests/unit/api/adoptions.test.ts`、`tests/unit/api/accounts.test.ts`、`tests/unit/pages/adoptions/AdoptionsPage.test.tsx`，并更新 `tests/unit/router.test.tsx` 与 README 路由说明。
- 不新增 Vitest 配置、覆盖率 include 或 Turbo 输入：新源码和测试都位于 `apps/admin` 现有 glob 内。若实际目录超出既有 include，再同步调整。
- 不修改 `tsconfig`、Vite 配置或 Oxc 配置；不引入 ESLint/Prettier。
- 不新增运行时依赖；继续使用 `@repo/http-client`。

## Data Flow

```text
Admin 页面 (React)
  -> src/api/adoptions.ts / accounts.ts
  -> src/api/client.ts（Bearer、信封解包、ApiError）
  -> @repo/http-client (ky)
  -> /api/v1（Vite 开发代理到 Spring）
  -> Spring 管理端领养/账号接口

详情：GET /admin/adoptions/{id} -> ApplicationView + timeline
通过：POST /admin/adoptions/{id}/approve {plantId}
驳回：POST /admin/adoptions/{id}/reject {reason}
交接：POST /admin/adoptions/{id}/handover
取消：POST /admin/adoptions/{id}/cancel-decision {approved, reason?}
归还：POST /admin/adoptions/{id}/return-decision {approved, returnResult?, reason?}
学生：GET /admin/accounts -> 前端按 studentId 关联
```

web 应用不参与本次变更；没有新增 BFF 或共享运行时。

## Risks / Trade-offs

- **账号列表全量拉取**：学生规模增大后前端关联会变重 → 首版接受；后续学生管理模块可提供按 ID 批量或详情查询。
- **列表与详情可能过期**：其他管理员或系统超时任务会改变状态 → 打开详情重新请求，动作后刷新，状态冲突时强制刷新。
- **领养列表包含时间线**：列表响应体积随事件数增长 → 首版保持全量；未来可让 Spring 在列表接口省略 timeline。
- **缺少处理人与事件操作人**：产品规格要求处理人，现有视图没有该字段 → 本次只展示状态、原因和时间，记录为已知缺口，不做前端猜测。
- **原生日期输入的外观差异**：不同浏览器样式不完全一致 → 仅用于筛选边界，可接受；后续可替换为 DatePicker。
- **开发库测试数据**：联调需要插入测试学生和申请，可能残留在本地数据库 → 只在开发库操作，不写入仓库，归档说明中记录。

## Migration Plan

- 将 `/adoptions` 路由从占位页替换为真实页面，路径不变，无数据迁移。
- 回滚只需恢复占位路由；后端与数据库无变更。
- 部署仍为静态前端构建，不涉及新的环境变量或代理规则。
