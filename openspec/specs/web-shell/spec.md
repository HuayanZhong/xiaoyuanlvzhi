# web-shell Specification

## Purpose

定义学生端桌面优先的页面壳、顶栏与底部导航、登录/注册布局和基础页面，使学生端从 320px 到桌面视口都保持可读、可操作且无横向滚动。

## Requirements

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

### Requirement: 底部导航

The bottom navigation SHALL be displayed only below `48rem`. It SHALL contain only modules that are implemented in the current build. The current build SHALL expose 首页, 绿植, 任务, 积分 and 我的; future modules SHALL add their entries when their pages exist. The current entry SHALL be highlighted visually and through `aria-current="page"`. At `48rem` and above the masthead SHALL expose the same entries as horizontal links.

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

- **WHEN** 通知、问题反馈或养护模块已有页面但不在主导航中
- **THEN** 导航不显示这些入口，不产生死链

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

### Requirement: 首页区块布局

首页 SHALL 依次展示六个区块：我的绿植、待处理事项、当前积分、环保任务、养护提醒、消息。桌面视口 SHALL 使用两列布局，窄屏 SHALL 使用单列布局；原有档案编号、建档日期和档案状态条 SHALL 保留在区块之后。

#### Scenario: 桌面查看首页

- **WHEN** 已登录学生在 768px 及以上视口访问 `/`
- **THEN** 页面按顺序显示六个区块，并以两列排列

#### Scenario: 窄屏查看首页

- **WHEN** 已登录学生在窄屏访问 `/`
- **THEN** 六个区块按顺序单列显示，不产生横向滚动

### Requirement: 首页待处理事项

首页 SHALL 汇总当前学生的待处理记录并显示各分类数量：待审核打卡来源为 `GET /api/v1/care/checkins` 中 `PENDING_REVIEW` 的记录；待重提领养、养护和任务分别来源为 `GET /api/v1/adoptions`、`GET /api/v1/care/checkins`、`GET /api/v1/tasks/participations` 中 `REJECTED` 的记录；待领取奖励来源为 `GET /api/v1/rewards/orders` 中 `WAITING_PICKUP` 的记录。数量为 0 的分类 SHALL 不显示。

#### Scenario: 显示待办分类

- **WHEN** 学生有 2 条待审核打卡、1 条被驳回的领养和 1 个待领取订单
- **THEN** 待处理事项显示「待审核打卡 2」「待重提 · 领养 1」「待领取奖励 1」，不显示其他为 0 的分类

#### Scenario: 进入待审核打卡

- **WHEN** 学生点击「待审核打卡」
- **THEN** 页面进入该分类最近一条打卡的 `/care/{id}`

#### Scenario: 进入待重提任务

- **WHEN** 学生点击「待重提 · 任务」
- **THEN** 页面进入该参与记录对应任务的 `/tasks/{taskId}`

#### Scenario: 进入待领取奖励

- **WHEN** 学生点击「待领取奖励」
- **THEN** 页面进入该分类最近一个订单的 `/rewards/orders/{id}`

#### Scenario: 没有待处理事项

- **WHEN** 五类记录的数量都为 0
- **THEN** 区块显示「暂无待处理事项」，不显示空白行或死链

### Requirement: 首页环保任务

首页 SHALL 从 `GET /api/v1/tasks` 中筛选可报名任务：状态为 `ONGOING`、当前学生未参与且名额未满。区块 SHALL 最多显示 3 个任务，每个显示标题、奖励积分和剩余名额，并进入 `/tasks/{id}`；没有可报名任务时 SHALL 显示空态和进入 `/tasks` 的入口。

#### Scenario: 显示可报名任务

- **WHEN** 学生有 4 个可报名任务
- **THEN** 区块按服务端顺序显示前 3 个任务及奖励积分、剩余名额

#### Scenario: 排除不可报名任务

- **WHEN** 任务已结束、学生已参与或名额已满
- **THEN** 该任务不出现在首页环保任务区块

#### Scenario: 没有可报名任务

- **WHEN** 当前没有满足条件的任务
- **THEN** 区块显示空态，并提供进入 `/tasks` 的入口

#### Scenario: 进入任务详情

- **WHEN** 学生点击一个可报名任务
- **THEN** 页面进入该任务的 `/tasks/{id}`

### Requirement: 首页养护提醒

首页 SHALL 从 `GET /api/v1/care/eligible-plants` 中筛选当前可以打卡的植株（`eligible` 为 `true`），最多显示 3 株。每株 SHALL 显示展示名称和摆放位置，并进入 `/my-plants/{plantId}`；没有到期植株时 SHALL 显示空态，不显示空白列表。

#### Scenario: 显示到期植株

- **WHEN** 学生有 2 株已达到养护间隔且没有待审核打卡的绿植
- **THEN** 养护提醒显示这 2 株的名称和位置

#### Scenario: 进入养护页面

- **WHEN** 学生点击一株到期绿植
- **THEN** 页面进入 `/my-plants/{plantId}`

#### Scenario: 没有到期植株

- **WHEN** 当前没有 `eligible` 为 `true` 的植株
- **THEN** 区块显示「暂无到期养护」，不显示空白行

### Requirement: 首页区块容错

首页的资料摘要、消息和首页概览 SHALL 独立取数。待处理事项、环保任务或养护提醒任一请求失败时，该区块 SHALL 显示可读原因和重试入口，其他区块 SHALL 保持可用；重试 SHALL 重新获取概览数据并恢复对应区块。

#### Scenario: 单个请求失败

- **WHEN** 待处理事项的其中一个请求因网络或 5xx 失败
- **THEN** 待处理事项显示可重试错误，我的绿植、当前积分、消息和其余可成功加载的区块仍显示数据

#### Scenario: 重试恢复

- **WHEN** 学生在区块错误提示中点击重试且请求恢复成功
- **THEN** 该区块显示最新数据，错误提示消失

#### Scenario: 环保任务与养护提醒失败

- **WHEN** 任务或可养护植株请求失败
- **THEN** 对应区块显示可读错误，待处理事项与其他区块不受影响

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

### Requirement: 响应式与安全区

The shell SHALL avoid horizontal scrolling at 320px, 375px, 768px and 1440px viewports. The bottom navigation SHALL respect the device safe-area inset on narrow viewports, content SHALL reserve space for the fixed navigation, and interactive controls SHALL have at least a 44px touch target. The desktop content SHALL be centered with a maximum width of `70rem`.

#### Scenario: 320px 视口

- **WHEN** 学生在 320px 宽视口查看首页或“我的”
- **THEN** 页面不产生横向滚动，文字、字段行和按钮不被裁切

#### Scenario: 底部安全区

- **WHEN** 页面在带底部安全区的移动设备上显示
- **THEN** 底部导航不遮挡系统手势区，内容不会被导航覆盖

#### Scenario: 触控目标

- **WHEN** 学生使用触摸操作按钮、导航项或主题切换
- **THEN** 可点击区域至少为 44px

### Requirement: 设计 token

The web SHALL define semantic CSS tokens for color, spacing, radius, typography, shadow and safe-area values. Components SHALL consume these tokens rather than raw hex or arbitrary pixel values; raw color values SHALL appear only in token definitions.

#### Scenario: 组件使用语义 token

- **WHEN** 页面或组件设置背景、文字、边框、间距或圆角
- **THEN** 它引用语义 token，不直接写十六进制色值

#### Scenario: 统一调整视觉

- **WHEN** 需要调整主色或圆角
- **THEN** 只修改 token 定义，页面组件不需要逐个改动

### Requirement: 可访问性

The shell and navigation SHALL be keyboard operable, SHALL provide visible focus styles, and SHALL expose the current navigation item through `aria-current`. The theme toggle SHALL expose its state through `aria-pressed` and an accessible label. Form errors and asynchronous failures SHALL be announced through an accessible live region or alert role.

#### Scenario: 键盘操作导航

- **WHEN** 学生使用 Tab 和 Enter 操作顶栏、底部导航或主题切换
- **THEN** 可以聚焦并完成操作，焦点样式可见；主题切换按钮报告 `aria-pressed`

#### Scenario: 错误可被辅助技术读取

- **WHEN** 首页加载失败或表单提交失败
- **THEN** 错误信息通过 `role="alert"` 或 `aria-live` 区域播报

#### Scenario: 认证表单语义

- **WHEN** 登录或注册表单渲染
- **THEN** 邮箱、密码、新密码和验证码输入使用合适的 `autocomplete`，错误字段带有 `aria-invalid` 与 `aria-describedby`

#### Scenario: 减少动态效果

- **WHEN** 用户启用“减少动态效果”偏好
- **THEN** 页面不使用非必要的动画或过渡

### Requirement: 未知路径

The web SHALL show a not-found page for unregistered paths. The page SHALL provide a link back to the home page when authenticated and to the login page when anonymous, and SHALL NOT render a blank screen.

#### Scenario: 已登录访问未知路径

- **WHEN** 已登录学生访问未注册路径
- **THEN** 页面显示 404 说明和返回首页的链接

#### Scenario: 未登录访问未知路径

- **WHEN** 未登录用户访问未注册路径
- **THEN** 页面显示 404 说明和前往登录的链接

### Requirement: 养护入口

`/me` SHALL provide an entry to `/my-plants`, `/` SHALL link its active plant count to `/my-plants`, and `/adoptions/{id}` SHALL provide an entry to the plant's care page while the application is in `ACTIVE`. None of these entries SHALL add a new item to the bottom navigation or the masthead navigation.

#### Scenario: 从我的进入

- **WHEN** 学生点击“我的”页面中的“我的绿植”入口
- **THEN** 页面进入 `/my-plants`，主导航选中态保持“我的”

#### Scenario: 从首页进入

- **WHEN** 学生在首页点击在养绿植数量
- **THEN** 页面进入 `/my-plants`

#### Scenario: 从养护中的申请进入

- **WHEN** 学生在申请详情中查看处于养护中的申请并点击“我的绿植”
- **THEN** 页面进入 `/my-plants`，并定位或列出对应植株

#### Scenario: 导航不新增入口

- **WHEN** 任意学生端页面渲染底部导航或横向导航
- **THEN** 导航项仍为首页、绿植、任务、积分、我的
