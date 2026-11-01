<script setup lang="ts">
defineProps<{
  index: string;
  title: string;
  meta?: string;
}>();
</script>

<template>
  <section class="ui-folio">
    <header class="ui-folio__head">
      <span class="ui-folio__index">{{ index }}</span>
      <h2 class="ui-folio__title">{{ title }}</h2>
      <span v-if="meta" class="ui-folio__meta">{{ meta }}</span>
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
  padding-bottom: var(--space-3);
  border-bottom: var(--border-ink);
}

.ui-folio__index {
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
  line-height: 1.2;
}

.ui-folio__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-card);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.2;
}

.ui-folio__meta {
  margin-left: auto;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: var(--tracking-code);
}

.ui-folio__body {
  padding-top: var(--space-4);
}
</style>
