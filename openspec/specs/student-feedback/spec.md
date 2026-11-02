# student-feedback Specification

## Purpose

定义学生提交问题反馈、查看处理进度与管理员回复并确认关闭的方式，使无法自助处理的异常能在系统内形成可追踪的记录。

## Requirements

### Requirement: 提交反馈

学生端 SHALL 在 `/feedback` 提供提交表单，调用 `POST /api/v1/feedback`。请求体 SHALL 包含 `type`、`description`，可选 `relatedType`、`relatedId` 与最多 3 个 `imageFileIds`。`type` SHALL 为 `PLANT_ISSUE` 绿植问题、`ACCOUNT_ISSUE` 账号问题、`REWARD_ISSUE` 奖励问题或 `OTHER` 其他之一；`description` 去除首尾空白后 SHALL 为 5–500 字。

#### Scenario: 提交成功

- **WHEN** 学生填写类型和 5–500 字描述并提交
- **THEN** 页面显示反馈编号和「待处理」，表单清空，反馈出现在列表最前

#### Scenario: 描述不合规

- **WHEN** 描述少于 5 字或超过 500 字
- **THEN** 页面就地提示字数要求，不发送请求

#### Scenario: 重复提交

- **WHEN** 请求处理中再次点击提交
- **THEN** 不发送第二次请求

#### Scenario: 提交失败

- **WHEN** 提交请求因网络或服务错误失败
- **THEN** 页面显示可读原因并保留已填写的类型、描述和图片

### Requirement: 反馈图片

反馈表单 SHALL 允许上传最多 3 张 JPG、PNG 或 WebP 图片，单张不超过 5 MB，并 SHALL 在提交前显示本地预览；移除图片后 SHALL 不再随表单提交。

#### Scenario: 上传图片

- **WHEN** 学生选择 2 张合规图片并提交
- **THEN** 反馈详情显示这 2 张图片

#### Scenario: 图片不合规

- **WHEN** 学生选择非 JPG、PNG、WebP 文件或超过 5 MB 的图片
- **THEN** 页面提示图片要求，不把该文件加入待提交列表

### Requirement: 关联记录

反馈表单 SHALL 提供可选的关联记录：业务类型为领养申请、养护打卡、环保任务、兑换订单或绿植，并填写对应编号。业务类型与编号 SHALL 同时填写或同时留空；只填一项时 SHALL 就地提示并阻止提交。

#### Scenario: 关联一条记录

- **WHEN** 学生选择「领养申请」并填写编号 `12`
- **THEN** 提交后详情显示「领养申请 #12」

#### Scenario: 只填一项

- **WHEN** 学生只选择业务类型或只填写编号
- **THEN** 页面提示两项需要同时填写，不发送请求

#### Scenario: 不关联记录

- **WHEN** 学生不填写业务类型和编号
- **THEN** 反馈正常提交，详情不显示关联记录

### Requirement: 我的反馈列表

学生端 SHALL 在 `/feedback` 按创建时间倒序显示当前学生的反馈，来源为 `GET /api/v1/feedback`。每条 SHALL 显示反馈编号、类型、描述摘要、状态和创建时间，并可打开 `/feedback/{id}`。状态 SHALL 使用固定中文标签：`PENDING` 待处理、`IN_PROGRESS` 处理中、`REPLIED` 已回复、`CLOSED` 已关闭；未知状态 SHALL 显示「状态未知」并保持只读。

#### Scenario: 浏览反馈

- **WHEN** 学生访问 `/feedback` 且已有反馈
- **THEN** 页面按时间倒序显示编号、类型、描述摘要、状态和创建时间

#### Scenario: 没有反馈

- **WHEN** 学生没有提交过反馈
- **THEN** 页面显示空态说明，并提供提交反馈的入口

#### Scenario: 列表加载失败

- **WHEN** 反馈列表请求因网络或 5xx 失败
- **THEN** 页面显示可重试错误，导航保持可用

### Requirement: 反馈详情与回复

学生端 SHALL 在 `/feedback/{id}` 显示反馈编号、类型、关联记录、描述、图片、状态、创建时间、管理员回复和处理时间线，数据来源为 `GET /api/v1/feedback/{id}`。时间线 SHALL 显示状态变化、处理说明和时间，不显示处理人邮箱。反馈不存在或不属于当前学生时 SHALL 说明无法查看，并提供返回反馈列表的入口。

#### Scenario: 查看反馈详情

- **WHEN** 学生打开自己的反馈详情
- **THEN** 页面显示描述、图片、当前状态和完整处理时间线

#### Scenario: 管理员已回复

- **WHEN** 反馈状态为「已回复」
- **THEN** 页面显示管理员回复内容和回复时间

#### Scenario: 反馈不可查看

- **WHEN** 学生打开不存在或不属于自己的反馈
- **THEN** 页面说明无法查看该反馈，并提供返回反馈列表的入口

### Requirement: 确认关闭反馈

只有「已回复」的反馈 SHALL 显示关闭入口。关闭 SHALL 二次确认，确认后调用 `POST /api/v1/feedback/{id}/close`。成功后 SHALL 显示「已关闭」并刷新处理时间线；服务端返回 `FEEDBACK_STATUS_INVALID` 时 SHALL 显示原因并刷新详情，SHALL NOT 把反馈显示为已关闭。

#### Scenario: 关闭成功

- **WHEN** 学生确认关闭一条「已回复」反馈
- **THEN** 反馈显示「已关闭」，时间线增加关闭记录

#### Scenario: 状态已变化

- **WHEN** 关闭时服务端返回 `FEEDBACK_STATUS_INVALID`
- **THEN** 页面显示原因并刷新详情，不显示为已关闭

#### Scenario: 未回复不可关闭

- **WHEN** 反馈状态为待处理、处理中或已关闭
- **THEN** 页面不显示关闭入口
