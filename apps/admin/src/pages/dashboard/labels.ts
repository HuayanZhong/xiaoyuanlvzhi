import type { DashboardPendingItem } from "@/api/dashboard";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  ADOPTION: "领养申请",
  CARE: "养护打卡",
  TASK: "任务凭证",
  REDEMPTION: "奖励订单",
  FEEDBACK: "问题反馈",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  PENDING_REVIEW: "待审核",
  CANCEL_REVIEW: "取消审核中",
  RETURN_REVIEW: "归还审核中",
  WAITING_PICKUP: "待领取",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "gold",
  PENDING_REVIEW: "gold",
  CANCEL_REVIEW: "orange",
  RETURN_REVIEW: "purple",
  WAITING_PICKUP: "blue",
};

export function businessTypeLabel(value: string): string {
  return BUSINESS_TYPE_LABELS[value] ?? value;
}

export function pendingStatusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value;
}

export function pendingStatusColor(value: string): string {
  return STATUS_COLORS[value] ?? "default";
}

/** 最近记录和计数卡片共用的目标筛选路径。 */
export function recentItemPath(item: DashboardPendingItem): string {
  switch (item.businessType) {
    case "ADOPTION":
      return item.status === "CANCEL_REVIEW" || item.status === "RETURN_REVIEW"
        ? "/adoptions?status=CHANGES"
        : "/adoptions?status=PENDING_REVIEW";
    case "CARE":
      return "/care-reviews?status=PENDING_REVIEW";
    case "TASK":
      return "/tasks?tab=review&status=PENDING_REVIEW";
    case "REDEMPTION":
      return "/points/orders?status=WAITING_PICKUP";
    case "FEEDBACK":
      return "/feedback?status=PENDING";
    default:
      return "/dashboard";
  }
}

export function sortRecentItems(
  items: DashboardPendingItem[],
): DashboardPendingItem[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = (right.submittedAt ?? "").localeCompare(
          left.submittedAt ?? "",
        );

        return byTime !== 0 ? byTime : right.businessId - left.businessId;
      })
  );
}
