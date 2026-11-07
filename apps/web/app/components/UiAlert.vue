<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-vue-next";

withDefaults(
  defineProps<{
    tone?: "error" | "success" | "info" | "warning";
  }>(),
  {
    tone: "error",
  },
);
</script>

<template>
  <div
    class="ui-alert"
    :class="`ui-alert--${tone}`"
    :role="tone === 'error' ? 'alert' : 'status'"
    :aria-live="tone === 'error' ? undefined : 'polite'"
  >
    <CircleAlert v-if="tone === 'error'" :size="18" :stroke-width="1.5" />
    <CircleCheck
      v-else-if="tone === 'success'"
      :size="18"
      :stroke-width="1.5"
    />
    <Info v-else-if="tone === 'info'" :size="18" :stroke-width="1.5" />
    <TriangleAlert v-else :size="18" :stroke-width="1.5" />
    <slot />
  </div>
</template>

<style scoped>
.ui-alert {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: var(--space-4) var(--space-4);
  border: 1px solid transparent;
  border-left-width: 3px;
  border-radius: var(--radius-control);
  color: var(--color-ink);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
  animation: alert-in var(--motion-enter);
}

.ui-alert > svg {
  flex: none;
  margin-top: 0.12rem;
}

.ui-alert--error {
  background: var(--color-blush-wash);
  border-left-color: var(--color-blush);
}

.ui-alert--success {
  background: var(--color-leaf-wash);
  border-left-color: var(--color-leaf);
}

.ui-alert--info {
  background: var(--color-ink-wash);
  border-left-color: var(--color-line-strong);
  color: var(--color-subtle);
}

.ui-alert--warning {
  background: var(--color-blush-wash);
  border-left-color: var(--color-clay);
}

@keyframes alert-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>
