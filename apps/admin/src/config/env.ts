import { envIntString, envOptionalString, parseEnv, z } from "@repo/env";

const EnvSchema = z.object({
  ADMIN_PORT: envIntString().default(3000),
  API_BASE_URL: envOptionalString(),
  PORT: envIntString().default(5000),
});

/** 校验后的 admin 环境变量；vite.config.ts 加载时校验失败会直接中断。 */
export const env = parseEnv(EnvSchema, process.env, { label: "admin" });
