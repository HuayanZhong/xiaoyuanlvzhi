import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  disableIndividual,
  finishMaintenance,
  listIndividuals,
  listSpecies,
  sendToMaintenance,
  type IndividualStatus,
  type IndividualView,
  type SpeciesView,
} from "@/api/plants";
import LoadFailure from "@/components/common/LoadFailure";
import AdminTable from "@/components/common/AdminTable";
import ModulePage from "@/components/common/ModulePage";
import { notifyError } from "@/lib/api-feedback";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import InstanceFormDrawer from "./InstanceFormDrawer";
import { INDIVIDUAL_STATUS_OPTIONS, statusColor, statusLabel } from "./labels";

const PAGE_SIZE = 10;

type StatusFilter = "all" | IndividualStatus;

type IndividualFilters = {
  keyword: string;
  speciesId: number | "all";
  status: StatusFilter;
};

function parseSpeciesId(value: string | null): number | "all" {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : "all";
}

const INDIVIDUAL_STATUS_VALUES = new Set([
  "AVAILABLE",
  "WAITING_PICKUP",
  "ACTIVE",
  "MAINTENANCE",
  "DISABLED",
]);

function parseStatus(value: string | null): StatusFilter {
  return value && INDIVIDUAL_STATUS_VALUES.has(value)
    ? (value as IndividualStatus)
    : "all";
}

const EMPTY_FILTERS: IndividualFilters = {
  keyword: "",
  speciesId: "all",
  status: "all",
};

export default function InstancesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [species, setSpecies] = useState<SpeciesView[]>([]);
  const [individuals, setIndividuals] = useState<IndividualView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<IndividualFilters>(() => ({
    ...EMPTY_FILTERS,
    speciesId: parseSpeciesId(searchParams.get("speciesId")),
    status: parseStatus(searchParams.get("status")),
  }));
  const [filters, setFilters] = useState<IndividualFilters>(draft);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<IndividualView | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextSpecies, nextIndividuals] = await Promise.all([
        listSpecies(),
        listIndividuals(),
      ]);
      setSpecies(nextSpecies);
      setIndividuals(nextIndividuals);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次进入页面时发起列表请求；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect
    void load();
  }, [load]);

  const activeSpeciesId = useMemo(
    () =>
      filters.speciesId !== "all" &&
      species.some((item) => item.id === filters.speciesId)
        ? filters.speciesId
        : "all",
    [filters.speciesId, species],
  );

  const draftSpeciesId =
    draft.speciesId !== "all" &&
    species.some((item) => item.id === draft.speciesId)
      ? draft.speciesId
      : "all";

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return (
      individuals
        .filter(
          (item) =>
            !keyword ||
            item.code.toLowerCase().includes(keyword) ||
            item.location.toLowerCase().includes(keyword),
        )
        .filter(
          (item) =>
            activeSpeciesId === "all" || item.speciesId === activeSpeciesId,
        )
        .filter(
          (item) => filters.status === "all" || item.status === filters.status,
        )
        // filter 已返回新数组，这里排序不会修改原列表。
        // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    );
  }, [activeSpeciesId, filters.keyword, filters.status, individuals]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const syncQueryParams = (nextFilters: IndividualFilters) => {
    const next = new URLSearchParams(searchParams);

    if (nextFilters.speciesId === "all") {
      next.delete("speciesId");
    } else {
      next.set("speciesId", String(nextFilters.speciesId));
    }

    if (nextFilters.status === "all") {
      next.delete("status");
    } else {
      next.set("status", nextFilters.status);
    }

    setSearchParams(next, { replace: true });
  };

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
    syncQueryParams(draft);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
    syncQueryParams(EMPTY_FILTERS);
  };

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: IndividualView) => {
    setEditing(record);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    closeDrawer();
    setLoading(true);
    setFailed(false);
    void load();
  };

  const retry = () => {
    setLoading(true);
    setFailed(false);
    void load();
  };

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      emitToast("success", success);
      await load();
    } catch (error) {
      notifyError(error, "操作失败，请稍后重试");
    }
  };

  const columns: TableColumnsType<IndividualView> = [
    { title: "单株编号", dataIndex: "code", width: 140 },
    { title: "品种", dataIndex: "speciesName", width: 120 },
    {
      title: "展示名称",
      dataIndex: "displayName",
      render: (displayName: string | null) =>
        displayName || <Typography.Text type="secondary">—</Typography.Text>,
    },
    { title: "摆放位置", dataIndex: "location", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 100,
      render: (status: string) => (
        <Tag color={statusColor(status)}>{statusLabel(status)}</Tag>
      ),
    },
    {
      title: "加入时间",
      dataIndex: "createdAt",
      width: 168,
      render: (value: string) => (
        <Typography.Text type="secondary">
          {formatDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 168,
      render: (value: string) => (
        <Typography.Text type="secondary">
          {formatDateTime(value)}
        </Typography.Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 230,
      render: (_: unknown, record) => (
        <Space size={0} wrap>
          <Button size="small" type="link" onClick={() => openEdit(record)}>
            编辑
          </Button>

          {record.status === "AVAILABLE" && (
            <Popconfirm
              cancelText="取消"
              okText="送修"
              onConfirm={() =>
                void runAction(() => sendToMaintenance(record.id), "单株已送修")
              }
              title="确定将该单株送修？"
            >
              <Button size="small" type="link">
                送修
              </Button>
            </Popconfirm>
          )}

          {record.status === "MAINTENANCE" && (
            <Popconfirm
              cancelText="取消"
              okText="完成"
              onConfirm={() =>
                void runAction(() => finishMaintenance(record.id), "维护已完成")
              }
              title="确认维护完成并恢复可领养？"
            >
              <Button size="small" type="link">
                维护完成
              </Button>
            </Popconfirm>
          )}

          {(record.status === "AVAILABLE" ||
            record.status === "MAINTENANCE") && (
            <Popconfirm
              cancelText="取消"
              okText="停用"
              onConfirm={() =>
                void runAction(() => disableIndividual(record.id), "单株已停用")
              }
              title="停用后该单株不可再被领养，确定停用？"
            >
              <Button danger size="small" type="link">
                停用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const speciesOptions = [
    { value: "all" as const, label: "全部品种" },
    ...species.map((item) => ({ value: item.id, label: item.name })),
  ];

  return (
    <ModulePage
      extra={
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          新增单株
        </Button>
      }
      title="单株库存"
    >
      {failed ? (
        <LoadFailure message="单株加载失败，请稍后重试" onRetry={retry} />
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
              placeholder="单株编号或位置"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={draft.keyword}
            />
            <Select<number | "all">
              onChange={(speciesId) =>
                setDraft((current) => ({ ...current, speciesId }))
              }
              optionFilterProp="label"
              options={speciesOptions}
              showSearch
              style={{ width: 180 }}
              value={draftSpeciesId}
            />
            <Select<StatusFilter>
              onChange={(status) =>
                setDraft((current) => ({ ...current, status }))
              }
              options={[...INDIVIDUAL_STATUS_OPTIONS]}
              style={{ width: 140 }}
              value={draft.status}
            />
            <Button type="primary" onClick={applyFilters}>
              查询
            </Button>
            <Button onClick={resetFilters}>重置</Button>
          </Flex>

          <AdminTable<IndividualView>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  description="暂无单株"
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
            scroll={{ x: 1100 }}
            size="middle"
          />
        </>
      )}

      <InstanceFormDrawer
        individual={editing}
        onClose={closeDrawer}
        onSaved={handleSaved}
        open={drawerOpen}
        species={species}
      />
    </ModulePage>
  );
}
