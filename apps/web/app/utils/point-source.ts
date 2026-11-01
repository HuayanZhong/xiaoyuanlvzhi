const SOURCE_LABELS: Record<string, string> = {
  CARE_CHECKIN: "养护打卡",
  ECO_TASK: "环保任务",
  REDEMPTION: "兑换扣减",
  REDEMPTION_REFUND: "兑换退回",
  ADJUSTMENT: "管理员调整",
};

/** 积分来源的中文标签；未知来源显示「其他变动」，不隐藏该条流水。 */
export function pointSourceLabel(sourceType: string): string {
  return SOURCE_LABELS[sourceType] ?? "其他变动";
}

/** 积分的带符号文本，增加带 `+`，扣减保留负号。 */
export function formatPointDelta(deltaPoints: number): string {
  return deltaPoints > 0 ? `+${deltaPoints}` : String(deltaPoints);
}
