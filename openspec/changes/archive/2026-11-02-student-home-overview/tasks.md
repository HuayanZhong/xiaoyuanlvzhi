# Tasks

## 1. web · 首页概览数据层

- [x] 1.1 新增 `app/utils/home-overview.ts`：定义 `PendingGroup` 与概览类型，实现 `buildPendingGroups`（五类计数与最近记录链接）、`selectJoinableTasks`、`selectDuePlants`；在 `tests/nuxt/utils/home-overview.test.ts` 覆盖分类计数、空分类、任务筛选和到期植株筛选
- [x] 1.2 在同一模块实现 `loadHomeOverview`，用 `Promise.allSettled` 并行读取打卡、领养、任务参与、订单、任务列表和可养护植株，返回各区块独立错误；在 `tests/nuxt/utils/home-overview-api.test.ts` 模拟各接口成功与失败，验证错误隔离

## 2. web · 首页六区块

- [x] 2.1 重构 `app/pages/index.vue` 为六个 `FolioSection`（我的绿植、待处理事项、当前积分、环保任务、养护提醒、消息），桌面两列、窄屏单列，保留档案条；在 `tests/nuxt/pages/home.test.ts` 验证区块顺序、我的绿植/积分/消息的现有行为
- [x] 2.2 在首页渲染待处理事项：分类数量、最近记录跳转、无记录分类隐藏、全部为零的空态；在 `tests/nuxt/pages/home.test.ts` 覆盖五类计数、任务与打卡跳转、空态
- [x] 2.3 在首页渲染环保任务与养护提醒：最多 3 个可报名任务、最多 3 株到期植株、各自空态与详情链接；在 `tests/nuxt/pages/home.test.ts` 覆盖筛选、截断和空态
- [x] 2.4 接入区块级容错：概览请求失败时对应区块显示原因与重试，其他区块保持可用，重试后恢复；在 `tests/nuxt/pages/home.test.ts` 覆盖单区块失败、重试恢复与资料失败仍为整页错误

## 3. web · 文档与验证

- [x] 3.1 更新 `AGENTS.md` 的首页说明与工具模块列表（`home-overview.ts`、六个区块、`home-overview` 取数）；用 `grep` 确认描述已更新
- [x] 3.2 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test` 和 `pnpm --filter web format:check`，确认全部通过
- [x] 3.3 在 4000 端口用真实学生账号检查六个区块、待处理跳转、任务与养护提醒链接；检查 320/375/768/1440 视口与日间/暗夜主题无横向滚动
- [x] 3.4 运行根目录 `pnpm verify`，确认 19 个任务全部通过

## Workflow follow-up

- 评审通过后归档本变更，并在归档摘要中写明受影响的 specs 与 `apps/web` 验证结果。
- 归档后确认 `openspec list --json` 不再列出该变更。
