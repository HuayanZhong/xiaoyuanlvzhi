import { useEffect, useRef, useState } from "react";

const TABLE_RESERVED_HEIGHT = 156;
const MIN_BODY_HEIGHT = 200;

/**
 * 计算表格主体的可用高度，并让短表格贴合内容高度。
 *
 * <p>可用高度按表格在页面中的实际位置计算；行数很少时不再用空白撑满
 * 视口，内容较多时仍限制在可用高度内，由表格主体滚动。
 */
export function useTableScrollY(rowCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState(MIN_BODY_HEIGHT);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const top = container.getBoundingClientRect().top + window.scrollY;
      setAvailableHeight(
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

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const body = container.querySelector<HTMLElement>(".ant-table-tbody");
    setContentHeight(
      rowCount === 0
        ? 0
        : body
          ? Math.ceil(body.getBoundingClientRect().height) + 2
          : 0,
    );
  }, [rowCount]);

  const fitsViewport = contentHeight > 0 && contentHeight <= availableHeight;

  return {
    containerRef,
    scrollY: fitsViewport ? null : availableHeight,
  };
}
