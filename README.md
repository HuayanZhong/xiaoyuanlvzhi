# 校园绿植领养与环保激励系统 · Frontend

Turborepo + pnpm 多应用工作区。

## 应用

| 应用         | 技术栈                         | 端口 | 说明             |
| ------------ | ------------------------------ | ---- | ---------------- |
| `apps/admin` | React 19 + Vite 8 + TypeScript | 3000 | 后台管理系统     |
| `apps/web`   | Nuxt 4 + Vue 3 + TypeScript    | 4000 | 面向使用者的应用 |

## admin 页面

- `/login`：左右分屏的真实登录页，调用 Spring `POST /api/v1/auth/login`；登录成功后把 accessToken 保存到 localStorage，并进入 `/dashboard` 或登录前的回跳路径。
- 登录后的业务页面共用后台壳：顶部一级分组（运营 / 资源 / 积分 / 用户 / 数据）+ 左侧二级菜单 + 内容区；视口小于 992px 时收起为抽屉导航。
- `/dashboard`：工作台，展示 8 个待办/资源计数、最近 10 条待处理记录和近 30 天绿植领养/积分发放趋势图；卡片和记录可跳转到对应筛选列表，图表使用 ECharts 并按需注册，跟随亮暗主题。
- `/plants/species`：品种档案，支持名称/状态筛选、客户端分页、新增编辑、启用停用和跳转关联单株；封面通过 Spring 文件接口上传。
- `/plants/instances`：单株库存，支持编号/位置、品种和状态筛选，新增编辑、送修、维护完成和停用；支持通过 `?speciesId=` 从品种页带入筛选，也支持 `?status=AVAILABLE`、`?status=ACTIVE` 等工作台深链。
- `/adoptions`：领养管理，支持关键词/状态/品种/提交日期筛选、客户端分页、详情状态时间线，以及通过并选株、驳回、确认交接、取消和归还处理；支持通过 `?status=` 带入状态筛选，`?status=CHANGES` 表示取消审核中和归还审核中。
- `/care-reviews`：养护审核，支持关键词/状态/品种/提交日期筛选、客户端分页、详情凭证版本与照片、审核操作记录，以及通过并发放积分、驳回并填写原因；通过前会按证据、重复待审和积分来源做防御性校验，支持 `?status=` 带入状态筛选。
- `/tasks`：环保任务，包含“任务配置”和“凭证审核”两个 tab；支持任务新建/编辑/复制新建/停用、关键词/状态/开放日期筛选和客户端分页，以及按任务/状态/关键词/提交日期筛选参与记录、查看凭证版本与审核记录、通过发放积分或驳回填写原因；支持 `?tab=review&status=&taskId=` 深链。
- `/feedback`：问题反馈，支持关键词/类型/状态/提交日期筛选、客户端分页、学生姓名/学号关联、详情抽屉与处理时间线、开始处理、回复和关闭；关闭前二次确认，回复和关闭结论按 5–500 字校验；支持 `?status=` 深链。
- `/points/rules`：积分规则与流水，包含“积分规则”和“积分流水”两个 tab；支持养护/环保任务规则编辑、频控配置、全量流水筛选与客户端分页，以及学生积分人工调整和余额预览。
- `/points/rewards`：奖励商品，支持名称/状态筛选、客户端分页、新增/编辑抽屉、最多 3 张公开图片、上下架二次确认，以及总库存、已预留、已领取和剩余可兑换的分开展示。
- `/points/orders`：兑换订单，支持订单号/学生/奖励关键词、状态和下单日期筛选、客户端分页、学生姓名/学号关联、确认领取二次确认、取消订单原因弹窗，以及超时订单的只读提示；支持 `?status=WAITING_PICKUP` 等工作台深链。
- `/students`：学生管理，支持姓名/学号/邮箱关键词、院系、账号状态和注册日期筛选，客户端分页；详情抽屉展示基础资料和领养、养护打卡、任务、积分流水、兑换订单五组历史，并支持填写原因启用或禁用账号。
- `/articles`：资讯管理，支持标题/摘要/分类关键词、状态和分类筛选、客户端分页；新增/编辑抽屉支持标题、分类、摘要、公开封面和纯文本正文，支持保存草稿、发布、重新发布和二次确认撤回；列表使用不含正文的摘要接口。
- `/statistics`：数据统计，默认近 30 天，支持近 7/30/90 天快捷范围、查询、重置和刷新；展示当前在养数、累计领养数、参与学生数和积分发放量 4 个指标卡，以及绿植领养趋势、任务完成率、积分发放趋势和积分余额排行 4 张图；包含空态、失败重试、亮暗主题和窄屏布局。
- `/` 和未知路径都会重定向到 `/login`。
- 使用 antd 默认主题色，不注入自定义品牌色；右上角支持亮/暗主题切换，选择会持久化；宽屏登录页使用全宽分栏，登录抽屉贴住视口右边。

业务路由受路由守卫保护，未登录访问会回到 `/login?returnTo=...`；账号菜单提供退出登录。Spring 是最终认证和角色边界，管理端只接受 `role` 为 `ADMIN` 的账号。

## web 页面

- `/login`：QQ 邮箱 + 密码登录；Nitro 在校验成功后写入 HttpOnly `student-session` Cookie，并回到 `returnTo` 指定的站内路径或首页。
- `/register`：QQ 邮箱 + 6 位验证码注册，验证码 60 秒重发冷却；填写姓名、学号、院系、班级、手机号和密码后直接登录并进入首页。邮箱、学号或手机号冲突会在对应字段提示。
- `/`：品牌化植物账户首页，包含当前植株主视觉、今日照料、环保行动、积分、消息和待处理事项，各模块独立容错并可重试。
- `/plants`：可领养品种目录，支持关键词和位置筛选；`/plants/{id}` 展示品种详情、养护说明和领取地点，并进入领养申请确认。
- `/adoptions`：我的领养申请，按更新时间倒序展示状态和最近处理意见；`/adoptions/{id}` 展示申请时间线、分配单株和领取信息，并按状态提供撤回、修改重提、取消和申请归还。
- `/tasks`：环保任务列表，按可报名、已参加和已结束筛选；`/tasks/{id}` 展示任务要求、名额和奖励，支持报名、提交凭证、查看参与记录并在驳回后重提。
- `/points`：积分余额和流水，按时间倒序展示来源、变动和变动后余额。
- `/rewards`：奖励商城，展示所需积分、剩余库存和领取地点，积分或库存不足时禁用兑换；`/rewards/orders` 展示兑换订单，`/rewards/orders/{id}` 展示订单详情和领取截止时间，待领取订单可二次确认后取消。
- `/notifications`：站内通知列表，展示业务类型、时间和已读状态，点击后标记已读并进入对应业务详情，支持全部标记已读。
- `/feedback`：问题反馈列表和提交表单；`/feedback/{id}` 展示处理时间线和管理员回复，已回复的反馈可确认关闭。
- `/my-plants`：在养绿植列表，显示编号、位置、养护间隔和下次可打卡时间；`/my-plants/{plantId}` 展示养护说明和打卡历史，可提交说明与最多 3 张照片；`/care/{id}` 展示打卡凭证版本、审核结果和驳回原因，可修改后重提。
- `/me`：展示姓名、学号、院系、班级、手机号、邮箱、积分和在养绿植数，支持修改手机号和班级、进入通知与问题反馈，以及退出登录。
- `[...slug]`：未知路径显示带返回入口的 404 页面。
- 未登录访问业务路由会先进入 `/login?returnTo=...`；已登录访问登录/注册页会回到首页。
- 主导航为首页、绿植、行动、积分、我的；学生端只设计桌面布局，不提供移动端底部导航。

认证通过 `GET /api/v1/auth/me` 在启动时恢复。登录、注册和注销由 Nitro server routes 处理，Spring accessToken 只保存在 HttpOnly `student-session` Cookie（`SameSite=Lax`，生产环境 `Secure`，7 天）中；浏览器脚本和 Nuxt payload 都接触不到令牌。

学生端使用自有语义 token、Reka UI 无样式可访问原语、Motion for Vue 和 Lucide 图标。浏览器与 SSR 都只请求同源 `/api/v1/`，由 `server/api/v1/[...path].ts` 从 HttpOnly Cookie 生成 Bearer 后转发到私有 `springApiOrigin`。简单读取使用 `useApiFetch`，聚合读取使用 `useAsyncData`，事件型写操作使用 Nuxt `$fetch`；SSR 首屏 HTML 包含完整业务数据。

设计源：`docs/design/web-visual-system.md`。鼠标效果使用 `@supermousejs/core`、`dot`、`ring`，仅在精细指针设备、未开启减弱动效且用户偏好开启时初始化。

运行 web 测试：

```sh
pnpm --filter web test
pnpm --filter web exec vitest run tests/nuxt/pages/login.test.ts
```

## 共享配置

- `packages/typescript-config`: 共享 `tsconfig` 预设（base / react-app）
- `packages/vitest-config`: 共享 Vitest 测试选项（超时、mock、覆盖率、排除目录）
- `.editorconfig`: 编辑器基础规范（UTF-8 / LF / 2 空格缩进）
- `.gitattributes`: Git 行尾与文本文件规范化
- `.oxlintrc.json`: Oxlint 规则配置（React / Vue / TypeScript 等插件）
- `.oxfmtrc.json`: Oxfmt 格式化配置
- `turbo.json`: 任务编排（build / lint / format / format:check / check-types / test / test:coverage / dev）

## 测试

测试统一使用 Vitest 5，各应用独立运行，公共默认值来自 `@repo/vitest-config`。

- `apps/admin/tests/unit`: jsdom + Testing Library 组件测试
- `apps/web/tests/nuxt`: `@nuxt/test-utils` Nuxt 运行时测试

```sh
pnpm test                # turbo run test（执行全部应用）
pnpm test:coverage       # V8 覆盖率，报告写入各应用 coverage/
pnpm --filter admin test # 只跑后台测试
pnpm --filter web test   # 只跑用户端测试
pnpm --filter admin test:watch
pnpm --filter admin test:coverage
```

覆盖率报告：

- 终端：`text` 摘要
- HTML：`apps/<app>/coverage/index.html`
- LCOV：`apps/<app>/coverage/lcov.info`

## 常用命令

```sh
pnpm install      # 安装依赖
pnpm dev          # 同时启动 admin(3000) 和 web(4000)
pnpm build        # 构建所有应用
pnpm lint         # turbo run lint（各包执行 oxlint）
pnpm lint:fix     # 自动修复 lint 问题
pnpm format       # turbo run format（各应用执行 oxfmt）
pnpm format:check # 检查各应用格式
pnpm check-types  # 类型检查
pnpm test         # 运行全部测试
pnpm test:coverage # 运行全部测试并生成覆盖率
pnpm verify       # lint、format:check、类型检查和测试（pre-push 使用）
```

只启动单个应用：

```sh
pnpm --filter admin dev
pnpm --filter web dev
```

## Git 钩子

首次在仓库根目录执行 `pnpm install` 会自动注册 husky 钩子；需要重新初始化时运行 `pnpm run prepare`。钩子脚本位于 `.husky/`。

### pre-commit

- 只检查本次暂存的文件，未暂存的改动不会影响检查结果。
- 对暂存文件运行 `oxlint --fix --deny-warnings` 和 `oxfmt`；可自动修复的格式或 lint 问题会被修复并重新暂存。
- 修复后仍有错误或警告时，提交会被拒绝。

### commit-msg

- 提交信息遵循 conventional commits：`<type>(<scope>): <subject>` 或 `<type>: <subject>`。
- 允许的 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
- `scope` 可为空，也可使用中文或英文；`subject` 可为中文；header 不超过 100 个字符。
- `Merge`、`Revert`、`fixup!` 等自动生成的提交会跳过校验。
- 一次提交只表达一件事；规则只影响新提交，历史提交不会被重新检查。

示例：`feat(pnpm): 添加构建支持`

### pre-push

- 推送前运行 `pnpm verify`：lint、format:check、类型检查和测试；不包含覆盖率。
- 任一检查失败都会阻止推送。
- 使用 `git push --no-verify` 会跳过这些检查。

### 绕过与 CI

- `git commit --no-verify` 跳过 `pre-commit` 和 `commit-msg`。
- `git push --no-verify` 跳过 `pre-push` 的完整校验。
- 无 `.git` 的 CI/Docker 环境用 `HUSKY=0 pnpm install` 跳过钩子安装。
- 钩子只是本地门禁；绕过或 GUI 客户端未执行钩子时，问题不会被自动发现，仍需依赖 `pnpm verify` 或 GitHub CI。

### Windows 排障

- 钩子通过 Git Bash 执行，需要 `sh` 可用（Git for Windows 自带）。
- GUI Git 客户端没有继承 pnpm 的 PATH 时会报 `pnpm: command not found`。可改在终端提交，或把钩子命令改为 `node_modules/.bin/` 下的本地二进制：
  - `.husky/pre-commit`：`node_modules/.bin/lint-staged`
  - `.husky/commit-msg`：`node_modules/.bin/commitlint --edit "$1"`
  - `.husky/pre-push`：`node_modules/.bin/turbo run lint format:check check-types test --ui=stream`
- 若钩子脚本出现 CRLF 或不可执行：确认 `.gitattributes` 生效，并在提交时使用 `git add --chmod=+x`。

## GitHub CI

CI 定义在 `.github/workflows/ci.yml`，在推送到 `main`、针对 `main` 的 pull request 和手动触发时运行。四个 job 并行执行：

| Job      | 命令                              | 检查名称      |
| -------- | --------------------------------- | ------------- |
| `static` | `pnpm lint` + `pnpm format:check` | `CI / static` |
| `types`  | `pnpm check-types`                | `CI / types`  |
| `test`   | `pnpm test`                       | `CI / test`   |
| `build`  | `pnpm build`                      | `CI / build`  |

- 每个 job 使用 `.nvmrc` 的 Node、`packageManager` 的 pnpm，以 `pnpm install --frozen-lockfile` 安装，并设置 `HUSKY=0`。
- CI 只读取仓库内容（`permissions: contents: read`），不需要 secrets；构建使用各应用的 schema 默认值。
- 在 GitHub Settings → Branches/Rulesets 中启用分支保护，要求上述四个检查全部通过后才能合并到 `main`。
- 本地没有 Git remote 时 workflow 不会运行；推送到 GitHub 后生效。

## GitHub 依赖更新

Dependabot 配置在 `.github/dependabot.yml`，每周一检查 npm 依赖和 GitHub Actions：

- npm 更新等待 3 天，GitHub Actions 更新等待 7 天，避开 pnpm 的 24 小时 `minimumReleaseAge`。
- minor 和 patch 更新合并为一个 PR；major 更新单独提出。
- TypeScript 的 major 更新被忽略，因为工作区通过 override 锁定 6.0.3。
- 每个更新 PR 都会经过同一套 CI；如果 Dependabot 无法处理 pnpm 12 的 lockfile，再考虑迁移到 Renovate。

## Pull request 模板

`.github/PULL_REQUEST_TEMPLATE.md` 会在新建 PR 时自动填入，提醒填写：

- 变更内容与影响范围（admin / web / 共享包 / 工具链）
- 验证命令（`pnpm verify`、`pnpm build`、相关测试）
- 关联的 OpenSpec change

模板只做提醒，不替代 CI；PR 标题或 commitlint 的自动门禁留到后续。

## 工具链

- [Turborepo](https://turborepo.dev) 2.11
- [pnpm](https://pnpm.io) 12
- [Node.js](https://nodejs.org/) >= 26.12.1（见 `.nvmrc`）
- [TypeScript](https://www.typescriptlang.org/) 6.0
- [Vitest](https://vitest.dev/) 5
- [Oxlint](https://oxc.rs/) 规则检查
- [Oxfmt](https://oxc.rs/) 代码格式化
