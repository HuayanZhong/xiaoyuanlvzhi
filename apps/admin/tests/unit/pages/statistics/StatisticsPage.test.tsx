import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import type { StatisticsView } from "@/api/statistics";
import * as statisticsApi from "@/api/statistics";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import { makeStatistics } from "./fixtures";

vi.mock("@/api/statistics", () => ({
  getStatistics: vi.fn(),
}));

vi.mock("@/components/common/EChart", () => ({
  default: ({
    ariaLabel,
    option,
  }: {
    ariaLabel: string;
    option: { series?: Array<{ data?: unknown[] }> };
  }) => (
    <img
      alt={ariaLabel}
      data-series={JSON.stringify(option.series?.map((series) => series.data))}
      data-testid="echart"
      src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
    />
  ),
}));

const getStatistics = vi.mocked(statisticsApi.getStatistics);

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/statistics", element: <StatisticsPage /> }],
    { initialEntries: ["/statistics"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

async function renderLoaded(overrides: Partial<StatisticsView> = {}) {
  getStatistics.mockResolvedValue(makeStatistics(overrides));
  renderPage();
  await screen.findByText("当前在养数");
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /刷\s*新/ })).not.toHaveClass(
      "ant-btn-loading",
    );
  });
}

describe("StatisticsPage", () => {
  beforeEach(() => {
    getStatistics.mockReset();
  });

  it("loads the default range and renders four metric cards", async () => {
    await renderLoaded();

    expect(getStatistics).toHaveBeenCalledWith(undefined);
    expect(screen.getAllByTestId("metric-card")).toHaveLength(4);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(
      screen.getAllByText(/2026-10-01 至 2026-10-30/).length,
    ).toBeGreaterThan(0);
  });

  it("renders four charts with accessible labels and metric notes", async () => {
    await renderLoaded();

    expect(screen.getAllByTestId("echart")).toHaveLength(4);
    expect(
      screen.getByRole("img", {
        name: /绿植领养趋势图，2026-10-01 至 2026-10-30/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /积分发放趋势图，2026-10-01 至 2026-10-30/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /任务完成率构成图，2026-10-01 至 2026-10-30/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /积分余额排行图，2026-10-01 至 2026-10-30/,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(
      screen.getByText("按领养关系由待领取转为养护中的日期统计"),
    ).toBeInTheDocument();
    expect(screen.getByText(/不含兑换退款/)).toBeInTheDocument();
    expect(
      screen.getByText(/同一学生参加多个任务会分别计入/),
    ).toBeInTheDocument();
    expect(screen.getByText(/最近获得积分时间/)).toBeInTheDocument();
  });

  it("shows the composition and ranking chart data", async () => {
    await renderLoaded();

    const charts = screen.getAllByTestId("echart");
    expect(charts[2]).toHaveAttribute("data-series", "[[4],[1]]");
    expect(charts[3]).toHaveAttribute("data-series", "[[100]]");
  });

  it("resets to the default range", async () => {
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(getStatistics).toHaveBeenLastCalledWith(undefined);
    expect(getStatistics).toHaveBeenCalledTimes(2);
  });

  it("shows a retry state and reloads after retry", async () => {
    getStatistics
      .mockRejectedValueOnce(
        new ApiError("UPSTREAM_UNAVAILABLE", "服务暂不可用", 500),
      )
      .mockResolvedValueOnce(makeStatistics());

    renderPage();

    expect(await screen.findByText("服务暂不可用")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("当前在养数")).toBeInTheDocument();
    expect(getStatistics).toHaveBeenCalledTimes(2);
  });

  it("renders empty states without fake values", async () => {
    await renderLoaded({
      currentActivePlants: 0,
      adoptionsStarted: 0,
      participatingStudents: 0,
      completedTaskParticipants: 0,
      endedTaskParticipants: 0,
      taskCompletionRate: null,
      pointsGranted: 0,
      pointRanking: [],
      adoptionTrend: [],
      pointGrantTrend: [],
    });

    expect(screen.getAllByText("0")).toHaveLength(4);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("所选范围内暂无领养数据")).toBeInTheDocument();
    expect(screen.getByText("所选范围内暂无积分发放")).toBeInTheDocument();
    expect(screen.getByText("所选范围内没有已结束的任务")).toBeInTheDocument();
    expect(screen.getByText("暂无积分排行")).toBeInTheDocument();
  });

  it("does not start a second refresh while one is pending", async () => {
    await renderLoaded();

    const refreshButton = screen.getByRole("button", { name: /刷\s*新/ });
    expect(screen.getAllByTestId("metric-card")).toHaveLength(4);
    expect(refreshButton).not.toHaveClass("ant-btn-loading");

    let resolveRefresh!: (value: StatisticsView) => void;
    getStatistics.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    fireEvent.click(refreshButton);
    await waitFor(() => {
      expect(refreshButton).toHaveClass("ant-btn-loading");
    });
    fireEvent.click(refreshButton);

    expect(getStatistics).toHaveBeenCalledTimes(2);

    resolveRefresh(makeStatistics({ currentActivePlants: 9 }));
    expect(await screen.findByText("9")).toBeInTheDocument();
    expect(getStatistics).toHaveBeenCalledTimes(2);
  });
});
