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
import * as accountsApi from "@/api/accounts";
import * as adoptionsApi from "@/api/adoptions";
import { ApiError } from "@/api/client";
import * as plantsApi from "@/api/plants";
import { emitToast } from "@/lib/toast-events";
import AdoptionsPage from "@/pages/adoptions/AdoptionsPage";

vi.mock("@/api/adoptions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/adoptions")>();

  return {
    ...actual,
    listAdoptions: vi.fn(),
    getAdoption: vi.fn(),
    approveAdoption: vi.fn(),
    rejectAdoption: vi.fn(),
    confirmHandover: vi.fn(),
    decideCancel: vi.fn(),
    decideReturn: vi.fn(),
  };
});

vi.mock("@/api/accounts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/accounts")>();

  return {
    ...actual,
    listStudents: vi.fn(),
  };
});

vi.mock("@/api/plants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/plants")>();

  return {
    ...actual,
    listIndividuals: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listAdoptions = vi.mocked(adoptionsApi.listAdoptions);
const getAdoption = vi.mocked(adoptionsApi.getAdoption);
const approveAdoption = vi.mocked(adoptionsApi.approveAdoption);
const rejectAdoption = vi.mocked(adoptionsApi.rejectAdoption);
const confirmHandover = vi.mocked(adoptionsApi.confirmHandover);
const decideCancel = vi.mocked(adoptionsApi.decideCancel);
const decideReturn = vi.mocked(adoptionsApi.decideReturn);
const listStudents = vi.mocked(accountsApi.listStudents);
const listIndividuals = vi.mocked(plantsApi.listIndividuals);
const emitToastMock = vi.mocked(emitToast);

function makeStudent(
  overrides: Partial<accountsApi.StudentView> = {},
): accountsApi.StudentView {
  return {
    id: 2,
    email: "student@qq.com",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    status: "ACTIVE",
    pointsBalance: 80,
    ...overrides,
  };
}

function makeAdoption(
  overrides: Partial<adoptionsApi.AdoptionView> = {},
): adoptionsApi.AdoptionView {
  return {
    id: 1,
    applicationNo: "ADP-001",
    studentId: 2,
    studentEmail: "student@qq.com",
    speciesId: 1,
    speciesName: "绿萝",
    plantId: null,
    plantCode: null,
    plantLocation: null,
    note: "希望在宿舍养护",
    status: "PENDING_REVIEW",
    reviewReason: null,
    pickupDeadline: null,
    handedOverAt: null,
    returnReason: null,
    returnResult: null,
    endedAt: null,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    timeline: [
      {
        fromStatus: null,
        toStatus: "PENDING_REVIEW",
        reason: null,
        createdAt: "2026-10-30T09:00:00",
      },
    ],
    ...overrides,
  };
}

function makeIndividual(
  overrides: Partial<plantsApi.IndividualView> = {},
): plantsApi.IndividualView {
  return {
    id: 10,
    code: "PLANT-010",
    speciesId: 1,
    speciesName: "绿萝",
    displayName: null,
    location: "图书馆一楼",
    status: "AVAILABLE",
    imageFileIds: [],
    notes: null,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
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

function renderPage(initialEntry = "/adoptions") {
  const router = createMemoryRouter(
    [
      {
        path: "/adoptions",
        element: (
          <>
            <AdoptionsPage />
            <LocationProbe />
          </>
        ),
      },
      { path: "/plants/instances", element: <LocationProbe /> },
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

function drawerElement() {
  const element = document.querySelector(".ant-drawer");

  if (!element) {
    throw new Error("drawer not found");
  }

  return element as HTMLElement;
}

function modalElement() {
  const element = document.querySelector(".ant-modal");

  if (!element) {
    throw new Error("modal not found");
  }

  return element as HTMLElement;
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

async function confirmPopover(label: string) {
  const popover = await waitFor(() => {
    const element = document.querySelector(".ant-popover");

    if (!element) {
      throw new Error("popover not found");
    }

    return element as HTMLElement;
  });

  fireEvent.click(within(popover).getByRole("button", { name: label }));
}

async function openDetail(applicationNo = "ADP-001") {
  fireEvent.click(
    within(rowOf(applicationNo)).getByRole("button", { name: /查\s*看/ }),
  );
  await screen.findByText("状态时间线");
}

function typeReason(value: string) {
  fireEvent.change(screen.getByLabelText("原因"), {
    target: { value },
  });
}

async function submitReason(label: string) {
  fireEvent.click(within(modalElement()).getByRole("button", { name: label }));
}

describe("AdoptionsPage", () => {
  beforeEach(() => {
    listAdoptions.mockReset();
    getAdoption.mockReset();
    approveAdoption.mockReset();
    rejectAdoption.mockReset();
    confirmHandover.mockReset();
    decideCancel.mockReset();
    decideReturn.mockReset();
    listStudents.mockReset();
    listIndividuals.mockReset();
    emitToastMock.mockReset();

    listAdoptions.mockResolvedValue([makeAdoption()]);
    listStudents.mockResolvedValue([makeStudent()]);
    listIndividuals.mockResolvedValue([]);
    getAdoption.mockResolvedValue(makeAdoption());
  });

  it("renders applications with student, plant and status text", async () => {
    listAdoptions.mockResolvedValue([
      makeAdoption({
        id: 1,
        applicationNo: "ADP-001",
        status: "PENDING_REVIEW",
      }),
      makeAdoption({
        id: 2,
        applicationNo: "ADP-002",
        studentId: 3,
        studentEmail: "li@qq.com",
        speciesId: 2,
        speciesName: "芦荟",
        plantId: 10,
        plantCode: "PLANT-010",
        plantLocation: "教学楼",
        status: "WAITING_PICKUP",
        createdAt: "2026-10-29T09:00:00",
      }),
    ]);
    listStudents.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        email: "li@qq.com",
        fullName: "李四",
        studentNumber: "20260002",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("ADP-001")).toBeInTheDocument();
    expect(screen.getByText("张三")).toBeInTheDocument();
    expect(screen.getByText("20260001")).toBeInTheDocument();
    expect(screen.getByText("PLANT-010")).toBeInTheDocument();
    expect(screen.getAllByText("待领取").length).toBeGreaterThan(0);
  });

  it("falls back to the email when the student directory fails", async () => {
    listStudents.mockRejectedValue(new Error("directory failed"));

    renderPage();

    expect(await screen.findByText("ADP-001")).toBeInTheDocument();
    expect(screen.getByText("student@qq.com")).toBeInTheDocument();
    expect(
      screen.queryByText("领养申请加载失败，请稍后重试"),
    ).not.toBeInTheDocument();
  });

  it("filters by keyword, status, species and date range, then resets", async () => {
    listAdoptions.mockResolvedValue([
      makeAdoption({
        id: 1,
        applicationNo: "ADP-001",
        createdAt: "2026-10-30T09:00:00",
      }),
      makeAdoption({
        id: 2,
        applicationNo: "ADP-002",
        studentId: 3,
        studentEmail: "li@qq.com",
        speciesId: 2,
        speciesName: "芦荟",
        status: "REJECTED",
        createdAt: "2026-10-29T09:00:00",
      }),
    ]);
    listStudents.mockResolvedValue([
      makeStudent(),
      makeStudent({
        id: 3,
        email: "li@qq.com",
        fullName: "李四",
        studentNumber: "20260002",
      }),
    ]);

    renderPage();
    await screen.findByText("ADP-001");

    fireEvent.change(
      screen.getByPlaceholderText("申请编号、学生姓名、学号或邮箱"),
      { target: { value: "李四" } },
    );
    await selectOption(screen.getAllByRole("combobox")[0]!, "已驳回");
    await selectOption(screen.getAllByRole("combobox")[1]!, "芦荟");
    fireEvent.change(screen.getByLabelText("提交日期起"), {
      target: { value: "2026-10-29" },
    });
    fireEvent.change(screen.getByLabelText("提交日期止"), {
      target: { value: "2026-10-29" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("ADP-001")).not.toBeInTheDocument();
    expect(screen.getByText("ADP-002")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("ADP-001")).toBeInTheDocument();
    expect(screen.getByText("ADP-002")).toBeInTheDocument();
  });

  it("applies the status filter from the URL", async () => {
    listAdoptions.mockResolvedValue([
      makeAdoption({ id: 1, applicationNo: "ADP-001" }),
      makeAdoption({
        id: 2,
        applicationNo: "ADP-002",
        status: "REJECTED",
      }),
    ]);

    renderPage("/adoptions?status=PENDING_REVIEW");

    expect(await screen.findByText("ADP-001")).toBeInTheDocument();
    expect(screen.queryByText("ADP-002")).not.toBeInTheDocument();
  });

  it("ignores an invalid status parameter", async () => {
    listAdoptions.mockResolvedValue([
      makeAdoption({ id: 1, applicationNo: "ADP-001" }),
      makeAdoption({
        id: 2,
        applicationNo: "ADP-002",
        status: "REJECTED",
      }),
    ]);

    renderPage("/adoptions?status=NOPE");

    expect(await screen.findByText("ADP-001")).toBeInTheDocument();
    expect(screen.getByText("ADP-002")).toBeInTheDocument();
  });

  it("writes the status filter back to the URL and clears it on reset", async () => {
    renderPage();
    await screen.findByText("ADP-001");

    await selectOption(screen.getAllByRole("combobox")[0]!, "已驳回");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByTestId("location")).toHaveTextContent("status=REJECTED");

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByTestId("location")).not.toHaveTextContent("status=");
  });

  it("paginates ten rows per page", async () => {
    listAdoptions.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeAdoption({
          id: index + 1,
          applicationNo: `ADP-${String(index + 1).padStart(3, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("ADP-012");

    expect(screen.getByText("ADP-003")).toBeInTheDocument();
    expect(screen.queryByText("ADP-002")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("ADP-002")).toBeInTheDocument();
    expect(screen.getByText("ADP-001")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    listAdoptions.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无领养申请")).toBeInTheDocument();
  });

  it("retries after a list failure", async () => {
    listAdoptions
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue([makeAdoption()]);

    renderPage();

    expect(
      await screen.findByText("领养申请加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("ADP-001")).toBeInTheDocument();
  });

  it("opens the detail drawer with student information and timeline", async () => {
    getAdoption.mockResolvedValue(
      makeAdoption({
        note: "希望放宿舍",
        timeline: [
          {
            fromStatus: null,
            toStatus: "PENDING_REVIEW",
            reason: null,
            createdAt: "2026-10-30T09:00:00",
          },
          {
            fromStatus: "PENDING_REVIEW",
            toStatus: "WAITING_PICKUP",
            reason: "已通过审核",
            createdAt: "2026-10-30T10:00:00",
          },
        ],
      }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    const drawer = drawerElement();
    expect(within(drawer).getByText("张三")).toBeInTheDocument();
    expect(within(drawer).getByText("20260001")).toBeInTheDocument();
    expect(within(drawer).getByText("未分配")).toBeInTheDocument();
    expect(within(drawer).getByText("希望放宿舍")).toBeInTheDocument();
    expect(within(drawer).getByText("提交申请（待审核）")).toBeInTheDocument();
    expect(within(drawer).getByText("待审核 → 待领取")).toBeInTheDocument();
    expect(within(drawer).getByText("已通过审核")).toBeInTheDocument();
  });

  it("retries when the detail request fails", async () => {
    getAdoption
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue(makeAdoption());

    renderPage();
    await screen.findByText("ADP-001");

    fireEvent.click(
      within(rowOf("ADP-001")).getByRole("button", { name: /查\s*看/ }),
    );

    expect(
      await screen.findByText("详情加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /重\s*试/ }),
    );

    expect(await screen.findByText("状态时间线")).toBeInTheDocument();
  });

  it("approves an application with an available plant of the same species", async () => {
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-010", speciesId: 1 }),
      makeIndividual({
        id: 11,
        code: "PLANT-011",
        speciesId: 1,
        status: "MAINTENANCE",
      }),
      makeIndividual({ id: 12, code: "PLANT-012", speciesId: 2 }),
    ]);
    approveAdoption.mockResolvedValue(
      makeAdoption({
        status: "WAITING_PICKUP",
        plantId: 10,
        plantCode: "PLANT-010",
        plantLocation: "图书馆一楼",
      }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );

    await screen.findByText("通过申请并分配单株");
    const modal = modalElement();
    expect(within(modal).getByText("PLANT-010")).toBeInTheDocument();
    expect(within(modal).queryByText("PLANT-011")).not.toBeInTheDocument();
    expect(within(modal).queryByText("PLANT-012")).not.toBeInTheDocument();

    fireEvent.click(within(rowOf("PLANT-010")).getByRole("radio"));
    fireEvent.click(within(modal).getByRole("button", { name: /通\s*过/ }));

    await waitFor(() => expect(approveAdoption).toHaveBeenCalledWith(1, 10));
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "申请已通过，单株已绑定",
    );
    expect(within(drawerElement()).getByText("待领取")).toBeInTheDocument();
  });

  it("shows an empty plant picker when no plant is available", async () => {
    listIndividuals.mockResolvedValue([]);

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );

    expect(await screen.findByText("该品种暂无可领养单株")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "去单株库存" }),
    ).toBeInTheDocument();
    expect(
      within(modalElement()).getByRole("button", { name: /通\s*过/ }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "去单株库存" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/plants/instances?speciesId=1",
      ),
    );
  });

  it("refreshes the plant list when the selected plant was taken", async () => {
    listIndividuals.mockResolvedValue([makeIndividual()]);
    approveAdoption.mockRejectedValue(
      new ApiError("PLANT_NOT_AVAILABLE", "所选单株已被分配或不可领养", 409),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );
    await screen.findByText("PLANT-010");

    fireEvent.click(within(rowOf("PLANT-010")).getByRole("radio"));
    fireEvent.click(
      within(modalElement()).getByRole("button", { name: /通\s*过/ }),
    );

    expect(
      await screen.findByText("所选单株已被分配或不可领养"),
    ).toBeInTheDocument();
    await waitFor(() => expect(listIndividuals).toHaveBeenCalledTimes(2));
    expect(screen.getByText("通过申请并分配单株")).toBeInTheDocument();
  });

  it("refreshes and closes the plant picker on a status conflict", async () => {
    listIndividuals.mockResolvedValue([makeIndividual()]);
    approveAdoption.mockRejectedValue(
      new ApiError(
        "ADOPTION_STATUS_INVALID",
        "申请状态已变化，请刷新后重试",
        409,
      ),
    );
    getAdoption
      .mockResolvedValueOnce(makeAdoption())
      .mockResolvedValue(makeAdoption({ status: "WAITING_PICKUP" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );
    await screen.findByText("PLANT-010");

    fireEvent.click(within(rowOf("PLANT-010")).getByRole("radio"));
    fireEvent.click(
      within(modalElement()).getByRole("button", { name: /通\s*过/ }),
    );

    await waitFor(() => expect(getAdoption).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText("通过申请并分配单株")).not.toBeInTheDocument(),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "error",
      "申请状态已变化，请刷新后重试",
    );
  });

  it("validates the reject reason before sending", async () => {
    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回领养申请");

    typeReason("太短");
    await submitReason("确认驳回");

    expect(
      await screen.findByText("原因请填写 5 到 200 字"),
    ).toBeInTheDocument();
    expect(rejectAdoption).not.toHaveBeenCalled();
  });

  it("rejects an application with a valid reason", async () => {
    rejectAdoption.mockResolvedValue(
      makeAdoption({
        status: "REJECTED",
        reviewReason: "宿舍条件不满足",
      }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回领养申请");

    typeReason("宿舍条件不满足");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(rejectAdoption).toHaveBeenCalledWith(1, "宿舍条件不满足"),
    );
    expect(within(drawerElement()).getByText("已驳回")).toBeInTheDocument();
  });

  it("keeps the reject reason when the request fails", async () => {
    rejectAdoption.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回领养申请");

    typeReason("宿舍条件不满足");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "无法连接后端服务，请稍后重试",
      ),
    );
    expect(screen.getByLabelText("原因")).toHaveValue("宿舍条件不满足");
    expect(screen.getByText("驳回领养申请")).toBeInTheDocument();
  });

  it("keeps the reason submit disabled while the request is pending", async () => {
    let resolveReject: ((value: adoptionsApi.AdoptionView) => void) | undefined;
    rejectAdoption.mockReturnValue(
      new Promise((resolve) => {
        resolveReject = resolve;
      }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回领养申请");

    typeReason("宿舍条件不满足");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(
        within(modalElement()).getByRole("button", { name: /确认驳回/ }),
      ).toHaveClass("ant-btn-loading"),
    );

    resolveReject?.(makeAdoption({ status: "REJECTED" }));

    await waitFor(() =>
      expect(screen.queryByText("驳回领养申请")).not.toBeInTheDocument(),
    );
  });

  it("confirms handover after a popconfirm and can cancel it", async () => {
    getAdoption.mockResolvedValue(
      makeAdoption({ status: "WAITING_PICKUP", plantCode: "PLANT-010" }),
    );
    confirmHandover.mockResolvedValue(
      makeAdoption({ status: "ACTIVE", plantCode: "PLANT-010" }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "确认交接" }),
    );
    await confirmPopover("确认交接");

    await waitFor(() => expect(confirmHandover).toHaveBeenCalledWith(1));
    expect(within(drawerElement()).getByText("养护中")).toBeInTheDocument();
  });

  it("does not hand over when the popconfirm is cancelled", async () => {
    getAdoption.mockResolvedValue(
      makeAdoption({ status: "WAITING_PICKUP", plantCode: "PLANT-010" }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "确认交接" }),
    );

    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");

      if (!element) {
        throw new Error("popover not found");
      }

      return element as HTMLElement;
    });

    fireEvent.click(within(popover).getByRole("button", { name: /取\s*消/ }));

    expect(confirmHandover).not.toHaveBeenCalled();
  });

  it("approves a cancel request and rejects it with a reason", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "CANCEL_REVIEW" }));
    decideCancel.mockResolvedValue(makeAdoption({ status: "CANCELLED" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "同意取消" }),
    );
    await confirmPopover("同意取消");

    await waitFor(() => expect(decideCancel).toHaveBeenCalledWith(1, true));
    expect(within(drawerElement()).getByText("已取消")).toBeInTheDocument();
  });

  it("rejects a cancel request with a reason", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "CANCEL_REVIEW" }));
    decideCancel.mockResolvedValue(makeAdoption({ status: "WAITING_PICKUP" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "拒绝取消" }),
    );
    await screen.findByText("拒绝取消申请");

    typeReason("已经完成交接");
    await submitReason("确认拒绝");

    await waitFor(() =>
      expect(decideCancel).toHaveBeenCalledWith(1, false, "已经完成交接"),
    );
    expect(within(drawerElement()).getByText("待领取")).toBeInTheDocument();
  });

  it("requires a return result before confirming a return", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "RETURN_REVIEW" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "确认归还" }),
    );
    await screen.findByText("确认收到归还绿植");

    fireEvent.click(
      within(modalElement()).getByRole("button", { name: "确认归还" }),
    );

    expect(await screen.findByText("请选择归还结果")).toBeInTheDocument();
    expect(decideReturn).not.toHaveBeenCalled();
  });

  it("confirms a return to maintenance", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "RETURN_REVIEW" }));
    decideReturn.mockResolvedValue(
      makeAdoption({ status: "ENDED", returnResult: "MAINTENANCE" }),
    );

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "确认归还" }),
    );
    await screen.findByText("确认收到归还绿植");

    fireEvent.click(screen.getByRole("radio", { name: "转入维护" }));
    fireEvent.click(
      within(modalElement()).getByRole("button", { name: "确认归还" }),
    );

    await waitFor(() =>
      expect(decideReturn).toHaveBeenCalledWith(1, true, "MAINTENANCE"),
    );
    expect(within(drawerElement()).getByText("已结束")).toBeInTheDocument();
    expect(within(drawerElement()).getByText("转入维护")).toBeInTheDocument();
  });

  it("rejects a return request with a reason", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "RETURN_REVIEW" }));
    decideReturn.mockResolvedValue(makeAdoption({ status: "ACTIVE" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: "驳回归还" }),
    );
    await screen.findByText("驳回归还申请");

    typeReason("植株状态与描述不符");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(decideReturn).toHaveBeenCalledWith(
        1,
        false,
        undefined,
        "植株状态与描述不符",
      ),
    );
    expect(within(drawerElement()).getByText("养护中")).toBeInTheDocument();
  });

  it("keeps read-only statuses without action buttons", async () => {
    getAdoption.mockResolvedValue(makeAdoption({ status: "ACTIVE" }));

    renderPage();
    await screen.findByText("ADP-001");
    await openDetail();

    const drawer = drawerElement();
    expect(
      within(drawer).queryByRole("button", { name: /通\s*过/ }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "确认交接" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "同意取消" }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: "确认归还" }),
    ).not.toBeInTheDocument();
  });
});
