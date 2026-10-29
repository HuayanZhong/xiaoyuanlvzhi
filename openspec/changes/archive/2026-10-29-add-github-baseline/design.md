# Design

## Context

仓库已经有本地 husky 钩子和 `pnpm verify`，但没有 `.github/`，也没有 Git remote。CI 与依赖更新目前完全空白。参见 `proposal.md` 的 Why。

约束与事实：

- Node 由 `.nvmrc` 固定为 26.12.1，pnpm 由 `packageManager` 固定为 12.14.0。
- `pnpm verify` 已覆盖 lint、format:check、类型检查和测试；`pnpm build` 覆盖三个应用的构建。
- 根 `.env*` 不提交；各应用 schema 有默认值，dotenv 对缺失文件退出 0，因此 CI 不需要 secrets。
- pnpm 12 有 24 小时 `minimumReleaseAge`，依赖更新必须避开刚发布的版本。
- 没有部署目标；本次不引入 release/deploy。
- Oxc 仍是唯一的 lint/format 工具链；CI 只调用现有脚本。

## Goals / Non-Goals

**Goals:**

- 在 push/PR 时自动执行与本地一致的验证和构建。
- 用冻结锁文件保证 CI 安装可复现，并跳过钩子安装。
- 用 Dependabot 固定依赖更新节奏，避免与 `minimumReleaseAge` 冲突。
- 用 PR 模板固定影响范围和验证清单。
- 让主干合并依赖 CI 结果。

**Non-Goals:**

- 不引入 CodeQL、dependency review、issue 模板、CODEOWNERS 或 release/deploy workflow。
- 不增加 Windows CI job 或 Node 版本矩阵。
- 不上传覆盖率或构建产物。
- 不修改应用源码、BFF 接口、认证、持久化或共享包。
- 不在仓库文件中声明分支保护；该配置在 GitHub Settings 中手动完成。

## Decisions

### 1. 四个 Ubuntu job

`ci.yml` 拆成四个并行 job，每个 job 独立 checkout、安装并执行一项检查：

```
+--------------+  +--------------+  +--------+  +--------+
| static       |  | types        |  | test   |  | build  |
| lint         |  | check-types  |  | test   |  | build  |
| format:check |  |              |  |        |  |        |
+--------------+  +--------------+  +--------+  +--------+
```

- `static`：`pnpm lint` + `pnpm format:check`
- `types`：`pnpm check-types`
- `test`：`pnpm test`
- `build`：`pnpm build`

四个 job 都使用 `ubuntu-latest`，共享同一套触发、权限、并发与超时配置。每个 job 单独安装依赖，pnpm store 缓存抵消大部分重复成本；换来的是失败归属清晰和并行反馈。

备选：

- 单个 job 顺序执行全部步骤：安装复用最好，但失败定位差，且构建要等前面的检查跑完；不采用。
- 五个独立 job（lint、format:check、check-types、test、build）：粒度最细，但安装重复更多；当前规模收益不足。
- 按应用拆成 admin、web、bff job：应用归属更清楚，但共享包与根配置的检查容易漏，且需要额外的共享检查 job。
- `ubuntu` + `windows` 矩阵：能持续验证 Windows 行为，但成本翻倍；钩子已在本地 Windows 环境验证。
- 多 Node 版本矩阵：仓库只支持 Node 26，没有必要。

### 2. 复用现有脚本，不复制检查逻辑

CI 直接调用根脚本 `pnpm lint`、`pnpm format:check`、`pnpm check-types`、`pnpm test`、`pnpm build`，不重新拼接 Oxc/Vitest 命令。`pnpm verify` 保留为本地和 pre-push 的聚合入口，CI 按 job 拆分执行同一组任务。

- 每个 job 都使用 `pnpm install --frozen-lockfile`。
- job 级 `HUSKY=0`，让根 `prepare` 跳过钩子安装。
- 使用 `pnpm/action-setup` 读取 `packageManager`，`actions/setup-node` 读取 `.nvmrc`，并开启 pnpm 缓存。
- 暂不配置 Turbo 远程缓存；当前 `verify` 冷跑约 10 秒，构建规模也小，先保持简单。

### 3. 触发、权限与并发

- 触发：`push` 到 `main`、`pull_request` 到 `main`、`workflow_dispatch`。
- `permissions: contents: read`，不授予写权限。
- `concurrency` 以 workflow + ref 分组，取消同一分支的旧运行。
- 每个 job 的 `timeout-minutes: 15`，防止 Nuxt/Nest 构建卡死占用额度。

`push` 只覆盖 `main` 而不是所有分支：功能分支通过 PR 触发；如果之后需要每次 push 都验证，再扩展触发范围。

### 4. Dependabot 而不是 Renovate

使用原生 Dependabot，减少一个需要安装的 GitHub App。

- npm 与 GitHub Actions 两个 ecosystem，每周一运行。
- npm 更新 `cooldown: default-days: 3`，Actions 更新 7 天：既避开 `minimumReleaseAge`，也避免刚发布版本的假失败。
- minor/patch 分组，major 单独 PR；`typescript` 的 major 更新忽略，因为工作区已通过 override 锁定 TypeScript 6。
- 每个更新 PR 都走同一套 CI。

备选 Renovate：对 `minimumReleaseAge` 和分组更灵活，但需要安装 App 和维护额外配置；当前需求用 Dependabot 足够。如果 Dependabot 不能正确处理 pnpm 12 的 lockfile，再迁移到 Renovate。

### 5. PR 模板

`.github/PULL_REQUEST_TEMPLATE.md` 使用中文清单：

- 变更内容
- 影响范围（admin / web / bff / 共享包 / 工具链）
- 验证（`pnpm verify`、`pnpm build`、相关测试或手动验证）
- OpenSpec change 关联
- 备注

模板只做提醒，不引入自动检查；PR 标题或 commitlint 的 CI 门禁留到后续。

### 6. Action 版本与供应链

先用 `actions/checkout@v4`、`pnpm/action-setup@v4`、`actions/setup-node@v4` 的主版本标签，维护成本低，Dependabot 可以更新。

如果之后更重视供应链安全，再固定到 commit SHA，并让 Dependabot 继续更新。当前没有部署或写权限，主版本标签的风险可接受。

### 7. 环境与 secrets

CI 不提交 `.env`，也不读取 secrets。三个应用的 schema 默认值覆盖端口与 API base URL，构建按生产模式使用默认值。

若以后需要把真实 API 地址烘焙进前端产物，再在 workflow 或 repository variables 中提供 `API_BASE_URL`；本次不提前引入。

### 8. 分支保护

分支保护不是仓库文件，需要在 GitHub Settings → Branches/Rulesets 中配置：

- 要求 `CI / static`、`CI / types`、`CI / test`、`CI / build` 全部通过后才能合并到 `main`。
- 是否要求 PR review 取决于是否有协作者。
- 是否禁止 force push / 要求线性历史同样按团队习惯决定。

文档中会给出检查名称和配置位置，避免启用后不知道要选哪个检查。

### 9. 不变项

- 不修改 `tsconfig`、Vitest 配置、覆盖率 `include` 路径或 Turbo 任务输入。
- 不修改 admin、web、bff 之间的数据流；BFF 接口不变。
- 不新增跨应用导入或共享运行时包。
- 共享包仍不访问环境变量；环境读取保持在应用适配层。

## Risks / Trade-offs

- **没有 Git remote，workflow 无法在本地完整验证** → 推送后用 draft PR 试跑；本地可用 actionlint 校验 YAML。
- **无 env 文件构建首次失败** → 先确认 `pnpm build` 在 CI 的默认值路径；必要时在 workflow 中显式设置 `API_BASE_URL`，或从 `.env.example` 生成最小 `.env`。
- **Dependabot 对 pnpm 12 lockfile 的支持** → 先观察首批 PR；若无法解析，迁移到 Renovate。
- **Dependabot 更新早于 `minimumReleaseAge`** → 3/7 天 cooldown；若仍失败，再增加等待天数。
- **Action 主版本标签的供应链风险** → 只读权限、无 secrets；需要时改为 SHA 固定。
- **多 job 重复安装** → 每个 job 都有自己的安装步骤；pnpm store 缓存降低重复成本，当前规模可接受。
- **分支保护是手动配置** → 文档写明检查名称；未启用时 CI 仍会运行，但不会阻止合并。
- **PR 模板可能被忽略** → 模板只做提醒；真正的门禁仍是 CI。

## Migration Plan

1. 新增 `.github/workflows/ci.yml`、`.github/dependabot.yml`、`.github/PULL_REQUEST_TEMPLATE.md`。
2. 在本地校验 workflow YAML 结构；若可用，运行 actionlint。
3. 创建 GitHub 仓库并添加 remote，推送后观察第一次 CI；重点确认 `pnpm build` 在无 `.env` 文件时通过。
4. 在 GitHub Settings 启用分支保护，要求 `CI / static`、`CI / types`、`CI / test`、`CI / build` 全部通过；Dependabot 会自动开始按周检查。
5. 回滚：删除三个文件；在 GitHub 关闭 Dependabot 与分支保护。应用运行时行为不受影响。
