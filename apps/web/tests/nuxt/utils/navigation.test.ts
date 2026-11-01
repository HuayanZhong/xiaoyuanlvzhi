import { describe, expect, it } from "vitest";
import { isNavActive, STUDENT_NAV } from "../../../app/utils/navigation";

describe("student navigation", () => {
  it("lists only implemented modules", () => {
    expect(STUDENT_NAV.map((item) => item.label)).toEqual([
      "首页",
      "绿植",
      "我的",
    ]);
    expect(STUDENT_NAV.map((item) => item.to)).toEqual(["/", "/plants", "/me"]);
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
});
