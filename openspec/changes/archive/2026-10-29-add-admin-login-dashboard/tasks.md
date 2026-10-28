# Tasks

## 1. Admin 主题与品牌基础

- [x] 1.1 在 `apps/admin/src/App.tsx` 接入 `ConfigProvider`（`zh_CN`、`src/config/theme.ts` 的 antd token bridge）和 `AntdApp`，保留现有 `RouterProvider`；验证：`pnpm --filter admin check-types` 和 `pnpm --filter admin test` 均通过。
- [x] 1.2 创建 `apps/admin/src/components/BrandMark.tsx`，用内联 SVG 叶片和“校园绿植领养”文字组成品牌标识，支持紧凑/普通尺寸；验证：`pnpm --filter admin check-types` 和 `pnpm --filter admin lint` 通过，且不引入 `@ant-design/icons` 依赖。

## 2. 登录页

- [x] 2.1 创建 `apps/admin/src/components/auth/AuthLayout.tsx`、`AuthBrandPanel.tsx`、`LoginForm.tsx` 和 `apps/admin/src/pages/auth/LoginPage.tsx`：左右分屏布局、品牌区、账号/密码表单、静态演示提示；不提供注册、忘记密码或记住我；`LoginPage` 在提交成功后 `navigate("/dashboard", { replace: true })`；验证：`pnpm --filter admin check-types` 和 `pnpm --filter admin lint` 通过。
- [x] 2.2 新增 `apps/admin/tests/unit/pages/auth/LoginPage.test.tsx`，覆盖字段渲染、空提交必填错误、密码少于 6 位、合法提交跳转 dashboard、不渲染注册/忘记密码/记住我入口；验证：`pnpm --filter admin exec vitest run tests/unit/pages/auth/LoginPage.test.tsx` 通过。

## 3. Dashboard 占位页

- [x] 3.1 创建 `apps/admin/src/pages/dashboard/DashboardPage.tsx` 替换 `HomePage.tsx`：品牌标识、返回登录、数据概览、`Empty` 待处理空状态、三个静态统计卡片、后续模块卡片；不添加侧边栏或菜单；验证：`pnpm --filter admin check-types` 和 `pnpm --filter admin lint` 通过。
- [x] 3.2 新增 `apps/admin/tests/unit/pages/dashboard/DashboardPage.test.tsx`，断言“数据概览”、“暂无待审核事项”和三个统计标题；验证：`pnpm --filter admin exec vitest run tests/unit/pages/dashboard/DashboardPage.test.tsx` 通过。

## 4. 路由与文档

- [x] 4.1 更新 `apps/admin/src/router/index.tsx`：导出 `routes`，配置 `/` 到 `/login` 的重定向、`/login`、`/dashboard`、以及未知路径到 `/login` 的重定向，并保留 `createBrowserRouter(routes)`；删除旧 `HomePage.tsx` 引用；验证：`pnpm --filter admin check-types` 通过，路由文件包含四条路由。
- [x] 4.2 更新 `apps/admin/tests/unit/App.test.tsx`，断言根路径渲染登录页；新增 `apps/admin/tests/unit/router.test.tsx`，覆盖 `/`、`/dashboard` 和未知路径；验证：`pnpm --filter admin exec vitest run tests/unit/App.test.tsx tests/unit/router.test.tsx` 通过。
- [x] 4.3 更新 `AGENTS.md` 的 `apps/admin` 描述和 `README.md` 的 admin 页面说明，记录 `/login`、`/dashboard` 工作台占位（待处理空状态 + 统计卡片）、`/` 重定向以及静态无认证/无守卫边界；验证：`pnpm exec oxfmt --check AGENTS.md README.md` 通过，且文档路由与 4.1 一致。

## 5. 集成验证

- [x] 5.1 运行 `pnpm --filter admin lint`、`pnpm --filter admin format:check`、`pnpm --filter admin check-types`、`pnpm --filter admin test`，全部退出 0。
- [x] 5.2 运行 `pnpm --filter admin build`，退出 0；记录现有 Vite 配置警告和 500 kB 体积警告为非阻塞。
- [x] 5.3 启动 `pnpm --filter admin dev`，在 320、768、1024、1440、2000、2560 宽度及亮/暗模式下验证 `/` 重定向 `/login`、窄屏隐藏品牌区、空表单校验、合法表单进入 `/dashboard`、`/dashboard` 可直接访问，以及工作台显示“暂无待审核事项”；记录结果。
- [x] 5.4 从仓库根目录运行 `pnpm verify` 和 `pnpm build`，对齐 CI 的 lint、format、类型、测试和构建检查，全部退出 0。

## 6. 主题切换与宽屏比例

- [x] 6.1 在 `src/stores/app.ts` 增加持久化的 `themeMode` / `toggleTheme`，创建 `src/components/ThemeToggle.tsx`，并在 `App.tsx` 切换 antd `defaultAlgorithm` / `darkAlgorithm` 与 `.dark` token；验证：`pnpm --filter admin lint` 和 `pnpm --filter admin check-types` 通过。
- [x] 6.2 新增 `tests/unit/components/ThemeToggle.test.tsx` 并扩展 `tests/unit/app-store.test.ts` 覆盖主题切换；验证：`pnpm --filter admin test` 通过。
- [x] 6.3 在 2000、2560 和 320 宽度检查亮/暗模式无横向滚动、表单与卡片可读，并确认登录页在宽屏下铺满视口、右侧抽屉贴住视口边缘；记录结果。
- [x] 6.4 改为全宽分栏并简化主题：登录页取消 1440px 最大工作区，左侧在 `xl` 起使用模块纵栏、`2xl` 起模块两列；移除手工暗色表面 token 和组件颜色覆盖，antd 只保留一个绿色品牌 seed；验证：`pnpm --filter admin lint`、`format:check`、`check-types`、`test`、`pnpm verify`、`pnpm build` 通过，受控 Chrome 在 1024/1280/1440/2560 亮暗复查无横向滚动。

## Workflow follow-up

- 实现完成并验证后，用 `/opsx:archive` 归档该 change。
- 真实认证、BFF 登录接口、token/session 和路由守卫留到后续独立 change，不在本次静态占位范围内。
