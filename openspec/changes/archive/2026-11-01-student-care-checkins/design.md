# Design

## Context

见 `proposal.md` 的 Why。当前状态与约束：

- `apps/web` 已有 `ApiClient`（`app/utils/api.ts`）：Bearer 注入、Spring 信封解析、401 事件与 `requestBlob`，但没有 multipart 通道。
- 图片读取已落地：`requestBlob` + `useFileUrl` + `UiFigure` 在客户端把私有图片转成 object URL；SSR 只渲染静态画框。
- 路由守卫位于 `app/utils/auth-route.ts`，`PROTECTED_PAGES` 与 `PROTECTED_PREFIXES` 同时被登录跳转和 401 跳转复用。
- Spring 已提供 `GET /api/v1/care/eligible-plants`、`GET/POST /api/v1/care/checkins`、`GET /api/v1/care/checkins/{id}`、`POST /api/v1/care/checkins/{id}/resubmit` 和 `POST /api/v1/files`（multipart，字段名 `file`）；本变更不修改 Spring。
- 学生打卡视图不含发放积分字段，只有管理端视图才有。

## Goals / Non-Goals

**Goals:**

- 用现有 Spring 接口完成「我的绿植 → 植株养护 → 打卡详情」全链路。
- 建立可复用的图片上传基元，后续环保任务凭证直接复用。
- 保持 SSR 首屏可用：列表与详情在服务端取数，上传与本地预览只在客户端发生。

**Non-Goals:**

- 不实现积分计算、积分流水、任务凭证、通知和兑换。
- 不新增植株详情接口，不修改 Spring 或 admin。
- 不做图片压缩、裁剪、拖拽排序或上传进度条。
- 不在底部导航或横向导航新增入口。

## Decisions

### 1. 在 `ApiClient` 上新增 `requestForm`，而不是让 `request` 自动识别 `FormData`

`request` 目前统一走 `json: body`，并带有「要求 data 非空」的语义。新增一个独立方法：

```ts
requestForm<T>(path: string, form: FormData, options?: FormRequestOptions): Promise<T>
```

它复用同一套 Bearer、超时、信封解析和 401 处理，但**不设置 `Content-Type`**，由浏览器为 `FormData` 生成带 boundary 的头，避免服务端解析失败。

备选：在 `request` 内判断 `body instanceof FormData`。被否，因为传输语义混在一起，测试也需要多组分支。

### 2. 选中图片即上传，提交时只传文件 ID

- 选择文件后先做本地校验（JPG/PNG/WebP、≤5 MB、≤3 张），通过后立即 `POST /files`。
- 上传成功保存 `fileId`，并用 `URL.createObjectURL(file)` 做本地预览；移除时 revoke。
- 打卡提交体只包含 `note` 与 `imageFileIds`。

备选：提交时批量上传。被否，因为任一张失败就要重传全部，且无法在上传阶段给出逐张错误。

代价是用户中途放弃会留下无引用的私有文件。当前没有删除文件的接口，接受这一残留；文件只对上传者和管理员可读。

### 3. 页面按「列表 → 植株 → 打卡」三层组织

```
/my-plants             GET /care/eligible-plants
   |                   卡片：编号、位置、间隔、上次通过、下次可打卡、待审核标记
   v
/my-plants/[plantId]   eligible-plants 中定位该株 + GET /care/checkins 过滤 plantId
   |                   表单：说明 + 图片；下方本株历史
   v
/care/[id]             GET /care/checkins/{id}
                       版本列表、凭证图、驳回原因、重新提交
```

`/my-plants/[plantId]` 一次请求打卡列表后在客户端按 `plantId` 过滤，避免新增「按植株查询」接口。植株不在可打卡列表中时，页面说明当前不可养护并返回 `/my-plants`。

### 4. 数据流

```
浏览器 (4000)
  /my-plants ──SSR──> Nitro /api/v1 ──> Spring GET /care/eligible-plants
  /my-plants/[plantId] ──SSR──> eligible-plants + GET /care/checkins
  [提交] ──client──> POST /api/v1/files (multipart, Bearer)
           ──client──> POST /api/v1/care/checkins (JSON: plantId, note, imageFileIds)
  /care/[id] ──SSR──> GET /care/checkins/{id}
             ──client──> GET /api/v1/files/{fileId} via requestBlob -> object URL
```

管理端不参与本次数据流；审核仍由现有管理端完成。

### 5. 复用现有页面与组件模式

- 页面取数：`useAsyncData` + 显式 key（`my-plants`、`plant-care:{plantId}`、`care-checkin:{id}`），错误转成 `{data, errorMessage}`，与绿植/申请页面一致。
- 组件：`UiPageHeader`、`UiEmptyState`、`UiTextArea`、`UiFigure`、`UiTimeline`、`Stamp`、`UiButton`、`UiAlert`。
- 新增 `UiImagePicker`（选择、校验、上传、预览、移除），`care-api.ts`（类型与请求），`upload-api.ts`（`uploadImage`），`care-status.ts`（三态中文标签与 tone）。
- 状态戳复用已有 tone：待审核 `pending`、已通过 `alive`、已驳回 `danger`。

### 6. 错误与冲突处理以后端消息为准

`ApiError.code` 映射到可读操作：

| code                               | 页面行为                       |
| ---------------------------------- | ------------------------------ |
| `CARE_INTERVAL_NOT_REACHED`        | 显示服务端说明，刷新打卡资格   |
| `CARE_CHECKIN_DUPLICATE`           | 提示已有打卡并提供查看入口     |
| `CARE_NOT_ACTIVE`                  | 说明当前不可养护，返回我的绿植 |
| `CARE_SUBMISSION_ALREADY_REVIEWED` | 提示凭证已处理，提供刷新详情   |
| `CARE_EVIDENCE_REQUIRED`           | 就地提示至少提供说明或图片     |

网络错误与非 2xx 统一走 `resolveRequestError`；冲突时只刷新详情，不在前端猜测新状态。

### 7. 守卫与配置

- 在 `auth-route.ts` 的 `PROTECTED_PREFIXES` 增加 `/my-plants` 和 `/care`，登录后 `returnTo` 行为复用现有逻辑。
- 不修改 tsconfig、Vitest include、覆盖率路径或 Turbo 输入：新代码位于 `app/`，测试位于既有 `tests/nuxt/` 目录。
- 不新增第三方依赖，继续使用 Oxc。

## Risks / Trade-offs

- **multipart 经过 Nitro 代理**（`server/api/[...path].ts` 使用 `proxyRequest`）→ 在 4000 端口用真实后端上传一张接近 5 MB 的图片验证；若出现 413 或 body 被改写，再调整服务端路由，不改接口契约。
- **没有「养护中」数据就无法完整走通页面** → 优先用管理端完成一次交接；否则验证空态、不可打卡原因、表单校验与读取路径，写操作由页面测试覆盖。
- **并发提交产生重复打卡** → 依赖后端 409/`CARE_CHECKIN_DUPLICATE`，页面刷新资格，不做乐观更新。
- **学生视图没有 `awardedPoints`** → 详情只写「审核通过后按积分规则发放」，不展示具体分值。
- **本地预览对象 URL 泄漏** → 在移除、重新选择与组件卸载时 `revokeObjectURL`，并用测试覆盖。
- **客户端文件校验可被绕过** → 仅作为体验优化；真正校验在 Spring（按文件头识别类型与大小）。
- **上传后放弃表单留下孤儿文件** → 接受；文件为私有资源，不影响业务数据。

## Migration Plan

- 纯增量：新增路由与组件，不改变已有 URL、字段或认证流程。
- 部署顺序无要求；回滚时移除新增路由、入口和 `requestForm`，已有页面不受影响。

## Open Questions

- 是否需要在客户端压缩大图以减少上传流量，留待上传量有真实数据后再定；不改变本次接口与页面结构。
