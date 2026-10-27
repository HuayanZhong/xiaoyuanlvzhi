# Tasks

## 1. `@repo/http-client` 共享包

- [x] 1.1 新增 `packages/typescript-config/library.json`，并在 `packages/http-client` 建立 `package.json`、`tsconfig.json`、`vitest.config.ts` 和 `src/index.ts` 骨架；运行 `pnpm install` 与 `pnpm --filter @repo/http-client format:check`，确认依赖安装和包结构可用。
- [x] 1.2 在 `packages/http-client` 实现 `createHttpClient`：归一化 base URL、默认 15 秒超时和两次重试、透传 ky 选项，并再导出 ky 错误类型和类型守卫；运行 `pnpm --filter @repo/http-client lint`、`pnpm --filter @repo/http-client check-types`、`pnpm --filter @repo/http-client format:check`，确认全部通过。
- [x] 1.3 在 `packages/http-client/tests` 增加测试，覆盖相对路径与末尾斜杠、默认值和调用方覆盖、HTTP 错误、网络/超时错误、成功响应不解包业务包络；运行 `pnpm --filter @repo/http-client test` 与 `pnpm --filter @repo/http-client test:coverage`，确认测试通过并生成覆盖率报告。
- [x] 1.4 在共享包的公开 API 上补充中文 JSDoc，说明相对路径用法、环境无关约束和错误模型；运行 `pnpm --filter @repo/http-client format:check` 与 `pnpm --filter @repo/http-client check-types`，确认注释不破坏构建和类型检查。

## 2. `admin` 应用接入

- [x] 2.1 在 `apps/admin/package.json` 增加 `@repo/http-client: workspace:*`，新增 `src/vite-env.d.ts` 声明 `VITE_API_BASE_URL`；运行 `pnpm install` 与 `pnpm --filter admin check-types`，确认依赖和类型声明生效。
- [x] 2.2 新增 `apps/admin/src/lib/http.ts`，提供可测试的 `resolveApiBaseUrl`（读取 `VITE_API_BASE_URL`，缺省为 `/api/`）并创建 `http` 实例；新增 `apps/admin/tests/unit/http.test.ts` 覆盖默认值和自定义值；运行 `pnpm --filter admin test`、`pnpm --filter admin lint`、`pnpm --filter admin check-types`，确认全部通过。
- [x] 2.3 在 `apps/admin/vite.config.ts` 增加 `/api` 到 `http://localhost:5000` 的开发代理并去掉 `/api` 前缀；运行 `pnpm --filter admin build`，确认 Vite 配置可正常构建。
- [x] 2.4 在 `apps/admin` 中确认没有新增直接读取环境变量的业务代码，环境读取只存在于 `src/lib/http.ts`；运行 `rg "import\.meta\.env|process\.env" apps/admin/src` 并核对输出，确认边界符合设计。

## 3. 项目文档与 OpenSpec 上下文

- [x] 3.1 更新 `AGENTS.md` 的包列表、admin 架构说明和单包验证命令，补充 `@repo/http-client`、`/api` 代理以及“共享包不读取环境变量”的约束；运行 `rg "no shared runtime|no API layer|two config-only" AGENTS.md`，确认旧描述已清除。
- [x] 3.2 更新 `openspec/config.yaml` 的 `context`，说明共享运行时包、admin 代理和预留的 `apiBaseUrl` 环境边界，同时保留“没有认证、持久化和领域 API”的约束；运行 `openspec context --json` 与 `openspec doctor --json`，确认配置可解析且状态健康。

## 4. 集成验证

- [x] 4.1 启动 BFF 和 admin 开发服务器，请求 `http://localhost:3000/api/health`，确认返回 `{"status":"ok"}`，验证代理路径和 `/api` 前缀去除均生效。
- [x] 4.2 在根目录运行 `pnpm lint`、`pnpm check-types`、`pnpm test`、`pnpm test:coverage`，确认所有包和应用的检查、类型、测试与覆盖率任务通过。

## Workflow follow-up

- 经用户确认后运行 `/opsx:archive` 归档本变更。
- 归档后核对主规格和归档摘要中的验证命令及结果。
