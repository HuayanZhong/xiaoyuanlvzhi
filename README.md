# 校园绿植领养与环保激励系统 · Frontend

Turborepo + pnpm 多应用工作区。

## 应用

| 应用         | 技术栈                         | 端口 | 说明               |
| ------------ | ------------------------------ | ---- | ------------------ |
| `apps/admin` | React 19 + Vite 8 + TypeScript | 3000 | 后台管理系统       |
| `apps/web`   | Nuxt 4 + Vue 3 + TypeScript    | 4000 | 面向使用者的应用   |
| `apps/bff`   | NestJS 12 + TypeScript         | 5000 | BFF 接口层（骨架） |

## 共享配置

- `packages/typescript-config`: 共享 `tsconfig` 预设（base / react-app）
- `packages/vitest-config`: 共享 Vitest 测试选项（超时、mock、覆盖率、排除目录）
- `.editorconfig`: 编辑器基础规范（UTF-8 / LF / 2 空格缩进）
- `.gitattributes`: Git 行尾与文本文件规范化
- `.oxlintrc.json`: Oxlint 规则配置（React / Vue / TypeScript 等插件）
- `.oxfmtrc.json`: Oxfmt 格式化配置
- `turbo.json`: 任务编排（build / lint / format / format:check / check-types / test / test:coverage / dev）

## 测试

测试统一使用 Vitest 5，各应用独立运行，公共默认值来自 `@repo/vitest-config`。

- `apps/admin/tests/unit`: jsdom + Testing Library 组件测试
- `apps/web/tests/nuxt`: `@nuxt/test-utils` Nuxt 运行时测试
- `apps/bff/tests/unit`: Nest 单元测试
- `apps/bff/tests/e2e`: `@nestjs/testing` + Supertest HTTP 测试

```sh
pnpm test                # turbo run test（执行全部应用）
pnpm test:coverage       # V8 覆盖率，报告写入各应用 coverage/
pnpm --filter admin test # 只跑后台测试
pnpm --filter web test   # 只跑用户端测试
pnpm --filter bff test   # 只跑 BFF 测试
pnpm --filter admin test:watch
pnpm --filter admin test:coverage
```

覆盖率报告：

- 终端：`text` 摘要
- HTML：`apps/<app>/coverage/index.html`
- LCOV：`apps/<app>/coverage/lcov.info`

## 常用命令

```sh
pnpm install      # 安装依赖
pnpm dev          # 同时启动 admin(3000)、web(4000) 和 bff(5000)
pnpm build        # 构建所有应用
pnpm lint         # turbo run lint（各包执行 oxlint）
pnpm lint:fix     # 自动修复 lint 问题
pnpm format       # turbo run format（各应用执行 oxfmt）
pnpm format:check # 检查各应用格式
pnpm check-types  # 类型检查
pnpm test         # 运行全部测试
pnpm test:coverage # 运行全部测试并生成覆盖率
```

只启动单个应用：

```sh
pnpm --filter admin dev
pnpm --filter web dev
pnpm --filter bff dev
```

## 工具链

- [Turborepo](https://turborepo.dev) 2.11
- [pnpm](https://pnpm.io) 12
- [Node.js](https://nodejs.org/) >= 26.12.1（见 `.nvmrc`）
- [TypeScript](https://www.typescriptlang.org/) 6.0
- [NestJS](https://nestjs.com/) 12
- [Vitest](https://vitest.dev/) 5
- [Oxlint](https://oxc.rs/) 规则检查
- [Oxfmt](https://oxc.rs/) 代码格式化
