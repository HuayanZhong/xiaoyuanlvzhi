# 校园绿植领养与环保激励系统 · Frontend

Turborepo + pnpm 多应用工作区。

## 应用

| 应用         | 技术栈                         | 端口 | 说明             |
| ------------ | ------------------------------ | ---- | ---------------- |
| `apps/admin` | React 19 + Vite 8 + TypeScript | 3000 | 后台管理系统     |
| `apps/web`   | Nuxt 4 + Vue 3 + TypeScript    | 4000 | 面向使用者的应用 |

## 共享配置

- `packages/typescript-config`: 共享 `tsconfig` 预设（base / nextjs / react-library / react-app）
- `.oxlintrc.json`: Oxlint 规则配置（React + Vue 插件）
- `.oxfmtrc.json`: Oxfmt 格式化配置
- `turbo.json`: 任务编排（build / lint / check-types / dev）

## 常用命令

```sh
pnpm install      # 安装依赖
pnpm dev          # 同时启动 admin(3000) 和 web(4000)
pnpm build        # 构建所有应用
pnpm lint         # turbo run lint（各包执行 oxlint）
pnpm lint:fix     # 自动修复 lint 问题
pnpm format       # 格式化全部文件
pnpm format:check # 检查格式
pnpm check-types  # 类型检查
```

只启动单个应用：

```sh
pnpm --filter admin dev
pnpm --filter web dev
```

## 工具链

- [Turborepo](https://turborepo.dev) 2.11
- [pnpm](https://pnpm.io) 12
- [TypeScript](https://www.typescriptlang.org/) 6.0
- [Oxlint](https://oxc.rs/) 规则检查
- [Oxfmt](https://oxc.rs/) 代码格式化
