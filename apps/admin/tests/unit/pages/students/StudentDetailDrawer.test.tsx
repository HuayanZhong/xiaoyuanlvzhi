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
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as accountsApi from "@/api/accounts";
import { ApiError } from "@/api/client";
import { emitToast } from "@/lib/toast-events";
import StudentDetailDrawer from "@/pages/students/StudentDetailDrawer";
import {
  makeAdoptionHistory,
  makeCareHistory,
  makeHistory,
  makeOrderHistory,
  makePointHistory,
  makeStudent,
  makeTaskHistory,
} from "./fixtures";

vi.mock("@/api/accounts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/accounts")>();

  return {
    ...actual,
    getStudent: vi.fn(),
    getStudentHistory: vi.fn(),
    disableStudent: vi.fn(),
    enableStudent: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const getStudent = vi.mocked(accountsApi.getStudent);
const getStudentHistory = vi.mocked(accountsApi.getStudentHistory);
const disableStudent = vi.mocked(accountsApi.disableStudent);
const enableStudent = vi.mocked(accountsApi.enableStudent);
const emitToastMock = vi.mocked(emitToast);

function DrawerHarness({
  onChanged = vi.fn(),
  onRefresh = vi.fn(),
}: {
  onChanged?: (student: accountsApi.StudentRecordView) => void;
  onRefresh?: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <StudentDetailDrawer
      onChanged={onChanged}
      onClose={() => setOpen(false)}
      onRefresh={onRefresh}
      open={open}
      studentId={2}
    />
  );
}

function renderDrawer(
  props: {
    onChanged?: (student: accountsApi.StudentRecordView) => void;
    onRefresh?: () => void;
  } = {},
) {
  return render(
    <ConfigProvider locale={zhCN}>
      <DrawerHarness {...props} />
    </ConfigProvider>,
  );
}

describe("StudentDetailDrawer", () => {
  beforeEach(() => {
    getStudent.mockReset();
    getStudentHistory.mockReset();
    disableStudent.mockReset();
    enableStudent.mockReset();
    emitToastMock.mockReset();
    getStudent.mockResolvedValue(makeStudent());
    getStudentHistory.mockResolvedValue(makeHistory());
  });

  it("renders profile fields and missing values as a dash", async () => {
    getStudent.mockResolvedValue(
      makeStudent({
        studentNumber: null,
        department: null,
        className: null,
        phone: null,
      }),
    );

    renderDrawer();

    expect(await screen.findByText("业务记录")).toBeInTheDocument();
    expect(screen.getByText("student@qq.com")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("keeps history visible when detail fails and retries detail", async () => {
    getStudent
      .mockRejectedValueOnce(new Error("detail failed"))
      .mockResolvedValueOnce(makeStudent());
    getStudentHistory.mockResolvedValue(
      makeHistory({ adoptions: [makeAdoptionHistory()] }),
    );

    renderDrawer();

    expect(
      await screen.findByText("学生详情加载失败，请稍后重试"),
    ).toBeInTheDocument();
    expect(await screen.findByText("AD-1001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    await waitFor(() => expect(getStudent).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("student@qq.com")).toBeInTheDocument();
  });

  it("keeps profile visible when history fails and retries history", async () => {
    getStudentHistory
      .mockRejectedValueOnce(new Error("history failed"))
      .mockResolvedValueOnce(
        makeHistory({ adoptions: [makeAdoptionHistory()] }),
      );

    renderDrawer();

    expect(await screen.findByText("student@qq.com")).toBeInTheDocument();
    expect(
      await screen.findByText("学生历史加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    await waitFor(() => expect(getStudentHistory).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("AD-1001")).toBeInTheDocument();
  });

  it("renders all five history tabs with their fields", async () => {
    getStudentHistory.mockResolvedValue(
      makeHistory({
        adoptions: [makeAdoptionHistory()],
        careCheckins: [makeCareHistory()],
        taskParticipations: [makeTaskHistory()],
        pointLedger: [makePointHistory()],
        rewardOrders: [makeOrderHistory()],
      }),
    );

    renderDrawer();

    expect(await screen.findByText("AD-1001")).toBeInTheDocument();
    expect(screen.getByText("养护中")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "养护打卡" }));
    expect(await screen.findByText("CK-1001")).toBeInTheDocument();
    expect(screen.getByText("叶片状态良好")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "任务记录" }));
    expect(await screen.findByText("校园垃圾分类宣传")).toBeInTheDocument();
    expect(screen.getByText("已完成宣传")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "积分流水" }));
    expect(await screen.findByText("+10")).toBeInTheDocument();
    expect(screen.getByText("养护打卡通过")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "兑换订单" }));
    expect(await screen.findByText("RO-1001")).toBeInTheDocument();
    expect(screen.getByText("环保帆布袋")).toBeInTheDocument();
  });

  it("paginates a history group at ten rows", async () => {
    getStudentHistory.mockResolvedValue(
      makeHistory({
        adoptions: Array.from({ length: 11 }, (_, index) =>
          makeAdoptionHistory({
            id: index + 1,
            applicationNo: `AD-${1001 + index}`,
          }),
        ),
      }),
    );

    renderDrawer();

    expect(await screen.findByText("共 11 条")).toBeInTheDocument();
    expect(screen.queryByText("AD-1011")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("AD-1011")).toBeInTheDocument();
  });

  it("disables a student and notifies the list", async () => {
    const onChanged = vi.fn();
    disableStudent.mockResolvedValue(makeStudent({ status: "DISABLED" }));

    renderDrawer({ onChanged });

    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    expect(await screen.findByText("禁用学生账号")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "  违反平台规定  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认禁用" }));

    await waitFor(() =>
      expect(disableStudent).toHaveBeenCalledWith(2, "违反平台规定"),
    );
    expect(onChanged).toHaveBeenCalledWith(
      expect.objectContaining({ status: "DISABLED" }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "学生账号已禁用");
    expect(
      await screen.findByRole("button", { name: "启用账号" }),
    ).toBeInTheDocument();
  });

  it("enables a disabled student", async () => {
    getStudent.mockResolvedValue(makeStudent({ status: "DISABLED" }));
    enableStudent.mockResolvedValue(makeStudent({ status: "ACTIVE" }));

    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "启用账号" }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "恢复账号使用" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认启用" }));

    await waitFor(() =>
      expect(enableStudent).toHaveBeenCalledWith(2, "恢复账号使用"),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "学生账号已启用");
  });

  it("cancels a status action without sending a request", async () => {
    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    const modal = document.querySelector(".ant-modal") as HTMLElement;
    fireEvent.click(within(modal).getByRole("button", { name: /取\s*消/ }));

    expect(disableStudent).not.toHaveBeenCalled();
  });

  it("rejects a reason shorter than five characters", async () => {
    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "abcd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认禁用" }));

    expect(
      await screen.findByText("原因请填写 5 到 200 字"),
    ).toBeInTheDocument();
    expect(disableStudent).not.toHaveBeenCalled();
  });

  it("keeps the reason modal open when the request fails", async () => {
    disableStudent.mockRejectedValue(
      new ApiError("UPSTREAM_UNAVAILABLE", "后端服务暂不可用", 500),
    );

    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "违反平台规定" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认禁用" }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith("error", "后端服务暂不可用"),
    );
    expect(screen.getByText("禁用学生账号")).toBeInTheDocument();
    expect(screen.getByLabelText("原因")).toHaveValue("违反平台规定");
  });

  it("closes and refreshes when the student no longer exists", async () => {
    const onRefresh = vi.fn();
    disableStudent.mockRejectedValue(
      new ApiError("STUDENT_NOT_FOUND", "学生账号不存在", 404),
    );

    renderDrawer({ onRefresh });

    fireEvent.click(await screen.findByRole("button", { name: "禁用账号" }));
    fireEvent.change(screen.getByLabelText("原因"), {
      target: { value: "违反平台规定" },
    });
    fireEvent.click(screen.getByRole("button", { name: "确认禁用" }));

    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(emitToastMock).toHaveBeenCalledWith("error", "学生账号不存在");
    await waitFor(() =>
      expect(screen.queryByText("禁用学生账号")).not.toBeInTheDocument(),
    );
  });
});
