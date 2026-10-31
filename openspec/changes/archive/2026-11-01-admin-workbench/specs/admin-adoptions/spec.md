# Spec Delta

## MODIFIED Requirements

### Requirement: 领养申请筛选

列表 SHALL 支持按关键词、状态、品种和提交日期范围筛选。关键词 SHALL 不区分大小写匹配申请编号、学生姓名、学号和邮箱；筛选在点击“查询”后生效，“重置”恢复默认。筛选与分页 SHALL 在客户端完成。`status` 查询参数 SHALL 作为状态初始筛选；除已知申请状态外，SHALL 接受组合值 `CHANGES`，表示取消审核中或归还审核中；其他值 SHALL 被忽略。

#### Scenario: 关键词筛选

- **WHEN** 管理员输入申请编号、学生姓名、学号或邮箱的一部分并点击“查询”
- **THEN** 列表只显示匹配关键词的申请，分页重置到第一页

#### Scenario: URL 初始状态

- **WHEN** 管理员直接访问 `/adoptions?status=PENDING_REVIEW`
- **THEN** 状态筛选初始为“待审核”，列表只显示待审核申请

#### Scenario: 组合变更筛选

- **WHEN** 管理员直接访问 `/adoptions?status=CHANGES`
- **THEN** 状态筛选显示“待处理变更”，列表只显示取消审核中和归还审核中的申请

#### Scenario: 组合筛选

- **WHEN** 管理员同时选择状态、品种和提交日期范围并点击“查询”
- **THEN** 列表只显示同时满足三个条件的申请

#### Scenario: 无效状态参数

- **WHEN** `status` 既不是已知申请状态也不是 `CHANGES`
- **THEN** admin 忽略该参数并显示全部申请，不显示错误页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、状态、品种和日期范围恢复为空，列表显示全部申请
