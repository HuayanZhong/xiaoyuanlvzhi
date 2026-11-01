import { flushPromises } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  listCheckins,
  listEligiblePlants,
  submitCheckin,
  type CareCheckin,
  type CareEligiblePlant,
} from "~/utils/care-api";
import PlantCarePage from "../../../app/pages/my-plants/[plantId].vue";

vi.mock("~/utils/care-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/care-api")>();

  return {
    ...actual,
    listEligiblePlants: vi.fn(),
    listCheckins: vi.fn(),
    submitCheckin: vi.fn(),
  };
});

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

const plantsMock = vi.mocked(listEligiblePlants);
const checkinsMock = vi.mocked(listCheckins);
const submitMock = vi.mocked(submitCheckin);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage(route = "/my-plants/10") {
  const wrapper = await mountSuspended(PlantCarePage, { route });
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

function checkin(overrides: Partial<CareCheckin> = {}): CareCheckin {
  return {
    id: 7,
    checkinNo: "CARE-7",
    studentId: 2,
    studentEmail: "student@qq.com",
    plantId: 10,
    plantCode: "PLANT-010",
    plantName: "绿萝 · PLANT-010",
    location: "图书馆一楼",
    status: "REJECTED",
    latestVersion: 1,
    createdAt: "2026-10-28T09:00:00",
    updatedAt: "2026-10-28T09:00:00",
    submissions: [],
    ...overrides,
  };
}

describe("plant care page", () => {
  beforeEach(() => {
    plantsMock.mockReset();
    checkinsMock.mockReset();
    submitMock.mockReset();
    navigateToMock.mockReset();
    clearNuxtData("plant-care:10");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("shows the plant and its check-in history", async () => {
    plantsMock.mockResolvedValue([plant()]);
    checkinsMock.mockResolvedValue([
      checkin(),
      checkin({ id: 8, plantId: 11, checkinNo: "CARE-8" }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("PLANT-010");
    expect(wrapper.text()).toContain("图书馆一楼");
    expect(wrapper.text()).toContain("CARE-7");
    expect(wrapper.text()).not.toContain("CARE-8");
    expect(wrapper.text()).toContain("已驳回");
  });

  it("submits a note and opens the new check-in", async () => {
    plantsMock.mockResolvedValue([plant()]);
    checkinsMock.mockResolvedValue([]);
    submitMock.mockResolvedValue(checkin({ id: 9, status: "PENDING_REVIEW" }));
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("今天浇水并擦拭叶片");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(submitMock).toHaveBeenCalledWith({
      plantId: 10,
      note: "今天浇水并擦拭叶片",
    });
    expect(navigateToMock).toHaveBeenCalledWith("/care/9");
  });

  it("requires a note or an image", async () => {
    plantsMock.mockResolvedValue([plant()]);
    checkinsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("请至少填写打卡说明或上传一张凭证图片");
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("rejects notes longer than 300 characters", async () => {
    plantsMock.mockResolvedValue([plant()]);
    checkinsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("字".repeat(301));
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("说明最多 300 字");
    expect(submitMock).not.toHaveBeenCalled();
  });

  it("explains a conflict and reloads the plant", async () => {
    plantsMock.mockResolvedValue([plant()]);
    checkinsMock.mockResolvedValue([]);
    submitMock.mockRejectedValue(
      new ApiError(
        "CARE_INTERVAL_NOT_REACHED",
        "还未到下一次打卡时间，请按养护间隔照顾绿植",
      ),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("今天浇水");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("还未到下一次打卡时间");
    expect(plantsMock).toHaveBeenCalledTimes(2);
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it("blocks the form while a check-in is pending", async () => {
    plantsMock.mockResolvedValue([
      plant({
        eligible: false,
        pendingCheckinId: 5,
        blockedReason: "已有待审核打卡",
      }),
    ]);
    checkinsMock.mockResolvedValue([
      checkin({ id: 5, status: "PENDING_REVIEW" }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.find("form").exists()).toBe(false);
    expect(wrapper.text()).toContain("已有待审核打卡");
    expect(
      wrapper
        .findAll("a")
        .some((item) => item.attributes("href") === "/care/5"),
    ).toBe(true);
  });

  it("explains when the plant is not in care", async () => {
    plantsMock.mockResolvedValue([]);
    checkinsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("当前不可养护");
  });
});
