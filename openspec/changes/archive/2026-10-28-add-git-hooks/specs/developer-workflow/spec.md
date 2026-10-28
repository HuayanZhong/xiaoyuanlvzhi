# Spec Delta

## Purpose

让开发者在提交和推送前自动获得格式、lint、类型、测试与提交信息的一致反馈，避免问题进入远端，并让钩子的安装与绕过行为有明确契约。

## ADDED Requirements

### Requirement: 暂存文件质量门禁

提交时，钩子 SHALL 只针对暂存文件执行格式与 lint 检查。可自动修复的格式或 lint 问题 SHALL 被修复并写入暂存内容；修复后仍存在错误或警告时 MUST 阻止提交。未暂存的工作区改动 MUST NOT 影响检查结论，也 MUST NOT 因钩子失败而丢失。

#### Scenario: 自动修复可修复的问题

- **WHEN** 暂存文件存在可自动修复的格式或 lint 问题
- **THEN** 钩子修复这些文件、更新暂存内容，并允许提交继续

#### Scenario: 无法修复时阻止提交

- **WHEN** 暂存文件存在无法自动修复的 lint 错误或警告
- **THEN** 提交被拒绝，且工作区内容不被丢弃

#### Scenario: 未暂存改动不阻塞提交

- **WHEN** 工作区存在未暂存的格式或 lint 问题
- **THEN** 提交只按暂存内容判断，不被未暂存改动阻塞

### Requirement: 提交信息格式

提交信息 SHALL 使用 `<type>(<scope>): <subject>` 或 `<type>: <subject>` 结构。`type` MUST 属于 feat、fix、docs、style、refactor、perf、test、build、ci、chore、revert；`scope` 可为空或使用中文/英文，不设白名单；`subject` 可为中文；header MUST NOT 超过 100 个字符。Merge、Revert、fixup 等自动生成的提交 MUST 跳过校验。

#### Scenario: 合法的中文提交信息

- **WHEN** 提交信息为 `feat(pnpm): 添加构建支持`
- **THEN** 提交信息校验通过

#### Scenario: 缺少或使用未知 type

- **WHEN** 提交信息缺少 type，或 type 不在允许集合内
- **THEN** 提交被拒绝

#### Scenario: header 过长

- **WHEN** 提交信息的 header 超过 100 个字符
- **THEN** 提交被拒绝

#### Scenario: 自动生成的提交

- **WHEN** 提交由 merge、revert 或 fixup 自动生成
- **THEN** 提交信息校验被跳过，提交允许继续

### Requirement: 推送前完整验证

推送前，钩子 SHALL 在仓库根目录执行全工作区 lint、format:check、类型检查和测试。任一检查失败 MUST 阻止推送。验证 MUST 覆盖所有参与工作区的包和应用，且 MUST NOT 以缓存命中为由跳过任何包。

#### Scenario: 全部检查通过

- **WHEN** lint、format:check、类型检查和测试全部通过
- **THEN** 推送继续

#### Scenario: 类型检查失败

- **WHEN** 任一参与包的类型检查失败
- **THEN** 推送被拒绝

#### Scenario: 测试失败

- **WHEN** 任一参与包的测试失败
- **THEN** 推送被拒绝

### Requirement: 钩子安装与绕过

在仓库根目录完成依赖安装后，`pre-commit`、`commit-msg`、`pre-push` 三个钩子 SHALL 自动注册。无 `.git` 的 CI/Docker 环境 MUST 可通过 `HUSKY=0` 跳过安装。提交者 MUST 可通过 `--no-verify` 绕过钩子；文档 SHALL 说明绕过会跳过哪些检查。

#### Scenario: 安装后自动注册

- **WHEN** 新克隆仓库后在仓库根目录执行 `pnpm install`
- **THEN** 三个钩子完成注册

#### Scenario: 在无 Git 环境跳过安装

- **WHEN** 设置 `HUSKY=0` 后执行安装
- **THEN** 钩子安装被跳过且不报错

#### Scenario: 显式绕过钩子

- **WHEN** 提交者使用 `git commit --no-verify`
- **THEN** 提交前检查被跳过

### Requirement: 跨平台执行一致性

钩子 SHALL 在 Windows Git Bash 与 POSIX 环境执行相同的检查。钩子脚本 MUST 以 LF 存储在仓库中；在支持 POSIX 可执行位的平台上，钩子脚本 MUST 保持可执行。

#### Scenario: Windows 与 POSIX 行为一致

- **WHEN** 在 Windows Git Bash 中提交或推送
- **THEN** 执行的检查与 POSIX 环境一致

#### Scenario: POSIX 克隆后可执行

- **WHEN** 在 Linux 或 macOS 上克隆仓库并完成安装
- **THEN** 钩子脚本保持可执行并正常触发
