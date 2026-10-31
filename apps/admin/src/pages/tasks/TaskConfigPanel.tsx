import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Select,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useMemo, useState } from "react";
import type { AdminTaskView, TaskStatus } from "@/api/tasks";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import { formatDateTime } from "@/lib/format";
import {
  TASK_STATUS_OPTIONS,
  taskStatusColor,
  taskStatusLabel,
} from "./labels";

const PAGE_SIZE = 10;

type StatusFilter = "all" | TaskStatus;

type TaskFilters = {
  keyword: string;
  status: StatusFilter;
  from: string;
  to: string;
};

const EMPTY_FILTERS: TaskFilters = {
  keyword: "",
  status: "all",
  from: "",
  to: "",
};

type TaskConfigPanelProps = {
  tasks: AdminTaskView[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (task: AdminTaskView) => void;
  onCopy: (task: AdminTaskView) => void;
  onStop: (task: AdminTaskView) => void;
  onViewParticipations: (task: AdminTaskView) => void;
};

function sortTasks(tasks: AdminTaskView[]): AdminTaskView[] {
  return (
    [...tasks]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

/** 任务配置 tab：列表、筛选、分页和按状态显示的操作。 */
export default function TaskConfigPanel({
  tasks,
  loading,
  failed,
  onRetry,
  onCreate,
  onEdit,
  onCopy,
  onStop,
  onViewParticipations,
}: TaskConfigPanelProps) {
  const [draft, setDraft] = useState<TaskFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortTasks(
      tasks
        .filter(
          (task) => !keyword || task.title.toLowerCase().includes(keyword),
        )
        .filter(
          (task) => filters.status === "all" || task.status === filters.status,
        )
        .filter((task) => {
          const day = task.startsAt.slice(0, 10);

          return (
            (!filters.from || day >= filters.from) &&
            (!filters.to || day <= filters.to)
          );
        }),
    );
  }, [filters, tasks]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const columns: TableColumnsType<AdminTaskView> = [
    {
      title: "任务标题",
      dataIndex: "title",
      width: 220,
      render: (value: string) => (
        <Typography.Text strong>{value}</Typography.Text>
      ),
    },
    {
      title: "开放时间",
      key: "time",
      width: 210,
      render: (_: unknown, record) => (
        <div>
          <div>{formatDateTime(record.startsAt)}</div>
          <Typography.Text type="secondary">
            至 {formatDateTime(record.endsAt)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "报名/上限",
      key: "participants",
      align: "center",
      width: 120,
      render: (_: unknown, record) =>
        `${record.participantCount} / ${record.maxParticipants ?? "不限"}`,
    },
    {
      title: "通过人数",
      dataIndex: "approvedCount",
      align: "center",
      width: 110,
    },
    {
      title: "每人积分",
      dataIndex: "pointsPerPerson",
      align: "center",
      width: 110,
      render: (value: number) => `${value} 分`,
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 110,
      render: (status: string) => (
        <Tag color={taskStatusColor(status)}>{taskStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 300,
      render: (_: unknown, record) => (
        <Flex gap={4} wrap>
          {record.status === "STOPPED" ? (
            <Button size="small" type="link" onClick={() => onEdit(record)}>
              查看
            </Button>
          ) : (
            <Button size="small" type="link" onClick={() => onEdit(record)}>
              编辑
            </Button>
          )}
          <Button size="small" type="link" onClick={() => onCopy(record)}>
            复制新建
          </Button>
          {record.status !== "DRAFT" && record.status !== "STOPPED" && (
            <Popconfirm
              cancelText="取消"
              description="停用后学生不能报名或提交，已提交凭证仍可审核。"
              okText="确认停用"
              onConfirm={() => onStop(record)}
              title="确认停用该任务？"
            >
              <Button danger size="small" type="link">
                停用
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => onViewParticipations(record)}
          >
            查看报名
          </Button>
        </Flex>
      ),
    },
  ];

  if (failed) {
    return (
      <LoadFailure message="任务列表加载失败，请稍后重试" onRetry={onRetry} />
    );
  }

  const emptyState = (
    <Empty
      description={
        tasks.length === 0 ? "暂无环保任务" : "没有符合筛选条件的任务"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={onRetry}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
        <Button type="primary" onClick={onCreate}>
          新建任务
        </Button>
      </Flex>
    </Empty>
  );

  return (
    <Flex gap={16} vertical>
      <Flex align="center" gap={12} wrap>
        <Input
          allowClear
          onChange={(event) =>
            setDraft((current) => ({ ...current, keyword: event.target.value }))
          }
          onPressEnter={applyFilters}
          placeholder="任务标题"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={draft.keyword}
        />
        <Select<StatusFilter>
          onChange={(status) => setDraft((current) => ({ ...current, status }))}
          options={[...TASK_STATUS_OPTIONS]}
          style={{ width: 140 }}
          value={draft.status}
        />
        <Input
          aria-label="开放日期起"
          max={draft.to || undefined}
          onChange={(event) =>
            setDraft((current) => ({ ...current, from: event.target.value }))
          }
          style={{ width: 150 }}
          type="date"
          value={draft.from}
        />
        <Typography.Text type="secondary">至</Typography.Text>
        <Input
          aria-label="开放日期止"
          min={draft.from || undefined}
          onChange={(event) =>
            setDraft((current) => ({ ...current, to: event.target.value }))
          }
          style={{ width: 150 }}
          type="date"
          value={draft.to}
        />
        <Button type="primary" onClick={applyFilters}>
          查询
        </Button>
        <Button onClick={resetFilters}>重置</Button>
      </Flex>

      <AdminTable<AdminTaskView>
        columns={columns}
        dataSource={filtered}
        loading={loading}
        locale={{ emptyText: emptyState }}
        pagination={{
          current: currentPage,
          pageSize: PAGE_SIZE,
          total: filtered.length,
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条`,
          onChange: setPage,
        }}
        rowKey="id"
        scroll={{ x: 1180 }}
        size="middle"
      />
    </Flex>
  );
}
