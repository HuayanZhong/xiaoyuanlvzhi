# Proposal

## Why

三个应用目前各自摸索环境变量：admin 只读 `VITE_API_BASE_URL` 且没有对应的 `.env` 文件，web 没有任何环境配置，bff 直接读裸 `process.env.PORT` 而没有任何加载器。仓库里 `.env*` 文件数量为 0，`.gitignore` 还把 `.env` 整个忽略掉，导致「环境配置」这件事既没有落点也没有约定。

同时存在两个已确认的缺陷：

- `turbo.json` 的 `build.inputs` 写的是 `".env*"`，该 glob 相对包目录，根目录 `.env` 不参与哈希，改动后不会触发重建。
- Turborepo 默认 `envMode: "strict"`，从 shell 传入的 `PORT` 到达不了 BFF 任务。实测 `PORT=4321` 在 turbo 任务内读到 `undefined`。

最后，依赖树里残留了一个孤立的 `typescript@7.0.2` 目录（无任何链接指向，但占 3.4 MB）。用户此前降级到 TS 6 正是为了统一版本，需要把约束固化下来，而不是依赖每个包各自写死。

## What Changes

**环境配置**

- 新增根目录 `.env`、`.env.development`、`.env.production`、`.env.example`，按运行模式选择环境。
- 新增工作区包 `@repo/env`，提供 `parseEnv` 与 zod 构造器做类型化校验；环境文件由各应用脚本中的 `dotenv-cli -c` 级联加载。
- 三个应用在应用级 `src/config/env.ts` 中声明自己的变量 schema 并调用 `parseEnv`；共享包不认识任何业务变量名。
- `@repo/http-client` 保持不变，继续不读环境变量。

**TypeScript 版本**

- 在 `pnpm-workspace.yaml` 增加 `overrides: typescript: 6.0.3`，对整棵依赖树生效。
- 清理 `node_modules/.pnpm/typescript@7.0.2` 孤儿目录。

**配置修正**

- `turbo.json` 的根目录 `.env*` 纳入哈希输入，并显式声明 BFF 需要的环境变量，不再依赖 strict 模式的隐式过滤。
- `.gitignore` 改成「提交 `.env` / `.env.development` / `.env.production`，忽略 `.env.local` 与 `.env.*.local`」。

不修改 BFF 的任何 HTTP 接口：仍然只有 `GET /` 和 `GET /health`，路径、方法、状态码和响应体均不变。

## Capabilities

### New Capabilities

- `env`: 根目录环境文件约定、加载优先级、类型化校验与失败行为，以及三个应用各自声明环境 schema 的边界。

### Modified Capabilities

无。`http-client` 的 6 条需求全部保持不变；该包继续不读取环境变量，由调用方传入 base URL。

## Impact

**新增文件**

- `packages/env/`（`@repo/env`，源文件直出，无构建步骤）
- 根目录 `.env`、`.env.development`、`.env.production`、`.env.example`
- `apps/admin/src/config/env.ts`、`apps/web/…/config/env.ts`、`apps/bff/src/config/env.ts`

**修改文件**

- `apps/admin/vite.config.ts`：读取校验后的值并注入 `process.env.VITE_*`（已实测 Vite 会把 `process.env` 中的 `VITE_*` 合并进 `import.meta.env`）。
- `apps/web/nuxt.config.ts`：把校验后的值写入 `runtimeConfig`。
- `apps/bff/package.json`：脚本统一为 `dotenv -c <mode>`，`dotenv-cli` 移入 dependencies（`start` 需要）。
- `pnpm-workspace.yaml`、`turbo.json`、`.gitignore`、`AGENTS.md`。

**新增依赖**

- `dotenv`（`@repo/env` 运行时）
- `zod`（`@repo/env` 校验；store 中已有 4.4.3，无需联网）
- `dotenv-cli`（各应用脚本的环境加载）

**受影响的应用**

- `admin`、`web`、`bff` 全部涉及环境读取路径的改造。
- `@repo/http-client` 不受影响。

**未涉及**

- 不新增认证、数据库、持久化或领域 API。
- 不引入 ESLint、Prettier 或第二套格式化工具。
- 不引入 Infisical 或其他密钥管理服务。
