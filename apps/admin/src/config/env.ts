import {
  envIntString,
  envOptionalString,
  envUrlString,
  parseEnv,
  z,
} from "@repo/env";

const EnvSchema = z.object({
  ADMIN_PORT: envIntString().default(3000),
  API_BASE_URL: envOptionalString(),
  SPRING_API_ORIGIN: envUrlString().default("http://localhost:8080"),
});

/** 校验后的 admin 环境变量；vite.config.ts 加载时校验失败会直接中断。 */
export const env = parseEnv(EnvSchema, process.env, { label: "admin" });
