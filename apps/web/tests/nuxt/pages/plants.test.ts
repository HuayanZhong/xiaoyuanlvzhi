import { flushPromises } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { listSpecies } from "~/utils/plant-api";
import PlantsPage from "../../../app/pages/plants/index.vue";

vi.mock("~/utils/plant-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/plant-api")>();

  return { ...actual, listSpecies: vi.fn(), getSpecies: vi.fn() };
});

vi.mock("~/composables/useFileUrl", () => ({
  useFileUrl: () => ({
    url: null,
    loading: false,
    error: false,
    retry: vi.fn(),
  }),
}));

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}));

mockNuxtImport("navigateTo", () => navigateToMock);

const speciesMock = vi.mocked(listSpecies);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage(route?: string) {
  const wrapper = await mountSuspended(
    PlantsPage,
    route ? { route } : undefined,
  );

  mounted.push(wrapper);

  return wrapper;
}

function species(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "绿萝",
    difficulty: "EASY",
    lightDescription: "散射光",
    waterDescription: "保持湿润",
    careIntervalDays: 7,
    carePoints: 10,
    otherDescription: null,
    coverFileId: null,
    availableCount: 3,
    enabled: true,
    updatedAt: "2026-10-01T09:00:00",
    ...overrides,
  };
}

describe("plants page", () => {
  beforeEach(() => {
    speciesMock.mockReset();
    navigateToMock.mockReset();
    clearNuxtData("plants-catalog");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("renders the available species with difficulty and count", async () => {
    speciesMock.mockResolvedValue([species()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("绿萝");
    expect(wrapper.text()).toContain("容易");
    expect(wrapper.text()).toContain("3");
    expect(wrapper.text()).toContain("SP-001");
    expect(wrapper.text()).toContain("散射光");
    expect(wrapper.text()).toContain("保持湿润");
    expect(wrapper.text()).toContain("每 7 天");
    expect(wrapper.get(".plants-page__visual img").attributes("src")).toContain(
      "/images/",
    );
    expect(wrapper.text()).toContain("我的申请");
  });

  it("uses the dense five-column gallery for five species", async () => {
    speciesMock.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) =>
        species({ id: index + 1, name: `品种 ${index + 1}` }),
      ),
    );
    const wrapper = await mountPage();
    await flushPromises();

    const items = wrapper.findAll(".plants-page__item");

    expect(items).toHaveLength(5);
    expect(wrapper.get(".plants-page__grid").classes()).toContain(
      "plants-page__grid--dense",
    );
    expect(
      items.some((item) => item.classes().some((name) => name.includes("--"))),
    ).toBe(false);
  });

  it("writes filters back to the URL", async () => {
    speciesMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("#plants-keyword").setValue(" 绿萝 ");
    await wrapper.get("#plants-location").setValue("图书馆");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: "/plants", query: { keyword: "绿萝", location: "图书馆" } },
      { replace: true },
    );
  });

  it("applies difficulty and availability filters from the catalog toolbar", async () => {
    speciesMock.mockResolvedValue([
      species({ id: 1, name: "绿萝", difficulty: "EASY" }),
      species({ id: 2, name: "龟背竹", difficulty: "HARD" }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    const challenge = wrapper
      .findAll(".plants-page__filter-chip")
      .find((item) => item.text().startsWith("挑战"));
    await challenge!.trigger("click");
    await flushPromises();

    expect(navigateToMock).toHaveBeenLastCalledWith(
      { path: "/plants", query: { difficulty: "HARD" } },
      { replace: true },
    );

    await wrapper.get(".plants-page__stock-toggle").trigger("click");
    await flushPromises();

    expect(navigateToMock).toHaveBeenLastCalledWith(
      { path: "/plants", query: { difficulty: "HARD", available: "1" } },
      { replace: true },
    );
  });

  it("filters the catalog locally from URL difficulty", async () => {
    speciesMock.mockResolvedValue([
      species({ id: 1, name: "绿萝", difficulty: "EASY" }),
      species({ id: 2, name: "龟背竹", difficulty: "HARD" }),
    ]);
    const wrapper = await mountPage("/plants?difficulty=EASY");
    await flushPromises();

    expect(wrapper.findAll(".plants-page__item")).toHaveLength(1);
    expect(wrapper.text()).toContain("绿萝");
    expect(wrapper.text()).not.toContain("龟背竹");
  });

  it("explains an empty catalog and links home", async () => {
    speciesMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("暂无可领养品种");
    expect(wrapper.get(".plants-page__home-link").attributes("href")).toBe("/");
  });

  it("offers to clear filters when nothing matches", async () => {
    speciesMock.mockResolvedValue([]);
    const wrapper = await mountPage("/plants?keyword=不存在");
    await flushPromises();

    expect(wrapper.text()).toContain("没有符合条件的品种");
    expect(speciesMock).toHaveBeenCalledWith({
      keyword: "不存在",
      location: "",
    });

    const clear = wrapper
      .findAll("button")
      .find((item) => item.text() === "清空筛选");
    await clear!.trigger("click");
    await flushPromises();

    expect(navigateToMock).toHaveBeenCalledWith(
      { path: "/plants", query: {} },
      { replace: true },
    );
  });

  it("shows a retryable error", async () => {
    speciesMock.mockRejectedValueOnce(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    speciesMock.mockResolvedValueOnce([species()]);
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
