import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  getTask,
  joinTask,
  listParticipations,
  submitTaskEvidence,
  type EcoTask,
  type TaskParticipation,
  type TaskSubmission,
} from "~/utils/task-api";
import TaskDetailPage from "../../../app/pages/tasks/[id].vue";

vi.mock("~/utils/task-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/task-api")>();

  return {
    ...actual,
    getTask: vi.fn(),
    joinTask: vi.fn(),
    listParticipations: vi.fn(),
    submitTaskEvidence: vi.fn(),
  };
});

vi.mock("~/composables/useFileUrl", () => ({
  useFileUrl: () => ({
    url: null,
    loading: false,
    error: false,
    retry: vi.fn(),
  }),
}));

const getMock = vi.mocked(getTask);
const joinMock = vi.mocked(joinTask);
const participationsMock = vi.mocked(listParticipations);
const submitMock = vi.mocked(submitTaskEvidence);
const mounted: Array<{ unmount: () => void }> = [];

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

async function mountPage(route = "/tasks/3") {
  const wrapper = await mountSuspended(TaskDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
}

function task(overrides: Partial<EcoTask> = {}): EcoTask {
  return {
    id: 3,
    title: "校园垃圾分类宣传",
    coverFileId: null,
    details: "在食堂门口发放分类指引，并记录参与人数。",
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

function submission(overrides: Partial<TaskSubmission> = {}): TaskSubmission {
  return {
    id: 1,
    version: 1,
    note: "完成了两小时宣传",
    imageFileIds: [],
    status: "REJECTED",
    reviewReason: "照片不清晰，请重新上传",
    reviewerEmail: "admin@campus.test",
    submittedAt: "2026-11-02T09:00:00",
    reviewedAt: "2026-11-03T09:00:00",
    ...overrides,
  };
}

async function clickButton(
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

describe("task detail page", () => {
  beforeEach(() => {
    getMock.mockReset();
    joinMock.mockReset();
    participationsMock.mockReset();
    submitMock.mockReset();
    participationsMock.mockResolvedValue([]);
    navigateToMock.mockReset();
    clearNuxtData();
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("renders the task requirements and schedule", async () => {
    getMock.mockResolvedValue(task());
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("校园垃圾分类宣传");
    expect(wrapper.text()).toContain("在食堂门口发放分类指引");
    expect(getMock).toHaveBeenCalledWith(3);
    expect(wrapper.text()).toContain("进行中");
    expect(wrapper.text()).toContain("12 人");
    expect(wrapper.text()).toContain("38 个");
    expect(wrapper.text()).toContain("10 PT");
    expect(wrapper.text()).toContain("文字说明");
  });

  it("joins the task and shows the participation record", async () => {
    getMock.mockResolvedValue(task());
    joinMock.mockResolvedValue(participation());
    const wrapper = await mountPage();
    await flushPromises();

    participationsMock.mockResolvedValue([participation()]);

    await clickButton(wrapper, "参加任务");

    expect(joinMock).toHaveBeenCalledWith(3);
    expect(wrapper.text()).toContain("已报名");
    expect(wrapper.text()).toContain("报名时间");
  });

  it("disables joining when the task is full", async () => {
    getMock.mockResolvedValue(
      task({ maxParticipants: 5, participantCount: 5 }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    const button = wrapper
      .findAll("button")
      .find((item) => item.text() === "名额已满");

    expect(button).toBeDefined();
    expect(button!.attributes("disabled")).toBeDefined();
    expect(
      wrapper.findAll("button").some((item) => item.text() === "参加任务"),
    ).toBe(false);
  });

  it("disables joining before the task starts", async () => {
    getMock.mockResolvedValue(task({ status: "UPCOMING" }));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("尚未开始");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "参加任务"),
    ).toBe(false);
  });

  it("shows the existing participation instead of the join button", async () => {
    getMock.mockResolvedValue(task({ currentUserParticipating: true }));
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("已报名");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "参加任务"),
    ).toBe(false);
  });

  it("explains when the task is unavailable", async () => {
    getMock.mockRejectedValue(new ApiError("HTTP_ERROR", "请求失败", 404));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看这个任务");
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/tasks");
  });

  it("shows the server reason when joining is rejected", async () => {
    getMock.mockResolvedValue(
      task({ maxParticipants: 5, participantCount: 4 }),
    );
    joinMock.mockRejectedValue(
      new ApiError("TASK_FULL", "任务报名人数已满", 409),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "参加任务");

    expect(wrapper.text()).toContain("任务报名人数已满");
  });

  it("requires the configured text evidence", async () => {
    getMock.mockResolvedValue(task());
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("请填写任务完成说明");
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("requires a photo when the task asks for one", async () => {
    getMock.mockResolvedValue(task({ requireText: false, requirePhoto: true }));
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("请上传任务照片");
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("rejects notes longer than 500 characters", async () => {
    getMock.mockResolvedValue(task());
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("字".repeat(501));
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("说明最多 500 字");
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("explains when the task has no evidence requirements", async () => {
    getMock.mockResolvedValue(
      task({ requireText: false, requirePhoto: false }),
    );
    participationsMock.mockResolvedValue([participation()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("该任务未配置凭证要求");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("resubmits a rejected task and keeps both versions", async () => {
    getMock.mockResolvedValue(task());
    participationsMock.mockResolvedValue([
      participation({ status: "REJECTED", submissions: [submission()] }),
    ]);
    submitMock.mockResolvedValue(participation());
    const wrapper = await mountPage();
    await flushPromises();

    participationsMock.mockResolvedValue([
      participation({
        status: "PENDING_REVIEW",
        submissions: [
          submission(),
          submission({
            id: 2,
            version: 2,
            status: "PENDING_REVIEW",
            note: "补充了新的照片",
            reviewReason: null,
            reviewedAt: null,
          }),
        ],
      }),
    ]);

    await wrapper.get("textarea").setValue("补充了新的照片");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(submitMock).toHaveBeenCalledWith(7, { note: "补充了新的照片" });
    expect(wrapper.text()).toContain("第 1 次提交");
    expect(wrapper.text()).toContain("第 2 次提交");
    expect(wrapper.text()).toContain("待审核");
  });

  it("asks to refresh when the evidence was already reviewed", async () => {
    getMock.mockResolvedValue(task());
    participationsMock.mockResolvedValue([
      participation({ status: "REJECTED", submissions: [submission()] }),
    ]);
    submitMock.mockRejectedValue(
      new ApiError(
        "TASK_SUBMISSION_ALREADY_REVIEWED",
        "最新凭证已处理，请刷新后重试",
      ),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("补充说明");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("最新凭证已处理");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "刷新详情"),
    ).toBe(true);
  });
});
