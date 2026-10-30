import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearToken,
  getToken,
  setToken,
  TOKEN_STORAGE_KEY,
} from "../../../src/lib/token";

describe("token storage", () => {
  beforeEach(() => {
    clearToken();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves and reads the access token", () => {
    setToken("spring-token");

    expect(getToken()).toBe("spring-token");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("spring-token");
  });

  it("reads a token written by a previous page load", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "persisted-token");

    expect(getToken()).toBe("persisted-token");
  });

  it("clears the access token from memory and storage", () => {
    setToken("spring-token");

    clearToken();

    expect(getToken()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("keeps the token in memory when storage rejects writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => setToken("memory-only-token")).not.toThrow();
    expect(getToken()).toBe("memory-only-token");
  });

  it("returns null when storage rejects reads", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(getToken()).toBeNull();
  });

  it("does not throw when clearing unavailable storage", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(() => clearToken()).not.toThrow();
  });
});
