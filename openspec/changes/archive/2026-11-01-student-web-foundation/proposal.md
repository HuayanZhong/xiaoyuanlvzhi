# Proposal

## Why

学生端目前只有单文件骨架，无法注册、登录或访问任何学生业务；Spring 已有学生领域接口，但注册资料仍是可选字段，学号和手机号的唯一性也没有在注册流程中校验。先补齐可信的学生认证和移动端基础壳，后续绿植、养护、任务、积分与兑换模块才能共享同一套会话、错误处理和页面结构。

## What Changes

- 新增学生端 Nuxt 基础应用：登录/注册页、移动端页面壳、底部导航、首页和“我的”最小入口、纯 CSS 设计 token。
- 学生认证改为仅邮箱：QQ 邮箱 + 6 位验证码 + 密码 + 姓名/学号/院系/班级/手机号；登录用邮箱 + 密码；默认种子管理员仍可用 `admin`，自定义管理员邮箱使用完整邮箱登录。
- **BREAKING** `POST /api/v1/auth/register` 将姓名、学号、院系、班级、手机号改为必填，并在服务层校验学号和手机号唯一；缺少字段的旧请求将返回 400。新增学号/手机号冲突的 409 错误码；邮箱验证码流程和登录响应不变；SMTP 发送失败改为 503 `MAIL_SEND_FAILED`，不再退化为通用 500。`PUT /api/v1/profile` 不再允许清空手机号。
- 新增 web 的 API 适配层：复用 `@repo/http-client`，解析 Spring 统一信封，统一处理业务错误、网络错误、超时、Bearer 注入和 401。
- web 使用 `/api/v1/` 作为 API base，由 Nitro `server/api` 路由在开发和生产环境转发到 Spring；SSR 取数直接访问 Spring。共享 HTTP 客户端运行时契约不变。
- 更新 `env`、`http-client` 主规格，以及学生产品文档、README 和 AGENTS 中过时的 web/认证说明。
- 不修改 admin 业务代码；admin 登录和 `/api/v1/admin/**` 角色边界保持不变。无数据库迁移，现有唯一索引已覆盖学号和手机号。

## Capabilities

### New Capabilities

- `student-auth`: 学生邮箱注册、注册资料完整性、邮箱登录、验证码、学生角色与账号状态、会话恢复、路由守卫、401 处理和退出。
- `web-api`: 学生端访问 Spring 的 API base、服务端代理、响应信封解析、错误模型、Bearer 注入和 401 事件。
- `web-shell`: 学生端移动优先页面壳、底部导航、登录/注册布局、首页和“我的”最小页面、纯 CSS 设计 token。

### Modified Capabilities

- `env`: 增加 web 的 `API_BASE_URL`、`SPRING_API_ORIGIN`、服务端代理和构建期注入要求。
- `http-client`: 补充 web 作为调用方使用共享客户端的环境适配场景，不改变共享包运行时契约。

## Impact

- `apps/web`：从单文件骨架变为 Nuxt 学生端基础应用；新增 `@repo/http-client` 依赖；不引入外部 UI 组件库。
- Spring：`auth` DTO、服务、账号仓库、邮件错误映射和测试；`POST /api/v1/auth/register` 校验变化；无新端点、无数据库迁移。Spring 位于 `../backend`，不在 frontend Git 工作区，后端编辑需单独评审和回滚，Maven 命令从 `../backend` 执行。
- `apps/admin`：不改业务代码；因共享认证接口的校验变化，运行登录和认证回归测试。
- `packages/http-client`：不改运行时契约；web 新增消费场景。
- 配置与文档：`apps/web/nuxt.config.ts`、`apps/web/config/env.ts`、根 `.env.example` 注释、`turbo.json` 对 `packages/http-client` 的缓存输入；`docs/product/student.md`、`docs/product/business-rules.md`、`README.md`、`AGENTS.md`、`backend/README.md`、`backend/docs/api.md` 和 `backend/docs/openapi.*` 快照。
- 运行前置：本地后端需要配置 QQ SMTP 发件账号和授权码；凭据只放本地未跟踪环境，不进入仓库或工件。
