import { describe, expect, it, vi } from "vitest";
import { clearNotificationCache } from "../../../app/utils/notification-cache";

const { clearNuxtDataMock } = vi.hoisted(() => ({
  clearNuxtDataMock: vi.fn(),
}));

vi.mock("#app", () => ({ clearNuxtData: clearNuxtDataMock }));

describe("notification cache", () => {
  it("clears the shared notifications cache", () => {
    clearNotificationCache();

    expect(clearNuxtDataMock.mock.calls).toEqual([["notifications"]]);
  });
});
