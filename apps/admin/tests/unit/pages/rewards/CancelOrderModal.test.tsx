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
import * as rewardsApi from "@/api/rewards";
import { emitToast } from "@/lib/toast-events";
import CancelOrderModal from "@/pages/rewards/CancelOrderModal";
import { makeOrder } from "./fixtures";

vi.mock("@/api/rewards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/rewards")>();

  return {
    ...actual,
    cancelOrder: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const cancelOrder = vi.mocked(rewardsApi.cancelOrder);
const emitToastMock = vi.mocked(emitToast);

function renderModal(
  overrides: Partial<Parameters<typeof CancelOrderModal>[0]> = {},
) {
  const props = {
    open: true,
    order: makeOrder(),
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <CancelOrderModal {...props} />
    </ConfigProvider>,
  );

  return props;
}

async function confirmCancel() {
  fireEvent.click(screen.getByRole("button", { name: "确认取消" }));

  const popover = await waitFor(() => {
    const element = document.querySelector(".ant-popover");

    if (!element) {
      throw new Error("popover not found");
    }

    return element as HTMLElement;
  });
  fireEvent.click(
    within(popover).getByRole("button", { name: "确认取消订单" }),
  );
}

describe("CancelOrderModal", () => {
  beforeEach(() => {
    cancelOrder.mockReset();
    emitToastMock.mockReset();
    cancelOrder.mockResolvedValue(makeOrder({ status: "CANCELLED" }));
  });

  it("cancels with a trimmed reason", async () => {
    const props = renderModal();

    fireEvent.change(await screen.findByLabelText("取消原因"), {
      target: { value: "  库存盘点后无法发放  " },
    });
    await confirmCancel();

    await waitFor(() =>
      expect(cancelOrder).toHaveBeenCalledWith(5, {
        reason: "库存盘点后无法发放",
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "订单已取消，积分和库存已恢复",
    );
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("rejects an empty reason before calling the API", async () => {
    renderModal();

    await screen.findByLabelText("取消原因");
    await confirmCancel();

    expect(await screen.findByText("请填写取消原因")).toBeInTheDocument();
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it("rejects a reason shorter than five characters", async () => {
    renderModal();

    fireEvent.change(await screen.findByLabelText("取消原因"), {
      target: { value: "abcd" },
    });
    await confirmCancel();

    expect(await screen.findByText("取消原因至少 5 字")).toBeInTheDocument();
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it("keeps the modal open and maps a server validation error", async () => {
    cancelOrder.mockRejectedValue(
      new ApiError("INVALID_REQUEST", "原因不够长", 400),
    );
    const props = renderModal();

    fireEvent.change(await screen.findByLabelText("取消原因"), {
      target: { value: "库存盘点后无法发放" },
    });
    await confirmCancel();

    expect(await screen.findByText("原因不够长")).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onSaved).not.toHaveBeenCalled();
  });
});
