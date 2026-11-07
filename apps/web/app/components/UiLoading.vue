<script setup lang="ts">
withDefaults(
  defineProps<{
    text?: string;
  }>(),
  {
    text: "正在加载…",
  },
);
</script>

<template>
  <div class="ui-loading" role="status" aria-live="polite">
    <span class="ui-loading__sr">{{ text }}</span>
    <span class="ui-loading__title" aria-hidden="true" />
    <span class="ui-loading__copy" aria-hidden="true" />
    <span class="ui-loading__block" aria-hidden="true" />
    <div class="ui-loading__rows" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  </div>
</template>

<style scoped>
.ui-loading {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  min-height: 22rem;
  padding: 2rem;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
}

.ui-loading::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 20%,
    color-mix(in srgb, var(--palette-white) 50%, transparent) 48%,
    transparent 76%
  );
  content: "";
  animation: loading-sheen 1.4s ease-in-out infinite;
}

.ui-loading__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.ui-loading__title,
.ui-loading__copy,
.ui-loading__block,
.ui-loading__rows span {
  display: block;
  background: var(--color-surface-muted);
  border-radius: 0.25rem;
}

.ui-loading__title {
  width: min(42%, 20rem);
  height: 3.5rem;
}

.ui-loading__copy {
  width: min(58%, 30rem);
  height: 1rem;
}

.ui-loading__block {
  flex: 1;
  min-height: 10rem;
  margin-top: 0.5rem;
}

.ui-loading__rows {
  display: grid;
  gap: 0.75rem;
}

.ui-loading__rows span {
  height: 2.75rem;
}

@keyframes loading-sheen {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-loading::after {
    display: none;
  }
}
</style>
