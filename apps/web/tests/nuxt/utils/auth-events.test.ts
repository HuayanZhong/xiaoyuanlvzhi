import type { $Fetch } from "nitropack";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../../app/utils/api";
import {
  emitUnauthorized,
  onUnauthorized,
} from "../../../app/utils/auth-events";
import { createUnauthorizedHandler } from "../../../app/utils/auth-session";

function rawResponse(body: unknown, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    _data: body,
  };
}

function unauthorizedClient(code: string) {
  return {
    raw: vi.fn(async () =>
      rawResponse(
        { success: false, data: null, error: { code, message: "失败" } },
        401,
      ),
    ),
  } as unknown as $Fetch;
}

describe("auth events", () => {
  it("notifies each subscriber once per event and supports unsubscribe", () => {
    const listener = vi.fn();
    const off = onUnauthorized(listener);

    emitUnauthorized();
    expect(listener).toHaveBeenCalledTimes(1);

    off();
    emitUnauthorized();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("clears the session and redirects from a protected page", () => {
    const clear = vi.fn();
    const navigate = vi.fn();
    const handler = createUnauthorizedHandler({
      getRoute: () => ({ path: "/me", fullPath: "/me?tab=points" }),
      clear,
      navigate,
    });

    handler();

    expect(clear).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({
      path: "/login",
      query: { returnTo: "/me?tab=points" },
    });
  });

  it("clears the session silently on a public page", () => {
    const clear = vi.fn();
    const navigate = vi.fn();
    const handler = createUnauthorizedHandler({
      getRoute: () => ({ path: "/unknown", fullPath: "/unknown" }),
      clear,
      navigate,
    });

    handler();

    expect(clear).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not treat a failed login as an expired session", async () => {
    const clear = vi.fn();
    const off = onUnauthorized(
      createUnauthorizedHandler({
        getRoute: () => ({ path: "/login", fullPath: "/login" }),
        clear,
        navigate: vi.fn(),
      }),
    );
    const api = createApiClient({
      fetch: unauthorizedClient("INVALID_CREDENTIALS"),
      onUnauthorized: emitUnauthorized,
    });

    await expect(
      api.request("auth/login", { method: "POST", body: {} }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

    expect(clear).not.toHaveBeenCalled();
    off();
  });

  it("expires the session once on a business 401", async () => {
    const clear = vi.fn();
    const navigate = vi.fn();
    const off = onUnauthorized(
      createUnauthorizedHandler({
        getRoute: () => ({ path: "/", fullPath: "/" }),
        clear,
        navigate,
      }),
    );
    const api = createApiClient({
      fetch: unauthorizedClient("UNAUTHORIZED"),
      onUnauthorized: emitUnauthorized,
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(clear).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({
      path: "/login",
      query: { returnTo: "/" },
    });
    off();
  });
});
