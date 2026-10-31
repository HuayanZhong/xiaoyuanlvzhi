import {
  Alert,
  Button,
  Empty,
  Flex,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import type { PointRuleView } from "@/api/points";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import { formatDateTime } from "@/lib/format";
import { frequencySummary, ruleSourceLabel, ruleStatusLabel } from "./labels";

type PointRulesPanelProps = {
  rules: PointRuleView[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onEdit: (rule: PointRuleView) => void;
};

function pointsCell(rule: PointRuleView) {
  if (rule.sourceType === "ECO_TASK") {
    return "由任务配置决定";
  }

  return `${rule.points} 分`;
}

/** 积分规则 tab：两条固定规则、来源语义说明和编辑入口。 */
export default function PointRulesPanel({
  rules,
  loading,
  failed,
  onRetry,
  onEdit,
}: PointRulesPanelProps) {
  const columns: TableColumnsType<PointRuleView> = [
    {
      title: "来源",
      dataIndex: "sourceType",
      width: 140,
      render: (value: string) => (
        <Typography.Text strong>{ruleSourceLabel(value)}</Typography.Text>
      ),
    },
    {
      title: "每次积分",
      key: "points",
      width: 160,
      render: (_: unknown, record) => pointsCell(record),
    },
    {
      title: "频控",
      key: "frequency",
      width: 150,
      render: (_: unknown, record) => frequencySummary(record),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      align: "center",
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>
          {ruleStatusLabel(enabled)}
        </Tag>
      ),
    },
    {
      title: "生效时间",
      dataIndex: "effectiveFrom",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "actions",
      width: 90,
      render: (_: unknown, record) => (
        <Button size="small" type="link" onClick={() => onEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  if (failed) {
    return (
      <LoadFailure message="积分规则加载失败，请稍后重试" onRetry={onRetry} />
    );
  }

  const emptyState = (
    <Empty description="暂无积分规则" image={Empty.PRESENTED_IMAGE_SIMPLE}>
      <Button onClick={onRetry}>刷新</Button>
    </Empty>
  );

  return (
    <Flex gap={16} vertical>
      <Flex gap={8} vertical>
        <Alert
          showIcon
          description="规则积分优先；规则停用、未生效或积分不大于 0 时使用品种积分。"
          title="养护打卡"
          type="info"
        />
        <Alert
          showIcon
          description="任务积分始终取任务的每人奖励积分；本规则只控制启用状态和每日/每周频控。"
          title="环保任务"
          type="info"
        />
      </Flex>

      <AdminTable<PointRuleView>
        columns={columns}
        dataSource={rules}
        loading={loading}
        locale={{ emptyText: emptyState }}
        pagination={false}
        rowKey="id"
        scroll={{ x: 980 }}
        size="middle"
      />
    </Flex>
  );
}
