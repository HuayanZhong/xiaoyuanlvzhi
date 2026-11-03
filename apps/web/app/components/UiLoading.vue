<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
  }>(),
  {
    text: "正在加载…",
  },
);
</script>

<template>
  <div class="ui-loading" role="status" aria-live="polite">
    <span class="ui-loading__spinner" aria-hidden="true" />
    <span>{{ text }}</span>
  </div>
</template>

<style scoped>
.ui-loading {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-4);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.ui-loading__spinner {
  width: var(--space-4);
  height: var(--space-4);
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-chip);
  animation: ui-loading-spin var(--motion-spin);
}

@keyframes ui-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
