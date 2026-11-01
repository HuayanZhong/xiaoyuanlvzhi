import { describe, expect, it } from "vitest";
import type { DailyValue, RankItem } from "@/api/statistics";
import {
  ADOPTION_TREND_NOTE,
  POINT_GRANT_TREND_NOTE,
  POINT_RANKING_NOTE,
  TASK_COMPLETION_NOTE,
  buildAdoptionTrendOption,
  buildPointGrantTrendOption,
  buildPointRankingOption,
  buildTaskCompletionOption,
  isTrendEmpty,
  type ChartTokens,
} from "@/lib/charts";

const TOKENS: ChartTokens = {
  colorPrimary: "#1677ff",
  colorSuccess: "#52c41a",
  colorWarning: "#faad14",
  colorText: "#1f1f1f",
  colorTextSecondary: "#8c8c8c",
  colorBorderSecondary: "#f0f0f0",
  colorBgElevated: "#ffffff",
};

type OptionShape = {
  color: string[];
  legend: { top: number; textStyle: { color: string } };
  xAxis: { data: string[]; boundaryGap?: boolean };
  yAxis: {
    data?: string[];
    inverse?: boolean;
    axisLabel?: { width: number; fontSize: number };
  };
  series: Array<{
    name: string;
    type: string;
    data: unknown[];
    stack?: string;
    itemStyle: { color: string };
  }>;
};

const DATA: DailyValue[] = [
  { date: "2026-10-01", value: 2 },
  { date: "2026-10-02", value: 0 },
  { date: "2026-10-03", value: 5 },
];

const RANKING: RankItem[] = [
  {
    accountId: 1,
    displayName: "张三",
    studentNumber: "20260001",
    pointsBalance: 100,
  },
  {
    accountId: 2,
    displayName: "李四",
    studentNumber: null,
    pointsBalance: 80,
  },
];

describe("admin chart options", () => {
  it("builds the adoption line chart with dates, values and theme colors", () => {
    const option = buildAdoptionTrendOption(
      DATA,
      TOKENS,
    ) as unknown as OptionShape;

    expect(option.xAxis.data).toEqual(["10-01", "10-02", "10-03"]);
    expect(option.color).toEqual([TOKENS.colorPrimary]);
    expect(option.legend.textStyle.color).toBe(TOKENS.colorTextSecondary);
    expect(option.series[0]).toMatchObject({
      name: "领养数",
      type: "line",
      data: [2, 0, 5],
      itemStyle: { color: TOKENS.colorPrimary },
    });
  });

  it("builds the point grant bar chart with dates and values", () => {
    const option = buildPointGrantTrendOption(
      DATA,
      TOKENS,
    ) as unknown as OptionShape;

    expect(option.xAxis.data).toEqual(["10-01", "10-02", "10-03"]);
    expect(option.color).toEqual([TOKENS.colorSuccess]);
    expect(option.series[0]).toMatchObject({
      name: "发放积分",
      type: "bar",
      data: [2, 0, 5],
      itemStyle: { color: TOKENS.colorSuccess },
    });
  });

  it("builds the task completion composition with completed and remaining records", () => {
    const option = buildTaskCompletionOption(
      4,
      5,
      TOKENS,
    ) as unknown as OptionShape;

    expect(option.color).toEqual([TOKENS.colorSuccess, TOKENS.colorWarning]);
    expect(option.series).toHaveLength(2);
    expect(option.series[0]).toMatchObject({
      name: "已通过",
      type: "bar",
      stack: "total",
      data: [4],
      itemStyle: { color: TOKENS.colorSuccess },
    });
    expect(option.series[1]).toMatchObject({
      name: "未完成/未通过",
      type: "bar",
      stack: "total",
      data: [1],
      itemStyle: { color: TOKENS.colorWarning },
    });
  });

  it("builds the point ranking as an inverted horizontal bar", () => {
    const option = buildPointRankingOption(
      RANKING,
      TOKENS,
    ) as unknown as OptionShape;

    expect(option.yAxis.data).toEqual(["张三 · 20260001", "李四"]);
    expect(option.yAxis.inverse).toBe(true);
    expect(option.series[0]).toMatchObject({
      name: "积分余额",
      type: "bar",
      data: [100, 80],
      itemStyle: { color: TOKENS.colorPrimary },
    });
  });

  it("compacts the ranking labels for narrow charts", () => {
    const option = buildPointRankingOption(RANKING, TOKENS, {
      compact: true,
    }) as unknown as OptionShape;

    expect(option.yAxis.data).toEqual(["张三\n20260001", "李四"]);
    expect(option.yAxis.axisLabel).toMatchObject({ width: 76, fontSize: 11 });
  });

  it("detects an empty trend only when every value is zero", () => {
    expect(isTrendEmpty(DATA)).toBe(false);
    expect(
      isTrendEmpty([
        { date: "2026-10-01", value: 0 },
        { date: "2026-10-02", value: 0 },
      ]),
    ).toBe(true);
  });

  it("exposes the metric notes used beside the charts", () => {
    expect(ADOPTION_TREND_NOTE).toContain("养护中");
    expect(POINT_GRANT_TREND_NOTE).toContain("不含兑换退款");
    expect(POINT_GRANT_TREND_NOTE).toContain("人工调整");
    expect(TASK_COMPLETION_NOTE).toContain("参与记录");
    expect(POINT_RANKING_NOTE).toContain("最近获得积分时间");
  });
});
