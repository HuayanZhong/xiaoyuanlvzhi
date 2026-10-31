import { SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Input,
  Select,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useMemo, useState } from "react";
import type { StudentView } from "@/api/accounts";
import type { PointLedgerView, PointSource } from "@/api/points";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import { formatDateTime } from "@/lib/format";
import {
  DIRECTION_OPTIONS,
  POINT_SOURCE_OPTIONS,
  formatDelta,
  pointSourceLabel,
  type LedgerDirection,
} from "./labels";

const PAGE_SIZE = 10;

type SourceFilter = "all" | PointSource;

type LedgerFilters = {
  keyword: string;
  source: SourceFilter;
  direction: LedgerDirection;
  from: string;
  to: string;
};

const EMPTY_FILTERS: LedgerFilters = {
  keyword: "",
  source: "all",
  direction: "all",
  from: "",
  to: "",
};

type PointLedgerPanelProps = {
  ledger: PointLedgerView[];
  students: StudentView[];
  studentsFailed: boolean;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

function sortLedger(items: PointLedgerView[]): PointLedgerView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

/** 积分流水 tab：全量流水、学生关联、筛选和客户端分页。 */
export default function PointLedgerPanel({
  ledger,
  students,
  studentsFailed,
  loading,
  failed,
  onRetry,
}: PointLedgerPanelProps) {
  const [draft, setDraft] = useState<LedgerFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortLedger(
      ledger
        .filter((item) => {
          const student = studentById.get(item.accountId);

          if (!keyword) {
            return true;
          }

          return [
            student?.fullName,
            student?.studentNumber,
            item.studentEmail,
          ].some((value) => value?.toLowerCase().includes(keyword));
        })
        .filter(
          (item) =>
            filters.source === "all" || item.sourceType === filters.source,
        )
        .filter(
          (item) =>
            filters.direction === "all" ||
            (filters.direction === "income"
              ? item.deltaPoints > 0
              : item.deltaPoints < 0),
        )
        .filter((item) => {
          const day = item.createdAt.slice(0, 10);

          return (
            (!filters.from || day >= filters.from) &&
            (!filters.to || day <= filters.to)
          );
        }),
    );
  }, [filters, ledger, studentById]);

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

  const columns: TableColumnsType<PointLedgerView> = [
    {
      title: "流水号",
      dataIndex: "id",
      width: 90,
    },
    {
      title: "学生",
      key: "student",
      width: 190,
      render: (_: unknown, record) => {
        const student = studentById.get(record.accountId);

        return (
          <div>
            <div>{student?.fullName || record.studentEmail}</div>
            <Typography.Text type="secondary">
              {student?.studentNumber || record.studentEmail}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: "来源",
      dataIndex: "sourceType",
      width: 130,
      render: (value: string) => pointSourceLabel(value),
    },
    {
      title: "变动积分",
      dataIndex: "deltaPoints",
      align: "right",
      width: 120,
      render: (value: number) => (
        <Tag color={value > 0 ? "green" : "red"}>{formatDelta(value)}</Tag>
      ),
    },
    {
      title: "变动后余额",
      dataIndex: "balanceAfter",
      align: "right",
      width: 120,
    },
    {
      title: "操作人",
      dataIndex: "actorEmail",
      width: 170,
      render: (value: string | null) => value || "系统",
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "原因",
      dataIndex: "reason",
      width: 220,
      render: (value: string | null) => (
        <Typography.Text
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {value || "—"}
        </Typography.Text>
      ),
    },
  ];

  if (failed) {
    return (
      <LoadFailure message="积分流水加载失败，请稍后重试" onRetry={onRetry} />
    );
  }

  const emptyState = (
    <Empty
      description={
        ledger.length === 0 ? "暂无积分流水" : "没有符合筛选条件的流水"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={onRetry}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <Flex gap={16} vertical>
      {studentsFailed && (
        <Alert
          showIcon
          title="账号资料暂不可用，学生列仅显示邮箱"
          type="warning"
        />
      )}

      <Flex align="center" gap={12} wrap>
        <Input
          allowClear
          onChange={(event) =>
            setDraft((current) => ({ ...current, keyword: event.target.value }))
          }
          onPressEnter={applyFilters}
          placeholder="学生姓名、学号或邮箱"
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          value={draft.keyword}
        />
        <Select<SourceFilter>
          onChange={(source) => setDraft((current) => ({ ...current, source }))}
          options={[...POINT_SOURCE_OPTIONS]}
          style={{ width: 140 }}
          value={draft.source}
        />
        <Select<LedgerDirection>
          onChange={(direction) =>
            setDraft((current) => ({ ...current, direction }))
          }
          options={[...DIRECTION_OPTIONS]}
          style={{ width: 130 }}
          value={draft.direction}
        />
        <Input
          aria-label="流水日期起"
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
          aria-label="流水日期止"
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

      <AdminTable<PointLedgerView>
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
        scroll={{ x: 1210 }}
        size="middle"
      />
    </Flex>
  );
}
