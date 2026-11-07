/** Nitro 写入后浏览器脚本不可读取的学生端会话 Cookie。 */
export const SESSION_COOKIE_NAME = "student-session";

/** 与 Spring 的 7 天会话保持一致。 */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** 学生端所有同源 JSON 请求的固定前缀。 */
export const STUDENT_API_PREFIX = "/api/v1";
