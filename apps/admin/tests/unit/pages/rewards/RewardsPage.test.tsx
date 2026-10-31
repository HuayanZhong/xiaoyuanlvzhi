import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as rewardsApi from "@/api/rewards";
import { emitToast } from "@/lib/toast-events";
import RewardsPage from "@/pages/rewards/RewardsPage";
import { makeReward } from "./fixtures";

vi.mock("@/api/rewards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/rewards")>();

  return {
    ...actual,
    listRewards: vi.fn(),
    updateReward: vi.fn(),
    createReward: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listRewards = vi.mocked(rewardsApi.listRewards);
const updateReward = vi.mocked(rewardsApi.updateReward);
const emitToastMock = vi.mocked(emitToast);

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/points/rewards", element: <RewardsPage /> }],
    { initialEntries: ["/points/rewards"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

function tableRows() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".ant-table-tbody tr.ant-table-row"),
  );
}

async function selectOption(combobox: HTMLElement, label: string) {
  fireEvent.mouseDown(combobox);

  const dropdown = await waitFor(() => {
    const candidates = Array.from(
      document.querySelectorAll(".ant-select-dropdown"),
    ).filter(
      (element) => !element.classList.contains("ant-select-dropdown-hidden"),
    );
    const last = candidates.at(-1);

    if (!last) {
      throw new Error("select dropdown not found");
    }

    return last as HTMLElement;
  });

  fireEvent.click(within(dropdown).getByText(label));
}

describe("RewardsPage", () => {
  beforeEach(() => {
    listRewards.mockReset();
    updateReward.mockReset();
    emitToastMock.mockReset();
    listRewards.mockResolvedValue([makeReward()]);
    updateReward.mockResolvedValue(makeReward({ enabled: false }));
  });

  it("renders rewards with split inventory and Chinese status", async () => {
    listRewards.mockResolvedValue([
      makeReward(),
      makeReward({
        id: 2,
        name: "多肉盆栽",
        enabled: false,
        availableStock: 8,
        reservedStock: 1,
        claimedCount: 2,
        remainingStock: 5,
      }),
    ]);

    renderPage();

    expect(await screen.findByText("环保帆布袋")).toBeInTheDocument();
    expect(screen.getByText("多肉盆栽")).toBeInTheDocument();
    expect(screen.getByText("剩余 12 / 总 20")).toBeInTheDocument();
    expect(screen.getByText("已预留 3 · 已领取 5")).toBeInTheDocument();
    expect(screen.getAllByText("上架").length).toBeGreaterThan(0);
    expect(screen.getAllByText("下架").length).toBeGreaterThan(0);
  });

  it("filters by keyword and status, then resets", async () => {
    listRewards.mockResolvedValue([
      makeReward(),
      makeReward({ id: 2, name: "多肉盆栽", enabled: false }),
    ]);

    renderPage();
    await screen.findByText("环保帆布袋");

    fireEvent.change(screen.getByPlaceholderText("奖励名称"), {
      target: { value: "多肉" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("环保帆布袋")).not.toBeInTheDocument();
    expect(screen.getByText("多肉盆栽")).toBeInTheDocument();

    await selectOption(screen.getByRole("combobox"), "下架");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("多肉盆栽")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("环保帆布袋")).toBeInTheDocument();
    expect(screen.getByText("多肉盆栽")).toBeInTheDocument();
  });

  it("paginates ten rewards at a time", async () => {
    listRewards.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeReward({
          id: index + 1,
          name: `奖励${index + 1}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("奖励12");

    expect(screen.getByText("共 12 条")).toBeInTheDocument();
    expect(tableRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(tableRows()).toHaveLength(2);
  });

  it("confirms before disabling a reward", async () => {
    renderPage();
    await screen.findByText("环保帆布袋");

    fireEvent.click(screen.getByRole("button", { name: /下\s*架/ }));
    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");

      if (!element) {
        throw new Error("popover not found");
      }

      return element as HTMLElement;
    });
    fireEvent.click(within(popover).getByRole("button", { name: /下\s*架/ }));

    await waitFor(() =>
      expect(updateReward).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ enabled: false }),
      ),
    );
    expect(listRewards).toHaveBeenCalledTimes(2);
    expect(emitToastMock).toHaveBeenCalledWith("success", "奖励已下架");
  });

  it("shows an empty state and refreshes", async () => {
    listRewards.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无奖励商品")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /刷\s*新/ }));

    expect(listRewards).toHaveBeenCalledTimes(2);
  });

  it("shows a load failure and retries", async () => {
    listRewards.mockReset();
    listRewards
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeReward()]);

    renderPage();

    expect(
      await screen.findByText("奖励商品加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("环保帆布袋")).toBeInTheDocument();
  });
});
