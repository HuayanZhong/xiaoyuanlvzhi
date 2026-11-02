# Tasks

## 1. README web 页面

- [x] 1.1 重写 README「web 页面」段，按现有路由列出登录、注册、首页六区块、绿植与领养、任务、积分与奖励订单、通知、反馈、我的绿植与打卡、个人中心和 404；验证：逐项对照 `apps/web/app/pages` 与 AGENTS.md 的 Routes 段，确认无遗漏、无已删除路由
- [x] 1.2 修正 README 的导航与 SSR 描述为五项主导航（首页、绿植、任务、积分、我的）且所有业务页通过 `useAsyncData` 服务端取数；验证：与 `apps/web/app/utils/navigation.ts` 和页面中的 `useAsyncData` 调用一致，不再出现“当前只显示首页和我的”或 `/me` 只读的说法

## 2. AGENTS.md 管理端页面结构

- [x] 2.1 更新 AGENTS.md 中管理端路由说明：12 个模块路由渲染真实业务页面，`/dashboard` 渲染真实工作台，删除 `PlaceholderPage` 与“minimal workbench placeholder”的描述；验证：与 `apps/admin/src/router/index.tsx` 的路由清单逐条对照
- [x] 2.2 更新 AGENTS.md 的页面目录说明，移除已不存在的 `src/pages/placeholder/PlaceholderPage.tsx`，改为 `src/pages/<domain>/<Page>.tsx` 的实际结构；验证：`grep -n "PlaceholderPage\|pages/placeholder" AGENTS.md` 无输出，且引用的目录在 `apps/admin/src/pages` 下存在

## 3. 学生端产品规格

- [x] 3.1 删除 `docs/product/student.md` 顶部“当前 foundation 迭代只交付……”的说明，使文档直接描述已落地行为；验证：`grep -n "foundation\|只读资料" docs/product/student.md` 无过期表述，且正文导航与第 3 节导言一致

## 4. web-shell 规范一致性

- [x] 4.1 校验 delta 中「底部导航」与「养护入口」两条 MODIFIED 需求包含主 spec 的全部场景（分别为 6 个和 4 个），且场景断言为五项主导航；验证：对比主 spec 与 delta 的场景名集合完全一致，`grep -n "首页、绿植、我的" openspec/changes/align-project-docs/specs/web-shell/spec.md` 无输出（主 spec 的旧断言在归档同步时替换）
- [x] 4.2 校验 delta 中「底部导航」的模块可见性场景沿用主 spec 的场景名「不显示未实现模块」，但前提已改为“通知、问题反馈或养护模块已有页面但不在主导航中”，不再声称这些模块尚未实现；验证：`grep -n "尚未实现" openspec/changes/align-project-docs/specs/web-shell/spec.md` 无输出，且场景名与主 spec 一致

## 5. 集成验证

- [x] 5.1 运行 `openspec validate align-project-docs --strict`，确认变更级校验通过
- [x] 5.2 运行 `openspec validate --specs`，确认主 spec 校验通过（既有长需求警告不计为失败）
- [x] 5.3 运行 `pnpm format:check` 与 `pnpm exec oxfmt --check README.md AGENTS.md docs/product/student.md`，确认仓库和被改文档格式检查通过；用 `git diff --stat` 确认只改动 README、AGENTS.md、docs/product/student.md 和本变更的 OpenSpec 工件，未触碰应用代码或 Spring 接口

## Workflow follow-up

- 实现完成后按项目流程归档本变更，归档时同步 `web-shell` 主 spec。
- 归档同步后确认 `grep -rn "首页、绿植、我的" openspec/specs` 无输出，主 spec 的旧导航断言已被五项主导航替换。
