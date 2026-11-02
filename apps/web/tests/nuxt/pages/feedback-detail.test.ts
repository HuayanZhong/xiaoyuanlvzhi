import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  closeFeedback,
  getFeedback,
  type FeedbackView,
} from "~/utils/feedback-api";
import FeedbackDetailPage from "../../../app/pages/feedback/[id].vue";

vi.mock("~/utils/feedback-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/feedback-api")>();

  return { ...actual, getFeedback: vi.fn(), closeFeedback: vi.fn() };
});

const getMock = vi.mocked(getFeedback);
const closeMock = vi.mocked(closeFeedback);
const mounted: Array<{ unmount: () => void }> = [];

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

function feedback(overrides: Partial<FeedbackView> = {}): FeedbackView {
  return {
    id: 5,
    feedbackNo: "FB-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    type: "PLANT_ISSUE",
    relatedType: "ADOPTION",
    relatedId: "12",
    description: "叶片发黄，不知道如何处理",
    imageFileIds: [3],
    status: "REPLIED",
    adminReply: "已联系养护人员，请减少浇水频率",
    handlerEmail: "admin@qq.com",
    handledAt: "2026-11-02T10:00:00",
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-02T10:00:00",
    timeline: [
      {
        id: 1,
        actorId: 2,
        actorEmail: "student@qq.com",
        fromStatus: null,
        toStatus: "PENDING",
        message: "学生提交反馈",
        createdAt: "2026-11-01T09:00:00",
      },
      {
        id: 2,
        actorId: 1,
        actorEmail: "admin@qq.com",
        fromStatus: "PENDING",
        toStatus: "REPLIED",
        message: "已联系养护人员，请减少浇水频率",
        createdAt: "2026-11-02T10:00:00",
      },
    ],
    ...overrides,
  };
}

async function mountPage(route = "/feedback/5") {
  const wrapper = await mountSuspended(FeedbackDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
}

type ClickableScope = {
  findAll(selector: string): Array<{
    text(): string;
    trigger(event: string): Promise<void>;
  }>;
};

async function clickText(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  label: string,
  scope?: ClickableScope,
) {
  const root = scope ?? wrapper;
  const button = root.findAll("button").find((item) => item.text() === label);

  expect(button).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}

describe("feedback detail page", () => {
  beforeEach(() => {
    getMock.mockReset();
    closeMock.mockReset();
    navigateToMock.mockReset();
    clearNuxtData();
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("renders the feedback, reply and timeline without handler details", async () => {
    getMock.mockResolvedValue(feedback());
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("FB-1A2B3C4D");
    expect(wrapper.text()).toContain("绿植问题");
    expect(wrapper.text()).toContain("领养申请 #12");
    expect(wrapper.text()).toContain("叶片发黄");
    expect(wrapper.text()).toContain("已回复");
    expect(wrapper.text()).toContain("已联系养护人员，请减少浇水频率");
    expect(wrapper.text()).toContain("处理记录");
    expect(wrapper.text()).not.toContain("admin@qq.com");
    expect(getMock).toHaveBeenCalledWith(5);
  });

  it("explains when the feedback cannot be viewed", async () => {
    getMock.mockRejectedValue(new ApiError("NOT_FOUND", "反馈不存在", 404));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看这条反馈");
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/feedback");
  });

  it("closes a replied feedback after confirmation", async () => {
    getMock
      .mockResolvedValueOnce(feedback())
      .mockResolvedValueOnce(feedback({ status: "CLOSED" }));
    closeMock.mockResolvedValue(feedback({ status: "CLOSED" }));
    const wrapper = await mountPage();
    await flushPromises();

    await clickText(wrapper, "关闭反馈");
    const dialog = wrapper.get('[role="dialog"]');
    await clickText(wrapper, "确认关闭", dialog);

    expect(closeMock).toHaveBeenCalledWith(5);
    expect(wrapper.text()).toContain("已关闭");
    expect(wrapper.text()).not.toContain("关闭反馈");
  });

  it("refreshes the detail when the status already changed", async () => {
    getMock.mockResolvedValue(feedback());
    closeMock.mockRejectedValue(
      new ApiError("FEEDBACK_STATUS_INVALID", "该反馈当前不能关闭", 409),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickText(wrapper, "关闭反馈");
    const dialog = wrapper.get('[role="dialog"]');
    await clickText(wrapper, "确认关闭", dialog);

    expect(wrapper.text()).toContain("该反馈当前不能关闭");
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("hides the close action unless the feedback was replied", async () => {
    getMock.mockResolvedValue(feedback({ status: "IN_PROGRESS" }));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).not.toContain("关闭反馈");
    expect(wrapper.text()).toContain("处理中");
  });
});
