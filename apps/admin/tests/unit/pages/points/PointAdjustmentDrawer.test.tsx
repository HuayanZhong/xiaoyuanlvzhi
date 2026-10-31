import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as pointsApi from "@/api/points";
import { emitToast } from "@/lib/toast-events";
import PointAdjustmentDrawer from "@/pages/points/PointAdjustmentDrawer";
import { makeLedger, makeStudent } from "./fixtures";

vi.mock("@/api/points", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/points")>();

  return {
    ...actual,
    adjustPoints: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const adjustPoints = vi.mocked(pointsApi.adjustPoints);
const emitToastMock = vi.mocked(emitToast);

function renderDrawer(
  overrides: Partial<Parameters<typeof PointAdjustmentDrawer>[0]> = {},
) {
  const props = {
    open: true,
    students: [makeStudent()],
    studentsLoading: false,
    studentsFailed: false,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <PointAdjustmentDrawer {...props} />
    </ConfigProvider>,
  );

  return props;
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

  const option = within(dropdown).getByText(label);
  fireEvent.click(option.closest(".ant-select-item-option") ?? option);
}

async function fillAdjustment(amount = "5") {
  await selectOption(
    screen.getAllByRole("combobox")[0]!,
    "张三 · 20260001 · 余额 100",
  );
  fireEvent.change(screen.getByLabelText("积分"), {
    target: { value: amount },
  });
  fireEvent.change(screen.getByLabelText("原因"), {
    target: { value: "活动补发积分" },
  });
}

async function confirmSubmit() {
  fireEvent.click(screen.getByRole("button", { name: "提交调整" }));
  const confirmButton = await screen.findByRole("button", {
    name: "确认调整",
  });
  fireEvent.click(confirmButton);
}

describe("PointAdjustmentDrawer", () => {
  beforeEach(() => {
    adjustPoints.mockReset();
    emitToastMock.mockReset();
    adjustPoints.mockResolvedValue(
      makeLedger({ deltaPoints: 5, balanceAfter: 105 }),
    );
  });

  it("previews and submits an increase with a request id", async () => {
    const props = renderDrawer();

    await fillAdjustment();

    expect(screen.getByText("调整后余额：105 分")).toBeInTheDocument();
    await confirmSubmit();

    await waitFor(() => {
      expect(adjustPoints).toHaveBeenCalledWith({
        accountId: 2,
        deltaPoints: 5,
        reason: "活动补发积分",
        requestId: expect.any(String),
      });
    });
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    expect(emitToastMock).toHaveBeenCalledWith("success", "已调整 +5 积分");
  });

  it("blocks a deduction that would make the balance negative", async () => {
    renderDrawer();

    await selectOption(
      screen.getAllByRole("combobox")[0]!,
      "张三 · 20260001 · 余额 100",
    );
    await selectOption(screen.getAllByRole("combobox")[1]!, "扣减");
    fireEvent.change(screen.getByLabelText("积分"), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "活动扣减积分" },
    });

    expect(screen.getByText("调整后余额不能为负")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交调整" })).toBeDisabled();
  });

  it("keeps the drawer open and maps a missing student", async () => {
    adjustPoints.mockRejectedValue(
      new ApiError("STUDENT_NOT_FOUND", "学生不存在"),
    );
    const props = renderDrawer();

    await fillAdjustment();
    await confirmSubmit();

    await waitFor(() => {
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "学生不存在或已变更，请刷新后重试",
      );
    });
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not submit twice while saving", async () => {
    let resolveRequest: ((value: unknown) => void) | undefined;
    adjustPoints.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }) as never,
    );
    renderDrawer();

    await fillAdjustment();
    fireEvent.click(screen.getByRole("button", { name: "提交调整" }));
    const confirmButton = await screen.findByRole("button", {
      name: "确认调整",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adjustPoints).toHaveBeenCalledTimes(1);
    });

    resolveRequest?.(makeLedger({ deltaPoints: 5, balanceAfter: 105 }));
  });

  it("shows the directory warning and disables submission", () => {
    renderDrawer({ students: [], studentsFailed: true });

    expect(
      screen.getByText("账号资料暂不可用，暂时无法选择学生"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交调整" })).toBeDisabled();
  });
});
