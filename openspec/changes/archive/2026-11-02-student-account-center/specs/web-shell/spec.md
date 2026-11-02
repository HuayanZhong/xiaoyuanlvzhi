# Spec Delta

## MODIFIED Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a masthead, content area and, on narrow viewports only, bottom navigation. At `48rem` and above the shell SHALL show a paper masthead with the wordmark, horizontal navigation and theme toggle; below `48rem` it SHALL show a compact masthead with the wordmark and theme toggle. The content area SHALL be at most `70rem` wide. `/` SHALL render the home page, `/me` SHALL render the profile page, `/plants` and `/plants/{id}` SHALL render the plant catalog and species detail, `/adoptions` and `/adoptions/{id}` SHALL render the application list and detail, `/tasks` and `/tasks/{id}` SHALL render the eco task list and task detail, `/points` SHALL render the points ledger, `/rewards` SHALL render the rewards shop, `/rewards/orders` and `/rewards/orders/{id}` SHALL render the redemption order list and order detail, `/notifications` SHALL render the notification list, `/feedback` and `/feedback/{id}` SHALL render the feedback list and feedback detail, `/my-plants` and `/my-plants/{plantId}` SHALL render the active plant list and the care page for one plant, and `/care/{id}` SHALL render a check-in detail. `/login` and `/register` SHALL use an auth layout without bottom navigation. Unauthenticated access to any student business route SHALL redirect to `/login` and return to the original path after login.

#### Scenario: 进入首页

- **WHEN** 已登录学生访问 `/`
- **THEN** 页面显示字标、主题切换、首页内容和页面头部；窄屏同时显示底部导航，桌面显示横向导航

#### Scenario: 进入我的

- **WHEN** 已登录学生访问 `/me`
- **THEN** 页面显示页面头部、资料内容和主题切换；窄屏同时显示底部导航

#### Scenario: 登录页不显示底部导航

- **WHEN** 学生访问 `/login` 或 `/register`
- **THEN** 页面使用认证布局，不显示学生端底部导航

#### Scenario: 进入绿植与申请页面

- **WHEN** 已登录学生访问 `/plants`、某个品种详情、`/adoptions` 或某个申请详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换

#### Scenario: 进入任务页面

- **WHEN** 已登录学生访问 `/tasks` 或某个任务详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回任务列表

#### Scenario: 进入积分与兑换页面

- **WHEN** 已登录学生访问 `/points`、`/rewards`、`/rewards/orders` 或某个订单详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回积分页或订单列表

#### Scenario: 进入通知与反馈页面

- **WHEN** 已登录学生访问 `/notifications`、`/feedback` 或某个反馈详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回首页或反馈列表

#### Scenario: 进入养护页面

- **WHEN** 已登录学生访问 `/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回我的绿植或打卡列表

#### Scenario: 未登录访问业务页面

- **WHEN** 未登录用户访问 `/plants`、某个品种详情、`/adoptions`、某个申请详情、`/tasks`、某个任务详情、`/points`、`/rewards`、`/rewards/orders`、某个订单详情、`/notifications`、`/feedback`、某个反馈详情、`/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面先进入 `/login`，登录后回到原路径

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

#### Scenario: 首页加载失败

- **WHEN** 资料请求因网络或 5xx 失败
- **THEN** 首页显示可重试错误，底部导航仍可使用

#### Scenario: 从首页进入积分明细

- **WHEN** 学生在首页点击积分余额
- **THEN** 页面进入 `/points`，主导航中的“积分”入口处于选中状态

#### Scenario: 从首页进入通知列表

- **WHEN** 学生在首页点击消息入口
- **THEN** 页面进入 `/notifications`，主导航选中态保持不变

### Requirement: 我的页面

The profile page SHALL show the current student's name, student number, department, class, phone, email, current points and active plant count. It SHALL provide a logout action wired to the student-auth logout flow. The current points SHALL link to the points ledger at `/points`. It SHALL provide an entry to `/notifications` showing the unread count and an entry to `/feedback`. It SHALL allow the student to edit the phone number and class name, while name, student number and email remain read-only. Notifications, feedback and profile editing are provided by the student-account-center capability.

#### Scenario: 显示完整资料

- **WHEN** 学生进入 `/me`
- **THEN** 页面显示姓名、学号、院系、班级、手机号、邮箱、积分和在养绿植数

#### Scenario: 缺少可选资料

- **WHEN** 学生的手机号或班级为空
- **THEN** 页面用“未填写”占位，不显示空白行

#### Scenario: 姓名为空

- **WHEN** 已有学生账号的姓名为空
- **THEN** 页面用学号或邮箱作为可识别名称，不显示空白标题

#### Scenario: 退出登录

- **WHEN** 学生在“我的”页面点击退出登录并确认
- **THEN** 页面调用退出流程并回到 `/login`

#### Scenario: 从我的进入积分明细

- **WHEN** 学生点击“我的”页面中的当前积分
- **THEN** 页面进入 `/points`

#### Scenario: 从我的进入通知与反馈

- **WHEN** 学生点击“我的”页面中的通知或问题反馈入口
- **THEN** 页面分别进入 `/notifications` 或 `/feedback`

#### Scenario: 修改手机号成功

- **WHEN** 学生提交格式正确且未被其他账号使用的手机号
- **THEN** 页面显示修改后的手机号，资料保持最新

#### Scenario: 手机号已被使用

- **WHEN** 学生提交已被其他账号绑定的手机号
- **THEN** 页面显示「该手机号已关联其他账号」，原手机号保持不变

#### Scenario: 清空班级

- **WHEN** 学生清空班级并保存
- **THEN** 页面把班级显示为“未填写”，其余资料不变
