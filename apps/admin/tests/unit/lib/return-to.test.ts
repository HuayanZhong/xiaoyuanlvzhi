import { describe, expect, it } from "vitest";
import { resolveReturnTo } from "../../../src/lib/return-to";

describe("resolveReturnTo", () => {
  it("keeps an internal path", () => {
    expect(resolveReturnTo("/plants/instances")).toBe("/plants/instances");
  });

  it("keeps an internal path with query and hash", () => {
    expect(resolveReturnTo("/students?page=2#top")).toBe(
      "/students?page=2#top",
    );
  });

  it("falls back for a missing value", () => {
    expect(resolveReturnTo(undefined)).toBe("/dashboard");
    expect(resolveReturnTo(null)).toBe("/dashboard");
    expect(resolveReturnTo("")).toBe("/dashboard");
  });

  it("rejects a protocol-relative path", () => {
    expect(resolveReturnTo("//example.test")).toBe("/dashboard");
  });

  it("rejects an external URL", () => {
    expect(resolveReturnTo("https://example.test")).toBe("/dashboard");
  });

  it("rejects a backslash variant", () => {
    expect(resolveReturnTo("/\\example.test")).toBe("/dashboard");
    expect(resolveReturnTo("/students\\..\\admin")).toBe("/dashboard");
  });
});
