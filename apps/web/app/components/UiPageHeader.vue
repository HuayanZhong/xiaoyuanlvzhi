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
  gap: 1.5rem;
  align-items: flex-start;
  padding: 4.5rem 0 3.75rem;
  border-bottom: var(--border-line);
}

.ui-page-header__body {
  position: relative;
  min-width: 0;
}

.ui-page-header__eyebrow {
  margin: 0 0 0.875rem;
  color: var(--color-leaf);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.ui-page-header__title {
  max-width: 13ch;
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-display);
  line-height: 1.04;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.ui-page-header .squig {
  display: none;
}

.ui-page-header__subtitle {
  max-width: 38rem;
  margin: 1rem 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-body);
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
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-journal);
}

@media (min-width: 48rem) {
  .ui-page-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(10rem, auto);
    align-items: flex-end;
    gap: 3rem;
  }

  .ui-page-header__body {
    padding-left: 1.75rem;
  }

  .ui-page-header__body::before {
    position: absolute;
    top: 0.3rem;
    bottom: 0.35rem;
    left: 0;
    width: 1px;
    background: color-mix(in srgb, var(--color-line-strong) 56%, transparent);
    content: "";
  }

  .ui-page-header__aside {
    flex-direction: column;
    flex: none;
    align-items: flex-end;
    padding-bottom: 0.3rem;
  }

  .ui-page-header__meta {
    text-align: right;
  }
}
</style>
