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
    <span class="ui-empty__punch" aria-hidden="true" />
    <p class="ui-empty__label">{{ label }}</p>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description" class="ui-empty__description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.ui-empty {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border: var(--border-dashed);
  border-radius: var(--radius-none);
  text-align: left;
}

.ui-empty__punch {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 0.4375rem;
  height: 0.4375rem;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-none);
}

.ui-empty__label {
  margin: 0;
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.ui-empty__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-card);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: var(--line-height-tight);
}

.ui-empty__description {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}
</style>
