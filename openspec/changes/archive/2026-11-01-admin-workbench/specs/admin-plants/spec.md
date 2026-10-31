# Spec Delta

## MODIFIED Requirements

### Requirement: 单株筛选

单株列表 SHALL 支持按编号或位置关键词、品种和状态筛选；筛选在点击“查询”后生效，“重置”恢复全部。`speciesId` 查询参数 SHALL 作为品种初始筛选，`status` 查询参数 SHALL 作为状态初始筛选；无效值 SHALL 被忽略。筛选与分页 SHALL 在客户端完成。

#### Scenario: 组合筛选

- **WHEN** 管理员输入关键词、选择品种和状态后点击“查询”
- **THEN** 列表只显示同时满足三个条件的单株

#### Scenario: URL 初始筛选

- **WHEN** 管理员直接访问 `/plants/instances?speciesId=3`
- **THEN** 品种筛选初始为 ID 3 对应的品种，列表只显示该品种单株

#### Scenario: URL 状态筛选

- **WHEN** 管理员直接访问 `/plants/instances?status=ACTIVE`
- **THEN** 状态筛选初始为“养护中”，列表只显示养护中的单株

#### Scenario: 品种与状态同时初始化

- **WHEN** 管理员直接访问 `/plants/instances?speciesId=3&status=AVAILABLE`
- **THEN** 品种筛选初始为 ID 3，状态筛选初始为“可领养”，列表只显示同时满足两个条件的单株

#### Scenario: 无效品种参数

- **WHEN** `speciesId` 不存在或不是数字
- **THEN** admin 忽略该参数并显示全部单株，不显示错误页

#### Scenario: 无效状态参数

- **WHEN** `status` 不是已知单株状态
- **THEN** admin 忽略该参数并显示全部单株，不显示错误页

#### Scenario: 重置筛选

- **WHEN** 管理员点击“重置”
- **THEN** 关键词、品种和状态恢复为空，列表显示全部单株
