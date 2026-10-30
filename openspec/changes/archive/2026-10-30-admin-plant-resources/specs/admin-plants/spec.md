# Spec Delta

## Purpose

定义管理端绿植资源的可观察行为：品种档案与单株库存的列表、筛选、分页、创建编辑、状态操作、图片上传和错误反馈，让管理员在后台壳内维护可领养资源。

## ADDED Requirements

### Requirement: 品种档案列表

admin SHALL 在 `/plants/species` 显示品种档案列表，包含封面、品种名称、养护难度、养护说明摘要、可领养单株数、启用状态、更新时间和操作列。列表 SHALL 按更新时间倒序，每页 10 条并在客户端分页；状态 SHALL 使用中文文案，不得只依赖颜色区分。

#### Scenario: 查看品种列表

- **WHEN** 管理员访问 `/plants/species`
- **THEN** admin 请求 `GET /api/v1/admin/plant-species`，并在表格中显示每个品种的封面、名称、难度、说明摘要、可领养单株数、启用状态和更新时间

#### Scenario: 客户端分页

- **WHEN** 品种数量超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数，并可切换到下一页

#### Scenario: 启用状态文案

- **WHEN** 列表渲染启用和停用的品种
- **THEN** 状态列分别显示“启用”和“停用”，而不是只显示色块

### Requirement: 品种筛选

品种列表 SHALL 支持按名称关键词和启用状态筛选。名称关键词 SHALL 不区分大小写并按包含匹配；筛选条件 SHALL 在点击“查询”后生效，“重置” SHALL 恢复默认筛选。筛选与分页 SHALL 在客户端完成，不改变后端请求。

#### Scenario: 按名称筛选

- **WHEN** 管理员输入“绿”并点击“查询”
- **THEN** 列表只显示名称包含“绿”的品种，分页重置到第一页

#### Scenario: 按状态筛选

- **WHEN** 管理员选择“停用”并点击“查询”
- **THEN** 列表只显示已停用的品种

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 名称和状态恢复为空，列表显示全部品种

### Requirement: 新增与编辑品种

admin SHALL 通过抽屉表单新增和编辑品种，字段为名称（必填，最多 40 字）、封面（可选，1 张）、养护难度（必填，简单/一般/较难）、光照说明（必填，最多 200 字）、浇水说明（必填，最多 200 字）、养护间隔（必填，正整数天）、打卡默认积分（必填，非负整数）和其他说明（可选，最多 500 字）。保存成功 SHALL 关闭表单并刷新列表；保存失败 SHALL 保留已填内容并显示中文错误。

#### Scenario: 新增品种

- **WHEN** 管理员填写合法字段并保存
- **THEN** admin 发送 `POST /api/v1/admin/plant-species`，成功后关闭抽屉并刷新列表

#### Scenario: 必填校验

- **WHEN** 管理员未填写品种名称就保存
- **THEN** 表单在名称字段显示中文必填错误，且不发起请求

#### Scenario: 名称重复

- **WHEN** Spring 返回 409 `PLANT_SPECIES_EXISTS`
- **THEN** 表单显示“这个品种名称已存在”，并保留已填内容

#### Scenario: 编辑品种

- **WHEN** 管理员点击某品种的“编辑”并修改说明后保存
- **THEN** admin 发送 `PUT /api/v1/admin/plant-species/{id}`，成功后列表显示更新后的内容和更新时间

#### Scenario: 保存失败保留输入

- **WHEN** 保存请求因 5xx 或网络错误失败
- **THEN** 抽屉保持打开，已填字段不丢失，并显示中文错误提示

### Requirement: 品种启停

品种列表 SHALL 提供启用和停用操作。停用前 SHALL 二次确认；停用 SHALL NOT 删除品种或其历史单株。操作成功 SHALL 更新该行状态并提示；操作失败 SHALL 保留原状态并提示。

#### Scenario: 停用品种前确认

- **WHEN** 管理员点击“停用”
- **THEN** 页面显示二次确认，确认后才发送 `POST /api/v1/admin/plant-species/{id}/disable`

#### Scenario: 取消停用

- **WHEN** 管理员在停用确认中取消
- **THEN** 不发送请求，品种保持启用状态

#### Scenario: 停用成功

- **WHEN** 停用请求返回成功
- **THEN** 该行状态变为“停用”，并显示成功提示

#### Scenario: 停用品种不可用于新增单株

- **WHEN** 管理员新增单株时打开品种选择
- **THEN** 停用品种不出现在可选项中

### Requirement: 查看关联单株

品种列表 SHALL 提供“查看单株”操作，导航到 `/plants/instances?speciesId=<id>`。单株页 SHALL 以该品种作为初始筛选条件，刷新或直接访问该 URL 时筛选保持。

#### Scenario: 跳转并筛选

- **WHEN** 管理员点击某品种的“查看单株”
- **THEN** 页面导航到 `/plants/instances?speciesId=<id>`，单株列表只显示该品种的单株

#### Scenario: 无关联单株

- **WHEN** 该品种没有单株
- **THEN** 单株列表显示空状态，而不是空白页

### Requirement: 单株库存列表

admin SHALL 在 `/plants/instances` 显示单株列表，包含单株编号、品种、展示名称、摆放位置、状态、加入时间、更新时间和操作列。列表 SHALL 按加入时间倒序，每页 10 条并在客户端分页；状态 SHALL 使用中文文案：可领养、待领取、养护中、维护中、已停用。

#### Scenario: 查看单株列表

- **WHEN** 管理员访问 `/plants/instances`
- **THEN** admin 请求 `GET /api/v1/admin/plant-individuals` 并按加入时间倒序显示单株

#### Scenario: 状态文案

- **WHEN** 单株状态为 `AVAILABLE`、`WAITING_PICKUP`、`ACTIVE`、`MAINTENANCE` 或 `DISABLED`
- **THEN** 状态列分别显示“可领养”“待领取”“养护中”“维护中”“已停用”

### Requirement: 单株筛选

单株列表 SHALL 支持按编号或位置关键词、品种和状态筛选；筛选在点击“查询”后生效，“重置”恢复全部。`speciesId` 查询参数 SHALL 作为品种初始筛选。筛选与分页 SHALL 在客户端完成。

#### Scenario: 组合筛选

- **WHEN** 管理员输入关键词、选择品种和状态后点击“查询”
- **THEN** 列表只显示同时满足三个条件的单株

#### Scenario: URL 初始筛选

- **WHEN** 管理员直接访问 `/plants/instances?speciesId=3`
- **THEN** 品种筛选初始为 ID 3 对应的品种，列表只显示该品种单株

#### Scenario: 无效品种参数

- **WHEN** `speciesId` 不存在或不是数字
- **THEN** admin 忽略该参数并显示全部单株，不显示错误页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、品种和状态恢复为空，列表显示全部单株

### Requirement: 新增与编辑单株

admin SHALL 通过抽屉表单新增和编辑单株，字段为编号（必填，最多 80 字，全系统唯一）、品种（必填，仅启用品种）、展示名称（可选，最多 40 字）、摆放位置（必填，最多 100 字）、图片（可选，最多 3 张）和备注（可选，最多 300 字）。编辑时编号和品种 SHALL 只读。新增单株的初始状态 SHALL 为“可领养”。保存成功 SHALL 关闭表单并刷新列表。

#### Scenario: 新增单株

- **WHEN** 管理员填写合法字段并保存
- **THEN** admin 发送 `POST /api/v1/admin/plant-individuals`，成功后关闭抽屉，列表顶部出现新单株且状态为“可领养”

#### Scenario: 编号重复

- **WHEN** Spring 返回 409 `PLANT_CODE_EXISTS`
- **THEN** 表单显示“单株编号已存在”，并保留已填内容

#### Scenario: 编辑时不可修改编号和品种

- **WHEN** 管理员打开某单株的编辑表单
- **THEN** 编号和品种字段为只读，接口发送 `PUT /api/v1/admin/plant-individuals/{id}` 时保持原值

#### Scenario: 编辑单株

- **WHEN** 管理员修改摆放位置后保存
- **THEN** 列表显示新的位置和更新时间

#### Scenario: 保存失败保留输入

- **WHEN** 保存请求因 5xx 或网络错误失败
- **THEN** 抽屉保持打开，已填字段不丢失，并显示中文错误提示

### Requirement: 单株状态操作

单株列表 SHALL 提供送修（仅“可领养”）、维护完成（仅“维护中”）和停用（仅“可领养”或“维护中”）操作。操作前 SHALL 二次确认；成功后 SHALL 更新该行状态；状态不满足时 SHALL NOT 执行请求。失败 SHALL 保留原状态并提示。

#### Scenario: 送修

- **WHEN** 管理员对“可领养”单株确认送修
- **THEN** admin 发送 `POST /api/v1/admin/plant-individuals/{id}/maintenance`，成功后状态变为“维护中”

#### Scenario: 维护完成

- **WHEN** 管理员对“维护中”单株确认维护完成
- **THEN** admin 发送 `POST /api/v1/admin/plant-individuals/{id}/maintenance/complete`，成功后状态变为“可领养”

#### Scenario: 停用单株

- **WHEN** 管理员对“可领养”或“维护中”单株确认停用
- **THEN** admin 发送 `POST /api/v1/admin/plant-individuals/{id}/disable`，成功后状态变为“已停用”

#### Scenario: 状态不满足

- **WHEN** 单株处于“待领取”“养护中”或“已停用”
- **THEN** 对应的送修、维护完成或停用操作不显示或不可点击，且不发起请求

#### Scenario: 操作失败

- **WHEN** 状态操作请求失败
- **THEN** 该行保持原状态，并显示中文错误提示

### Requirement: 图片上传

品种封面和单株图片 SHALL 通过 `POST /api/v1/files` 以 multipart 上传，字段名为 `file`，并携带 `isPublic=true`。支持 JPG、PNG、WebP，单张不超过 5 MB；成功后 SHALL 保存返回的文件 ID，并通过带认证头的 `GET /api/v1/files/{id}` 预览。上传失败 SHALL NOT 写入表单，并显示中文提示。

#### Scenario: 上传成功

- **WHEN** 管理员选择一张合法图片
- **THEN** admin 上传文件并保存返回的 `id`，表单显示缩略图预览

#### Scenario: 不支持的格式

- **WHEN** 管理员选择 GIF 或其他非 JPG/PNG/WebP 文件
- **THEN** 上传被拒绝并显示中文格式错误，表单不新增图片

#### Scenario: 超过大小限制

- **WHEN** 管理员选择超过 5 MB 的图片
- **THEN** 上传被拒绝并显示中文大小错误

#### Scenario: 单株图片数量上限

- **WHEN** 单株表单已有 3 张图片
- **THEN** 上传入口不可用，不能添加第 4 张

#### Scenario: 上传失败

- **WHEN** 上传请求失败
- **THEN** 表单不写入文件 ID，并显示可重试的中文提示

### Requirement: 加载、空态与失败重试

两个列表在请求期间 SHALL 显示加载状态。请求失败 SHALL 显示中文错误和重试入口，重试 SHALL 重新发起请求；列表为空 SHALL 显示空状态，并提供新增入口。

#### Scenario: 加载失败重试

- **WHEN** 列表请求因网络错误或 5xx 失败
- **THEN** 页面显示中文错误和“重试”按钮；点击后重新请求并恢复列表

#### Scenario: 空列表

- **WHEN** 没有品种或单株
- **THEN** 页面显示空状态和“新增”入口，而不是空白区域

#### Scenario: 请求期间

- **WHEN** 列表请求尚未返回
- **THEN** 表格显示加载状态，不显示上一批数据之外的内容

### Requirement: 接口错误处理

admin SHALL 使用现有 Spring 接口和统一响应信封（`success`、`data`、`error.code`、`error.message`）。非 2xx 响应或 `success=false` SHALL 转换为中文错误；401 SHALL 交给现有登录态处理；网络错误、超时和未知错误 SHALL 显示可重试的中文提示。单个请求失败 SHALL NOT 清空已填表单内容或导致页面崩溃。

#### Scenario: 业务失败信封

- **WHEN** Spring 返回 `{ success: false, error: { code, message } }`
- **THEN** 页面显示后端提供的 `message`，没有 `message` 时显示通用中文错误

#### Scenario: 未认证响应

- **WHEN** 任一绿植请求返回 401
- **THEN** 沿用现有登录态处理跳转登录页，页面不额外显示重复错误

#### Scenario: 网络或超时

- **WHEN** 请求因网络错误或超时失败
- **THEN** 页面显示可重试的中文提示，已填写的表单内容保持不变

### Requirement: 窄屏表现

视口宽度小于 992px 时，两个列表 SHALL 在内容区内部横向滚动，页面本身 SHALL NOT 产生横向滚动；抽屉表单 SHALL 占满可用宽度，全部字段和保存操作可完成。

#### Scenario: 320px 视口

- **WHEN** 管理员在 320px 宽视口查看品种或单株列表
- **THEN** 表格在卡片内部滚动，页面不产生横向滚动

#### Scenario: 窄屏填写表单

- **WHEN** 管理员在窄屏打开新增或编辑抽屉
- **THEN** 抽屉占满可用宽度，所有必填字段和保存按钮可操作
