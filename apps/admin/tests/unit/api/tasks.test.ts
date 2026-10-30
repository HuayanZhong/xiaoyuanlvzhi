import { HTTPError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ParticipationStatus } from "@/api/tasks";
import {
  approveTaskParticipation,
  createTask,
  getTaskParticipation,
  listTaskEvents,
  listTaskParticipations,
  listTasks,
  rejectTaskParticipation,
  stopTask,
  updateTask,
} from "@/api/tasks";
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
const put = vi.mocked(http.put);

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

const task = {
  id: 1,
  title: "校园环保任务",
  coverFileId: null,
  details: "在食堂门口发放分类指引并拍照记录",
  startsAt: "2026-10-30T09:00:00",
  endsAt: "2026-11-30T18:00:00",
  maxParticipants: 20,
  participantCount: 3,
  approvedCount: 1,
  pointsPerPerson: 10,
  requireText: true,
  requirePhoto: false,
  status: "ONGOING",
  canEditRules: false,
  createdAt: "2026-10-29T09:00:00",
  updatedAt: "2026-10-30T09:00:00",
};

const participation = {
  id: 5,
  taskId: 1,
  taskTitle: "校园环保任务",
  taskStatus: "ONGOING",
  taskStartsAt: "2026-10-30T09:00:00",
  taskEndsAt: "2026-11-30T18:00:00",
  pointsPerPerson: 10,
  studentId: 2,
  studentName: "张三",
  studentNumber: "20240001",
  studentEmail: "student@qq.com",
  studentStatus: "ACTIVE",
  status: "PENDING_REVIEW",
  joinedAt: "2026-10-30T09:30:00",
  latestVersion: 1,
  latestSubmittedAt: "2026-10-30T10:00:00",
  latestNote: "完成宣传",
  hasEvidence: true,
  awardedPoints: null,
  submissions: [],
};

const event = {
  id: 11,
  action: "TASK_APPROVE",
  fromStatus: "PENDING_REVIEW",
  toStatus: "APPROVED",
  reason: null,
  actorName: "管理员",
  actorEmail: "admin@campus.local",
  createdAt: "2026-10-30T10:00:00",
};

const requestBody = {
  title: "校园环保任务",
  coverFileId: null,
  details: "在食堂门口发放分类指引并拍照记录",
  startsAt: "2026-10-30T09:00:00",
  endsAt: "2026-11-30T18:00:00",
  maxParticipants: 20,
  pointsPerPerson: 10,
  requireText: true,
  requirePhoto: false,
  publish: true,
};

describe("tasks api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("lists tasks", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [task], error: null }),
    );

    await expect(listTasks()).resolves.toEqual([task]);
    expect(get).toHaveBeenCalledWith("admin/tasks", {});
  });

  it("creates, updates and stops tasks", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: task, error: null }),
    );
    put.mockReturnValue(
      jsonResponse({ success: true, data: task, error: null }),
    );

    await createTask(requestBody);
    await updateTask(1, requestBody);
    await stopTask(1);

    expect(post).toHaveBeenNthCalledWith(1, "admin/tasks", {
      json: requestBody,
    });
    expect(put).toHaveBeenCalledWith("admin/tasks/1", { json: requestBody });
    expect(post).toHaveBeenNthCalledWith(2, "admin/tasks/1/stop", {});
  });

  it("lists all participations without query", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [participation], error: null }),
    );

    await expect(listTaskParticipations()).resolves.toEqual([participation]);
    expect(get).toHaveBeenCalledWith("admin/tasks/participations", {});
  });

  it("passes task and status filters", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [participation], error: null }),
    );

    await listTaskParticipations({ taskId: 1, status: "PENDING_REVIEW" });

    expect(get).toHaveBeenCalledWith("admin/tasks/participations", {
      searchParams: { taskId: 1, status: "PENDING_REVIEW" },
    });
  });

  it("ignores an invalid participation status", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await listTaskParticipations({
      status: "UNKNOWN" as ParticipationStatus,
    });

    expect(get).toHaveBeenCalledWith("admin/tasks/participations", {});
  });

  it("fetches participation detail and events", async () => {
    get
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: participation, error: null }),
      )
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: [event], error: null }),
      );

    await expect(getTaskParticipation(5)).resolves.toEqual(participation);
    await expect(listTaskEvents(5)).resolves.toEqual([event]);

    expect(get).toHaveBeenNthCalledWith(1, "admin/tasks/participations/5", {});
    expect(get).toHaveBeenNthCalledWith(
      2,
      "admin/tasks/participations/5/events",
      {},
    );
  });

  it("approves without a body and rejects with a reason", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: participation, error: null }),
    );

    await approveTaskParticipation(5);
    await rejectTaskParticipation(5, "照片不清晰，请重新上传");

    expect(post).toHaveBeenNthCalledWith(
      1,
      "admin/tasks/participations/5/approve",
      {},
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "admin/tasks/participations/5/reject",
      { json: { reason: "照片不清晰，请重新上传" } },
    );
  });

  it("preserves the business error code and status", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(409, "TASK_PARTICIPATION_STATUS_INVALID", "状态已变化"),
      ),
    );

    await expect(approveTaskParticipation(5)).rejects.toMatchObject({
      code: "TASK_PARTICIPATION_STATUS_INVALID",
      status: 409,
    });
  });
});
