import { describe, expect, it } from "vitest";
import {
  canCare,
  canResubmit,
  careStatusMeta,
} from "../../../app/utils/care-status";

describe("care status", () => {
  it("maps the three review states", () => {
    expect(careStatusMeta("PENDING_REVIEW")).toMatchObject({
      label: "待审核",
      tone: "pending",
    });
    expect(careStatusMeta("APPROVED")).toMatchObject({
      label: "已通过",
      tone: "alive",
    });
    expect(careStatusMeta("REJECTED")).toMatchObject({
      label: "已驳回",
      tone: "danger",
      readOnly: false,
    });
  });

  it("treats unknown states as read-only", () => {
    expect(careStatusMeta("SOMETHING_ELSE")).toMatchObject({
      label: "状态未知",
      tone: "neutral",
      readOnly: true,
    });
  });

  it("allows resubmission only for rejected check-ins", () => {
    expect(canResubmit("REJECTED")).toBe(true);
    expect(canResubmit("PENDING_REVIEW")).toBe(false);
    expect(canResubmit("APPROVED")).toBe(false);
  });

  it("allows care only when eligible without a pending check-in", () => {
    expect(canCare({ eligible: true, pendingCheckinId: null })).toBe(true);
    expect(canCare({ eligible: false, pendingCheckinId: null })).toBe(false);
    expect(canCare({ eligible: true, pendingCheckinId: 4 })).toBe(false);
  });
});
