# web-shell Specification

## Purpose

定义学生端登录后的移动优先页面壳、底部导航、登录/注册布局和基础页面，使学生端在 320px 起的视口内保持可读、可操作且无横向滚动。

## Requirements

### Requirement: 学生端页面壳

Authenticated pages SHALL render a shared shell with a page header, content area and bottom navigation. `/` SHALL render the home page and `/me` SHALL render the profile page. `/login` and `/register` SHALL use an auth layout without bottom navigation.

#### Scenario: 进入首页

- **WHEN** 已登录学生访问 `/`
- **THEN** 页面显示页面头部、首页内容和底部导航

#### Scenario: 进入我的

- **WHEN** 已登录学生访问 `/me`
- **THEN** 页面显示页面头部、资料内容和底部导航

#### Scenario: 登录页不显示底部导航

- **WHEN** 学生访问 `/login` 或 `/register`
- **THEN** 页面使用认证布局，不显示学生端底部导航

### Requirement: 底部导航

The bottom navigation SHALL contain only modules that are implemented in the current build. This change SHALL expose 首页 and 我的; future modules SHALL add their entries when their pages exist. The current entry SHALL be highlighted visually and through `aria-current="page"`.

#### Scenario: 当前入口高亮

- **WHEN** 学生位于 `/`
- **THEN** “首页”入口处于选中状态，并带有 `aria-current="page"`

#### Scenario: 切换页面

- **WHEN** 学生点击“我的”
- **THEN** 页面导航到 `/me`，选中态同步更新

#### Scenario: 不显示未实现模块

- **WHEN** 绿植、任务或积分模块尚未实现
- **THEN** 底部导航不显示这些入口，不产生死链

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

The shell SHALL avoid horizontal scrolling at 320px, 375px and 768px viewports. The bottom navigation SHALL respect the device safe-area inset, content SHALL reserve space for the fixed navigation, and interactive controls SHALL have at least a 44px touch target.

#### Scenario: 320px 视口

- **WHEN** 学生在 320px 宽视口查看首页或“我的”
- **THEN** 页面不产生横向滚动，文字和按钮不被裁切

#### Scenario: 底部安全区

- **WHEN** 页面在带底部安全区的移动设备上显示
- **THEN** 底部导航不遮挡系统手势区，内容不会被导航覆盖

#### Scenario: 触控目标

- **WHEN** 学生使用触摸操作按钮或导航项
- **THEN** 可点击区域至少为 44px，不依赖细小图标命中

### Requirement: 设计 token

The web SHALL define semantic CSS tokens for color, spacing, radius, typography, shadow and safe-area values. Components SHALL consume these tokens rather than raw hex or arbitrary pixel values; raw color values SHALL appear only in token definitions.

#### Scenario: 组件使用语义 token

- **WHEN** 页面或组件设置背景、文字、边框、间距或圆角
- **THEN** 它引用语义 token，不直接写十六进制色值

#### Scenario: 统一调整视觉

- **WHEN** 需要调整主色或圆角
- **THEN** 只修改 token 定义，页面组件不需要逐个改动

### Requirement: 可访问性

The shell and navigation SHALL be keyboard operable, SHALL provide visible focus styles, and SHALL expose the current navigation item through `aria-current`. Form errors and asynchronous failures SHALL be announced through an accessible live region or alert role.

#### Scenario: 键盘操作导航

- **WHEN** 学生使用 Tab 和 Enter 操作底部导航
- **THEN** 可以聚焦导航项并完成页面跳转，焦点样式可见

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
