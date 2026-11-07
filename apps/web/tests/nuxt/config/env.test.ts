import { EnvError } from "@repo/env";
import { describe, expect, it } from "vitest";
import { parseWebEnv } from "../../../config/env";

describe("web env", () => {
  it("uses the documented defaults when nothing is configured", () => {
    const env = parseWebEnv({});

    expect(env.WEB_PORT).toBe(4000);
    expect(env.SPRING_API_ORIGIN).toBe("http://localhost:8080");
  });

  it("strips a trailing slash from the Spring origin", () => {
    const env = parseWebEnv({ SPRING_API_ORIGIN: "http://localhost:8080/" });

    expect(env.SPRING_API_ORIGIN).toBe("http://localhost:8080");
  });

  it.each([
    "http://localhost:8080/api",
    "http://localhost:8080?debug=1",
    "http://localhost:8080#dev",
    "smtp://localhost:8080",
    "not-a-url",
  ])("rejects a Spring origin with a path, query or fragment: %s", (origin) => {
    expect(() => parseWebEnv({ SPRING_API_ORIGIN: origin })).toThrowError(
      EnvError,
    );
  });
});
