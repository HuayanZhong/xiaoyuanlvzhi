import { envIntString, envOptionalString, parseEnv, z } from "@repo/env";

const EnvSchema = z.object({
  WEB_PORT: envIntString().default(4000),
  API_BASE_URL: envOptionalString(),
});

/** 校验后的 web 环境变量；nuxt.config.ts 加载时校验失败会直接中断。 */
export const env = parseEnv(EnvSchema, process.env, { label: "web" });
