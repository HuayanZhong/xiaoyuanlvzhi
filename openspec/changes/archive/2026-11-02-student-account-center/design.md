# Design

## Context

See [proposal.md](proposal.md) for motivation and the delta specs for required behavior.

当前 `apps/web` 已经具备本次改动需要的全部基础能力：

- 页面取数统一用 `useAsyncData`（SSR 首屏），失败时通过 `resolveRequestError` 转成可读中文；业务操作失败通过 `resolveActionError` 直接展示 Spring 的中文消息。
- 表单控件与视觉组件已就绪：`UiTextInput`、`UiTextArea`、`UiImagePicker`（私有图片上传、5 MB 校验）、`UiConfirmDialog`、`UiAlert`、`Stamp`、`UiTimeline`、`TagRow`、`FolioSection`。
- 私有图片通过 `useFileUrl` / `UiFigure` 读取，上传走 `uploadImage`（`POST files`）。
- 全局路由守卫由 `app/middleware/auth.global.ts` 与 `app/utils/auth-route.ts` 的受保护前缀维护。

Spring 侧的 `notifications`、`feedback`、`profile` 接口都已经存在，本次不改后端：

| 操作          | 接口                                | 响应要点                                                    |
| ------------- | ----------------------------------- | ----------------------------------------------------------- |
| 通知列表      | `GET notifications`                 | `{ items, unreadCount }`，按创建时间倒序                    |
| 单条已读      | `POST notifications/{id}/read`      | `data: null`                                                |
| 全部已读      | `POST notifications/read-all`       | `data: null`                                                |
| 提交反馈      | `POST feedback`                     | `FeedbackView`，初始 `PENDING`                              |
| 反馈列表/详情 | `GET feedback`、`GET feedback/{id}` | `FeedbackView[]` / `FeedbackView`                           |
| 关闭反馈      | `POST feedback/{id}/close`          | 仅 `REPLIED`，否则 409 `FEEDBACK_STATUS_INVALID`            |
| 修改资料      | `PUT profile`                       | 返回最新 `AccountView`；手机号冲突 409 `PHONE_ALREADY_USED` |

数据流保持现有形态：浏览器请求经 Nitro `server/api` 转发到 Spring，SSR 由 Nuxt 服务端直接请求 `SPRING_API_ORIGIN`；token 仍只保存在同源 `student-auth-token` Cookie 中。

## Goals / Non-Goals

**Goals:**

- 用现有接口，在不改 Spring、admin、共享包的前提下补齐通知、反馈和资料编辑。
- 让三个位置的未读数只有一个数据源，避免首页、“我的”和通知页互相不一致。
- 让通知跳转、反馈状态和资料校验复用可单测的纯函数，页面只负责编排。

**Non-Goals:**

- 不实现首页的待处理事项、可报名任务和养护提醒区块。
- 不实现学生端资讯阅读。
- 不实现通知分页、按类型筛选、反馈撤回或消息推送。
- 不引入新的 UI 库、状态管理库或共享包。

## Decisions

### 1. 三个页面共享一个 `notifications` 缓存键

首页消息入口、“我的”通知入口和 `/notifications` 都通过 `useAsyncData("notifications", listNotifications)` 读取同一份 `{ items, unreadCount }`。标记已读成功后调用 `clearNuxtData("notifications")` 再 `refresh()`，其他页面下次进入时重新取数。

替代方案是为未读数单独请求接口，但后端没有该接口，单独拆请求只会多一次往返；通知量在学生端很小，直接复用列表响应更简单。`clearNuxtData` 的调用集中放在 `app/utils/notification-cache.ts`，与 `reward-cache.ts` 的做法一致，便于单测。

### 2. 通知跳转用纯函数生成目标

`app/utils/notification-route.ts` 提供 `notificationTarget(businessType, businessId)`：

- `ADOPTION`、`CARE`、`REDEMPTION`、`FEEDBACK` 直接拼接现有详情路径。
- `TASK` 返回一个可识别的标记，由页面用 `GET tasks/participations` 找到 `id === businessId` 的参与记录，再跳 `/tasks/{taskId}`；找不到或请求失败时跳 `/tasks`。
- 未知类型或缺少 `businessId` 返回 `null`，只标已读不跳转。

把映射放在纯函数里，页面测试只需要 mock 数据接口，映射本身可以单独覆盖。替代方案是在页面里写 `switch`，但四个业务路径和 TASK 的异步解析会混在事件处理里，难以复用和测试。

### 3. 通知点击先标已读再跳转

点击未读通知时先 `await markNotificationRead(id)`，成功后清缓存并 `navigateTo(target)`；失败时把 `resolveActionError` 的结果显示在列表顶部，停留在当前页。已读通知直接跳转，不再调用接口。

这符合“查看后标记已读”的语义，也让失败可见。替代方案是先跳转、后台标已读，会让未读数在一段时间内保持错误且失败被静默吞掉。

### 4. 反馈表单放在列表页内，类型/标签用本地映射

`/feedback` 顶部是提交表单（折叠展开），下方是历史列表；`/feedback/[id]` 负责详情与关闭。表单沿用养护打卡的提交方式：`UiImagePicker` 先上传拿 `fileId`，提交时只传 `imageFileIds`；提交中禁用按钮防止重复。

`app/utils/feedback-status.ts` 维护状态、类型和关联业务的中文标签，文案与 admin 的 `pages/feedback/labels.ts` 保持一致，但**不跨应用导入**。未识别的状态或类型保留原值/显示“未知状态”，不隐藏记录。

关联记录用“业务类型 + 编号”两个可选输入，两者同时填写或同时留空；客户端先校验，服务端仍以 `relatedType`/`relatedId` 存储。替代方案是按类型加载学生自己的记录供选择，数据更准，但会为一个可选字段引入多套列表请求，超出本次范围。

### 5. 反馈详情不展示处理人身份

后端返回 `handlerEmail`、时间线里的 `actorEmail`，学生端只显示状态、处理说明和时间。管理员身份对学生的操作没有帮助，且属于内部信息，页面层直接忽略这些字段。

### 6. 资料编辑在“我的”页内联完成

`/me` 的资料区块增加“修改”状态：手机号必填且校验 `^1[3-9]\d{9}$`，班级可为空（空字符串表示清空）。提交时同时发送 `phone` 与 `className`，成功后用 `PUT profile` 的返回值就地更新页面，并只清理首页的 `home-profile` 缓存。不能清当前页的 `me-profile`：`clearNuxtData` 会把正在挂载的 `useAsyncData` 重置为空，页面会丢失资料。失败时保留输入并显示服务端原因（如 `PHONE_ALREADY_USED`）。

替代方案是独立的 `/me/edit` 页面，但只有两个字段，内联表单更贴近现有“就地表单”的交互，也少一条路由和一套测试。

### 7. 首页消息入口独立取数

首页现有 `home-profile` 请求保持不变，消息入口使用独立的 `notifications` 请求。通知失败只让消息区块显示“消息暂时不可用”，不影响姓名、积分和在养数量。

## Risks / Trade-offs

- **未读数为 0 的判断依赖列表请求成功** → 请求失败时不显示数字，显示可重试提示，不冒充 0。
- **TASK 通知多一次参与记录请求** → 只在点击时发生，失败有 `/tasks` 兜底。
- **通知缓存被手动清理** → 所有已读操作都经过 `notification-cache.ts`，页面测试覆盖清理调用；其余页面下次进入会重新取数。
- **资料更新后多个缓存副本** → 同时清理 `me-profile` 与 `home-profile`，避免返回首页看到旧手机号/班级。
- **反馈图片是私有文件** → 复用 `useFileUrl` 和 `UiFigure`，不在 HTML 中拼接文件地址。
- **状态文案与 admin 漂移** → 学生端与 admin 各自维护映射，测试固定四组状态文案；若后端新增状态，两端都会落到“未知状态”而不是崩溃。

## Migration Plan

纯前端新增页面与入口，无数据迁移。上线后旧链接不受影响；回滚只需移除新增路由与入口，Spring 与已有页面无需回退。

## Open Questions

无。通知列表不分页、反馈不做撤回、首页其余区块留在后续变更，均已在 Non-Goals 中明确。
