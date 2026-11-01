import { describe, expect, it, vi } from "vitest";
import {
  createApplication,
  getApplication,
  listApplications,
  requestCancelApplication,
  requestReturnApplication,
  resubmitApplication,
  withdrawApplication,
} from "../../../app/utils/adoption-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("adoption api", () => {
  it("lists and loads applications", async () => {
    request.mockResolvedValue([]);

    await listApplications();
    await getApplication(7);

    expect(request).toHaveBeenNthCalledWith(1, "adoptions");
    expect(request).toHaveBeenNthCalledWith(2, "adoptions/7");
  });

  it("creates an application with a trimmed note", async () => {
    request.mockResolvedValue({});

    await createApplication({ speciesId: 2, note: " 宿舍南向 " });

    expect(request).toHaveBeenCalledWith("adoptions", {
      method: "POST",
      body: { speciesId: 2, note: "宿舍南向" },
    });
  });

  it("omits a blank note when creating", async () => {
    request.mockResolvedValue({});

    await createApplication({ speciesId: 2, note: "   " });

    expect(request).toHaveBeenCalledWith("adoptions", {
      method: "POST",
      body: { speciesId: 2 },
    });
  });

  it("withdraws a pending application", async () => {
    request.mockResolvedValue({});

    await withdrawApplication(9);

    expect(request).toHaveBeenCalledWith("adoptions/9/withdraw", {
      method: "POST",
    });
  });

  it("resubmits with an updated note", async () => {
    request.mockResolvedValue({});

    await resubmitApplication(9, " 已确认养护条件 ");

    expect(request).toHaveBeenCalledWith("adoptions/9/resubmit", {
      method: "POST",
      body: { note: "已确认养护条件" },
    });
  });

  it("requests cancel and return with reasons", async () => {
    request.mockResolvedValue({});

    await requestCancelApplication(9, " 临时调整宿舍 ");
    await requestReturnApplication(9, "无法继续养护");

    expect(request).toHaveBeenNthCalledWith(1, "adoptions/9/cancel-request", {
      method: "POST",
      body: { reason: "临时调整宿舍" },
    });
    expect(request).toHaveBeenNthCalledWith(2, "adoptions/9/return-request", {
      method: "POST",
      body: { reason: "无法继续养护" },
    });
  });
});
