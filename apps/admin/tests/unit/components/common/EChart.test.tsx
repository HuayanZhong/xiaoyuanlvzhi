import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EChart from "@/components/common/EChart";

const echartsMock = vi.hoisted(() => {
  const chart = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  };

  return {
    chart,
    init: vi.fn(() => chart),
    use: vi.fn(),
  };
});

vi.mock("echarts/core", () => ({
  init: echartsMock.init,
  use: echartsMock.use,
}));
vi.mock("echarts/charts", () => ({ BarChart: {}, LineChart: {} }));
vi.mock("echarts/components", () => ({
  AriaComponent: {},
  GridComponent: {},
  LegendComponent: {},
  TooltipComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));

type ObserverInstance = {
  callback: ResizeObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

const observers: ObserverInstance[] = [];

class MockResizeObserver {
  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    observers.push(this as unknown as ObserverInstance);
  }
}

describe("EChart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observers.length = 0;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  it("initializes the chart, applies the option and exposes an accessible name", () => {
    render(
      <EChart
        ariaLabel="绿植领养趋势图"
        height={200}
        option={{ series: [] }}
      />,
    );

    expect(echartsMock.init).toHaveBeenCalledTimes(1);
    expect(echartsMock.chart.setOption).toHaveBeenCalledWith(
      { series: [] },
      { notMerge: true },
    );
    expect(screen.getByRole("img", { name: "绿植领养趋势图" })).toHaveStyle({
      height: "200px",
    });
  });

  it("updates the option when data changes", () => {
    const { rerender } = render(
      <EChart ariaLabel="趋势" option={{ series: [{ data: [1] }] }} />,
    );

    rerender(<EChart ariaLabel="趋势" option={{ series: [{ data: [2] }] }} />);

    expect(echartsMock.chart.setOption).toHaveBeenCalledTimes(2);
    expect(echartsMock.chart.setOption).toHaveBeenLastCalledWith(
      { series: [{ data: [2] }] },
      { notMerge: true },
    );
  });

  it("resizes with its container and disposes on unmount", () => {
    const { unmount } = render(
      <EChart ariaLabel="趋势" option={{ series: [] }} />,
    );
    const observer = observers[0];

    act(() => observer?.callback([], {} as ResizeObserver));
    expect(echartsMock.chart.resize).toHaveBeenCalledTimes(1);

    unmount();

    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
    expect(echartsMock.chart.dispose).toHaveBeenCalledTimes(1);
  });
});
