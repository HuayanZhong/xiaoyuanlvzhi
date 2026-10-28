# Design

## Context

当前状态与约束（动机见 proposal.md）：

- `packages/http-client` 采用源文件直出（`exports: { ".": "./src/index.ts" }`），由 Vite/Vitest 的打包器处理，无构建步骤。
- `apps/bff` 使用 `tsc` 逐文件编译到 `dist/`，`dist` 下为 `main.js`、`app.module.js` 等平铺文件，`start` 脚本为 `node dist/main`。
- `pnpm-workspace.yaml` 中 `packages: ["apps/*", "packages/*"]`，根目录不是工作区包的合法位置。
- Node 26 的类型剥离拒绝处理 `node_modules` 下的文件（`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`）。该限制按路径判定，但 pnpm 的目录软链解析到 `packages/<name>`，因此**不触发**该限制——这一点已用真实目录软链实测确认，ESM 与 CJS 两个方向均可达。
- Vite 的 `loadEnv` 会主动合并 `process.env` 中以 `VITE_` 开头的变量；Nuxt 的 `useRuntimeConfig` 通过 `NITRO_`（备用前缀 `NUXT_`）在运行期覆盖 `runtimeConfig`。
- Turborepo 2.11 默认 `envMode: "strict"`，会过滤未在 `env`/`globalEnv` 声明的进程环境变量。

## Goals / Non-Goals

**Goals:**

- 三个应用共享同一套根目录环境文件与同一份解析实现。
- 配置在校验失败时给出全部问题，而不是逐个试错。
- TypeScript 主版本在全树唯一且被约束住。

**Non-Goals:**

- 不做多环境（staging、preview 等）支持，只有 development 与 production。
- 不引入密钥管理服务。
- 不改变任何 HTTP 路由、认证或持久化行为。
- 不为 `@repo/http-client` 引入环境感知。

## Decisions

### 1. 共享包放 `packages/env`，采用源文件直出

选择：`@repo/env` 与 `@repo/http-client` 一致，`exports` 指向 `src/index.ts`，无构建步骤。

理由：三个消费者中两个（admin、web）由打包器处理，一个（BFF）由 tsc 编译。admin 与 web 直接消费 TS 源码；BFF 通过 pnpm 目录软链解析到 `packages/env`，Node 的类型剥离限制按字面 `node_modules` 路径判定，因此实测可达。构建步骤没有收益。

替代方案：让共享包产出 `dist`。否决原因——三者都能直接消费源码，额外的构建步骤只会增加缓存与发布负担。

### 2. dotenv 加载交给各应用的 npm script（`dotenv-cli -c`），共享包只做校验

选择：各应用脚本统一写成 `dotenv -c <mode> -e ../../.env -- <命令>`，加载由 `dotenv-cli` 完成；`@repo/env` 只提供 `parseEnv` 与 zod 构造器，不读取文件。

理由：`dotenv-cli` 的 `-c` 级联模式内置了 `.env.<mode>.local` → `.env.local` → `.env.<mode>` → `.env` 的顺序，且默认不覆盖已存在的变量，正好是「越具体越优先、进程环境最高」。把它放在脚本层，三个框架的启动命令都走同一条链路，不需要各自实现定位与合并逻辑。

替代方案：在共享包内实现 `createEnv`，内部定位仓库根并合并文件。否决原因——需要在每个包内复制「向上查找根目录」的相对路径逻辑（`pnpm dev` 从仓库根启动、`pnpm --filter <app> dev` 从 app 目录启动，cwd 不同），而这些逻辑 `dotenv-cli` 已经提供，重写没有收益。

### 3. 不依赖 `process.cwd()` 定位根目录

选择：脚本中的路径统一写成相对 app 目录的 `../../.env`，由 npm script 的 cwd 保证一致。

理由：pnpm 执行 workspace 包的脚本时，cwd 一定是该包目录，因此 `../../.env` 恒等于仓库根。这种写法不依赖调用者从哪个目录发起命令。

替代方案：从 `process.cwd()` 向上逐级查找 `pnpm-workspace.yaml`。否决原因——上述相对路径已足够确定，额外的目录遍历只会增加测试面。

### 4. 应用各自声明 schema，共享包不认识业务变量

选择：每个应用在 `src/config/env.ts` 中定义自己的 schema 并调用 `parseEnv`。共享包只导出 `parseEnv`、`EnvError` 以及一组 zod 构造器，不读文件也不读 `process.env`（值由调用方传入）。

理由：与 `@repo/http-client` 的「共享包不读环境」纪律同构。共享包一旦认识变量名，就会随业务增长变成配置垃圾场。

### 5. TypeScript 版本用 `overrides` 全局钉死

选择：`pnpm-workspace.yaml` 增加 `overrides: { typescript: 6.0.3 }`。

理由：当前每个包各自写死 `6.0.3`，这个防御对**新增工具**无效。`overrides` 对整棵依赖树生效，包括工具的内部依赖。

### 6. admin 通过 `process.env` 注入，不改 `http.ts`

选择：在 `vite.config.ts` 中读取 `src/config/env.ts` 校验后的对象，把结果写入 `process.env.VITE_API_BASE_URL`，Vite 会合并进 `import.meta.env`。

理由：已实测该链路成立——配置函数里写 `process.env.VITE_*`，值正确进入构建产物。`apps/admin/src/lib/http.ts` 一行不改，`@repo/env` 与 zod 也不会进入浏览器包（只被 `vite.config.ts` 引用）。

替代方案：直接把校验结果传给 `vite.config` 的 `define`。可行但需要手动维护 `import.meta.env` 的形状；沿用 Vite 原生的 `VITE_` 前缀通道更省事。

### 7. `turbo.json` 显式声明环境，而非开 loose 模式

选择：为 BFF 任务声明所需的 `env`，并用 `$TURBO_ROOT$/.env*` 把根目录环境文件纳入 `build.inputs`。

理由：`--env-mode=loose` 会让所有环境变量都绕过哈希，牺牲缓存正确性。显式声明只放行确实需要的变量。

## 数据流

```text
  根 .env / .env.<mode> / .env.<mode>.local / .env.local
        |
        |  dotenv-cli -c <mode> 级联加载（先加载者优先，进程环境最高）
        v
  parseEnv(schema)  ── 校验失败 → 非零退出，列出全部 issues
        |
        +--> admin: vite.config.ts 写入 process.env.VITE_*
        |           → Vite 合并进 import.meta.env
        |           → src/lib/http.ts（保持不变）→ @repo/http-client
        |
        +--> web:   nuxt.config.ts 写入 runtimeConfig（服务端）
        |           → 浏览器侧经 Nuxt 原生通道读取
        |
        +--> bff:   src/config/env.ts 直接导出类型化对象
                    → main.ts 读取端口

  应用之间无直接导入。共享逻辑只在 packages/* 中。
```

web 目前没有任何环境消费方，本次只建立通道，不引入实际使用点。

## 部署与配置

```text
  开发    pnpm dev
            admin  NODE_ENV=development（Vite 自动）
            web    NODE_ENV=development（Nuxt 自动）
            bff    NODE_ENV 默认 development

  生产    pnpm build
            admin / web  构建期固定，值被写入产物
            bff          运行期读取，启动时需 NODE_ENV=production
```

`NODE_ENV` 在三端不对称：前端是构建期输入，BFF 是运行期输入。实现方式是在 `.env.production` 中声明 `NODE_ENV=production`，由 `start` 脚本的 `dotenv -c production` 注入，因此不需要 `cross-env`。

## Risks / Trade-offs

**`dotenv-cli` 依赖 npm script 的 cwd 恒为包目录。** → 若将来改用手写启动方式，`../../.env` 可能失效；文档已写明脚本约定，改动启动方式时需同步路径。

**构建期与运行期各调一次 `parseEnv` 可能读到不同配置。** → 前端值以构建产物为准，运行期改环境文件对浏览器侧无效；BFF 则始终读运行期文件。

**前端值是构建期烘焙的，运行时改环境文件无效。** → 文档中写明该差异；生产部署以构建产物为准。

**`overrides` 影响整棵树，可能与某个要求 TS 7 的工具冲突。** → 当前无此工具；若将来出现，`overrides` 会使其报错而非静默降级，属于可接受的行为。

## Migration Plan

按依赖顺序推进，每一步可独立验证，失败时可停在原地：

1. **TS 版本固化**——加 `overrides`、清理孤儿目录、`pnpm install` 验证全树单一版本。此步与 env 无关，失败不影响后续。
2. **`@repo/env` 与根环境文件**——新建包与文件，补测试。此时没有消费者，可安全合入。
3. **三端接入**——按 bff → admin → web 顺序，每个应用独立验证。
4. **配置修正**——`turbo.json` 输入与环境声明、`.gitignore`、`AGENTS.md`。

回滚：第 1、4 步是独立配置改动，可直接还原。第 2–3 步若需回滚，`apps/*/src/config/env.ts` 与新包一起移除即可恢复原有读取路径。
