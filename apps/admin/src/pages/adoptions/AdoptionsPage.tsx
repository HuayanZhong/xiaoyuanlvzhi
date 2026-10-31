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
import { useSearchParams } from "react-router";
import {
  ADOPTION_STATUSES,
  listAdoptions,
  type AdoptionStatus,
  type AdoptionView,
} from "@/api/adoptions";
import { listStudents, type StudentView } from "@/api/accounts";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import AdoptionDetailDrawer from "./AdoptionDetailDrawer";
import {
  ADOPTION_STATUS_OPTIONS,
  adoptionStatusColor,
  adoptionStatusLabel,
  type AdoptionStatusFilter,
} from "./labels";

const PAGE_SIZE = 10;

type StatusFilter = AdoptionStatusFilter;

type AdoptionFilters = {
  keyword: string;
  status: StatusFilter;
  speciesId: number | "all";
  from: string;
  to: string;
};

const EMPTY_FILTERS: AdoptionFilters = {
  keyword: "",
  status: "all",
  speciesId: "all",
  from: "",
  to: "",
};

function parseStatus(value: string | null): StatusFilter {
  if (value === "CHANGES") {
    return "CHANGES";
  }

  return ADOPTION_STATUSES.includes(value as AdoptionStatus)
    ? (value as AdoptionStatus)
    : "all";
}

export default function AdoptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [adoptions, setAdoptions] = useState<AdoptionView[]>([]);
  const [students, setStudents] = useState<StudentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<AdoptionFilters>(() => ({
    ...EMPTY_FILTERS,
    status: parseStatus(searchParams.get("status")),
  }));
  const [filters, setFilters] = useState<AdoptionFilters>(draft);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setAdoptions(await listAdoptions());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      setStudents(await listStudents());
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    // 首次进入页面时请求领养列表和学生目录；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
    // oxlint-disable-next-line react/set-state-in-effect
    void loadStudents();
  }, [load, loadStudents]);

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  );

  const speciesOptions = useMemo(() => {
    const species = new Map<number, string>();

    for (const adoption of adoptions) {
      if (!species.has(adoption.speciesId)) {
        species.set(adoption.speciesId, adoption.speciesName);
      }
    }

    return [
      { value: "all" as const, label: "全部品种" },
      ...Array.from(species, ([value, label]) => ({ value, label })),
    ];
  }, [adoptions]);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return (
      adoptions
        .filter((adoption) => {
          if (!keyword) {
            return true;
          }

          const student = studentMap.get(adoption.studentId);

          return [
            adoption.applicationNo,
            adoption.studentEmail,
            student?.fullName,
            student?.studentNumber,
          ].some((value) => value?.toLowerCase().includes(keyword));
        })
        .filter(
          (adoption) =>
            filters.status === "all" ||
            (filters.status === "CHANGES"
              ? adoption.status === "CANCEL_REVIEW" ||
                adoption.status === "RETURN_REVIEW"
              : adoption.status === filters.status),
        )
        .filter(
          (adoption) =>
            filters.speciesId === "all" ||
            adoption.speciesId === filters.speciesId,
        )
        .filter((adoption) => {
          const day = adoption.createdAt.slice(0, 10);

          return (
            (!filters.from || day >= filters.from) &&
            (!filters.to || day <= filters.to)
          );
        })
        // filter 已返回新数组，这里排序不会修改原列表。
        // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    );
  }, [adoptions, filters, studentMap]);

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
    void loadStudents();
  };

  const columns: TableColumnsType<AdoptionView> = [
    { title: "申请编号", dataIndex: "applicationNo", width: 160 },
    {
      title: "学生",
      key: "student",
      width: 170,
      render: (_: unknown, record) => {
        const student = studentMap.get(record.studentId);

        return (
          <div>
            <div>{student?.fullName || record.studentEmail}</div>
            {student?.fullName && (
              <Typography.Text type="secondary">
                {record.studentEmail}
              </Typography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: "学号",
      key: "studentNumber",
      width: 130,
      render: (_: unknown, record) =>
        studentMap.get(record.studentId)?.studentNumber || (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    { title: "品种", dataIndex: "speciesName", width: 120 },
    {
      title: "单株",
      key: "plant",
      width: 180,
      render: (_: unknown, record) =>
        record.plantCode ? (
          <div>
            <div>{record.plantCode}</div>
            <Typography.Text type="secondary">
              {record.plantLocation || "—"}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">未分配</Typography.Text>
        ),
    },
    {
      title: "申请时间",
      dataIndex: "createdAt",
      width: 168,
      render: (value: string) => (
        <Typography.Text type="secondary">
          {formatDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 120,
      render: (status: string) => (
        <Tag color={adoptionStatusColor(status)}>
          {adoptionStatusLabel(status)}
        </Tag>
      ),
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

  return (
    <ModulePage title="领养管理">
      {failed ? (
        <LoadFailure message="领养申请加载失败，请稍后重试" onRetry={retry} />
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
              placeholder="申请编号、学生姓名、学号或邮箱"
              prefix={<SearchOutlined />}
              style={{ width: 260 }}
              value={draft.keyword}
            />
            <Select<StatusFilter>
              onChange={(status) =>
                setDraft((current) => ({ ...current, status }))
              }
              options={[...ADOPTION_STATUS_OPTIONS]}
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

          <AdminTable<AdoptionView>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  description="暂无领养申请"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: filtered.length,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              onChange: setPage,
            }}
            rowKey="id"
            scroll={{ x: 1080 }}
            size="middle"
          />
        </>
      )}

      {detailId !== null && (
        <AdoptionDetailDrawer
          adoptionId={detailId}
          onChanged={() => void load()}
          onClose={() => setDetailId(null)}
          students={studentMap}
        />
      )}
    </ModulePage>
  );
}
