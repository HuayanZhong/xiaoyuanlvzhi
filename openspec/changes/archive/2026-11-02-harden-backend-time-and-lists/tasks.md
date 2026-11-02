# Tasks

## 1. 后端时间源统一

- [x] 1.1 为 `AdoptionService`、`AuthService`、`ArticleService`、`NotificationService`、`SessionAuthenticationFilter`、`MybatisAuditMetaObjectHandler`、`PlantIndividualPersistenceAdapter`、`PlantSpeciesPersistenceAdapter` 注入业务 `Clock`，替换全部 20 处 `LocalDateTime.now()`；验证：`grep -rn "LocalDateTime.now()" backend/src/main/java` 无输出
- [x] 1.2 更新受影响的单元测试，使用固定 `Clock` 断言时间；验证：`./mvnw -q test` 通过

## 2. 兑换通知时间格式化

- [x] 2.1 在 `common` 下提供 `yyyy-MM-dd HH:mm` 业务时间格式化入口，并在 `RewardService` 的兑换成功通知中使用；验证：`RewardServiceTest` 断言摘要为「请在 2026-11-09 20:48 前到 学生活动中心 101 领取。」且不含 `T` 或纳秒
- [x] 2.2 运行 `./mvnw -q -Dtest=RewardServiceTest test`，确认通过

## 3. 列表可选分页

- [x] 3.1 新增 `PageParams`、`PageResult` 与服务层切分助手，校验 `page`/`pageSize` 必须同时出现、`page >= 1`、`1 <= pageSize <= 100`，非法值返回 400 `INVALID_REQUEST`；验证：新增参数校验与切片边界单元测试通过
- [x] 3.2 确认分页在 Service 层完成，不引入 MyBatis-Plus 分页插件；验证：后端启动无异常，分页结果 `total` 与 `items` 正确
- [x] 3.3 为所有裸列表接口的 Service 结果接入服务层切分（通知接口保持 `{items,unreadCount}` 结构，不纳入分页）；验证：各列表分页方法与不分页结果排序一致
- [x] 3.4 为所有返回裸列表的 GET Controller 接入可选 `page`/`pageSize`：不传保持数组，传入返回 `{items,total,page,pageSize}`；验证：接口冒烟覆盖两种响应
- [x] 3.5 增加契约测试：不传参数返回数组、传入返回分页信封、只传一个参数返回 400、页码越界返回空 `items`、分页结果与不分页前 N 条顺序一致；验证：测试通过

## 4. 文档同步

- [x] 4.1 在 `backend/docs/api.md` 的资讯章节补充 `GET /api/v1/admin/articles/{id}` 及其用途；验证：文档中存在该行且与 `AdminArticleController` 一致
- [x] 4.2 重启后端后从 `/v3/api-docs` 重新生成 `docs/openapi.json` 与 `docs/openapi.yaml`，验证：快照中存在 `get /api/v1/admin/articles/{id}`

## 5. 全量验证

- [x] 5.1 在 `backend` 运行 `./mvnw verify`，确认编译、测试、Spotless、Checkstyle 全部通过
- [x] 5.2 运行后端冒烟：`GET /api/v1/health`、无分页参数返回数组、`?page=1&pageSize=2` 返回分页信封、`?page=1` 返回 400 `INVALID_REQUEST`；不打印任何令牌、密码或 Cookie
- [x] 5.3 在 `frontend` 根运行 `pnpm verify`，确认前端未受后端契约影响

## Workflow follow-up

- 归档后确认 `openspec/specs/server-time`、`openspec/specs/api-pagination` 已创建，`student-notifications` 已包含兑换通知格式要求。
- 后续独立变更：web/admin 接入服务端分页；学生端资讯阅读按产品范围确认后再排期。
