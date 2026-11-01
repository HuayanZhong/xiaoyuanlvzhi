<script setup lang="ts">
import { formatDateTime } from "~/utils/datetime";

type TimelineItem = {
  title: string;
  time?: string | null;
  note?: string | null;
};

const props = withDefaults(
  defineProps<{
    items: TimelineItem[];
    order?: "newest-first" | "oldest-first";
    emptyText?: string;
  }>(),
  {
    order: "newest-first",
    emptyText: "暂无状态记录",
  },
);

const ordered = computed(() =>
  props.order === "newest-first"
    ? // oxlint-disable-next-line unicorn/no-array-reverse -- 先复制再倒序，不修改传入数组
      [...props.items].reverse()
    : props.items,
);
</script>

<template>
  <ol v-if="ordered.length" class="ui-timeline">
    <li v-for="(item, index) in ordered" :key="index" class="ui-timeline__item">
      <span class="ui-timeline__node" aria-hidden="true" />
      <p class="ui-timeline__time">{{ formatDateTime(item.time) }}</p>
      <p class="ui-timeline__title">{{ item.title }}</p>
      <p v-if="item.note" class="ui-timeline__note">{{ item.note }}</p>
    </li>
  </ol>

  <p v-else class="ui-timeline__empty">{{ emptyText }}</p>
</template>

<style scoped>
.ui-timeline {
  margin: 0;
  padding: 0 0 0 var(--space-4);
  border-left: var(--border-hairline);
  list-style: none;
}

.ui-timeline__item {
  position: relative;
  padding-bottom: var(--space-4);
}

.ui-timeline__item:last-child {
  padding-bottom: 0;
}

.ui-timeline__node {
  position: absolute;
  top: 0.45rem;
  left: calc(-1 * var(--space-4) - 3px);
  width: 6px;
  height: 6px;
  background: var(--color-ink);
}

.ui-timeline__time {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.ui-timeline__title {
  margin: var(--space-1) 0 0;
  color: var(--color-ink);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
}

.ui-timeline__note {
  margin: var(--space-1) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.ui-timeline__empty {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-sm);
}
</style>
