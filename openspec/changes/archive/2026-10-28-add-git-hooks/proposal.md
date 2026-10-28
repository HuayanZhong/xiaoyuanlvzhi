# Proposal

## Why

仓库目前只有手动执行的 lint、format、类型检查和测试命令，没有 Git 钩子，也没有 CI。格式、lint、类型或测试问题只能靠提交者自觉，提交信息也缺少统一约束；等问题在推送或评审时才暴露，返工成本更高。当前工作区基线全绿，适合把本地质量门禁固定下来。

## What Changes

- 引入 husky 管理 `pre-commit`、`commit-msg`、`pre-push` 三个本地 Git 钩子。
- `pre-commit` 只检查暂存文件：自动修复格式和可修复的 lint 问题，无法修复时阻止提交。
- `commit-msg` 校验 conventional commits 格式；允许中文 subject 和 scope，忽略 Merge、Revert 等自动提交。**BREAKING（开发流程）**：新的提交信息必须符合该格式，历史提交不受影响。
- `pre-push` 在推送前运行完整工作区校验：lint、format:check、类型检查和测试；失败时阻止推送。**BREAKING（开发流程）**：推送前必须通过完整校验。
- 更新 `AGENTS.md` 和 `README.md`，说明钩子行为、绕过方式（`--no-verify`、`HUSKY=0`）以及 Windows 下的排障方式。
- 不修改三个应用的运行时代码、BFF 接口、认证、持久化或共享包。

## Capabilities

### New Capabilities

- `developer-workflow`: 定义本地 Git 钩子的长期行为，包括提交前检查、提交信息格式、推送前验证，以及安装与绕过约定。

### Modified Capabilities

无。

## Impact

- 根 `package.json`：新增开发依赖、`prepare` / `verify` 脚本和 lint-staged 配置。
- 新增 `.husky/` 钩子目录和 commitlint 配置。
- `AGENTS.md`、`README.md`：补充开发流程说明。
- 新增开发依赖：husky、lint-staged、`@commitlint/cli`、`@commitlint/config-conventional`；均使用精确版本，并满足 pnpm 的 `minimumReleaseAge` 策略。
- 不影响 `apps/admin`、`apps/web`、`apps/bff` 的源码，不修改 BFF 接口，不涉及认证、持久化或共享包。
- 破坏性变更仅限开发流程，生产运行时行为不变。
