import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  createFeedback,
  listFeedback,
  type FeedbackView,
} from "~/utils/feedback-api";
import { uploadImage } from "~/utils/upload-api";
import FeedbackPage from "../../../app/pages/feedback/index.vue";

vi.mock("~/utils/feedback-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/feedback-api")>();

  return { ...actual, createFeedback: vi.fn(), listFeedback: vi.fn() };
});

vi.mock("~/utils/upload-api", () => ({ uploadImage: vi.fn() }));

const listMock = vi.mocked(listFeedback);
const createMock = vi.mocked(createFeedback);
const uploadMock = vi.mocked(uploadImage);
const mounted: Array<{ unmount: () => void }> = [];

function feedback(overrides: Partial<FeedbackView> = {}): FeedbackView {
  return {
    id: 5,
    feedbackNo: "FB-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    type: "PLANT_ISSUE",
    relatedType: null,
    relatedId: null,
    description: "叶片发黄，不知道如何处理",
    imageFileIds: [],
    status: "PENDING",
    adminReply: null,
    handlerEmail: null,
    handledAt: null,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
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
    ],
    ...overrides,
  };
}

async function mountPage() {
  const wrapper = await mountSuspended(FeedbackPage, { route: "/feedback" });
  mounted.push(wrapper);

  return wrapper;
}

async function openForm(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  const button = wrapper
    .findAll("button")
    .find((item) => item.text() === "提交反馈");

  await button!.trigger("click");
  await flushPromises();
}

async function fillForm(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  {
    type = "PLANT_ISSUE",
    description = "叶片发黄，不知道如何处理",
    relatedType = "",
    relatedId = "",
  } = {},
) {
  await wrapper.get("#feedback-type").setValue(type);
  await wrapper.get("#feedback-description").setValue(description);
  await wrapper.get("#feedback-related-type").setValue(relatedType);
  await wrapper.get("#feedback-related-id").setValue(relatedId);
}

async function submitForm(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  await wrapper.get(".feedback-page__form").trigger("submit");
  await flushPromises();
}

describe("feedback page", () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
    uploadMock.mockReset();
    listMock.mockResolvedValue([]);
    clearNuxtData("feedback");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists the student's feedback", async () => {
    listMock.mockResolvedValue([feedback()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("FB-1A2B3C4D");
    expect(wrapper.text()).toContain("绿植问题");
    expect(wrapper.text()).toContain("待处理");
    expect(wrapper.text()).toContain("叶片发黄");
    expect(wrapper.get(".feedback-page__item").attributes("href")).toBe(
      "/feedback/5",
    );
  });

  it("shows an empty state with a submit action", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("还没有提交过反馈");
  });

  it("submits a feedback record and prepends it to the list", async () => {
    createMock.mockResolvedValue(
      feedback({ id: 6, feedbackNo: "FB-99999999" }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await fillForm(wrapper);
    await submitForm(wrapper);

    expect(createMock).toHaveBeenCalledWith({
      type: "PLANT_ISSUE",
      description: "叶片发黄，不知道如何处理",
    });
    expect(wrapper.text()).toContain("FB-99999999");
    expect(wrapper.text()).toContain("待处理");
    expect(wrapper.text()).toContain("查看反馈");
    expect(wrapper.find(".feedback-page__form").exists()).toBe(false);
  });

  it("validates the type and description before submitting", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await submitForm(wrapper);

    expect(createMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("请选择反馈类型");
    expect(wrapper.text()).toContain("问题描述至少 5 个字");
  });

  it("requires the related type and id together", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await fillForm(wrapper, { relatedType: "ADOPTION" });
    await submitForm(wrapper);

    expect(createMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("关联类型和编号需要同时填写或同时留空");
  });

  it("submits the related record when both fields are filled", async () => {
    createMock.mockResolvedValue(feedback());
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await fillForm(wrapper, {
      relatedType: "ADOPTION",
      relatedId: "12",
    });
    await submitForm(wrapper);

    expect(createMock).toHaveBeenCalledWith({
      type: "PLANT_ISSUE",
      description: "叶片发黄，不知道如何处理",
      relatedType: "ADOPTION",
      relatedId: "12",
    });
  });

  it("keeps the form when submission fails", async () => {
    createMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await fillForm(wrapper);
    await submitForm(wrapper);

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(wrapper.find(".feedback-page__form").exists()).toBe(true);
    expect(wrapper.get("#feedback-description").element).toHaveProperty(
      "value",
      "叶片发黄，不知道如何处理",
    );
  });

  it("does not submit twice while the request is pending", async () => {
    let resolve!: (value: FeedbackView) => void;
    createMock.mockReturnValue(
      new Promise<FeedbackView>((done) => {
        resolve = done;
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);
    await fillForm(wrapper);
    await wrapper.get(".feedback-page__form").trigger("submit");
    await wrapper.get(".feedback-page__form").trigger("submit");
    await flushPromises();

    expect(createMock).toHaveBeenCalledTimes(1);

    resolve(feedback());
    await flushPromises();
  });

  it("shows an upload failure without adding the image", async () => {
    uploadMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await openForm(wrapper);

    const input = wrapper.get('input[type="file"]');
    const file = new File(["image"], "leaf.png", { type: "image/png" });
    Object.defineProperty(input.element, "files", {
      value: [file],
      configurable: true,
    });
    await input.trigger("change");
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(wrapper.get(".ui-image-picker__counter").text()).toBe("0 / 3");
  });
});
