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
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.ui-loading__spinner {
  width: 1rem;
  height: 1rem;
  border: 1.5px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: ui-loading-spin 700ms linear infinite;
}

@keyframes ui-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
