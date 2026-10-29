import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 991px)";

/** 管理端在 992px 以下切换为抽屉导航；与 antd 的 lg 断点保持一致。 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
