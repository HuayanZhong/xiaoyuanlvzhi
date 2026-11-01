import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
  isRangeWithinLimit,
  toStatisticsRange,
} from "@/pages/statistics/range";

describe("statistics range helpers", () => {
  it("allows a range of 367 natural days", () => {
    const from = dayjs("2026-01-01");
    const to = from.add(366, "day");

    expect(isRangeWithinLimit(from, to)).toBe(true);
  });

  it("rejects a range longer than 367 natural days", () => {
    const from = dayjs("2026-01-01");
    const to = from.add(367, "day");

    expect(isRangeWithinLimit(from, to)).toBe(false);
  });

  it("formats the applied range as ISO dates", () => {
    expect(toStatisticsRange(dayjs("2026-10-01"), dayjs("2026-10-31"))).toEqual(
      { from: "2026-10-01", to: "2026-10-31" },
    );
  });
});
