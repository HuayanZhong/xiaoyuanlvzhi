import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeFeedback,
  getFeedback,
  listFeedback,
  replyFeedback,
  startFeedback,
} from "@/api/feedback";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);
const post = vi.mocked(http.post);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

describe("feedback api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("lists all feedback", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await expect(listFeedback()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith("admin/feedback", {});
  });

  it("filters feedback by status", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await listFeedback("PENDING");

    expect(get).toHaveBeenCalledWith("admin/feedback", {
      searchParams: { status: "PENDING" },
    });
  });

  it("loads feedback detail", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await expect(getFeedback(5)).resolves.toEqual({ id: 5 });
    expect(get).toHaveBeenCalledWith("admin/feedback/5", {});
  });

  it("starts handling a feedback", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await startFeedback(5);

    expect(post).toHaveBeenCalledWith("admin/feedback/5/start", {});
  });

  it("replies with the trimmed payload", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await replyFeedback(5, { reply: "已经处理完成" });

    expect(post).toHaveBeenCalledWith("admin/feedback/5/reply", {
      json: { reply: "已经处理完成" },
    });
  });

  it("closes with a conclusion", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await closeFeedback(5, { conclusion: "问题已解决" });

    expect(post).toHaveBeenCalledWith("admin/feedback/5/close", {
      json: { conclusion: "问题已解决" },
    });
  });
});
