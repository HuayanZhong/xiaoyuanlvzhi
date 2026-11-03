import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import type { CareEligiblePlant } from "~/utils/care-api";
import {
  loadHomeOverview,
  type HomeOverview,
  type PendingGroup,
} from "~/utils/home-overview";
import { loadNotificationSnapshot } from "~/utils/notification-api";
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

const profileMock = vi.mocked(getStudentProfile);
const notificationMock = vi.mocked(loadNotificationSnapshot);
const overviewMock = vi.mocked(loadHomeOverview);

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

describe("home page", () => {
  beforeEach(() => {
    profileMock.mockReset();
    notificationMock.mockReset();
    overviewMock.mockReset();
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "",
    });
    overviewMock.mockResolvedValue(overview());
    clearNuxtData();
  });

  it("shows the student name, points and active plant count", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.get(".home-page__record").attributes("href")).toBe(
      "/my-plants",
    );
    expect(wrapper.get(".home-page__points-link").attributes("href")).toBe(
      "/points",
    );
  });

  it("renders the six home sections in order", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(
      wrapper.findAll(".ui-folio__title").map((item) => item.text()),
    ).toEqual([
      "我的绿植",
      "待处理事项",
      "当前积分",
      "环保任务",
      "养护提醒",
      "消息",
    ]);
  });

  it("explains an empty plant count instead of showing a bare zero", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 0 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无在养绿植");
    expect(wrapper.text()).toContain("领养一株后，这里会记录你的养护进度。");
    expect(wrapper.get(".home-page__browse").attributes("href")).toBe(
      "/plants",
    );
  });

  it("hides the zero-value note when the student has active plants", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 1 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).not.toContain(
      "领养一株后，这里会记录你的养护进度。",
    );
    expect(wrapper.get(".home-page__record").attributes("href")).toBe(
      "/my-plants",
    );
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
      items: [],
      unreadCount: 3,
      errorMessage: "",
    });
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("3 条未读");
    expect(wrapper.get(".home-page__message").attributes("href")).toBe(
      "/notifications",
    );
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
    expect(wrapper.text()).toContain("消息暂时不可用");
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
      .findAll(".home-page__pending-row")
      .map((item) => item.attributes("href"));

    expect(links).toEqual(["/care/12", "/tasks/7"]);
  });

  it("shows an empty state without pending items", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无待处理事项");
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
    expect(
      wrapper.findAll(".home-page__row").map((item) => item.attributes("href")),
    ).toContain("/tasks/7");
    expect(wrapper.text()).toContain("全部任务");
  });

  it("shows a task empty state with a list link", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无可报名任务");
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
    expect(wrapper.text()).toContain("图书馆一楼 · 可打卡");
    expect(
      wrapper.findAll(".home-page__row").map((item) => item.attributes("href")),
    ).toContain("/my-plants/10");
  });

  it("shows a care reminder empty state", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无到期养护");
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
