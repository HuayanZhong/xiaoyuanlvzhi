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
import { ApiError } from "@/api/client";
import * as feedbackApi from "@/api/feedback";
import { emitToast } from "@/lib/toast-events";
import FeedbackPage from "@/pages/feedback/FeedbackPage";
import { makeFeedback, makeStudent } from "./fixtures";

vi.mock("@/api/feedback", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/feedback")>();

  return {
    ...actual,
    listFeedback: vi.fn(),
    getFeedback: vi.fn(),
    startFeedback: vi.fn(),
    replyFeedback: vi.fn(),
    closeFeedback: vi.fn(),
  };
});

vi.mock("@/api/accounts", () => ({
  listStudents: vi.fn(),
}));

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

const listFeedback = vi.mocked(feedbackApi.listFeedback);
const getFeedback = vi.mocked(feedbackApi.getFeedback);
const startFeedback = vi.mocked(feedbackApi.startFeedback);
const listStudents = vi.mocked(accountsApi.listStudents);
const emitToastMock = vi.mocked(emitToast);

function renderPage(entry = "/feedback") {
  const router = createMemoryRouter(
    [{ path: "/feedback", element: <FeedbackPage /> }],
    { initialEntries: [entry] },
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

describe("FeedbackPage", () => {
  beforeEach(() => {
    listFeedback.mockReset();
    getFeedback.mockReset();
    startFeedback.mockReset();
    listStudents.mockReset();
    emitToastMock.mockReset();
    listFeedback.mockResolvedValue([makeFeedback()]);
    getFeedback.mockResolvedValue(makeFeedback());
    startFeedback.mockResolvedValue(makeFeedback({ status: "IN_PROGRESS" }));
    listStudents.mockResolvedValue([makeStudent()]);
  });

  it("renders feedback with student and status labels", async () => {
    listFeedback.mockResolvedValue([
      makeFeedback(),
      makeFeedback({
        id: 6,
        feedbackNo: "FB-5E6F7A8B",
        studentId: 3,
        studentEmail: "lisi@qq.com",
        type: "ACCOUNT_ISSUE",
        relatedType: null,
        relatedId: null,
        status: "CLOSED",
        createdAt: "2026-10-29T10:00:00",
      }),
    ]);
    listStudents.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        email: "lisi@qq.com",
        fullName: "李四",
        studentNumber: "20260002",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("FB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("20260001")).toBeInTheDocument();
    expect(screen.getByText("绿植问题")).toBeInTheDocument();
    expect(screen.getByText("领养申请 #1")).toBeInTheDocument();
    expect(screen.getByText("待处理")).toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.getByText("账号问题")).toBeInTheDocument();
    expect(screen.getByText("已关闭")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "开始处理" }),
    ).toBeInTheDocument();
  });

  it("filters by keyword, type, status and resets", async () => {
    listFeedback.mockResolvedValue([
      makeFeedback(),
      makeFeedback({
        id: 6,
        feedbackNo: "FB-5E6F7A8B",
        studentId: 3,
        type: "ACCOUNT_ISSUE",
        description: "账号无法登录",
        relatedType: null,
        relatedId: null,
        status: "CLOSED",
      }),
    ]);
    listStudents.mockResolvedValue([
      makeStudent(),
      makeStudent({ id: 3, fullName: "李四", studentNumber: "20260002" }),
    ]);

    renderPage();
    await screen.findByText("FB-1A2B3C4D");

    fireEvent.change(screen.getByPlaceholderText("编号、学生或描述"), {
      target: { value: "账号" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("FB-1A2B3C4D")).not.toBeInTheDocument();
    expect(screen.getByText("FB-5E6F7A8B")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    expect(screen.getByText("FB-1A2B3C4D")).toBeInTheDocument();

    const combos = screen.getAllByRole("combobox");

    await selectOption(combos[0]!, "账号问题");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("FB-1A2B3C4D")).not.toBeInTheDocument();
    expect(screen.getByText("FB-5E6F7A8B")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    await selectOption(combos[1]!, "待处理");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("FB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.queryByText("FB-5E6F7A8B")).not.toBeInTheDocument();
  });

  it("filters by submission date", async () => {
    listFeedback.mockResolvedValue([
      makeFeedback(),
      makeFeedback({
        id: 6,
        feedbackNo: "FB-5E6F7A8B",
        createdAt: "2026-10-29T10:00:00",
      }),
    ]);

    renderPage();
    await screen.findByText("FB-1A2B3C4D");

    fireEvent.change(screen.getByLabelText("提交日期起"), {
      target: { value: "2026-10-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("FB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.queryByText("FB-5E6F7A8B")).not.toBeInTheDocument();
  });

  it("reads the status deep link", async () => {
    listFeedback.mockResolvedValue([
      makeFeedback(),
      makeFeedback({
        id: 6,
        feedbackNo: "FB-5E6F7A8B",
        status: "CLOSED",
        createdAt: "2026-10-29T10:00:00",
      }),
    ]);

    renderPage("/feedback?status=PENDING");

    expect(await screen.findByText("FB-1A2B3C4D")).toBeInTheDocument();
    expect(screen.queryByText("FB-5E6F7A8B")).not.toBeInTheDocument();
  });

  it("paginates ten feedback at a time", async () => {
    listFeedback.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeFeedback({
          id: index + 1,
          feedbackNo: `FB-${String(index + 1).padStart(8, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("FB-00000012");

    expect(screen.getByText("共 12 条")).toBeInTheDocument();
    expect(tableRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(tableRows()).toHaveLength(2);
  });

  it("returns to the first page after filtering", async () => {
    listFeedback.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeFeedback({
          id: index + 1,
          feedbackNo: `FB-${String(index + 1).padStart(8, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("FB-00000012");
    fireEvent.click(screen.getByTitle("2"));
    expect(tableRows()).toHaveLength(2);

    fireEvent.change(screen.getByPlaceholderText("编号、学生或描述"), {
      target: { value: "FB-00000001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(tableRows()).toHaveLength(1);
    expect(screen.getByText("FB-00000001")).toBeInTheDocument();
  });

  it("shows an empty state and refreshes", async () => {
    listFeedback.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无问题反馈")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /刷\s*新/ }));

    expect(listFeedback).toHaveBeenCalledTimes(2);
  });

  it("shows a load failure and keeps the filters", async () => {
    listFeedback.mockReset();
    listFeedback
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeFeedback()]);

    renderPage();

    expect(
      await screen.findByText("问题反馈加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("编号、学生或描述")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("FB-1A2B3C4D")).toBeInTheDocument();
  });

  it("falls back to email when the student directory fails", async () => {
    listStudents.mockRejectedValue(new Error("network"));
    listFeedback.mockResolvedValue([
      makeFeedback({ studentEmail: "fallback@qq.com" }),
    ]);

    renderPage();

    expect(await screen.findByText("FB-1A2B3C4D")).toBeInTheDocument();
    expect(
      screen.getByText("学生资料暂不可用，学生列仅显示邮箱"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("fallback@qq.com").length).toBeGreaterThan(0);
  });

  it("starts handling from the list", async () => {
    renderPage();
    await screen.findByText("FB-1A2B3C4D");

    fireEvent.click(screen.getByRole("button", { name: "开始处理" }));

    await waitFor(() => expect(startFeedback).toHaveBeenCalledWith(5));
    expect(emitToastMock).toHaveBeenCalledWith("success", "已开始处理");
    expect(listFeedback).toHaveBeenCalledTimes(2);
  });

  it("refreshes when starting a stale feedback", async () => {
    startFeedback.mockRejectedValue(
      new ApiError("FEEDBACK_STATUS_INVALID", "状态已变化", 409),
    );
    renderPage();
    await screen.findByText("FB-1A2B3C4D");

    fireEvent.click(screen.getByRole("button", { name: "开始处理" }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "反馈状态已变化，请刷新后重试",
      ),
    );
    expect(listFeedback).toHaveBeenCalledTimes(2);
  });

  it("opens the reply modal from the list", async () => {
    renderPage();
    await screen.findByText("FB-1A2B3C4D");

    fireEvent.click(screen.getByRole("button", { name: /回\s*复/ }));

    expect(await screen.findByLabelText("回复内容")).toBeInTheDocument();
    expect(getFeedback).toHaveBeenCalledWith(5);
  });
});
