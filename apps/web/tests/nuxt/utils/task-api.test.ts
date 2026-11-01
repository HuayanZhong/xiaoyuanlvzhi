import { describe, expect, it, vi } from "vitest";
import {
  getTask,
  joinTask,
  listParticipations,
  listTasks,
  submitTaskEvidence,
} from "../../../app/utils/task-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("task api", () => {
  it("lists published tasks", async () => {
    request.mockResolvedValue([]);

    await listTasks();

    expect(request).toHaveBeenCalledWith("tasks");
  });

  it("loads one task", async () => {
    const task = { id: 3, title: "校园垃圾分类宣传" };
    request.mockResolvedValue(task);

    await expect(getTask(3)).resolves.toBe(task);
    expect(request).toHaveBeenCalledWith("tasks/3");
  });

  it("joins a task without a request body", async () => {
    const participation = { id: 7, taskId: 3, status: "JOINED" };
    request.mockResolvedValue(participation);

    await expect(joinTask(3)).resolves.toBe(participation);
    expect(request).toHaveBeenCalledWith("tasks/3/join", { method: "POST" });
  });

  it("lists my participations", async () => {
    request.mockResolvedValue([]);

    await listParticipations();

    expect(request).toHaveBeenCalledWith("tasks/participations");
  });

  it("submits evidence with note and images", async () => {
    request.mockResolvedValue({ id: 7 });

    await submitTaskEvidence(7, {
      note: "已完成两小时宣传",
      imageFileIds: [21, 22],
    });

    expect(request).toHaveBeenCalledWith("tasks/participations/7/submissions", {
      method: "POST",
      body: { note: "已完成两小时宣传", imageFileIds: [21, 22] },
    });
  });
});
