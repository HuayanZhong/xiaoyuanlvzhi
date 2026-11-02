# api-pagination Specification

## Purpose

定义列表接口的可选分页契约，使客户端在数据增长后按需获取分页数据，同时保持现有非分页调用的响应不变。

## Requirements

### Requirement: 列表接口可选分页

返回列表的 GET 接口 SHALL 接受可选的 `page` 与 `pageSize` 查询参数。两者同时提供时，成功响应的 `data` SHALL 为 `{items,total,page,pageSize}`；两者都不提供时 SHALL 保持现有数组响应。`page` SHALL 从 1 开始，`pageSize` SHALL 在 1–100 之间；只提供一个参数或取值非法 SHALL 返回 400 `INVALID_REQUEST`。分页结果的排序 SHALL 与不分页时一致。

#### Scenario: 不传分页参数

- **WHEN** 客户端请求 `GET /api/v1/admin/accounts` 且不传 `page` 和 `pageSize`
- **THEN** 响应的 `data` 仍为数组，形状与当前接口一致

#### Scenario: 传入分页参数

- **WHEN** 客户端请求 `GET /api/v1/admin/accounts?page=2&pageSize=10`
- **THEN** 响应的 `data` 为 `{items,total,page:2,pageSize:10}`，`items` 不超过 10 条，`total` 为全部匹配记录数

#### Scenario: 只传一个分页参数

- **WHEN** 客户端只传 `page` 或只传 `pageSize`
- **THEN** 接口返回 400，`error.code` 为 `INVALID_REQUEST`

#### Scenario: 页码越界

- **WHEN** 客户端请求的 `page` 超过最后一页
- **THEN** 响应的 `items` 为空数组，`total` 保持全部匹配记录数

#### Scenario: 分页大小越界

- **WHEN** 客户端传入 `pageSize=0`、`pageSize=101` 或非数字
- **THEN** 接口返回 400，`error.code` 为 `INVALID_REQUEST`

#### Scenario: 排序保持一致

- **WHEN** 客户端分别请求不分页和 `page=1&pageSize=N` 的同一列表
- **THEN** 分页结果的 `items` 与不分页结果的前 N 条顺序一致
