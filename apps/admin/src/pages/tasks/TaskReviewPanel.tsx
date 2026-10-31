import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Select,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useMemo } from "react";
import type {
  AdminParticipationView,
  AdminSubmissionView,
  AdminTaskView,
  ParticipationStatus,
} from "@/api/tasks";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import { formatDateTime } from "@/lib/format";
import {
  PARTICIPATION_STATUS_OPTIONS,
  participationStatusColor,
  participationStatusLabel,
  taskStatusColor,
  taskStatusLabel,
} from "./labels";

const PAGE_SIZE = 10;

export type ReviewStatusFilter = "all" | ParticipationStatus;

export type TaskReviewFilters = {
  taskId: number | "all";
  status: ReviewStatusFilter;
  keyword: string;
  from: string;
  to: string;
};

export const DEFAULT_REVIEW_FILTERS: TaskReviewFilters = {
  taskId: "all",
  status: "PENDING_REVIEW",
  keyword: "",
  from: "",
  to: "",
};

type TaskReviewPanelProps = {
  tasks: AdminTaskView[];
  participations: AdminParticipationView[];
  loading: boolean;
  failed: boolean;
  filters: TaskReviewFilters;
  appliedFilters: TaskReviewFilters;
  page: number;
  onRetry: () => void;
  onChangeFilters: (filters: TaskReviewFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  onPageChange: (page: number) => void;
  onOpen: (id: number) => void;
};

function latestSubmission(
  item: AdminParticipationView,
): AdminSubmissionView | null {
  return item.submissions.reduce<AdminSubmissionView | null>(
    (latest, submission) =>
      !latest || submission.version > latest.version ? submission : latest,
    null,
  );
}

function evidenceSummary(item: AdminParticipationView): string {
  const latest = latestSubmission(item);
  const note = latest?.note?.trim();

  if (note) {
    return note.length > 30 ? `${note.slice(0, 30)}…` : note;
  }

  if (latest && latest.imageFileIds.length > 0) {
    return `图片凭证 ${latest.imageFileIds.length} 张`;
  }

  return "未提交";
}

function pointsCell(item: AdminParticipationView) {
  if (item.status === "APPROVED") {
    return item.awardedPoints != null ? `${item.awardedPoints} 分` : "—";
  }

  if (item.status === "PENDING_REVIEW") {
    return `${item.pointsPerPerson} 分（预计）`;
  }

  return "—";
}

function sortParticipations(
  items: AdminParticipationView[],
): AdminParticipationView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.joinedAt.localeCompare(left.joinedAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

/** 凭证审核 tab：参与列表、筛选、分页和查看入口。 */
export default function TaskReviewPanel({
  tasks,
  participations,
  loading,
  failed,
  filters,
  appliedFilters,
  page,
  onRetry,
  onChangeFilters,
  onSearch,
  onReset,
  onPageChange,
  onOpen,
}: TaskReviewPanelProps) {
  const taskOptions = useMemo(
    () => [
      { value: "all" as const, label: "全部任务" },
      ...tasks.map((task) => ({ value: task.id, label: task.title })),
    ],
    [tasks],
  );

  const filtered = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return sortParticipations(
      participations
        .filter(
          (item) =>
            appliedFilters.taskId === "all" ||
            item.taskId === appliedFilters.taskId,
        )
        .filter(
          (item) =>
            appliedFilters.status === "all" ||
            item.status === appliedFilters.status,
        )
        .filter((item) => {
          if (!keyword) {
            return true;
          }

          return [
            item.taskTitle,
            item.studentName,
            item.studentNumber,
            item.studentEmail,
            item.latestNote,
          ].some((value) => value?.toLowerCase().includes(keyword));
        })
        .filter((item) => {
          const day = (item.latestSubmittedAt ?? item.joinedAt).slice(0, 10);

          return (
            (!appliedFilters.from || day >= appliedFilters.from) &&
            (!appliedFilters.to || day <= appliedFilters.to)
          );
        }),
    );
  }, [appliedFilters, participations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const columns: TableColumnsType<AdminParticipationView> = [
    {
      title: "任务",
      key: "task",
      width: 210,
      render: (_: unknown, record) => (
        <div>
          <div>{record.taskTitle}</div>
          <Tag color={taskStatusColor(record.taskStatus)}>
            {taskStatusLabel(record.taskStatus)}
          </Tag>
        </div>
      ),
    },
    {
      title: "学生",
      key: "student",
      width: 170,
      render: (_: unknown, record) => (
        <div>
          <div>{record.studentName || record.studentEmail}</div>
          <Typography.Text type="secondary">
            {record.studentNumber || record.studentEmail}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "报名时间",
      dataIndex: "joinedAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "最新提交",
      key: "submittedAt",
      width: 160,
      render: (_: unknown, record) => (
        <Typography.Text type="secondary">
          {formatDateTime(record.latestSubmittedAt)}
        </Typography.Text>
      ),
    },
    {
      title: "凭证摘要",
      key: "evidence",
      width: 220,
      render: (_: unknown, record) => (
        <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
          {evidenceSummary(record)}
        </Typography.Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 120,
      render: (status: string) => (
        <Tag color={participationStatusColor(status)}>
          {participationStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: "奖励积分",
      key: "points",
      align: "center",
      width: 130,
      render: (_: unknown, record) => pointsCell(record),
    },
    {
      title: "操作",
      key: "actions",
      width: 90,
      render: (_: unknown, record) => (
        <Button size="small" type="link" onClick={() => onOpen(record.id)}>
          查看
        </Button>
      ),
    },
  ];

  if (failed) {
    return (
      <LoadFailure
        message="任务参与记录加载失败，请稍后重试"
        onRetry={onRetry}
      />
    );
  }

  const emptyState = (
    <Empty
      description={
        participations.length === 0
          ? "暂无任务报名记录"
          : "没有符合筛选条件的参与记录"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={onRetry}>刷新</Button>
        <Button onClick={onReset}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <Flex gap={16} vertical>
      <Flex align="center" gap={12} wrap>
        <Input
          allowClear
          onChange={(event) =>
            onChangeFilters({ ...filters, keyword: event.target.value })
          }
          onPressEnter={onSearch}
          placeholder="任务标题、学生姓名、学号或邮箱"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          value={filters.keyword}
        />
        <Select<number | "all">
          onChange={(taskId) => onChangeFilters({ ...filters, taskId })}
          optionFilterProp="label"
          options={taskOptions}
          showSearch
          style={{ width: 200 }}
          value={filters.taskId}
        />
        <Select<ReviewStatusFilter>
          onChange={(status) => onChangeFilters({ ...filters, status })}
          options={[...PARTICIPATION_STATUS_OPTIONS]}
          style={{ width: 150 }}
          value={filters.status}
        />
        <Input
          aria-label="提交日期起"
          max={filters.to || undefined}
          onChange={(event) =>
            onChangeFilters({ ...filters, from: event.target.value })
          }
          style={{ width: 150 }}
          type="date"
          value={filters.from}
        />
        <Typography.Text type="secondary">至</Typography.Text>
        <Input
          aria-label="提交日期止"
          min={filters.from || undefined}
          onChange={(event) =>
            onChangeFilters({ ...filters, to: event.target.value })
          }
          style={{ width: 150 }}
          type="date"
          value={filters.to}
        />
        <Button type="primary" onClick={onSearch}>
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Flex>

      <AdminTable<AdminParticipationView>
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
          onChange: onPageChange,
        }}
        rowKey="id"
        scroll={{ x: 1260 }}
        size="middle"
      />
    </Flex>
  );
}
