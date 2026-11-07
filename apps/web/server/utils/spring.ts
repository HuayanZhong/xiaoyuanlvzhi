import type { H3Event } from "h3";
import type { SpringEnvelope } from "~~/shared/utils/api";
import { resolveSpringApiV1Target } from "~~/shared/utils/api";

const ALLOWED_METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

type SpringMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export function assertAllowedMethod(event: H3Event): void {
  if (!ALLOWED_METHODS.has(event.method)) {
    throw createError({
      statusCode: 405,
      statusMessage: "Method Not Allowed",
    });
  }
}

export function buildSpringUrl(
  event: H3Event,
  path: string,
  includeSearch = true,
): string {
  const normalized = normalizeApiPath(path);
  const config = useRuntimeConfig(event);
  const target = resolveSpringApiV1Target(
    config.springApiOrigin,
    normalized,
    includeSearch ? getRequestURL(event).search : "",
  );
  const targetUrl = new URL(target);
  const originUrl = new URL(config.springApiOrigin);

  if (
    targetUrl.origin !== originUrl.origin ||
    !targetUrl.pathname.startsWith("/api/v1/")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid API target",
    });
  }

  return targetUrl.toString();
}

export async function requestSpring<T>(
  event: H3Event,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    includeSearch?: boolean;
  } = {},
) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  try {
    return await $fetch.raw<SpringEnvelope<T>>(
      buildSpringUrl(event, path, options.includeSearch ?? false),
      {
        method: (options.method ?? "GET") as SpringMethod,
        body: options.body as BodyInit | Record<string, unknown> | undefined,
        headers,
        ignoreResponseError: true,
      },
    );
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Spring service unavailable",
    });
  }
}

export function parseEnvelope<T>(value: unknown): SpringEnvelope<T> | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("success" in value) ||
    typeof value.success !== "boolean"
  ) {
    return null;
  }

  return value as SpringEnvelope<T>;
}

export function errorEnvelope(
  event: H3Event,
  status: number,
  code: string,
  message: string,
): SpringEnvelope<null> {
  setResponseStatus(event, status);

  return {
    success: false,
    data: null,
    error: { code, message },
  };
}

function normalizeApiPath(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  let decoded: string;

  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid API path",
    });
  }

  if (
    decoded.includes("..") ||
    decoded.includes("\\") ||
    decoded.startsWith("//")
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid API path",
    });
  }

  return trimmed;
}
