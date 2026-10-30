# Proposal

## Why

绿植资源已经落地，但管理员还无法把品种和单株推进到真实领养关系：没有审核、选株绑定、交接、取消和归还处理，单株会一直停在“可领养”，养护审核也没有“养护中”的对象可审。领养管理是学生申请、资源库存和后续养护积分之间的主链路，Spring 已经提供完整的管理端接口，现在适合先把这个闭环补齐。

## What Changes

- 新增 `/adoptions` 领养管理页面：申请列表、关键词/状态/品种/提交日期筛选、客户端分页。
- 新增申请详情抽屉：学生资料、申请信息、绑定单株、审核/归还原因和完整状态时间线。
- 新增状态操作：通过并选株、驳回、确认线下交接、处理取消申请、处理归还申请（重新开放或转入维护）。
- 新增选株弹窗：只列出申请品种下状态为“可领养”的单株，库存为空时提供去单株库存的入口。
- 新增 admin 领域 API 层：领养申请与学生目录；学生姓名/学号通过现有账号接口在前端关联展示。
- 状态筛选通过 `?status=` 查询参数表达，为后续工作台跳转预留。
- 占位路由 `/adoptions` 替换为真实页面。

明确不做：批量操作、导出、服务端分页与筛选、通知中心、学生端页面，以及展示“处理人”（现有领养视图和时间线未返回操作人字段）。不改动品种/单株页面和 Spring 接口。

## Capabilities

### New Capabilities

- `admin-adoptions`: 管理端领养管理能力，覆盖申请查询、筛选分页、详情时间线、审核选株、驳回、交接、取消处理、归还处理和状态冲突反馈。

### Modified Capabilities

无。`admin-plants` 的单株状态仍然由 Spring 在领养操作中驱动，本次不改变其规格；`admin-shell` 的占位页要求继续成立，只是 `/adoptions` 进入已实现状态。

## Impact

- 受影响应用：`apps/admin` 的页面、路由、API 层、状态标签与测试。
- 共享包：无变更；继续使用 `@repo/http-client`，不新增运行时依赖。
- Spring：**不修改接口**。使用现有的 `GET /api/v1/admin/adoptions`、`GET /api/v1/admin/adoptions/{id}`、`POST /{id}/approve|reject|handover|cancel-decision|return-decision`，以及 `GET /api/v1/admin/accounts` 做学生信息关联。
- 认证：复用现有 Bearer 注入与 401 处理，不新增认证行为。
- 路由：`/adoptions` 由占位页变为真实页面，路径不变，不构成 BREAKING。
- 工具链：无变更，继续使用 TypeScript、Vitest 和 Oxc。
- 开发数据：联调需要一个学生账号和一条领养申请；会使用开发库测试数据，不写入仓库。
