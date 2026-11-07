<script setup lang="ts">
import { useFileUrl } from "~/composables/useFileUrl";

const props = withDefaults(
  defineProps<{
    fileId?: number | null;
    alt: string;
    ratio?: "square" | "wide";
    caption?: string;
    emptyText?: string;
    flat?: boolean;
    fallbackSrc?: string;
    focalPoint?: string;
    priority?: boolean;
  }>(),
  {
    fileId: null,
    ratio: "square",
    emptyText: "暂无封面",
    flat: false,
    focalPoint: "50% 50%",
    priority: false,
  },
);

const figureRef = ref<HTMLElement | null>(null);
const visible = ref(
  props.priority || (!props.fileId && Boolean(props.fallbackSrc)),
);
const imageError = ref(false);
let observer: IntersectionObserver | null = null;

const { url, loading, error, retry } = useFileUrl(() => props.fileId, {
  enabled: visible,
});

onMounted(() => {
  if (
    props.priority ||
    !props.fileId ||
    typeof IntersectionObserver === "undefined"
  ) {
    visible.value = true;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visible.value = true;
        observer?.disconnect();
        observer = null;
      }
    },
    { rootMargin: "200px 0px" },
  );

  if (figureRef.value) {
    observer.observe(figureRef.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});
</script>

<template>
  <figure
    ref="figureRef"
    class="ui-figure"
    :class="[`ui-figure--${ratio}`, { 'ui-figure--flat': flat }]"
    data-cursor-hover
  >
    <div class="ui-figure__frame">
      <img
        v-if="(url && !imageError) || fallbackSrc"
        class="ui-figure__image"
        :src="imageError ? fallbackSrc : (url ?? fallbackSrc)"
        :alt="alt"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        :style="{ objectPosition: focalPoint }"
        @error="imageError = true"
      />

      <div v-else-if="error" class="ui-figure__status">
        <UiLeafMark name="leaf" :size="24" filled class="ui-figure__leaf" />
        <span>图片加载失败</span>
        <button type="button" class="ui-figure__retry" @click="retry">
          重试
        </button>
      </div>

      <div v-else class="ui-figure__status">
        <UiLeafMark name="leaf" :size="24" filled class="ui-figure__leaf" />
        <span>{{ loading ? "载入中…" : emptyText }}</span>
      </div>
    </div>

    <figcaption v-if="caption" class="ui-figure__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.ui-figure {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-none);
}

.ui-figure--flat {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.ui-figure--flat .ui-figure__frame {
  border: var(--border-line);
  border-radius: var(--radius-control);
}

.ui-figure--flat .ui-figure__caption {
  border-top: 0;
}

.ui-figure__frame {
  display: grid;
  place-items: center;
  overflow: hidden;
  background-color: var(--color-ink-wash);
  background-image: var(--texture-paper), var(--texture-page);
  background-size:
    var(--texture-paper-size),
    100% 100%;
}

.ui-figure--square .ui-figure__frame {
  aspect-ratio: 1 / 1;
}

.ui-figure--wide .ui-figure__frame {
  aspect-ratio: 4 / 3;
}

.ui-figure__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: ui-figure-in var(--motion-enter);
  transition:
    transform var(--motion-image),
    opacity var(--motion-enter);
}

@keyframes ui-figure-in {
  from {
    opacity: 0;
  }
}

.ui-figure__leaf {
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: var(--space-1);
  color: var(--color-leaf);
  opacity: 0.58;
}

.ui-figure__status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: var(--space-3);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  text-align: center;
}

.ui-figure__retry {
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: var(--border-strong);
  border-radius: var(--radius-chip);
  color: var(--color-ink);
  font-size: var(--font-size-small);
}

.ui-figure__retry:hover {
  background: var(--color-ink-wash);
}

.ui-figure__caption {
  padding: var(--space-3);
  background: var(--color-surface-muted);
  border-top: 0;
  color: var(--color-soil);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-label);
}
</style>
