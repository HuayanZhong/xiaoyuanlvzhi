import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createHttpClient,
  DEFAULT_RETRY_LIMIT,
  DEFAULT_TIMEOUT_MS,
  HTTPError,
  isHTTPError,
  isNetworkError,
  isTimeoutError,
} from "../src";

type FetchMock = (input: Request, init?: RequestInit) => Promise<Response>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createHttpClient", () => {
  it("resolves relative paths against a normalized base URL", async () => {
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse({ ok: true }));
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api",
      fetch: fetchMock,
    });

    const body = await client.get("health").json();

    expect(body).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0].url).toBe(
      "https://api.example.test/api/health",
    );
  });

  it("accepts a URL base URL", async () => {
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse({ ok: true }));
    const client = createHttpClient({
      baseUrl: new URL("https://api.example.test/api"),
      fetch: fetchMock,
    });

    await client.get("health").json();

    expect(fetchMock.mock.calls[0]?.[0].url).toBe(
      "https://api.example.test/api/health",
    );
  });

  it("passes through request options and hooks", async () => {
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse({ ok: true }));
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
      hooks: {
        beforeRequest: [
          ({ request }) => {
            request.headers.set("x-test", "yes");
          },
        ],
      },
    });

    await client.get("health").json();

    expect(fetchMock.mock.calls[0]?.[0].headers.get("x-test")).toBe("yes");
  });

  it("exposes the documented default timeout and retry limit", () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(15_000);
    expect(DEFAULT_RETRY_LIMIT).toBe(2);
  });

  it("retries a failed GET twice by default", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<FetchMock>(
      async () => new Response("unavailable", { status: 500 }),
    );
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
    });

    const result = client
      .get("unavailable")
      .text()
      .catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(1_000);
    const error = await result;

    expect(isHTTPError(error)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(DEFAULT_RETRY_LIMIT + 1);
  });

  it("honors a retry limit override", async () => {
    const fetchMock = vi.fn<FetchMock>(
      async () => new Response("unavailable", { status: 500 }),
    );
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
      retry: { limit: 0 },
    });

    const error = await client
      .get("unavailable")
      .text()
      .catch((caught: unknown) => caught);

    expect(isHTTPError(error)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("exposes status and parsed data for HTTP errors", async () => {
    const fetchMock = vi.fn<FetchMock>(async () =>
      jsonResponse({ message: "missing" }, 404),
    );
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
      retry: { limit: 0 },
    });

    const error = await client
      .get("missing")
      .json()
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HTTPError);

    if (!isHTTPError(error)) {
      throw new Error("Expected an HTTPError");
    }

    expect(error.response.status).toBe(404);
    expect(error.data).toEqual({ message: "missing" });
  });

  it("distinguishes network failures", async () => {
    const fetchMock = vi.fn<FetchMock>(async () => {
      throw new TypeError("Failed to fetch");
    });
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
      retry: { limit: 0 },
    });

    const error = await client
      .get("down")
      .json()
      .catch((caught: unknown) => caught);

    expect(isNetworkError(error)).toBe(true);
    expect(isHTTPError(error)).toBe(false);
  });

  it("uses the default timeout and surfaces a TimeoutError", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<FetchMock>(
      () => new Promise<Response>(() => undefined),
    );
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
      retry: { limit: 0 },
    });

    const result = client
      .get("slow")
      .json()
      .catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(DEFAULT_TIMEOUT_MS);
    const error = await result;

    expect(isTimeoutError(error)).toBe(true);
  });

  it("returns successful JSON bodies without unwrapping a business envelope", async () => {
    const body = {
      code: 0,
      data: { id: "plant-1" },
      message: "ok",
    };
    const fetchMock = vi.fn<FetchMock>(async () => jsonResponse(body));
    const client = createHttpClient({
      baseUrl: "https://api.example.test/api/",
      fetch: fetchMock,
    });

    const result = await client.get("envelope").json();

    expect(result).toEqual(body);
  });

  it("rejects an empty base URL", () => {
    expect(() => createHttpClient({ baseUrl: "   " })).toThrow(
      "baseUrl must not be empty",
    );
  });
});
