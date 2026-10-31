import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import {
  listRewards,
  updateReward,
  type RewardRequest,
  type RewardView,
} from "@/api/rewards";
import AdminTable from "@/components/common/AdminTable";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { emitToast } from "@/lib/toast-events";
import RewardFormDrawer from "./RewardFormDrawer";
import {
  REWARD_STATUS_OPTIONS,
  rewardStatusColor,
  rewardStatusLabel,
  stockDetail,
  stockSummary,
  type RewardStatusFilter,
} from "./labels";

const PAGE_SIZE = 10;

type RewardFilters = {
  keyword: string;
  status: RewardStatusFilter;
};

const EMPTY_FILTERS: RewardFilters = { keyword: "", status: "all" };

function sortRewards(items: RewardView[]): RewardView[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = right.createdAt.localeCompare(left.createdAt);
        return byTime !== 0 ? byTime : right.id - left.id;
      })
  );
}

function toggleRequest(reward: RewardView, enabled: boolean): RewardRequest {
  return {
    name: reward.name,
    description: reward.description,
    imageFileIds: reward.imageFileIds,
    pointsCost: reward.pointsCost,
    availableStock: reward.availableStock,
    location: reward.location,
    pickupDays: reward.pickupDays,
    enabled,
  };
}

/** 奖励商品管理：上下架、库存展示和编辑入口。 */
export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<RewardFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<RewardFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<RewardView | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadRewards = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      setRewards(await listRewards());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载奖励列表
    void loadRewards();
  }, [loadRewards]);

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return sortRewards(
      rewards
        .filter(
          (reward) => !keyword || reward.name.toLowerCase().includes(keyword),
        )
        .filter(
          (reward) =>
            filters.status === "all" ||
            (filters.status === "enabled" ? reward.enabled : !reward.enabled),
        ),
    );
  }, [filters, rewards]);

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

  const openEdit = (reward: RewardView) => {
    setEditing(reward);
    setDrawerOpen(true);
  };

  const toggle = async (reward: RewardView) => {
    setTogglingId(reward.id);

    try {
      await updateReward(reward.id, toggleRequest(reward, !reward.enabled));
      emitToast("success", reward.enabled ? "奖励已下架" : "奖励已上架");
      await loadRewards();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }
      emitToast(
        "error",
        error instanceof Error ? error.message : "更新奖励状态失败，请稍后重试",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const columns: TableColumnsType<RewardView> = [
    {
      title: "商品",
      key: "reward",
      width: 280,
      render: (_: unknown, record) => {
        const coverId = record.imageFileIds[0];

        return (
          <Flex align="center" gap={10}>
            {coverId != null ? (
              <AuthenticatedImage
                alt={`${record.name}图片`}
                fileId={coverId}
                height={56}
                style={{ borderRadius: 6, objectFit: "cover" }}
                width={56}
              />
            ) : (
              <div
                aria-hidden
                style={{
                  alignItems: "center",
                  background: "var(--app-color-canvas)",
                  borderRadius: 6,
                  display: "flex",
                  height: 56,
                  justifyContent: "center",
                  width: 56,
                }}
              >
                <Typography.Text type="secondary">无图</Typography.Text>
              </div>
            )}
            <div>
              <div>{record.name}</div>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.description || "暂无描述"}
              </Typography.Text>
            </div>
          </Flex>
        );
      },
    },
    {
      title: "兑换积分",
      dataIndex: "pointsCost",
      width: 100,
      render: (value: number) => `${value} 分`,
    },
    {
      title: "库存",
      key: "stock",
      width: 170,
      render: (_: unknown, record) => (
        <div>
          <div>{stockSummary(record)}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {stockDetail(record)}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "领取地点",
      dataIndex: "location",
      width: 180,
    },
    {
      title: "领取期限",
      dataIndex: "pickupDays",
      width: 100,
      render: (value: number) => `${value} 天`,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (value: boolean) => (
        <Tag color={rewardStatusColor(value)}>{rewardStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 170,
      render: (value: string) => value.replace("T", " ").slice(0, 16),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_: unknown, record) => (
        <Flex gap={8} wrap>
          <Button size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            cancelText="取消"
            description={
              record.enabled
                ? "下架后学生不能继续兑换，已创建的订单仍需履约。"
                : "上架后学生可以继续兑换。"
            }
            okText={record.enabled ? "下架" : "上架"}
            onConfirm={() => void toggle(record)}
            title={`确认${record.enabled ? "下架" : "上架"}“${record.name}”？`}
          >
            <Button loading={togglingId === record.id} size="small">
              {record.enabled ? "下架" : "上架"}
            </Button>
          </Popconfirm>
        </Flex>
      ),
    },
  ];

  if (failed) {
    return (
      <ModulePage title="奖励商品">
        <LoadFailure
          message="奖励商品加载失败，请稍后重试"
          onRetry={() => void loadRewards()}
        />
      </ModulePage>
    );
  }

  const emptyState = (
    <Empty
      description={
        rewards.length === 0 ? "暂无奖励商品" : "没有符合筛选条件的奖励"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={() => void loadRewards()}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage
      extra={
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          新增奖励
        </Button>
      }
      title="奖励商品"
    >
      <Flex align="center" gap={12} wrap>
        <Input
          allowClear
          onChange={(event) =>
            setDraft((current) => ({ ...current, keyword: event.target.value }))
          }
          onPressEnter={applyFilters}
          placeholder="奖励名称"
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={draft.keyword}
        />
        <Select<RewardStatusFilter>
          onChange={(status) => setDraft((current) => ({ ...current, status }))}
          options={[...REWARD_STATUS_OPTIONS]}
          style={{ width: 140 }}
          value={draft.status}
        />
        <Button type="primary" onClick={applyFilters}>
          查询
        </Button>
        <Button onClick={resetFilters}>重置</Button>
      </Flex>

      <AdminTable<RewardView>
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
        scroll={{ x: 1240 }}
        size="middle"
      />

      <RewardFormDrawer
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          void loadRewards();
        }}
        open={drawerOpen}
        reward={editing}
      />
    </ModulePage>
  );
}
