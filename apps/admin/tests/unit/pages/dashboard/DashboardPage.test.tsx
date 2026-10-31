import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dashboardApi from "@/api/dashboard";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import { makeDashboard, makeRecentItem, makeStatistics } from "./fixtures";

vi.mock("@/api/dashboard", () => ({
  getDashboard: vi.fn(),
  getStatistics: vi.fn(),
}));

vi.mock("@/components/common/EChart", () => ({
  default: ({
    ariaLabel,
    option,
  }: {
    ariaLabel: string;
    option: { series?: Array<{ data?: number[] }> };
  }) => (
    <img
      alt={ariaLabel}
      data-series={option.series?.[0]?.data?.join(",") ?? ""}
      data-testid="echart"
      src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
    />
  ),
}));

const getDashboard = vi.mocked(dashboardApi.getDashboard);
const getStatistics = vi.mocked(dashboardApi.getStatistics);

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "*", element: <LocationProbe /> },
    ],
    { initialEntries: ["/dashboard"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

async function renderLoaded() {
  getDashboard.mockResolvedValue(makeDashboard());
  getStatistics.mockResolvedValue(makeStatistics());
  renderPage();
  await screen.findByText("待审核领养");
}

describe("DashboardPage", () => {
  beforeEach(() => {
    getDashboard.mockReset();
    getStatistics.mockReset();
  });

  it("renders eight count cards from the dashboard response", async () => {
    await renderLoaded();

    expect(screen.getAllByTestId("count-card")).toHaveLength(8);
    expect(
      screen.getByRole("button", { name: "待审核领养 1 条，查看列表" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "在养绿植 8 条，查看列表" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["待审核领养", "/adoptions?status=PENDING_REVIEW"],
    ["待处理领养变更", "/adoptions?status=CHANGES"],
    ["待审核打卡", "/care-reviews?status=PENDING_REVIEW"],
    ["待审核任务", "/tasks?tab=review&status=PENDING_REVIEW"],
    ["待领取奖励", "/points/orders?status=WAITING_PICKUP"],
    ["待处理反馈", "/feedback?status=PENDING"],
    ["可领养绿植", "/plants/instances?status=AVAILABLE"],
    ["在养绿植", "/plants/instances?status=ACTIVE"],
  ])("navigates the %s card to %s", async (label, path) => {
    await renderLoaded();

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`^${label} `) }),
    );

    expect(await screen.findByTestId("location")).toHaveTextContent(path);
  });

  it("renders charts with the daily series and metric notes", async () => {
    await renderLoaded();

    const charts = await screen.findAllByTestId("echart");

    expect(charts).toHaveLength(2);
    expect(charts[0]).toHaveAttribute("data-series", "1,0");
    expect(charts[1]).toHaveAttribute("data-series", "30,20");
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
    expect(screen.getByText(/按领养关系进入/)).toBeInTheDocument();
    expect(screen.getByText(/不含兑换退款/)).toBeInTheDocument();
  });

  it("sorts recent items and keeps only the newest ten", async () => {
    getDashboard.mockResolvedValue(
      makeDashboard({
        recentItems: Array.from({ length: 11 }, (_, index) =>
          makeRecentItem({
            businessId: index + 1,
            title: `事项 ${index + 1}`,
            submittedAt: `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00`,
          }),
        ),
      }),
    );
    getStatistics.mockResolvedValue(makeStatistics());
    renderPage();

    await screen.findByText("事项 11");
    const rows = document.querySelectorAll<HTMLElement>(
      ".ant-table-tbody tr.ant-table-row",
    );

    expect(rows).toHaveLength(10);
    expect(within(rows[0]!).getByText("事项 11")).toBeInTheDocument();
    expect(screen.queryByText("事项 1")).not.toBeInTheDocument();
  });

  it("shows the empty queue message without an empty table", async () => {
    getDashboard.mockResolvedValue(makeDashboard({ recentItems: [] }));
    getStatistics.mockResolvedValue(makeStatistics());
    renderPage();

    expect(await screen.findByText("当前没有待处理事项")).toBeInTheDocument();
    expect(document.querySelector(".ant-table")).not.toBeInTheDocument();
  });

  it.each([
    ["ADOPTION", "CANCEL_REVIEW", "/adoptions?status=CHANGES"],
    ["CARE", "PENDING_REVIEW", "/care-reviews?status=PENDING_REVIEW"],
    ["TASK", "PENDING_REVIEW", "/tasks?tab=review&status=PENDING_REVIEW"],
    ["REDEMPTION", "WAITING_PICKUP", "/points/orders?status=WAITING_PICKUP"],
    ["FEEDBACK", "PENDING", "/feedback?status=PENDING"],
  ])("navigates a %s recent item to %s", async (businessType, status, path) => {
    getDashboard.mockResolvedValue(
      makeDashboard({
        recentItems: [
          makeRecentItem({
            businessType,
            status,
            title: "待处理事项",
          }),
        ],
      }),
    );
    getStatistics.mockResolvedValue(makeStatistics());
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "去处理" }));

    expect(await screen.findByTestId("location")).toHaveTextContent(path);
  });

  it("shows a full-page failure when the dashboard request fails", async () => {
    getDashboard.mockRejectedValue(new Error("offline"));
    getStatistics.mockResolvedValue(makeStatistics());
    renderPage();

    expect(
      await screen.findByText("工作台加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重\s*试/ })).toBeInTheDocument();
  });

  it("keeps cards and recent items when only statistics fails, then retries", async () => {
    getDashboard.mockResolvedValue(makeDashboard());
    getStatistics.mockRejectedValueOnce(new Error("offline"));
    renderPage();

    expect(await screen.findByText("待审核领养")).toBeInTheDocument();
    expect(screen.getAllByText("趋势数据暂不可用").length).toBeGreaterThan(0);

    getStatistics.mockResolvedValue(makeStatistics());
    fireEvent.click(screen.getAllByRole("button", { name: "重试趋势" })[0]!);

    await waitFor(() =>
      expect(screen.getAllByTestId("echart")).toHaveLength(2),
    );
    expect(screen.queryAllByText("趋势数据暂不可用")).toHaveLength(0);
  });

  it("keeps responsive column classes for cards and content", async () => {
    await renderLoaded();

    const firstCard = screen.getAllByTestId("count-card")[0]!;

    expect(firstCard.parentElement?.className).toContain("ant-col-xs-24");
    expect(firstCard.parentElement?.className).toContain("ant-col-sm-12");
    expect(firstCard.parentElement?.className).toContain("ant-col-lg-12");
    expect(firstCard.parentElement?.className).toContain("ant-col-xl-6");
  });

  it("refreshes both data sources once per click", async () => {
    await renderLoaded();

    fireEvent.click(screen.getByRole("button", { name: /刷\s*新/ }));

    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
    expect(getStatistics).toHaveBeenCalledTimes(2);
  });
});
