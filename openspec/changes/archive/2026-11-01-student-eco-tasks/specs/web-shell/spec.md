# Spec Delta

## MODIFIED Requirements

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
