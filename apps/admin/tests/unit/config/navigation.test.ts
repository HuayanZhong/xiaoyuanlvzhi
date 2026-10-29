import { describe, expect, it } from "vitest";
import {
  findGroupByPath,
  findItemByPath,
  getBreadcrumb,
  navGroups,
} from "../../../src/config/navigation";

describe("navigation config", () => {
  it("defines five groups and thirteen menu items", () => {
    expect(navGroups.map((group) => group.label)).toEqual([
      "运营",
      "资源",
      "积分",
      "用户",
      "数据",
    ]);
    expect(navGroups.flatMap((group) => group.items)).toHaveLength(13);
  });

  it("finds the group and item for a path", () => {
    expect(findGroupByPath("/plants/instances")?.key).toBe("resources");
    expect(findItemByPath("/plants/instances")?.label).toBe("单株库存");
  });

  it("matches nested detail paths against their menu item", () => {
    expect(findItemByPath("/plants/instances/PL-001")?.key).toBe("instances");
    expect(findGroupByPath("/points/orders/ORD-001")?.key).toBe("points");
  });

  it("ignores query strings when deriving navigation", () => {
    expect(findGroupByPath("/tasks?tab=proofs")?.key).toBe("operations");
    expect(findItemByPath("/tasks?tab=proofs")?.key).toBe("tasks");
  });

  it("builds a breadcrumb from the group and item", () => {
    expect(getBreadcrumb("/adoptions")).toEqual([
      { title: "运营" },
      { title: "领养管理", path: "/adoptions" },
    ]);
  });

  it("falls back to an empty breadcrumb for unknown paths", () => {
    expect(getBreadcrumb("/unknown")).toEqual([]);
    expect(findGroupByPath("/unknown")).toBeUndefined();
    expect(findItemByPath("/unknown")).toBeUndefined();
  });
});
