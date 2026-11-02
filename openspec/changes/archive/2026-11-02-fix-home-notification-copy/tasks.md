# Tasks

## 1. Web 首页文案修复

- [x] 1.1 在 `apps/web/app/pages/index.vue` 中把“我的绿植”区块的说明改为只在 `activeCount === 0` 时渲染；验证方式：有在养绿植时页面不出现“领养审核通过后，植株会登记在这里”，空态时仍出现
- [x] 1.2 在 `apps/web/tests/nuxt/pages/home.test.ts` 增加用例：`activeAdoptionCount` 大于 0 时不渲染该说明，并保留现有空态用例；验证：`pnpm --filter web exec vitest run tests/nuxt/pages/home.test.ts` 通过
- [x] 1.3 运行 `pnpm --filter web lint`、`pnpm --filter web check-types`、`pnpm --filter web test`，确认全部通过

## 2. 格式与回归

- [x] 2.1 运行 `pnpm exec oxfmt --check apps/web/app/pages/index.vue apps/web/tests/nuxt/pages/home.test.ts`，确认格式正确
- [x] 2.2 在浏览器重新打开首页，确认有在养绿植时区块只显示数量、跳转和“在养中”，不再显示零值说明

## Workflow follow-up

- 归档后确认 `openspec/specs/web-shell/spec.md` 的“首页摘要”包含“有在养绿植时不显示零值说明”场景。
- 后端后续（不在本变更范围）：在 `backend` 仓库把 `RewardService` 兑换成功通知的 `pickupDeadline` 格式化为 `yyyy-MM-dd HH:mm`，并补后端测试；不改变接口字段或状态码。
