# Tasks

## 1. CI workflow

- [x] 1.1 创建 `.github/workflows/ci.yml`：在 `push` 到 `main`、`pull_request` 到 `main` 和 `workflow_dispatch` 时运行；使用 `ubuntu-latest`、`HUSKY=0`、`permissions: contents: read`、并发取消和每个 job 15 分钟超时；拆成四个并行 job：`static`（`pnpm lint` + `pnpm format:check`）、`types`（`pnpm check-types`）、`test`（`pnpm test`）、`build`（`pnpm build`）；每个 job 独立执行 `pnpm/action-setup`、`actions/setup-node`（含 pnpm 缓存）和 `pnpm install --frozen-lockfile`。验证方式：`pnpm dlx js-yaml .github/workflows/ci.yml >/dev/null` 退出 0；如可用再运行 `pnpm dlx actionlint`。
- [x] 1.2 在 `README.md` 或 `AGENTS.md` 说明 CI 的触发条件、四个 job 的执行内容、检查名称 `CI / static`、`CI / types`、`CI / test`、`CI / build`，以及在 GitHub Settings 中启用分支保护的步骤。验证方式：文档描述与 1.1 的 workflow 配置逐条一致。

## 2. Dependabot

- [x] 2.1 创建 `.github/dependabot.yml`：npm 与 GitHub Actions 两个 ecosystem，每周一检查；npm 使用 `cooldown.default-days: 3`，Actions 使用 7 天；minor/patch 分组，major 单独提出；忽略 `typescript` 的 major 更新。验证方式：`pnpm dlx js-yaml .github/dependabot.yml >/dev/null` 退出 0，并逐项核对 `cooldown`、`groups` 与 `ignore` 配置。
- [x] 2.2 在 `README.md` 或 `AGENTS.md` 说明依赖更新节奏、3/7 天等待期、分组规则和 TypeScript 主版本忽略策略。验证方式：文档描述与 2.1 的配置逐条一致。

## 3. Pull request 模板

- [x] 3.1 创建 `.github/PULL_REQUEST_TEMPLATE.md`，包含变更内容、影响范围（admin / web / bff / 共享包 / 工具链）、验证命令（`pnpm verify`、`pnpm build`）、OpenSpec change 关联和备注。验证方式：文件包含这些小节，且 `pnpm exec oxfmt --check .github/PULL_REQUEST_TEMPLATE.md` 退出 0。
- [x] 3.2 在 `README.md` 或 `AGENTS.md` 说明 PR 模板的位置和用途，以及影响范围与验证清单的要求。验证方式：文档指向的文件存在，且描述与 3.1 的模板一致。

## 4. 集成验证

- [x] 4.1 运行 `pnpm verify` 和 `pnpm build`，确认 lint、format:check、类型检查、测试和三个应用的构建全部通过。验证方式：两条命令退出 0，并记录结果；本地存在 env 文件，无 env 的 CI 构建留到首次推送时确认。
- [x] 4.2 运行 `pnpm dlx js-yaml .github/workflows/ci.yml >/dev/null`、`pnpm dlx js-yaml .github/dependabot.yml >/dev/null`、`pnpm exec oxfmt --check .github/PULL_REQUEST_TEMPLATE.md README.md AGENTS.md` 和 `openspec validate add-github-baseline --strict`。验证方式：全部命令退出 0。

## Verification log

- `pnpm dlx js-yaml .github/workflows/ci.yml`：退出 0，workflow YAML 可解析。
- `pnpm dlx js-yaml .github/dependabot.yml`：退出 0，Dependabot YAML 可解析。
- `pnpm verify`：23 个 Turbo 任务通过（lint、format:check、check-types、test）。
- `pnpm build`：admin、web、bff 三个应用构建通过。
- `pnpm exec oxfmt --check .github/PULL_REQUEST_TEMPLATE.md README.md AGENTS.md`：全部格式正确。
- `openspec validate add-github-baseline --strict`：`Change 'add-github-baseline' is valid`。
- actionlint 在本机不可用，未执行；GitHub workflow 的语义校验留到首次推送。
- 本地构建使用现有 env 文件；无 env 的 CI 构建留到首次推送时确认。

## Workflow follow-up

- 创建 GitHub 仓库并添加 remote，推送后观察第一次 CI；重点确认无 `.env` 文件时 `pnpm build` 使用默认值通过。
- 在 GitHub Settings → Branches/Rulesets 启用分支保护，要求 `CI / static`、`CI / types`、`CI / test`、`CI / build` 全部通过；启用 Dependabot。
- 归档前确认 CI、Dependabot 和 PR 模板的实际行为符合 `specs/developer-workflow/spec.md`。
- 归档该 change。
