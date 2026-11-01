<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "button" | "submit";
    variant?: "primary" | "secondary" | "ghost";
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
  min-height: var(--touch-target);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ui-button--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.ui-button--primary:not(:disabled):hover {
  background: var(--color-primary-strong);
}

.ui-button--secondary {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-primary-strong);
}

.ui-button--secondary:not(:disabled):hover {
  background: var(--color-primary-soft);
}

.ui-button--ghost {
  background: transparent;
  color: var(--color-primary-strong);
}

.ui-button--ghost:not(:disabled):hover {
  background: var(--color-primary-soft);
}

.ui-button--block {
  width: 100%;
}

.ui-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-full);
  animation: ui-button-spin 700ms linear infinite;
}

@keyframes ui-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
