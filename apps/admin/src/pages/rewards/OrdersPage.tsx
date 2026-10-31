import { SearchOutlined } from "@ant-design/icons";
import {
  Alert,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { listStudents, type StudentView } from "@/api/accounts";
import { ApiError } from "@/api/client";
import { claimOrder, listOrders, type OrderView } from "@/api/rewards";
import AdminTable from "@/components/common/AdminTable";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import CancelOrderModal from "./CancelOrderModal";
import {
  ORDER_STATUS_OPTIONS,
  isOrderOverdue,
  orderDisplayStatusColor,
  orderDisplayStatusLabel,
  type OrderStatusFilter,
} from "./labels";

const PAGE_SIZE = 10;

type OrderFilters = {
  keyword: string;
  status: OrderStatusFilter;
  from: string;
  to: string;
};

const EMPTY_FILTERS: OrderFilters = {
  keyword: "",
  status: "all",
  from: "",
  to: "",
};

const ORDER_STATUS_VALUES = new Set([
  "WAITING_PICKUP",
  "CLAIMED",
  "CANCELLED",
  "EXPIRED",
]);

function parseStatus(value: string | null): OrderStatusFilter {
  return value && ORDER_STATUS_VALUES.has(value)
    ? (value as OrderStatusFilter)
    : "all";
}

type OrdersPageProps = {
  /** 测试或外部嵌入时可固定当前时间；默认使用浏览器时间。 */
  now?: Date;
};

function sortOrders(items: OrderView[]): OrderView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

function claimError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "确认领取失败，请稍后重试";
  }

  switch (error.code) {
    case "ORDER_STATUS_INVALID":
      return "订单已处理，请刷新后查看";
    case "ORDER_NOT_FOUND":
      return "订单不存在，请刷新后重试";
    default:
      return error.message;
  }
}

/** 兑换订单管理：筛选、核销、取消和超时只读提示。 */
export default function OrdersPage({ now: nowProp }: OrdersPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [now] = useState(() => nowProp ?? new Date());
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [studentsFailed, setStudentsFailed] = useState(false);
  const [draft, setDraft] = useState<OrderFilters>(() => ({
    ...EMPTY_FILTERS,
    status: parseStatus(searchParams.get("status")),
  }));
  const [filters, setFilters] = useState<OrderFilters>(draft);
  const [page, setPage] = useState(1);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<OrderView | null>(null);
  const claimingRef = useRef(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      setOrders(await listOrders());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setStudentsFailed(false);

    try {
      setStudents(await listStudents());
    } catch {
      setStudents([]);
      setStudentsFailed(true);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次并行加载订单和账号目录
    void loadOrders();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次并行加载订单和账号目录
    void loadStudents();
  }, [loadOrders, loadStudents]);

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortOrders(
      orders
        .filter((order) => {
          const student = studentById.get(order.studentId);

          if (!keyword) {
            return true;
          }

          return [
            order.orderNo,
            order.rewardName,
            order.studentEmail,
            student?.fullName,
            student?.studentNumber,
          ].some((value) => value?.toLowerCase().includes(keyword));
        })
        .filter((order) => {
          if (filters.status === "all") {
            return true;
          }

          const overdue = isOrderOverdue(order, now);

          if (filters.status === "EXPIRED") {
            return order.status === "EXPIRED" || overdue;
          }

          if (filters.status === "WAITING_PICKUP") {
            return order.status === "WAITING_PICKUP" && !overdue;
          }

          return order.status === filters.status;
        })
        .filter((order) => {
          const day = order.createdAt.slice(0, 10);

          return (
            (!filters.from || day >= filters.from) &&
            (!filters.to || day <= filters.to)
          );
        }),
    );
  }, [filters, now, orders, studentById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const syncStatusParam = (status: OrderStatusFilter) => {
    const next = new URLSearchParams(searchParams);

    if (status === "all") {
      next.delete("status");
    } else {
      next.set("status", status);
    }

    setSearchParams(next, { replace: true });
  };

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    syncStatusParam(draft.status);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    syncStatusParam("all");
  };

  const claim = async (order: OrderView) => {
    if (claimingRef.current) {
      return;
    }

    claimingRef.current = true;
    setClaimingId(order.id);

    try {
      const updated = await claimOrder(order.id);

      if (updated.status === "EXPIRED") {
        emitToast("warning", "订单已超时，积分已退回");
      } else {
        emitToast("success", "已确认领取");
      }
      await loadOrders();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }
      emitToast("error", claimError(error));

      if (
        error instanceof ApiError &&
        (error.code === "ORDER_STATUS_INVALID" ||
          error.code === "ORDER_NOT_FOUND")
      ) {
        await loadOrders();
      }
    } finally {
      claimingRef.current = false;
      setClaimingId(null);
    }
  };

  const columns: TableColumnsType<OrderView> = [
    {
      title: "订单号",
      dataIndex: "orderNo",
      width: 150,
    },
    {
      title: "学生",
      key: "student",
      width: 190,
      render: (_: unknown, record) => {
        const student = studentById.get(record.studentId);

        return (
          <div>
            <div>{student?.fullName || record.studentEmail}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {student?.studentNumber || record.studentEmail}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: "奖励",
      dataIndex: "rewardName",
      width: 170,
    },
    {
      title: "消耗积分",
      dataIndex: "pointsCost",
      width: 100,
      render: (value: number) => `${value} 分`,
    },
    {
      title: "下单时间",
      dataIndex: "createdAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "领取截止",
      dataIndex: "pickupDeadline",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "状态",
      key: "status",
      width: 100,
      render: (_: unknown, record) => (
        <Tag color={orderDisplayStatusColor(record, now)}>
          {orderDisplayStatusLabel(record, now)}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 210,
      render: (_: unknown, record) => {
        const overdue = isOrderOverdue(record, now);
        const canHandle = record.status === "WAITING_PICKUP" && !overdue;

        if (!canHandle) {
          return (
            <Typography.Text type="secondary">
              {overdue ? "已超时，等待退分" : "—"}
            </Typography.Text>
          );
        }

        return (
          <Flex gap={8} wrap>
            <Popconfirm
              cancelText="取消"
              description="确认学生已领取实物奖励？确认后不能撤销。"
              okText="确认领取"
              onConfirm={() => void claim(record)}
              title={`确认领取 ${record.orderNo}？`}
            >
              <Button
                loading={claimingId === record.id}
                size="small"
                type="primary"
              >
                确认领取
              </Button>
            </Popconfirm>
            <Button size="small" onClick={() => setCancelTarget(record)}>
              取消订单
            </Button>
          </Flex>
        );
      },
    },
  ];

  if (failed) {
    return (
      <ModulePage title="兑换订单">
        <LoadFailure
          message="兑换订单加载失败，请稍后重试"
          onRetry={() => void loadOrders()}
        />
      </ModulePage>
    );
  }

  const emptyState = (
    <Empty
      description={
        orders.length === 0 ? "暂无兑换订单" : "没有符合筛选条件的订单"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={() => void loadOrders()}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage title="兑换订单">
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
              setDraft((current) => ({
                ...current,
                keyword: event.target.value,
              }))
            }
            onPressEnter={applyFilters}
            placeholder="订单号、学生或奖励"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={draft.keyword}
          />
          <Select<OrderStatusFilter>
            onChange={(status) =>
              setDraft((current) => ({ ...current, status }))
            }
            options={[...ORDER_STATUS_OPTIONS]}
            style={{ width: 140 }}
            value={draft.status}
          />
          <Input
            aria-label="下单日期起"
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
            aria-label="下单日期止"
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

        <AdminTable<OrderView>
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
          scroll={{ x: 1250 }}
          size="middle"
        />
      </Flex>

      <CancelOrderModal
        onClose={() => setCancelTarget(null)}
        onSaved={() => {
          void loadOrders();
        }}
        open={cancelTarget !== null}
        order={cancelTarget}
      />
    </ModulePage>
  );
}
