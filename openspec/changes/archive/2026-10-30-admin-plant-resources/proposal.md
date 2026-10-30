# Proposal

## Why

admin 目前只有登录、后台壳和 12 个占位模块，没有任何业务数据。绿植资源是领养、养护、库存状态和统计的前置：没有品种与单株，后续模块无法串成闭环。Spring 已经提供管理端品种、单株和文件上传接口，前端可以先把这个资源根节点落地。

## What Changes

- 新增 `/plants/species` 品种档案页面：列表、筛选、分页、新增/编辑表单、启用/停用、跳转查看关联单株。
- 新增 `/plants/instances` 单株库存页面：列表、筛选、分页、新增/编辑表单、送修、维护完成、停用；支持按品种过滤。
- 新增 admin 领域 API 层：品种、单株、文件上传，并把现有的统一响应信封解包与错误映射抽成通用能力供后续模块复用。
- 新增图片上传组件，使用 Spring 文件接口上传公开图片，供品种封面和单株图片使用。
- 列表采用客户端筛选与分页，每页 10 条；接口仍按现有全量返回。
- 两个占位路由替换为真实页面。

明确不做：删除品种或单株（Spring 未提供删除接口）、显示“当前领养学生”（单株视图未返回该字段）、服务端分页与筛选。

## Capabilities

### New Capabilities

- `admin-plants`: 管理端绿植资源能力，覆盖品种档案与单株库存的查询、筛选、分页、创建编辑、状态操作、图片上传和错误反馈。

### Modified Capabilities

无。现有 `admin-shell` 的“模块路由与占位页”要求仍然成立：未实现模块继续显示占位页，本次只是让其中两个模块进入已实现状态，不改变该要求的语义。

## Impact

- 受影响应用：`apps/admin` 的页面、路由、API 层、通用组件与测试。
- 共享包：无变更；继续使用 `@repo/http-client`，不新增运行时依赖。
- Spring：**不修改接口**。使用现有的 `GET/POST/PUT /api/v1/admin/plant-species`、`GET/POST/PUT /api/v1/admin/plant-individuals` 及其状态操作子路径、`POST /api/v1/files` 和 `GET /api/v1/files/{id}`。
- 认证：复用现有 Bearer 注入与 401 处理，不新增认证行为，不改变持久化方式。
- 路由：`/plants/species` 与 `/plants/instances` 由占位页变为真实页面，路径不变，不构成 BREAKING。
- 工具链：无变更，继续使用 TypeScript、Vitest 和 Oxc。
