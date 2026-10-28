# Tasks

## 1. 依赖与根脚本

- [x] 1.1 在根 `package.json` 增加精确版本 `husky` 9.1.7、`lint-staged` 17.6.0、`@commitlint/cli` 21.2.4、`@commitlint/config-conventional` 21.2.4；执行 `pnpm install`，确认没有 `minimumReleaseAge` 或 `allowBuilds` 报错，且 `node_modules/.bin/husky`、`node_modules/.bin/lint-staged`、`node_modules/.bin/commitlint` 存在。
- [x] 1.2 增加 `"prepare": "husky"`；执行 `pnpm install`，确认 `.husky/_` 生成且 `git config core.hooksPath` 输出 `.husky/_`。
- [x] 1.3 增加 `"verify": "turbo run lint format:check check-types test --ui=stream"`；执行 `pnpm verify`，确认四个任务全部成功，且输出为流式日志而不是交互式 TUI。

## 2. pre-commit 暂存检查

- [x] 2.1 在根 `package.json` 增加 lint-staged 配置：`**/*.{js,jsx,ts,tsx,vue}` 依次执行 `oxlint --fix --deny-warnings`、`oxfmt`；`**/*.{json,jsonc,css,md}` 执行 `oxfmt`；不包含 YAML。验证方式：暂存一个格式错误的 `.ts` 临时文件，执行 `pnpm exec lint-staged`，确认文件被修复且修复内容进入暂存区；随后清理临时文件与暂存状态。
- [x] 2.2 创建 `.husky/pre-commit`（内容为 `pnpm exec lint-staged`），确认 LF 与可执行位。验证方式：暂存一个可自动修复的文件，执行 `sh .husky/pre-commit`，确认退出 0、文件被修复并重新暂存；再暂存一个无法修复的 lint 错误，执行同一命令，确认退出非 0 且工作区内容保留；随后清理。
- [x] 2.3 在 `AGENTS.md` 或 `README.md` 补充 pre-commit 行为：只检查暂存文件、自动修复可修复问题、未暂存改动不影响检查结论。验证方式：文档描述与 2.1、2.2 的实际行为逐条一致。

## 3. commit-msg 提交信息校验

- [x] 3.1 创建 `commitlint.config.mjs`，继承 `@commitlint/config-conventional` 并关闭 body/footer 行宽限制。验证方式：`printf 'feat(pnpm): 添加构建支持\n' | pnpm exec commitlint` 退出 0；`printf 'update stuff\n' | pnpm exec commitlint` 退出非 0；`printf 'Merge branch main\n' | pnpm exec commitlint` 退出 0。
- [x] 3.2 创建 `.husky/commit-msg`（内容为 `pnpm exec commitlint --edit "$1"`），确认 LF 与可执行位。验证方式：用临时消息文件执行 `sh .husky/commit-msg <file>`，确认合法消息通过、缺少 type 或 header 超过 100 字符的消息被拒；随后删除临时文件。
- [x] 3.3 在 `AGENTS.md` 或 `README.md` 补充提交信息规则：允许的 type、中文 subject/scope、header ≤100 字符、merge/revert 例外、一次提交只表达一件事。验证方式：文档中的示例消息可通过 3.1 的 commitlint 命令。

## 4. pre-push 完整验证

- [x] 4.1 创建 `.husky/pre-push`（内容为 `pnpm verify`），确认 LF 与可执行位。验证方式：执行 `sh .husky/pre-push` 退出 0；临时制造一个类型错误或失败测试，再次执行确认退出非 0，然后还原改动。
- [x] 4.2 在 `AGENTS.md` 或 `README.md` 补充 pre-push 行为：运行 lint、format:check、类型检查和测试，不包含覆盖率；说明 `--no-verify` 会跳过哪些检查。验证方式：文档中的命令可直接执行。

## 5. 安装、绕过与跨平台

- [x] 5.1 验证 `HUSKY=0 pnpm run prepare` 退出 0，且不会重新设置钩子；确认 CI/Docker 可用该方式跳过安装。
- [x] 5.2 确认三个钩子脚本为 LF：`git check-attr eol .husky/pre-commit` 输出 `lf`。提交该变更时使用 `git add --chmod=+x`，并用 `git ls-files -s` 确认三个钩子模式为 `100755`。
- [x] 5.3 在 `AGENTS.md` 或 `README.md` 补充 Windows 排障：Git Bash、pnpm PATH、GUI 客户端找不到命令时改用 `node_modules/.bin/` 的备用方式。验证方式：按文档步骤可在当前 Windows 环境复现。

## 6. 集成验证

- [x] 6.1 运行 `pnpm verify`，确认 lint、format:check、check-types、test 四个任务全部通过。
- [x] 6.2 逐项核对 `specs/developer-workflow/spec.md` 的场景：自动修复后允许提交、无法修复时拦截、未暂存改动不阻塞、合法/非法提交信息、merge/revert 忽略、推送前四项失败拦截、`--no-verify` 绕过、`HUSKY=0` 安装；记录执行的命令与结果。
- [x] 6.3 运行 `openspec validate add-git-hooks --strict`，确认 proposal、spec、design、tasks 均通过校验。

## Verification log

- `pnpm install`：新增依赖安装成功；`node_modules/.bin/husky`、`node_modules/.bin/lint-staged`、`node_modules/.bin/commitlint` 均存在。
- `pnpm run prepare`：`.husky/_` 生成，`git config core.hooksPath` 输出 `.husky/_`。`pnpm install` 在依赖已是最新时不会重复执行 `prepare`，需要时显式运行该命令。
- `pnpm verify`：23 个 Turbo 任务全部通过（lint、format:check、check-types、test）。
- `pnpm exec lint-staged` / `sh .husky/pre-commit`：暂存的可修复文件被格式化并重新暂存；无法修复的 lint 错误使 hook 退出 1，工作区内容保留；未暂存的 lint 错误不影响结果（退出 0）。
- `commitlint`：`feat(pnpm): 添加构建支持` 通过；`update stuff` 退出 1；`Merge`、`Revert`、`fixup!`、`squash!`、`amend!` 均通过。
- 实际 `git commit` 集成：`git commit --allow-empty -m "bypass check"` 被 commit-msg 拦截（退出 1）；`git commit --allow-empty --no-verify -m "bypass check"` 成功，随后用 `git reset --soft HEAD~1` 撤销测试提交。
- `sh .husky/pre-push`：基线退出 0；临时类型错误退出 2；临时失败测试退出 1；临时文件均已删除。
- `HUSKY=0 pnpm run prepare`：退出 0，未设置 `core.hooksPath`；随后恢复正常安装并恢复 `.husky/_`。
- `git check-attr eol`：三个钩子均为 `lf`；`git ls-files -s` 均为 `100755`。
- `node_modules/.bin/lint-staged`、`node_modules/.bin/commitlint`、`node_modules/.bin/turbo`：Windows 备用路径均可用。

## Workflow follow-up

- Archive the change after all tasks and the project's review requirements are satisfied.
- Verify the archived spec and change state after archive.
