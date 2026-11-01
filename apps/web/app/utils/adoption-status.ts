export type AdoptionStatus =
  | "PENDING_REVIEW"
  | "REJECTED"
  | "WAITING_PICKUP"
  | "CANCEL_REVIEW"
  | "ACTIVE"
  | "RETURN_REVIEW"
  | "ENDED"
  | "CANCELLED";

export type AdoptionTone = "alive" | "pending" | "danger" | "neutral";

export type AdoptionAction = "withdraw" | "resubmit" | "cancel" | "return";

export type AdoptionStatusMeta = {
  label: string;
  tone: AdoptionTone;
  hint: string;
  actions: readonly AdoptionAction[];
};

const META: Record<string, AdoptionStatusMeta> = {
  PENDING_REVIEW: {
    label: "待审核",
    tone: "pending",
    hint: "管理员正在审核，可在此期间撤回申请。",
    actions: ["withdraw"],
  },
  REJECTED: {
    label: "已驳回",
    tone: "danger",
    hint: "查看驳回原因，修改备注后可重新提交。",
    actions: ["resubmit"],
  },
  WAITING_PICKUP: {
    label: "待领取",
    tone: "pending",
    hint: "管理员已分配植株，请按领取说明线下交接；如不再需要可申请取消。",
    actions: ["cancel"],
  },
  CANCEL_REVIEW: {
    label: "取消审核中",
    tone: "neutral",
    hint: "管理员正在处理取消申请，暂不能重复提交。",
    actions: [],
  },
  ACTIVE: {
    label: "养护中",
    tone: "alive",
    hint: "申请已转为养护中，可查看我的绿植；如需结束可申请归还。",
    actions: ["return"],
  },
  RETURN_REVIEW: {
    label: "归还审核中",
    tone: "neutral",
    hint: "管理员正在确认归还，暂不能提交养护打卡。",
    actions: [],
  },
  ENDED: {
    label: "已结束",
    tone: "neutral",
    hint: "本次领养已结束，可查看历史记录。",
    actions: [],
  },
  CANCELLED: {
    label: "已取消",
    tone: "neutral",
    hint: "申请已取消，可重新申请。",
    actions: [],
  },
};

const UNKNOWN: AdoptionStatusMeta = {
  label: "状态未知",
  tone: "neutral",
  hint: "暂不能对该申请执行操作，请稍后刷新。",
  actions: [],
};

/** 取得申请状态的固定文案、印章语气和可用操作；未知状态保持只读。 */
export function adoptionStatusMeta(
  status: string | null | undefined,
): AdoptionStatusMeta {
  return (status && META[status]) || UNKNOWN;
}

/** 判断某个操作在当前状态下是否可用。 */
export function canAdoption(
  status: string | null | undefined,
  action: AdoptionAction,
): boolean {
  return adoptionStatusMeta(status).actions.includes(action);
}
