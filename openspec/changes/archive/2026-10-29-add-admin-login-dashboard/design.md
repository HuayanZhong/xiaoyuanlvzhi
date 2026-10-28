# Design

## Context

admin 当前是 React 19 + Vite 8 单页应用：`src/main.tsx` 渲染 `src/App.tsx`，`src/App.tsx` 只挂载 `RouterProvider`，`src/router/index.tsx` 只有一条 `/` 到 `HomePage` 的路由。项目已安装 antd 6、Tailwind 4、React Router 8 和 Zustand 5；`src/stores/app.ts` 只有 `sidebarCollapsed` 骨架，尚未接入 UI。

BFF 只提供 `GET /` 和 `GET /health`，admin 的 `/api` 代理已配置但还没有领域接口调用。环境变量只从现有根目录 env 文件读取，本变更不新增配置键。`docs/product-plan.md` 把管理端首屏定义为“工作台”：优先展示待审核事项和关键统计卡片，避免只有数字而无法继续处理。本设计按这个方向收敛 dashboard 占位，但本轮不接真实待办数据。动机和范围见 `proposal.md`，行为契约见 `specs/admin-login/spec.md`。

## Goals / Non-Goals

**Goals:**

- 建立 `/login` 到 `/dashboard` 的静态可演示流程。
- 用左右分屏的 B 端布局承载登录表单，并在窄屏保持可用。
- 让 admin 的 antd 主题、中文 locale 和页面文案保持一致。
- 提供右上角亮/暗主题切换，并在刷新后恢复选择。
- 宽屏使用全宽分栏，右侧登录抽屉贴住视口边缘，避免额外留白。
- 为后续真实认证、路由守卫和 dashboard 业务预留清晰的路由与页面边界。

**Non-Goals:**

- 不实现真实认证、会话、token、凭据持久化或路由守卫。
- 不修改 BFF，不新增 `/auth/login` 或其他 API。
- 不新增完整后台壳、侧边栏、菜单或业务数据请求。
- 不新增运行时依赖、图标库或共享工作区包。
- 不修改 web、共享包、环境配置、tsconfig、Vitest 配置、覆盖率 include 或 Turbo 输入。

## Decisions

### 1. 路由结构：登录作为静态入口

采用：

```text
/login      -> LoginPage
/dashboard  -> DashboardPage
/           -> redirect /login
*           -> redirect /login
```

静态阶段 `/` 直接进登录页，打开 `localhost:3000` 即可看到本轮成果。等接入真实认证后，把 `/` 改为按会话分流，并给 `/dashboard` 加守卫。

备选方案是 `/` 直接进 dashboard、登录页只通过 `/login` 访问；这与“登录页后面是 dashboard”的演示流程不一致，因此不采用。

### 2. 保留 data router，并导出 routes 供测试

继续使用 `createBrowserRouter` 和 `RouterProvider`，但把路由配置拆成可导出的 `routes` 数组：

```tsx
export const routes: RouteObject[] = [...];
export const router = createBrowserRouter(routes);
```

测试用 `createMemoryRouter(routes, { initialEntries: [...] })`，避免在 jsdom 中依赖真实浏览器历史。备选方案是改回声明式 `BrowserRouter` + `Routes`，但会丢失后续 loader/guard 的扩展点。

### 3. 登录页采用左右分屏

桌面端使用 `lg:grid-cols-[minmax(0,1fr)_var(--auth-drawer-width)]` 铺满视口：左侧工作区随窗口伸展，右侧白色登录抽屉贴住视口右边。抽屉宽度用 `clamp(26.25rem, 33.333vw, 56rem)`，1024–1279 固定为 400px，宽屏下左右约 2:1（2560 下右侧约 853px）；表单最大 448px 居中，抽屉左右各留 40px 内边距。左侧用大字号“管理端”作为主视觉；系统模块不再放在右侧半空的纵栏，而是作为横向索引栏排在标题下方，1280 起四项等分并带细分隔线。右侧抽屉只放登录表单。窄屏隐藏左侧工作区，改用顶部品牌栏，表单收成细边框卡片，320px 视口不产生横向滚动。

整体视觉按 B 端后台收敛：细圆角（`--radius-control` / `--radius-surface`）、1px 边框、无渐变、无模糊装饰、无卡片阴影。页面背景使用 `canvas` / `surface` / `ink` / `line` 这些语义类，它们的颜色值不单独定义，而是由 `ThemeTokenBridge` 从 antd token 派生（`colorBgLayout` / `colorBgContainer` / `colorText` / `colorBorderSecondary` 等），`Tailwind` 只做 `@theme inline` 别名。组件颜色同样交给 antd 算法，`src/config/theme.ts` 只保留绿色品牌 seed 和一个强调色。组件只使用语义 token 类，不写 hex 或任意 px。

备选方案是居中卡片和全屏深色卡片；用户已选择左右分屏，因为它更像 B 端管理产品，同时能承载品牌信息。

品牌标识放在 `src/components/BrandMark.tsx`，使用内联 SVG，不直接引入 `@ant-design/icons`，因为 admin 没有该包的直接依赖。

页面文件按业务域放在 `src/pages/auth/LoginPage.tsx` 和 `src/pages/dashboard/DashboardPage.tsx`；测试镜像到 `tests/unit/pages/auth/` 和 `tests/unit/pages/dashboard/`，避免后续页面平铺在 `pages/` 根目录。

认证相关 UI 拆到 `src/components/auth/`：`AuthLayout` 负责左右分屏和右侧标题区，`AuthBrandPanel` 负责品牌区，`LoginForm` 负责表单和校验；`LoginPage` 只保留路由跳转和静态提示。

### 4. 在 App 层统一 antd 主题与 locale

在 `src/App.tsx` 中用 `ConfigProvider` 包裹 `AntdApp` 和 `RouterProvider`：

- `locale={zhCN}`，让表单校验和组件文案为中文。
- `theme.token.colorPrimary = "#1f7a4d"`，只保留一个绿色品牌 seed。
- 圆角沿用 antd 默认 6px，Tailwind 使用 `--radius-control` 保持控件圆角，表面使用 `--radius-surface`（8px）。
- 主题模式存放在 `src/stores/app.ts`，通过 `persist` 保存 `themeMode`；`App.tsx` 按模式切换 antd `defaultAlgorithm` / `darkAlgorithm`，并同步 `document.documentElement` 的 `.dark` 类。组件颜色、边框和暗色表面由 antd 算法生成；`ThemeTokenBridge` 在 `ConfigProvider` 内用 `theme.useToken()` 把页面级语义 token 写到根节点 `--app-color-*` CSS 变量，因此亮暗两套颜色都只有 antd 一个来源，`global.css` 的 `.dark` 只保留 `color-scheme`。antd 文档明确要求用 algorithm 切换，不手动反色。
- `AntdApp` 作为 antd 全局上下文，为后续 message/notification 提供统一挂载点；当前登录页不使用 message。

备选方案是在 `main.tsx` 里包裹；放在 `App` 中可以让现有和新增的组件测试都自动获得主题与 locale，测试一致性更好。

Tailwind 只负责布局、间距和背景；antd 负责表单、按钮、卡片和统计值，避免用全局 CSS 深度覆盖 antd 内部结构。

### 5. 静态提交不引入认证状态

登录表单使用 antd `Form` 管理字段和校验：

- 账号必填。
- 密码必填且至少 6 个字符。
- 账号和密码使用正确的 `autoComplete` 值。
- 校验通过后调用 `navigate("/dashboard", { replace: true })`。

不创建 auth store，不写 localStorage，不调用 `@repo/http-client`。`replace: true` 避免用户从 dashboard 返回时回到已提交的登录表单。备选方案是加一个假登录 store，但这会制造“已登录”的假象，和静态占位边界冲突。

管理端不提供注册、忘记密码或记住我入口。表单下方显示静态演示提示。

### 6. Dashboard 按工作台方向做占位页，不做后台壳

`DashboardPage` 替换现有 `HomePage`，参考 `docs/product-plan.md` 的工作台定义：

- 顶部白底窄栏：紧凑品牌标识和“返回登录”文字按钮。
- 主区最大宽度 `max-w-6xl`：数据概览、说明文字、三张紧凑统计卡。
- “待处理”卡片使用 antd `Empty` 显示“暂无待审核事项”，作为后续待办入口；本轮不伪造待办数据。
- “后续模块”卡片列出工作台、绿植资源、领养管理、养护审核、环保任务、积分与奖励、学生管理、资讯管理、数据统计，仅作入口占位。
- 卡片使用默认 1px 边框和 `size="small"`，不加阴影；统计卡在移动端纵向堆叠、`sm` 起三列，待处理和后续模块在 `lg` 起两栏。

备选方案是只放三张统计卡片；产品规划明确要求工作台不能只展示数字，因此增加空状态待办入口。不引入侧边栏、顶栏或菜单；静态阶段 `/dashboard` 可直接访问。真实认证和完整工作台数据到来时，再由独立 change 增加 `useAuthStore`、路由守卫、后台壳和真实待办查询。

### 7. 测试策略

- `tests/unit/pages/auth/LoginPage.test.tsx`：渲染字段；空提交显示必填错误；密码过短显示长度错误；合法提交跳转到 dashboard；不渲染注册、忘记密码或记住我入口。
- `tests/unit/pages/dashboard/DashboardPage.test.tsx`：渲染“数据概览”、“暂无待审核事项”空状态和三个统计标题。
- `tests/unit/components/ThemeToggle.test.tsx`：点击右上角按钮后 store 的 `themeMode` 切换，按钮标签同步变化；`tests/unit/app-store.test.ts` 覆盖主题切换状态。
- `App.test.tsx`：根路径重定向到登录页并渲染登录表单。
- 测试使用 `fireEvent`，不新增 `@testing-library/user-event` 依赖。
- 如果 antd 组件在 jsdom 下要求 `matchMedia`，只在 `tests/setup.ts` 补充浏览器 API mock，不修改业务代码。

### 8. 配置与工具链影响

本变更只新增 `apps/admin/src` 下的页面、组件和测试：

- `tsconfig.json` 已包含 `src`、`tests` 和 `vite.config.ts`，无需修改。
- Vitest 的 `include` 已匹配 `tests/**/*.test.{ts,tsx}`，新测试无需改配置。
- 覆盖率 include 已覆盖 `src`，新文件自动纳入。
- Turbo 输入无需变化。
- 继续使用 Oxc 作为唯一 lint/format 工具链，不引入 ESLint 或 Prettier。
- 不读取新环境变量；不修改 `@repo/env`、`@repo/http-client` 或任何共享包。

## Data Flow

```text
Browser
  |
  v
admin Vite app
  |
  +-- /login --> LoginPage (local form state)
  |                |
  |                | onFinish
  |                v
  +-- /dashboard --> DashboardPage (static stat values)
  |
  +-- / --> redirect /login
  +-- * --> redirect /login

BFF: not called by this change
Shared packages: not used by this change
Env: no new keys
```

admin 与 web、bff 之间没有新增跨应用导入或运行时数据流；没有新增共享包。

## Risks / Trade-offs

- **静态登录没有安全性** → 页面明确标注“静态演示”，不展示业务数据；真实认证由后续 change 接入。
- **工作台只有空状态** → 不伪造待办，空状态明确“暂无待审核事项”，真实待办由后续查询接入。
- **`/dashboard` 可直接访问** → 这是静态阶段的刻意边界；后续加守卫时只改 router 和 auth store，不改 dashboard 内容契约。
- **antd 与 Tailwind 样式冲突** → Tailwind 只做布局，antd 使用 token；不写深度选择器覆盖组件内部。
- **jsdom 缺少浏览器 API** → 仅在测试 setup 中补 `matchMedia` 等必要 mock，不污染业务代码。
- **构建体积继续增大** → 当前 admin 产物已有 500 kB 警告；本轮不为此引入拆包复杂度，后续可用 `route.lazy` 处理。
- **表单测试异步校验** → 使用 `findBy*` 等待错误信息，避免固定延时。
- **窄屏布局回归** → 用无头浏览器在 320/768/1024/1440/2000/2560 宽度检查无横向滚动，并确认 320px 下登录表单和 dashboard 卡片可读。
- **暗色对比度** → 页面 `.dark` 使用中性表面 token，组件颜色由 antd darkAlgorithm 生成；检查表单、卡片、按钮和说明文字在亮暗模式下均可读。

## Migration Plan

没有数据或后端迁移。唯一的路由变化是 `/` 从旧占位首页改为重定向 `/login`。回滚时还原 `App.tsx`、`router/index.tsx`、页面文件、测试和文档即可；不涉及 BFF、环境文件或共享包。

## Open Questions

无。
