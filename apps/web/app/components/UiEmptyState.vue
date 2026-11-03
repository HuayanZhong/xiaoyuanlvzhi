<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    label?: string;
  }>(),
  {
    label: "未登记",
  },
);
</script>

<template>
  <div class="ui-empty">
    <p class="ui-empty__label">{{ label }}</p>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description" class="ui-empty__description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
  text-align: left;
}

.ui-empty__label {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.ui-empty__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
}

.ui-empty__description {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}
</style>
