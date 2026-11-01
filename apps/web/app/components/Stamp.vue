<script setup lang="ts">
export type StampTone = "alive" | "pending" | "danger" | "neutral";

withDefaults(
  defineProps<{
    tone?: StampTone;
    misregistered?: boolean;
  }>(),
  {
    tone: "neutral",
    misregistered: false,
  },
);
</script>

<template>
  <span
    class="ui-stamp"
    :class="[`ui-stamp--${tone}`, { 'ui-stamp--misregistered': misregistered }]"
  >
    <slot />
  </span>
</template>

<style scoped>
.ui-stamp {
  display: inline-flex;
  align-items: center;
  min-height: 1.375rem;
  padding: 0.0625rem var(--space-2);
  border: 1px solid currentcolor;
  border-radius: var(--radius-none);
  outline: 1px solid currentcolor;
  outline-offset: 1px;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.14em;
  line-height: 1.2;
  white-space: nowrap;
  transform: rotate(-1.2deg);
}

.ui-stamp--alive {
  color: var(--color-status-alive);
}

.ui-stamp--pending {
  color: var(--color-seal);
}

.ui-stamp--danger {
  border-style: dashed;
  color: var(--color-danger);
}

.ui-stamp--neutral {
  color: var(--color-graphite);
  outline-color: transparent;
  transform: none;
}

.ui-stamp--misregistered {
  text-shadow: 1px 0 0 color-mix(in srgb, currentcolor 22%, transparent);
}
</style>
