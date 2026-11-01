# Proposal

## Why

学生领养进入「养护中」后，学生端没有任何养护入口：能申请归还，却不能提交日常打卡，领养闭环停在状态展示。同时，打卡凭证和后续的环保任务凭证都需要图片上传，而 web 目前只有认证图片读取，没有上传通道。

## What Changes

- 新增 `/my-plants`「我的绿植」：列出当前学生的在养植株，显示编号、摆放位置、养护间隔、上次通过时间、下次可打卡时间，以及「已有待审核打卡」「尚未到养护间隔」等不可打卡原因。
- 新增 `/my-plants/{plantId}` 植株养护页：展示本株信息、打卡表单（说明 + 最多 3 张凭证图）和本株打卡历史。
- 新增 `/care/{id}` 打卡详情：展示凭证版本时间线、凭证图片、审核状态与驳回原因，并允许在驳回后重新提交。
- 新增图片上传通道：以 `multipart/form-data` 上传到 `POST /api/v1/files`，携带 Bearer 令牌，返回文件 ID；学生只能上传私有图片。
- 新增图片选择组件：本地预览、删除、张数与大小校验、上传失败保留已填内容。
- 修改 `/me`、`/` 和 `/adoptions/{id}`：在养护中的数据上增加进入「我的绿植」的入口。
- 修改视觉规范中「不新增图片上传」的限制：允许业务凭证图片上传，仍禁止装饰性图片、插画和图标库。
- 不修改 Spring 接口，不新增第三方依赖。

## Capabilities

### New Capabilities

- `student-care`: 在养植株列表、养护打卡提交、打卡详情与驳回后重新提交。

### Modified Capabilities

- `web-api`: 新增「图片上传」需求，定义 multipart 请求、认证头、文件约束与错误处理。
- `web-shell`: 学生端页面壳增加 `/my-plants`、`/my-plants/{plantId}`、`/care/{id}` 路由，并定义从首页、我的和领养详情进入的入口。
- `web-visual-system`: 「无图识别与图片兼容」允许业务凭证图片上传，并补充凭证图片在固定画框中的展示要求。

## Impact

- 受影响应用：仅 `apps/web`。
- Spring：不修改任何接口，复用现有的 `/api/v1/care/eligible-plants`、`/api/v1/care/checkins`、`/api/v1/care/checkins/{id}`、`/api/v1/care/checkins/{id}/resubmit` 与 `/api/v1/files`。
- 共享包：不使用新的工作区包，不修改 `@repo/http-client`、`@repo/env`。
- 依赖与工具链：不新增 npm 依赖，继续使用 Oxc 与现有 Vitest 配置。
- 路由：新增三条学生端路由，现有 URL、表单字段与认证流程不变，不构成 BREAKING。
- 端口与包边界：不变。
- 验证：端到端检查需要一株处于「养护中」的绿植；若本地数据缺少这种领养，需要先通过管理端完成交接，或只验证空态、校验与读取路径。
