import { describe, expect, it } from "vitest";
import {
  EnvError,
  envBoolString,
  envIntString,
  envOptionalString,
  envString,
  envUrlString,
  parseEnv,
  z,
} from "../src/index";

const schema = z.object({
  BFF_PORT: envIntString(),
  API_BASE_URL: envString(),
});

describe("parseEnv", () => {
  it("returns typed values when every variable is valid", () => {
    const env = parseEnv(schema, { BFF_PORT: "5000", API_BASE_URL: "/api/" });

    expect(env).toEqual({ BFF_PORT: 5000, API_BASE_URL: "/api/" });
  });

  it("reports every invalid variable, not only the first", () => {
    try {
      parseEnv(schema, { BFF_PORT: "abc", API_BASE_URL: "" });
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      expect((error as EnvError).issues.map((i) => i.path).toSorted()).toEqual([
        "API_BASE_URL",
        "BFF_PORT",
      ]);
    }
  });

  it("names missing variables by their key", () => {
    try {
      parseEnv(schema, {});
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      expect((error as EnvError).issues).toHaveLength(2);
    }
  });

  it("includes the label and per-variable detail in the message", () => {
    try {
      parseEnv(
        schema,
        { BFF_PORT: "0", API_BASE_URL: "/api/" },
        { label: "bff" },
      );
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      const message = (error as EnvError).message;

      expect(message).toContain("(bff)");
      expect(message).toContain("BFF_PORT:");
    }
  });

  it("omits the label group when no label is given", () => {
    try {
      parseEnv(schema, {});
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      expect((error as EnvError).message).not.toContain("(");
    }
  });
});

describe("EnvError", () => {
  it("carries the issues it was constructed with", () => {
    const issues = [{ path: "PORT", message: "expected number" }];

    const error = new EnvError("Invalid environment", issues);

    expect(error.issues).toBe(issues);
    expect(error.name).toBe("EnvError");
  });
});

describe("envString", () => {
  it("accepts a non-empty string and rejects empty or missing", () => {
    expect(envString().parse("value")).toBe("value");
    expect(() => envString().parse("")).toThrow();
    expect(() => envString().parse(undefined)).toThrow();
  });
});

describe("envOptionalString", () => {
  it("accepts a string or a missing value", () => {
    expect(envOptionalString().parse("value")).toBe("value");
    expect(envOptionalString().parse(undefined)).toBeUndefined();
  });
});

describe("envUrlString", () => {
  it("accepts an absolute URL and rejects a relative path", () => {
    expect(envUrlString().parse("https://api.example.test/v1")).toBe(
      "https://api.example.test/v1",
    );
    expect(() => envUrlString().parse("/api/")).toThrow();
  });
});

describe("envIntString", () => {
  it("coerces a numeric string", () => {
    expect(envIntString().parse("5000")).toBe(5000);
  });

  it("rejects non-numeric, zero, negative and fractional input", () => {
    for (const value of ["abc", "0", "-1", "1.5"]) {
      expect(() => envIntString().parse(value)).toThrow();
    }
  });
});

describe("envBoolString", () => {
  it("accepts the four documented forms", () => {
    expect(envBoolString().parse("true")).toBe(true);
    expect(envBoolString().parse("1")).toBe(true);
    expect(envBoolString().parse("false")).toBe(false);
    expect(envBoolString().parse("0")).toBe(false);
  });

  it("rejects values a truthiness coercion would wrongly accept", () => {
    for (const value of ["yes", "no", "on"]) {
      expect(() => envBoolString().parse(value)).toThrow();
    }
  });
});
