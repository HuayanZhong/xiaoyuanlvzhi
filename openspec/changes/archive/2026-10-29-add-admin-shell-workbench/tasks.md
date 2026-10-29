# Tasks

## 1. 依赖与基础准备

- [x] 1.1 在 `apps/admin/package.json` 的 `dependencies` 添加 `@ant-design/icons` 6.3.4，运行根目录 `pnpm install`，验证 `pnpm --filter admin exec node -e "require.resolve('@ant-design/icons/package.json')"` 成功且 `pnpm-lock.yaml` 已更新。
- [x] 1.2 在 `apps/admin/tests/setup.ts` 补充 jsdom 缺少的 `ResizeObserver` mock（antd Menu/Sider 需要），验证相关测试不再报 `ResizeObserver is not defined`。
- [x] 1.3 删除 `src/config/theme.ts` 的绿色 seed 和 accent；`App.tsx` 的 `ConfigProvider` 只保留 locale/algorithm；`ThemeTokenBridge` 移除 accent；`global.css` 移除 `--color-accent`；`AuthBrandPanel` 改用 `bg-primary`；更新 `ThemeTokenBridge.test`。验证默认 antd 主色生效且测试通过。

## 2. 导航配置与页面元信息

- [x] 2.1 新增 `src/config/navigation.ts`，定义运营/资源/积分/用户/数据 5 个一级分组和 13 个菜单项，包含路径与图标。验证 `tests/unit/config/navigation.test.ts` 覆盖分组查找、菜单项查找、面包屑生成和未知路径回退。
- [x] 2.2 新增 `src/hooks/usePageMeta.ts`，基于 `useLocation` 返回当前 group、item 和 breadcrumb。验证测试覆盖 `/dashboard`、`/plants/instances`、`/tasks?tab=proofs` 和未知路径。
- [x] 2.3 新增 `src/hooks/useIsMobile.ts`，以 992px 为断点返回移动端状态。验证 `AdminShell` 测试覆盖桌面端和移动端分支。
- [x] 2.4 运行 `pnpm --filter admin check-types` 和 `pnpm --filter admin lint`，验证导航配置和 hooks 无类型或规范错误。

## 3. 后台壳与路由

- [x] 3.1 新增 `src/layouts/AdminShell.tsx`，只使用 antd `Layout/Header/Sider/Content/Flex/Button` 组件及其公开属性，不写颜色、字号或 `className` 覆盖。验证 `tests/unit/layouts/AdminShell.test.tsx` 覆盖五个一级分组和当前分组子项。
- [x] 3.2 新增 `src/components/layout/HeaderNav.tsx` 和 `SideNav.tsx`，只使用 antd `Menu` 的 `items/mode/theme/selectedKeys` 配置。验证测试覆盖分组切换和深链选中。
- [x] 3.3 新增 `src/components/layout/HeaderActions.tsx`，使用 antd `Button/Dropdown/Avatar` 和 `@ant-design/icons`，不写颜色覆盖。验证测试覆盖主题切换和“退出登录”导航到 `/login`。
- [x] 3.4 新增 `src/components/layout/MobileNavDrawer.tsx`，使用 antd `Drawer/Menu` 默认配置。验证测试覆盖分组渲染和菜单点击后关闭。
- [x] 3.5 实现桌面端 Sider 折叠（复用 `sidebarCollapsed`）和 `<992px` Drawer 导航。验证测试覆盖折叠按钮和移动端抽屉。
- [x] 3.6 改造 `src/router/index.tsx`：`AdminShell` 作为布局路由，注册 `/dashboard` 和 10 个业务模块对应的 13 条路由；`/login` 独立，`/` 和 `*` 仍重定向 `/login`。验证 `tests/unit/router.test.tsx` 覆盖登录页不渲染壳、模块路由渲染壳、未知路径重定向。
- [x] 3.7 更新 `docs/product/admin.md` 的导航章节为 5 个一级分组和 13 条路由，并注明分组不改变业务模块。

## 4. 最小工作台与占位页

- [x] 4.1 将 `src/pages/dashboard/DashboardPage.tsx` 复用 `PlaceholderPage`，显示“工作台”标题和占位空状态，不显示待办、统计、队列或其他业务内容。验证 router 测试断言“工作台”标题存在。
- [x] 4.2 将 `src/pages/placeholder/PlaceholderPage.tsx` 收敛为 antd `Card + Breadcrumb + Typography.Title + Empty`，显示模块名称和“建设中”。验证 `tests/unit/pages/placeholder/PlaceholderPage.test.tsx` 通过。
- [x] 4.3 移除本变更中不再使用的 `PageHeader`、`dashboard.types` 和旧 dashboard 占位测试，确认 `rg "PageHeader|dashboard.types" apps/admin` 无引用。
- [x] 4.4 更新 `tests/unit/App.test.tsx`、`tests/unit/router.test.tsx` 和 `tests/unit/layouts/AdminShell.test.tsx`，使断言匹配新的最小壳层和 `/dashboard` 标题。

## 5. 样式清理与集成验证

- [x] 5.1 审查 `apps/admin/src/layouts`、`apps/admin/src/components/layout`、`apps/admin/src/pages` 和 `apps/admin/src/config/navigation.ts`，确认没有新增颜色/字号/hex/`var(--app-color-*)`；允许 `Content padding`、`Card body flex/minHeight` 等纯布局 style。`rg` 检查颜色/hex 无命中，仅既有登录页保留 `className`。
- [x] 5.2 审查主题清理范围：`src/config/theme.ts` 已删除，`App.tsx` 不含自定义 seed，`ThemeTokenBridge` 不再写 accent，`global.css` 不含 `--color-accent`，登录页仍可渲染；`rg "adminTheme|adminAccent|#1f7a4d|#b7791f|--color-accent" apps/admin/src` 无残留。
- [x] 5.3 运行 `pnpm --filter admin exec vitest run tests/unit/config/navigation.test.ts tests/unit/hooks/usePageMeta.test.tsx tests/unit/layouts/AdminShell.test.tsx tests/unit/components/layout/MobileNavDrawer.test.tsx tests/unit/pages/placeholder/PlaceholderPage.test.tsx tests/unit/router.test.tsx tests/unit/App.test.tsx`，验证全部通过；全量 `pnpm --filter admin test` 为 12 个文件、37 个测试通过。
- [x] 5.4 运行 `pnpm --filter admin lint`、`pnpm --filter admin check-types`、`pnpm --filter admin test`、`pnpm --filter admin build`，验证全部通过。
- [x] 5.5 在 320/768/992/1200/1440 宽度检查默认 antd 布局：`document.documentElement.scrollWidth` 与 `innerWidth` 相等，无横向滚动；<992px 为移动端（无顶部菜单、无 Sider），>=992px 显示 5 个顶部菜单项和 1 个 Sider。
- [x] 5.6 检查 Vite 构建产物体积警告；`@ant-design/icons` 使用命名导入，构建产物 900.45 kB（gzip 290.00 kB），大于 500 kB 的警告为既有情况，未再引入额外按需改造。
- [x] 5.7 布局收尾：内容区 `padding: 24`；页面卡铺满内容区、body `flex`/`minHeight`，空状态在剩余高度内垂直居中。验证 992/1440/2560 下无横向滚动，四边留白一致。

## 6. 视觉收尾

- [x] 6.1 `BrandMark` 改为纯文字字标，移除叶形 SVG；非 compact 显示产品名加“管理后台”，compact 只显示产品名。新增 `tests/unit/components/BrandMark.test.tsx`。
- [x] 6.2 新增 `src/components/layout/HeaderButton.tsx`，用局部 `darkAlgorithm` 包裹 `Button type="dashed"`；折叠、主题、账号按钮统一为 32px 虚线图标按钮，账号按钮改用 `UserOutlined`。更新 `AdminShell.test.tsx` 断言虚线按钮。
- [x] 6.3 占位页卡片移除 `maxWidth: 1600` 和水平居中，铺满内容区；2560 宽下实测四边留白均为 24px。更新 `PlaceholderPage.test.tsx`。
- [x] 6.4 运行 `pnpm --filter admin check-types`、`lint`、`test`、`build`，全部通过；亮色/暗色截图确认顶栏按钮可见。
