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
import * as tasksApi from "@/api/tasks";
import TaskReviewDrawer from "@/pages/tasks/TaskReviewDrawer";
import { emitToast } from "@/lib/toast-events";

vi.mock("@/api/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tasks")>();

  return {
    ...actual,
    getTaskParticipation: vi.fn(),
    listTaskEvents: vi.fn(),
    approveTaskParticipation: vi.fn(),
    rejectTaskParticipation: vi.fn(),
  };
});

vi.mock("@/components/common/AuthenticatedImage", () => ({
  default: ({ fileId, alt }: { fileId: number; alt: string }) => (
    <img alt={alt} src={`/files/${fileId}`} />
  ),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const getTaskParticipation = vi.mocked(tasksApi.getTaskParticipation);
const listTaskEvents = vi.mocked(tasksApi.listTaskEvents);
const approveTaskParticipation = vi.mocked(tasksApi.approveTaskParticipation);
const rejectTaskParticipation = vi.mocked(tasksApi.rejectTaskParticipation);
const emitToastMock = vi.mocked(emitToast);

function makeSubmission(
  overrides: Partial<tasksApi.AdminSubmissionView> = {},
): tasksApi.AdminSubmissionView {
  return {
    id: 11,
    version: 1,
    note: "完成宣传并拍照",
    imageFileIds: [7],
    status: "PENDING_REVIEW",
    reviewReason: null,
    reviewerName: null,
    reviewerEmail: null,
    submittedAt: "2026-10-31T09:30:00",
    reviewedAt: null,
    awardedPoints: null,
    ...overrides,
  };
}

function makeParticipation(
  overrides: Partial<tasksApi.AdminParticipationView> = {},
): tasksApi.AdminParticipationView {
  const submissions = overrides.submissions ?? [makeSubmission()];

  return {
    id: 5,
    taskId: 1,
    taskTitle: "校园环保任务",
    taskStatus: "ONGOING",
    taskStartsAt: "2026-10-31T09:00:00",
    taskEndsAt: "2026-11-30T18:00:00",
    pointsPerPerson: 10,
    studentId: 2,
    studentName: "张三",
    studentNumber: "20240001",
    studentEmail: "student@qq.com",
    studentStatus: "ACTIVE",
    status: "PENDING_REVIEW",
    joinedAt: "2026-10-31T09:10:00",
    latestVersion: 1,
    latestSubmittedAt: "2026-10-31T09:30:00",
    latestNote: "完成宣传并拍照",
    hasEvidence: true,
    awardedPoints: null,
    submissions,
    ...overrides,
  };
}

function makeEvent(
  overrides: Partial<tasksApi.TaskEventView> = {},
): tasksApi.TaskEventView {
  return {
    id: 1,
    action: "TASK_APPROVE",
    fromStatus: "PENDING_REVIEW",
    toStatus: "APPROVED",
    reason: null,
    actorName: "管理员",
    actorEmail: "admin@campus.local",
    createdAt: "2026-10-31T10:00:00",
    ...overrides,
  };
}

function renderDrawer() {
  const onClose = vi.fn();
  const onChanged = vi.fn();

  render(
    <ConfigProvider locale={zhCN}>
      <TaskReviewDrawer
        onChanged={onChanged}
        onClose={onClose}
        participationId={5}
      />
    </ConfigProvider>,
  );

  return { onClose, onChanged };
}

async function confirmPopover(label: string) {
  const popover = await waitFor(() => {
    const candidates = Array.from(
      document.querySelectorAll(".ant-popover"),
    ).filter((element) => !element.classList.contains("ant-popover-hidden"));
    const last = candidates.at(-1);

    if (!last) {
      throw new Error("popover not found");
    }

    return last as HTMLElement;
  });

  fireEvent.click(within(popover).getByRole("button", { name: label }));
}

describe("TaskReviewDrawer", () => {
  beforeEach(() => {
    getTaskParticipation.mockReset();
    listTaskEvents.mockReset();
    approveTaskParticipation.mockReset();
    rejectTaskParticipation.mockReset();
    emitToastMock.mockReset();

    getTaskParticipation.mockResolvedValue(makeParticipation());
    listTaskEvents.mockResolvedValue([]);
    approveTaskParticipation.mockResolvedValue(
      makeParticipation({
        status: "APPROVED",
        awardedPoints: 10,
        submissions: [
          makeSubmission({
            status: "APPROVED",
            reviewerName: "管理员",
            reviewedAt: "2026-10-31T10:00:00",
            awardedPoints: 10,
          }),
        ],
      }),
    );
    rejectTaskParticipation.mockResolvedValue(
      makeParticipation({
        status: "REJECTED",
        submissions: [
          makeSubmission({
            status: "REJECTED",
            reviewReason: "照片不清晰，请重新上传",
            reviewerName: "管理员",
            reviewedAt: "2026-10-31T10:00:00",
          }),
        ],
      }),
    );
  });

  it("loads detail and events and enables approve/reject for pending evidence", async () => {
    listTaskEvents.mockResolvedValue([makeEvent()]);
    renderDrawer();

    expect(await screen.findByText("最新凭证")).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getAllByText("完成宣传并拍照").length).toBeGreaterThan(0);
    expect(screen.getByText("审核记录")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /通\s*过/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /驳\s*回/ })).toBeEnabled();
  });

  it("approves after confirmation and refreshes events", async () => {
    const { onChanged } = renderDrawer();
    await screen.findByText("最新凭证");

    fireEvent.click(screen.getByRole("button", { name: /通\s*过/ }));
    await confirmPopover("确认通过");

    await waitFor(() =>
      expect(approveTaskParticipation).toHaveBeenCalledWith(5),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "已通过，发放 10 积分",
    );
    expect(onChanged).toHaveBeenCalled();
  });

  it("rejects with a trimmed reason", async () => {
    renderDrawer();
    await screen.findByText("最新凭证");

    fireEvent.click(screen.getByRole("button", { name: /驳\s*回/ }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "  照片不清晰，请重新上传  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认驳回" }));

    await waitFor(() =>
      expect(rejectTaskParticipation).toHaveBeenCalledWith(
        5,
        "照片不清晰，请重新上传",
      ),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "已驳回，已通知学生补充凭证",
    );
  });

  it("disables approve when evidence is missing but keeps reject", async () => {
    getTaskParticipation.mockResolvedValue(
      makeParticipation({ hasEvidence: false }),
    );
    renderDrawer();

    expect(await screen.findByText("证据")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /通\s*过/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /驳\s*回/ })).toBeEnabled();
  });

  it("shows an approved record as read-only", async () => {
    getTaskParticipation.mockResolvedValue(
      makeParticipation({
        status: "APPROVED",
        awardedPoints: 10,
        submissions: [
          makeSubmission({
            status: "APPROVED",
            reviewerName: "管理员",
            reviewedAt: "2026-10-31T10:00:00",
            awardedPoints: 10,
          }),
        ],
      }),
    );
    renderDrawer();

    expect(await screen.findByText("最新凭证")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /通\s*过/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /驳\s*回/ })).toBeNull();
  });

  it("refreshes detail and list after a status conflict", async () => {
    approveTaskParticipation.mockRejectedValue(
      new ApiError(
        "TASK_PARTICIPATION_STATUS_INVALID",
        "参与记录状态已变化，请刷新后重试",
      ),
    );
    const { onChanged } = renderDrawer();
    await screen.findByText("最新凭证");

    fireEvent.click(screen.getByRole("button", { name: /通\s*过/ }));
    await confirmPopover("确认通过");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "记录已被处理，已刷新最新状态",
      ),
    );
    expect(onChanged).toHaveBeenCalled();
    expect(getTaskParticipation).toHaveBeenCalledTimes(2);
  });

  it("keeps detail visible when events fail", async () => {
    listTaskEvents.mockRejectedValue(new Error("events failed"));
    renderDrawer();

    expect(await screen.findByText("最新凭证")).toBeInTheDocument();
    expect(await screen.findByText("审核记录加载失败")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重\s*试/ })).toBeInTheDocument();
  });

  it("shows a retry state when detail fails", async () => {
    getTaskParticipation.mockRejectedValue(new Error("detail failed"));
    renderDrawer();

    expect(
      await screen.findByText("详情加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重\s*试/ })).toBeInTheDocument();
  });
});
