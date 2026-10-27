# Design

## Context

动机见 `proposal.md`。当前 admin 没有 HTTP 层，BFF 只在 5000 端口暴露 `GET /` 和 `GET /health`。工作区已有共享 TypeScript 和 Vitest 配置包，但没有运行时包。admin 和 web 目前都没有调用 BFF。

已选择 ky 2.2.0。ky 2.x 的 base URL 选项名是 `baseUrl`，不是旧版的 `prefixUrl`。相对 `baseUrl` 会在浏览器中基于当前 location 解析，这正是 admin 开发代理需要的行为。

用户提到的根目录环境模块是后续独立变更。本设计只预留它接入的边界，不创建也不修改该模块。

## Goals / Non-Goals

**Goals:**

- 新增私有包 `@repo/http-client`，统一维护可复用的客户端默认值和错误导出。
- 让 admin 使用环境提供的 base URL 创建唯一客户端，同时不把共享包绑定到 Vite。
- 让开发环境中的 `/api/*` 请求到达现有 BFF，且不引入 CORS 配置。
- 让新包符合工作区现有的 TypeScript、Vitest、Turbo 和 Oxc 规范，并且可独立测试。

**Non-Goals:**

- 实现根目录环境模块、其校验 schema 或包结构。
- 让 web 或 BFF 接入该 HTTP 客户端。
- 新增认证、持久化、领域接口或业务响应包络。
- 修改 BFF 路由或增加 CORS 行为。

## Decisions

### D1：基于 ky 的薄封装工厂

共享包导出 `createHttpClient`，接收必填的 `baseUrl` 和 ky 的其他 `Options`，返回 `KyInstance`。同时再导出 `HTTPError`、`NetworkError`、`TimeoutError` 及类型守卫，让业务代码不需要直接依赖 ky。

考虑过的替代方案：

- 增加 `request<T>()` 并解包 `{ code, data, message }`：当前没有这种 BFF 契约，提前固化会迫使我们以后迁移，因此不采用。
- 暴露带 `get`/`post`/`put`/`delete` 的类：会重复 ky 已有的请求方法、hooks、重试控制和响应快捷方法，因此不采用。

### D2：源码导出的工作区包

`packages/http-client` 通过 `./src/index.ts` 导出源码，不生成 `dist`，与现有配置包保持一致。当前工作区内由 Vite 和 Vitest 转译链接的源码。

考虑过的替代方案：

- 用 `tsc` 或打包器生成 `dist`：会增加构建和 watch 步骤，并要求所有消费方遵守 Turbo 构建顺序。当前消费方都是 Vite 系工具，不需要。若未来 BFF 或其他不做转译的消费方要使用，再增加构建步骤即可。

### D3：配置由调用方提供，并预留环境边界

共享包只接收普通配置值，绝不读取 `import.meta.env`、`process.env`、Nuxt runtime config 或其他应用全局对象。admin 适配层是唯一读取 admin 环境的位置：

```ts
createHttpClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/",
});
```

预留的环境契约只有一个逻辑键 `apiBaseUrl`：

| 消费方 | 当前来源 | 未来根目录环境模块 |
| --- | --- | --- |
| admin | `VITE_API_BASE_URL`，未配置时回退 `/api/` | 提供类型化 `apiBaseUrl`；只需改适配层，不改共享包 |
| web | 本次不接入 | 未来接入客户端时，将同一逻辑键映射到 Nuxt runtime 配置 |
| bff | 不是客户端消费方 | 保持服务端配置；本设计不修改 |

根目录环境模块的具体 API、文件位置和变量名不在本次范围内。共享包只保证 base URL、超时、重试次数和其他请求选项以普通值传入。本次不新增应用级 `.env` 文件，只记录 admin 的变量名和默认值。

### D4：请求默认值和 URL 语义

`createHttpClient` 会将 base URL 归一化为以 `/` 结尾。默认超时为 15 秒，默认重试上限为两次，调用方可覆盖这些值或任何其他 ky 选项。ky 的 `baseUrl` 会将以 `/` 开头的输入解析到站点根路径，因此文档和测试都要求使用 `health` 这样的相对路径，而不是 `/health`。

除重试上限外，重试行为保持 ky 默认值；ky 默认不重试 `POST` 和 `PATCH`，避免静默重放非幂等操作。

### D5：沿用 ky 原生错误模型

HTTP 失败保持为 ky `HTTPError`，包含 `response` 和已解析的 `data`；网络和超时失败保持为 `NetworkError` 和 `TimeoutError`。共享包再导出这些类和类型守卫，不再包一层错误体系。调用方既能区分传输故障，也能访问原始响应。

### D6：admin 开发环境路由

Vite 将 `/api` 转发到 BFF，并去掉前缀：

```text
http.get("health")
  -> 浏览器请求 /api/health
  -> Vite 代理
  -> http://localhost:5000/health
  -> BFF 响应
```

必须去掉前缀，因为当前 BFF 没有全局 `/api` 前缀。如果未来 BFF 增加该前缀，就在这个边界移除 rewrite。配置了绝对地址的 `VITE_API_BASE_URL` 会绕过这条开发代理链路。

数据流：

```text
admin UI / 未来的 admin API 模块
  -> apps/admin/src/lib/http.ts（环境适配层）
  -> @repo/http-client（ky 实例）
  -> 开发环境 /api/*
  -> Vite 代理
  -> bff :5000

web :4000       本次没有 HTTP 客户端，也没有 BFF 调用
bff :5000       不变；只接收经代理转发的请求
```

### D7：工具链和配置变更

- 新增 `packages/typescript-config/library.json`，用于非 React 运行时包：bundler 模块解析、no emit、DOM 库、不启用 JSX 和 Vite client 类型。新包继承该预设；admin 继续使用现有的 `react-app.json`。
- 新增 `packages/http-client/vitest.config.ts`，使用 `@repo/vitest-config/base`，设置 Node 环境和 `tests/**/*.test.ts`。共享覆盖率配置已经包含 `src/**/*.ts`，因此不需要修改覆盖率路径。
- 新包增加标准的 `lint`、`format`、`format:check`、`check-types`、`test`、`test:coverage` 脚本。Turbo 会自动发现；现有 `test` 任务已经把 `packages/vitest-config/**` 作为输入。
- 根目录 `test:coverage` 脚本将 Turbo 并发设为 1，因为新增第四个 coverage worker 后并行 V8 worker 可能耗尽本机内存；`test` 仍保持并行。
- Oxc 仍是唯一的 lint 和 format 工具链，不引入 ESLint 或 Prettier 配置。
- 更新 `AGENTS.md` 和 OpenSpec 项目上下文，使其准确描述新的共享运行时包和 admin 代理。

## Risks / Trade-offs

- **纯源码包无法被不做转译的运行时直接使用。** → 该包是私有包，目前只由 Vite/Vitest 消费；未来出现其他消费方时再增加构建。
- **请求路径以 `/` 开头会绕过 `baseUrl`。** → 在文档中要求使用相对路径，并在包测试中覆盖 URL 解析。
- **代理 rewrite 假设 BFF 没有 `/api` 前缀。** → 将 rewrite 集中在 Vite 配置的一处；如果 BFF 增加全局前缀，再移除。
- **未来根目录环境模块可能选择不同的 API。** → 共享包不读取环境值，只有 admin 适配层中的一行代码依赖环境来源。
- **没有自动化的 Vite 代理测试。** → 除包单元测试外，用真实开发服务器请求验证代理。

## Migration Plan

1. 新增工作区包和依赖，然后安装。
2. 新增 admin 适配层、环境类型声明和 Vite 代理。
3. 新增包测试，并运行包和 admin 的检查。
4. 回滚时删除 admin 依赖以及适配层/代理改动；不涉及持久化数据或 API 迁移。
5. 根目录环境模块落地后，用该模块提供的类型化值替换 admin 适配层中的环境读取。共享包 API 保持不变。
