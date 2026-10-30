import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as tasksApi from "@/api/tasks";
import TaskFormDrawer from "@/pages/tasks/TaskFormDrawer";
import { emitToast } from "@/lib/toast-events";

vi.mock("@/api/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tasks")>();

  return {
    ...actual,
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const createTask = vi.mocked(tasksApi.createTask);
const updateTask = vi.mocked(tasksApi.updateTask);
const emitToastMock = vi.mocked(emitToast);

function makeTask(overrides: Partial<tasksApi.AdminTaskView> = {}) {
  return {
    id: 1,
    title: "校园环保任务",
    coverFileId: null,
    details: "在食堂门口发放分类指引并拍照记录",
    startsAt: "2026-10-31T09:00:00",
    endsAt: "2026-11-30T18:00:00",
    maxParticipants: 20,
    participantCount: 0,
    approvedCount: 0,
    pointsPerPerson: 10,
    requireText: true,
    requirePhoto: false,
    status: "DRAFT",
    canEditRules: true,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  } satisfies tasksApi.AdminTaskView;
}

function renderDrawer(
  mode: "create" | "edit" | "copy" | "view",
  task: tasksApi.AdminTaskView | null = null,
) {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  render(
    <ConfigProvider locale={zhCN}>
      <TaskFormDrawer
        mode={mode}
        onClose={onClose}
        onSaved={onSaved}
        open
        task={task}
      />
    </ConfigProvider>,
  );

  return { onClose, onSaved };
}

function fillRequired() {
  fireEvent.change(screen.getByLabelText("标题"), {
    target: { value: "校园环保任务" },
  });
  fireEvent.change(screen.getByLabelText("任务说明"), {
    target: { value: "在食堂门口发放分类指引并拍照记录" },
  });
  fireEvent.change(screen.getByLabelText("开始时间"), {
    target: { value: "2026-10-31T09:00" },
  });
  fireEvent.change(screen.getByLabelText("结束时间"), {
    target: { value: "2026-11-30T18:00" },
  });
}

describe("TaskFormDrawer", () => {
  beforeEach(() => {
    createTask.mockReset();
    updateTask.mockReset();
    emitToastMock.mockReset();
    createTask.mockResolvedValue(makeTask());
    updateTask.mockResolvedValue(makeTask());
  });

  it("creates a draft with publish=false", async () => {
    const { onClose, onSaved } = renderDrawer("create");

    fillRequired();
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(createTask.mock.calls[0]![0]).toMatchObject({
      title: "校园环保任务",
      startsAt: "2026-10-31T09:00",
      endsAt: "2026-11-30T18:00",
      publish: false,
    });
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("creates a published task with publish=true", async () => {
    renderDrawer("create");

    fillRequired();
    fireEvent.click(screen.getByRole("button", { name: "立即发布" }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(createTask.mock.calls[0]![0]).toMatchObject({ publish: true });
  });

  it("locks time, capacity and points when participants exist", async () => {
    renderDrawer(
      "edit",
      makeTask({
        status: "ONGOING",
        participantCount: 1,
        canEditRules: false,
      }),
    );

    expect(screen.getByLabelText("开始时间")).toBeDisabled();
    expect(screen.getByLabelText("结束时间")).toBeDisabled();
    expect(screen.getByLabelText("人数上限")).toBeDisabled();
    expect(screen.getByLabelText("每人奖励积分")).toBeDisabled();
    expect(screen.getByText(/已有学生报名/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));
    expect(updateTask.mock.calls[0]![1]).toMatchObject({
      startsAt: "2026-10-31T09:00",
      endsAt: "2026-11-30T18:00",
      maxParticipants: 20,
      pointsPerPerson: 10,
    });
  });

  it("renders a stopped task as read-only", () => {
    renderDrawer("view", makeTask({ status: "STOPPED" }));

    expect(screen.getByLabelText("标题")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "保存修改" })).toBeNull();
    expect(screen.queryByRole("button", { name: "立即发布" })).toBeNull();
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });

  it("prefills copy values without times and saves a draft", async () => {
    renderDrawer("copy", makeTask({ status: "ONGOING" }));

    expect(screen.getByLabelText("标题")).toHaveValue("校园环保任务（副本）");
    expect(screen.getByLabelText("开始时间")).toHaveValue("");
    expect(screen.getByLabelText("结束时间")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("开始时间"), {
      target: { value: "2026-12-01T09:00" },
    });
    fireEvent.change(screen.getByLabelText("结束时间"), {
      target: { value: "2026-12-31T18:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(createTask.mock.calls[0]![0]).toMatchObject({
      title: "校园环保任务（副本）",
      publish: false,
    });
  });

  it("keeps values when saving fails", async () => {
    createTask.mockRejectedValue(
      new ApiError("TASK_TIME_INVALID", "结束时间必须晚于开始时间"),
    );
    renderDrawer("create");

    fillRequired();
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() => expect(emitToastMock).toHaveBeenCalled());
    expect(screen.getByLabelText("标题")).toHaveValue("校园环保任务");
    expect(screen.getByLabelText("任务说明")).toHaveValue(
      "在食堂门口发放分类指引并拍照记录",
    );
  });

  it("rejects invalid time before calling the API", async () => {
    renderDrawer("create");

    fillRequired();
    fireEvent.change(screen.getByLabelText("结束时间"), {
      target: { value: "2026-10-30T09:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() =>
      expect(screen.getByText("结束时间必须晚于开始时间")).toBeInTheDocument(),
    );
    expect(createTask).not.toHaveBeenCalled();
  });
});
