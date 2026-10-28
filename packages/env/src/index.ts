import { z, type ZodType } from "zod";

// 重新导出 zod，调用方无需再声明 zod 依赖，避免同一仓库出现多个版本。
export { z };

/** 环境变量校验失败时抛出的错误。 */
export class EnvError extends Error {
  /** 每个不合法变量的路径与原因。 */
  readonly issues: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    issues: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "EnvError";
    this.issues = issues;
  }
}

/**
 * 用 schema 校验环境变量，失败时抛出 `EnvError`。
 *
 * 只做解析与校验，不负责加载：环境文件由应用脚本用 `dotenv-cli` 注入，
 * 调用方传入 `process.env` 或测试替身。
 *
 * @example
 * export const env = parseEnv(EnvSchema, process.env, { label: "bff" });
 */
export function parseEnv<TSchema extends ZodType>(
  schema: TSchema,
  env: Record<string, unknown> = process.env,
  options?: { label?: string },
): TSchema["_output"] {
  const result = schema.safeParse(env);

  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
  const label = options?.label ? ` (${options.label})` : "";
  const detail = issues
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("; ");

  throw new EnvError(`Invalid environment${label}: ${detail}`, issues);
}

/** 必需的非空字符串。 */
export function envString() {
  return z.string().min(1);
}

/** 可选字符串；缺失时得到 `undefined`。 */
export function envOptionalString() {
  return z.string().optional();
}

/** 必需的 URL 字符串。 */
export function envUrlString() {
  return z.url();
}

/** 必需的正整数，自动从字符串转换。 */
export function envIntString() {
  return z.coerce.number().int().positive();
}

/**
 * 必需的布尔值，只接受 `true` / `false` / `1` / `0`。
 *
 * 不用 `z.coerce.boolean()`：它按 JavaScript 真值语义解析，
 * `"false"` 这类非空字符串会变成 `true`。
 */
export function envBoolString() {
  return z
    .enum(["true", "false", "1", "0"])
    .transform((value) => value === "true" || value === "1");
}
