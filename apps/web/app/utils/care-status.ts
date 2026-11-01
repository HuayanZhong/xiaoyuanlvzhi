import type { CareEligiblePlant } from "./care-api";

export type CareStatusTone = "pending" | "alive" | "danger" | "neutral";

export type CareStatusMeta = {
  label: string;
  tone: CareStatusTone;
  hint: string;
  readOnly: boolean;
};

const CARE_STATUS: Record<string, CareStatusMeta> = {
  PENDING_REVIEW: {
    label: "待审核",
    tone: "pending",
    hint: "管理员审核后会更新结果",
    readOnly: true,
  },
  APPROVED: {
    label: "已通过",
    tone: "alive",
    hint: "积分按积分规则发放",
    readOnly: true,
  },
  REJECTED: {
    label: "已驳回",
    tone: "danger",
    hint: "查看驳回原因后可重新提交",
    readOnly: false,
  },
};

/** 打卡状态的中文标签与印章样式；未知状态按只读处理。 */
export function careStatusMeta(status: string): CareStatusMeta {
  return (
    CARE_STATUS[status] ?? {
      label: "状态未知",
      tone: "neutral",
      hint: "请联系管理员确认这条记录的状态",
      readOnly: true,
    }
  );
}

/** 只有已驳回的打卡允许重新提交。 */
export function canResubmit(status: string): boolean {
  return status === "REJECTED";
}

/** 当前是否可以提交新的养护打卡。 */
export function canCare(
  plant: Pick<CareEligiblePlant, "eligible" | "pendingCheckinId">,
): boolean {
  return plant.eligible && plant.pendingCheckinId === null;
}
