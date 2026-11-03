import type { ReactNode } from "react";
import AnimatedNumber from "./AnimatedNumber";

export type PageStat = {
  label: string;
  value: ReactNode;
  hint?: string;
};

type PageStatsProps = {
  items: PageStat[];
};

/** 模块页顶部的概览条：用真实列表数据汇总当前页面规模。 */
export default function PageStats({ items }: PageStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          className="page-stats__item rounded-surface border border-line px-4 py-3"
          key={item.label}
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <p className="m-0 text-caption text-muted">{item.label}</p>
          <p className="mt-1 mb-0 text-value font-semibold leading-none text-ink tabular-nums">
            {typeof item.value === "number" ? (
              <AnimatedNumber value={item.value} />
            ) : (
              item.value
            )}
          </p>
          {item.hint ? (
            <p className="mt-1 mb-0 text-caption text-muted">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
