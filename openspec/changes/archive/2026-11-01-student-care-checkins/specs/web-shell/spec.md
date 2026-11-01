# Spec Delta

## MODIFIED Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a masthead, content area and, on narrow viewports only, bottom navigation. At `48rem` and above the shell SHALL show a paper masthead with the wordmark, horizontal navigation and theme toggle; below `48rem` it SHALL show a compact masthead with the wordmark and theme toggle. The content area SHALL be at most `70rem` wide. `/` SHALL render the home page, `/me` SHALL render the profile page, `/plants` and `/plants/{id}` SHALL render the plant catalog and species detail, `/adoptions` and `/adoptions/{id}` SHALL render the application list and detail, `/my-plants` and `/my-plants/{plantId}` SHALL render the active plant list and the care page for one plant, and `/care/{id}` SHALL render a check-in detail. `/login` and `/register` SHALL use an auth layout without bottom navigation. Unauthenticated access to any student business route SHALL redirect to `/login` and return to the original path after login.

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

#### Scenario: 进入养护页面

- **WHEN** 已登录学生访问 `/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面使用同一套页面壳，显示字标、导航和主题切换，并能返回我的绿植或打卡列表

#### Scenario: 未登录访问业务页面

- **WHEN** 未登录用户访问 `/plants`、某个品种详情、`/adoptions`、某个申请详情、`/my-plants`、某个植株养护页或某个打卡详情
- **THEN** 页面先进入 `/login`，登录后回到原路径

## ADDED Requirements

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
