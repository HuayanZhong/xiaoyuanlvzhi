import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { clearRewardCaches } from "~/utils/reward-cache";
import {
  cancelOrder,
  listOrders,
  type RedemptionOrder,
} from "~/utils/reward-api";
import OrdersPage from "../../../app/pages/rewards/orders/index.vue";

vi.mock("~/utils/reward-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/reward-api")>();

  return { ...actual, listOrders: vi.fn(), cancelOrder: vi.fn() };
});

vi.mock("~/utils/reward-cache", () => ({ clearRewardCaches: vi.fn() }));

const ordersMock = vi.mocked(listOrders);
const cancelMock = vi.mocked(cancelOrder);
const cacheMock = vi.mocked(clearRewardCaches);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(OrdersPage, {
    route: "/rewards/orders",
  });
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

async function clickDialogButton(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  label: string,
) {
  const dialog = wrapper.get('[role="dialog"]');
  const button = dialog.findAll("button").find((item) => item.text() === label);

  expect(button).toBeDefined();
  await button!.trigger("click");
  await flushPromises();
}

describe("rewards orders page", () => {
  beforeEach(() => {
    ordersMock.mockReset();
    cancelMock.mockReset();
    cacheMock.mockReset();
    ordersMock.mockResolvedValue([order()]);
    clearNuxtData("rewards-orders");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists orders with every status label", async () => {
    ordersMock.mockResolvedValue([
      order(),
      order({
        id: 10,
        orderNo: "RDM-2",
        status: "CLAIMED",
        claimedAt: "2026-11-02T09:00:00",
      }),
      order({
        id: 11,
        orderNo: "RDM-3",
        status: "CANCELLED",
        refundedAt: "2026-11-02T10:00:00",
        reason: "学生取消兑换订单",
      }),
      order({
        id: 12,
        orderNo: "RDM-4",
        status: "EXPIRED",
        refundedAt: "2026-11-09T00:00:00",
      }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("RDM-1A2B3C4D");
    expect(wrapper.text()).toContain("环保帆布袋");
    expect(wrapper.text()).toContain("50 PT");
    expect(wrapper.text()).toContain("学生活动中心 101");
    expect(wrapper.text()).toContain("待领取");
    expect(wrapper.text()).toContain("已领取");
    expect(wrapper.text()).toContain("已取消");
    expect(wrapper.text()).toContain("已超时");
    expect(wrapper.text()).toContain("退分时间");
  });

  it("shows an empty state with a shop entry", async () => {
    ordersMock.mockResolvedValue([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("还没有兑换订单");
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/rewards");
  });

  it("shows a retryable error", async () => {
    ordersMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "重试"),
    ).toBe(true);
  });

  it("only offers cancelling for waiting orders", async () => {
    ordersMock.mockResolvedValue([
      order(),
      order({ id: 10, orderNo: "RDM-2", status: "CLAIMED" }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    const cancelButtons = wrapper
      .findAll("button")
      .filter((item) => item.text() === "取消订单");

    expect(cancelButtons).toHaveLength(1);
  });

  it("cancels a waiting order after confirmation", async () => {
    cancelMock.mockResolvedValue(
      order({
        status: "CANCELLED",
        refundedAt: "2026-11-02T10:00:00",
      }),
    );
    ordersMock
      .mockResolvedValueOnce([order()])
      .mockResolvedValueOnce([
        order({ status: "CANCELLED", refundedAt: "2026-11-02T10:00:00" }),
      ]);
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "取消订单");
    await clickDialogButton(wrapper, "取消订单");

    expect(cancelMock).toHaveBeenCalledWith(9);
    expect(wrapper.text()).toContain("已取消");
    expect(wrapper.text()).toContain("退分时间");
    expect(cacheMock).toHaveBeenCalled();
  });

  it("does not cancel when the dialog is dismissed", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "取消订单");
    await clickDialogButton(wrapper, "保留订单");

    expect(cancelMock).not.toHaveBeenCalled();
  });

  it("keeps the order when the server already processed it", async () => {
    cancelMock.mockRejectedValue(
      new ApiError("ORDER_STATUS_INVALID", "该订单已处理", 409),
    );
    ordersMock
      .mockResolvedValueOnce([order()])
      .mockResolvedValueOnce([order({ status: "CLAIMED" })]);
    const wrapper = await mountPage();
    await flushPromises();

    await clickButton(wrapper, "取消订单");
    await clickDialogButton(wrapper, "取消订单");

    expect(wrapper.text()).toContain("该订单已处理");
    expect(wrapper.text()).toContain("已领取");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "取消订单"),
    ).toBe(false);
  });
});
