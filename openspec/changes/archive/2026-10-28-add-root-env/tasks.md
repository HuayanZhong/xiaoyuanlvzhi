# Tasks

## 1. TypeScript 版本固化

- [x] 1.1 在 `pnpm-workspace.yaml` 增加 `overrides: { typescript: 6.0.3 }`，执行 `pnpm install` 后验证 `pnpm why typescript` 在所有工作区包中只解析到 6.0.3
- [x] 1.2 删除孤儿目录 `node_modules/.pnpm/typescript@7.0.2`，执行 `pnpm store prune` 后确认 `ls node_modules/.pnpm | grep typescript` 只剩 6.0.3
- [x] 1.3 逐个确认四个包解析到的 TS 版本一致：对 `apps/admin`、`apps/web`、`apps/bff`、`packages/http-client` 各跑 `node -e "console.log(require('typescript/package.json').version)"`，输出均为 6.0.3

## 2. 根目录环境文件

> 文件加载由各 app 脚本里的 `dotenv-cli -c <mode>` 完成，共享包只做校验。

- [x] 2.1 创建根目录 `.env`（跨环境共享：`ADMIN_PORT`、`PORT`、`WEB_PORT`、`NUXT_PORT`）、`.env.development`、`.env.production`（分别覆盖 `NODE_ENV`、`API_BASE_URL`）、`.env.example`；用 `dotenv.parse` 校验无语法错误
- [x] 2.2 修正 `.gitignore`：`.env.*` 后显式放行 `.env`、`.env.example`、`.env.development`、`.env.production`；`git check-ignore` 确认这四个文件可入库，`.env.local`、`.env.<mode>.local` 仍被忽略
- [x] 2.3 三个应用的脚本统一改为 `dotenv -c <mode> -e ../../.env`，利用 `dotenv-cli` 内置级联补上 `.env.<mode>.local`；实测 `dotenv -c development -e ../../.env` 能同时加载 `.env.development` 与 `.env.local`，且先加载者优先
- [x] 2.4 更正文档语义：`dotenv-cli` 是「先加载者优先、不覆盖已存在变量」，与原文「后加载覆盖先加载」相反；已同步修订 spec.md 与 design.md
- [x] 2.5 `apps/bff` 的 `start` 脚本补上 `dotenv -c production -e ../../.env`，并把 `dotenv-cli` 从 devDependencies 移到 dependencies（生产启动需要它）

## 3. `@repo/env` 共享包

> 实际只实现了 `src/index.ts`（`EnvError` + `parseEnv` + 5 个 zod 构造器）。
> 加载由 `dotenv-cli` 在各 app 的 npm script 中完成，design.md 与 proposal.md 已同步修订。

- [x] 3.1 创建 `packages/env` 骨架：`package.json`（`exports: { ".": "./src/index.ts" }`）、`tsconfig.json`（extends `@repo/typescript-config/library.json`）、`vitest.config.ts`（Node 环境）
- [x] 3.2 先写 `EnvError` 与 `parseEnv` 的失败用例测试（缺失变量、格式不合法、多个问题同时出现时全部列出），运行确认红灯
- [x] 3.3 在 `src/index.ts` 中实现 `EnvError` 与 `parseEnv`，运行 `pnpm --filter @repo/env test` 转绿；错误信息包含每个变量的名称与原因
- [x] 3.4 导出 zod 构造器（`envString`、`envOptionalString`、`envUrlString`、`envIntString`、`envBoolString`），为每个构造器的合法/非法输入补测试
- [x] 3.5 `pnpm --filter @repo/env test` 13 例通过，`test:coverage` 行/分支/函数/语句均为 100%
- [x] 3.6 移除设计文档中的根目录定位与 `createEnv`/`src/load.ts` 方案，改为记录 `dotenv-cli -c` 的实现（design.md 决策 2、3 与 proposal.md 已同步）

## 4. BFF 接入环境配置

- [x] 4.1 创建 `apps/bff/src/config/env.ts`，声明 `PORT` 的 schema 并调用 `parseEnv`，`pnpm --filter bff check-types` 通过
- [x] 4.2 修改 `apps/bff/src/main.ts` 从 `config/env.ts` 读取端口，不再直接读裸 `process.env`
- [ ] 4.3 为端口解析补单元测试（默认值、环境文件值、进程环境值）；当前 `apps/bff/tests` 中无 `config/env` 相关用例
- [x] 4.4 验证进程环境优先：`PORT=4321` 经 dotenv 链后进程内读到的仍是 4321，未被 `.env.development` 的 5000 覆盖

## 5. admin 接入环境配置

- [x] 5.1 创建 `apps/admin/src/config/env.ts` 声明 `ADMIN_PORT`、`API_BASE_URL`、`PORT` 的 schema，`pnpm --filter admin check-types` 通过
- [x] 5.2 在 `apps/admin/vite.config.ts` 中写入 `process.env.VITE_API_BASE_URL`；用 `.env.local` 的探针值构建后，`apps/admin/dist` 中命中该探针值，确认构建期注入生效
- [x] 5.3 `apps/admin/src/lib/http.ts` 未改动，`tests/unit/http.test.ts` 四个用例仍通过
- [x] 5.4 `apps/admin/dist` 中搜索 `dotenv` 与 `pnpm-workspace` 均无命中

## 6. web 接入环境配置

- [x] 6.1 创建 `apps/web/config/env.ts` 声明 `WEB_PORT` 与可选 `API_BASE_URL`，`nuxt.config.ts` 读取并通过 `devServer.port` 生效
- [x] 6.2 校验后的值写入 `runtimeConfig.public.apiBaseUrl`（未配置时回退 `/api/`）；`nuxt prepare`、`check-types` 通过，构建产物 `.output/server` 中可查到该键
- [x] 6.3 `pnpm --filter web build` 成功，`.output` 中不含 `dotenv`
- [x] 6.4 `pnpm --filter web lint` 与 `pnpm --filter web test` 通过；未手改 `.nuxt` 或 `.nuxtrc`

## 7. 任务缓存与环境声明

- [x] 7.1 已在 `turbo.json` 的 `build.inputs` 写入 `$TURBO_ROOT$/.env*`；实测内容不变时命中 3/3，改动 `.env.production` 后变为 0/3。原先的 `.env*` 相对各包目录，根目录文件从未进入哈希
- [x] 7.2 为 `dev` 任务在 `turbo.json` 声明 `env: ["PORT", "NODE_ENV"]`，`build` 声明 `env: ["NODE_ENV"]`。实测依据：Turbo 2.11 默认 `envMode: "strict"`，未声明的 `PORT=4321` 在 turbo 任务内读到 `undefined`；声明后读到 `4321`
- [x] 7.3 `test` 与 `test:coverage` 的 `inputs` 加入 `$TURBO_ROOT$/packages/env/**`，保留 `packages/vitest-config/**`；实测改动 `packages/env/src` 后测试任务缓存不再命中

## 8. 文档与集成验证

- [x] 8.1 更新 `AGENTS.md`：加入 `@repo/env` 到包表、新增环境配置小节（文件范围、`dotenv -c` 级联、`NUXT_PORT` 别名）、写明 `NODE_ENV` 在前后端的不对称、更新 BFF 启动脚本与 Turbo 环境声明
- [x] 8.2 更新 `openspec/config.yaml` 的 `context`，反映根目录环境配置已落地及其加载语义
- [x] 8.3 从仓库根执行 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm format:check` 全部通过（`@repo/env` 的格式化差异已修复）
- [x] 8.4 执行 `pnpm test:coverage`（串行）通过，`packages/env` 行覆盖率 100%
- [x] 8.5 `pnpm build` 三个应用全部成功；生产产物启动 BFF 后 `GET /health` 返回 `{"status":"ok"}`
- [x] 8.6 `pnpm dev` 一次拉起三端，3000/4000/5000 同时监听；admin 经 `/api/health` 代理返回 `{"status":"ok"}`，web 返回 200
- [ ] 8.7 admin 产物尚未引用 `src/lib/http.ts`，`VITE_API_BASE_URL` 不会进入浏览器包；等首个领域 API 调用落地后复验该链路

## Workflow follow-up

- 满足项目评审要求后归档该变更。
- 归档后验证主规格已合并到 `openspec/specs/env/`。
