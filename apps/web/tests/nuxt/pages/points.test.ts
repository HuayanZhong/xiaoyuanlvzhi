import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  getPointsBalance,
  listPointLedger,
  type PointLedgerEntry,
} from "~/utils/point-api";
import PointsPage from "../../../app/pages/points/index.vue";

vi.mock("~/utils/point-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/point-api")>();

  return {
    ...actual,
    getPointsBalance: vi.fn(),
    listPointLedger: vi.fn(),
  };
});

const balanceMock = vi.mocked(getPointsBalance);
const ledgerMock = vi.mocked(listPointLedger);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage() {
  const wrapper = await mountSuspended(PointsPage, { route: "/points" });
  mounted.push(wrapper);

  return wrapper;
}

function entry(overrides: Partial<PointLedgerEntry> = {}): PointLedgerEntry {
  return {
    id: 1,
    accountId: 2,
    studentEmail: "student@qq.com",
    deltaPoints: 10,
    balanceAfter: 392,
    sourceType: "ECO_TASK",
    sourceId: "7",
    reason: "任务审核通过",
    actorEmail: null,
    createdAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

describe("points page", () => {
  beforeEach(() => {
    balanceMock.mockReset();
    ledgerMock.mockReset();
    balanceMock.mockResolvedValue(382);
    ledgerMock.mockResolvedValue([]);
    clearNuxtData("points");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("shows the balance and ledger entries", async () => {
    ledgerMock.mockResolvedValue([
      entry(),
      entry({
        id: 2,
        deltaPoints: -50,
        balanceAfter: 382,
        sourceType: "REDEMPTION",
        sourceId: "9",
      }),
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("382");
    expect(wrapper.text()).toContain("分");
    expect(wrapper.text()).toContain("环保任务");
    expect(wrapper.text()).toContain("+10");
    expect(wrapper.text()).toContain("记录 7");
    expect(wrapper.text()).toContain("变动后余额 392 分");
    expect(wrapper.text()).toContain("兑换扣减");
    expect(wrapper.text()).toContain("-50");
    expect(wrapper.text()).toContain("2 笔流水");
  });

  it("links to the rewards shop and my orders", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    const links = wrapper.findAll("a").map((item) => item.attributes("href"));

    expect(links).toContain("/rewards");
    expect(links).toContain("/rewards/orders");
  });

  it("shows an empty state without ledger entries", async () => {
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("还没有积分流水");
  });

  it("keeps the balance when the ledger fails", async () => {
    ledgerMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("382");
    expect(wrapper.text()).toContain("无法连接后端服务");
  });

  it("still lists entries when the balance fails", async () => {
    balanceMock.mockRejectedValue(
      new ApiError("UPSTREAM_ERROR", "服务暂时不可用，请稍后重试", 503),
    );
    ledgerMock.mockResolvedValue([entry()]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("服务暂时不可用");
    expect(wrapper.text()).toContain("环保任务");
  });
});
