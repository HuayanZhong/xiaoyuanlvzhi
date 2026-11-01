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
import { emitToast } from "@/lib/toast-events";
import StudentsPage from "@/pages/students/StudentsPage";
import { makeAdoptionHistory, makeHistory, makeStudent } from "./fixtures";

vi.mock("@/api/accounts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/accounts")>();

  return {
    ...actual,
    listStudentRecords: vi.fn(),
    getStudent: vi.fn(),
    getStudentHistory: vi.fn(),
    disableStudent: vi.fn(),
    enableStudent: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listStudentRecords = vi.mocked(accountsApi.listStudentRecords);
const getStudent = vi.mocked(accountsApi.getStudent);
const getStudentHistory = vi.mocked(accountsApi.getStudentHistory);
const disableStudent = vi.mocked(accountsApi.disableStudent);
const emitToastMock = vi.mocked(emitToast);

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/students", element: <StudentsPage /> }],
    { initialEntries: ["/students"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

function listRows() {
  const body = document.querySelector(".ant-table-tbody");
  return Array.from(
    body?.querySelectorAll<HTMLElement>("tr.ant-table-row") ?? [],
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

function comboboxes() {
  return screen.getAllByRole("combobox");
}

describe("StudentsPage", () => {
  beforeEach(() => {
    listStudentRecords.mockReset();
    getStudent.mockReset();
    getStudentHistory.mockReset();
    disableStudent.mockReset();
    emitToastMock.mockReset();
    listStudentRecords.mockResolvedValue([makeStudent()]);
    getStudent.mockResolvedValue(makeStudent());
    getStudentHistory.mockResolvedValue(makeHistory());
  });

  it("renders student columns and status labels", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        fullName: "李四",
        studentNumber: "20260002",
        department: "外国语学院",
        className: "英语 2 班",
        phone: "13900139000",
        status: "DISABLED",
        pointsBalance: 80,
        activeAdoptionCount: 1,
        createdAt: "2026-10-02T10:00:00",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("张三")).toBeInTheDocument();
    for (const header of [
      "姓名",
      "学号",
      "院系",
      "班级",
      "手机号",
      "当前积分",
      "在养绿植数",
      "账号状态",
      "注册时间",
      "操作",
    ]) {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("正常")).toBeInTheDocument();
    expect(screen.getByText("已禁用")).toBeInTheDocument();
    expect(screen.getByText("2026-10-01 09:00")).toBeInTheDocument();
  });

  it("applies keyword only after query", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({ id: 3, fullName: "李四", studentNumber: "20260002" }),
    ]);
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByPlaceholderText("姓名、学号或邮箱"), {
      target: { value: "李" },
    });
    expect(screen.getByText("张三")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
  });

  it("filters by department and status", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        fullName: "李四",
        studentNumber: "20260002",
        department: "外国语学院",
        status: "DISABLED",
      }),
    ]);
    renderPage();
    await screen.findByText("张三");

    const [department, status] = comboboxes();
    await selectOption(department!, "外国语学院");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();

    await selectOption(status!, "已禁用");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    expect(screen.getByText("李四")).toBeInTheDocument();
  });

  it("filters by registration date range", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        fullName: "李四",
        createdAt: "2026-10-02T10:00:00",
      }),
    ]);
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByLabelText("注册日期起"), {
      target: { value: "2026-10-02" },
    });
    fireEvent.change(screen.getByLabelText("注册日期止"), {
      target: { value: "2026-10-02" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
  });

  it("combines keyword and status filters", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({ id: 3, fullName: "李四", status: "DISABLED" }),
      makeStudent({ id: 4, fullName: "李五", status: "ACTIVE" }),
    ]);
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByPlaceholderText("姓名、学号或邮箱"), {
      target: { value: "李" },
    });
    await selectOption(comboboxes()[1]!, "已禁用");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("李四")).toBeInTheDocument();
    expect(screen.queryByText("李五")).not.toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
  });

  it("resets filters and restores all students", async () => {
    listStudentRecords.mockResolvedValue([
      makeStudent(),
      makeStudent({ id: 3, fullName: "李四" }),
    ]);
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByPlaceholderText("姓名、学号或邮箱"), {
      target: { value: "李" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    expect(screen.queryByText("张三")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("姓名、学号或邮箱")).toHaveValue("");
  });

  it("paginates ten students at a time", async () => {
    listStudentRecords.mockResolvedValue(
      Array.from({ length: 11 }, (_, index) =>
        makeStudent({
          id: index + 1,
          fullName: `学生${index + 1}`,
          studentNumber: `2026${String(index + 1).padStart(4, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );
    renderPage();

    expect(await screen.findByText("共 11 条")).toBeInTheDocument();
    expect(listRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("学生1")).toBeInTheDocument();
    expect(listRows()).toHaveLength(1);
  });

  it("shows an empty state when there are no students", async () => {
    listStudentRecords.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("暂无学生")).toBeInTheDocument();
  });

  it("shows the filtered empty state and keeps filters visible", async () => {
    renderPage();
    await screen.findByText("张三");

    fireEvent.change(screen.getByPlaceholderText("姓名、学号或邮箱"), {
      target: { value: "不存在" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(
      await screen.findByText("没有符合筛选条件的学生"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("姓名、学号或邮箱")).toBeInTheDocument();
  });

  it("shows a failure and retries the list", async () => {
    listStudentRecords
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeStudent()]);
    renderPage();

    expect(
      await screen.findByText("学生列表加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("张三")).toBeInTheDocument();
    expect(listStudentRecords).toHaveBeenCalledTimes(2);
  });

  it("opens a student detail drawer", async () => {
    getStudentHistory.mockResolvedValue(
      makeHistory({ adoptions: [makeAdoptionHistory()] }),
    );
    renderPage();
    await screen.findByText("张三");

    fireEvent.click(screen.getByRole("button", { name: /查\s*看/ }));

    expect(await screen.findByText("业务记录")).toBeInTheDocument();
    expect(getStudent).toHaveBeenCalledWith(2);
    expect(getStudentHistory).toHaveBeenCalledWith(2);
    expect(await screen.findByText("AD-1001")).toBeInTheDocument();
  });

  it("keeps history visible when detail fails", async () => {
    getStudent.mockRejectedValue(new Error("detail failed"));
    getStudentHistory.mockResolvedValue(
      makeHistory({ adoptions: [makeAdoptionHistory()] }),
    );
    renderPage();
    await screen.findByText("张三");

    fireEvent.click(screen.getByRole("button", { name: /查\s*看/ }));

    expect(
      await screen.findByText("学生详情加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(await screen.findByText("AD-1001")).toBeInTheDocument();
  });

  it("re-evaluates an active status filter after disabling a student", async () => {
    disableStudent.mockResolvedValue(makeStudent({ status: "DISABLED" }));
    renderPage();
    await screen.findByText("张三");

    await selectOption(comboboxes()[1]!, "正常");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    expect(listRows()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /查\s*看/ }));
    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "违反平台规定" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认禁用" }));

    await waitFor(() => expect(listRows()).toHaveLength(0));
    expect(emitToastMock).toHaveBeenCalledWith("success", "学生账号已禁用");
  });
});
