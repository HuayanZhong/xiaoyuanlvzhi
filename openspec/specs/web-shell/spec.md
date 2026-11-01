# web-shell Specification

## Purpose

定义学生端桌面优先的页面壳、顶栏与底部导航、登录/注册布局和基础页面，使学生端从 320px 到桌面视口都保持可读、可操作且无横向滚动。

## Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a masthead, content area and, on narrow viewports only, bottom navigation. At `48rem` and above the shell SHALL show a paper masthead with the wordmark, horizontal navigation and theme toggle; below `48rem` it SHALL show a compact masthead with the wordmark and theme toggle. The content area SHALL be at most `70rem` wide. `/` SHALL render the home page, `/me` SHALL render the profile page, `/plants` and `/plants/{id}` SHALL render the plant catalog and species detail, `/adoptions` and `/adoptions/{id}` SHALL render the application list and detail, `/tasks` and `/tasks/{id}` SHALL render the eco task list and task detail, `/my-plants` and `/my-plants/{plantId}` SHALL render the active plant list and the care page for one plant, and `/care/{id}` SHALL render a check-in detail. `/login` and `/register` SHALL use an auth layout without bottom navigation. Unauthenticated access to any student business route SHALL redirect to `/login` and return to the original path after login.

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

#### Scenario: 进入养护页面

- **WHEN** 已登录学生访问 `/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回我的绿植或打卡列表

#### Scenario: 未登录访问业务页面

- **WHEN** 未登录用户访问 `/plants`、某个品种详情、`/adoptions`、某个申请详情、`/tasks`、某个任务详情、`/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面先进入 `/login`，登录后回到原路径

### Requirement: 底部导航

The bottom navigation SHALL be displayed only below `48rem`. It SHALL contain only modules that are implemented in the current build. This change SHALL expose 首页, 绿植, 任务 and 我的; future modules SHALL add their entries when their pages exist. The current entry SHALL be highlighted visually and through `aria-current="page"`. At `48rem` and above the masthead SHALL expose the same entries as horizontal links.

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

#### Scenario: 不显示未实现模块

- **WHEN** 积分、兑换或通知模块尚未实现
- **THEN** 导航不显示这些入口，不产生死链

### Requirement: 首页摘要

The home page SHALL show the current student's display name, current points balance and active plant count. It SHALL show a loading state while fetching, a retryable error on failure, and a clear zero-value presentation when the student has no active plants.

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

### Requirement: 我的页面

The profile page SHALL show the current student's name, student number, department, class, phone, email, current points and active plant count. It SHALL provide a logout action wired to the student-auth logout flow. Profile editing, notifications and feedback SHALL remain out of scope for this change.

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
- **THEN** 导航项仍为首页、绿植、我的
