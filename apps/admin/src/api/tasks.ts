import { request } from "./client";

export const TASK_STATUSES = [
  "DRAFT",
  "UPCOMING",
  "ONGOING",
  "ENDED",
  "STOPPED",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PARTICIPATION_STATUSES = [
  "JOINED",
  "PENDING_REVIEW",
  "REJECTED",
  "APPROVED",
] as const;
export type ParticipationStatus = (typeof PARTICIPATION_STATUSES)[number];

export type AdminTaskView = {
  id: number;
  title: string;
  coverFileId: number | null;
  details: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  participantCount: number;
  approvedCount: number;
  pointsPerPerson: number;
  requireText: boolean;
  requirePhoto: boolean;
  status: string;
  canEditRules: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubmissionView = {
  id: number;
  version: number;
  note: string | null;
  imageFileIds: number[];
  status: string;
  reviewReason: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  awardedPoints: number | null;
};

export type AdminParticipationView = {
  id: number;
  taskId: number;
  taskTitle: string;
  taskStatus: string;
  taskStartsAt: string;
  taskEndsAt: string;
  pointsPerPerson: number;
  studentId: number;
  studentName: string | null;
  studentNumber: string | null;
  studentEmail: string;
  studentStatus: string | null;
  status: string;
  joinedAt: string;
  latestVersion: number;
  latestSubmittedAt: string | null;
  latestNote: string | null;
  hasEvidence: boolean;
  awardedPoints: number | null;
  submissions: AdminSubmissionView[];
};

export type TaskEventView = {
  id: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

export type TaskRequest = {
  title: string;
  coverFileId: number | null;
  details: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  pointsPerPerson: number;
  requireText: boolean;
  requirePhoto: boolean;
  publish: boolean;
};

export type TaskParticipationQuery = {
  taskId?: number;
  status?: ParticipationStatus;
};

const TASKS_PATH = "admin/tasks";
const PARTICIPATIONS_PATH = `${TASKS_PATH}/participations`;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function isParticipationStatus(
  value: unknown,
): value is ParticipationStatus {
  return PARTICIPATION_STATUSES.includes(value as ParticipationStatus);
}

export function listTasks(): Promise<AdminTaskView[]> {
  return request<AdminTaskView[]>(TASKS_PATH);
}

export function createTask(input: TaskRequest): Promise<AdminTaskView> {
  return request<AdminTaskView>(TASKS_PATH, { method: "POST", json: input });
}

export function updateTask(
  id: number,
  input: TaskRequest,
): Promise<AdminTaskView> {
  return request<AdminTaskView>(`${TASKS_PATH}/${id}`, {
    method: "PUT",
    json: input,
  });
}

export function stopTask(id: number): Promise<AdminTaskView> {
  return request<AdminTaskView>(`${TASKS_PATH}/${id}/stop`, {
    method: "POST",
  });
}

/** 只拼接合法筛选值；未知状态不发送，避免服务端 400。 */
export function listTaskParticipations(
  query: TaskParticipationQuery = {},
): Promise<AdminParticipationView[]> {
  const searchParams: Record<string, string | number> = {};

  if (query.taskId != null) {
    searchParams.taskId = query.taskId;
  }

  if (query.status && isParticipationStatus(query.status)) {
    searchParams.status = query.status;
  }

  return Object.keys(searchParams).length > 0
    ? request<AdminParticipationView[]>(PARTICIPATIONS_PATH, { searchParams })
    : request<AdminParticipationView[]>(PARTICIPATIONS_PATH);
}

export function getTaskParticipation(
  id: number,
): Promise<AdminParticipationView> {
  return request<AdminParticipationView>(`${PARTICIPATIONS_PATH}/${id}`);
}

export function listTaskEvents(id: number): Promise<TaskEventView[]> {
  return request<TaskEventView[]>(`${PARTICIPATIONS_PATH}/${id}/events`);
}

export function approveTaskParticipation(
  id: number,
): Promise<AdminParticipationView> {
  return request<AdminParticipationView>(
    `${PARTICIPATIONS_PATH}/${id}/approve`,
    { method: "POST" },
  );
}

export function rejectTaskParticipation(
  id: number,
  reason: string,
): Promise<AdminParticipationView> {
  return request<AdminParticipationView>(
    `${PARTICIPATIONS_PATH}/${id}/reject`,
    { method: "POST", json: { reason } },
  );
}
