type BrandMarkProps = {
  compact?: boolean;
  tone?: "dark" | "light";
};

export default function BrandMark({
  compact = false,
  tone = "light",
}: BrandMarkProps) {
  const isDark = tone === "dark";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={[
          "flex shrink-0 items-center justify-center rounded-control",
          compact ? "h-8 w-8" : "h-10 w-10",
          isDark
            ? "bg-white/10 text-white ring-1 ring-white/15"
            : "bg-primary text-white",
        ].join(" ")}
      >
        <LeafIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <span className="min-w-0">
        <span
          className={[
            "block truncate font-semibold",
            compact ? "text-sm" : "text-base",
            isDark ? "text-white" : "text-ink",
          ].join(" ")}
        >
          校园绿植领养
        </span>
        {!compact && (
          <span
            className={
              isDark
                ? "mt-0.5 block text-xs text-white/55"
                : "mt-0.5 block text-xs text-muted"
            }
          >
            管理后台
          </span>
        )}
      </span>
    </div>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20.5 3.5C13.8 3.5 7.5 7.2 7.5 14.2c0 2.8 1.7 5.1 4.5 5.6 7.3 1.2 8.5-7.4 8.5-16.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M4 20c1.8-5.2 6.2-8.6 12-11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
