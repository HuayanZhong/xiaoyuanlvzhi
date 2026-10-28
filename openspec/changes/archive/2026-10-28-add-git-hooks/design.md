# Design

## Context

当前仓库只有手动质量命令：`pnpm lint`、`pnpm format:check`、`pnpm check-types`、`pnpm test`。它们通过 Turbo 缓存，基线全绿；但没有 Git 钩子，也没有 CI，因此没有任何强制点。参见 `proposal.md` 的 Why。

约束：

- Oxc 是唯一的 lint/format 工具链，不引入 ESLint、Prettier 或第二套格式化工具。
- pnpm 12 有 `minimumReleaseAge` 与 `allowBuilds` 约束；新增依赖必须是精确版本。
- 开发环境包含 Windows Git Bash；`.gitattributes` 已统一 LF。
- 根目录文档和配置没有被 `turbo run format:check` 覆盖，因为 Turbo 只运行 workspace 包内的任务。
- 三个应用与 BFF 的运行时代码不需要改动；钩子只影响本地开发流程。

## Goals / Non-Goals

**Goals:**

- 在提交、提交信息和推送三个节点提供本地质量门禁。
- 提交前检查只影响暂存内容，自动修复可修复的问题。
- 推送前的验证覆盖整个工作区，且复用现有 Turbo 任务与缓存。
- 在 Windows Git Bash 与 POSIX 上行为一致。
- 让安装、绕过和排障方式有文档可循。

**Non-Goals:**

- 不修改 `apps/admin`、`apps/web`、`apps/bff` 的运行时代码或 BFF 接口。
- 不引入 CI；CI 留作后续变更。
- 不把测试覆盖率作为推送门禁。
- 不替换 Oxc，也不引入第二套 lint/format 工具。
- 不改变应用之间的数据流或共享包边界。

## Decisions

### 1. 选择 husky 作为钩子管理器

使用 husky 9.1.7。它在 Node/pnpm 仓库中是事实标准，hook 是普通 shell 脚本，包本身没有安装脚本，不需要修改 `allowBuilds`。

备选：

- lefthook：单二进制、并行执行，但引入 YAML 配置和平台二进制安装，当前规模收益不足。
- simple-git-hooks：更轻，但生态和复杂钩子的组织能力不如 husky。
- 原生 `core.hooksPath`：零依赖，但需要自己实现安装、路径和跨平台兼容，等于重造 husky。

### 2. 三个钩子分层

```
pre-commit  -> 只检查暂存文件，自动修复可修复问题
commit-msg  -> 校验提交信息结构
pre-push    -> 全工作区 lint + format:check + check-types + test
```

提交前保持快，推送前保持完整。这样既不会让提交被未暂存的 WIP 阻塞，也不会让未经完整验证的提交进入远端。

### 3. pre-commit 使用 lint-staged，而不是全工作区 Turbo

`lint-staged` 只处理暂存文件，自动修复后重新暂存；它会把未暂存改动 stash 起来，因此检查结论只反映本次提交的内容。全工作区 `turbo run lint` 会受未暂存 WIP 影响，且不会自动修复。

配置放在根 `package.json`：

```json
"lint-staged": {
  "**/*.{js,jsx,ts,tsx,vue}": [
    "oxlint --fix --deny-warnings",
    "oxfmt"
  ],
  "**/*.{json,jsonc,css,md}": ["oxfmt"]
}
```

要点：

- 先 `oxlint --fix`，再 `oxfmt`，避免 lint 修复产生新的格式差异。
- `lint-staged` 只负责挑选暂存文件；真正的 lint/format 仍由 Oxc 完成，不构成第二套工具链。
- 不使用 `*.yaml` / `*.yml`：实测 oxfmt 不支持 YAML，对 `pnpm-workspace.yaml` 退出码为 2，加入 glob 会误拦依赖更新提交。
- 根目录的 `README.md`、`AGENTS.md` 等文档会进入暂存检查，弥补 Turbo 不覆盖根文件的缺口。
- `lint-staged` 的命令在仓库根目录执行，Oxlint 自动发现根 `.oxlintrc.json`，Oxfmt 自动发现根 `.oxfmtrc.json`。

### 4. commit-msg 使用 commitlint

配置 `commitlint.config.mjs`：

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
```

要点：

- 继承 conventional commits 的 type 集合与 header 结构。
- 不设置 scope 白名单；中文 scope 与中文 subject 可以通过。
- 关闭 body/footer 行宽限制，避免中文段落按字符计数时被误伤；header 仍限制 100 字符。
- Merge、Revert、fixup 等由 commitlint 默认忽略，不额外维护例外规则。
- 历史中的长提交不会被重新检查，只影响新提交。

### 5. pre-push 使用单一 `verify` 脚本

根 `package.json` 增加：

```json
"verify": "turbo run lint format:check check-types test --ui=stream"
```

`pre-push` 只调用 `pnpm verify`。

要点：

- 一次 Turbo 调用覆盖四个任务，复用已有任务图和缓存。
- `--ui=stream` 避免 hook 在 TTY 下进入 Turbo 的交互式 TUI。
- 不运行 `test:coverage`，覆盖率不是推送门禁。
- 实测当前 lint、format:check、check-types 缓存命中约 37-40ms，测试冷跑约 5s，完整验证成本可接受。

### 6. 安装与绕过

根 `package.json` 增加 `"prepare": "husky"`。`pnpm install` 时自动创建 `.husky/_` 并设置仓库级 `core.hooksPath`。husky 自身的 `_` 目录带有内部 `.gitignore`，不需要修改根 `.gitignore`。

- 使用严格的 `husky`，不写 `husky || true`，避免吞掉真实安装错误。
- CI/Docker 无 `.git` 时通过 `HUSKY=0` 跳过安装。
- 提交者可用 `--no-verify` 绕过；文档明确说明绕过会跳过哪些检查。
- 暂不提供"跳过钩子"的脚本，避免把绕过变成常规路径。

### 7. 版本与 pnpm 策略

根 `devDependencies` 使用精确版本：

| 包                                | 版本   | 发布日     |
| --------------------------------- | ------ | ---------- |
| `husky`                           | 9.1.7  | 2024-11-18 |
| `lint-staged`                     | 17.6.0 | 2026-09-26 |
| `@commitlint/cli`                 | 21.2.4 | 2026-10-18 |
| `@commitlint/config-conventional` | 21.2.4 | 2026-10-18 |

四个版本都超过 pnpm 的 24 小时 `minimumReleaseAge`，不需要加入 `minimumReleaseAgeExclude`。它们没有安装脚本，不需要加入 `allowBuilds`。`lint-staged` 要求 Node `>=22.22.1`，commitlint 要求 `>=22.12.0`，当前 Node 26.12.1 满足。

### 8. 跨平台与 Windows

- `.gitattributes` 已统一 LF，hook 脚本保持 LF。
- 提交时确认 `.husky/pre-commit`、`commit-msg`、`pre-push` 在 Git 索引中的模式；必要时用 `git add --chmod=+x`，保证 POSIX 克隆后可执行。
- Windows Git Bash 下 husky 的 shim 通过 `sh` 调用用户 hook。
- GUI Git 客户端可能没有继承 pnpm 的 PATH。文档给出排障方式；若实际频繁失败，可把 hook 内的调用改为 `node_modules/.bin/` 下的本地二进制，只依赖 Node。
- `pre-push` 的 `--ui=stream` 同时规避 TTY 与非 TTY 差异。

### 9. 不变项

- `turbo.json` 不修改；`verify` 复用现有任务。
- `tsconfig`、Vitest 配置、覆盖率 `include` 路径不修改。
- 共享包不访问环境变量；本次变更不涉及共享包。
- admin、web、bff 之间没有新增数据流；BFF 接口不变。

## Risks / Trade-offs

- **GUI Git 客户端找不到 pnpm** → 文档说明 PATH 要求；必要时改用 `node_modules/.bin/` 调用。
- **Turbo TUI 干扰 hook 输出** → `verify` 固定 `--ui=stream`。
- **无 `.git` 环境安装失败** → CI/Docker 设置 `HUSKY=0`；本地保持严格安装。
- **commitlint 拦截长提交** → 文档要求一次提交只表达一件事；历史提交不受影响。
- **lint-staged stash 在大量改动时变慢** → 当前仓库规模小，可接受；若未来变慢，可将 pre-commit 改为 `turbo run lint` 的暂存子集方案。
- **钩子可被 `--no-verify` 绕过** → 这是有意的逃生口；没有 CI 时不能把钩子当作绝对门禁，后续可补 CI。
- **YAML 文件被格式化器误拦** → glob 明确排除 YAML。
- **分支切换后 `core.hooksPath` 指向不存在的目录** → 切回含钩子的分支后重新执行 `pnpm install` 或 `husky`。
- **中文提交信息编码问题** → Git 默认使用 UTF-8；若客户端异常，设置 `i18n.commitEncoding=utf-8`。

## Migration Plan

1. 在根 `package.json` 增加四个开发依赖、`prepare` 和 `verify` 脚本，执行 `pnpm install`。
2. 增加 lint-staged 配置与 `commitlint.config.mjs`。
3. 创建 `.husky/pre-commit`、`.husky/commit-msg`、`.husky/pre-push`，确认 LF 与可执行位。
4. 更新 `AGENTS.md`、`README.md` 的钩子说明与排障方式。
5. 按 spec 场景逐项验证：自动修复、无法修复时拦截、提交信息拦截、推送前拦截、`--no-verify` 绕过、`HUSKY=0` 安装。
6. 回滚：删除 `.husky/` 和新增配置，移除 `prepare`/`verify` 脚本与依赖，并执行 `git config --unset core.hooksPath`。
