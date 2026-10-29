# Proposal

## Why

管理端当前只有登录页和一个静态 dashboard 占位页：没有后台壳、没有导航落点，产品文档定义的 10 个业务模块无法从页面进入。本变更先建立管理端壳层和路由骨架，让后续业务模块有统一的导航入口和页面容器；工作台内容不在本次范围。

## What Changes

- 新增管理端后台壳：顶部一级导航（5 个分组）+ 左侧二级导航 + 内容区，桌面端与移动端导航行为明确。
- 新增导航配置与页面元信息推导：一份配置同时驱动顶部菜单、侧边菜单和当前选中态。
- 新增 10 个业务模块的占位路由与占位页，保证导航可点击、深链可验证。
- `/dashboard` 只落地路由与壳层，显示“工作台”标题，不实现待办、统计、队列或其他工作台内容。
- 不使用自定义颜色、字号或强制样式覆盖；壳层和占位页只使用 antd 组件及其公开配置。
- 移除自定义绿色 seed 和 amber accent，`ConfigProvider` 只保留 locale 与亮暗 algorithm，登录页和壳层统一使用 antd 默认主色。
- 同步产品文档的导航分组，注明分组不改变业务模块。
- 退出登录、主题切换和侧边栏折叠保持在壳层内。

本变更不涉及 BFF 接口、认证、持久化、共享包或环境变量变更；不修改 web、bff 或共享包。

## Capabilities

### New Capabilities

- `admin-shell`: 管理端后台壳、导航分组、响应式侧边栏、路由集成和占位页。

### Modified Capabilities

- `admin-login`: 将“Dashboard 工作台占位页”改为后台壳内的最小落地页；`/dashboard` 仍可直接访问，但不展示工作台业务内容。

## Impact

- 受影响应用：`apps/admin`。
- 新增依赖：`@ant-design/icons`，用于导航和壳层操作图标。
- 路由：`/dashboard` 及 10 个业务模块对应的 13 条路由纳入后台壳布局路由；登录页、`/` 和未知路径的重定向规则保持不变。
- 代码：`src/layouts/`、`src/components/layout/`、`src/config/navigation.ts`、`src/hooks/`、`src/pages/dashboard/`、`src/pages/placeholder/`、`src/router/index.tsx`、`src/stores/app.ts`、`src/App.tsx`、`src/components/ThemeTokenBridge.tsx`、`src/styles/global.css`、`src/components/auth/AuthBrandPanel.tsx`；删除 `src/config/theme.ts`。
- 测试：新增导航推导、后台壳、路由和占位页测试；更新现有 `App` 和 router 测试。
- 文档：`docs/product/admin.md` 的导航分组与路由表。
- 不涉及：BFF API、认证、数据库、持久化、共享包、环境变量、Turbo/Vitest 配置、工作台业务内容。
