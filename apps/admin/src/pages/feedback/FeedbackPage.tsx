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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { listStudents, type StudentView } from "@/api/accounts";
import { ApiError } from "@/api/client";
import { listFeedback, startFeedback, type FeedbackView } from "@/api/feedback";
import AdminTable from "@/components/common/AdminTable";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import FeedbackDetailDrawer from "./FeedbackDetailDrawer";
import type { FeedbackActionMode } from "./FeedbackActionModal";
import { feedbackActionError, isStaleFeedbackError } from "./errors";
import {
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTypeLabel,
  isFeedbackStatusFilter,
  relatedBusinessLabel,
  type FeedbackStatusFilter,
  type FeedbackTypeFilter,
} from "./labels";

const PAGE_SIZE = 10;

type FeedbackFilters = {
  keyword: string;
  type: FeedbackTypeFilter;
  status: FeedbackStatusFilter;
  from: string;
  to: string;
};

const EMPTY_FILTERS: FeedbackFilters = {
  keyword: "",
  type: "all",
  status: "all",
  from: "",
  to: "",
};

function parseStatus(value: string | null): FeedbackStatusFilter {
  return value && isFeedbackStatusFilter(value) ? value : "all";
}

function initialFilters(searchParams: URLSearchParams): FeedbackFilters {
  return { ...EMPTY_FILTERS, status: parseStatus(searchParams.get("status")) };
}

function sortFeedback(items: FeedbackView[]): FeedbackView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

/** 问题反馈管理：筛选、详情、开始处理、回复和关闭。 */
export default function FeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedback, setFeedback] = useState<FeedbackView[]>([]);
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [studentsFailed, setStudentsFailed] = useState(false);
  const [draft, setDraft] = useState<FeedbackFilters>(() =>
    initialFilters(searchParams),
  );
  const [filters, setFilters] = useState<FeedbackFilters>(draft);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailAction, setDetailAction] = useState<FeedbackActionMode | null>(
    null,
  );
  const [startingId, setStartingId] = useState<number | null>(null);
  const startingRef = useRef(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      setFeedback(await listFeedback());
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
    // 首次进入页面时并行加载反馈和账号目录；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载反馈列表
    void loadFeedback();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载账号目录
    void loadStudents();
  }, [loadFeedback, loadStudents]);

  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortFeedback(
      feedback.filter((item) => {
        const student = studentById.get(item.studentId);
        const matchesKeyword =
          !keyword ||
          [
            item.feedbackNo,
            item.studentEmail,
            item.description,
            student?.fullName,
            student?.studentNumber,
          ].some((value) => value?.toLowerCase().includes(keyword));
        const matchesType =
          filters.type === "all" || item.type === filters.type;
        const matchesStatus =
          filters.status === "all" || item.status === filters.status;
        const day = item.createdAt.slice(0, 10);
        const matchesDate =
          (!filters.from || day >= filters.from) &&
          (!filters.to || day <= filters.to);

        return matchesKeyword && matchesType && matchesStatus && matchesDate;
      }),
    );
  }, [feedback, filters, studentById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const syncStatusParam = (status: FeedbackStatusFilter) => {
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

  const retry = () => {
    setLoading(true);
    setFailed(false);
    void loadFeedback();
    void loadStudents();
  };

  const start = async (record: FeedbackView) => {
    if (startingRef.current) {
      return;
    }

    startingRef.current = true;
    setStartingId(record.id);

    try {
      await startFeedback(record.id);
      emitToast("success", "已开始处理");
      await loadFeedback();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      emitToast(
        "error",
        feedbackActionError(error, "开始处理失败，请稍后重试"),
      );

      if (isStaleFeedbackError(error)) {
        await loadFeedback();
      }
    } finally {
      startingRef.current = false;
      setStartingId(null);
    }
  };

  const openDetail = (id: number, action: FeedbackActionMode | null = null) => {
    setDetailId(id);
    setDetailAction(action);
  };

  const handleChanged = useCallback(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const handleActionConsumed = useCallback(() => {
    setDetailAction(null);
  }, []);

  const columns: TableColumnsType<FeedbackView> = [
    {
      title: "反馈编号",
      dataIndex: "feedbackNo",
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
      title: "类型",
      dataIndex: "type",
      width: 110,
      render: (value: string) => feedbackTypeLabel(value),
    },
    {
      title: "关联业务",
      key: "related",
      width: 150,
      render: (_: unknown, record) =>
        relatedBusinessLabel(record.relatedType, record.relatedId),
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={feedbackStatusColor(value)}>
          {feedbackStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 240,
      render: (_: unknown, record) => (
        <Flex gap={8} wrap>
          <Button size="small" onClick={() => openDetail(record.id)}>
            详情
          </Button>
          {record.status === "PENDING" && (
            <Button
              loading={startingId === record.id}
              size="small"
              onClick={() => void start(record)}
            >
              开始处理
            </Button>
          )}
          {(record.status === "PENDING" || record.status === "IN_PROGRESS") && (
            <Button
              size="small"
              type="primary"
              onClick={() => openDetail(record.id, "reply")}
            >
              回复
            </Button>
          )}
          {(record.status === "IN_PROGRESS" || record.status === "REPLIED") && (
            <Button
              danger
              size="small"
              onClick={() => openDetail(record.id, "close")}
            >
              关闭
            </Button>
          )}
        </Flex>
      ),
    },
  ];

  const emptyState = (
    <Empty
      description={
        feedback.length === 0 ? "暂无问题反馈" : "没有符合筛选条件的反馈"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={() => void loadFeedback()}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage title="问题反馈">
      <Flex gap={16} vertical>
        {studentsFailed && (
          <Alert
            showIcon
            title="学生资料暂不可用，学生列仅显示邮箱"
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
            placeholder="编号、学生或描述"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={draft.keyword}
          />
          <Select<FeedbackTypeFilter>
            onChange={(type) => setDraft((current) => ({ ...current, type }))}
            options={[...FEEDBACK_TYPE_OPTIONS]}
            style={{ width: 140 }}
            value={draft.type}
          />
          <Select<FeedbackStatusFilter>
            onChange={(status) =>
              setDraft((current) => ({ ...current, status }))
            }
            options={[...FEEDBACK_STATUS_OPTIONS]}
            style={{ width: 140 }}
            value={draft.status}
          />
          <Input
            aria-label="提交日期起"
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
            aria-label="提交日期止"
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

        {failed ? (
          <LoadFailure message="问题反馈加载失败，请稍后重试" onRetry={retry} />
        ) : (
          <AdminTable<FeedbackView>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText: emptyState }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: filtered.length,
              showTotal: (total) => `共 ${total} 条`,
              onChange: setPage,
            }}
            rowKey="id"
          />
        )}
      </Flex>

      <FeedbackDetailDrawer
        feedbackId={detailId}
        initialAction={detailAction}
        onActionConsumed={handleActionConsumed}
        onChanged={handleChanged}
        onClose={() => {
          setDetailId(null);
          setDetailAction(null);
        }}
        open={detailId !== null}
        students={students}
      />
    </ModulePage>
  );
}
