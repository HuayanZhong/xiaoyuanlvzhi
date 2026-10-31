/* oxlint-disable jsx-a11y/prefer-tag-over-role -- ECharts renders into a div; role="img" exposes the canvas. */
import { BarChart, LineChart } from "echarts/charts";
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AriaComponent,
  CanvasRenderer,
]);

type EChartProps = {
  option: EChartsCoreOption;
  ariaLabel: string;
  height?: number;
  className?: string;
};

/**
 * 管理端图表容器。
 *
 * <p>按需注册 ECharts 图表类型，负责实例生命周期和尺寸变化；颜色由调用方
 * 通过 antd design token 传入 option，不在这里维护第二套主题。
 */
export default function EChart({
  option,
  ariaLabel,
  height = 240,
  className,
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = echarts.init(container);
    chartRef.current = chart;

    const resize = () => chart.resize();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => resize());

    observer?.observe(container);
    window.addEventListener("resize", resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      aria-label={ariaLabel}
      className={className}
      ref={containerRef}
      role="img"
      style={{ height, width: "100%" }}
    />
  );
}
