import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getApplication,
  requestCancelApplication,
  requestReturnApplication,
  resubmitApplication,
  withdrawApplication,
  type AdoptionApplication,
} from "~/utils/adoption-api";
import AdoptionDetailPage from "../../../app/pages/adoptions/[id].vue";

vi.mock("~/utils/adoption-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/adoption-api")>();

  return {
    ...actual,
    getApplication: vi.fn(),
    withdrawApplication: vi.fn(),
    resubmitApplication: vi.fn(),
    requestCancelApplication: vi.fn(),
    requestReturnApplication: vi.fn(),
    listApplications: vi.fn(),
  };
});

const loadMock = vi.mocked(getApplication);
const withdrawMock = vi.mocked(withdrawApplication);
const resubmitMock = vi.mocked(resubmitApplication);
const cancelMock = vi.mocked(requestCancelApplication);
const returnMock = vi.mocked(requestReturnApplication);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage(route = "/adoptions/9") {
  const wrapper = await mountSuspended(AdoptionDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
}

function application(
  overrides: Partial<AdoptionApplication> = {},
): AdoptionApplication {
  return {
    id: 9,
    applicationNo: "ADP-9",
    speciesId: 3,
    speciesName: "绿萝",
    studentId: 2,
    studentEmail: "student@qq.com",
    note: null,
    status: "PENDING_REVIEW",
    reviewReason: null,
    plantId: null,
    plantCode: null,
    plantLocation: null,
    pickupDeadline: null,
    handedOverAt: null,
    endedAt: null,
    returnReason: null,
    returnResult: null,
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-01T09:00:00",
    timeline: [
      {
        fromStatus: null,
        toStatus: "PENDING_REVIEW",
        reason: null,
        createdAt: "2026-10-01T09:00:00",
      },
    ],
    ...overrides,
  };
}

function findButton(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  text: string,
) {
  return wrapper.findAll("button").find((item) => item.text() === text);
}

describe("adoption detail page", () => {
  beforeEach(() => {
    loadMock.mockReset();
    withdrawMock.mockReset();
    resubmitMock.mockReset();
    cancelMock.mockReset();
    returnMock.mockReset();
    clearNuxtData();
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("renders the status timeline and record", async () => {
    loadMock.mockResolvedValue(
      application({
        plantCode: "PLANT-001",
        plantLocation: "图书馆一楼",
        pickupDeadline: "2026-10-08T18:00:00",
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("待审核");
    expect(wrapper.text()).toContain("提交申请");
    expect(wrapper.text()).toContain("PLANT-001");
    expect(wrapper.text()).toContain("图书馆一楼");
    expect(wrapper.text()).toContain("2026.10.08 18:00");
  });

  it.each([
    ["PENDING_REVIEW", "待审核", "撤回申请"],
    ["REJECTED", "已驳回", "修改备注后重提"],
    ["WAITING_PICKUP", "待领取", "取消申请"],
    ["ACTIVE", "养护中", "申请归还"],
  ])("shows the allowed action for %s", async (status, label, action) => {
    loadMock.mockResolvedValue(application({ status }));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain(label);
    expect(findButton(wrapper, action)).toBeDefined();
    expect(
      wrapper.findAll("button").filter((item) => item.text() === "撤回申请"),
    ).toHaveLength(action === "撤回申请" ? 1 : 0);
  });

  it("links active adoptions to my plants", async () => {
    loadMock.mockResolvedValue(application({ status: "ACTIVE" }));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.get(".adoption-detail__care-link").attributes("href")).toBe(
      "/my-plants",
    );
  });

  it.each(["CANCEL_REVIEW", "RETURN_REVIEW", "ENDED", "CANCELLED"])(
    "keeps %s read-only",
    async (status) => {
      loadMock.mockResolvedValue(application({ status }));
      const wrapper = await mountPage();
      await flushPromises();

      expect(wrapper.text()).toContain("当前状态只能查看");
    },
  );

  it("withdraws after confirmation", async () => {
    loadMock.mockResolvedValue(application());
    withdrawMock.mockResolvedValue(application({ status: "CANCELLED" }));
    const wrapper = await mountPage();
    await flushPromises();

    await findButton(wrapper, "撤回申请")!.trigger("click");
    await flushPromises();
    await wrapper.get(".ui-confirm__title");
    await findButton(wrapper, "撤回")!.trigger("click");
    await flushPromises();

    expect(withdrawMock).toHaveBeenCalledWith(9);
    expect(loadMock).toHaveBeenCalledTimes(2);
  });

  it("resubmits with an edited note", async () => {
    loadMock.mockResolvedValue(
      application({ status: "REJECTED", note: "旧备注" }),
    );
    resubmitMock.mockResolvedValue(application({ status: "PENDING_REVIEW" }));
    const wrapper = await mountPage();
    await flushPromises();

    await findButton(wrapper, "修改备注后重提")!.trigger("click");
    expect(
      (wrapper.get("#resubmit-note").element as HTMLTextAreaElement).value,
    ).toBe("旧备注");

    await wrapper.get("#resubmit-note").setValue("新备注");
    await wrapper.get(".adoption-detail__form").trigger("submit");
    await flushPromises();

    expect(resubmitMock).toHaveBeenCalledWith(9, "新备注");
    expect(loadMock).toHaveBeenCalledTimes(2);
  });

  it("requires a 5-character reason before cancelling", async () => {
    loadMock.mockResolvedValue(application({ status: "WAITING_PICKUP" }));
    cancelMock.mockResolvedValue(application({ status: "CANCEL_REVIEW" }));
    const wrapper = await mountPage();
    await flushPromises();

    await findButton(wrapper, "取消申请")!.trigger("click");
    expect(wrapper.text()).not.toContain("原因需要 5 到 200 字");

    await wrapper.get("#action-reason").setValue("太短");
    await wrapper.get(".adoption-detail__form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("原因需要 5 到 200 字");
    expect(cancelMock).not.toHaveBeenCalled();

    await wrapper.get("#action-reason").setValue("临时调整宿舍");
    await wrapper.get(".adoption-detail__form").trigger("submit");
    await flushPromises();

    expect(cancelMock).toHaveBeenCalledWith(9, "临时调整宿舍");
  });

  it("keeps the note and explains a failed resubmit", async () => {
    loadMock.mockResolvedValue(
      application({ status: "REJECTED", note: "旧备注" }),
    );
    resubmitMock.mockRejectedValue(new Error("conflict"));
    const wrapper = await mountPage();
    await flushPromises();

    await findButton(wrapper, "修改备注后重提")!.trigger("click");
    await wrapper.get("#resubmit-note").setValue("新备注");
    await wrapper.get(".adoption-detail__form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("请求失败，请稍后重试");
    expect(
      (wrapper.get("#resubmit-note").element as HTMLTextAreaElement).value,
    ).toBe("新备注");
    expect(findButton(wrapper, "刷新详情")).toBeDefined();
  });

  it("explains an unreadable application", async () => {
    loadMock.mockRejectedValueOnce(new Error("gone"));
    loadMock.mockResolvedValueOnce(application());
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看该申请");

    await findButton(wrapper, "重试")!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝");
  });
});
