import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../../src/lib/http";

describe("resolveApiBaseUrl", () => {
  it("uses /api/ when the environment value is missing", () => {
    expect(resolveApiBaseUrl(undefined)).toBe("/api/");
  });

  it("uses a configured environment value", () => {
    expect(resolveApiBaseUrl("https://api.example.test/v1")).toBe(
      "https://api.example.test/v1",
    );
  });

  it("trims a configured environment value", () => {
    expect(resolveApiBaseUrl("  /gateway/  ")).toBe("/gateway/");
  });

  it("falls back to /api/ for a blank environment value", () => {
    expect(resolveApiBaseUrl("   ")).toBe("/api/");
  });
});
