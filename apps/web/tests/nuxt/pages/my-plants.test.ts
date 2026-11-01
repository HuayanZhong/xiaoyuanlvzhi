import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { listEligiblePlants, type CareEligiblePlant } from "~/utils/care-api";
import MyPlantsPage from "../../../app/pages/my-plants/index.vue";

vi.mock("~/utils/care-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/care-api")>();

  return { ...actual, listEligiblePlants: vi.fn() };
});

const plantsMock = vi.mocked(listEligiblePlants);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(MyPlantsPage);
  mounted.push(wrapper);

  return wrapper;
}

function plant(overrides: Partial<CareEligiblePlant> = {}): CareEligiblePlant {
  return {
    plantId: 10,
    plantCode: "PLANT-010",
    plantName: "绿萝 · PLANT-010",
    location: "图书馆一楼",
    careIntervalDays: 7,
    lastApprovedAt: "2026-10-24T09:00:00",
    nextEligibleAt: "2026-10-31T09:00:00",
    eligible: true,
    pendingCheckinId: null,
    pendingSubmittedAt: null,
    blockedReason: null,
    ...overrides,
  };
}

describe("my plants page", () => {
  beforeEach(() => {
    plantsMock.mockReset();
    clearNuxtData("my-plants");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists active plants with care details", async () => {
    plantsMock.mockResolvedValue([plant()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("PLANT-010");
    expect(wrapper.text()).toContain("图书馆一楼");
    expect(wrapper.text()).toContain("7 天");
    expect(wrapper.text()).toContain("现在可以打卡");
    expect(wrapper.get(".my-plants-page__action").attributes("href")).toBe(
      "/my-plants/10",
    );
  });

  it("links a pending check-in to its detail", async () => {
    plantsMock.mockResolvedValue([
      plant({
        eligible: false,
        pendingCheckinId: 5,
        pendingSubmittedAt: "2026-10-30T09:00:00",
        blockedReason: "已有待审核打卡",
      }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("已有待审核打卡");
    expect(wrapper.get(".my-plants-page__action").attributes("href")).toBe(
      "/care/5",
    );
  });

  it("disables care until the interval is reached", async () => {
    plantsMock.mockResolvedValue([
      plant({
        eligible: false,
        nextEligibleAt: "2026-11-03T09:00:00",
        blockedReason: "尚未到养护间隔",
      }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("尚未到养护间隔");
    expect(wrapper.find(".my-plants-page__action").exists()).toBe(false);
    expect(wrapper.get(".my-plants-page__wait").text()).toContain("后可打卡");
  });

  it("shows an empty state with a link to the catalog", async () => {
    plantsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("暂无在养绿植");
    const links = wrapper
      .findAll(".my-plants-page__link")
      .map((item) => item.attributes("href"));
    expect(links).toContain("/plants");
  });

  it("shows a retryable error", async () => {
    plantsMock.mockRejectedValueOnce(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    plantsMock.mockResolvedValueOnce([plant()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("PLANT-010");
  });
});
