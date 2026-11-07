import { describe, expect, it } from "vitest";
import {
  isNavActive,
  isNavItemActive,
  STUDENT_NAV,
} from "../../../app/utils/navigation";

describe("student navigation", () => {
  it("lists only implemented modules", () => {
    expect(STUDENT_NAV.map((item) => item.label)).toEqual([
      "首页",
      "绿植",
      "行动",
      "积分",
      "我的",
    ]);
    expect(STUDENT_NAV.map((item) => item.to)).toEqual([
      "/",
      "/plants",
      "/tasks",
      "/points",
      "/me",
    ]);
  });

  it("treats detail routes as part of their module", () => {
    expect(isNavActive("/plants/3", "/plants")).toBe(true);
    expect(isNavActive("/plants", "/plants")).toBe(true);
    expect(isNavActive("/plantsx", "/plants")).toBe(false);
    expect(isNavActive("/plants-old", "/plants")).toBe(false);
  });

  it("keeps the home entry exact and ignores unrelated modules", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/plants", "/")).toBe(false);
    expect(isNavActive("/me", "/plants")).toBe(false);
  });

  it("marks the points entry active on rewards pages", () => {
    const points = STUDENT_NAV.find((item) => item.to === "/points")!;

    expect(isNavItemActive("/points", points)).toBe(true);
    expect(isNavItemActive("/rewards", points)).toBe(true);
    expect(isNavItemActive("/rewards/orders", points)).toBe(true);
    expect(isNavItemActive("/rewards/orders/9", points)).toBe(true);
    expect(isNavItemActive("/tasks", points)).toBe(false);
  });
});
