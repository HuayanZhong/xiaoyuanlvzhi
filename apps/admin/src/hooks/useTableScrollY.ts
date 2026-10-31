import { useEffect, useRef, useState } from "react";

const TABLE_RESERVED_HEIGHT = 156;
const MIN_BODY_HEIGHT = 200;

/**
 * 计算表格主体在视口内的可用高度。
 *
 * <p>表格上方有页面标题和筛选区，下方有分页和内容区留白；使用表格容器的
 * 文档顶部位置计算，避免页面滚动后高度跳变。
 */
export function useTableScrollY() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(MIN_BODY_HEIGHT);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const top = container.getBoundingClientRect().top + window.scrollY;
      setScrollY(
        Math.max(
          MIN_BODY_HEIGHT,
          Math.floor(window.innerHeight - top - TABLE_RESERVED_HEIGHT),
        ),
      );
    };

    // oxlint-disable-next-line react/set-state-in-effect -- 挂载后按实际表格位置计算滚动高度
    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, []);

  return { containerRef, scrollY };
}
