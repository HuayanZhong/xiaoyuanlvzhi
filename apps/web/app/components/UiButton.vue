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
    data-cursor-hover
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
    <span class="ui-button__content"><slot /></span>
  </button>
</template>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-height);
  overflow: hidden;
  padding: 0 1.4rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-control);
  color: var(--color-ink);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0;
  line-height: var(--line-height-title);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color),
    transform var(--motion-press);
}

.ui-button::before {
  position: absolute;
  inset: 0;
  background: var(--color-citron);
  content: "";
  transform: translateX(-102%);
  transition: transform var(--motion-hover);
}

.ui-button__content {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.ui-button:not(:disabled):active {
  transform: scale(0.975);
}

.ui-button--primary {
  background: var(--color-leaf);
  border-color: var(--color-leaf);
  color: var(--color-on-leaf);
  box-shadow: none;
}

.ui-button--primary:not(:disabled):hover {
  border-color: var(--color-citron);
  color: var(--palette-ink);
}

.ui-button--primary:not(:disabled):hover::before {
  transform: translateX(0);
}

.ui-button--secondary {
  background: transparent;
  border: var(--border-strong);
  color: var(--color-ink);
}

.ui-button--secondary:not(:disabled):hover {
  background: var(--color-surface);
  border-color: var(--color-leaf);
  color: var(--color-leaf);
}

.ui-button--ghost {
  padding-inline: var(--space-3);
  color: var(--color-leaf);
  text-decoration: none;
}

.ui-button--ghost:not(:disabled):hover {
  background: var(--color-leaf-wash);
}

.ui-button--danger {
  border: 1px solid var(--color-blush);
  color: var(--color-blush);
  background: var(--color-surface);
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
  position: relative;
  z-index: 1;
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
