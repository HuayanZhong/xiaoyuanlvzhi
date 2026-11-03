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
    :aria-live="tone === 'error' ? undefined : 'polite'"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-alert {
  padding: var(--space-3) var(--space-4);
  border: 1px solid transparent;
  border-left-width: 2px;
  border-radius: var(--radius-control);
  color: var(--color-ink);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
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
  border: 1px dashed var(--color-blush);
}
</style>
