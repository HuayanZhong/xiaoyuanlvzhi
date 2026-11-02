import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../app/utils/api";
import { listApplications } from "../../../app/utils/adoption-api";
import { listCheckins, listEligiblePlants } from "../../../app/utils/care-api";
import { loadHomeOverview } from "../../../app/utils/home-overview";
import { listOrders } from "../../../app/utils/reward-api";
import { listParticipations, listTasks } from "../../../app/utils/task-api";

vi.mock("~/utils/care-api", () => ({
  listCheckins: vi.fn(),
  listEligiblePlants: vi.fn(),
}));

vi.mock("~/utils/adoption-api", () => ({
  listApplications: vi.fn(),
}));

vi.mock("~/utils/task-api", () => ({
  listParticipations: vi.fn(),
  listTasks: vi.fn(),
}));

vi.mock("~/utils/reward-api", () => ({
  listOrders: vi.fn(),
}));

const checkinsMock = vi.mocked(listCheckins);
const plantsMock = vi.mocked(listEligiblePlants);
const applicationsMock = vi.mocked(listApplications);
const participationsMock = vi.mocked(listParticipations);
const tasksMock = vi.mocked(listTasks);
const ordersMock = vi.mocked(listOrders);

const networkError = new ApiError(
  "NETWORK_ERROR",
  "无法连接后端服务，请稍后重试",
);

describe("load home overview", () => {
  beforeEach(() => {
    checkinsMock.mockReset();
    plantsMock.mockReset();
    applicationsMock.mockReset();
    participationsMock.mockReset();
    tasksMock.mockReset();
    ordersMock.mockReset();

    checkinsMock.mockResolvedValue([]);
    plantsMock.mockResolvedValue([]);
    applicationsMock.mockResolvedValue([]);
    participationsMock.mockResolvedValue([]);
    tasksMock.mockResolvedValue([]);
    ordersMock.mockResolvedValue([]);
  });

  it("returns the three overview sections", async () => {
    checkinsMock.mockResolvedValue([
      {
        id: 12,
        checkinNo: "CARE-1A2B3C4D",
        status: "PENDING_REVIEW",
      } as never,
    ]);
    tasksMock.mockResolvedValue([
      {
        id: 7,
        title: "垃圾分类宣传",
        status: "ONGOING",
        currentUserParticipating: false,
        maxParticipants: 20,
        participantCount: 5,
      } as never,
    ]);
    plantsMock.mockResolvedValue([
      {
        plantId: 10,
        plantName: "绿萝 · PLANT-001",
        eligible: true,
      } as never,
    ]);

    const overview = await loadHomeOverview();

    expect(overview.pendingError).toBe("");
    expect(overview.pendingGroups).toHaveLength(1);
    expect(overview.pendingGroups[0]).toMatchObject({
      label: "待审核打卡",
      count: 1,
      to: "/care/12",
    });
    expect(overview.tasksError).toBe("");
    expect(overview.tasks.map((item) => item.id)).toEqual([7]);
    expect(overview.plantsError).toBe("");
    expect(overview.plants.map((item) => item.plantId)).toEqual([10]);
  });

  it("isolates a pending request failure", async () => {
    ordersMock.mockRejectedValue(networkError);
    tasksMock.mockResolvedValue([
      {
        id: 7,
        status: "ONGOING",
        currentUserParticipating: false,
        maxParticipants: null,
        participantCount: 0,
      } as never,
    ]);

    const overview = await loadHomeOverview();

    expect(overview.pendingGroups).toEqual([]);
    expect(overview.pendingError).toContain("无法连接后端服务");
    expect(overview.tasks.map((item) => item.id)).toEqual([7]);
    expect(overview.tasksError).toBe("");
  });

  it("isolates a task request failure", async () => {
    checkinsMock.mockResolvedValue([
      {
        id: 12,
        checkinNo: "CARE-1A2B3C4D",
        status: "REJECTED",
      } as never,
    ]);
    tasksMock.mockRejectedValue(networkError);

    const overview = await loadHomeOverview();

    expect(overview.tasks).toEqual([]);
    expect(overview.tasksError).toContain("无法连接后端服务");
    expect(overview.pendingGroups).toHaveLength(1);
    expect(overview.pendingError).toBe("");
  });

  it("isolates a care reminder failure", async () => {
    plantsMock.mockRejectedValue(networkError);

    const overview = await loadHomeOverview();

    expect(overview.plants).toEqual([]);
    expect(overview.plantsError).toContain("无法连接后端服务");
    expect(overview.pendingError).toBe("");
  });
});
