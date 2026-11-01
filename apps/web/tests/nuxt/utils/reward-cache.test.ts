import { describe, expect, it, vi } from "vitest";
import { clearRewardCaches } from "../../../app/utils/reward-cache";

const { clearNuxtDataMock } = vi.hoisted(() => ({
  clearNuxtDataMock: vi.fn(),
}));

vi.mock("#app", () => ({ clearNuxtData: clearNuxtDataMock }));

describe("reward cache", () => {
  it("clears rewards, points and order caches", () => {
    clearRewardCaches();

    expect(clearNuxtDataMock.mock.calls).toEqual([
      ["points"],
      ["rewards"],
      ["rewards-orders"],
    ]);
  });
});
