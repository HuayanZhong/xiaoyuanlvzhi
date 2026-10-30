import { useEffect, useState } from "react";
import { loadImage } from "@/api/files";

/**
 * 图片接口需要 Bearer，不能直接作为 `img src`。
 * 这里带认证读取文件并转换成 blob URL，组件卸载或文件变化时释放。
 */
export function useFileUrl(fileId: number | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (fileId == null) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        const blob = await loadImage(fileId);

        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        if (active) {
          setUrl(null);
        }
      }
    };

    // oxlint-disable-next-line react/set-state-in-effect -- blob 就绪后回填预览地址
    void load();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  return url;
}
