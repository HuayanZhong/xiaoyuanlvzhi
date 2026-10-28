# Proposal

## Why

仓库已经有本地钩子和 `pnpm verify`，但这些门禁可以被 `--no-verify` 绕过，也没有远端 CI 在 push/PR 时自动执行。依赖更新目前完全手动，PR 也缺少统一的影响范围和验证清单。把这些流程固定到 GitHub，可以让主干始终经过安装、校验、构建和依赖更新检查。

## What Changes

- 新增 `.github/workflows/ci.yml`：在 push 到 `main`、针对 `main` 的 pull request 以及手动触发时，执行冻结锁文件安装，并拆成四个 job 分别运行 lint、format:check、类型检查、测试和构建。
- 新增 `.github/dependabot.yml`：每周检查 npm 与 GitHub Actions 更新；npm 更新等待 3 天、Actions 更新等待 7 天，以避开 pnpm 的 `minimumReleaseAge`；minor/patch 分组，major 单独处理，并忽略 TypeScript 的 major 更新。
- 新增 `.github/PULL_REQUEST_TEMPLATE.md`：提供变更内容、影响范围、验证命令和 OpenSpec change 关联的检查清单。
- 更新 `developer-workflow` capability：补充远端 CI 的触发、运行环境和验证要求，以及依赖更新节奏。
- **BREAKING（开发流程）**：启用分支保护后，`main` 的合并将要求 CI 通过；这是流程增强，不改变应用运行时行为。
- 不修改 `apps/admin`、`apps/web`、`apps/bff` 的源码，不修改 BFF 接口，不涉及认证、持久化或共享包。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `developer-workflow`: 新增远端 CI 与依赖更新相关的要求，包括 CI 触发与运行环境、CI 验证与构建、依赖更新节奏。

## Impact

- 新增 `.github/workflows/ci.yml`、`.github/dependabot.yml`、`.github/PULL_REQUEST_TEMPLATE.md`。
- 不修改 `package.json`、`pnpm-lock.yaml` 或任何应用源码；不新增依赖。
- CI 使用仓库已固定的 Node 26.12.1 与 pnpm 12.14.0，不需要提交环境文件或 secrets。
- GitHub 设置需要手动启用分支保护并要求 CI 检查通过；该配置不在仓库文件中。
- 不影响 BFF 接口、认证、持久化或共享包边界。
