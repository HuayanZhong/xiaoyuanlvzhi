import { describe, expect, it, vi } from "vitest";
import {
  closeFeedback,
  createFeedback,
  getFeedback,
  listFeedback,
} from "../../../app/utils/feedback-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("feedback api", () => {
  it("creates a feedback record", async () => {
    const created = { id: 5, feedbackNo: "FB-1A2B3C4D", status: "PENDING" };
    request.mockResolvedValue(created);
    const input = {
      type: "PLANT_ISSUE",
      description: "叶片发黄，不知道如何处理",
      relatedType: "ADOPTION",
      relatedId: "12",
      imageFileIds: [3, 4],
    };

    await expect(createFeedback(input)).resolves.toBe(created);
    expect(request).toHaveBeenCalledWith("feedback", {
      method: "POST",
      body: input,
    });
  });

  it("lists the current student's feedback", async () => {
    const items = [{ id: 5, feedbackNo: "FB-1A2B3C4D" }];
    request.mockResolvedValue(items);

    await expect(listFeedback()).resolves.toBe(items);
    expect(request).toHaveBeenCalledWith("feedback");
  });

  it("reads one feedback record", async () => {
    const detail = { id: 5, feedbackNo: "FB-1A2B3C4D" };
    request.mockResolvedValue(detail);

    await expect(getFeedback(5)).resolves.toBe(detail);
    expect(request).toHaveBeenCalledWith("feedback/5");
  });

  it("closes a replied feedback record", async () => {
    const closed = { id: 5, status: "CLOSED" };
    request.mockResolvedValue(closed);

    await expect(closeFeedback(5)).resolves.toBe(closed);
    expect(request).toHaveBeenCalledWith("feedback/5/close", {
      method: "POST",
    });
  });
});
