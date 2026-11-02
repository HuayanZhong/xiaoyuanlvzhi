import { describe, expect, it, vi } from "vitest";
import { clearHomeProfileCache } from "../../../app/utils/profile-cache";

const { clearNuxtDataMock } = vi.hoisted(() => ({
  clearNuxtDataMock: vi.fn(),
}));

vi.mock("#app", () => ({ clearNuxtData: clearNuxtDataMock }));

describe("profile cache", () => {
  it("clears the home profile cache", () => {
    clearHomeProfileCache();

    expect(clearNuxtDataMock.mock.calls).toEqual([["home-profile"]]);
  });
});
