import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AdminParticipationView, AdminTaskView } from "@/api/tasks";
import TaskReviewPanel, {
  DEFAULT_REVIEW_FILTERS,
  type TaskReviewFilters,
} from "@/pages/tasks/TaskReviewPanel";

function makeTask(overrides: Partial<AdminTaskView> = {}): AdminTaskView {
  return {
    id: 1,
    title: "校园环保任务",
    coverFileId: null,
    details: "完成宣传",
    startsAt: "2026-10-31T09:00:00",
    endsAt: "2026-11-30T18:00:00",
    maxParticipants: 20,
    participantCount: 0,
    approvedCount: 0,
    pointsPerPerson: 10,
    requireText: true,
    requirePhoto: false,
    status: "ONGOING",
    canEditRules: true,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
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
    submissions: [],
    ...overrides,
  };
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

function tableRows() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(".ant-table-tbody tr.ant-table-row"),
  );
}

const DEFAULT_TASKS = [makeTask(), makeTask({ id: 2, title: "二手书回收" })];

function Harness({
  items,
  tasks = DEFAULT_TASKS,
  failed = false,
}: {
  items: AdminParticipationView[];
  tasks?: AdminTaskView[];
  failed?: boolean;
}) {
  const [filters, setFilters] = useState<TaskReviewFilters>(
    DEFAULT_REVIEW_FILTERS,
  );
  const [applied, setApplied] = useState<TaskReviewFilters>(
    DEFAULT_REVIEW_FILTERS,
  );
  const [page, setPage] = useState(1);

  return (
    <TaskReviewPanel
      appliedFilters={applied}
      failed={failed}
      filters={filters}
      loading={false}
      onChangeFilters={setFilters}
      onOpen={vi.fn()}
      onPageChange={setPage}
      onReset={() => {
        setFilters(DEFAULT_REVIEW_FILTERS);
        setApplied(DEFAULT_REVIEW_FILTERS);
        setPage(1);
      }}
      onRetry={vi.fn()}
      onSearch={() => {
        setApplied(filters);
        setPage(1);
      }}
      page={page}
      participations={items}
      tasks={tasks}
    />
  );
}

function renderPanel(
  items: AdminParticipationView[],
  tasks?: AdminTaskView[],
  failed = false,
) {
  return render(
    <ConfigProvider locale={zhCN}>
      <Harness failed={failed} items={items} tasks={tasks} />
    </ConfigProvider>,
  );
}

describe("TaskReviewPanel", () => {
  it("defaults to pending participations", () => {
    renderPanel([
      makeParticipation({ id: 1, status: "PENDING_REVIEW" }),
      makeParticipation({
        id: 2,
        studentName: "李四",
        status: "APPROVED",
        awardedPoints: 10,
      }),
    ]);

    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.queryByText("李四")).not.toBeInTheDocument();
  });

  it("filters by status after clicking query", async () => {
    renderPanel([
      makeParticipation({ id: 1, status: "PENDING_REVIEW" }),
      makeParticipation({
        id: 2,
        studentName: "李四",
        status: "APPROVED",
        awardedPoints: 10,
      }),
    ]);

    await selectOption(screen.getAllByRole("combobox")[1]!, "已通过");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("张三")).not.toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.getByText("10 分")).toBeInTheDocument();
  });

  it("filters by task and keyword", async () => {
    renderPanel(
      [
        makeParticipation({ id: 1, taskTitle: "校园环保任务" }),
        makeParticipation({
          id: 2,
          taskId: 2,
          taskTitle: "二手书回收",
          studentName: "李四",
        }),
      ],
      [makeTask(), makeTask({ id: 2, title: "二手书回收" })],
    );

    await selectOption(screen.getAllByRole("combobox")[0]!, "二手书回收");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("张三")).not.toBeInTheDocument();
    expect(screen.getByText("李四")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("任务标题、学生姓名、学号或邮箱"),
      { target: { value: "不存在" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("没有符合筛选条件的参与记录")).toBeInTheDocument();
  });

  it("paginates ten rows per page", () => {
    renderPanel(
      Array.from({ length: 12 }, (_, index) =>
        makeParticipation({
          id: index + 1,
          studentName: `学生${index + 1}`,
          joinedAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    expect(tableRows()).toHaveLength(10);
    expect(screen.getByText("学生12")).toBeInTheDocument();
    expect(screen.queryByText("学生2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(screen.getByText("学生2")).toBeInTheDocument();
    expect(screen.getByText("学生1")).toBeInTheDocument();
  });

  it("shows empty and failure states", () => {
    const { unmount } = renderPanel([]);

    expect(screen.getByText("暂无任务报名记录")).toBeInTheDocument();
    unmount();

    renderPanel([], undefined, true);

    expect(
      screen.getByText("任务参与记录加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /重\s*试/ })).toBeInTheDocument();
  });
});
