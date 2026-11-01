import type { EcoTask, TaskParticipation } from "./task-api";

export type TaskStatusTone = "alive" | "pending" | "danger" | "neutral";

export type TaskStatusMeta = {
  label: string;
  tone: TaskStatusTone;
  hint: string;
};

const TASK_STATUS: Record<string, TaskStatusMeta> = {
  UPCOMING: {
    label: "尚未开始",
    tone: "neutral",
    hint: "任务开放后可以报名。",
  },
  ONGOING: {
    label: "进行中",
    tone: "alive",
    hint: "开放报名，截止前可以提交凭证。",
  },
  ENDED: {
    label: "已结束",
    tone: "neutral",
    hint: "任务已结束，不能报名或提交新凭证。",
  },
};

/** 任务展示状态的中文标签与印章样式；未知状态按只读处理。 */
export function taskStatusMeta(status: string): TaskStatusMeta {
  return (
    TASK_STATUS[status] ?? {
      label: "状态未知",
      tone: "neutral",
      hint: "请联系管理员确认任务状态。",
    }
  );
}

export type ParticipationStatusMeta = TaskStatusMeta & {
  readOnly: boolean;
};

const PARTICIPATION_STATUS: Record<string, ParticipationStatusMeta> = {
  JOINED: {
    label: "已报名",
    tone: "pending",
    hint: "完成任务后提交凭证，等待管理员审核。",
    readOnly: false,
  },
  PENDING_REVIEW: {
    label: "待审核",
    tone: "pending",
    hint: "凭证已提交，管理员审核后会更新结果。",
    readOnly: true,
  },
  APPROVED: {
    label: "已通过",
    tone: "alive",
    hint: "奖励积分按任务规则发放。",
    readOnly: true,
  },
  REJECTED: {
    label: "已驳回",
    tone: "danger",
    hint: "查看驳回原因后可以重新提交。",
    readOnly: false,
  },
};

/** 参与状态的中文标签与印章样式；未知状态按只读处理。 */
export function participationStatusMeta(
  status: string,
): ParticipationStatusMeta {
  return (
    PARTICIPATION_STATUS[status] ?? {
      label: "状态未知",
      tone: "neutral",
      hint: "请联系管理员确认这条参与记录的状态。",
      readOnly: true,
    }
  );
}

/** 剩余名额；不设上限时返回 `null`。 */
export function remainingQuota(
  task: Pick<EcoTask, "maxParticipants" | "participantCount">,
): number | null {
  if (task.maxParticipants === null) {
    return null;
  }

  return Math.max(0, task.maxParticipants - task.participantCount);
}

/** 名额是否已满；不设上限时永远未满。 */
export function isFull(
  task: Pick<EcoTask, "maxParticipants" | "participantCount">,
): boolean {
  return (
    task.maxParticipants !== null &&
    task.participantCount >= task.maxParticipants
  );
}

/** 当前学生是否可以报名：进行中、未满额且尚未参与。 */
export function canJoin(
  task: Pick<
    EcoTask,
    | "status"
    | "currentUserParticipating"
    | "maxParticipants"
    | "participantCount"
  >,
): boolean {
  return (
    task.status === "ONGOING" && !task.currentUserParticipating && !isFull(task)
  );
}

/** 当前学生是否可以提交或重新提交凭证。 */
export function canSubmit(
  task: Pick<EcoTask, "status" | "requireText" | "requirePhoto">,
  participation: Pick<TaskParticipation, "status"> | null,
): boolean {
  if (!participation || task.status !== "ONGOING") {
    return false;
  }

  if (!task.requireText && !task.requirePhoto) {
    return false;
  }

  return (
    participation.status === "JOINED" || participation.status === "REJECTED"
  );
}
