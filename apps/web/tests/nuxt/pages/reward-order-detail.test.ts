import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  cancelOrder,
  getOrder,
  type RedemptionOrder,
} from "~/utils/reward-api";
import { clearRewardCaches } from "~/utils/reward-cache";
import OrderDetailPage from "../../../app/pages/rewards/orders/[id].vue";

vi.mock("~/utils/reward-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/reward-api")>();

  return { ...actual, getOrder: vi.fn(), cancelOrder: vi.fn() };
});

vi.mock("~/utils/reward-cache", () => ({ clearRewardCaches: vi.fn() }));

const getMock = vi.mocked(getOrder);
const cancelMock = vi.mocked(cancelOrder);
const cacheMock = vi.mocked(clearRewardCaches);
const mounted: Array<{ unmount: () => void }> = [];

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

async function mountPage(route = "/rewards/orders/9") {
  const wrapper = await mountSuspended(OrderDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
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

async function clickDialogButton(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  label: string,
) {
  const dialog = wrapper.get('[role="alertdialog"]');
  const button = dialog.findAll("button").find((item) => item.text() === label);

  expect(button).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}

describe("reward order detail page", () => {
  beforeEach(() => {
    getMock.mockReset();
    cancelMock.mockReset();
    cacheMock.mockReset();
    navigateToMock.mockReset();
    clearNuxtData();
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("renders the order fields", async () => {
    getMock.mockResolvedValue(
      order({
        status: "CANCELLED",
        refundedAt: "2026-11-02T10:00:00",
        reason: "学生取消兑换订单",
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("RDM-1A2B3C4D");
    expect(wrapper.text()).toContain("环保帆布袋");
    expect(wrapper.text()).toContain("50 分");
    expect(wrapper.text()).toContain("学生活动中心 101");
    expect(wrapper.text()).toContain("已取消");
    expect(wrapper.text()).toContain("退分时间");
    expect(wrapper.text()).toContain("学生取消兑换订单");
    expect(getMock).toHaveBeenCalledWith(9);
  });

  it("cancels a waiting order and refreshes the status", async () => {
    getMock.mockResolvedValueOnce(order()).mockResolvedValueOnce(
      order({
        status: "CANCELLED",
        refundedAt: "2026-11-02T10:00:00",
      }),
    );
    cancelMock.mockResolvedValue(
      order({ status: "CANCELLED", refundedAt: "2026-11-02T10:00:00" }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(
      wrapper.findAll("button").some((item) => item.text() === "取消订单"),
    ).toBe(true);

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "取消订单")!
      .trigger("click");
    await flushPromises();
    await clickDialogButton(wrapper, "取消订单");

    expect(cancelMock).toHaveBeenCalledWith(9);
    expect(wrapper.text()).toContain("已取消");
    expect(wrapper.text()).toContain("退分时间");
    expect(cacheMock).toHaveBeenCalled();
  });

  it("explains when the order is unavailable", async () => {
    getMock.mockRejectedValue(
      new ApiError("ORDER_NOT_FOUND", "订单不存在", 404),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看这个订单");
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/rewards/orders");
  });

  it("shows a retryable error", async () => {
    getMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "重试"),
    ).toBe(true);
  });
});
