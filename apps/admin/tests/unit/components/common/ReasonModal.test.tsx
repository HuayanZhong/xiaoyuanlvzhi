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
import ReasonModal from "@/components/common/ReasonModal";

function modalElement() {
  const element = document.querySelector(".ant-modal");

  if (!element) {
    throw new Error("modal not found");
  }

  return element as HTMLElement;
}

function renderModal(
  overrides: {
    onCancel?: () => void;
    onConfirm?: (reason: string) => void;
    saving?: boolean;
  } = {},
) {
  return render(
    <ConfigProvider locale={zhCN}>
      <ReasonModal
        onCancel={overrides.onCancel ?? vi.fn()}
        onConfirm={overrides.onConfirm ?? vi.fn()}
        open
        saving={overrides.saving}
        title="驳回养护凭证"
      />
    </ConfigProvider>,
  );
}

function typeReason(value: string) {
  fireEvent.change(screen.getByLabelText("原因"), { target: { value } });
}

async function submit() {
  fireEvent.click(
    within(modalElement()).getByRole("button", { name: /确\s*认/ }),
  );
}

describe("ReasonModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a non-empty reason", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "   " },
    });
    await submit();

    expect(await screen.findByText("请填写原因")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("rejects a reason shorter than five characters", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    typeReason("太短");
    await submit();

    expect(
      await screen.findByText("原因请填写 5 到 200 字"),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("rejects a reason longer than two hundred characters", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    typeReason("好".repeat(201));
    await submit();

    expect(
      await screen.findByText("原因请填写 5 到 200 字"),
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("trims the reason before confirming", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    typeReason("  照片不清晰，请重新上传  ");
    await submit();

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith("照片不清晰，请重新上传"),
    );
  });

  it("does not cancel while saving", () => {
    const onCancel = vi.fn();
    renderModal({ onCancel, saving: true });

    fireEvent.click(
      within(modalElement()).getByRole("button", { name: /取\s*消/ }),
    );

    expect(onCancel).not.toHaveBeenCalled();
  });
});
