<script setup lang="ts">
defineProps<{
  title: string;
  index?: string;
  meta?: string;
}>();
</script>

<template>
  <section class="ui-folio">
    <header class="ui-folio__head">
      <h2 class="ui-folio__title">{{ title }}</h2>
      <span v-if="meta || $slots.meta" class="ui-folio__meta">
        <slot name="meta">{{ meta }}</slot>
      </span>
    </header>
    <div class="ui-folio__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.ui-folio {
  min-width: 0;
}

.ui-folio__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-2);
  border-bottom: var(--border-line);
}

.ui-folio__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
}

.ui-folio__meta {
  margin-left: auto;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.ui-folio__body {
  padding-top: var(--space-4);
}
</style>
