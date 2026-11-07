import { computed, ref, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { API_PREFIX } from "~~/shared/utils/api";

let revision = 0;

/** 兼容旧调用；同源 URL 不再创建 Object URL，无需释放缓存。 */
export function clearFileCache(): void {
  revision += 1;
}

type FileUrlOptions = {
  enabled?: MaybeRefOrGetter<boolean>;
};

/**
 * 生成经过 Nitro 的同源文件 URL。
 *
 * `<img>` 会自然携带 HttpOnly 会话 Cookie，Nitro 在转发时补上 Spring
 * Bearer。这样既不需要浏览器脚本接触令牌，也不需要下载后再创建 Blob URL。
 */
export function useFileUrl(
  fileId: MaybeRefOrGetter<number | null | undefined>,
  options: FileUrlOptions = {},
) {
  const retryKey = ref(revision);
  const currentId = computed(() => toValue(fileId) ?? null);
  const enabled = computed(() =>
    options.enabled === undefined ? true : toValue(options.enabled),
  );
  const url = computed(() => {
    if (!enabled.value || currentId.value === null) {
      return null;
    }

    return `${API_PREFIX}/files/${currentId.value}?v=${retryKey.value}`;
  });

  watch(
    () => currentId.value,
    () => {
      retryKey.value = revision;
    },
  );

  return {
    url,
    loading: ref(false),
    error: ref(false),
    retry: () => {
      revision += 1;
      retryKey.value = revision;
    },
  };
}
