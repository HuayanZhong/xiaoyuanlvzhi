import { useCallback, useEffect, useState } from "react";
import { loadImage } from "@/api/files";

type FileUrlState = {
  fileId: number | null | undefined;
  url: string | null;
  loading: boolean;
  error: boolean;
};

export type FileUrlResult = {
  url: string | null;
  loading: boolean;
  error: boolean;
  reload: () => void;
};

/**
 * 图片接口需要 Bearer，不能直接作为 `img src`。
 * 带认证读取文件并转换成 blob URL；`fileId` 变化或为空时立即隐藏旧图，
 * 组件卸载、切换文件或重试时释放上一个对象 URL。
 */
export function useFileUrl(fileId: number | null | undefined): FileUrlResult {
  const [state, setState] = useState<FileUrlState>({
    fileId,
    url: null,
    loading: fileId != null,
    error: false,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (fileId == null) {
      // oxlint-disable-next-line react/set-state-in-effect -- 清空已卸载文件的状态
      setState({ fileId, url: null, loading: false, error: false });
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 开始加载新文件
    setState({ fileId, url: null, loading: true, error: false });

    const load = async () => {
      try {
        const blob = await loadImage(fileId);

        if (!active) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setState({ fileId, url: objectUrl, loading: false, error: false });
      } catch {
        if (active) {
          setState({ fileId, url: null, loading: false, error: true });
        }
      }
    };

    void load();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- version 只用于 reload 重新触发加载
  }, [fileId, version]);

  const reload = useCallback(() => {
    if (fileId != null) {
      setVersion((current) => current + 1);
    }
  }, [fileId]);

  // 状态可能仍属于上一个 `fileId`；用当前值派生，避免切换时闪现旧图。
  const current = state.fileId === fileId;

  return {
    url: current ? state.url : null,
    loading: current ? state.loading : fileId != null,
    error: current ? state.error : false,
    reload,
  };
}
