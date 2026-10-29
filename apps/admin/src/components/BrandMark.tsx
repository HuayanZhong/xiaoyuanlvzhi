type BrandMarkProps = {
  compact?: boolean;
  tone?: "dark" | "light";
};

/** 品牌文字标识；不使用图形标记，保持后台壳的视觉重心在内容上。 */
export default function BrandMark({
  compact = false,
  tone = "light",
}: BrandMarkProps) {
  const isDark = tone === "dark";

  return (
    <span className="flex items-baseline gap-2">
      <span
        className={[
          "truncate font-semibold leading-tight tracking-tight",
          compact ? "text-sm" : "text-base",
          isDark ? "text-white" : "text-ink",
        ].join(" ")}
      >
        校园绿植领养
      </span>
      {!compact && (
        <span
          className={[
            "text-xs leading-none",
            isDark ? "text-white/55" : "text-muted",
          ].join(" ")}
        >
          管理后台
        </span>
      )}
    </span>
  );
}
