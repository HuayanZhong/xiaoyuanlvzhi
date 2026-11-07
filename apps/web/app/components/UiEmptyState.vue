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
  overflow: hidden;
  padding: 2rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-sage) 34%, var(--color-surface)),
    var(--color-surface) 64%
  );
  border: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent);
  border-radius: var(--radius-card);
  text-align: left;
}

.ui-empty__label {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-label);
}

.ui-empty__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-title);
  font-weight: 600;
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
