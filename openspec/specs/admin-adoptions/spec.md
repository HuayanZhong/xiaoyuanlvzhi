# admin-adoptions Specification

## Purpose

定义管理端领养管理的可观察行为：管理员在后台查看和筛选领养申请，查看学生与状态时间线，完成审核选株、驳回、线下交接、取消和归还处理，并得到一致的中文状态与错误反馈。

## Requirements

### Requirement: 领养申请列表

admin SHALL 在 `/adoptions` 显示领养申请列表，包含申请编号、学生、学号、品种、单株、申请时间、状态和操作列。列表 SHALL 按申请时间倒序，每页 10 条并在客户端分页；状态 SHALL 使用中文文案，不得只依赖颜色区分。

#### Scenario: 查看申请列表

- **WHEN** 管理员访问 `/adoptions`
- **THEN** admin 请求 `GET /api/v1/admin/adoptions`，并按申请时间倒序显示申请编号、学生、学号、品种、单株、申请时间、状态和操作

#### Scenario: 客户端分页

- **WHEN** 申请数量超过 10 条
- **THEN** 第一页只显示 10 条，分页器显示总数，并可切换到下一页

#### Scenario: 状态文案

- **WHEN** 申请状态为 `PENDING_REVIEW`、`REJECTED`、`WAITING_PICKUP`、`CANCEL_REVIEW`、`ACTIVE`、`RETURN_REVIEW`、`ENDED` 或 `CANCELLED`
- **THEN** 状态列分别显示“待审核”“已驳回”“待领取”“取消审核中”“养护中”“归还审核中”“已结束”“已取消”

### Requirement: 领养申请筛选

列表 SHALL 支持按关键词、状态、品种和提交日期范围筛选。关键词 SHALL 不区分大小写匹配申请编号、学生姓名、学号和邮箱；筛选在点击“查询”后生效，“重置”恢复默认。筛选与分页 SHALL 在客户端完成。`status` 查询参数 SHALL 作为状态初始筛选，无效值 SHALL 被忽略。

#### Scenario: 关键词筛选

- **WHEN** 管理员输入申请编号、学生姓名、学号或邮箱的一部分并点击“查询”
- **THEN** 列表只显示匹配关键词的申请，分页重置到第一页

#### Scenario: URL 初始状态

- **WHEN** 管理员直接访问 `/adoptions?status=PENDING_REVIEW`
- **THEN** 状态筛选初始为“待审核”，列表只显示待审核申请

#### Scenario: 组合筛选

- **WHEN** 管理员同时选择状态、品种和提交日期范围并点击“查询”
- **THEN** 列表只显示同时满足三个条件的申请

#### Scenario: 无效状态参数

- **WHEN** `status` 不是已知申请状态
- **THEN** admin 忽略该参数并显示全部申请，不显示错误页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、状态、品种和日期范围恢复为空，列表显示全部申请

### Requirement: 学生信息关联

列表和详情 SHALL 显示学生姓名、学号、院系、班级和邮箱。admin SHALL 请求 `GET /api/v1/admin/accounts` 并按申请的 `studentId` 关联账号；账号请求失败 SHALL NOT 阻塞领养列表，学生列 SHALL 降级为邮箱。

#### Scenario: 关联学生资料

- **WHEN** 申请的学生账号存在于账号列表
- **THEN** 列表和详情显示该学生的姓名、学号和院系班级

#### Scenario: 账号请求失败

- **WHEN** `GET /api/v1/admin/accounts` 失败而领养列表成功
- **THEN** 领养列表仍显示，学生列显示邮箱，页面不进入加载失败状态

#### Scenario: 账号缺失

- **WHEN** 某个申请的 `studentId` 在账号列表中不存在
- **THEN** 学生列显示申请的 `studentEmail`，不显示空白

### Requirement: 申请详情与状态时间线

点击“查看” SHALL 打开详情抽屉并请求 `GET /api/v1/admin/adoptions/{id}`，显示学生资料、品种、绑定单株编号与位置、申请备注、状态、领取截止时间、审核原因、归还原因与结果、创建和更新时间，以及按时间排序的状态事件。详情请求失败 SHALL 显示中文错误和重试入口。

#### Scenario: 打开详情

- **WHEN** 管理员点击某条申请的“查看”
- **THEN** 抽屉显示该申请的学生资料、申请信息和当前状态

#### Scenario: 状态时间线

- **WHEN** 详情返回多条状态事件
- **THEN** 抽屉按发生时间显示每次状态变化的前后状态、原因和时间

#### Scenario: 未绑定单株

- **WHEN** 申请尚未分配单株
- **THEN** 单株字段显示“未分配”，不显示空表格或报错

#### Scenario: 详情加载失败

- **WHEN** 详情请求失败
- **THEN** 抽屉显示中文错误和“重试”按钮，点击后重新请求

### Requirement: 审核通过并分配单株

状态为 `PENDING_REVIEW` 的申请 SHALL 提供“通过”操作。通过 SHALL 打开选株弹窗，只列出与申请品种相同且状态为“可领养”的单株；管理员选择一株后 SHALL 发送 `POST /api/v1/admin/adoptions/{id}/approve`，请求体为 `{ "plantId": <id> }`。成功后申请变为“待领取”，详情和列表 SHALL 刷新。

#### Scenario: 通过并选株

- **WHEN** 管理员选择一株同品种可领养单株并确认
- **THEN** admin 发送带 `plantId` 的通过请求，成功后申请显示“待领取”并显示绑定单株

#### Scenario: 只显示可领养单株

- **WHEN** 选株弹窗打开
- **THEN** 待领取、养护中、维护中和已停用的单株不出现在可选项中

#### Scenario: 暂无可领养单株

- **WHEN** 申请品种没有可领养单株
- **THEN** 弹窗显示空状态和“去单株库存”入口，通过按钮不可提交

#### Scenario: 单株已被占用

- **WHEN** Spring 返回 409 `PLANT_NOT_AVAILABLE`
- **THEN** 弹窗保持打开，刷新可选单株，并显示“所选单株已被分配或不可领养”

#### Scenario: 品种已停用

- **WHEN** Spring 返回 409 `PLANT_SPECIES_DISABLED`
- **THEN** 弹窗关闭，详情和列表刷新，并显示后端中文原因

#### Scenario: 申请状态已变化

- **WHEN** Spring 返回 409 `ADOPTION_STATUS_INVALID`
- **THEN** 弹窗关闭，详情和列表刷新，并提示申请状态已变化

### Requirement: 驳回申请

状态为 `PENDING_REVIEW` 的申请 SHALL 提供“驳回”操作。驳回原因 SHALL 必填且为 5 到 200 字；确认后 SHALL 发送 `POST /api/v1/admin/adoptions/{id}/reject`，请求体为 `{ "reason": "<原因>" }`。成功后申请变为“已驳回”，详情 SHALL 显示驳回原因。

#### Scenario: 驳回成功

- **WHEN** 管理员填写 5 到 200 字原因并确认驳回
- **THEN** admin 发送驳回请求，成功后申请显示“已驳回”并展示原因

#### Scenario: 原因过短

- **WHEN** 管理员填写少于 5 字的原因
- **THEN** 表单显示中文长度错误，且不发送请求

#### Scenario: 驳回失败保留输入

- **WHEN** 驳回请求因 5xx 或网络错误失败
- **THEN** 弹窗保持打开，已填原因不丢失，并显示中文错误

### Requirement: 确认线下交接

状态为 `WAITING_PICKUP` 的申请 SHALL 提供“确认交接”操作，并在请求前二次确认。确认后 SHALL 发送 `POST /api/v1/admin/adoptions/{id}/handover`。成功后申请变为“养护中”，详情和列表 SHALL 刷新。

#### Scenario: 确认交接

- **WHEN** 管理员在二次确认中确认已线下交付
- **THEN** admin 发送交接请求，成功后申请显示“养护中”

#### Scenario: 取消交接确认

- **WHEN** 管理员在二次确认中取消
- **THEN** 不发送请求，申请保持“待领取”

#### Scenario: 交接失败

- **WHEN** 交接请求失败
- **THEN** 申请保持原状态，并显示中文错误

### Requirement: 处理取消申请

状态为 `CANCEL_REVIEW` 的申请 SHALL 提供“同意取消”和“拒绝取消”。同意 SHALL 发送 `POST /api/v1/admin/adoptions/{id}/cancel-decision`，请求体为 `{ "approved": true }`，成功后申请变为“已取消”并释放单株。拒绝 SHALL 携带 5 到 200 字原因和 `approved=false`，成功后申请回到“待领取”。

#### Scenario: 同意取消

- **WHEN** 管理员确认同意取消
- **THEN** admin 发送 `approved=true`，成功后申请显示“已取消”

#### Scenario: 拒绝取消

- **WHEN** 管理员填写原因并拒绝取消
- **THEN** admin 发送 `approved=false` 和原因，成功后申请显示“待领取”

#### Scenario: 拒绝取消缺少原因

- **WHEN** 管理员未填写原因就拒绝取消
- **THEN** 表单显示中文必填错误，且不发送请求

### Requirement: 处理归还申请

状态为 `RETURN_REVIEW` 的申请 SHALL 提供“确认归还”和“驳回归还”。确认归还 SHALL 让管理员选择“重新开放领养”或“转入维护”，并发送 `POST /api/v1/admin/adoptions/{id}/return-decision`，请求体包含 `approved=true` 和 `returnResult`（`AVAILABLE` 或 `MAINTENANCE`）。驳回归还 SHALL 携带 5 到 200 字原因和 `approved=false`，成功后申请回到“养护中”。

#### Scenario: 归还后重新开放

- **WHEN** 管理员选择“重新开放领养”并确认
- **THEN** admin 发送 `returnResult=AVAILABLE`，成功后申请显示“已结束”，归还结果显示“重新开放领养”

#### Scenario: 归还后转入维护

- **WHEN** 管理员选择“转入维护”并确认
- **THEN** admin 发送 `returnResult=MAINTENANCE`，成功后申请显示“已结束”，归还结果显示“转入维护”

#### Scenario: 未选择归还结果

- **WHEN** 管理员未选择归还结果就提交
- **THEN** 弹窗显示中文错误，且不发送请求

#### Scenario: 驳回归还

- **WHEN** 管理员填写原因并驳回归还
- **THEN** admin 发送 `approved=false` 和原因，成功后申请显示“养护中”

#### Scenario: 驳回归还缺少原因

- **WHEN** 管理员未填写原因就驳回归还
- **THEN** 表单显示中文必填错误，且不发送请求

### Requirement: 操作可见性与提交状态

操作按钮 SHALL 只在对应状态下显示；其他状态 SHALL 只读。请求进行中 SHALL 禁用提交按钮，防止重复提交。状态不满足时 SHALL NOT 发起请求。

#### Scenario: 只读状态

- **WHEN** 申请处于“已驳回”“养护中”“已结束”或“已取消”
- **THEN** 详情不显示审核、交接、取消或归还操作按钮

#### Scenario: 防止重复提交

- **WHEN** 管理员已点击确认且请求尚未返回
- **THEN** 提交按钮显示加载状态并不可再次点击

### Requirement: 接口错误与状态冲突

admin SHALL 使用统一响应信封（`success`、`data`、`error.code`、`error.message`）。非 2xx 或 `success=false` SHALL 转换为中文错误；401 SHALL 交给现有登录态处理；`ADOPTION_STATUS_INVALID` SHALL 提示状态已变化并刷新；网络错误、超时和未知错误 SHALL 显示可重试的中文提示，且不导致页面崩溃。

#### Scenario: 申请状态已变化

- **WHEN** 任一操作返回 409 `ADOPTION_STATUS_INVALID`
- **THEN** 页面提示“申请状态已变化，请刷新后重试”，并重新请求列表和详情

#### Scenario: 未认证响应

- **WHEN** 任一领养请求返回 401
- **THEN** 沿用现有登录态处理跳转登录页，页面不额外显示重复错误

#### Scenario: 网络或超时

- **WHEN** 请求因网络错误或超时失败
- **THEN** 页面显示可重试的中文提示，已填写的表单内容保持不变

### Requirement: 加载、空态与失败重试

列表请求期间 SHALL 显示加载状态；请求失败 SHALL 显示中文错误和重试入口；列表为空 SHALL 显示空状态。详情请求期间 SHALL 显示加载状态，失败时提供重试。

#### Scenario: 列表加载失败

- **WHEN** 列表请求因网络错误或 5xx 失败
- **THEN** 页面显示中文错误和“重试”按钮，点击后重新请求并恢复列表

#### Scenario: 空列表

- **WHEN** 没有任何领养申请
- **THEN** 页面显示“暂无领养申请”的空状态，而不是空白区域

#### Scenario: 详情加载中

- **WHEN** 管理员打开详情且请求尚未返回
- **THEN** 抽屉显示加载状态，操作按钮不可用

### Requirement: 窄屏表现

视口宽度小于 992px 时，列表 SHALL 在内容区内部横向滚动，页面本身 SHALL NOT 产生横向滚动；详情抽屉 SHALL 占满可用宽度；选株和决策弹窗 SHALL 可完整操作。

#### Scenario: 320px 视口

- **WHEN** 管理员在 320px 宽视口查看领养列表
- **THEN** 表格在卡片内部滚动，页面不产生横向滚动

#### Scenario: 窄屏查看详情

- **WHEN** 管理员在窄屏打开详情抽屉
- **THEN** 抽屉占满可用宽度，状态时间线和所有可见操作可操作
