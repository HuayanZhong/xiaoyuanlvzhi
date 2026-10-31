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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  CARE_CHECKIN_STATUSES,
  listCareCheckins,
  type AdminCheckinView,
  type AdminSubmissionView,
  type CareCheckinStatus,
} from "@/api/care";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import CareDetailDrawer from "./CareDetailDrawer";
import {
  CARE_STATUS_OPTIONS,
  careStatusColor,
  careStatusLabel,
  pointsSourceLabel,
} from "./labels";

const PAGE_SIZE = 10;

type StatusFilter = "all" | CareCheckinStatus;

type CareFilters = {
  keyword: string;
  status: StatusFilter;
  speciesId: number | "all";
  from: string;
  to: string;
};

const EMPTY_FILTERS: CareFilters = {
  keyword: "",
  status: "all",
  speciesId: "all",
  from: "",
  to: "",
};

function parseStatus(value: string | null): StatusFilter {
  return CARE_CHECKIN_STATUSES.includes(value as CareCheckinStatus)
    ? (value as CareCheckinStatus)
    : "all";
}

function latestSubmission(
  checkin: AdminCheckinView,
): AdminSubmissionView | null {
  return checkin.submissions.reduce<AdminSubmissionView | null>(
    (latest, item) =>
      !latest || item.version > latest.version ? item : latest,
    null,
  );
}

function submittedAt(checkin: AdminCheckinView): string | null {
  return latestSubmission(checkin)?.submittedAt ?? null;
}

function submittedAtForFilter(checkin: AdminCheckinView): string {
  return submittedAt(checkin) ?? checkin.createdAt;
}

function noteSummary(checkin: AdminCheckinView): string {
  const latest = latestSubmission(checkin);
  const note = latest?.note?.trim();

  if (!note) {
    return latest && latest.imageFileIds.length > 0
      ? `图片凭证 ${latest.imageFileIds.length} 张`
      : "—";
  }

  return note.length > 30 ? `${note.slice(0, 30)}…` : note;
}

/** 列表按创建时间倒序，同一时间按 ID 倒序，和服务端排序保持一致。 */
function sortCheckins(items: AdminCheckinView[]): AdminCheckinView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

function pointsCell(checkin: AdminCheckinView) {
  if (checkin.status === "APPROVED") {
    const awarded = checkin.submissions
      .filter(
        (submission) =>
          submission.status === "APPROVED" && submission.awardedPoints != null,
      )
      .reduce<AdminSubmissionView | null>(
        (latest, submission) =>
          !latest || submission.version > latest.version ? submission : latest,
        null,
      )?.awardedPoints;

    return awarded != null ? `${awarded} 分` : "—";
  }

  if (checkin.status !== "PENDING_REVIEW") {
    return "—";
  }

  if (checkin.pointsSource === "NONE" || checkin.pendingPoints <= 0) {
    return <Typography.Text type="secondary">未配置</Typography.Text>;
  }

  return (
    <div>
      <div>{checkin.pendingPoints} 分</div>
      <Typography.Text type="secondary">
        {pointsSourceLabel(checkin.pointsSource)}
      </Typography.Text>
    </div>
  );
}

export default function CareReviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkins, setCheckins] = useState<AdminCheckinView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<CareFilters>(() => ({
    ...EMPTY_FILTERS,
    status: parseStatus(searchParams.get("status")),
  }));
  const [filters, setFilters] = useState<CareFilters>(draft);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setCheckins(await listCareCheckins());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 首次进入页面时加载列表
    void load();
  }, [load]);

  const speciesOptions = useMemo(() => {
    const species = new Map<number, string>();

    for (const checkin of checkins) {
      if (!species.has(checkin.speciesId)) {
        species.set(checkin.speciesId, checkin.speciesName);
      }
    }

    return [
      { value: "all" as const, label: "全部品种" },
      ...Array.from(species, ([value, label]) => ({ value, label })),
    ];
  }, [checkins]);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortCheckins(
      checkins
        .filter((checkin) => {
          if (!keyword) {
            return true;
          }

          return [
            checkin.checkinNo,
            checkin.studentName,
            checkin.studentNumber,
            checkin.studentEmail,
            checkin.plantCode,
            checkin.plantDisplayName,
            checkin.plantName,
            checkin.location,
          ].some((value) => value?.toLowerCase().includes(keyword));
        })
        .filter(
          (checkin) =>
            filters.status === "all" || checkin.status === filters.status,
        )
        .filter(
          (checkin) =>
            filters.speciesId === "all" ||
            checkin.speciesId === filters.speciesId,
        )
        .filter((checkin) => {
          const day = submittedAtForFilter(checkin).slice(0, 10);

          return (
            (!filters.from || day >= filters.from) &&
            (!filters.to || day <= filters.to)
          );
        }),
    );
  }, [checkins, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);

    const next = new URLSearchParams(searchParams);

    if (draft.status === "all") {
      next.delete("status");
    } else {
      next.set("status", draft.status);
    }

    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);

    const next = new URLSearchParams(searchParams);
    next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const retry = () => {
    setLoading(true);
    setFailed(false);
    void load();
  };

  const refresh = () => {
    void load();
  };

  const columns: TableColumnsType<AdminCheckinView> = [
    { title: "打卡编号", dataIndex: "checkinNo", width: 170 },
    {
      title: "学生",
      key: "student",
      width: 160,
      render: (_: unknown, record) => (
        <div>
          <div>{record.studentName || record.studentEmail}</div>
          {record.studentName && (
            <Typography.Text type="secondary">
              {record.studentEmail}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "学号",
      dataIndex: "studentNumber",
      width: 120,
      render: (value: string | null) =>
        value || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "单株",
      key: "plant",
      width: 180,
      render: (_: unknown, record) => (
        <div>
          <div>{record.plantCode}</div>
          <Typography.Text type="secondary">
            {record.plantDisplayName || record.location || "—"}
          </Typography.Text>
        </div>
      ),
    },
    { title: "品种", dataIndex: "speciesName", width: 110 },
    {
      title: "提交时间",
      key: "submittedAt",
      width: 168,
      render: (_: unknown, record) => (
        <Typography.Text type="secondary">
          {formatDateTime(submittedAt(record))}
        </Typography.Text>
      ),
    },
    {
      title: "说明摘要",
      key: "note",
      width: 200,
      render: (_: unknown, record) => (
        <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
          {noteSummary(record)}
        </Typography.Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 100,
      render: (status: string) => (
        <Tag color={careStatusColor(status)}>{careStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "预计积分",
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
        <Button size="small" type="link" onClick={() => setDetailId(record.id)}>
          查看
        </Button>
      ),
    },
  ];

  const emptyState = (
    <Empty
      description={
        checkins.length === 0 ? "暂无养护打卡" : "没有符合筛选条件的打卡"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={retry}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
        <Button type="primary" onClick={() => navigate("/dashboard")}>
          返回工作台
        </Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage title="养护审核">
      {failed ? (
        <LoadFailure message="养护打卡加载失败，请稍后重试" onRetry={retry} />
      ) : (
        <>
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
              placeholder="打卡编号、学生姓名、学号、邮箱、单株或位置"
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={draft.keyword}
            />
            <Select<StatusFilter>
              onChange={(status) =>
                setDraft((current) => ({ ...current, status }))
              }
              options={[...CARE_STATUS_OPTIONS]}
              style={{ width: 140 }}
              value={draft.status}
            />
            <Select<number | "all">
              onChange={(speciesId) =>
                setDraft((current) => ({ ...current, speciesId }))
              }
              optionFilterProp="label"
              options={speciesOptions}
              showSearch
              style={{ width: 180 }}
              value={draft.speciesId}
            />
            <Input
              aria-label="提交日期起"
              max={draft.to || undefined}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  from: event.target.value,
                }))
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

          <AdminTable<AdminCheckinView>
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
            scroll={{ x: 1430 }}
            size="middle"
          />
        </>
      )}

      {detailId !== null && (
        <CareDetailDrawer
          checkinId={detailId}
          onChanged={refresh}
          onClose={() => setDetailId(null)}
        />
      )}
    </ModulePage>
  );
}
