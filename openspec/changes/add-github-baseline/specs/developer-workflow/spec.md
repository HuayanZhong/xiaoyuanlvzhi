# Spec Delta

## ADDED Requirements

### Requirement: 远端 CI 触发与运行环境

远端 CI SHALL 在推送到 `main`、针对 `main` 的 pull request 以及手动触发时运行。CI MUST 使用仓库固定的 Node 与 pnpm 版本，以冻结锁文件安装依赖，并跳过 Git 钩子安装。CI MUST 以只读内容权限运行，并取消同一分支上已被取代的运行。

#### Scenario: 自动触发

- **WHEN** 推送提交到 `main` 或打开针对 `main` 的 pull request
- **THEN** CI workflow 自动启动

#### Scenario: 手动触发

- **WHEN** 手动触发 workflow
- **THEN** CI 使用与自动触发相同的安装和验证步骤

#### Scenario: 可复现的安装

- **WHEN** CI 安装依赖
- **THEN** 使用冻结锁文件，并以 `HUSKY=0` 跳过钩子安装

#### Scenario: 取消过期运行

- **WHEN** 同一分支上新的运行开始
- **THEN** 该分支上已被取代的旧运行被取消

### Requirement: CI 验证与构建

CI SHALL 执行 lint、format:check、类型检查和测试，并构建 admin、web、bff 三个应用。任一检查或构建失败 MUST 使 workflow 失败；启用分支保护后，失败的 CI MUST 阻止合并到 `main`。CI 构建 MUST 在没有提交环境文件时使用应用 schema 默认值完成。

#### Scenario: 全部通过

- **WHEN** lint、format:check、类型检查、测试和三个应用的构建全部通过
- **THEN** workflow 成功

#### Scenario: 检查失败

- **WHEN** lint、format:check、类型检查或测试任一失败
- **THEN** workflow 失败

#### Scenario: 构建失败

- **WHEN** admin、web 或 bff 任一应用构建失败
- **THEN** workflow 失败

#### Scenario: 无环境文件构建

- **WHEN** 仓库没有提交环境文件
- **THEN** CI 构建使用应用 schema 默认值完成，不需要 secrets

#### Scenario: 阻止失败合并

- **WHEN** 分支保护要求 CI 检查通过
- **THEN** CI 失败的 pull request 不能合并到 `main`

### Requirement: 依赖更新节奏

依赖更新 SHALL 每周检查 npm 依赖与 GitHub Actions。npm 更新 MUST 在版本发布至少 3 天后才提出，Actions 更新 MUST 等待至少 7 天，以满足 pnpm 的 `minimumReleaseAge` 并避免假失败。minor 与 patch 更新 SHALL 分组，major 更新 SHALL 单独提出；当工作区通过 override 锁定 TypeScript 主版本时，MUST NOT 提出该主版本的更新。每个更新 PR MUST 经过 CI。

#### Scenario: 等待期未满

- **WHEN** 依赖有新版本但尚未满足等待期
- **THEN** 不创建该依赖的更新 PR

#### Scenario: 分组 minor 与 patch

- **WHEN** 多个 minor 或 patch 更新可用
- **THEN** 它们被合并在同一个更新 PR 中

#### Scenario: major 单独提出

- **WHEN** 存在 major 更新
- **THEN** 该更新单独创建 PR

#### Scenario: 锁定 TypeScript 主版本

- **WHEN** 工作区通过 override 锁定 TypeScript 主版本
- **THEN** 不创建该主版本的更新 PR

#### Scenario: 更新经过 CI

- **WHEN** 依赖更新 PR 打开
- **THEN** CI 运行并验证该更新
