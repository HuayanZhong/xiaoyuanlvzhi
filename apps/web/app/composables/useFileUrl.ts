import { computed, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { useApi } from "./useApi";

const MAX_CACHED_FILES = 40;
const urlCache = new Map<number, string>();
const pendingCache = new Map<number, Promise<string>>();

/** 释放全部封面缓存；退出登录或切换账号时调用。 */
export function clearFileCache(): void {
  if (typeof URL.revokeObjectURL === "function") {
    for (const url of urlCache.values()) {
      URL.revokeObjectURL(url);
    }
  }

  urlCache.clear();
  pendingCache.clear();
}

function rememberUrl(id: number, url: string): void {
  urlCache.set(id, url);

  while (urlCache.size > MAX_CACHED_FILES) {
    const oldest = urlCache.keys().next().value;
    if (oldest === undefined) break;

    const stale = urlCache.get(oldest);
    urlCache.delete(oldest);
    if (stale && typeof URL.revokeObjectURL === "function") {
      URL.revokeObjectURL(stale);
    }
  }
}

function loadFileUrl(id: number): Promise<string> {
  const cached = urlCache.get(id);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingCache.get(id);
  if (pending) {
    return pending;
  }

  const promise = useApi()
    .requestBlob(`files/${id}`)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      rememberUrl(id, url);
      return url;
    })
    .finally(() => {
      pendingCache.delete(id);
    });

  pendingCache.set(id, promise);
  return promise;
}

type FileUrlOptions = {
  /** 进入视口后才开始加载；默认立即加载。 */
  enabled?: MaybeRefOrGetter<boolean>;
};

/**
 * 带登录态读取文件并转换成对象 URL。
 *
 * Spring 的文件接口要求认证，`<img src>` 无法携带 Bearer；服务端也没有
 * 对象 URL。因此挂载前保持加载态，由客户端取 blob 后再替换。
 * 相同文件按 id 复用对象 URL，并合并并发请求；可用 `enabled` 延迟到可见时加载。
 */
export function useFileUrl(
  fileId: MaybeRefOrGetter<number | null | undefined>,
  options: FileUrlOptions = {},
) {
  const currentId = computed(() => toValue(fileId) ?? null);
  const enabled = computed(() =>
    options.enabled === undefined ? true : toValue(options.enabled),
  );
  const url = ref<string | null>(null);
  const error = ref(false);
  const loading = ref(currentId.value !== null);

  let requestId = 0;
  let mounted = false;

  async function load(id: number | null) {
    const request = ++requestId;

    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    error.value = false;

    if (id === null) {
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      url.value = null;
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      loading.value = false;
      return;
    }

    const cached = urlCache.get(id);
    if (cached) {
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      url.value = cached;
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      loading.value = false;
      return;
    }

    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    url.value = null;
    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    loading.value = true;

    try {
      const next = await loadFileUrl(id);

      if (request !== requestId) {
        return;
      }

      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      url.value = next;
    } catch {
      if (request !== requestId) {
        return;
      }

      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      error.value = true;
    } finally {
      if (request === requestId) {
        // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
        loading.value = false;
      }
    }
  }

  onMounted(() => {
    mounted = true;

    if (enabled.value) {
      void load(currentId.value);
    }
  });

  watch([currentId, enabled], ([id, isEnabled]) => {
    if (!mounted || !isEnabled) {
      return;
    }

    void load(id);
  });

  onBeforeUnmount(() => {
    requestId += 1;
  });

  return {
    url,
    loading,
    error,
    retry: () => load(currentId.value),
  };
}
