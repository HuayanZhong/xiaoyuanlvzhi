import { envIntString, parseEnv, z } from "@repo/env";

const EnvSchema = z.object({
  PORT: envIntString().default(5000),
});

/** 校验后的 BFF 环境变量；模块加载时校验失败会直接抛错，阻止带病启动。 */
export const env = parseEnv(EnvSchema, process.env, { label: "bff" });
