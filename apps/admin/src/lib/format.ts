const pad = (part: number) => String(part).padStart(2, "0");

/** 把 Spring 的 ISO 日期时间格式化为 `YYYY-MM-DD HH:mm`。 */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
