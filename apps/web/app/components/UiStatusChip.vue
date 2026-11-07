<script setup lang="ts">
export type StatusTone = "alive" | "pending" | "danger" | "neutral";

withDefaults(defineProps<{ tone?: StatusTone }>(), {
  tone: "neutral",
});
</script>

<template>
  <span class="ui-status-chip" :class="`ui-status-chip--${tone}`">
    <slot />
  </span>
</template>

<style scoped>
.ui-status-chip {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: var(--color-surface-muted);
  border: var(--border-line);
  border-radius: var(--radius-sticker);
  color: var(--color-ink);
  font-size: var(--font-size-label);
  font-weight: 600;
  line-height: var(--line-height-small);
  white-space: nowrap;
}

.ui-status-chip::before {
  width: 0.375rem;
  height: 0.375rem;
  background: var(--color-line-strong);
  border-radius: 50%;
  content: "";
}

.ui-status-chip--alive {
  background: var(--color-leaf-wash);
  border-color: transparent;
}

.ui-status-chip--alive::before {
  background: var(--color-leaf);
}

.ui-status-chip--pending::before {
  background: var(--color-citron);
}

.ui-status-chip--danger {
  background: var(--color-blush-wash);
  border-color: transparent;
  color: var(--color-blush);
}

.ui-status-chip--danger::before {
  background: var(--color-blush);
}

.ui-status-chip--neutral {
  color: var(--color-subtle);
}
</style>
