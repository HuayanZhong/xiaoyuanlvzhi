import { HTTPError, NetworkError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import {
  approveCareCheckin,
  getCareCheckin,
  listCareCheckins,
  listCareEvents,
  rejectCareCheckin,
  type CareCheckinStatus,
} from "@/api/care";
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

function jsonFailure(error: unknown) {
  return { json: vi.fn().mockRejectedValue(error) } as never;
}

function httpError(status: number, code: string, message: string) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/test");
  const error = new HTTPError(response, request, {} as never);
  error.data = { success: false, data: null, error: { code, message } };
  return error;
}

const checkin = {
  id: 9,
  checkinNo: "CHK-9",
  studentId: 2,
  studentName: "张三",
  studentNumber: "20260001",
  studentEmail: "student@qq.com",
  studentStatus: "ACTIVE",
  plantId: 10,
  plantCode: "PLANT-010",
  plantDisplayName: "窗边绿萝",
  plantName: "绿萝",
  location: "图书馆一楼",
  plantStatus: "ACTIVE",
  speciesId: 1,
  speciesName: "绿萝",
  careIntervalDays: 7,
  lightDescription: "散射光",
  waterDescription: "每周一次",
  status: "PENDING_REVIEW",
  latestVersion: 1,
  createdAt: "2026-10-30T09:00:00",
  updatedAt: "2026-10-30T09:00:00",
  lastApprovedAt: null,
  pendingPoints: 10,
  pointsSource: "SPECIES",
  hasEvidence: true,
  duplicatePending: false,
  submissions: [
    {
      id: 3,
      version: 1,
      note: "叶片状态良好",
      imageFileIds: [7],
      status: "PENDING_REVIEW",
      reviewReason: null,
      reviewerName: null,
      reviewerEmail: null,
      submittedAt: "2026-10-30T09:00:00",
      reviewedAt: null,
      awardedPoints: null,
    },
  ],
};

const event = {
  id: 1,
  action: "APPROVE",
  fromStatus: "PENDING_REVIEW",
  toStatus: "APPROVED",
  reason: null,
  actorName: "管理员",
  actorEmail: "admin@campus.local",
  createdAt: "2026-10-30T10:00:00",
};

describe("care api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("lists all checkins without a status query", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [checkin], error: null }),
    );

    await expect(listCareCheckins()).resolves.toEqual([checkin]);
    expect(get).toHaveBeenCalledWith("admin/care/checkins", {});
  });

  it("passes a valid status query", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [checkin], error: null }),
    );

    await listCareCheckins("PENDING_REVIEW");

    expect(get).toHaveBeenCalledWith("admin/care/checkins", {
      searchParams: { status: "PENDING_REVIEW" },
    });
  });

  it("ignores an invalid status instead of sending it", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await listCareCheckins("UNKNOWN" as CareCheckinStatus);

    expect(get).toHaveBeenCalledWith("admin/care/checkins", {});
  });

  it("fetches the detail and the review events", async () => {
    get
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: checkin, error: null }),
      )
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: [event], error: null }),
      );

    await expect(getCareCheckin(9)).resolves.toEqual(checkin);
    await expect(listCareEvents(9)).resolves.toEqual([event]);

    expect(get).toHaveBeenNthCalledWith(1, "admin/care/checkins/9", {});
    expect(get).toHaveBeenNthCalledWith(2, "admin/care/checkins/9/events", {});
  });

  it("approves without a body", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: checkin, error: null }),
    );

    await approveCareCheckin(9);

    expect(post).toHaveBeenCalledWith("admin/care/checkins/9/approve", {});
  });

  it("rejects with a reason", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: checkin, error: null }),
    );

    await rejectCareCheckin(9, "照片不清晰，请重新上传");

    expect(post).toHaveBeenCalledWith("admin/care/checkins/9/reject", {
      json: { reason: "照片不清晰，请重新上传" },
    });
  });

  it("preserves the business error code and status", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(409, "CARE_STATUS_INVALID", "打卡状态已变化，请刷新后重试"),
      ),
    );

    const error = await approveCareCheckin(9).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "CARE_STATUS_INVALID",
      message: "打卡状态已变化，请刷新后重试",
      status: 409,
    });
  });

  it("maps a not-found envelope error", async () => {
    get.mockReturnValue(
      jsonFailure(httpError(404, "CARE_CHECKIN_NOT_FOUND", "养护打卡不存在")),
    );

    await expect(getCareCheckin(99)).rejects.toMatchObject({
      code: "CARE_CHECKIN_NOT_FOUND",
      status: 404,
    });
  });

  it("maps a network failure", async () => {
    get.mockReturnValue(
      jsonFailure(
        new NetworkError(new Request("http://localhost/api/v1/test")),
      ),
    );

    await expect(listCareCheckins()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "无法连接后端服务，请稍后重试",
    });
  });
});
