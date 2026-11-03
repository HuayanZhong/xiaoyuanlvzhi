<script setup lang="ts">
defineProps<{
  title?: string;
  items: Array<{
    key: string;
    label: string;
    done?: boolean;
    today?: boolean;
  }>;
  caption?: string;
}>();
</script>

<template>
  <section class="ui-streak">
    <header class="ui-streak__head">
      <span class="ui-streak__title">{{ title ?? "本周打卡" }}</span>
      <span v-if="caption" class="ui-streak__caption">{{ caption }}</span>
    </header>
    <ul class="ui-streak__days">
      <li
        v-for="item in items"
        :key="item.key"
        class="ui-streak__cell"
        :class="{
          'ui-streak__cell--done': item.done,
          'ui-streak__cell--today': item.today,
        }"
      >
        <UiLeafMark v-if="item.done" name="leaf" :size="16" filled />
        <span v-else>{{ item.label }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ui-streak {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
}

.ui-streak__head {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.ui-streak__title {
  font-family: var(--font-kai);
  font-size: var(--font-size-body);
}

.ui-streak__caption {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.ui-streak__days {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-streak__cell {
  display: grid;
  flex: 1;
  place-items: center;
  max-width: 2.75rem;
  aspect-ratio: 1;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  border: var(--border-line);
  border-radius: var(--radius-sticker);
}

.ui-streak__cell--done {
  color: var(--color-leaf);
  background: var(--color-leaf-wash);
  border-color: var(--color-tape-green);
  animation: ui-streak-stamp var(--motion-sticker);
}

.ui-streak__cell--today {
  border: var(--border-focus);
  color: var(--color-leaf);
  font-weight: var(--font-weight-semibold);
}

@keyframes ui-streak-stamp {
  0% {
    scale: 1.2;
    rotate: -6deg;
    opacity: 0.4;
  }

  100% {
    scale: 1;
    rotate: 0deg;
    opacity: 1;
  }
}
</style>
