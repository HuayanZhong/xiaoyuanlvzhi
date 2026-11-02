# Tasks

## 1. web · 通知数据层

- [x] 1.1 新增 `app/utils/notification-api.ts`，定义 `NotificationItem`、`NotificationList` 类型与 `listNotifications`、`markNotificationRead`、`markAllNotificationsRead`；在 `tests/nuxt/utils/notification-api.test.ts` 验证请求路径、方法与返回结构
- [x] 1.2 新增 `app/utils/notification-label.ts`，提供业务类型中文标签（含未知类型回退）与 `notificationTarget` 路径映射（TASK 返回可识别标记）；在 `tests/nuxt/utils/notification-label.test.ts` 覆盖四种直接跳转、TASK、未知类型和缺少 `businessId`
- [x] 1.3 新增 `app/utils/notification-cache.ts`，统一清理 `notifications` 缓存；在 `tests/nuxt/utils/notification-cache.test.ts` 验证调用 `clearNuxtData("notifications")`

## 2. web · 通知页面与首页入口

- [x] 2.1 新增 `app/pages/notifications.vue`：列表、未读数、空态、可重试错误、「全部标记已读」（0 时禁用）、点击先标已读再跳转、TASK 经参与记录解析；在 `tests/nuxt/pages/notifications.test.ts` 覆盖加载成功、空态、失败、单条/全部已读、标记失败不跳转、TASK 解析与兜底
- [x] 2.2 在 `app/pages/index.vue` 增加消息入口与未读数（独立 `notifications` 请求，失败不影响首页其他区块）；在 `tests/nuxt/pages/home.test.ts` 验证未读数、入口链接和通知失败时的降级

## 3. web · 反馈

- [x] 3.1 新增 `app/utils/feedback-api.ts`，定义 `FeedbackView`、`FeedbackEvent` 类型与 `createFeedback`、`listFeedback`、`getFeedback`、`closeFeedback`；在 `tests/nuxt/utils/feedback-api.test.ts` 验证请求路径、方法与请求体
- [x] 3.2 新增 `app/utils/feedback-status.ts`，提供状态、类型、关联业务中文标签和可关闭判断；在 `tests/nuxt/utils/feedback-status.test.ts` 覆盖四组状态、四组类型、未知值与 `REPLIED` 才可关闭
- [x] 3.3 新增 `app/pages/feedback/index.vue`：历史列表与就地提交表单（类型、描述 5–500、图片最多 3 张、关联记录成对填写、防重复提交、成功显示编号与待处理）；在 `tests/nuxt/pages/feedback.test.ts` 覆盖列表、空态、成功、校验失败、图片失败、关联记录只填一项、重复提交
- [x] 3.4 新增 `app/pages/feedback/[id].vue`：详情、图片、管理员回复、处理时间线、关闭确认与错误刷新；在 `tests/nuxt/pages/feedback-detail.test.ts` 覆盖字段展示、已回复、不可查看、关闭成功和 `FEEDBACK_STATUS_INVALID`

## 4. web · 我的页面

- [x] 4.1 在 `app/utils/profile-api.ts` 增加 `updateStudentProfile({ phone, className })`；在 `tests/nuxt/utils/profile-api.test.ts` 验证 `PUT profile`、请求体和返回类型
- [x] 4.2 在 `app/pages/me.vue` 增加通知（未读数）与问题反馈入口，并接入 `notifications` 请求；在 `tests/nuxt/pages/me.test.ts` 验证两个入口、未读数与通知请求失败时的降级
- [x] 4.3 在 `app/pages/me.vue` 增加手机号/班级行内编辑：手机号必填与格式校验、班级可清空、成功就地更新并清理 `home-profile` 缓存（不清当前页的 `me-profile`）、冲突与网络错误保留输入；在 `tests/nuxt/pages/me.test.ts` 覆盖成功、`PHONE_ALREADY_USED`、清空班级和缓存清理

## 5. web · 路由、文档与集成验证

- [x] 5.1 在 `app/utils/auth-route.ts` 增加 `/notifications`、`/feedback` 受保护前缀；在 `tests/nuxt/middleware/auth.test.ts` 验证未登录访问这两个路径会回到登录并带回跳
- [x] 5.2 更新 `AGENTS.md` 的 web 路由、工具模块和页面说明（`notification-api.ts`、`notification-label.ts`、`notification-cache.ts`、`feedback-api.ts`、`feedback-status.ts`、`updateStudentProfile`）；用 `grep` 确认新增路径和模块名已出现且旧描述已更新
- [x] 5.3 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test` 和 `pnpm --filter web format:check`，确认全部通过
- [x] 5.4 在 4000 端口用真实学生账号走通：通知未读数在首页/我的/通知页一致、点击通知进入对应详情、提交反馈后管理端回复并关闭；检查 320/375/768/1440 视口与日间/暗夜主题无横向滚动
- [x] 5.5 运行根目录 `pnpm verify`，确认 19 个任务全部通过

## Workflow follow-up

- 评审通过后归档本变更，并在归档摘要中写明受影响的 specs 与 `apps/web` 验证结果。
- 归档后确认 `openspec list --json` 不再列出该变更。
