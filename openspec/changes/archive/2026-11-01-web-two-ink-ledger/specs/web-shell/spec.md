# Spec Delta

## MODIFIED Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a masthead, content area and, on narrow viewports only, bottom navigation. At `48rem` and above the shell SHALL show a paper masthead with the wordmark, horizontal navigation and theme toggle; below `48rem` it SHALL show a compact masthead with the wordmark and theme toggle. The content area SHALL be at most `70rem` wide. `/` SHALL render the home page and `/me` SHALL render the profile page. `/login` and `/register` SHALL use an auth layout without bottom navigation.

#### Scenario: 进入首页

- **WHEN** 已登录学生访问 `/`
- **THEN** 页面显示字标、主题切换、首页内容和页面头部；窄屏同时显示底部导航，桌面显示横向导航

#### Scenario: 进入我的

- **WHEN** 已登录学生访问 `/me`
- **THEN** 页面显示页面头部、资料内容和主题切换；窄屏同时显示底部导航

#### Scenario: 登录页不显示底部导航

- **WHEN** 学生访问 `/login` 或 `/register`
- **THEN** 页面使用认证布局，不显示学生端底部导航

### Requirement: 底部导航

The bottom navigation SHALL be displayed only below `48rem`. It SHALL contain only modules that are implemented in the current build. This change SHALL expose 首页 and 我的; future modules SHALL add their entries when their pages exist. The current entry SHALL be highlighted visually and through `aria-current="page"`. At `48rem` and above the masthead SHALL expose the same entries as horizontal links.

#### Scenario: 当前入口高亮

- **WHEN** 学生在窄屏位于 `/`
- **THEN** 底部“首页”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 切换页面

- **WHEN** 学生点击“我的”
- **THEN** 页面导航到 `/me`，选中态同步更新

#### Scenario: 不显示未实现模块

- **WHEN** 绿植、任务或积分模块尚未实现
- **THEN** 导航不显示这些入口，不产生死链

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
