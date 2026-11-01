# Spec Delta

## Purpose

定义管理端资讯的目录、筛选、详情、编辑、发布、重新发布和撤回行为，使管理员能够以草稿和发布状态管理校园环保资讯，并保证字段、封面和接口边界一致。

## ADDED Requirements

### Requirement: 资讯目录页面

admin SHALL 在 `/articles` 渲染后台壳内的资讯目录，列出标题、分类、作者、状态、发布时间、更新时间和操作。作者 SHALL 优先显示姓名，姓名为空时显示邮箱。列表 SHALL 按创建时间倒序，每页 10 条并在客户端分页；状态 SHALL 使用中文文案“草稿”“已发布”“已撤回”，且不只依赖颜色区分。

#### Scenario: 访问资讯管理

- **WHEN** 已认证管理员访问 `/articles`
- **THEN** 页面显示后台壳和资讯目录，不显示占位说明

#### Scenario: 列表列与状态文案

- **WHEN** 资讯目录包含草稿、已发布和已撤回资讯
- **THEN** 每行显示标题、分类、作者、状态、发布时间、更新时间和操作，状态显示对应中文文案

### Requirement: 资讯筛选与分页

资讯目录 SHALL 支持关键词、状态和分类筛选。关键词 SHALL 不区分大小写匹配标题、摘要或分类；状态和分类 SHALL 按选择值匹配；筛选 SHALL 在点击“查询”后生效，“重置” SHALL 清空条件并回到第一页；筛选与分页 SHALL 在客户端完成。

#### Scenario: 筛选生效

- **WHEN** 管理员输入关键词或选择状态、分类并点击“查询”
- **THEN** 列表只显示同时满足全部条件的资讯，并回到第一页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、状态和分类恢复为全部，列表显示全部资讯并回到第一页

### Requirement: 资讯详情与编辑加载

点击“编辑” SHALL 打开资讯编辑抽屉，并通过 `GET /api/v1/admin/articles/{id}` 获取详情。抽屉 SHALL 显示加载状态；请求失败 SHALL 显示中文错误和重试入口；详情返回 404 SHALL 关闭抽屉、提示资讯不存在并刷新列表。

#### Scenario: 打开编辑抽屉

- **WHEN** 管理员点击某条资讯的“编辑”
- **THEN** 抽屉显示加载状态，随后显示该资讯的标题、分类、摘要、封面、正文和状态

#### Scenario: 详情加载失败

- **WHEN** 详情请求失败
- **THEN** 抽屉显示中文错误和“重试”按钮，点击重试后重新请求

#### Scenario: 资讯不存在

- **WHEN** 详情请求返回 404 `ARTICLE_NOT_FOUND`
- **THEN** 抽屉关闭，页面提示资讯不存在并刷新列表

### Requirement: 新建资讯

新建资讯 SHALL 提交 `POST /api/v1/admin/articles`，请求体包含 `title`、`category`、`summary`、`coverFileId`、`content` 和 `publish`。`publish=false` SHALL 创建草稿，`publish=true` SHALL 直接发布；成功 SHALL 关闭抽屉、刷新列表并显示中文成功提示，失败 SHALL 保留已填内容并显示中文错误。

#### Scenario: 保存草稿

- **WHEN** 管理员填写合法字段并点击“保存草稿”
- **THEN** 请求体 `publish` 为 `false`，成功提示“资讯已保存为草稿”，列表出现新草稿

#### Scenario: 直接发布

- **WHEN** 管理员填写合法字段并点击“发布”
- **THEN** 请求体 `publish` 为 `true`，成功提示“资讯已发布”，列表出现已发布资讯

#### Scenario: 新建失败保留内容

- **WHEN** 新建请求失败
- **THEN** 抽屉保持打开，已填标题、分类、摘要、封面和正文不丢失，并显示中文错误

### Requirement: 编辑资讯

编辑资讯 SHALL 提交 `PUT /api/v1/admin/articles/{id}`。`publish=false` SHALL 只更新内容并保持当前状态，`publish=true` SHALL 将资讯置为已发布；成功 SHALL 更新列表和抽屉中的标题、分类、摘要、封面、正文、状态和更新时间。

#### Scenario: 保存已发布资讯

- **WHEN** 管理员编辑已发布资讯并点击“保存修改”
- **THEN** 请求体 `publish` 为 `false`，状态仍为“已发布”，更新时间和正文已更新

#### Scenario: 编辑草稿并发布

- **WHEN** 管理员编辑草稿并点击“发布”
- **THEN** 请求体 `publish` 为 `true`，状态变为“已发布”，首次发布时间被记录

#### Scenario: 编辑已撤回资讯

- **WHEN** 管理员编辑已撤回资讯并点击“保存修改”
- **THEN** 内容更新但状态仍为“已撤回”，公开接口不返回该资讯

### Requirement: 发布与重新发布

发布 SHALL 通过 `POST /api/v1/admin/articles/{id}/publish` 将草稿或已撤回资讯置为 `PUBLISHED`；首次发布 SHALL 写入发布时间，已发布资讯再次发布 SHALL 保留原发布时间。发布成功后公开资讯列表 SHALL 返回该资讯。

#### Scenario: 草稿发布

- **WHEN** 管理员对草稿执行发布
- **THEN** 状态变为“已发布”，发布时间被写入，公开资讯列表返回该资讯

#### Scenario: 撤回后重新发布

- **WHEN** 管理员对已撤回资讯执行重新发布
- **THEN** 状态恢复为“已发布”，保留首次发布时间，公开资讯列表再次返回该资讯

### Requirement: 撤回资讯

撤回 SHALL 通过 `POST /api/v1/admin/articles/{id}/withdraw` 将 `PUBLISHED` 资讯置为 `WITHDRAWN`，并在操作前二次确认。非 `PUBLISHED` 状态撤回 SHALL 返回 409 `ARTICLE_STATUS_INVALID`；撤回后公开资讯列表和详情 SHALL 不再返回该资讯，但管理端记录和更新时间 SHALL 保留。

#### Scenario: 撤回已发布资讯

- **WHEN** 管理员确认撤回一条已发布资讯
- **THEN** 状态变为“已撤回”，公开资讯列表和详情不再返回该资讯，管理端仍可查看和编辑

#### Scenario: 非发布状态撤回

- **WHEN** 管理员尝试撤回草稿或已撤回资讯
- **THEN** 接口返回 409 `ARTICLE_STATUS_INVALID`，页面显示中文错误，状态不变

### Requirement: 资讯状态与积分边界

资讯状态 SHALL 包括 `DRAFT`、`PUBLISHED` 和 `WITHDRAWN`。保存内容 SHALL NOT 改变发布状态；发布、编辑和撤回资讯 SHALL NOT 改变学生积分或生成积分流水；admin SHALL NOT 在 `/articles` 提供物理删除操作。

#### Scenario: 保存不改变状态

- **WHEN** 管理员保存任意状态的资讯内容
- **THEN** 资讯状态保持保存前的值

#### Scenario: 资讯操作不产生积分

- **WHEN** 管理员创建、编辑、发布或撤回资讯
- **THEN** 学生积分余额和积分流水不发生变化

#### Scenario: 不提供物理删除

- **WHEN** 管理员查看资讯目录和编辑抽屉
- **THEN** 页面不提供删除资讯的操作

### Requirement: 资讯字段规则

资讯字段 SHALL 满足：标题去除首尾空白后 1–80 字；分类去除首尾空白后 1–40 字；摘要去除首尾空白后最多 200 字，空白摘要 SHALL 保存为 `null`；正文去除首尾空白后不能为空；封面可选，填写时 SHALL 为存在且公开的图片。违反规则 SHALL 返回 400 和中文错误。

#### Scenario: 合法字段

- **WHEN** 管理员填写去除首尾空白后符合长度要求的标题、分类、摘要和正文，并选择公开封面
- **THEN** 资讯保存成功，摘要和封面按填写值保存

#### Scenario: 标题超长

- **WHEN** 标题去除首尾空白后超过 80 字
- **THEN** 表单阻止提交或接口返回 400，并显示“标题最多 80 字”

#### Scenario: 封面不可用

- **WHEN** 封面文件不存在或不是公开图片
- **THEN** 接口返回 400 `FILE_NOT_FOUND` 或 `FILE_NOT_PUBLIC`，页面显示中文错误并保留封面选择

#### Scenario: 正文为空白

- **WHEN** 正文去除首尾空白后为空
- **THEN** 表单阻止提交或接口返回 400，并显示“请填写正文”

### Requirement: 管理端资讯列表接口

admin SHALL 通过 `GET /api/v1/admin/articles?status=` 获取资讯摘要列表，返回 200 和统一响应信封。摘要 SHALL 包含 ID、标题、分类、摘要、封面文件 ID、状态、作者 ID、作者邮箱、作者姓名、发布时间、创建时间和更新时间，SHALL NOT 包含正文；列表 SHALL 按创建时间倒序、ID 倒序。`status` 省略时返回全部，非法状态 SHALL 返回 400 `INVALID_REQUEST`。未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 获取摘要列表

- **WHEN** 管理员请求 `GET /api/v1/admin/articles`
- **THEN** 返回 200，数组中的每一项包含摘要字段且不包含 `content`，按创建时间倒序、ID 倒序

#### Scenario: 按状态筛选

- **WHEN** 管理员请求 `GET /api/v1/admin/articles?status=PUBLISHED`
- **THEN** 只返回状态为 `PUBLISHED` 的资讯摘要

#### Scenario: 非法状态

- **WHEN** 管理员请求 `GET /api/v1/admin/articles?status=ARCHIVED`
- **THEN** 返回 400 `INVALID_REQUEST` 和中文错误信息

### Requirement: 管理端资讯详情接口

admin SHALL 通过 `GET /api/v1/admin/articles/{id}` 获取资讯详情，返回 200 和统一响应信封，包含摘要字段和正文 `content`。资讯不存在 SHALL 返回 404 `ARTICLE_NOT_FOUND`；未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 获取详情

- **WHEN** 管理员请求存在的资讯 ID
- **THEN** 返回 200 和包含正文的资讯详情

#### Scenario: 详情不存在

- **WHEN** 管理员请求不存在的资讯 ID
- **THEN** 返回 404 `ARTICLE_NOT_FOUND` 和中文错误信息

### Requirement: 管理端资讯创建与编辑接口

admin SHALL 通过 `POST /api/v1/admin/articles` 创建资讯，通过 `PUT /api/v1/admin/articles/{id}` 编辑资讯。两个接口 SHALL 返回 200 和更新后的资讯详情；字段校验失败或封面不可用 SHALL 返回 400，资讯不存在 SHALL 返回 404 `ARTICLE_NOT_FOUND`。编辑请求的 `publish=true` SHALL 发布资讯，`publish=false` SHALL 保持当前状态。

#### Scenario: 创建资讯

- **WHEN** 管理员提交合法的资讯字段
- **THEN** 返回 200 和新建资讯详情，`publish` 决定初始状态为草稿或已发布

#### Scenario: 编辑资讯

- **WHEN** 管理员提交合法字段编辑已存在资讯
- **THEN** 返回 200 和更新后的详情，保存内容不改变当前状态，`publish=true` 时状态为已发布

#### Scenario: 字段校验失败

- **WHEN** 管理员提交空标题、超长分类或空白正文
- **THEN** 返回 400 和中文校验错误

#### Scenario: 编辑不存在的资讯

- **WHEN** 管理员编辑不存在的资讯 ID
- **THEN** 返回 404 `ARTICLE_NOT_FOUND`

### Requirement: 管理端资讯发布与撤回接口

admin SHALL 通过 `POST /api/v1/admin/articles/{id}/publish` 发布资讯，通过 `POST /api/v1/admin/articles/{id}/withdraw` 撤回资讯。发布 SHALL 返回 200 和已发布详情；撤回 SHALL 返回 200 和已撤回详情，非 `PUBLISHED` 状态 SHALL 返回 409 `ARTICLE_STATUS_INVALID`；两个接口在资讯不存在时 SHALL 返回 404 `ARTICLE_NOT_FOUND`。

#### Scenario: 发布资讯

- **WHEN** 管理员对草稿或已撤回资讯执行发布
- **THEN** 返回 200，状态为 `PUBLISHED`，发布时间在为空时被写入

#### Scenario: 撤回资讯

- **WHEN** 管理员对已发布资讯执行撤回
- **THEN** 返回 200，状态为 `WITHDRAWN`

#### Scenario: 撤回状态冲突

- **WHEN** 管理员对草稿或已撤回资讯执行撤回
- **THEN** 返回 409 `ARTICLE_STATUS_INVALID` 和中文错误信息

#### Scenario: 发布或撤回不存在的资讯

- **WHEN** 管理员对不存在的资讯 ID 执行发布或撤回
- **THEN** 返回 404 `ARTICLE_NOT_FOUND`

### Requirement: 加载、空态与失败重试

资讯目录在请求期间 SHALL 显示加载状态；列表为空 SHALL 显示“暂无资讯”空态，筛选无结果 SHALL 显示“没有符合筛选条件的资讯”；列表请求失败 SHALL 显示中文错误和“重试”按钮。编辑抽屉加载失败 SHALL 提供重试，保存失败 SHALL 保留表单内容。

#### Scenario: 空列表

- **WHEN** 系统没有任何资讯
- **THEN** 列表区域显示“暂无资讯”空态和可执行的刷新操作

#### Scenario: 筛选无结果

- **WHEN** 当前筛选条件没有匹配资讯
- **THEN** 列表区域显示“没有符合筛选条件的资讯”，不显示错误

#### Scenario: 列表加载失败

- **WHEN** 列表请求失败
- **THEN** 页面显示中文错误和“重试”按钮，点击后重新请求并恢复列表

#### Scenario: 保存失败保留内容

- **WHEN** 新建或编辑保存失败
- **THEN** 抽屉保持打开，已填字段和封面选择不丢失，并显示中文错误

### Requirement: 窄屏表现

视口宽度小于 992px 时，资讯列表 SHALL 在内容区内部横向滚动，页面本身 SHALL NOT 产生横向滚动；筛选区 SHALL 自动换行；编辑抽屉 SHALL 占满可用宽度，底部操作按钮可换行。

#### Scenario: 窄屏列表

- **WHEN** 用户在小于 992px 的视口查看资讯目录
- **THEN** 表格在内容区内部横向滚动，页面不产生横向滚动，筛选区自动换行

#### Scenario: 窄屏编辑

- **WHEN** 用户在小于 992px 的视口打开编辑抽屉
- **THEN** 抽屉占满可用宽度，字段和底部操作按钮可完整操作

### Requirement: 中文界面与可访问性

资讯管理页面 SHALL 使用中文界面文案，并在亮色和暗色主题下保持文字、表格、标签和按钮可读。状态 SHALL 同时通过文字和颜色表达；抽屉、确认框和按钮 SHALL 支持键盘聚焦和操作。

#### Scenario: 中文与主题

- **WHEN** 管理员在亮色或暗色主题下查看资讯管理
- **THEN** 所有操作文案为中文，主要文字、表格、标签和按钮保持可读

#### Scenario: 键盘操作

- **WHEN** 管理员使用 Tab 和 Enter 操作编辑抽屉、撤回确认框和底部按钮
- **THEN** 可以聚焦并完成对应操作
