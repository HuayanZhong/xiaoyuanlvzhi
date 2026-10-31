# admin-rewards Specification

## Purpose

定义管理端奖励商品维护、库存核算、兑换订单查询、核销、取消和超时退分的可观察行为，使管理员能够完成积分消费后的线下履约与纠错，并保证积分和库存在每次状态转换中只变化一次。

## Requirements

### Requirement: 管理端奖励列表接口

admin SHALL 通过 `GET /api/v1/admin/rewards` 获取全部奖励，按创建时间倒序、ID 倒序返回统一响应信封。每条奖励 SHALL 包含 ID、名称、描述、图片文件 ID、兑换积分、总库存、已预留库存、已领取数量、剩余可兑换数量、领取地点、领取天数、上下架状态、创建时间和更新时间。未登录 SHALL 返回 401 `UNAUTHORIZED`，非管理员 SHALL 返回 403 `FORBIDDEN`。

#### Scenario: 管理员获取奖励列表

- **WHEN** 管理员请求 `GET /api/v1/admin/rewards`
- **THEN** 返回 200，`data` 按创建时间倒序、ID 倒序包含奖励及完整库存字段

#### Scenario: 奖励列表为空

- **WHEN** 系统没有任何奖励记录
- **THEN** 返回 200，`data` 为空数组，而不是 404

#### Scenario: 未授权访问奖励列表

- **WHEN** 未登录用户或学生账号请求奖励列表
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 奖励新增接口

admin SHALL 通过 `POST /api/v1/admin/rewards` 新增奖励，请求体为 `{ name, description?, imageFileIds?, pointsCost, availableStock, location, pickupDays, enabled }`。名称去除首尾空白后 SHALL 为 1–60 字，描述最多 500 字，领取地点 1–200 字，兑换积分 SHALL ≥1，总库存 SHALL ≥0，领取天数 SHALL ≥1。图片最多 3 张且必须为公开图片。成功 SHALL 返回 200 和奖励视图。

#### Scenario: 新增奖励

- **WHEN** 管理员提交合法的奖励字段和公开图片
- **THEN** 返回 200，奖励出现在管理端列表中且剩余可兑换数量等于总库存

#### Scenario: 积分或库存非法

- **WHEN** 管理员提交兑换积分为 0、总库存为负数或领取天数为 0
- **THEN** 返回 400 `REWARD_FIELDS_INVALID` 或 `INVALID_REQUEST`，不创建奖励

#### Scenario: 图片不可用

- **WHEN** 管理员提交不存在或未公开的图片文件 ID
- **THEN** 返回 400 `INVALID_IMAGE_FILES`，不创建奖励

#### Scenario: 学生新增奖励

- **WHEN** 学生账号请求新增奖励
- **THEN** 返回 403 `FORBIDDEN`，不创建奖励

### Requirement: 奖励编辑与库存约束

admin SHALL 通过 `PUT /api/v1/admin/rewards/{id}` 编辑奖励，字段与新增一致。奖励不存在 SHALL 返回 404 `REWARD_NOT_FOUND`。总库存小于已预留库存与已领取数量之和时 SHALL 返回 409 `REWARD_STOCK_RESERVED`，奖励保持不变。成功 SHALL 返回 200 和更新后的奖励视图，并记录操作人、奖励 ID 和上下架状态的审计事件。

#### Scenario: 编辑奖励

- **WHEN** 管理员修改名称、描述、兑换积分、库存或领取信息
- **THEN** 返回 200，列表和编辑抽屉显示更新后的值

#### Scenario: 库存低于已占用数量

- **WHEN** 管理员把总库存改为小于已预留库存与已领取数量之和
- **THEN** 返回 409 `REWARD_STOCK_RESERVED`，总库存和订单占用均不变

#### Scenario: 编辑不存在的奖励

- **WHEN** 管理员请求编辑不存在的奖励 ID
- **THEN** 返回 404 `REWARD_NOT_FOUND`

#### Scenario: 未授权编辑奖励

- **WHEN** 未登录用户或学生账号请求编辑奖励
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，奖励不变

### Requirement: 奖励上下架语义

奖励 `enabled=false` 时 SHALL 阻止新的学生兑换并返回 409 `REWARD_DISABLED`；既有订单的确认领取、取消和超时退分 SHALL NOT 受奖励上下架状态影响。管理端列表 SHALL 始终返回停用奖励，并按状态显示“上架”或“下架”。

#### Scenario: 停用奖励阻止新兑换

- **WHEN** 学生兑换已停用的奖励
- **THEN** 返回 409 `REWARD_DISABLED`，不创建订单、不扣积分、不占用库存

#### Scenario: 停用前创建的订单继续履约

- **WHEN** 奖励在订单创建后被停用，管理员确认领取该订单
- **THEN** 订单仍可变为已领取，已预留库存转为已领取数量

#### Scenario: 管理端显示停用奖励

- **WHEN** 管理员打开奖励列表且存在停用奖励
- **THEN** 该奖励仍出现在列表中并显示“下架”

### Requirement: 管理端兑换订单列表接口

admin SHALL 通过 `GET /api/v1/admin/rewards/orders` 获取兑换订单，可选 `status` 查询参数。`status` 只接受 `WAITING_PICKUP`、`CLAIMED`、`CANCELLED` 或 `EXPIRED`；省略时返回全部，未知值 SHALL 返回 400 `INVALID_REQUEST`。订单 SHALL 按创建时间倒序、ID 倒序返回，并包含订单号、学生账号 ID、学生邮箱、奖励名称、消耗积分、状态、领取地点、领取截止时间、取消或超时原因、退分时间、领取时间、创建时间和更新时间。

#### Scenario: 管理员获取全部订单

- **WHEN** 管理员请求 `GET /api/v1/admin/rewards/orders`
- **THEN** 返回 200，`data` 按创建时间倒序、ID 倒序包含全部订单

#### Scenario: 按状态筛选订单

- **WHEN** 管理员传入 `status=WAITING_PICKUP`
- **THEN** 返回 200，`data` 只包含待领取订单

#### Scenario: 未知状态筛选

- **WHEN** 管理员传入 `status=UNKNOWN`
- **THEN** 返回 400 `INVALID_REQUEST`，不返回空列表

#### Scenario: 未授权访问订单列表

- **WHEN** 未登录用户或学生账号请求管理端订单列表
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`

### Requirement: 确认领取接口

admin SHALL 通过 `POST /api/v1/admin/rewards/orders/{id}/claim` 确认领取。仅 `WAITING_PICKUP` 且未超过领取截止时间的订单 SHALL 成功：状态变为 `CLAIMED`，已预留库存减一、已领取数量加一，记录领取时间和操作审计，返回 200。订单不存在 SHALL 返回 404 `ORDER_NOT_FOUND`；已领取、已取消或已超时 SHALL 返回 409 `ORDER_STATUS_INVALID`。

#### Scenario: 确认领取成功

- **WHEN** 管理员确认领取未超时的待领取订单
- **THEN** 返回 200，订单状态为 `CLAIMED`，已预留库存减一、已领取数量加一

#### Scenario: 重复确认领取

- **WHEN** 管理员再次确认已领取的订单
- **THEN** 返回 409 `ORDER_STATUS_INVALID`，库存和积分不变

#### Scenario: 确认不存在的订单

- **WHEN** 管理员确认不存在的订单 ID
- **THEN** 返回 404 `ORDER_NOT_FOUND`

#### Scenario: 未授权确认领取

- **WHEN** 未登录用户或学生账号请求确认领取
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，订单不变

### Requirement: 取消订单接口

admin SHALL 通过 `POST /api/v1/admin/rewards/orders/{id}/cancel` 取消待领取订单，请求体为 `{ reason }`。`reason` 去除首尾空白后 SHALL 为 5–200 字，否则返回 400 `INVALID_REQUEST`。成功 SHALL 返回 200，订单变为 `CANCELLED`，使用独立 `REDEMPTION_REFUND:{orderId}` 流水退回积分一次，释放预留库存，并记录原因、退分时间和操作审计。订单不存在 SHALL 返回 404 `ORDER_NOT_FOUND`；已处理订单 SHALL 返回 409 `ORDER_STATUS_INVALID`。

#### Scenario: 取消待领取订单

- **WHEN** 管理员提交合法原因取消待领取订单
- **THEN** 返回 200，订单为 `CANCELLED`，积分退回且预留库存释放

#### Scenario: 取消原因去除空白后不足五字

- **WHEN** 管理员提交少于 5 字或仅包含空白的原因
- **THEN** 返回 400 `INVALID_REQUEST`，订单、积分和库存不变

#### Scenario: 取消已领取订单

- **WHEN** 管理员取消已领取或已取消的订单
- **THEN** 返回 409 `ORDER_STATUS_INVALID`，不重复退分或释放库存

#### Scenario: 取消不存在的订单

- **WHEN** 管理员取消不存在的订单 ID
- **THEN** 返回 404 `ORDER_NOT_FOUND`

#### Scenario: 未授权取消订单

- **WHEN** 未登录用户或学生账号请求取消订单
- **THEN** 返回 401 `UNAUTHORIZED` 或 403 `FORBIDDEN`，订单不变

### Requirement: 订单超时退分

系统 SHALL 在订单超过领取截止时间后把仍为 `WAITING_PICKUP` 的订单变为 `EXPIRED`，使用 `REDEMPTION_REFUND:{orderId}` 流水退回积分一次，释放预留库存，并记录原因“领取超时，系统已退回积分”。定时处理 SHALL 每个维护周期执行一次；同一订单重复处理 SHALL NOT 重复退分或重复释放库存。管理员确认领取已超时订单时 SHALL 按同一超时规则处理并返回 200 和 `EXPIRED` 视图。

#### Scenario: 定时任务处理超时订单

- **WHEN** 待领取订单的领取截止时间已过且维护任务执行
- **THEN** 订单变为 `EXPIRED`，积分退回一次且预留库存释放

#### Scenario: 重复扫描同一订单

- **WHEN** 维护任务再次扫描已超时订单
- **THEN** 不重复退分、不重复释放库存、不重复写退款流水

#### Scenario: 确认领取时发现已超时

- **WHEN** 管理员确认领取已过截止时间但尚未被定时任务处理的订单
- **THEN** 返回 200，订单为 `EXPIRED`，积分和库存按超时规则恢复一次

#### Scenario: 停用奖励的超时订单

- **WHEN** 奖励已下架但订单超过领取截止时间
- **THEN** 订单仍正常变为 `EXPIRED` 并退分，不受上下架状态影响

### Requirement: 页面奖励商品

admin SHALL 在 `/points/rewards` 显示奖励商品列表，列包含商品、兑换积分、库存、领取地点、领取期限、状态、更新时间和操作。库存 SHALL 同时显示剩余可兑换数量和总库存，并能区分已预留与已领取数量。筛选 SHALL 支持名称关键词和上下架状态，点击“查询”生效，“重置”恢复默认；列表每页 10 条并显示总数。“新增奖励”和行内“编辑”SHALL 打开抽屉，字段与新增接口一致，图片最多 3 张；停用奖励 SHALL 二次确认。

#### Scenario: 奖励默认列表

- **WHEN** 管理员访问 `/points/rewards`
- **THEN** 按创建时间倒序显示奖励、分开展示的库存和中文状态

#### Scenario: 筛选奖励

- **WHEN** 管理员输入名称关键词或选择上下架状态并点击“查询”
- **THEN** 只显示匹配奖励，分页回到第一页

#### Scenario: 新增奖励

- **WHEN** 管理员填写合法字段、上传不超过 3 张图片并保存
- **THEN** 提示成功、抽屉关闭，列表刷新并显示新奖励

#### Scenario: 编辑奖励库存

- **WHEN** 管理员编辑奖励并查看库存字段
- **THEN** 表单显示总库存、已预留、已领取和剩余可兑换，提交低于已占用数量的总库存时显示中文错误

#### Scenario: 停用奖励确认

- **WHEN** 管理员点击“下架”
- **THEN** 先显示二次确认，取消时保持上架，确认后列表状态更新为下架

#### Scenario: 奖励保存失败

- **WHEN** 保存奖励返回字段或图片校验错误
- **THEN** 抽屉保持打开、保留输入并显示中文错误

### Requirement: 页面兑换订单

admin SHALL 在 `/points/orders` 显示兑换订单，列包含订单号、学生、奖励、消耗积分、下单时间、领取截止时间、状态和操作。学生姓名和学号 SHALL 通过账号目录按学生账号 ID 关联，缺失时回退邮箱。筛选 SHALL 支持关键词、订单状态和下单日期范围；`status` 查询参数 SHALL 作为订单状态初始筛选，无效值 SHALL 被忽略；列表每页 10 条并显示总数。“确认领取”SHALL 二次确认；“取消订单”SHALL 打开原因弹窗，原因去除首尾空白后 5–200 字，提交前再次确认。已超过截止时间但仍为待领取的订单 SHALL 显示为“已超时”并禁用核销和取消。

#### Scenario: 订单默认列表

- **WHEN** 管理员访问 `/points/orders`
- **THEN** 按创建时间倒序显示订单，学生列显示姓名和学号或邮箱

#### Scenario: URL 状态筛选

- **WHEN** 管理员直接访问 `/points/orders?status=WAITING_PICKUP`
- **THEN** 订单状态筛选初始为“待领取”，列表只显示待领取订单

#### Scenario: 无效状态参数

- **WHEN** `status` 不是已知订单状态
- **THEN** admin 忽略该参数并显示全部订单，不显示错误页

#### Scenario: 筛选订单

- **WHEN** 管理员选择状态、输入订单号或学生关键词、设置日期范围并点击“查询”
- **THEN** 只显示匹配订单，分页回到第一页

#### Scenario: 确认领取

- **WHEN** 管理员点击“确认领取”并在二次确认中确认
- **THEN** 接口提交一次，成功后提示、列表刷新且订单显示“已领取”

#### Scenario: 取消订单

- **WHEN** 管理员填写合法原因并确认取消
- **THEN** 订单变为“已取消”，列表显示原因，积分和库存刷新

#### Scenario: 取消原因不合法

- **WHEN** 取消原因为空、去除空白后少于 5 字或多于 200 字
- **THEN** 弹窗保持打开并显示中文错误，不发送取消请求

#### Scenario: 已超时订单

- **WHEN** 待领取订单的领取截止时间早于当前时间
- **THEN** 行内状态显示“已超时”，核销和取消按钮禁用

#### Scenario: 账号目录加载失败

- **WHEN** 订单请求成功但账号目录请求失败
- **THEN** 订单仍显示，学生列回退邮箱，并提示账号资料暂不可用

#### Scenario: 订单分页

- **WHEN** 订单或筛选结果超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数并可切换下一页

### Requirement: 奖励与订单页面空态、失败与窄屏

奖励商品和兑换订单在加载中 SHALL 显示加载状态；空数据 SHALL 显示中文空态和刷新入口；主列表失败 SHALL 显示中文错误和“重试”。视口小于 992px 时页面 SHALL NOT 产生横向滚动，表格 SHALL 在内容区内部滚动；奖励编辑抽屉和取消订单弹窗 SHALL 适配窄屏，320px 下可完成查看和提交。

#### Scenario: 奖励加载失败

- **WHEN** 奖励列表请求失败
- **THEN** 页面显示中文错误和“重试”，不显示空的成功状态

#### Scenario: 订单加载失败

- **WHEN** 订单列表请求失败
- **THEN** 页面显示中文错误和“重试”，保留页面标题和筛选区

#### Scenario: 空奖励或空订单

- **WHEN** 奖励或订单接口返回空数组
- **THEN** 显示对应中文空态和刷新入口

#### Scenario: 窄屏适配

- **WHEN** 视口宽度为 320px
- **THEN** 页面不产生横向滚动，表格内部滚动，抽屉和取消弹窗可完整操作
