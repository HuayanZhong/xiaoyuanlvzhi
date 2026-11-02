# Spec Delta

## MODIFIED Requirements

### Requirement: 首页摘要

The home page SHALL show the current student's display name, current points balance and active plant count. It SHALL show a loading state while fetching, a retryable error on failure, and a clear zero-value presentation when the student has no active plants. The points balance SHALL link to the points ledger at `/points`. The home page SHALL provide a message entry that shows the unread notification count and links to `/notifications`.

#### Scenario: 显示账号摘要

- **WHEN** 首页数据加载成功
- **THEN** 页面显示当前学生姓名、积分余额和在养绿植数

#### Scenario: 首页姓名为空

- **WHEN** 已有学生账号的姓名为空
- **THEN** 首页用学号或邮箱作为可识别名称，不显示空白欢迎语

#### Scenario: 暂无在养绿植

- **WHEN** 学生的在养绿植数为 0
- **THEN** 首页用“暂无在养绿植”说明代替空白数字，不显示错误

#### Scenario: 有在养绿植时不显示零值说明

- **WHEN** 学生的在养绿植数大于 0
- **THEN** 首页显示在养数量和进入 `/my-plants` 的入口，不显示“领养审核通过后，植株会登记在这里”的零值说明

#### Scenario: 首页加载失败

- **WHEN** 资料请求因网络或 5xx 失败
- **THEN** 首页显示可重试错误，底部导航仍可使用

#### Scenario: 从首页进入积分明细

- **WHEN** 学生在首页点击积分余额
- **THEN** 页面进入 `/points`，主导航中的“积分”入口处于选中状态

#### Scenario: 从首页进入通知列表

- **WHEN** 学生在首页点击消息入口
- **THEN** 页面进入 `/notifications`，主导航选中态保持不变
