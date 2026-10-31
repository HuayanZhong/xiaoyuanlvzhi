import type { EChartsCoreOption } from "echarts/core";
import type { DailyValue } from "@/api/dashboard";

export const ADOPTION_TREND_NOTE = "按领养关系进入“养护中”的日期统计";
export const POINT_GRANT_TREND_NOTE =
  "打卡和任务通过产生的奖励积分，不含兑换退款、人工调整和冲正";

export type ChartTokens = {
  colorPrimary: string;
  colorSuccess: string;
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

/** 构建工作台的绿植领养趋势折线图 option。 */
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
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.colorBgElevated,
      borderColor: tokens.colorBorderSecondary,
      textStyle: { color: tokens.colorText },
    },
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
      axisLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: { color: tokens.colorTextSecondary },
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

/** 构建工作台的积分发放趋势柱状图 option。 */
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
    tooltip: {
      trigger: "axis",
      backgroundColor: tokens.colorBgElevated,
      borderColor: tokens.colorBorderSecondary,
      textStyle: { color: tokens.colorText },
    },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: tokens.colorTextSecondary },
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: dayLabels(data),
      axisLine: { lineStyle: { color: tokens.colorBorderSecondary } },
      axisLabel: { color: tokens.colorTextSecondary },
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
