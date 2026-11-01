import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "../../../app/utils/datetime";

describe("datetime formatting", () => {
  it("formats a backend local date-time as an archive date", () => {
    expect(formatDate("2026-10-01T09:00:00")).toBe("2026.10.01");
    expect(formatDate("2026-10-01")).toBe("2026.10.01");
  });

  it("adds hours and minutes for detail rows", () => {
    expect(formatDateTime("2026-10-01T09:00:00")).toBe("2026.10.01 09:00");
    expect(formatDateTime("2026-10-01T23:59:00")).toBe("2026.10.01 23:59");
  });

  it("interprets naive timestamps in Asia/Shanghai", () => {
    expect(formatDateTime("2026-10-01T01:00:00Z")).toBe("2026.10.01 09:00");
    expect(formatDateTime("2026-09-30T16:30:00Z")).toBe("2026.10.01 00:30");
  });

  it("returns a placeholder for empty or invalid values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("   ")).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});
