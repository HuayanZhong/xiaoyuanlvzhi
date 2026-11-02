import { describe, expect, it, vi } from "vitest";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../../../app/utils/profile-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("profile api", () => {
  it("reads the current profile", async () => {
    const profile = { id: 2, phone: "13800138000" };
    request.mockResolvedValue(profile);

    await expect(getStudentProfile()).resolves.toBe(profile);
    expect(request).toHaveBeenCalledWith("profile");
  });

  it("updates the phone and class name", async () => {
    const updated = { id: 2, phone: "13900139000", className: "" };
    request.mockResolvedValue(updated);

    await expect(
      updateStudentProfile({ phone: "13900139000", className: "" }),
    ).resolves.toBe(updated);
    expect(request).toHaveBeenCalledWith("profile", {
      method: "PUT",
      body: { phone: "13900139000", className: "" },
    });
  });
});
