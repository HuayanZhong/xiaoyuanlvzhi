<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="ui-empty">
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
  align-items: center;
  padding: var(--space-6) var(--space-4);
  text-align: center;
}

.ui-empty__title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.ui-empty__description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
