import { useApi } from "~/composables/useApi";

/** 学生可见的环保任务。 */
export type EcoTask = {
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
  currentUserParticipating: boolean;
  createdAt: string;
  updatedAt: string;
};

/** 一次任务凭证版本。 */
export type TaskSubmission = {
  id: number;
  version: number;
  note: string | null;
  imageFileIds: number[];
  status: string;
  reviewReason: string | null;
  reviewerEmail: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

/** 当前学生在某个任务上的参与记录。 */
export type TaskParticipation = {
  id: number;
  taskId: number;
  taskTitle: string;
  studentId: number;
  studentEmail: string;
  status: string;
  joinedAt: string;
  submissions: TaskSubmission[];
};

export type TaskEvidenceInput = {
  note?: string;
  imageFileIds?: number[];
};

/** 全部已发布任务；进行中、未开始和已结束混在一起。 */
export function listTasks() {
  return useApi().request<EcoTask[]>("tasks");
}

/** 单个已发布任务；已停用或不存在的任务返回 404。 */
export function getTask(id: number | string) {
  return useApi().request<EcoTask>(`tasks/${id}`);
}

/** 报名任务；服务端拒绝时返回 `TASK_NOT_OPEN`、`TASK_FULL` 或重复报名。 */
export function joinTask(id: number | string) {
  return useApi().request<TaskParticipation>(`tasks/${id}/join`, {
    method: "POST",
  });
}

/** 当前学生的全部参与记录，按报名时间倒序。 */
export function listParticipations() {
  return useApi().request<TaskParticipation[]>("tasks/participations");
}

/** 提交或重新提交任务凭证。 */
export function submitTaskEvidence(
  participationId: number | string,
  input: TaskEvidenceInput,
) {
  return useApi().request<TaskParticipation>(
    `tasks/participations/${participationId}/submissions`,
    { method: "POST", body: input },
  );
}
