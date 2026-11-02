/** 通知业务类型的中文标签；未知类型统一显示为系统通知。 */
const BUSINESS_LABELS: Record<string, string> = {
  ADOPTION: "领养申请",
  CARE: "养护打卡",
  TASK: "环保任务",
  REDEMPTION: "兑换订单",
  FEEDBACK: "问题反馈",
};

/** 可以直接跳转的路径，或需要先解析参与记录的任务通知。 */
export type NotificationTarget =
  | { kind: "path"; path: string }
  | { kind: "participation"; participationId: number };

export function notificationTypeLabel(
  value: string | null | undefined,
): string {
  if (!value) {
    return "系统通知";
  }

  return BUSINESS_LABELS[value] ?? "系统通知";
}

/**
 * 把通知映射到学生端业务页面。
 *
 * `TASK` 的 businessId 是参与记录 ID，没有直接路由，交给页面解析；
 * 未知类型或非法 ID 返回 null，调用方只标记已读、不跳转。
 */
export function notificationTarget(
  businessType: string | null | undefined,
  businessId: string | null | undefined,
): NotificationTarget | null {
  const id = readId(businessId);

  if (!businessType || id === null) {
    return null;
  }

  switch (businessType) {
    case "ADOPTION":
      return { kind: "path", path: `/adoptions/${id}` };
    case "CARE":
      return { kind: "path", path: `/care/${id}` };
    case "REDEMPTION":
      return { kind: "path", path: `/rewards/orders/${id}` };
    case "FEEDBACK":
      return { kind: "path", path: `/feedback/${id}` };
    case "TASK":
      return { kind: "participation", participationId: id };
    default:
      return null;
  }
}

function readId(value: string | null | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
