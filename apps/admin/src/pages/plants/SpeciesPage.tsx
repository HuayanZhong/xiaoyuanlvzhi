import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { listSpecies, setSpeciesEnabled, type SpeciesView } from "@/api/plants";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { notifyError } from "@/lib/api-feedback";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import SpeciesFormDrawer from "./SpeciesFormDrawer";
import { difficultyLabel, SPECIES_STATUS_OPTIONS } from "./labels";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "enabled" | "disabled";

type SpeciesFilters = {
  name: string;
  status: StatusFilter;
};

const EMPTY_FILTERS: SpeciesFilters = { name: "", status: "all" };

export default function SpeciesPage() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState<SpeciesView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<SpeciesFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<SpeciesFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SpeciesView | null>(null);

  const load = useCallback(async () => {
    try {
      setSpecies(await listSpecies());
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

  const filtered = useMemo(() => {
    const keyword = filters.name.trim().toLowerCase();

    return (
      species
        .filter((item) => !keyword || item.name.toLowerCase().includes(keyword))
        .filter((item) =>
          filters.status === "all"
            ? true
            : filters.status === "enabled"
              ? item.enabled
              : !item.enabled,
        )
        // filter 已返回新数组，这里排序不会修改原列表。
        // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    );
  }, [filters, species]);

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

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: SpeciesView) => {
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

  const toggleEnabled = async (record: SpeciesView) => {
    try {
      await setSpeciesEnabled(record.id, !record.enabled);
      emitToast("success", record.enabled ? "品种已停用" : "品种已启用");
      await load();
    } catch (error) {
      notifyError(error, "操作失败，请稍后重试");
    }
  };

  const columns: TableColumnsType<SpeciesView> = [
    {
      title: "封面",
      dataIndex: "coverFileId",
      width: 72,
      render: (coverFileId: number | null) =>
        coverFileId ? (
          <AuthenticatedImage
            alt="品种封面"
            fileId={coverFileId}
            height={48}
            style={{ borderRadius: 6, objectFit: "cover" }}
            width={48}
          />
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    { title: "品种名称", dataIndex: "name" },
    {
      title: "养护难度",
      dataIndex: "difficulty",
      align: "center",
      width: 100,
      render: (difficulty: string) => difficultyLabel(difficulty),
    },
    {
      title: "养护说明摘要",
      dataIndex: "lightDescription",
      ellipsis: true,
      render: (_: string, record) =>
        `${record.lightDescription} / ${record.waterDescription}`,
    },
    {
      title: "可领养单株",
      dataIndex: "availableCount",
      align: "center",
      width: 110,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      align: "center",
      width: 90,
      render: (enabled: boolean) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "启用" : "停用"}
        </Tag>
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
          {record.enabled ? (
            <Popconfirm
              cancelText="取消"
              okText="停用"
              onConfirm={() => void toggleEnabled(record)}
              title="停用后学生端不可见，确定停用？"
            >
              <Button danger size="small" type="link">
                停用
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              type="link"
              onClick={() => void toggleEnabled(record)}
            >
              启用
            </Button>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/plants/instances?speciesId=${record.id}`)}
          >
            查看单株
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ModulePage
      extra={
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          新增品种
        </Button>
      }
      title="品种档案"
    >
      {failed ? (
        <LoadFailure message="品种加载失败，请稍后重试" onRetry={retry} />
      ) : (
        <>
          <Flex align="center" gap={12} wrap>
            <Input
              allowClear
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              onPressEnter={applyFilters}
              placeholder="品种名称"
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={draft.name}
            />
            <Select<StatusFilter>
              onChange={(status) =>
                setDraft((current) => ({ ...current, status }))
              }
              options={[...SPECIES_STATUS_OPTIONS]}
              style={{ width: 140 }}
              value={draft.status}
            />
            <Button type="primary" onClick={applyFilters}>
              查询
            </Button>
            <Button onClick={resetFilters}>重置</Button>
          </Flex>

          <Table<SpeciesView>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{
              emptyText: (
                <Empty
                  description="暂无品种"
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
            scroll={{ x: 960 }}
            size="middle"
          />
        </>
      )}

      <SpeciesFormDrawer
        onClose={closeDrawer}
        onSaved={handleSaved}
        open={drawerOpen}
        species={editing}
      />
    </ModulePage>
  );
}
