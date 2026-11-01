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
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.ui-loading__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border-strong);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: ui-loading-spin 700ms linear infinite;
}

@keyframes ui-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
