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
import * as feedbackApi from "@/api/feedback";
import { emitToast } from "@/lib/toast-events";
import FeedbackDetailDrawer from "@/pages/feedback/FeedbackDetailDrawer";
import { makeFeedback, makeFeedbackEvent, makeStudent } from "./fixtures";

vi.mock("@/api/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/feedback")>();

  return {
    ...actual,
    getFeedback: vi.fn(),
    startFeedback: vi.fn(),
    replyFeedback: vi.fn(),
    closeFeedback: vi.fn(),
  };
});

vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: () => ({
    url: "blob:image",
    loading: false,
    error: false,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const getFeedback = vi.mocked(feedbackApi.getFeedback);
const startFeedback = vi.mocked(feedbackApi.startFeedback);
const replyFeedback = vi.mocked(feedbackApi.replyFeedback);
const closeFeedback = vi.mocked(feedbackApi.closeFeedback);
const emitToastMock = vi.mocked(emitToast);

function renderDrawer(
  overrides: Partial<Parameters<typeof FeedbackDetailDrawer>[0]> = {},
) {
  const props = {
    open: true,
    feedbackId: 5,
    students: [makeStudent()],
    initialAction: null,
    onClose: vi.fn(),
    onChanged: vi.fn(),
    onActionConsumed: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <FeedbackDetailDrawer {...props} />
    </ConfigProvider>,
  );

  return props;
}

async function drawerFooter() {
  return waitFor(() => {
    const footer = document.querySelector(".ant-drawer-footer");

    if (!footer) {
      throw new Error("drawer footer not found");
    }

    return footer as HTMLElement;
  });
}

async function openReplyModal() {
  const footer = await drawerFooter();

  fireEvent.click(within(footer).getByRole("button", { name: /回\s*复/ }));
  return screen.findByLabelText("回复内容");
}

async function openCloseModal() {
  const footer = await drawerFooter();

  fireEvent.click(within(footer).getByRole("button", { name: /关\s*闭/ }));
  return screen.findByLabelText("关闭结论");
}

async function confirmClose() {
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
}

describe("FeedbackDetailDrawer", () => {
  beforeEach(() => {
    getFeedback.mockReset();
    startFeedback.mockReset();
    replyFeedback.mockReset();
    closeFeedback.mockReset();
    emitToastMock.mockReset();
    getFeedback.mockResolvedValue(makeFeedback());
    startFeedback.mockResolvedValue(makeFeedback({ status: "IN_PROGRESS" }));
    replyFeedback.mockResolvedValue(
      makeFeedback({
        status: "REPLIED",
        adminReply: "已联系养护人员处理",
        handlerEmail: "admin@qq.com",
        handledAt: "2026-10-30T11:00:00",
      }),
    );
    closeFeedback.mockResolvedValue(
      makeFeedback({ status: "CLOSED", handlerEmail: "admin@qq.com" }),
    );
  });

  it("renders detail fields, images and timeline", async () => {
    getFeedback.mockResolvedValue(
      makeFeedback({
        imageFileIds: [7],
        timeline: [
          makeFeedbackEvent(),
          makeFeedbackEvent({
            id: 2,
            actorId: 99,
            actorEmail: "admin@qq.com",
            fromStatus: "PENDING",
            toStatus: "IN_PROGRESS",
            message: "管理员开始处理",
            createdAt: "2026-10-30T11:00:00",
          }),
        ],
      }),
    );

    renderDrawer();

    expect(
      await screen.findByText("绿植叶片发黄，不知道如何处理"),
    ).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("20260001")).toBeInTheDocument();
    expect(screen.getByText("领养申请 #1")).toBeInTheDocument();
    expect(screen.getByAltText("反馈图片 7")).toHaveAttribute(
      "src",
      "blob:image",
    );
    expect(screen.getByText("学生提交反馈")).toBeInTheDocument();
    expect(screen.getByText("管理员开始处理")).toBeInTheDocument();
    expect(screen.getByText("暂无回复")).toBeInTheDocument();
  });

  it("starts handling and refreshes the detail", async () => {
    const props = renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "开始处理" }));

    await waitFor(() => expect(startFeedback).toHaveBeenCalledWith(5));
    expect(emitToastMock).toHaveBeenCalledWith("success", "已开始处理");
    expect(props.onChanged).toHaveBeenCalled();
    const footer = await drawerFooter();
    expect(
      within(footer).getByRole("button", { name: /关\s*闭/ }),
    ).toBeInTheDocument();
  });

  it("replies with a trimmed value", async () => {
    const props = renderDrawer();

    const input = await openReplyModal();
    fireEvent.change(input, {
      target: { value: "  已联系养护人员处理  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    await waitFor(() =>
      expect(replyFeedback).toHaveBeenCalledWith(5, {
        reply: "已联系养护人员处理",
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "回复成功，已通知学生",
    );
    expect(props.onChanged).toHaveBeenCalled();
    const body = document.querySelector(".ant-drawer-body") as HTMLElement;
    expect(within(body).getByText("已联系养护人员处理")).toBeInTheDocument();
    expect(screen.getAllByText("已回复").length).toBeGreaterThan(0);
  });

  it("closes after a second confirmation", async () => {
    getFeedback.mockResolvedValue(makeFeedback({ status: "IN_PROGRESS" }));
    const props = renderDrawer();

    const input = await openCloseModal();
    fireEvent.change(input, { target: { value: "问题已解决" } });
    await confirmClose();

    await waitFor(() =>
      expect(closeFeedback).toHaveBeenCalledWith(5, {
        conclusion: "问题已解决",
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "反馈已关闭");
    expect(props.onChanged).toHaveBeenCalled();
    expect(screen.getAllByText("已关闭").length).toBeGreaterThan(0);
  });

  it("rejects an empty reply without calling the API", async () => {
    renderDrawer();

    await openReplyModal();
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    expect(await screen.findByText("请填写回复内容")).toBeInTheDocument();
    expect(replyFeedback).not.toHaveBeenCalled();
  });

  it("keeps the reply modal open on a server validation error", async () => {
    replyFeedback.mockRejectedValue(
      new ApiError("INVALID_REQUEST", "回复内容不合法", 400),
    );
    renderDrawer();

    const input = await openReplyModal();
    fireEvent.change(input, { target: { value: "已经处理完成" } });
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    expect(await screen.findByText("回复内容不合法")).toBeInTheDocument();
    expect(input).toHaveValue("已经处理完成");
    expect(screen.getByLabelText("回复内容")).toBeInTheDocument();
  });

  it("refreshes when the feedback status changed", async () => {
    replyFeedback.mockRejectedValue(
      new ApiError("FEEDBACK_STATUS_INVALID", "状态已变化", 409),
    );
    const props = renderDrawer();

    const input = await openReplyModal();
    fireEvent.change(input, { target: { value: "已经处理完成" } });
    fireEvent.click(screen.getByRole("button", { name: "确认回复" }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "反馈状态已变化，请刷新后重试",
      ),
    );
    expect(getFeedback).toHaveBeenCalledTimes(2);
    expect(props.onChanged).toHaveBeenCalled();
  });

  it("shows a detail load failure and retries", async () => {
    getFeedback.mockRejectedValueOnce(new Error("network"));
    renderDrawer();

    expect(
      await screen.findByText("反馈详情加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(
      await screen.findByText("绿植叶片发黄，不知道如何处理"),
    ).toBeInTheDocument();
    expect(getFeedback).toHaveBeenCalledTimes(2);
  });

  it("opens the reply modal for a list action", async () => {
    const props = renderDrawer({ initialAction: "reply" });

    expect(await screen.findByText("回复反馈 FB-1A2B3C4D")).toBeInTheDocument();
    expect(props.onActionConsumed).toHaveBeenCalled();
  });
});
