import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  disableStudent,
  enableStudent,
  getStudent,
  getStudentHistory,
  listStudentRecords,
  listStudents,
} from "@/api/accounts";
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

const student = {
  id: 2,
  email: "student@qq.com",
  role: "STUDENT",
  status: "ACTIVE",
  fullName: "张三",
  studentNumber: "20260001",
  department: "计算机学院",
  className: "软件工程 1 班",
  phone: "13800138000",
  pointsBalance: 120,
  activeAdoptionCount: 2,
  createdAt: "2026-10-01T09:00:00",
  updatedAt: "2026-10-02T09:00:00",
};

describe("accounts api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));
  });

  it("lists students with the existing minimal signature", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [student], error: null }),
    );

    await expect(listStudents()).resolves.toEqual([student]);
    expect(get).toHaveBeenCalledWith("admin/accounts", {});
  });

  it("lists full student records for the student page", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [student], error: null }),
    );

    await expect(listStudentRecords()).resolves.toEqual([student]);
    expect(get).toHaveBeenCalledWith("admin/accounts", {});
  });

  it("gets a student", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: student, error: null }),
    );

    await expect(getStudent(2)).resolves.toEqual(student);
    expect(get).toHaveBeenCalledWith("admin/accounts/2", {});
  });

  it("gets student history", async () => {
    const history = {
      adoptions: [],
      careCheckins: [],
      taskParticipations: [],
      pointLedger: [],
      rewardOrders: [],
    };
    get.mockReturnValue(
      jsonResponse({ success: true, data: history, error: null }),
    );

    await expect(getStudentHistory(2)).resolves.toEqual(history);
    expect(get).toHaveBeenCalledWith("admin/accounts/2/history", {});
  });

  it("disables a student with a trimmed reason", async () => {
    post.mockReturnValue(
      jsonResponse({
        success: true,
        data: { ...student, status: "DISABLED" },
        error: null,
      }),
    );

    await expect(disableStudent(2, "违反平台规定")).resolves.toMatchObject({
      status: "DISABLED",
    });
    expect(post).toHaveBeenCalledWith("admin/accounts/2/disable", {
      json: { reason: "违反平台规定" },
    });
  });

  it("enables a student", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: student, error: null }),
    );

    await expect(enableStudent(2, "恢复账号使用")).resolves.toEqual(student);
    expect(post).toHaveBeenCalledWith("admin/accounts/2/enable", {
      json: { reason: "恢复账号使用" },
    });
  });
});
