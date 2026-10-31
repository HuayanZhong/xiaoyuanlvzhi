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
import * as pointsApi from "@/api/points";
import { emitToast } from "@/lib/toast-events";
import PointsPage from "@/pages/points/PointsPage";
import { makeLedger, makeRule, makeStudent } from "./fixtures";

vi.mock("@/api/points", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/points")>();

  return {
    ...actual,
    listPointRules: vi.fn(),
    listPointLedger: vi.fn(),
    updatePointRule: vi.fn(),
    adjustPoints: vi.fn(),
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

const listPointRules = vi.mocked(pointsApi.listPointRules);
const listPointLedger = vi.mocked(pointsApi.listPointLedger);
const updatePointRule = vi.mocked(pointsApi.updatePointRule);
const adjustPoints = vi.mocked(pointsApi.adjustPoints);
const listStudents = vi.mocked(accountsApi.listStudents);
const emitToastMock = vi.mocked(emitToast);

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/points/rules", element: <PointsPage /> }],
    { initialEntries: ["/points/rules"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
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

async function fillAdjustment() {
  const dialog = await screen.findByRole("dialog");
  const comboboxes = within(dialog).getAllByRole("combobox");

  await selectOption(comboboxes[0]!, "张三 · 20260001 · 余额 100");
  fireEvent.change(within(dialog).getByLabelText("积分"), {
    target: { value: "5" },
  });
  fireEvent.change(within(dialog).getByLabelText("原因"), {
    target: { value: "活动补发积分" },
  });
}

describe("PointsPage", () => {
  beforeEach(() => {
    listPointRules.mockReset();
    listPointLedger.mockReset();
    updatePointRule.mockReset();
    adjustPoints.mockReset();
    listStudents.mockReset();
    emitToastMock.mockReset();

    listPointRules.mockResolvedValue([
      makeRule(),
      makeRule({
        id: 2,
        sourceType: "ECO_TASK",
        points: 0,
        frequencyLimit: null,
        frequencyPeriod: null,
      }),
    ]);
    listPointLedger.mockResolvedValue([makeLedger()]);
    listStudents.mockResolvedValue([makeStudent()]);
    updatePointRule.mockResolvedValue(makeRule());
    adjustPoints.mockResolvedValue(makeLedger({ deltaPoints: 5 }));
  });

  it("opens on rules and switches to the ledger tab", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "积分规则与流水" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("由任务配置决定")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "积分流水" }));

    expect(await screen.findByText("张三")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /人工调整/ }),
    ).toBeInTheDocument();
  });

  it("opens a rule drawer and refreshes rules after save", async () => {
    renderPage();

    await screen.findByText("养护打卡");
    fireEvent.click(screen.getAllByRole("button", { name: /编\s*辑/ })[0]!);

    const pointsInput = await screen.findByLabelText("每次积分");
    fireEvent.change(pointsInput, { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "保存规则" }));

    await waitFor(() => {
      expect(updatePointRule).toHaveBeenCalledWith("CARE_CHECKIN", {
        points: 12,
        frequencyLimit: 1,
        frequencyPeriod: "DAILY",
        enabled: true,
      });
    });
    await waitFor(() => expect(listPointRules).toHaveBeenCalledTimes(2));
  });

  it("refreshes ledger and students after a successful adjustment", async () => {
    renderPage();
    await screen.findByText("养护打卡");
    fireEvent.click(screen.getByRole("tab", { name: "积分流水" }));
    await screen.findByText("张三");

    fireEvent.click(screen.getByRole("button", { name: /人工调整/ }));
    await fillAdjustment();
    fireEvent.click(screen.getByRole("button", { name: "提交调整" }));
    fireEvent.click(await screen.findByRole("button", { name: "确认调整" }));

    await waitFor(() => {
      expect(adjustPoints).toHaveBeenCalled();
      expect(listPointLedger).toHaveBeenCalledTimes(2);
      expect(listStudents).toHaveBeenCalledTimes(2);
    });
    expect(emitToastMock).toHaveBeenCalledWith("success", "已调整 +5 积分");
  });
});
