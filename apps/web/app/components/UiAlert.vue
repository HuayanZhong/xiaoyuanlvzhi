<script setup lang="ts">
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
    aria-live="polite"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-alert {
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: 1px solid transparent;
  border-left-width: 2px;
  border-radius: var(--radius-none);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.ui-alert--error {
  border-left-color: var(--color-danger);
  color: var(--color-danger);
}

.ui-alert--success {
  border-left-color: var(--color-ink);
  color: var(--color-ink);
}

.ui-alert--info {
  border-left-color: var(--color-rule-strong);
  color: var(--color-graphite);
}

.ui-alert--warning {
  border: 1px dashed var(--color-seal);
  border-left-width: 2px;
  color: var(--color-seal);
}
</style>
