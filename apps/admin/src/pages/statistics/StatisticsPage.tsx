import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Row,
  Skeleton,
  Statistic,
  theme,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { EChartsCoreOption } from "echarts/core";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/api/client";
import {
  getStatistics,
  type StatisticsRange,
  type StatisticsView,
} from "@/api/statistics";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  POINT_GRANT_TREND_NOTE,
  POINT_RANKING_NOTE,
  STATISTICS_ADOPTION_TREND_NOTE,
  TASK_COMPLETION_NOTE,
  buildAdoptionTrendOption,
  buildPointGrantTrendOption,
  buildPointRankingOption,
  buildTaskCompletionOption,
  isTrendEmpty,
  type ChartTokens,
} from "@/lib/charts";
import { emitToast } from "@/lib/toast-events";
import { isRangeWithinLimit, toStatisticsRange } from "./range";

const EChart = lazy(() => import("@/components/common/EChart"));

const RANGE_PICKER = DatePicker.RangePicker;
const CHART_HEIGHT = 260;

type RangeValue = [Dayjs, Dayjs] | null;

const RANGE_PRESETS = [
  {
    label: "近 7 天",
    value: [() => dayjs().subtract(6, "day"), () => dayjs()],
  },
  {
    label: "近 30 天",
    value: [() => dayjs().subtract(29, "day"), () => dayjs()],
  },
  {
    label: "近 90 天",
    value: [() => dayjs().subtract(89, "day"), () => dayjs()],
  },
] as const;

const disabledDate = (current: Dayjs) => current.isAfter(dayjs(), "day");

const METRIC_CARDS = [
  {
    key: "currentActivePlants",
    label: "当前在养数",
    note: "当前时点状态为养护中的单株快照，不受日期范围影响",
  },
  {
    key: "adoptionsStarted",
    label: "累计领养数",
    note: "所选范围内由待领取转为养护中的领养关系数",
  },
  {
    key: "participatingStudents",
    label: "参与学生数",
    note: "所选范围内至少一条打卡或任务凭证审核通过的去重学生",
  },
  {
    key: "pointsGranted",
    label: "积分发放量",
    note: "所选范围内打卡和任务通过产生的奖励积分",
  },
] as const;

type ChartCardProps = {
  title: string;
  range: string;
  note: string;
  empty: boolean;
  emptyText: string;
  ariaLabel: string;
  option: EChartsCoreOption;
  extra?: ReactNode;
};

function ChartCard({
  title,
  range,
  note,
  empty,
  emptyText,
  ariaLabel,
  option,
  extra,
}: ChartCardProps) {
  return (
    <Card extra={extra} title={title}>
      <Flex gap={8} vertical>
        <Typography.Text type="secondary">统计范围：{range}</Typography.Text>
        {empty ? (
          <Flex
            align="center"
            justify="center"
            style={{ minHeight: CHART_HEIGHT }}
          >
            <Empty
              description={emptyText}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Flex>
        ) : (
          <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
            <EChart
              ariaLabel={ariaLabel}
              height={CHART_HEIGHT}
              option={option}
            />
          </Suspense>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {note}
        </Typography.Text>
      </Flex>
    </Card>
  );
}

/** 数据统计：日期范围筛选、指标卡、趋势、任务完成率和积分排行。 */
export default function StatisticsPage() {
  const isMobile = useIsMobile();
  const { token } = theme.useToken();
  const [data, setData] = useState<StatisticsView | null>(null);
  const [pickerRange, setPickerRange] = useState<RangeValue>(null);
  const [appliedRange, setAppliedRange] = useState<StatisticsRange | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestRef = useRef(false);

  const loadStatistics = useCallback(async (range: StatisticsRange | null) => {
    if (requestRef.current) {
      return;
    }

    requestRef.current = true;
    setAppliedRange(range);
    setLoading(true);
    setFailed(false);

    try {
      const next = await getStatistics(range ?? undefined);
      setData(next);
      setPickerRange([dayjs(next.from), dayjs(next.to)]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      setFailed(true);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "统计数据加载失败，请稍后重试",
      );
    } finally {
      requestRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 首次进入统计页加载默认范围
    void loadStatistics(null);
  }, [loadStatistics]);

  const chartTokens = useMemo<ChartTokens>(
    () => ({
      colorPrimary: token.colorPrimary,
      colorSuccess: token.colorSuccess,
      colorWarning: token.colorWarning,
      colorText: token.colorText,
      colorTextSecondary: token.colorTextSecondary,
      colorBorderSecondary: token.colorBorderSecondary,
      colorBgElevated: token.colorBgElevated,
    }),
    [
      token.colorPrimary,
      token.colorSuccess,
      token.colorWarning,
      token.colorText,
      token.colorTextSecondary,
      token.colorBorderSecondary,
      token.colorBgElevated,
    ],
  );

  const adoptionOption = useMemo(
    () => buildAdoptionTrendOption(data?.adoptionTrend ?? [], chartTokens),
    [data?.adoptionTrend, chartTokens],
  );
  const pointGrantOption = useMemo(
    () => buildPointGrantTrendOption(data?.pointGrantTrend ?? [], chartTokens),
    [data?.pointGrantTrend, chartTokens],
  );
  const completionOption = useMemo(
    () =>
      buildTaskCompletionOption(
        data?.completedTaskParticipants ?? 0,
        data?.endedTaskParticipants ?? 0,
        chartTokens,
      ),
    [data?.completedTaskParticipants, data?.endedTaskParticipants, chartTokens],
  );
  const rankingOption = useMemo(
    () =>
      buildPointRankingOption(data?.pointRanking ?? [], chartTokens, {
        compact: isMobile,
      }),
    [data?.pointRanking, chartTokens, isMobile],
  );

  const rangeLabel = data ? `${data.from} 至 ${data.to}` : "近 30 天";
  const completionRate = data?.taskCompletionRate;
  const completionText =
    completionRate == null ? "—" : `${(completionRate * 100).toFixed(1)}%`;
  const hasEndedTasks = (data?.endedTaskParticipants ?? 0) > 0;
  const ranking = data?.pointRanking ?? [];

  const applyRange = () => {
    if (!pickerRange || loading) {
      return;
    }

    const [from, to] = pickerRange;

    if (!isRangeWithinLimit(from, to)) {
      emitToast("error", "统计范围最多为 367 天");
      return;
    }

    void loadStatistics(toStatisticsRange(from, to));
  };

  const resetRange = () => {
    if (loading) {
      return;
    }

    setPickerRange(null);
    void loadStatistics(null);
  };

  const content = (
    <Flex gap={16} vertical>
      <Flex align="center" gap={12} wrap>
        <RANGE_PICKER
          allowClear={false}
          disabledDate={disabledDate}
          format="YYYY-MM-DD"
          maxDate={dayjs()}
          onChange={(dates) => setPickerRange(dates as RangeValue)}
          placeholder={["开始日期", "结束日期"]}
          presets={RANGE_PRESETS.map((preset) => ({
            label: preset.label,
            value: [preset.value[0](), preset.value[1]()] as [Dayjs, Dayjs],
          }))}
          style={{ width: isMobile ? "100%" : 300 }}
          value={pickerRange}
        />
        <Button
          icon={<SearchOutlined />}
          loading={loading}
          onClick={applyRange}
          type="primary"
        >
          查询
        </Button>
        <Button disabled={loading} onClick={resetRange}>
          重置
        </Button>
      </Flex>

      {failed ? (
        <LoadFailure
          message={errorMessage || "统计数据加载失败，请稍后重试"}
          onRetry={() => void loadStatistics(appliedRange)}
        />
      ) : loading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : !data ? (
        <Empty
          description="暂无统计数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Flex gap={16} vertical>
          <Row gutter={[16, 16]}>
            {METRIC_CARDS.map((card) => (
              <Col key={card.key} lg={12} sm={12} xl={6} xs={24}>
                <Card data-testid="metric-card">
                  <Flex gap={8} vertical>
                    <Statistic
                      styles={{ content: { fontSize: 28, fontWeight: 600 } }}
                      title={card.label}
                      value={data[card.key]}
                    />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {card.note}
                    </Typography.Text>
                  </Flex>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col lg={12} xs={24}>
              <ChartCard
                ariaLabel={`绿植领养趋势图，${rangeLabel}`}
                empty={isTrendEmpty(data.adoptionTrend)}
                emptyText="所选范围内暂无领养数据"
                note={STATISTICS_ADOPTION_TREND_NOTE}
                option={adoptionOption}
                range={rangeLabel}
                title="绿植领养趋势"
              />
            </Col>
            <Col lg={12} xs={24}>
              <ChartCard
                ariaLabel={`积分发放趋势图，${rangeLabel}`}
                empty={isTrendEmpty(data.pointGrantTrend)}
                emptyText="所选范围内暂无积分发放"
                note={POINT_GRANT_TREND_NOTE}
                option={pointGrantOption}
                range={rangeLabel}
                title="积分发放趋势"
              />
            </Col>
            <Col lg={12} xs={24}>
              <ChartCard
                ariaLabel={`任务完成率构成图，${rangeLabel}`}
                empty={!hasEndedTasks}
                emptyText="所选范围内没有已结束的任务"
                extra={
                  <Typography.Text strong>{completionText}</Typography.Text>
                }
                note={TASK_COMPLETION_NOTE}
                option={completionOption}
                range={rangeLabel}
                title="任务完成率"
              />
            </Col>
            <Col lg={12} xs={24}>
              <ChartCard
                ariaLabel={`积分余额排行图，${rangeLabel}`}
                empty={ranking.length === 0}
                emptyText="暂无积分排行"
                note={POINT_RANKING_NOTE}
                option={rankingOption}
                range={rangeLabel}
                title="积分余额排行"
              />
            </Col>
          </Row>
        </Flex>
      )}
    </Flex>
  );

  return (
    <ModulePage
      extra={
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => void loadStatistics(appliedRange)}
        >
          刷新
        </Button>
      }
      title="数据统计"
    >
      {content}
    </ModulePage>
  );
}
