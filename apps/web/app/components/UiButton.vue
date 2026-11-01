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
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.02em;
  line-height: var(--line-height-tight);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color),
    transform var(--motion-press);
}

.ui-button:not(:disabled):active {
  transform: translateY(1px);
}

.ui-button--primary {
  border: 2px solid var(--color-ink);
  color: var(--color-ink);
}

.ui-button--primary:not(:disabled):hover {
  background: var(--color-ink-wash);
}

.ui-button--secondary {
  border: var(--border-interactive);
  color: var(--color-ink);
}

.ui-button--secondary:not(:disabled):hover {
  border-color: var(--color-ink);
  background: var(--color-ink-wash);
}

.ui-button--ghost {
  padding-inline: var(--space-2);
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.ui-button--ghost:not(:disabled):hover {
  background: var(--color-ink-wash);
}

.ui-button--danger {
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.ui-button--danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}

.ui-button:disabled {
  background: var(--color-ink-wash);
  border: var(--border-dashed);
  color: var(--color-text-disabled);
  cursor: not-allowed;
  opacity: 1;
}

.ui-button--block {
  width: 100%;
}

.ui-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 1.5px solid currentcolor;
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
