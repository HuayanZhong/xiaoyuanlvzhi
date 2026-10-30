import {
  act,
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
  AdminCheckinView,
  AdminSubmissionView,
  CareEventView,
} from "@/api/care";
import * as careApi from "@/api/care";
import { ApiError } from "@/api/client";
import { emitToast } from "@/lib/toast-events";
import CareReviewsPage from "@/pages/care/CareReviewsPage";

vi.mock("@/api/care", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/care")>();

  return {
    ...actual,
    listCareCheckins: vi.fn(),
    getCareCheckin: vi.fn(),
    listCareEvents: vi.fn(),
    approveCareCheckin: vi.fn(),
    rejectCareCheckin: vi.fn(),
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

const listCareCheckins = vi.mocked(careApi.listCareCheckins);
const getCareCheckin = vi.mocked(careApi.getCareCheckin);
const listCareEvents = vi.mocked(careApi.listCareEvents);
const approveCareCheckin = vi.mocked(careApi.approveCareCheckin);
const rejectCareCheckin = vi.mocked(careApi.rejectCareCheckin);
const emitToastMock = vi.mocked(emitToast);

let submissionId = 1;

function makeSubmission(
  overrides: Partial<AdminSubmissionView> = {},
): AdminSubmissionView {
  return {
    id: submissionId++,
    version: 1,
    note: "叶片状态良好",
    imageFileIds: [],
    status: "PENDING_REVIEW",
    reviewReason: null,
    reviewerName: null,
    reviewerEmail: null,
    submittedAt: "2026-10-30T09:00:00",
    reviewedAt: null,
    awardedPoints: null,
    ...overrides,
  };
}

function makeCheckin(
  overrides: Partial<AdminCheckinView> = {},
): AdminCheckinView {
  const submissions = overrides.submissions ?? [makeSubmission()];
  const latestVersion = submissions.reduce(
    (max, item) => (item.version > max ? item.version : max),
    0,
  );

  return {
    id: 1,
    checkinNo: "CHK-001",
    studentId: 2,
    studentName: "张三",
    studentNumber: "20260001",
    studentEmail: "zhang@qq.com",
    studentStatus: "ACTIVE",
    plantId: 10,
    plantCode: "PLANT-010",
    plantDisplayName: "窗边绿萝",
    plantName: "绿萝",
    location: "图书馆一楼",
    plantStatus: "ACTIVE",
    speciesId: 1,
    speciesName: "绿萝",
    careIntervalDays: 7,
    lightDescription: "散射光",
    waterDescription: "每周一次",
    status: "PENDING_REVIEW",
    latestVersion,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    lastApprovedAt: null,
    pendingPoints: 10,
    pointsSource: "SPECIES",
    hasEvidence: true,
    duplicatePending: false,
    submissions,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CareEventView> = {}): CareEventView {
  return {
    id: 1,
    action: "CARE_APPROVE",
    fromStatus: "PENDING_REVIEW",
    toStatus: "APPROVED",
    reason: null,
    actorName: "管理员",
    actorEmail: "admin@campus.local",
    createdAt: "2026-10-30T10:00:00",
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

function renderPage(initialEntry = "/care-reviews") {
  const router = createMemoryRouter(
    [
      {
        path: "/care-reviews",
        element: (
          <>
            <CareReviewsPage />
            <LocationProbe />
          </>
        ),
      },
      { path: "/dashboard", element: <LocationProbe /> },
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

async function openDetail(checkinNo = "CHK-001") {
  fireEvent.click(
    within(rowOf(checkinNo)).getByRole("button", { name: /查\s*看/ }),
  );
  await screen.findByText("凭证版本");
}

function typeReason(value: string) {
  fireEvent.change(screen.getByLabelText("原因"), {
    target: { value },
  });
}

async function submitReason(label: string) {
  fireEvent.click(within(modalElement()).getByRole("button", { name: label }));
}

describe("CareReviewsPage", () => {
  beforeEach(() => {
    submissionId = 1;
    listCareCheckins.mockReset();
    getCareCheckin.mockReset();
    listCareEvents.mockReset();
    approveCareCheckin.mockReset();
    rejectCareCheckin.mockReset();
    emitToastMock.mockReset();

    listCareCheckins.mockResolvedValue([makeCheckin()]);
    getCareCheckin.mockResolvedValue(makeCheckin());
    listCareEvents.mockResolvedValue([]);
  });

  it("renders the list sorted by creation time and id descending", async () => {
    listCareCheckins.mockResolvedValue([
      makeCheckin({
        id: 1,
        checkinNo: "CHK-001",
        createdAt: "2026-10-29T09:00:00",
        submissions: [makeSubmission({ imageFileIds: [5] })],
      }),
      makeCheckin({
        id: 2,
        checkinNo: "CHK-002",
        studentName: "李四",
        studentNumber: "20260002",
        plantCode: "PLANT-011",
        speciesName: "芦荟",
        createdAt: "2026-10-30T09:00:00",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("CHK-002")).toBeInTheDocument();
    expect(tableRows()[0]).toHaveTextContent("CHK-002");
    const row = rowOf("CHK-001");
    expect(within(row).getByText("张三")).toBeInTheDocument();
    expect(within(row).getByText("20260001")).toBeInTheDocument();
    expect(within(row).getByText("PLANT-010")).toBeInTheDocument();
    expect(within(row).getByText("绿萝")).toBeInTheDocument();
    expect(within(row).getByText("待审核")).toBeInTheDocument();
    expect(within(row).getByText("叶片状态良好")).toBeInTheDocument();
    expect(within(row).getByText("10 分")).toBeInTheDocument();
    expect(within(row).getByText("品种积分")).toBeInTheDocument();
    expect(screen.queryByAltText("养护凭证图片 5")).not.toBeInTheDocument();
  });

  it("filters by keyword, status, species and submit date, then resets", async () => {
    listCareCheckins.mockResolvedValue([
      makeCheckin({
        id: 1,
        checkinNo: "CHK-001",
        submissions: [makeSubmission({ submittedAt: "2026-10-30T09:00:00" })],
      }),
      makeCheckin({
        id: 2,
        checkinNo: "CHK-002",
        studentName: "李四",
        studentNumber: "20260002",
        speciesId: 2,
        speciesName: "芦荟",
        status: "REJECTED",
        submissions: [
          makeSubmission({
            status: "REJECTED",
            submittedAt: "2026-10-29T09:00:00",
          }),
        ],
      }),
    ]);

    renderPage();
    await screen.findByText("CHK-001");

    fireEvent.change(
      screen.getByPlaceholderText("打卡编号、学生姓名、学号、邮箱、单株或位置"),
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

    expect(screen.queryByText("CHK-001")).not.toBeInTheDocument();
    expect(screen.getByText("CHK-002")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("CHK-001")).toBeInTheDocument();
    expect(screen.getByText("CHK-002")).toBeInTheDocument();
  });

  it("applies a valid status filter from the URL", async () => {
    listCareCheckins.mockResolvedValue([
      makeCheckin({ id: 1, checkinNo: "CHK-001" }),
      makeCheckin({
        id: 2,
        checkinNo: "CHK-002",
        status: "APPROVED",
        submissions: [
          makeSubmission({ status: "APPROVED", awardedPoints: 10 }),
        ],
      }),
    ]);

    renderPage("/care-reviews?status=PENDING_REVIEW");

    expect(await screen.findByText("CHK-001")).toBeInTheDocument();
    expect(screen.queryByText("CHK-002")).not.toBeInTheDocument();
  });

  it("ignores an invalid status parameter", async () => {
    listCareCheckins.mockResolvedValue([
      makeCheckin({ id: 1, checkinNo: "CHK-001" }),
      makeCheckin({ id: 2, checkinNo: "CHK-002", status: "APPROVED" }),
    ]);

    renderPage("/care-reviews?status=NOPE");

    expect(await screen.findByText("CHK-001")).toBeInTheDocument();
    expect(screen.getByText("CHK-002")).toBeInTheDocument();
  });

  it("writes the status filter back to the URL and clears it on reset", async () => {
    renderPage();
    await screen.findByText("CHK-001");

    await selectOption(screen.getAllByRole("combobox")[0]!, "已通过");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByTestId("location")).toHaveTextContent("status=APPROVED");

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByTestId("location")).not.toHaveTextContent("status=");
  });

  it("paginates ten rows per page", async () => {
    listCareCheckins.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeCheckin({
          id: index + 1,
          checkinNo: `CHK-${String(index + 1).padStart(3, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("CHK-012");

    expect(screen.getByText("CHK-003")).toBeInTheDocument();
    expect(screen.queryByText("CHK-002")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("CHK-002")).toBeInTheDocument();
    expect(screen.getByText("CHK-001")).toBeInTheDocument();
  });

  it("shows an empty state with refresh, clear and workbench actions", async () => {
    listCareCheckins.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无养护打卡")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "返回工作台" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("shows a filtered empty state", async () => {
    renderPage();
    await screen.findByText("CHK-001");

    fireEvent.change(
      screen.getByPlaceholderText("打卡编号、学生姓名、学号、邮箱、单株或位置"),
      { target: { value: "不存在" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("没有符合筛选条件的打卡")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "清空筛选" }),
    ).toBeInTheDocument();
  });

  it("retries after the list fails", async () => {
    listCareCheckins
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue([makeCheckin()]);

    renderPage();

    expect(
      await screen.findByText("养护打卡加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("CHK-001")).toBeInTheDocument();
  });

  it("opens the detail drawer with versions and review events", async () => {
    getCareCheckin.mockResolvedValue(
      makeCheckin({
        submissions: [
          makeSubmission({
            id: 12,
            version: 2,
            note: "补充了最新照片",
            imageFileIds: [8],
          }),
          makeSubmission({
            id: 11,
            version: 1,
            note: "首次提交",
            imageFileIds: [7],
            status: "REJECTED",
            reviewReason: "照片模糊",
            reviewerName: "管理员",
            reviewedAt: "2026-10-29T10:00:00",
          }),
        ],
      }),
    );
    listCareEvents.mockResolvedValue([
      makeEvent({
        id: 2,
        action: "CARE_REJECT",
        fromStatus: "PENDING_REVIEW",
        toStatus: "REJECTED",
        reason: "照片模糊",
        createdAt: "2026-10-29T10:00:00",
      }),
      makeEvent({
        id: 3,
        action: "CARE_APPROVE",
        reason: "审核通过",
        createdAt: "2026-10-30T10:00:00",
      }),
    ]);

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    expect(getCareCheckin).toHaveBeenCalledWith(1);
    expect(listCareEvents).toHaveBeenCalledWith(1);

    const drawer = drawerElement();
    expect(within(drawer).getByText("张三")).toBeInTheDocument();
    expect(within(drawer).getByText(/PLANT-010/)).toBeInTheDocument();
    expect(
      within(drawer).getAllByText("补充了最新照片").length,
    ).toBeGreaterThan(0);
    expect(within(drawer).getAllByText("首次提交").length).toBeGreaterThan(0);
    expect(within(drawer).getAllByText("照片模糊").length).toBeGreaterThan(0);
    expect(within(drawer).getByAltText("养护凭证图片 7")).toBeInTheDocument();
    expect(
      within(drawer).getAllByAltText("养护凭证图片 8").length,
    ).toBeGreaterThan(0);

    const versionTitles = within(drawer).getAllByText(/^v\d/);
    expect(versionTitles[0]).toHaveTextContent("v1");
    expect(versionTitles[1]).toHaveTextContent("v2 · 最新");
    expect(
      within(drawer).getByText(/通过（待审核 → 已通过）/),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByText(/驳回（待审核 → 已驳回）/),
    ).toBeInTheDocument();
  });

  it("degrades only the events section when events fail", async () => {
    listCareEvents
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue([makeEvent()]);

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    expect(await screen.findByText("审核记录加载失败")).toBeInTheDocument();
    expect(within(drawerElement()).getByText("凭证版本")).toBeInTheDocument();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /重\s*试/ }),
    );

    expect(
      await screen.findByText(/通过（待审核 → 已通过）/),
    ).toBeInTheDocument();
  });

  it("retries when the detail request fails", async () => {
    getCareCheckin
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "网络错误"))
      .mockResolvedValue(makeCheckin());

    renderPage();
    await screen.findByText("CHK-001");

    fireEvent.click(
      within(rowOf("CHK-001")).getByRole("button", { name: /查\s*看/ }),
    );

    expect(
      await screen.findByText("详情加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /重\s*试/ }),
    );

    expect(await screen.findByText("凭证版本")).toBeInTheDocument();
  });

  it("approves a checkin and refreshes the detail and list", async () => {
    getCareCheckin.mockResolvedValue(makeCheckin());
    approveCareCheckin.mockResolvedValue(
      makeCheckin({
        status: "APPROVED",
        submissions: [
          makeSubmission({
            status: "APPROVED",
            reviewedAt: "2026-10-30T10:00:00",
            awardedPoints: 10,
          }),
        ],
      }),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );

    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");

      if (!element) {
        throw new Error("popover not found");
      }

      return element as HTMLElement;
    });
    expect(within(popover).getByText(/学生：张三/)).toBeInTheDocument();
    expect(within(popover).getByText(/单株：PLANT-010/)).toBeInTheDocument();
    expect(within(popover).getByText(/预计积分：10 分/)).toBeInTheDocument();

    await confirmPopover("确认通过");

    await waitFor(() => expect(approveCareCheckin).toHaveBeenCalledWith(1));
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "已通过，发放 10 积分",
    );
    await waitFor(() => expect(listCareCheckins).toHaveBeenCalledTimes(2));
    expect(
      within(drawerElement()).getAllByText("已通过").length,
    ).toBeGreaterThan(0);
  });

  it("disables approve when the latest evidence is missing but keeps reject enabled", async () => {
    getCareCheckin.mockResolvedValue(makeCheckin({ hasEvidence: false }));

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    expect(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    ).toBeDisabled();
    expect(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    ).toBeEnabled();
  });

  it.each([
    {
      label: "重复待审",
      checkin: makeCheckin({ duplicatePending: true }),
    },
    {
      label: "积分未配置",
      checkin: makeCheckin({ pointsSource: "NONE", pendingPoints: 0 }),
    },
    {
      label: "最新凭证已处理",
      checkin: makeCheckin({
        submissions: [makeSubmission({ status: "APPROVED" })],
      }),
    },
    {
      label: "版本不一致",
      checkin: makeCheckin({ latestVersion: 2 }),
    },
  ])(
    "disables approve when $label but keeps reject enabled",
    async ({ checkin }) => {
      getCareCheckin.mockResolvedValue(checkin);

      renderPage();
      await screen.findByText("CHK-001");
      await openDetail();

      expect(
        within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
      ).toBeDisabled();
      expect(
        within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
      ).toBeEnabled();
    },
  );

  it("disables both buttons while an approval is in flight", async () => {
    let resolveApprove: ((value: AdminCheckinView) => void) | undefined;
    approveCareCheckin.mockReturnValue(
      new Promise((resolve) => {
        resolveApprove = resolve;
      }),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );
    await confirmPopover("确认通过");

    await waitFor(() => expect(approveCareCheckin).toHaveBeenCalledWith(1));
    expect(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    ).toBeDisabled();
    expect(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    ).toBeDisabled();

    await act(async () => {
      resolveApprove?.(makeCheckin({ status: "APPROVED" }));
    });
  });

  it("validates the reject reason before sending", async () => {
    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回养护凭证");

    typeReason("太短");
    await submitReason("确认驳回");

    expect(
      await screen.findByText("原因请填写 5 到 200 字"),
    ).toBeInTheDocument();
    expect(rejectCareCheckin).not.toHaveBeenCalled();
  });

  it("rejects a checkin with a trimmed reason and refreshes", async () => {
    rejectCareCheckin.mockResolvedValue(
      makeCheckin({
        status: "REJECTED",
        submissions: [
          makeSubmission({
            status: "REJECTED",
            reviewReason: "照片不清晰，请重新上传",
            reviewedAt: "2026-10-30T10:00:00",
          }),
        ],
      }),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回养护凭证");

    typeReason("  照片不清晰，请重新上传  ");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(rejectCareCheckin).toHaveBeenCalledWith(
        1,
        "照片不清晰，请重新上传",
      ),
    );
    expect(emitToastMock).toHaveBeenCalledWith(
      "success",
      "已驳回，已通知学生补充凭证",
    );
    await waitFor(() => expect(listCareCheckins).toHaveBeenCalledTimes(2));
    expect(
      within(drawerElement()).getAllByText("已驳回").length,
    ).toBeGreaterThan(0);
  });

  it("keeps the reject reason when the request fails", async () => {
    rejectCareCheckin.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /驳\s*回/ }),
    );
    await screen.findByText("驳回养护凭证");

    typeReason("照片不清晰，请重新上传");
    await submitReason("确认驳回");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "无法连接后端服务，请稍后重试",
      ),
    );
    expect(screen.getByLabelText("原因")).toHaveValue("照片不清晰，请重新上传");
    expect(screen.getByText("驳回养护凭证")).toBeInTheDocument();
  });

  it("refreshes detail and list on a status conflict", async () => {
    approveCareCheckin.mockRejectedValue(
      new ApiError("CARE_STATUS_INVALID", "打卡状态已变化", 409),
    );
    getCareCheckin
      .mockResolvedValueOnce(makeCheckin())
      .mockResolvedValue(makeCheckin({ status: "APPROVED" }));

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );
    await confirmPopover("确认通过");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "记录已被处理，已刷新最新状态",
      ),
    );
    await waitFor(() => expect(getCareCheckin).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(listCareCheckins).toHaveBeenCalledTimes(2));
  });

  it("closes the drawer and refreshes the list when the checkin is gone", async () => {
    approveCareCheckin.mockRejectedValue(
      new ApiError("CARE_CHECKIN_NOT_FOUND", "养护打卡不存在", 404),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    fireEvent.click(
      within(drawerElement()).getByRole("button", { name: /通\s*过/ }),
    );
    await confirmPopover("确认通过");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "打卡记录不存在或已被删除",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByText("凭证版本")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(listCareCheckins).toHaveBeenCalledTimes(2));
  });

  it("shows processed checkins as read-only", async () => {
    getCareCheckin.mockResolvedValue(
      makeCheckin({
        status: "APPROVED",
        submissions: [
          makeSubmission({ status: "APPROVED", awardedPoints: 10 }),
        ],
      }),
    );

    renderPage();
    await screen.findByText("CHK-001");
    await openDetail();

    const drawer = drawerElement();
    expect(
      within(drawer).queryByRole("button", { name: /通\s*过/ }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("button", { name: /驳\s*回/ }),
    ).not.toBeInTheDocument();
  });

  it("renders an unknown status without crashing or leaving it blank", async () => {
    listCareCheckins.mockResolvedValue([
      makeCheckin({ status: "UNKNOWN_STATE" }),
    ]);

    renderPage();

    expect(await screen.findByText("UNKNOWN_STATE")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
