import { computed, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { useApi } from "./useApi";

/**
 * 带登录态读取文件并转换成对象 URL。
 *
 * Spring 的文件接口要求认证，`<img src>` 无法携带 Bearer；服务端也没有
 * 对象 URL。因此挂载前保持加载态，由客户端取 blob 后再替换。
 */
export function useFileUrl(
  fileId: MaybeRefOrGetter<number | null | undefined>,
) {
  const currentId = computed(() => toValue(fileId) ?? null);
  const url = ref<string | null>(null);
  const error = ref(false);
  const loading = ref(currentId.value !== null);

  let objectUrl: string | null = null;
  let requestId = 0;
  let mounted = false;

  function release() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }

  async function load(id: number | null) {
    const request = ++requestId;

    release();
    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    url.value = null;
    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    error.value = false;

    if (id === null) {
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      loading.value = false;
      return;
    }

    // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
    loading.value = true;

    try {
      const blob = await useApi().requestBlob(`files/${id}`);

      if (request !== requestId) {
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      // oxlint-disable-next-line react/immutability -- Vue ref 需要直接赋值
      url.value = objectUrl;
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
    void load(currentId.value);
  });

  watch(currentId, (id) => {
    if (mounted) {
      void load(id);
    }
  });

  onBeforeUnmount(() => {
    requestId += 1;
    release();
  });

  return {
    url,
    loading,
    error,
    retry: () => load(currentId.value),
  };
}
