<script setup lang="ts">
import { useFileUrl } from "~/composables/useFileUrl";

const props = withDefaults(
  defineProps<{
    fileId?: number | null;
    alt: string;
    ratio?: "square" | "wide";
    caption?: string;
    emptyText?: string;
  }>(),
  {
    fileId: null,
    ratio: "square",
    emptyText: "暂无封面",
  },
);

const { url, loading, error, retry } = useFileUrl(() => props.fileId);
</script>

<template>
  <figure class="ui-figure" :class="`ui-figure--${ratio}`">
    <div class="ui-figure__frame">
      <img v-if="url" class="ui-figure__image" :src="url" :alt="alt" />

      <p v-else-if="loading" class="ui-figure__status">载入中…</p>

      <div v-else-if="error" class="ui-figure__status">
        <span>图片加载失败</span>
        <button type="button" class="ui-figure__retry" @click="retry">
          重试
        </button>
      </div>

      <p v-else class="ui-figure__status">{{ emptyText }}</p>
    </div>

    <figcaption v-if="caption" class="ui-figure__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.ui-figure {
  margin: 0;
  min-width: 0;
}

.ui-figure__frame {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-ink-wash);
  border: var(--border-hairline);
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
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
  text-align: center;
}

.ui-figure__retry {
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background: var(--color-sheet);
  border: var(--border-interactive);
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
}

.ui-figure__caption {
  padding: var(--space-2) 0;
  border-bottom: var(--border-hairline);
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}
</style>
