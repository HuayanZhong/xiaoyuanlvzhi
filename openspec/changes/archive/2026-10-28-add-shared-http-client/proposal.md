# Proposal

## Why

admin 目前还没有 HTTP 请求边界。随着第一批真实接口接入，如果直接散落使用 `fetch`，就会重复维护 base URL、超时、重试和错误处理。工作区需要一个共享客户端包，先供 admin 使用，后续再由其他应用复用。

环境配置层会单独设计并放在仓库根目录，未来向三个应用辐射。本次变更必须提前预留这个边界，避免 HTTP 客户端直接读取环境变量，导致环境模块落地时还要重写客户端。

## What Changes

- 新增工作区包 `@repo/http-client`，基于 ky 提供薄封装客户端工厂。
- admin 新增环境适配层，从环境变量读取 base URL，默认值为 `/api/`。
- Vite 开发服务器新增 `/api` 到 BFF 5000 端口的代理，并去掉 `/api` 前缀。
- 共享包保持环境无关：只接收调用方传入的配置，不直接读取 `import.meta.env`、`process.env` 或 Nuxt runtime config。
- 新增包级测试，并同步更新仓库文档和 OpenSpec 项目上下文。
- 不修改 BFF 接口、认证、持久化或领域 API 行为。
- 本次不修改 web 和 BFF 应用。

## Capabilities

### New Capabilities

- `http-client`：共享 HTTP 客户端的配置、请求行为、错误传播，以及应用环境值注入的边界。

### Modified Capabilities

无。

## Impact

- 新增包：`packages/http-client`。
- 受影响应用：`apps/admin` 增加工作区依赖、HTTP 客户端适配层、环境类型声明和开发代理。
- 受影响工具链：根目录依赖锁文件和 workspace 元数据；如果新增面向库的 TypeScript 预设，也会涉及 `@repo/typescript-config`。
- 文档：更新 `AGENTS.md` 和 OpenSpec 项目上下文，删除“没有共享运行时包”和“admin 没有 API 层”的过时描述。
- 后续工作：根目录环境模块不在本次范围内；admin 适配层和配置契约就是为它预留的接入点。
