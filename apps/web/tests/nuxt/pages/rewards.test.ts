import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { getPointsBalance } from "~/utils/point-api";
import { clearRewardCaches } from "~/utils/reward-cache";
import {
  listRewards,
  redeemReward,
  type RedemptionOrder,
  type Reward,
} from "~/utils/reward-api";
import RewardsPage from "../../../app/pages/rewards/index.vue";

vi.mock("~/utils/reward-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/reward-api")>();

  return { ...actual, listRewards: vi.fn(), redeemReward: vi.fn() };
});

vi.mock("~/utils/point-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/point-api")>();

  return { ...actual, getPointsBalance: vi.fn() };
});

vi.mock("~/utils/reward-cache", () => ({ clearRewardCaches: vi.fn() }));

vi.mock("~/composables/useFileUrl", () => ({
  useFileUrl: () => ({
    url: null,
    loading: false,
    error: false,
    retry: vi.fn(),
  }),
}));

const rewardsMock = vi.mocked(listRewards);
const balanceMock = vi.mocked(getPointsBalance);
const redeemMock = vi.mocked(redeemReward);
const cacheMock = vi.mocked(clearRewardCaches);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(RewardsPage, { route: "/rewards" });
  mounted.push(wrapper);

  return wrapper;
}

function reward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 4,
    name: "环保帆布袋",
    description: "校园环保主题帆布袋",
    imageFileIds: [],
    pointsCost: 50,
    availableStock: 20,
    reservedStock: 3,
    claimedCount: 5,
    remainingStock: 12,
    location: "学生活动中心 101",
    pickupDays: 7,
    enabled: true,
    createdAt: "2026-10-20T09:00:00",
    updatedAt: "2026-10-20T09:00:00",
    ...overrides,
  };
}

function order(overrides: Partial<RedemptionOrder> = {}): RedemptionOrder {
  return {
    id: 9,
    orderNo: "RDM-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    rewardId: 4,
    rewardName: "环保帆布袋",
    pointsCost: 50,
    status: "WAITING_PICKUP",
    location: "学生活动中心 101",
    pickupDeadline: "2026-11-08T23:59:00",
    reason: null,
    refundedAt: null,
    claimedAt: null,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
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

describe("rewards page", () => {
  beforeEach(() => {
    rewardsMock.mockReset();
    balanceMock.mockReset();
    redeemMock.mockReset();
    cacheMock.mockReset();
    rewardsMock.mockResolvedValue([reward()]);
    balanceMock.mockResolvedValue(382);
    clearNuxtData("rewards");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists rewards with cost, remaining stock and location", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("环保帆布袋");
    expect(wrapper.text()).toContain("50 分");
    expect(wrapper.text()).toContain("12 件");
    expect(wrapper.text()).toContain("学生活动中心 101");
    expect(wrapper.findAll(".ui-figure")).toHaveLength(0);
  });

  it("renders a cover when the reward has an image", async () => {
    rewardsMock.mockResolvedValue([reward({ imageFileIds: [21] })]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.findAll(".ui-figure")).toHaveLength(1);
  });

  it("shows an empty state without rewards", async () => {
    rewardsMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("暂时没有可兑换奖励");
  });

  it("shows a retryable error when rewards fail", async () => {
    rewardsMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "重试"),
    ).toBe(true);
  });

  it("disables redeeming when the balance is short", async () => {
    balanceMock.mockResolvedValue(20);
    const wrapper = await mountPage();
    await flushPromises();

    const button = wrapper
      .findAll("button")
      .find((item) => item.text() === "积分不足");

    expect(button).toBeDefined();
    expect(button!.attributes("disabled")).toBeDefined();
  });

  it("disables redeeming when the stock is gone", async () => {
    rewardsMock.mockResolvedValue([reward({ remainingStock: 0 })]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("库存不足");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "兑换"),
    ).toBe(false);
  });

  it("disables redeeming when the balance is unavailable", async () => {
    balanceMock.mockRejectedValue(
      new ApiError("UPSTREAM_ERROR", "服务暂时不可用，请稍后重试", 503),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("服务暂时不可用");
    expect(wrapper.text()).toContain("暂时无法核对积分");
  });

  it("opens a confirmation with the cost, remaining balance and pickup info", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "兑换");

    const dialog = wrapper.get('[role="alertdialog"]');
    expect(dialog.text()).toContain("环保帆布袋");
    expect(dialog.text()).toContain("扣除积分");
    expect(dialog.text()).toContain("50 分");
    expect(dialog.text()).toContain("332 分");
    expect(dialog.text()).toContain("学生活动中心 101");
    expect(dialog.text()).toContain("7 天");
  });

  it("does not redeem when the dialog is cancelled", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "兑换");
    await clickButton(wrapper, "取消");

    expect(redeemMock).not.toHaveBeenCalled();
  });

  it("redeems and shows the new order", async () => {
    redeemMock.mockResolvedValue(order());
    balanceMock.mockResolvedValueOnce(382).mockResolvedValueOnce(332);
    rewardsMock
      .mockResolvedValueOnce([reward()])
      .mockResolvedValueOnce([
        reward({ remainingStock: 11, reservedStock: 4 }),
      ]);
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "兑换");
    await clickButton(wrapper, "确认兑换");

    expect(redeemMock).toHaveBeenCalledWith(4);
    expect(wrapper.text()).toContain("RDM-1A2B3C4D");
    expect(wrapper.text()).toContain("2026.11.08");
    expect(wrapper.text()).toContain("学生活动中心 101");
    expect(wrapper.text()).toContain("332");
    expect(wrapper.text()).toContain("11 件");
    expect(cacheMock).toHaveBeenCalled();
  });

  it("shows the server reason when redeeming is rejected", async () => {
    redeemMock.mockRejectedValue(
      new ApiError("POINTS_INSUFFICIENT", "积分余额不足", 409),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "兑换");
    await clickButton(wrapper, "确认兑换");

    expect(wrapper.text()).toContain("积分余额不足");
    expect(wrapper.text()).not.toContain("RDM-");
    expect(cacheMock).toHaveBeenCalled();
  });
});
