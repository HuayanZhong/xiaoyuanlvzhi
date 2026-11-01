<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: "error" | "success" | "info";
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
    aria-live="polite"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-alert {
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.ui-alert--error {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.ui-alert--success {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-strong);
}

.ui-alert--info {
  background: var(--color-surface-muted);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}
</style>
