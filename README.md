# 校园绿植领养与环保激励系统 · Frontend

Turborepo + pnpm 工作区。`apps/` 目前为空，共享配置保留，便于添加实际应用。

## 目录结构

- `packages/typescript-config`: 共享的 `tsconfig.json` 预设（base / nextjs / react-library）
- `turbo.json`: 任务编排（build / lint / check-types / dev）
- `.oxlintrc.json`: Oxlint 规则配置
- `.oxfmtrc.json`: Oxfmt 格式化配置

## 常用命令

```sh
pnpm install      # 安装依赖
pnpm dev          # 启动所有应用的开发服务
pnpm build        # 构建所有应用
pnpm lint         # turbo run lint（各包执行 oxlint）
pnpm lint:fix     # 自动修复 lint 问题
pnpm format       # 格式化全部文件
pnpm format:check # 检查格式
pnpm check-types  # 类型检查
```

> `apps/` 下暂无项目时，`dev` / `build` / `lint` / `check-types` 会提示
> “No tasks were executed”，这是预期行为。

## 工具链

- [Turborepo](https://turborepo.dev) 2.11
- [pnpm](https://pnpm.io) 12
- [TypeScript](https://www.typescriptlang.org/) 6.0
- [Oxlint](https://oxc.rs/) 规则检查
- [Oxfmt](https://oxc.rs/) 代码格式化
