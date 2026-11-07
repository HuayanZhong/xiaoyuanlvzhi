import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import type { CareCheckin, CareEligiblePlant } from "~/utils/care-api";
import {
  loadHomeOverview,
  type HomeOverview,
  type PendingGroup,
} from "~/utils/home-overview";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { listPointLedger, type PointLedgerEntry } from "~/utils/point-api";
import { getStudentProfile, type StudentProfile } from "~/utils/profile-api";
import type { EcoTask } from "~/utils/task-api";
import HomePage from "../../../app/pages/index.vue";

vi.mock("~/utils/profile-api", () => ({
  getStudentProfile: vi.fn(),
}));

vi.mock("~/utils/notification-api", () => ({
  loadNotificationSnapshot: vi.fn(),
}));

vi.mock("~/utils/home-overview", () => ({
  loadHomeOverview: vi.fn(),
}));

vi.mock("~/utils/point-api", () => ({
  listPointLedger: vi.fn(),
}));

const profileMock = vi.mocked(getStudentProfile);
const notificationMock = vi.mocked(loadNotificationSnapshot);
const overviewMock = vi.mocked(loadHomeOverview);
const pointLedgerMock = vi.mocked(listPointLedger);

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 2,
    email: "student@qq.com",
    role: "STUDENT",
    status: "ACTIVE",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    phone: "13800138000",
    pointsBalance: 120,
    activeAdoptionCount: 2,
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-01T09:00:00",
    ...overrides,
  };
}

function overview(overrides: Partial<HomeOverview> = {}): HomeOverview {
  return {
    pendingGroups: [],
    pendingError: "",
    tasks: [],
    tasksError: "",
    plants: [],
    plantsError: "",
    recentCheckins: [],
    ...overrides,
  };
}

function pendingGroup(overrides: Partial<PendingGroup> = {}): PendingGroup {
  return {
    key: "care-pending",
    label: "待审核打卡",
    count: 2,
    to: "/care/12",
    record: "CARE-1A2B3C4D",
    ...overrides,
  };
}

function task(overrides: Partial<EcoTask> = {}): EcoTask {
  return {
    id: 7,
    title: "垃圾分类宣传",
    coverFileId: null,
    details: "在食堂门口宣传垃圾分类",
    startsAt: "2026-11-01T09:00:00",
    endsAt: "2026-11-10T09:00:00",
    maxParticipants: 20,
    participantCount: 5,
    approvedCount: 0,
    pointsPerPerson: 20,
    requireText: true,
    requirePhoto: false,
    status: "ONGOING",
    currentUserParticipating: false,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

function plant(overrides: Partial<CareEligiblePlant> = {}): CareEligiblePlant {
  return {
    plantId: 10,
    plantCode: "PLANT-001",
    plantName: "绿萝 · PLANT-001",
    location: "图书馆一楼",
    careIntervalDays: 7,
    lastApprovedAt: "2026-10-20T09:00:00",
    nextEligibleAt: "2026-10-27T09:00:00",
    eligible: true,
    pendingCheckinId: null,
    pendingSubmittedAt: null,
    blockedReason: null,
    ...overrides,
  };
}

function pointEntry(
  overrides: Partial<PointLedgerEntry> = {},
): PointLedgerEntry {
  return {
    id: 8,
    accountId: 2,
    studentEmail: "student@qq.com",
    deltaPoints: 10,
    balanceAfter: 120,
    sourceType: "ECO_TASK",
    sourceId: "7",
    reason: "环保任务凭证审核通过",
    actorEmail: null,
    createdAt: "2026-10-31T02:31:58",
    ...overrides,
  };
}

function checkin(overrides: Partial<CareCheckin> = {}): CareCheckin {
  return {
    id: 6,
    checkinNo: "CARE-001",
    studentId: 2,
    studentEmail: "student@qq.com",
    plantId: 10,
    plantCode: "PLANT-001",
    plantName: "绿萝 · PLANT-001",
    location: "图书馆一楼",
    status: "APPROVED",
    latestVersion: 1,
    createdAt: "2026-10-30T12:58:23",
    updatedAt: "2026-10-30T12:58:23",
    submissions: [],
    ...overrides,
  };
}

describe("home page", () => {
  beforeEach(() => {
    profileMock.mockReset();
    notificationMock.mockReset();
    overviewMock.mockReset();
    pointLedgerMock.mockReset();
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "",
    });
    overviewMock.mockResolvedValue(overview());
    pointLedgerMock.mockResolvedValue([]);
    clearNuxtData();
  });

  it("shows the student name, points and active plant count", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.get(".plant-ledger").attributes("href")).toBe("/my-plants");
    expect(wrapper.get(".points-card a").attributes("href")).toBe("/points");
  });

  it("renders the new asymmetric home sections", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.get(".home-panel--care").text()).toContain(
      "你的植物今天需要什么",
    );
    expect(wrapper.get(".home-panel--tasks").text()).toContain(
      "让今天多一点绿色行动",
    );
    expect(wrapper.get(".home-panel--plants").text()).toContain("我的绿植");
  });

  it("explains an empty plant count instead of showing a bare zero", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 0 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("还没有在养绿植");
    expect(wrapper.text()).toContain("从一株适合你的植物开始。");
    expect(wrapper.get(".care-empty").attributes("href")).toBe("/plants");
  });

  it("hides the zero-value note when the student has active plants", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 1 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).not.toContain("从一株适合你的植物开始。");
    expect(wrapper.get(".plant-ledger").attributes("href")).toBe("/my-plants");
  });

  it("falls back to the student number when the name is empty", async () => {
    profileMock.mockResolvedValue(profile({ fullName: null }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，20260001");
  });

  it("shows a retryable error and recovers on retry", async () => {
    profileMock.mockRejectedValueOnce(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    profileMock.mockResolvedValueOnce(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
  });

  it("shows the unread notification count and links to notifications", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [
        {
          id: 1,
          title: "环保任务已完成",
          summary: "任务凭证审核通过，获得 10 积分。",
          businessType: "TASK",
          businessId: "7",
          readAt: null,
          createdAt: "2026-10-31T02:31:58",
        },
        {
          id: 2,
          title: "养护打卡已通过",
          summary: "绿萝的养护记录已经更新。",
          businessType: "CARE",
          businessId: "6",
          readAt: "2026-10-30T12:00:00",
          createdAt: "2026-10-30T12:00:00",
        },
      ],
      unreadCount: 3,
      errorMessage: "",
    });
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("3 条未读");
    expect(wrapper.get(".message-row").attributes("href")).toBe(
      "/notifications",
    );
    expect(wrapper.findAll(".notification-preview__row")).toHaveLength(2);
    expect(wrapper.text()).toContain("环保任务已完成");
    expect(wrapper.text()).toContain("养护打卡已通过");
  });

  it("keeps the home summary when notifications fail", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "无法连接后端服务，请稍后重试",
    });
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("暂时不可用");
  });

  it("explains when there are no unread notifications", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无未读");
  });

  it("shows pending groups with counts and record links", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock.mockResolvedValue(
      overview({
        pendingGroups: [
          pendingGroup(),
          pendingGroup({
            key: "task-rejected",
            label: "待重提 · 任务",
            count: 1,
            to: "/tasks/7",
            record: "垃圾分类宣传",
          }),
        ],
      }),
    );
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("待审核打卡");
    expect(wrapper.text()).toContain("CARE-1A2B3C4D");
    expect(wrapper.text()).toContain("待重提 · 任务");
    const links = wrapper
      .findAll(".pending-row")
      .map((item) => item.attributes("href"));

    expect(links).toEqual(["/care/12", "/tasks/7"]);
  });

  it("does not render a pending panel when there are no pending items", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.find(".home-panel--pending").exists()).toBe(false);
  });

  it("retries the overview after a pending error", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock
      .mockResolvedValueOnce(
        overview({ pendingError: "无法连接后端服务，请稍后重试" }),
      )
      .mockResolvedValueOnce(overview({ pendingGroups: [pendingGroup()] }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("待审核打卡");
    expect(wrapper.text()).not.toContain("无法连接后端服务");
  });

  it("shows joinable tasks with points and remaining quota", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock.mockResolvedValue(
      overview({
        tasks: [
          task(),
          task({ id: 8, title: "旧书回收", pointsPerPerson: 15 }),
          task({ id: 9, title: "绿植养护讲座" }),
        ],
      }),
    );
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("垃圾分类宣传");
    expect(wrapper.text()).toContain("20 分 · 剩余 15 个名额");
    expect(wrapper.get(".home-panel--tasks").text()).toContain("垃圾分类宣传");
    expect(wrapper.findAll(".task-preview")).toHaveLength(3);
    expect(wrapper.get(".task-preview").attributes("href")).toBe("/tasks/7");
  });

  it("shows recent point changes while hiding test adjustments", async () => {
    profileMock.mockResolvedValue(profile());
    pointLedgerMock.mockResolvedValue([
      pointEntry({ id: 9, sourceType: "ADJUSTMENT", reason: "验收回滚" }),
      pointEntry(),
      pointEntry({
        id: 7,
        deltaPoints: -20,
        sourceType: "REDEMPTION",
        reason: "兑换奖励",
      }),
    ]);
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("环保任务");
    expect(wrapper.text()).toContain("+10");
    expect(wrapper.text()).toContain("兑换扣减");
    expect(wrapper.text()).toContain("-20");
    expect(wrapper.text()).not.toContain("验收回滚");
  });

  it("shows a task empty state with a list link", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("让今天多一点绿色行动");
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/tasks");
  });

  it("shows due plants with their care page links", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock.mockResolvedValue(
      overview({
        plants: [
          plant(),
          plant({ plantId: 11, plantName: "多肉 · PLANT-002" }),
        ],
      }),
    );
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝 · PLANT-001");
    expect(wrapper.text()).toContain("现在可以完成一次养护打卡");
    expect(wrapper.get(".care-feature").attributes("href")).toBe(
      "/my-plants/10",
    );
  });

  it("shows recent care records in the plant panel", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock.mockResolvedValue(
      overview({
        plants: [plant()],
        recentCheckins: [checkin()],
      }),
    );
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.get(".plant-history").text()).toContain("已通过");
    expect(wrapper.get(".plant-history__row").attributes("href")).toBe(
      "/care/6",
    );
  });

  it("shows a care reminder empty state", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("今天没有到期养护。");
  });

  it("keeps pending items when the task request fails", async () => {
    profileMock.mockResolvedValue(profile());
    overviewMock.mockResolvedValue(
      overview({
        pendingGroups: [pendingGroup()],
        tasksError: "任务暂时不可用",
      }),
    );
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("待审核打卡");
    expect(wrapper.text()).toContain("任务暂时不可用");
    expect(wrapper.text()).not.toContain("无法连接后端服务");
  });
});
