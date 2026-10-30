import { beforeEach, describe, expect, it, vi } from "vitest";
import { listStudents } from "@/api/accounts";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

describe("accounts api", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("lists students", async () => {
    const students = [
      {
        id: 2,
        email: "student@qq.com",
        fullName: "张三",
        studentNumber: "20260001",
        department: "计算机学院",
        className: "软件工程 1 班",
        status: "ACTIVE",
      },
    ];
    get.mockReturnValue(
      jsonResponse({ success: true, data: students, error: null }),
    );

    await expect(listStudents()).resolves.toEqual(students);
    expect(get).toHaveBeenCalledWith("admin/accounts", {});
  });
});
