# Design

## Context

学生端已有领养、养护打卡两条完整链路，页面壳、导航、上传与私有图片读取都已就位。任务模块可以直接复用这些基础设施：`apps/web` 的 `useAsyncData` 取数、Nitro 转发、`UiImagePicker` 上传、`UiFigure` 读图、`Stamp`/`TagRow`/`FolioSection` 档案版式。Spring 一侧的任务接口已经完整，本次不新增后端能力。动机见 proposal.md。

## Goals / Non-Goals

**Goals**

- 用两个页面完成任务的浏览、筛选、报名、凭证提交与参与记录查看。
- 让参与状态与列表筛选在只有「任务列表 + 参与列表」两个接口时仍然准确。
- 延续既有错误展示与状态标签约定，避免任务页出现第二套文案。

**Non-Goals**

- 不改 Spring 接口、管理端页面、认证流程或共享包。
- 不做首页任务区块、通知、积分明细与兑换。
- 不为单条参与记录新增路由或后端接口。

## Decisions

### 两个页面，参与记录内嵌在任务详情

`/tasks` 负责列表与筛选，`/tasks/[id]` 负责详情、报名、参与状态、凭证历史与重提表单。Spring 只有 `GET /tasks/participations` 列表接口，没有单条参与记录查询；独立路由需要先拉全量列表再按键匹配，还要多一层「记录不存在」分支。内嵌后详情页只需一次并行取数，任务结束后（状态 `ENDED`）详情仍可打开，历史凭证不会丢失。

代价是详情页较长，用 `FolioSection` 分成「任务档案」和「我的参与」两卷，表单只在可提交时出现。

### 参与状态由参与列表合并，筛选在前端完成

`GET /tasks` 返回的 `TaskView` 只有 `currentUserParticipating` 布尔值，没有参与状态；`GET /tasks/participations` 返回参与状态和凭证版本。列表页与详情页都并行请求这两个接口：

| 视图   | 判定                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| 全部   | 所有已发布任务                                                                                |
| 可报名 | `status === "ONGOING"`、未参与、`maxParticipants` 为空或 `participantCount < maxParticipants` |
| 已参加 | 存在 `taskId` 匹配的参与记录                                                                  |
| 已结束 | `status === "ENDED"`                                                                          |

`UPCOMING` 只出现在「全部」，避免未开始的任务在三个筛选里都消失。筛选在客户端完成：接口没有筛选参数，学生任务量很小，增加后端参数不在本次范围。参与列表失败会让整页进入可重试错误，不用「部分数据 + 猜测状态」的方式降级。

### 新增 `task-api.ts` 与 `task-status.ts`

- `utils/task-api.ts` 封装 `GET tasks`、`GET tasks/{id}`、`POST tasks/{id}/join`、`GET tasks/participations`、`POST tasks/participations/{id}/submissions`，类型与 `TaskDtos` 对齐；提交说明最多 500 字、图片最多 3 张。
- `utils/task-status.ts` 提供两张映射：任务状态（`UPCOMING` 尚未开始、`ONGOING` 进行中、`ENDED` 已结束）与参与状态（`JOINED` 已报名、`PENDING_REVIEW` 待审核、`APPROVED` 已通过、`REJECTED` 已驳回），并导出 `canJoin`、`isFull`、`canSubmit`、`remainingQuota`。未知状态按只读处理，与 `care-status` 一致。

### 错误文案收敛到 `action-errors.ts`

现有 `care-errors.ts` 的 `resolveCareError` 只做一件事：业务错误展示服务端中文消息，其余回退通用提示。任务需要同样的行为，直接引用「care」会误导。把文件改名为 `utils/action-errors.ts`、函数改为 `resolveActionError`，更新 `UiImagePicker`、`my-plants/[plantId]`、`care/[id]` 三处引用。这是纯重命名，没有行为变化，也没有测试直接引用该模块。

### 凭证校验遵循任务配置

后端按 `requireText` / `requirePhoto` 校验，两者都为 false 时返回 `TASK_EVIDENCE_UNCONFIGURED` 且无法提交。前端按同一规则处理：

- `requireText` 为真：说明必填；`requirePhoto` 为真：至少一张图片。
- 两者都为真时都要满足；两者都为假时禁用表单并提示联系管理员。
- 说明超过 500 字或图片超过 3 张时就地拦截，不发请求。
- 上传失败保留已填说明和已上传图片，复用 `UiImagePicker` 的 `busy` 事件控制提交按钮。

### 导航与登录保护

`STUDENT_NAV` 插入 `{ label: "任务", to: "/tasks" }`（绿植之后、我的之前），`isNavActive` 已按前缀匹配，`/tasks/[id]` 会自动高亮。`PROTECTED_PREFIXES` 增加 `/tasks`。桌面横向导航、窄屏底部导航和主题切换都不需要改组件，四项在 320px 下各占 80px，两字标签不会溢出。

### 图片与版式

任务封面是管理员上传的公开图片，学生凭证是私有图片，两者都用 `UiFigure` 读取：列表封面 1:1，详情封面 4:3，凭证 1:1 等宽三列。无封面时沿用「无图识别」规则，用标题、编号与线框建立识别度。不新增视觉 token、组件或依赖。

## Risks / Trade-offs

- **两个接口的时序**：任务列表与参与列表并行请求，任一失败整页报错。→ 可接受，学生任务量小，且避免展示错误的「已参加」状态。
- **页面打开期间任务截止**：报名或提交会被服务端以 `TASK_NOT_OPEN` / `TASK_CLOSED` 拒绝。→ 统一显示服务端中文原因并刷新详情，按钮随最新数据更新。
- **参与状态落后于列表**：报名成功后必须刷新两批数据，否则「已参加」筛选仍显示未报名。→ 报名成功调用整页 `refresh()`，不用本地推断。
- **任务未配置凭证要求**：学生无法提交。→ 明确提示联系管理员，不显示可用表单。
- **说明与图片同时必填**：表单较长，窄屏下容易误以为只需一项。→ 在字段 hint 中写明当前任务的凭证要求。

## Migration Plan

无数据迁移。上线即新增两个路由和一个导航项；回滚只需移除页面、导航项、保护前缀和对应测试，Spring 与其他应用不受影响。

## Open Questions

无。
