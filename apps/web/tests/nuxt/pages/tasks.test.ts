import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  listParticipations,
  listTasks,
  type EcoTask,
  type TaskParticipation,
} from "~/utils/task-api";
import TasksPage from "../../../app/pages/tasks/index.vue";

vi.mock("~/utils/task-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/task-api")>();

  return { ...actual, listTasks: vi.fn(), listParticipations: vi.fn() };
});

vi.mock("~/composables/useFileUrl", () => ({
  useFileUrl: () => ({
    url: null,
    loading: false,
    error: false,
    retry: vi.fn(),
  }),
}));

const tasksMock = vi.mocked(listTasks);
const participationsMock = vi.mocked(listParticipations);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(TasksPage, { route: "/tasks" });
  mounted.push(wrapper);

  return wrapper;
}

function task(overrides: Partial<EcoTask> = {}): EcoTask {
  return {
    id: 3,
    title: "校园垃圾分类宣传",
    coverFileId: null,
    details: "在食堂门口发放分类指引",
    startsAt: "2026-11-01T00:00:00",
    endsAt: "2026-11-30T00:00:00",
    maxParticipants: 50,
    participantCount: 12,
    approvedCount: 4,
    pointsPerPerson: 10,
    requireText: true,
    requirePhoto: false,
    status: "ONGOING",
    currentUserParticipating: false,
    createdAt: "2026-10-28T09:00:00",
    updatedAt: "2026-10-28T09:00:00",
    ...overrides,
  };
}

function participation(
  overrides: Partial<TaskParticipation> = {},
): TaskParticipation {
  return {
    id: 7,
    taskId: 3,
    taskTitle: "校园垃圾分类宣传",
    studentId: 2,
    studentEmail: "student@qq.com",
    status: "JOINED",
    joinedAt: "2026-11-01T09:00:00",
    submissions: [],
    ...overrides,
  };
}

async function clickFilter(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  label: string,
) {
  const button = wrapper
    .findAll("button")
    .find((item) => item.text() === label);

  expect(button).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}

describe("tasks page", () => {
  beforeEach(() => {
    tasksMock.mockReset();
    participationsMock.mockReset();
    participationsMock.mockResolvedValue([]);
    clearNuxtData("tasks");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists tasks with schedule, quota, reward and status", async () => {
    tasksMock.mockResolvedValue([task()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("校园垃圾分类宣传");
    expect(wrapper.text()).toContain("剩余名额");
    expect(wrapper.text()).toContain("38 / 50");
    expect(wrapper.text()).toContain("10 PT");
    expect(wrapper.text()).toContain("进行中");
    expect(wrapper.findAll(".tasks-page__filter")).toHaveLength(4);
    expect(wrapper.get(".tasks-page__action").attributes("href")).toBe(
      "/tasks/3",
    );
  });

  it("shows my participation status when a record exists", async () => {
    tasksMock.mockResolvedValue([task({ currentUserParticipating: true })]);
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("我的参与");
    expect(wrapper.text()).toContain("已报名");
  });

  it("filters to open tasks only", async () => {
    tasksMock.mockResolvedValue([
      task({ id: 1, title: "可以报名的任务" }),
      task({ id: 2, title: "还没开始的任务", status: "UPCOMING" }),
      task({
        id: 3,
        title: "已经满额的任务",
        maxParticipants: 5,
        participantCount: 5,
      }),
      task({ id: 4, title: "已经参加的任务", currentUserParticipating: true }),
    ]);
    participationsMock.mockResolvedValue([participation({ id: 9, taskId: 4 })]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("还没开始的任务");

    await clickFilter(wrapper, "可报名");

    expect(wrapper.text()).toContain("可以报名的任务");
    expect(wrapper.text()).not.toContain("还没开始的任务");
    expect(wrapper.text()).not.toContain("已经满额的任务");
    expect(wrapper.text()).not.toContain("已经参加的任务");
  });

  it("filters to joined and ended tasks", async () => {
    tasksMock.mockResolvedValue([
      task({ id: 1, title: "进行中的任务" }),
      task({ id: 2, title: "已经结束的任务", status: "ENDED" }),
      task({ id: 3, title: "我参加的任务", currentUserParticipating: true }),
    ]);
    participationsMock.mockResolvedValue([participation({ id: 9, taskId: 3 })]);
    const wrapper = await mountPage();
    await flushPromises();

    await clickFilter(wrapper, "已参加");
    expect(wrapper.text()).toContain("我参加的任务");
    expect(wrapper.text()).not.toContain("进行中的任务");
    expect(wrapper.text()).not.toContain("已经结束的任务");

    await clickFilter(wrapper, "已结束");
    expect(wrapper.text()).toContain("已经结束的任务");
    expect(wrapper.text()).not.toContain("我参加的任务");
  });

  it("shows an empty state for an empty filter result", async () => {
    tasksMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("当前筛选下暂无任务");
  });

  it("shows a retryable error", async () => {
    tasksMock
      .mockRejectedValueOnce(
        new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
      )
      .mockResolvedValueOnce([task()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("校园垃圾分类宣传");
  });
});
