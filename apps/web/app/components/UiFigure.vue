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
  }>(),
  {
    fileId: null,
    ratio: "square",
    emptyText: "暂无封面",
    flat: false,
  },
);

const figureRef = ref<HTMLElement | null>(null);
const visible = ref(false);
let observer: IntersectionObserver | null = null;

const { url, loading, error, retry } = useFileUrl(() => props.fileId, {
  enabled: visible,
});

onMounted(() => {
  if (!props.fileId || typeof IntersectionObserver === "undefined") {
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
  >
    <div class="ui-figure__frame">
      <img v-if="url" class="ui-figure__image" :src="url" :alt="alt" />

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
  box-shadow: var(--shadow-paper);
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
  background-color: var(--color-paper);
  background-image: var(--texture-paper);
  background-size: var(--texture-paper-size);
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
}

@keyframes ui-figure-in {
  from {
    opacity: 0;
  }
}

.ui-figure__leaf {
  color: var(--color-line-strong);
  opacity: 0.7;
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
  padding: var(--space-2) var(--space-3);
  border-top: var(--border-line);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}
</style>
