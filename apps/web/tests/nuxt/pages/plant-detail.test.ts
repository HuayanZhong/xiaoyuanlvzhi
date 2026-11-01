import { flushPromises } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createApplication,
  listApplications,
  type AdoptionApplication,
} from "~/utils/adoption-api";
import { getSpecies, type PlantSpecies } from "~/utils/plant-api";
import PlantDetailPage from "../../../app/pages/plants/[id].vue";

vi.mock("~/utils/plant-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/plant-api")>();

  return { ...actual, getSpecies: vi.fn(), listSpecies: vi.fn() };
});

vi.mock("~/utils/adoption-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/adoption-api")>();

  return {
    ...actual,
    listApplications: vi.fn(),
    createApplication: vi.fn(),
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

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

const speciesMock = vi.mocked(getSpecies);
const applicationsMock = vi.mocked(listApplications);
const createMock = vi.mocked(createApplication);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage(route = "/plants/3") {
  const wrapper = await mountSuspended(PlantDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
}

function species(overrides: Partial<PlantSpecies> = {}): PlantSpecies {
  return {
    id: 3,
    name: "绿萝",
    difficulty: "EASY",
    lightDescription: "散射光",
    waterDescription: "保持湿润",
    careIntervalDays: 7,
    carePoints: 10,
    otherDescription: null,
    coverFileId: null,
    availableCount: 2,
    enabled: true,
    updatedAt: "2026-10-01T09:00:00",
    ...overrides,
  };
}

function application(
  overrides: Partial<AdoptionApplication> = {},
): AdoptionApplication {
  return {
    id: 9,
    applicationNo: "ADP-1",
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

describe("plant detail page", () => {
  beforeEach(() => {
    speciesMock.mockReset();
    applicationsMock.mockReset();
    createMock.mockReset();
    navigateToMock.mockReset();
    clearNuxtData();
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("shows the care details and stock", async () => {
    speciesMock.mockResolvedValue(species());
    applicationsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝");
    expect(wrapper.text()).toContain("散射光");
    expect(wrapper.text()).toContain("7 天");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.text()).toContain("申请领养");
  });

  it("links to the pending application instead of applying again", async () => {
    speciesMock.mockResolvedValue(species());
    applicationsMock.mockResolvedValue([application()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("查看申请");
    expect(wrapper.find(".plant-detail__action-link").attributes("href")).toBe(
      "/adoptions/9",
    );
    expect(wrapper.text()).not.toContain("申请领养");
  });

  it("disables applying without stock", async () => {
    speciesMock.mockResolvedValue(species({ availableCount: 0 }));
    applicationsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    const button = wrapper
      .findAll("button")
      .find((item) => item.text() === "暂无可领养植株");

    expect(button?.attributes("disabled")).toBeDefined();
  });

  it("submits an application and opens its detail", async () => {
    speciesMock.mockResolvedValue(species());
    applicationsMock.mockResolvedValue([]);
    createMock.mockResolvedValue(application({ id: 42 }));
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "申请领养")!
      .trigger("click");
    await wrapper.get("#adoption-note").setValue("希望放在宿舍");
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "提交申请")!
      .trigger("click");
    await flushPromises();

    expect(createMock).toHaveBeenCalledWith({
      speciesId: 3,
      note: "希望放在宿舍",
    });
    expect(navigateToMock).toHaveBeenCalledWith("/adoptions/42");
  });

  it("blocks a note longer than 200 characters", async () => {
    speciesMock.mockResolvedValue(species());
    applicationsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "申请领养")!
      .trigger("click");
    await wrapper.get("#adoption-note").setValue("字".repeat(201));
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "提交申请")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("备注最多 200 字");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("explains an unreadable species and retries", async () => {
    speciesMock.mockRejectedValueOnce(new Error("gone"));
    speciesMock.mockResolvedValueOnce(species());
    applicationsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看该品种");
    expect(wrapper.get(".plant-detail__back").attributes("href")).toBe(
      "/plants",
    );

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝");
  });
});
