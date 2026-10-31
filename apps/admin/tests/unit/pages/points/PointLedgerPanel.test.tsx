import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { describe, expect, it, vi } from "vitest";
import PointLedgerPanel from "@/pages/points/PointLedgerPanel";
import { makeLedger, makeStudent } from "./fixtures";

function renderPanel(
  overrides: Partial<Parameters<typeof PointLedgerPanel>[0]> = {},
) {
  const props = {
    ledger: [
      makeLedger(),
      makeLedger({
        id: 2,
        accountId: 3,
        studentEmail: "li@qq.com",
        deltaPoints: -5,
        balanceAfter: 95,
        sourceType: "ADJUSTMENT",
        actorEmail: null,
        reason: "人工扣减",
        createdAt: "2026-10-31T10:00:00",
      }),
    ],
    students: [
      makeStudent(),
      makeStudent({
        id: 3,
        email: "li@qq.com",
        fullName: "李四",
        studentNumber: "20260002",
        pointsBalance: 95,
      }),
    ],
    studentsFailed: false,
    loading: false,
    failed: false,
    onRetry: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <PointLedgerPanel {...props} />
    </ConfigProvider>,
  );

  return props;
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

describe("PointLedgerPanel", () => {
  it("sorts by time, joins students and renders signed deltas", () => {
    renderPanel();

    expect(tableRows()[0]).toHaveTextContent("李四");
    expect(screen.getByText("20260001")).toBeInTheDocument();
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("系统")).toBeInTheDocument();
  });

  it("filters by keyword and source, then resets", async () => {
    renderPanel();

    fireEvent.change(screen.getByPlaceholderText("学生姓名、学号或邮箱"), {
      target: { value: "李四" },
    });
    await selectOption(screen.getAllByRole("combobox")[0]!, "人工调整");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();
  });

  it("filters by direction and date range", async () => {
    renderPanel();

    await selectOption(screen.getAllByRole("combobox")[1]!, "支出");
    fireEvent.change(screen.getByLabelText("流水日期起"), {
      target: { value: "2026-10-31" },
    });
    fireEvent.change(screen.getByLabelText("流水日期止"), {
      target: { value: "2026-10-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
  });

  it("paginates ten rows at a time", () => {
    renderPanel({
      ledger: Array.from({ length: 12 }, (_, index) =>
        makeLedger({
          id: index + 1,
          accountId: 2,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00`,
        }),
      ),
    });

    expect(screen.getByText("共 12 条")).toBeInTheDocument();
    expect(tableRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(tableRows()).toHaveLength(2);
  });

  it("falls back to email and warns when the account directory fails", () => {
    renderPanel({
      ledger: [makeLedger({ accountId: 99, studentEmail: "missing@qq.com" })],
      students: [],
      studentsFailed: true,
    });

    expect(screen.getAllByText("missing@qq.com").length).toBeGreaterThan(0);
    expect(
      screen.getByText("账号资料暂不可用，学生列仅显示邮箱"),
    ).toBeInTheDocument();
  });

  it("shows empty and failure states", () => {
    renderPanel({ ledger: [] });
    expect(screen.getByText("暂无积分流水")).toBeInTheDocument();
  });

  it("shows a failure with retry", () => {
    const props = renderPanel({ failed: true });

    expect(
      screen.getByText("积分流水加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));
    expect(props.onRetry).toHaveBeenCalled();
  });
});
