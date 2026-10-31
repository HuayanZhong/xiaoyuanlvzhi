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
import * as accountsApi from "@/api/accounts";
import * as rewardsApi from "@/api/rewards";
import { emitToast } from "@/lib/toast-events";
import OrdersPage from "@/pages/rewards/OrdersPage";
import { makeOrder, makeStudent } from "./fixtures";

vi.mock("@/api/rewards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/rewards")>();

  return {
    ...actual,
    listOrders: vi.fn(),
    claimOrder: vi.fn(),
    cancelOrder: vi.fn(),
  };
});

vi.mock("@/api/accounts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/accounts")>();

  return {
    ...actual,
    listStudents: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listOrders = vi.mocked(rewardsApi.listOrders);
const claimOrder = vi.mocked(rewardsApi.claimOrder);
const listStudents = vi.mocked(accountsApi.listStudents);
const emitToastMock = vi.mocked(emitToast);

const NOW = new Date("2026-10-30T12:00:00");

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/points/orders", element: <OrdersPage now={NOW} /> }],
    { initialEntries: ["/points/orders"] },
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

describe("OrdersPage", () => {
  beforeEach(() => {
    listOrders.mockReset();
    claimOrder.mockReset();
    listStudents.mockReset();
    emitToastMock.mockReset();

    listOrders.mockResolvedValue([
      makeOrder(),
      makeOrder({
        id: 6,
        orderNo: "RDM-OVERDUE",
        studentId: 3,
        studentEmail: "li@qq.com",
        createdAt: "2026-10-29T10:00:00",
        pickupDeadline: "2026-10-29T10:00:00",
      }),
      makeOrder({
        id: 7,
        orderNo: "RDM-CLAIMED",
        studentId: 4,
        studentEmail: "wang@qq.com",
        status: "CLAIMED",
        claimedAt: "2026-10-30T11:00:00",
      }),
    ]);
    listStudents.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        email: "li@qq.com",
        fullName: "李四",
        studentNumber: "20260002",
      }),
      makeStudent({
        id: 4,
        email: "wang@qq.com",
        fullName: "王五",
        studentNumber: "20260003",
      }),
    ]);
    claimOrder.mockResolvedValue(makeOrder({ status: "CLAIMED" }));
  });

  it("joins students and renders waiting, overdue and claimed states", async () => {
    renderPage();

    expect(await screen.findByText("张三")).toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.getByText("20260001")).toBeInTheDocument();
    expect(screen.getByText("20260002")).toBeInTheDocument();
    expect(screen.getByText("待领取")).toBeInTheDocument();
    expect(screen.getByText("已超时")).toBeInTheDocument();
    expect(screen.getByText("已领取")).toBeInTheDocument();
    expect(screen.getByText("已超时，等待退分")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "确认领取" })).toHaveLength(1);
  });

  it("filters by keyword, status and date, then resets", async () => {
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByPlaceholderText("订单号、学生或奖励"), {
      target: { value: "李四" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("张三")).not.toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    await selectOption(screen.getByRole("combobox"), "已超时");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    fireEvent.change(screen.getByLabelText("下单日期起"), {
      target: { value: "2026-10-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.queryByText("李四")).not.toBeInTheDocument();
  });

  it("paginates ten orders at a time", async () => {
    listOrders.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeOrder({
          id: index + 1,
          orderNo: `RDM-${index + 1}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("RDM-12");

    expect(screen.getByText("共 12 条")).toBeInTheDocument();
    expect(tableRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(tableRows()).toHaveLength(2);
  });

  it("falls back to email and warns when the account directory fails", async () => {
    listStudents.mockRejectedValue(new Error("network"));

    renderPage();

    expect(
      await screen.findByText("账号资料暂不可用，学生列仅显示邮箱"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("student@qq.com").length).toBeGreaterThan(0);
  });

  it("claims an order after confirmation and refreshes", async () => {
    renderPage();
    await screen.findByText("张三");

    fireEvent.click(screen.getByRole("button", { name: "确认领取" }));
    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");

      if (!element) {
        throw new Error("popover not found");
      }

      return element as HTMLElement;
    });
    fireEvent.click(within(popover).getByRole("button", { name: "确认领取" }));

    await waitFor(() => {
      expect(claimOrder).toHaveBeenCalledTimes(1);
      expect(claimOrder).toHaveBeenCalledWith(5);
      expect(listOrders).toHaveBeenCalledTimes(2);
    });
    expect(emitToastMock).toHaveBeenCalledWith("success", "已确认领取");
  });

  it("shows an empty state and a load failure", async () => {
    listOrders.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无兑换订单")).toBeInTheDocument();
  });

  it("shows a load failure and retries", async () => {
    listOrders.mockReset();
    listOrders
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeOrder()]);

    renderPage();

    expect(
      await screen.findByText("兑换订单加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("RDM-1A2B3C4D")).toBeInTheDocument();
  });
});
