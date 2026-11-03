<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "button" | "submit";
    variant?: "primary" | "secondary" | "ghost" | "danger";
    loading?: boolean;
    block?: boolean;
    disabled?: boolean;
  }>(),
  {
    type: "button",
    variant: "primary",
    loading: false,
    block: false,
    disabled: false,
  },
);

const button = ref<HTMLButtonElement | null>(null);

defineExpose({
  focus: () => button.value?.focus(),
});
</script>

<template>
  <button
    ref="button"
    :type="type"
    :class="[
      'ui-button',
      `ui-button--${variant}`,
      { 'ui-button--block': block },
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-height);
  padding: 0 var(--space-5);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-chip);
  color: var(--color-ink);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color),
    transform var(--motion-press);
}

.ui-button:not(:disabled):active {
  transform: scale(0.98);
}

.ui-button--primary {
  background: var(--color-leaf);
  border-color: var(--color-leaf);
  color: var(--color-on-leaf);
}

.ui-button--primary:not(:disabled):hover {
  background: color-mix(in srgb, var(--color-leaf) 85%, var(--color-ink));
  border-color: color-mix(in srgb, var(--color-leaf) 85%, var(--color-ink));
}

.ui-button--secondary {
  background: var(--color-surface);
  border: var(--border-strong);
  color: var(--color-ink);
}

.ui-button--secondary:not(:disabled):hover {
  background: var(--color-ink-wash);
  border-color: var(--color-ink);
}

.ui-button--ghost {
  padding-inline: var(--space-2);
  color: var(--color-leaf);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.ui-button--ghost:not(:disabled):hover {
  background: var(--color-leaf-wash);
}

.ui-button--danger {
  border: 1px solid var(--color-blush);
  color: var(--color-blush);
}

.ui-button--danger:not(:disabled):hover {
  background: var(--color-blush-wash);
}

.ui-button:disabled {
  background: var(--color-ink-wash);
  border: var(--border-dashed);
  color: var(--color-subtle);
  cursor: not-allowed;
  opacity: 1;
}

.ui-button--block {
  width: 100%;
}

.ui-button__spinner {
  width: var(--space-4);
  height: var(--space-4);
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-chip);
  animation: ui-button-spin var(--motion-spin);
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
