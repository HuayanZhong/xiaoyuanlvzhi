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
      <p v-if="eyebrow" class="ui-page-header__eyebrow">
        <span class="ui-page-header__mark" aria-hidden="true" />
        {{ eyebrow }}
      </p>
      <h1 class="ui-page-header__title">{{ title }}</h1>
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
  gap: var(--space-6);
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 0 var(--space-5);
  border-bottom: var(--border-anchor);
}

.ui-page-header__body {
  min-width: 0;
}

.ui-page-header__eyebrow {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin: 0 0 var(--space-3);
  color: var(--color-graphite);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
  text-transform: uppercase;
}

.ui-page-header__mark {
  width: 0.375rem;
  height: 0.375rem;
  background: var(--color-seal);
}

.ui-page-header__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: var(--line-height-display);
  overflow-wrap: anywhere;
}

.ui-page-header__subtitle {
  max-width: var(--layout-reading-width);
  margin: var(--space-3) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.ui-page-header__aside {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: var(--space-2);
  align-items: flex-end;
  padding-bottom: var(--space-1);
}

.ui-page-header__meta {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
  text-align: right;
}

@media (max-width: 47.99rem) {
  .ui-page-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .ui-page-header__aside {
    flex-direction: row;
    gap: var(--space-3);
    align-items: center;
    padding-bottom: 0;
  }

  .ui-page-header__meta {
    text-align: left;
  }
}
</style>
