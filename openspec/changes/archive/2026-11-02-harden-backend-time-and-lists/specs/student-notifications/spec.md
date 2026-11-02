# Spec Delta

## ADDED Requirements

### Requirement: 兑换通知领取截止时间

兑换成功通知的摘要 SHALL 使用 `yyyy-MM-dd HH:mm`（Asia/Shanghai）显示领取截止时间，SHALL NOT 出现原始 ISO 时间戳、`T` 分隔符或纳秒。通知列表 SHALL 原样展示该摘要，不再二次解析时间。

#### Scenario: 兑换成功通知

- **WHEN** 学生在 2026-11-02 20:48 兑换奖励，领取截止为 7 天后
- **THEN** 通知摘要为「请在 2026-11-09 20:48 前到 学生活动中心 101 领取。」，不包含 `T` 或纳秒

#### Scenario: 历史通知兼容

- **WHEN** 通知列表展示此前生成的兑换通知
- **THEN** 每条摘要独立显示，不因时间格式不同而隐藏或合并
