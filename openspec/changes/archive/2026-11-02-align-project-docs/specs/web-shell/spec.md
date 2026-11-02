# Spec Delta

## MODIFIED Requirements

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
