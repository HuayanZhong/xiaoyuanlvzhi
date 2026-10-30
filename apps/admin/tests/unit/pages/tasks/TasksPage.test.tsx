import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AdminParticipationView,
  AdminSubmissionView,
  AdminTaskView,
} from "@/api/tasks";
import * as tasksApi from "@/api/tasks";
import { ApiError } from "@/api/client";
import { emitToast } from "@/lib/toast-events";
import TasksPage from "@/pages/tasks/TasksPage";

vi.mock("@/api/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tasks")>();

  return {
    ...actual,
    listTasks: vi.fn(),
    listTaskParticipations: vi.fn(),
    getTaskParticipation: vi.fn(),
    listTaskEvents: vi.fn(),
    stopTask: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    approveTaskParticipation: vi.fn(),
    rejectTaskParticipation: vi.fn(),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/components/common/AuthenticatedImage", () => ({
  default: ({ fileId, alt }: { fileId: number; alt: string }) => (
    <img alt={alt} src={`/files/${fileId}`} />
  ),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listTasks = vi.mocked(tasksApi.listTasks);
const listTaskParticipations = vi.mocked(tasksApi.listTaskParticipations);
const getTaskParticipation = vi.mocked(tasksApi.getTaskParticipation);
const listTaskEvents = vi.mocked(tasksApi.listTaskEvents);
const stopTask = vi.mocked(tasksApi.stopTask);
const emitToastMock = vi.mocked(emitToast);

function makeTask(overrides: Partial<AdminTaskView> = {}): AdminTaskView {
  return {
    id: 1,
    title: "校园环保任务",
    coverFileId: null,
    details: "完成宣传",
    startsAt: "2026-10-31T09:00:00",
    endsAt: "2026-11-30T18:00:00",
    maxParticipants: 20,
    participantCount: 2,
    approvedCount: 1,
    pointsPerPerson: 10,
    requireText: true,
    requirePhoto: false,
    status: "ONGOING",
    canEditRules: false,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  };
}

function makeSubmission(
  overrides: Partial<AdminSubmissionView> = {},
): AdminSubmissionView {
  return {
    id: 11,
    version: 1,
    note: "完成宣传",
    imageFileIds: [],
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
  overrides: Partial<AdminParticipationView> = {},
): AdminParticipationView {
  return {
    id: 1,
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
    latestNote: "完成宣传",
    hasEvidence: true,
    awardedPoints: null,
    submissions: [makeSubmission()],
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderPage(initialEntry = "/tasks") {
  const router = createMemoryRouter(
    [
      {
        path: "/tasks",
        element: (
          <>
            <TasksPage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

function rowOf(text: string) {
  const row = screen.getByText(text).closest("tr");

  if (!row) {
    throw new Error(`row for ${text} not found`);
  }

  return row as HTMLElement;
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

describe("TasksPage", () => {
  beforeEach(() => {
    listTasks.mockReset();
    listTaskParticipations.mockReset();
    getTaskParticipation.mockReset();
    listTaskEvents.mockReset();
    stopTask.mockReset();
    emitToastMock.mockReset();

    listTasks.mockResolvedValue([makeTask()]);
    listTaskParticipations.mockResolvedValue([makeParticipation()]);
    getTaskParticipation.mockResolvedValue(makeParticipation());
    listTaskEvents.mockResolvedValue([]);
  });

  it("renders task rows sorted by creation time with pagination", async () => {
    listTasks.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeTask({
          id: index + 1,
          title: `任务${index + 1}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();

    expect(await screen.findByText("任务12")).toBeInTheDocument();
    expect(tableRows()[0]).toHaveTextContent("任务12");
    expect(screen.getByText("共 12 条")).toBeInTheDocument();
    expect(screen.queryByText("任务2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("任务2")).toBeInTheDocument();
    expect(screen.getByText("任务1")).toBeInTheDocument();
  });

  it("filters by keyword, status and open date then resets", async () => {
    listTasks.mockResolvedValue([
      makeTask({
        id: 1,
        title: "校园环保任务",
        startsAt: "2026-10-31T09:00:00",
      }),
      makeTask({
        id: 2,
        title: "二手书回收",
        status: "STOPPED",
        startsAt: "2026-10-29T09:00:00",
      }),
    ]);

    renderPage();
    await screen.findByText("校园环保任务");

    fireEvent.change(screen.getByPlaceholderText("任务标题"), {
      target: { value: "二手" },
    });
    await selectOption(screen.getAllByRole("combobox")[0]!, "已停用");
    fireEvent.change(screen.getByLabelText("开放日期起"), {
      target: { value: "2026-10-29" },
    });
    fireEvent.change(screen.getByLabelText("开放日期止"), {
      target: { value: "2026-10-29" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("校园环保任务")).not.toBeInTheDocument();
    expect(screen.getByText("二手书回收")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("校园环保任务")).toBeInTheDocument();
    expect(screen.getByText("二手书回收")).toBeInTheDocument();
  });

  it("shows actions according to task status", async () => {
    listTasks.mockResolvedValue([
      makeTask({ id: 1, title: "进行中任务", status: "ONGOING" }),
      makeTask({
        id: 2,
        title: "草稿任务",
        status: "DRAFT",
        canEditRules: true,
      }),
      makeTask({
        id: 3,
        title: "停用任务",
        status: "STOPPED",
        canEditRules: false,
      }),
    ]);

    renderPage();
    await screen.findByText("进行中任务");

    const ongoing = rowOf("进行中任务");
    expect(
      within(ongoing).getByRole("button", { name: /编\s*辑/ }),
    ).toBeInTheDocument();
    expect(
      within(ongoing).getByRole("button", { name: /停\s*用/ }),
    ).toBeInTheDocument();

    const draft = rowOf("草稿任务");
    expect(
      within(draft).getByRole("button", { name: /编\s*辑/ }),
    ).toBeInTheDocument();
    expect(within(draft).queryByRole("button", { name: /停\s*用/ })).toBeNull();

    const stopped = rowOf("停用任务");
    expect(
      within(stopped).getByRole("button", { name: /^查\s*看$/ }),
    ).toBeInTheDocument();
    expect(
      within(stopped).queryByRole("button", { name: /^编\s*辑$/ }),
    ).toBeNull();
    expect(
      within(stopped).queryByRole("button", { name: /^停\s*用$/ }),
    ).toBeNull();
  });

  it("stops a task after confirmation and refreshes the list", async () => {
    renderPage();
    await screen.findByText("校园环保任务");

    fireEvent.click(
      within(rowOf("校园环保任务")).getByRole("button", { name: /停\s*用/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /确认停用/ }));

    await waitFor(() => expect(stopTask).toHaveBeenCalledWith(1));
    await waitFor(() => expect(listTasks).toHaveBeenCalledTimes(2));
    expect(emitToastMock).toHaveBeenCalledWith("success", "任务已停用");
  });

  it("shows a conflict toast when stopping an already processed task", async () => {
    stopTask.mockRejectedValue(
      new ApiError("TASK_STATUS_INVALID", "只有已发布任务可以停用"),
    );
    renderPage();
    await screen.findByText("校园环保任务");

    fireEvent.click(
      within(rowOf("校园环保任务")).getByRole("button", { name: /停\s*用/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /确认停用/ }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "任务状态已变化，已刷新最新状态",
      ),
    );
  });

  it("applies the review tab and an approved status from the URL", async () => {
    listTaskParticipations.mockResolvedValue([
      makeParticipation({ id: 1, status: "PENDING_REVIEW" }),
      makeParticipation({
        id: 2,
        studentName: "李四",
        status: "APPROVED",
        awardedPoints: 10,
      }),
    ]);

    renderPage("/tasks?tab=review&status=APPROVED");

    expect(await screen.findByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
  });

  it("ignores an invalid review status and defaults to pending", async () => {
    listTaskParticipations.mockResolvedValue([
      makeParticipation({ id: 1, status: "PENDING_REVIEW" }),
      makeParticipation({
        id: 2,
        studentName: "李四",
        status: "APPROVED",
      }),
    ]);

    renderPage("/tasks?tab=review&status=NOPE");

    expect(await screen.findByText("张三")).toBeInTheDocument();
    expect(screen.queryByText("李四")).not.toBeInTheDocument();
  });

  it("switches to review and filters by task from the config tab", async () => {
    listTasks.mockResolvedValue([
      makeTask({ id: 1, title: "校园环保任务" }),
      makeTask({ id: 2, title: "二手书回收" }),
    ]);
    listTaskParticipations.mockResolvedValue([
      makeParticipation({ id: 1, taskId: 1, taskTitle: "校园环保任务" }),
      makeParticipation({
        id: 2,
        taskId: 2,
        taskTitle: "二手书回收",
        studentName: "李四",
      }),
    ]);

    renderPage();
    await screen.findByText("校园环保任务");

    fireEvent.click(
      within(rowOf("校园环保任务")).getByRole("button", {
        name: "查看报名",
      }),
    );

    expect(await screen.findByText("张三")).toBeInTheDocument();
    expect(screen.queryByText("李四")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("tab=review");
    expect(screen.getByTestId("location")).toHaveTextContent("taskId=1");
  });

  it("opens the create and edit form drawers", async () => {
    renderPage();
    await screen.findByText("校园环保任务");

    fireEvent.click(screen.getByRole("button", { name: /新建任务/ }));
    await waitFor(() =>
      expect(document.querySelector(".ant-drawer-title")).toHaveTextContent(
        "新建任务",
      ),
    );
  });

  it("opens the stopped task in read-only view", async () => {
    listTasks.mockResolvedValue([
      makeTask({ id: 1, title: "停用任务", status: "STOPPED" }),
    ]);

    renderPage();
    await screen.findByText("停用任务");

    fireEvent.click(
      within(rowOf("停用任务")).getByRole("button", { name: /^查\s*看$/ }),
    );

    expect(await screen.findByText("任务详情")).toBeInTheDocument();
    expect(screen.getByLabelText("标题")).toBeDisabled();
  });

  it("opens the review drawer from the review tab", async () => {
    renderPage("/tasks?tab=review");
    await screen.findByText("张三");

    fireEvent.click(
      within(rowOf("张三")).getByRole("button", { name: /^查\s*看$/ }),
    );

    expect(await screen.findByText("最新凭证")).toBeInTheDocument();
    expect(getTaskParticipation).toHaveBeenCalledWith(1);
  });

  it("shows a config failure and retries", async () => {
    listTasks
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue([makeTask()]);

    renderPage();

    expect(
      await screen.findByText("任务列表加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("校园环保任务")).toBeInTheDocument();
  });

  it("shows a review failure", async () => {
    listTaskParticipations.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "网络错误"),
    );

    renderPage("/tasks?tab=review");

    expect(
      await screen.findByText("任务参与记录加载失败，请稍后重试"),
    ).toBeInTheDocument();
  });
});
