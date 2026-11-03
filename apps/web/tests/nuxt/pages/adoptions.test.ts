import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  listApplications,
  type AdoptionApplication,
} from "~/utils/adoption-api";
import AdoptionsPage from "../../../app/pages/adoptions/index.vue";

vi.mock("~/utils/adoption-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/adoption-api")>();

  return { ...actual, listApplications: vi.fn() };
});

const applicationsMock = vi.mocked(listApplications);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(AdoptionsPage);
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
    timeline: [],
    ...overrides,
  };
}

describe("adoptions page", () => {
  beforeEach(() => {
    applicationsMock.mockReset();
    clearNuxtData("adoptions-list");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists applications newest first with status and review reason", async () => {
    applicationsMock.mockResolvedValue([
      application({
        id: 1,
        applicationNo: "ADP-1",
        status: "ACTIVE",
        updatedAt: "2026-10-01T09:00:00",
      }),
      application({
        id: 2,
        applicationNo: "ADP-2",
        status: "REJECTED",
        reviewReason: "养护条件不明确",
        updatedAt: "2026-10-05T09:00:00",
      }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    const numbers = wrapper
      .findAll(".adoptions-page__no")
      .map((item) => item.text());

    expect(numbers).toEqual(["编号 ADP-2", "编号 ADP-1"]);
    expect(wrapper.text()).toContain("已驳回");
    expect(wrapper.text()).toContain("养护条件不明确");
    expect(wrapper.text()).toContain("养护中");
  });

  it("shows an empty state with a link to species", async () => {
    applicationsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("暂无领养申请");
    expect(wrapper.get(".adoptions-page__browse").attributes("href")).toBe(
      "/plants",
    );
  });

  it("shows a retryable error", async () => {
    applicationsMock.mockRejectedValueOnce(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    applicationsMock.mockResolvedValueOnce([application()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝");
  });
});
