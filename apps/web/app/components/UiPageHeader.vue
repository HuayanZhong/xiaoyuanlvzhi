<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="ui-page-header">
    <div>
      <h1 class="ui-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="ui-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <slot />
  </header>
</template>

<style scoped>
.ui-page-header {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
}

.ui-page-header__title {
  margin: 0;
  font-size: var(--font-size-xl);
  line-height: var(--line-height-tight);
}

.ui-page-header__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
