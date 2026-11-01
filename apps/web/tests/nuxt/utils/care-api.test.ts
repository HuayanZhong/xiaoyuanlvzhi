import { describe, expect, it, vi } from "vitest";
import {
  getCheckin,
  listCheckins,
  listEligiblePlants,
  resubmitCheckin,
  submitCheckin,
} from "../../../app/utils/care-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("care api", () => {
  it("lists eligible plants", async () => {
    request.mockResolvedValue([]);

    await listEligiblePlants();

    expect(request).toHaveBeenCalledWith("care/eligible-plants");
  });

  it("lists check-ins", async () => {
    request.mockResolvedValue([]);

    await listCheckins();

    expect(request).toHaveBeenCalledWith("care/checkins");
  });

  it("loads one check-in", async () => {
    const checkin = { id: 8, checkinNo: "CARE-8" };
    request.mockResolvedValue(checkin);

    await expect(getCheckin(8)).resolves.toBe(checkin);
    expect(request).toHaveBeenCalledWith("care/checkins/8");
  });

  it("submits a check-in with note and images", async () => {
    request.mockResolvedValue({ id: 9 });

    await submitCheckin({
      plantId: 3,
      note: "今天浇水",
      imageFileIds: [11, 12],
    });

    expect(request).toHaveBeenCalledWith("care/checkins", {
      method: "POST",
      body: { plantId: 3, note: "今天浇水", imageFileIds: [11, 12] },
    });
  });

  it("resubmits a rejected check-in", async () => {
    request.mockResolvedValue({ id: 9 });

    await resubmitCheckin(9, { note: "补充了照片", imageFileIds: [13] });

    expect(request).toHaveBeenCalledWith("care/checkins/9/resubmit", {
      method: "POST",
      body: { note: "补充了照片", imageFileIds: [13] },
    });
  });
});
