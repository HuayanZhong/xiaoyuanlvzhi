<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name?: string;
    size?: number;
    filled?: boolean;
  }>(),
  {
    name: "leaf",
    size: 22,
    filled: false,
  },
);

const paths: Record<string, string[]> = {
  leaf: ["M12 2C7 6 5 10 5 13a7 7 0 0 0 14 0c0-3-2-7-7-11Z", "M12 8v9"],
  home: ["M12 3c5 2.5 7 6 7 10a7 7 0 0 1-14 0c0-4 2-7.5 7-10Z", "M12 8v7"],
  plants: [
    "M12 21v-8",
    "M12 13c-4 0-6-2.5-6-6 4 0 6 2.5 6 6Z",
    "M12 11c0-3.5 2-6 6-6 0 3.5-2 6-6 6Z",
  ],
  tasks: [
    "M12 3c5 2.5 7 6 7 10a7 7 0 0 1-14 0c0-4 2-7.5 7-10Z",
    "M8.5 13.5l2.5 2.5 4.5-5",
  ],
  points: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "M12 8c2.5 1.5 3.5 3 3.5 5a3.5 3.5 0 0 1-7 0c0-2 1-3.5 3.5-5Z",
  ],
  me: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M5 21a7 7 0 0 1 14 0"],
};

const iconPaths = computed(() => paths[props.name] ?? paths.leaf);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(pathData, index) in iconPaths" :key="index" :d="pathData" />
  </svg>
</template>
