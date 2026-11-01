# Spec Delta

## MODIFIED Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a masthead, content area and, on narrow viewports only, bottom navigation. At `48rem` and above the shell SHALL show a paper masthead with the wordmark, horizontal navigation and theme toggle; below `48rem` it SHALL show a compact masthead with the wordmark and theme toggle. The content area SHALL be at most `70rem` wide. `/` SHALL render the home page, `/me` SHALL render the profile page, `/plants` and `/plants/{id}` SHALL render the plant catalog and species detail, `/adoptions` and `/adoptions/{id}` SHALL render the application list and detail, `/tasks` and `/tasks/{id}` SHALL render the eco task list and task detail, `/points` SHALL render the points ledger, `/rewards` SHALL render the rewards shop, `/rewards/orders` and `/rewards/orders/{id}` SHALL render the redemption order list and order detail, `/my-plants` and `/my-plants/{plantId}` SHALL render the active plant list and the care page for one plant, and `/care/{id}` SHALL render a check-in detail. `/login` and `/register` SHALL use an auth layout without bottom navigation. Unauthenticated access to any student business route SHALL redirect to `/login` and return to the original path after login.

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

#### Scenario: 进入养护页面

- **WHEN** 已登录学生访问 `/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回我的绿植或打卡列表

#### Scenario: 未登录访问业务页面

- **WHEN** 未登录用户访问 `/plants`、某个品种详情、`/adoptions`、某个申请详情、`/tasks`、某个任务详情、`/points`、`/rewards`、`/rewards/orders`、某个订单详情、`/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面先进入 `/login`，登录后回到原路径

### Requirement: 底部导航

The bottom navigation SHALL be displayed only below `48rem`. It SHALL contain only modules that are implemented in the current build. This change SHALL expose 首页, 绿植, 任务, 积分 and 我的; future modules SHALL add their entries when their pages exist. The current entry SHALL be highlighted visually and through `aria-current="page"`. At `48rem` and above the masthead SHALL expose the same entries as horizontal links.

#### Scenario: 当前入口高亮

- **WHEN** 学生在窄屏位于 `/`
- **THEN** 底部“首页”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 切换页面

- **WHEN** 学生点击“我的”
- **THEN** 页面导航到 `/me`，选中态同步更新

#### Scenario: 绿植入口

- **WHEN** 学生进入 `/plants` 或某个品种详情
- **THEN** 桌面横向导航和窄屏底部导航中的“绿植”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 任务入口

- **WHEN** 学生进入 `/tasks` 或某个任务详情
- **THEN** 桌面横向导航和窄屏底部导航中的“任务”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 积分入口

- **WHEN** 学生进入 `/points`、`/rewards`、`/rewards/orders` 或某个订单详情
- **THEN** 桌面横向导航和窄屏底部导航中的“积分”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 不显示未实现模块

- **WHEN** 通知或问题反馈模块尚未实现
- **THEN** 导航不显示这些入口，不产生死链

### Requirement: 首页摘要

The home page SHALL show the current student's display name, current points balance and active plant count. It SHALL show a loading state while fetching, a retryable error on failure, and a clear zero-value presentation when the student has no active plants. The points balance SHALL link to the points ledger at `/points`.

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

### Requirement: 我的页面

The profile page SHALL show the current student's name, student number, department, class, phone, email, current points and active plant count. It SHALL provide a logout action wired to the student-auth logout flow. The current points SHALL link to the points ledger at `/points`. Profile editing, notifications and feedback SHALL remain out of scope for this change.

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
