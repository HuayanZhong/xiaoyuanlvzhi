import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 700;

function shouldReduceMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  className?: string;
};

/**
 * 数字滚动计数：挂载时从 0 涨到目标值，数值更新时从当前显示值过渡。
 * 减少动态时直接显示目标值，不启动动画。
 */
export default function AnimatedNumber({
  value,
  duration = DEFAULT_DURATION,
  className,
}: AnimatedNumberProps) {
  const [reduced] = useState(shouldReduceMotion);
  const [display, setDisplay] = useState(() => (reduced ? value : 0));
  const displayRef = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    const from = displayRef.current;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      // 首帧的时间戳可能早于 effect 里取的 start，先夹到 0 避免负数。
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - (1 - progress) ** 3;
      const next = Math.round(from + (value - from) * eased);

      displayRef.current = next;
      setDisplay(next);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return (
    <span aria-label={String(value)} className={className}>
      {reduced ? value : display}
    </span>
  );
}
