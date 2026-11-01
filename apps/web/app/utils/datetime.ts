const EMPTY = "—";
const TIME_ZONE = "Asia/Shanghai";

const DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/**
 * 把后端时间转成档案格式（`2026.10.01`）。
 *
 * 后端返回的 LocalDateTime 不带时区，按 `Asia/Shanghai` 解释；固定时区
 * 也避免服务端与浏览器时区不同造成 SSR 水合不一致。
 */
export function formatDate(value: string | null | undefined): string {
  return format(value, DATE_FORMATTER);
}

/** 日期加时分（`2026.10.01 17:00`）。 */
export function formatDateTime(value: string | null | undefined): string {
  return format(value, DATETIME_FORMATTER);
}

function format(
  value: string | null | undefined,
  formatter: Intl.DateTimeFormat,
): string {
  const instant = parseInstant(value);

  if (!instant) {
    return EMPTY;
  }

  return formatter.format(instant).replaceAll("/", ".");
}

function parseInstant(value: string | null | undefined): Date | null {
  const text = value?.trim();

  if (!text) {
    return null;
  }

  const instant = new Date(NAIVE_DATETIME.test(text) ? `${text}+08:00` : text);

  return Number.isNaN(instant.getTime()) ? null : instant;
}
