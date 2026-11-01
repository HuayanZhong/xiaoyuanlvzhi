import { describe, expect, it } from "vitest";
import {
  adoptionStatusMeta,
  canAdoption,
  type AdoptionStatus,
} from "../../../app/utils/adoption-status";

const EXPECTED: Array<[AdoptionStatus, string, string, string[]]> = [
  ["PENDING_REVIEW", "待审核", "pending", ["withdraw"]],
  ["REJECTED", "已驳回", "danger", ["resubmit"]],
  ["WAITING_PICKUP", "待领取", "pending", ["cancel"]],
  ["CANCEL_REVIEW", "取消审核中", "neutral", []],
  ["ACTIVE", "养护中", "alive", ["return"]],
  ["RETURN_REVIEW", "归还审核中", "neutral", []],
  ["ENDED", "已结束", "neutral", []],
  ["CANCELLED", "已取消", "neutral", []],
];

describe("adoption status mapping", () => {
  it.each(EXPECTED)(
    "%s uses a fixed label, tone and actions",
    (status, label, tone, actions) => {
      const meta = adoptionStatusMeta(status);

      expect(meta.label).toBe(label);
      expect(meta.tone).toBe(tone);
      expect(meta.actions).toEqual(actions);
      expect(meta.hint.length).toBeGreaterThan(0);
    },
  );

  it("keeps unknown statuses read-only", () => {
    const meta = adoptionStatusMeta("SOMETHING_NEW");

    expect(meta.label).toBe("状态未知");
    expect(meta.actions).toEqual([]);
    expect(adoptionStatusMeta(null).actions).toEqual([]);
    expect(adoptionStatusMeta(undefined).actions).toEqual([]);
  });

  it("guards each action by status", () => {
    expect(canAdoption("PENDING_REVIEW", "withdraw")).toBe(true);
    expect(canAdoption("PENDING_REVIEW", "cancel")).toBe(false);
    expect(canAdoption("REJECTED", "resubmit")).toBe(true);
    expect(canAdoption("WAITING_PICKUP", "cancel")).toBe(true);
    expect(canAdoption("ACTIVE", "return")).toBe(true);
    expect(canAdoption("ENDED", "return")).toBe(false);
  });
});
