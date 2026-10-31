import { describe, expect, it } from "vitest";
import type { DailyValue } from "@/api/dashboard";
import {
  ADOPTION_TREND_NOTE,
  POINT_GRANT_TREND_NOTE,
  buildAdoptionTrendOption,
  buildPointGrantTrendOption,
  isTrendEmpty,
  type ChartTokens,
} from "@/pages/dashboard/charts";

const TOKENS: ChartTokens = {
  colorPrimary: "#1677ff",
  colorSuccess: "#52c41a",
  colorText: "#1f1f1f",
  colorTextSecondary: "#8c8c8c",
  colorBorderSecondary: "#f0f0f0",
  colorBgElevated: "#ffffff",
};

type OptionShape = {
  color: string[];
  legend: { top: number; textStyle: { color: string } };
  xAxis: { data: string[]; boundaryGap?: boolean };
  series: Array<{
    name: string;
    type: string;
    data: number[];
    itemStyle: { color: string };
  }>;
};

const DATA: DailyValue[] = [
  { date: "2026-10-01", value: 2 },
  { date: "2026-10-02", value: 0 },
  { date: "2026-10-03", value: 5 },
];

describe("dashboard chart options", () => {
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
  });
});
