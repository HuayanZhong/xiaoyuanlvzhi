import { resolveRequestError } from "./auth-errors";
import { listApplications, type AdoptionApplication } from "./adoption-api";
import {
  listCheckins,
  listEligiblePlants,
  type CareCheckin,
  type CareEligiblePlant,
} from "./care-api";
import { listOrders, type RedemptionOrder } from "./reward-api";
import { canJoin } from "./task-status";
import {
  listParticipations,
  listTasks,
  type EcoTask,
  type TaskParticipation,
} from "./task-api";

export type PendingGroupKey =
  | "care-pending"
  | "adoption-rejected"
  | "care-rejected"
  | "task-rejected"
  | "reward-pickup";

/** 一类待处理记录；`to` 指向该类最近一条记录。 */
export type PendingGroup = {
  key: PendingGroupKey;
  label: string;
  count: number;
  to: string;
  record: string;
};

export type PendingSource = {
  checkins: CareCheckin[];
  applications: AdoptionApplication[];
  participations: TaskParticipation[];
  orders: RedemptionOrder[];
};

export type HomeOverview = {
  pendingGroups: PendingGroup[];
  pendingError: string;
  tasks: EcoTask[];
  tasksError: string;
  plants: CareEligiblePlant[];
  plantsError: string;
  recentCheckins: CareCheckin[];
};

function looksLikeTestData(value: string): boolean {
  return /测试|验收|e2e/i.test(value);
}

/** 把四类记录汇总为待处理分类，数量为 0 的分类不返回。 */
export function buildPendingGroups(source: PendingSource): PendingGroup[] {
  const groups: PendingGroup[] = [];

  const carePending = source.checkins.filter(
    (item) => item.status === "PENDING_REVIEW",
  );

  if (carePending.length > 0) {
    groups.push({
      key: "care-pending",
      label: "待审核打卡",
      count: carePending.length,
      to: `/care/${carePending[0]!.id}`,
      record: carePending[0]!.checkinNo,
    });
  }

  const adoptionRejected = source.applications.filter(
    (item) => item.status === "REJECTED",
  );

  if (adoptionRejected.length > 0) {
    groups.push({
      key: "adoption-rejected",
      label: "待重提 · 领养",
      count: adoptionRejected.length,
      to: `/adoptions/${adoptionRejected[0]!.id}`,
      record: adoptionRejected[0]!.applicationNo,
    });
  }

  const careRejected = source.checkins.filter(
    (item) => item.status === "REJECTED",
  );

  if (careRejected.length > 0) {
    groups.push({
      key: "care-rejected",
      label: "待重提 · 养护",
      count: careRejected.length,
      to: `/care/${careRejected[0]!.id}`,
      record: careRejected[0]!.checkinNo,
    });
  }

  const taskRejected = source.participations.filter(
    (item) => item.status === "REJECTED",
  );

  if (taskRejected.length > 0) {
    groups.push({
      key: "task-rejected",
      label: "待重提 · 任务",
      count: taskRejected.length,
      to: `/tasks/${taskRejected[0]!.taskId}`,
      record: taskRejected[0]!.taskTitle,
    });
  }

  const rewardPending = source.orders.filter(
    (item) => item.status === "WAITING_PICKUP",
  );

  if (rewardPending.length > 0) {
    groups.push({
      key: "reward-pickup",
      label: "待领取奖励",
      count: rewardPending.length,
      to: `/rewards/orders/${rewardPending[0]!.id}`,
      record: rewardPending[0]!.orderNo,
    });
  }

  return groups;
}

/** 当前可报名的任务，最多 3 个。 */
export function selectJoinableTasks(tasks: EcoTask[]): EcoTask[] {
  return tasks
    .filter(
      (task) =>
        canJoin(task) &&
        !looksLikeTestData(task.title) &&
        !looksLikeTestData(task.details ?? ""),
    )
    .slice(0, 3);
}

/** 已到养护间隔且没有待审核打卡的植株，最多 3 株。 */
export function selectDuePlants(
  plants: CareEligiblePlant[],
): CareEligiblePlant[] {
  return plants.filter((plant) => plant.eligible).slice(0, 3);
}

/** 并行读取首页概览；每个区块保留独立错误，互不影响。 */
export async function loadHomeOverview(): Promise<HomeOverview> {
  const [checkins, applications, participations, orders, tasks, plants] =
    await Promise.allSettled([
      listCheckins(),
      listApplications(),
      listParticipations(),
      listOrders(),
      listTasks(),
      listEligiblePlants(),
    ]);

  const pendingResults = [checkins, applications, participations, orders];
  const pendingFailure = pendingResults.find(
    (result) => result.status === "rejected",
  );

  return {
    pendingGroups:
      pendingFailure?.status === "rejected"
        ? []
        : buildPendingGroups({
            checkins: checkins.status === "fulfilled" ? checkins.value : [],
            applications:
              applications.status === "fulfilled" ? applications.value : [],
            participations:
              participations.status === "fulfilled" ? participations.value : [],
            orders: orders.status === "fulfilled" ? orders.value : [],
          }),
    pendingError:
      pendingFailure?.status === "rejected"
        ? resolveRequestError(pendingFailure.reason)
        : "",
    tasks: tasks.status === "fulfilled" ? selectJoinableTasks(tasks.value) : [],
    tasksError:
      tasks.status === "rejected" ? resolveRequestError(tasks.reason) : "",
    plants: plants.status === "fulfilled" ? selectDuePlants(plants.value) : [],
    plantsError:
      plants.status === "rejected" ? resolveRequestError(plants.reason) : "",
    recentCheckins:
      checkins.status === "fulfilled" ? checkins.value.slice(0, 3) : [],
  };
}
