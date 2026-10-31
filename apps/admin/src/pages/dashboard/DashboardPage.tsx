/* oxlint-disable jsx-a11y/prefer-tag-over-role -- antd Card renders a div; the card exposes explicit keyboard behavior. */
import { ReloadOutlined, RightOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  theme,
  Typography,
  type TableColumnsType,
} from "antd";
import type { EChartsCoreOption } from "echarts/core";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router";
import {
  getDashboard,
  getStatistics,
  type DashboardPendingItem,
  type DashboardView,
  type StatisticsView,
} from "@/api/dashboard";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import {
  ADOPTION_TREND_NOTE,
  POINT_GRANT_TREND_NOTE,
  buildAdoptionTrendOption,
  buildPointGrantTrendOption,
  isTrendEmpty,
  type ChartTokens,
} from "./charts";
import {
  businessTypeLabel,
  pendingStatusColor,
  pendingStatusLabel,
  recentItemPath,
  sortRecentItems,
} from "./labels";

type CountKey = Exclude<keyof DashboardView, "recentItems">;

const EChart = lazy(() => import("@/components/common/EChart"));

const COUNT_CARDS = [
  {
    key: "pendingAdoptions",
    label: "待审核领养",
    path: "/adoptions?status=PENDING_REVIEW",
  },
  {
    key: "pendingAdoptionChanges",
    label: "待处理领养变更",
    path: "/adoptions?status=CHANGES",
  },
  {
    key: "pendingCareCheckins",
    label: "待审核打卡",
    path: "/care-reviews?status=PENDING_REVIEW",
  },
  {
    key: "pendingTaskSubmissions",
    label: "待审核任务",
    path: "/tasks?tab=review&status=PENDING_REVIEW",
  },
  {
    key: "waitingRewardOrders",
    label: "待领取奖励",
    path: "/points/orders?status=WAITING_PICKUP",
  },
  {
    key: "pendingFeedback",
    label: "待处理反馈",
    path: "/feedback?status=PENDING",
  },
  {
    key: "availablePlants",
    label: "可领养绿植",
    path: "/plants/instances?status=AVAILABLE",
  },
  {
    key: "activePlants",
    label: "在养绿植",
    path: "/plants/instances?status=ACTIVE",
  },
] as const satisfies ReadonlyArray<{
  key: CountKey;
  label: string;
  path: string;
}>;

type TrendCardProps = {
  title: string;
  range: string;
  loading: boolean;
  failed: boolean;
  empty: boolean;
  note: string;
  option: EChartsCoreOption;
  ariaLabel: string;
  onRetry: () => void;
};

function TrendCard({
  title,
  range,
  loading,
  failed,
  empty,
  note,
  option,
  ariaLabel,
  onRetry,
}: TrendCardProps) {
  return (
    <Card title={title}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : failed ? (
        <Alert
          action={
            <Button onClick={onRetry} size="small">
              重试趋势
            </Button>
          }
          showIcon
          title="趋势数据暂不可用"
          type="warning"
        />
      ) : (
        <Flex gap={8} vertical>
          <Typography.Text type="secondary">{range}</Typography.Text>
          <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
            <EChart ariaLabel={ariaLabel} height={240} option={option} />
          </Suspense>
          {empty && (
            <Typography.Text type="secondary">近 30 天暂无数据</Typography.Text>
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {note}
          </Typography.Text>
        </Flex>
      )}
    </Card>
  );
}

/** 管理端工作台：待办计数、最近队列和近 30 天趋势。 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [data, setData] = useState<DashboardView | null>(null);
  const [statistics, setStatistics] = useState<StatisticsView | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [statsFailed, setStatsFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    setFailed(false);

    try {
      setData(await getDashboard());
    } catch {
      setFailed(true);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    setStatsLoading(true);
    setStatsFailed(false);

    try {
      setStatistics(await getStatistics());
    } catch {
      setStatsFailed(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次进入工作台时并行加载聚合数据和近 30 天趋势。
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载工作台数据
    void loadDashboard();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载统计趋势
    void loadStatistics();
  }, [loadDashboard, loadStatistics]);

  const refresh = async () => {
    if (refreshingRef.current) {
      return;
    }

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      await Promise.all([loadDashboard(), loadStatistics()]);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  };

  const chartTokens = useMemo<ChartTokens>(
    () => ({
      colorPrimary: token.colorPrimary,
      colorSuccess: token.colorSuccess,
      colorText: token.colorText,
      colorTextSecondary: token.colorTextSecondary,
      colorBorderSecondary: token.colorBorderSecondary,
      colorBgElevated: token.colorBgElevated,
    }),
    [
      token.colorPrimary,
      token.colorSuccess,
      token.colorText,
      token.colorTextSecondary,
      token.colorBorderSecondary,
      token.colorBgElevated,
    ],
  );

  const adoptionOption = useMemo(
    () =>
      buildAdoptionTrendOption(statistics?.adoptionTrend ?? [], chartTokens),
    [statistics?.adoptionTrend, chartTokens],
  );
  const pointGrantOption = useMemo(
    () =>
      buildPointGrantTrendOption(
        statistics?.pointGrantTrend ?? [],
        chartTokens,
      ),
    [statistics?.pointGrantTrend, chartTokens],
  );

  const recentItems = useMemo(
    () => sortRecentItems(data?.recentItems ?? []).slice(0, 10),
    [data?.recentItems],
  );
  const range = statistics
    ? `${statistics.from} 至 ${statistics.to}`
    : "近 30 天";

  const columns: TableColumnsType<DashboardPendingItem> = [
    {
      title: "类型",
      dataIndex: "businessType",
      width: 100,
      render: (value: string) => businessTypeLabel(value),
    },
    {
      title: "事项",
      dataIndex: "title",
      width: 200,
    },
    {
      title: "学生",
      dataIndex: "actorName",
      width: 110,
    },
    {
      title: "提交时间",
      dataIndex: "submittedAt",
      width: 150,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={pendingStatusColor(value)}>{pendingStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 90,
      render: (_: unknown, record) => (
        <Button
          onClick={() => navigate(recentItemPath(record))}
          size="small"
          type="link"
        >
          去处理
        </Button>
      ),
    },
  ];

  const activateOnKey = (
    event: KeyboardEvent<HTMLDivElement>,
    path: string,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <ModulePage
      extra={
        <Button
          icon={<ReloadOutlined />}
          loading={refreshing}
          onClick={() => void refresh()}
        >
          刷新
        </Button>
      }
      title="工作台"
    >
      {failed ? (
        <LoadFailure
          message="工作台加载失败，请稍后重试"
          onRetry={() => void refresh()}
        />
      ) : initialLoading || !data ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <Flex gap={16} vertical>
          <Row gutter={[16, 16]}>
            {COUNT_CARDS.map((card) => {
              const value = data[card.key];

              return (
                <Col key={card.key} lg={12} sm={12} xl={6} xs={24}>
                  <Card
                    aria-label={`${card.label} ${value} 条，查看列表`}
                    data-testid="count-card"
                    hoverable
                    onClick={() => navigate(card.path)}
                    onKeyDown={(event) => activateOnKey(event, card.path)}
                    role="button"
                    tabIndex={0}
                  >
                    <Flex align="flex-start" gap={8} justify="space-between">
                      <Statistic
                        styles={{ content: { fontSize: 28, fontWeight: 600 } }}
                        title={card.label}
                        value={value}
                      />
                      <RightOutlined
                        aria-hidden
                        style={{ color: token.colorTextTertiary }}
                      />
                    </Flex>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Card
            extra={
              <Typography.Text type="secondary">
                最近 {recentItems.length} 条
              </Typography.Text>
            }
            title="最近待处理记录"
          >
            {recentItems.length === 0 ? (
              <Empty
                description="当前没有待处理事项"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table<DashboardPendingItem>
                columns={columns}
                dataSource={recentItems}
                pagination={false}
                rowKey={(record) =>
                  `${record.businessType}-${record.businessId}`
                }
                scroll={{ x: 760 }}
                size="middle"
              />
            )}
          </Card>

          <Row gutter={[16, 16]}>
            <Col lg={12} xs={24}>
              <TrendCard
                ariaLabel={`绿植领养趋势图，${range}`}
                empty={
                  statistics ? isTrendEmpty(statistics.adoptionTrend) : false
                }
                failed={statsFailed}
                loading={statsLoading}
                note={ADOPTION_TREND_NOTE}
                onRetry={() => void loadStatistics()}
                option={adoptionOption}
                range={range}
                title="绿植领养趋势"
              />
            </Col>
            <Col lg={12} xs={24}>
              <TrendCard
                ariaLabel={`积分发放趋势图，${range}`}
                empty={
                  statistics ? isTrendEmpty(statistics.pointGrantTrend) : false
                }
                failed={statsFailed}
                loading={statsLoading}
                note={POINT_GRANT_TREND_NOTE}
                onRetry={() => void loadStatistics()}
                option={pointGrantOption}
                range={range}
                title="积分发放趋势"
              />
            </Col>
          </Row>
        </Flex>
      )}
    </ModulePage>
  );
}
