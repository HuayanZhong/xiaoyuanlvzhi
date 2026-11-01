import type { Dayjs } from "dayjs";
import type { StatisticsRange } from "@/api/statistics";

/** 服务端最多接受 367 个自然日，对应起止日期差不超过 366 天。 */
export const MAX_RANGE_DAYS = 367;

export function isRangeWithinLimit(from: Dayjs, to: Dayjs): boolean {
  return to.diff(from, "day") < MAX_RANGE_DAYS;
}

export function toStatisticsRange(from: Dayjs, to: Dayjs): StatisticsRange {
  return {
    from: from.format("YYYY-MM-DD"),
    to: to.format("YYYY-MM-DD"),
  };
}
