# Design

## Context

见 `proposal.md - Why`。当前约束：

- `apps/admin` 使用 React 19、Vite 8、TypeScript 6、antd 6.6.8、Tailwind 4、React Router 8 和 Zustand 5。
- 路由只有 `/login` 和 `/dashboard`；`DashboardPage` 是静态占位页，没有后台壳和模块落点。
- `src/stores/app.ts` 已有 `sidebarCollapsed` 和持久化的 `themeMode`。
- BFF 只暴露 `GET /` 和 `GET /health`；本变更不请求 BFF。
- 本变更移除自定义绿色 seed 和 amber accent，统一使用 antd 默认主题；`ThemeTokenBridge` 只把 antd 默认 token 暴露为登录页使用的语义 CSS 变量。
- 不引入 `@ant-design/pro-components`；使用 antd 核心组件。

## Goals / Non-Goals

**Goals:**

- 建立登录后的统一后台壳：顶部一级导航、左侧二级导航、内容区、响应式抽屉。
- 用一份导航配置驱动顶部菜单、侧边菜单和选中态。
- 为 10 个业务模块建立可访问路由和占位页。
- `/dashboard` 只显示“工作台”标题，不实现工作台业务内容。
- 补齐导航推导、壳层、路由和占位页的测试。

**Non-Goals:**

- 不实现待办、统计、队列、工作台 mock 数据或任何工作台业务内容。
- 不接入认证、会话、路由守卫或领域 API。
- 不新增自定义颜色、字号、CSS 变量或强制样式覆盖。
- 不实现各业务模块的列表、详情和表单。
- 不新增自定义颜色、字号或阴影，不写颜色覆盖；壳层只使用 antd 组件的公开配置。

## Decisions

### 1. 使用 antd 核心 Layout

使用 `Layout`、`Layout.Header`、`Layout.Sider`、`Layout.Content`、`Menu`、`Breadcrumb`（按需）、`Drawer`、`Typography`、`Empty`、`Button`、`Flex`、`Space`。

理由：项目已安装 antd 6；ProComponents 稳定版不支持 antd 6，3.x 仍是 beta；用户明确要求只用组件库组件。

### 2. 壳层结构与导航分组

```text
Layout
├─ Header（antd 默认深色）
│  ├─ 折叠/抽屉按钮
│  ├─ 一级 Menu（运营 / 资源 / 积分 / 用户 / 数据）
│  └─ HeaderActions（主题、头像菜单）
└─ Layout
   ├─ Sider（theme="light"，208px；折叠 64px）
   │  └─ 当前分组的二级 Menu
   └─ Content
      └─ Outlet
```

一级分组：

| 一级 | 二级           | 路由                |
| ---- | -------------- | ------------------- |
| 运营 | 工作台         | `/dashboard`        |
| 运营 | 领养管理       | `/adoptions`        |
| 运营 | 养护审核       | `/care-reviews`     |
| 运营 | 环保任务       | `/tasks`            |
| 运营 | 问题反馈       | `/feedback`         |
| 资源 | 品种档案       | `/plants/species`   |
| 资源 | 单株库存       | `/plants/instances` |
| 积分 | 积分规则与流水 | `/points/rules`     |
| 积分 | 奖励商品       | `/points/rewards`   |
| 积分 | 兑换订单       | `/points/orders`    |
| 用户 | 学生管理       | `/students`         |
| 用户 | 资讯管理       | `/articles`         |
| 数据 | 数据统计       | `/statistics`       |

10 个一级模块直接放顶部会溢出，因此顶部只放 5 个分组，左侧显示当前分组子项。

响应式：

- `>=992px`：Header 5 组 + Sider 208px；折叠后 64px。
- `<992px`：隐藏 Header 一级菜单和 Sider，Header 菜单按钮打开 Drawer。

### 3. 导航配置是唯一数据源

新增 `src/config/navigation.ts`，定义 `NavGroup` / `NavItem`、5 个分组、13 个菜单项、路径和图标；导出 `findGroupByPath`、`findItemByPath`、`getBreadcrumb`。

`src/hooks/usePageMeta.ts` 基于 `useLocation()` 返回当前 group、item 和 breadcrumb。`AdminShell` 用它决定 Header/Sider 选中态；占位页用它显示模块名称。

### 4. 路由结构

```text
/login                   LoginPage（不渲染后台壳）
/                        -> /login
/dashboard               AdminShell + DashboardPage（只显示“工作台”标题）
/adoptions               AdminShell + PlaceholderPage
/care-reviews            AdminShell + PlaceholderPage
/tasks                   AdminShell + PlaceholderPage
/feedback                AdminShell + PlaceholderPage
/plants/species          AdminShell + PlaceholderPage
/plants/instances        AdminShell + PlaceholderPage
/points/rules            AdminShell + PlaceholderPage
/points/rewards          AdminShell + PlaceholderPage
/points/orders           AdminShell + PlaceholderPage
/students                AdminShell + PlaceholderPage
/articles                AdminShell + PlaceholderPage
/statistics              AdminShell + PlaceholderPage
*                        -> /login
```

`AdminShell` 作为布局路由渲染 `<Outlet />`；`/login` 保持独立。占位页只显示模块标题和“建设中”空状态。

### 5. 状态管理

- `useAppStore.sidebarCollapsed` 接入桌面端 Sider；不持久化，刷新后恢复展开。
- `useAppStore.themeMode` 继续持久化；Header 的主题按钮切换 antd algorithm。
- 移动端 Drawer 开关用 `AdminShell` 本地 state。
- 当前一级/二级菜单完全由 `useLocation()` 推导。

### 6. 样式策略：只用组件公开配置

- 新壳层不写颜色、字号或阴影 `style`，不新增 CSS 变量、不新增全局 token。
- 允许纯布局 `style`：内容区 `padding: 24`、页面卡铺满内容区、卡片 body 的 `display: flex`/`minHeight`，以及空状态垂直居中。这些只影响尺寸和位置，不改变 antd 颜色。
- 布局使用 antd 组件的公开属性：`Layout`、`Sider` 的 `width/collapsed/collapsedWidth/theme`、`Menu` 的 `mode/theme/items/selectedKeys`、`Flex` 的 `align/justify/gap/flex`、`Space` 的 `size`、`Drawer` 的 `width/placement`、`Button` 的 `type/shape/size/ghost`。
- 不使用 Tailwind 类覆盖 antd 组件的视觉样式。
- 删除 `src/config/theme.ts` 的绿色 seed 和 amber accent；`App.tsx` 的 `ConfigProvider` 只保留 `locale` 和亮暗 `algorithm`；`ThemeTokenBridge` 不再写 `--app-color-accent`；`global.css` 移除 `--color-accent` 别名；`AuthBrandPanel` 的强调线改用 `bg-primary`。
- 页面使用 antd `Card` 作为内容容器，利用 `Card` 默认内边距；卡片高度、最大宽度和空状态位置通过布局 style 调整。
- Header 使用 antd `Layout.Header` 默认深色；Sider 使用 `theme="light"`；页面使用 antd 默认背景和文字颜色。

### 7. 图标依赖

新增 `@ant-design/icons`，用于菜单项、折叠/抽屉按钮、主题和退出登录。使用命名导入，便于 tree-shaking。

### 8. 测试策略

- `tests/unit/config/navigation.test.ts`：分组查找、菜单项查找、面包屑、未知路径。
- `tests/unit/hooks/usePageMeta.test.tsx`：`/dashboard`、`/plants/instances`、`/tasks?tab=proofs`、未知路径。
- `tests/unit/layouts/AdminShell.test.tsx`：5 个分组、当前分组子项、深链选中、点击切换、折叠、移动端 Drawer、主题与退出登录。
- `tests/unit/components/layout/MobileNavDrawer.test.tsx`：分组渲染和点击关闭。
- `tests/unit/pages/placeholder/PlaceholderPage.test.tsx`：模块标题和空状态。
- `tests/unit/router.test.tsx`：登录页不渲染壳、`/dashboard` 渲染壳和“工作台”标题、模块路由渲染壳、未知路径重定向。
- 更新 `tests/unit/App.test.tsx` 保持根路径重定向登录页。
- jsdom 缺少的 `matchMedia`、`ResizeObserver` 只在 `tests/setup.ts` 补充 mock。

### 9. 工作区影响

- 只修改 `apps/admin`；不修改 `web`、`bff` 或共享包。
- 不新增环境变量；`src/lib/http.ts` 不变。
- `apps/admin/tsconfig.json` 已包含 `src`、`tests` 和 `vite.config.ts`，无需修改。
- Vitest `include`、覆盖率 include 和 Turbo 输入无需变化。
- Oxc 仍是唯一 lint/format 工具链。
- 新增依赖 `@ant-design/icons` 6.3.4，更新 lockfile。

### 10. 视觉收尾

- `BrandMark` 改为纯文字字标：产品名加“管理后台”，移除叶形 SVG；`compact` 模式只显示产品名。登录页复用同一组件。
- 顶栏折叠、主题、账号按钮统一为 `type="dashed"` 的 32px 图标按钮。`HeaderButton` 内部用局部 `darkAlgorithm`，因为 Header 固定深色；暗色算法只包按钮，避免 `Dropdown` 门户跟随局部主题。
- 占位页卡片去掉 `maxWidth: 1600` 和水平居中，在 `Content padding: 24` 下四边留白均为 24px。
- 账号按钮改用 `UserOutlined`，不再把 `Avatar` 嵌入 `Button`。

## Data Flow

```text
Browser
  |
  +-- /login ----------> LoginPage（独立布局，不渲染 AdminShell）
  |
  +-- /dashboard ------> AdminShell + DashboardPage（标题 only）
  |
  +-- /adoptions 等 ---> AdminShell + PlaceholderPage
  |
  +-- / ---------------> redirect /login
  +-- * ---------------> redirect /login

BFF：不调用
web：不涉及
共享包：不涉及
环境变量：无新增
```

## Risks / Trade-offs

- **顶部 5 组与产品文档原导航不同** → 同步更新 `docs/product/admin.md`；分组只影响壳层，不改变业务模块。
- **992–1199px 顶部菜单可能溢出** → Menu 使用默认 `overflowedIndicator`；实机检查 992/1024/1280。
- **没有认证守卫** → 静态阶段的刻意边界；`/dashboard` 可直接访问。
- **导航配置与路由重复** → 路由只负责 path → component，菜单文案全部来自 `navigation.ts`；测试覆盖未知路径回退。
- **`@ant-design/icons` 增加产物体积** → 命名导入；构建后检查体积警告。
- **antd 默认 Header/Sider 的视觉与截图不同** → 壳层使用组件默认视觉；本次只调整留白、品牌字标和按钮形态，不引入品牌色。
- **登录页从绿色变为 antd 默认主色** → 这是本次“纯默认颜色”要求的一部分；登录页结构、文案和交互不变，只移除自定义 seed 和 accent。

## Migration Plan

没有数据或后端迁移。`/dashboard` URL 保持不变；新增模块路由是增量。回滚时还原 `apps/admin/src`、测试和产品文档，移除 `@ant-design/icons` 依赖即可。不涉及 BFF、环境文件或共享包。
