import type { EChartsCoreOption } from "echarts/core";
import type { DailyValue, RankItem } from "@/api/statistics";

export const ADOPTION_TREND_NOTE = "按领养关系进入“养护中”的日期统计";
export const STATISTICS_ADOPTION_TREND_NOTE =
  "按领养关系由待领取转为养护中的日期统计";
export const POINT_GRANT_TREND_NOTE =
  "打卡和任务通过产生的奖励积分，不含兑换退款、人工调整和冲正";
export const TASK_COMPLETION_NOTE =
  "按任务参与记录统计，同一学生参加多个任务会分别计入";
export const POINT_RANKING_NOTE =
  "按当前积分余额排序，同分按最近获得积分时间排序，包含全部学生账号";

export type ChartTokens = {
  colorPrimary: string;
  colorSuccess: string;
  colorWarning: string;
  colorText: string;
  colorTextSecondary: string;
  colorBorderSecondary: string;
  colorBgElevated: string;
};

function dayLabels(data: DailyValue[]): string[] {
  return data.map((item) => item.date.slice(5));
}

function values(data: DailyValue[]): number[] {
  return data.map((item) => item.value);
}

/** 所有每日值都为 0 时，图表区域显示空数据提示。 */
export function isTrendEmpty(data: DailyValue[]): boolean {
  return data.every((item) => item.value === 0);
}

function tooltipStyle(tokens: ChartTokens) {
  return {
    trigger: "axis" as const,
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSecondary,
    textStyle: { color: tokens.colorText },
  };
}

function axisStyle(tokens: ChartTokens) {
  return {
    axisLine: { lineStyle: { color: tokens.colorBorderSecondary } },
    axisLabel: { color: tokens.colorTextSecondary },
  };
}

/** 构建工作台和数据统计页共用的绿植领养趋势折线图 option。 */
export function buildAdoptionTrendOption(
  data: DailyValue[],
  tokens: ChartTokens,
): EChartsCoreOption {
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
    },
    color: [tokens.colorPrimary],
    tooltip: tooltipStyle(tokens),
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.colorTextSecondary },
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dayLabels(data),
      ...axisStyle(tokens),
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: { color: tokens.colorTextSecondary },
    },
    series: [
      {
        name: "领养数",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: values(data),
        lineStyle: { width: 2, color: tokens.colorPrimary },
        itemStyle: { color: tokens.colorPrimary },
        areaStyle: { color: tokens.colorPrimary, opacity: 0.12 },
      },
    ],
  };
}

/** 构建工作台和数据统计页共用的积分发放趋势柱状图 option。 */
export function buildPointGrantTrendOption(
  data: DailyValue[],
  tokens: ChartTokens,
): EChartsCoreOption {
  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
    },
    color: [tokens.colorSuccess],
    tooltip: tooltipStyle(tokens),
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.colorTextSecondary },
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: dayLabels(data),
      ...axisStyle(tokens),
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: { color: tokens.colorTextSecondary },
    },
    series: [
      {
        name: "发放积分",
        type: "bar",
        barMaxWidth: 18,
        data: values(data),
        itemStyle: { color: tokens.colorSuccess },
      },
    ],
  };
}

/** 构建任务完成率的已通过/未完成构成条形图 option。 */
export function buildTaskCompletionOption(
  completed: number,
  ended: number,
  tokens: ChartTokens,
): EChartsCoreOption {
  const notCompleted = Math.max(ended - completed, 0);

  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
    },
    color: [tokens.colorSuccess, tokens.colorWarning],
    tooltip: tooltipStyle(tokens),
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.colorTextSecondary },
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: { color: tokens.colorTextSecondary },
    },
    yAxis: {
      type: "category",
      data: ["参与记录"],
      ...axisStyle(tokens),
    },
    series: [
      {
        name: "已通过",
        type: "bar",
        stack: "total",
        barWidth: 32,
        data: [completed],
        itemStyle: { color: tokens.colorSuccess },
        label: { show: true, position: "inside", color: tokens.colorText },
      },
      {
        name: "未完成/未通过",
        type: "bar",
        stack: "total",
        barWidth: 32,
        data: [notCompleted],
        itemStyle: { color: tokens.colorWarning },
        label: { show: true, position: "inside", color: tokens.colorText },
      },
    ],
  };
}

/** 构建积分余额排行的横向条形图 option。 */
export function buildPointRankingOption(
  ranking: RankItem[],
  tokens: ChartTokens,
  options: { compact?: boolean } = {},
): EChartsCoreOption {
  const compact = options.compact ?? false;
  const labels = ranking.map((item) => {
    if (!item.studentNumber) {
      return item.displayName;
    }

    return compact
      ? `${item.displayName}\n${item.studentNumber}`
      : `${item.displayName} · ${item.studentNumber}`;
  });

  return {
    animation: false,
    aria: {
      enabled: true,
      decal: { show: false },
    },
    color: [tokens.colorPrimary],
    tooltip: tooltipStyle(tokens),
    grid: {
      left: 8,
      right: compact ? 24 : 32,
      top: 8,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      minInterval: 1,
      splitNumber: compact ? 2 : 5,
      splitLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: {
        color: tokens.colorTextSecondary,
        fontSize: compact ? 11 : 12,
        hideOverlap: true,
      },
    },
    yAxis: {
      type: "category",
      data: labels,
      inverse: true,
      ...axisStyle(tokens),
      axisLabel: {
        color: tokens.colorTextSecondary,
        width: compact ? 76 : 140,
        overflow: "truncate",
        fontSize: compact ? 11 : 12,
        lineHeight: compact ? 14 : 16,
      },
    },
    series: [
      {
        name: "积分余额",
        type: "bar",
        barMaxWidth: 18,
        data: ranking.map((item) => item.pointsBalance),
        itemStyle: { color: tokens.colorPrimary },
        label: {
          show: true,
          position: "right",
          color: tokens.colorTextSecondary,
          fontSize: compact ? 11 : 12,
        },
      },
    ],
  };
}
