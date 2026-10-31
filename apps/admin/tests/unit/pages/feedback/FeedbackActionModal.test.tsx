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
import FeedbackActionModal from "@/pages/feedback/FeedbackActionModal";
import { makeFeedback } from "./fixtures";

function renderModal(
  overrides: Partial<Parameters<typeof FeedbackActionModal>[0]> = {},
) {
  const props = {
    open: true,
    mode: "reply" as const,
    feedback: makeFeedback(),
    saving: false,
    error: null,
    onClose: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <FeedbackActionModal {...props} />
    </ConfigProvider>,
  );

  return props;
}

describe("FeedbackActionModal", () => {
  it("submits a trimmed reply", async () => {
    const props = renderModal();

    fireEvent.change(await screen.findByLabelText("回复内容"), {
      target: { value: "  已联系养护人员处理  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith("已联系养护人员处理"),
    );
  });

  it("rejects an empty reply", async () => {
    const props = renderModal();

    await screen.findByLabelText("回复内容");
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    expect(await screen.findByText("请填写回复内容")).toBeInTheDocument();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("rejects a reply shorter than five characters", async () => {
    const props = renderModal();

    fireEvent.change(await screen.findByLabelText("回复内容"), {
      target: { value: "abcd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    expect(await screen.findByText("回复内容至少 5 字")).toBeInTheDocument();
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("limits the reply length to 500 characters", async () => {
    renderModal();

    const input = await screen.findByLabelText("回复内容");

    expect(input).toHaveAttribute("maxlength", "500");
  });

  it("requires a second confirmation before closing", async () => {
    const props = renderModal({ mode: "close" });

    fireEvent.change(await screen.findByLabelText("关闭结论"), {
      target: { value: "问题已解决" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认关闭" }));

    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");

      if (!element) {
        throw new Error("popover not found");
      }

      return element as HTMLElement;
    });
    fireEvent.click(
      within(popover).getByRole("button", { name: "确认关闭反馈" }),
    );

    await waitFor(() =>
      expect(props.onConfirm).toHaveBeenCalledWith("问题已解决"),
    );
  });

  it("keeps the modal open and shows a server error", async () => {
    const props = renderModal({ error: "回复内容不合法" });

    expect(await screen.findByText("回复内容不合法")).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("submits only once when the button is clicked repeatedly", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    renderModal({ onConfirm });

    fireEvent.change(await screen.findByLabelText("回复内容"), {
      target: { value: "已经处理完成" },
    });
    const button = screen.getByRole("button", { name: "确认回复" });

    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));

    resolveSubmit?.();
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});
