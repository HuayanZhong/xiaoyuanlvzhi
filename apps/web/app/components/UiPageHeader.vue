<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  meta?: string;
}>();
</script>

<template>
  <header class="ui-page-header">
    <div class="ui-page-header__body">
      <p v-if="eyebrow" class="ui-page-header__eyebrow">{{ eyebrow }}</p>
      <h1 class="ui-page-header__title">{{ title }}</h1>
      <span class="squig" aria-hidden="true" />
      <p v-if="subtitle" class="ui-page-header__subtitle">{{ subtitle }}</p>
    </div>

    <div
      v-if="meta || $slots.meta || $slots.default"
      class="ui-page-header__aside"
    >
      <p v-if="meta" class="ui-page-header__meta">{{ meta }}</p>
      <slot name="meta" />
      <slot />
    </div>
  </header>
</template>

<style scoped>
.ui-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  padding: 0 0 var(--space-5);
}

.ui-page-header__body {
  min-width: 0;
}

.ui-page-header__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.ui-page-header__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-display);
  overflow-wrap: anywhere;
}

.ui-page-header__subtitle {
  max-width: var(--layout-reading-width);
  margin: var(--space-2) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.ui-page-header__aside {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.ui-page-header__meta {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

@media (min-width: 48rem) {
  .ui-page-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-6);
  }

  .ui-page-header__aside {
    flex-direction: column;
    flex: none;
    align-items: flex-end;
    padding-bottom: var(--space-1);
  }

  .ui-page-header__meta {
    text-align: right;
  }
}
</style>
