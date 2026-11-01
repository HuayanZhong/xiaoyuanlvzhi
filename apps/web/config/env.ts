import { envIntString, envOptionalString, parseEnv, z } from "@repo/env";

const DEFAULT_SPRING_API_ORIGIN = "http://localhost:8080";

const SpringApiOriginSchema = z
  .string()
  .default(DEFAULT_SPRING_API_ORIGIN)
  .transform((value) => value.trim())
  .refine(isOriginOnly, {
    message: "SPRING_API_ORIGIN 必须是不带路径、查询或片段的 http(s) 源地址",
  })
  .transform((value) => value.replace(/\/+$/, ""));

const WebEnvSchema = z.object({
  WEB_PORT: envIntString().default(4000),
  API_BASE_URL: envOptionalString(),
  SPRING_API_ORIGIN: SpringApiOriginSchema,
});

/**
 * 校验 web 的环境变量；`nuxt.config.ts` 加载配置时失败会直接中断启动。
 *
 * `SPRING_API_ORIGIN` 只接受源地址，避免配置了路径后与 Nitro 代理目标
 * 叠加成重复路径；末尾斜杠会被去掉。
 */
export function parseWebEnv(source: Record<string, unknown>) {
  return parseEnv(WebEnvSchema, source, { label: "web" });
}

/** 校验后的 web 环境变量。 */
export const env = parseWebEnv(process.env);

function isOriginOnly(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.username === "" &&
      url.password === "" &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}
