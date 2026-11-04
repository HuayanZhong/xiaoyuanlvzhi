<script setup lang="ts">
// 点击火花保持克制：叶绿/贴纸黄短线，短暂、无发光，减少动态时由组件自行关闭。
const clickSparkOptions = {
  sparkCount: 8,
  sparkSize: 6,
  sparkWidth: 1.5,
  sparkRadius: 24,
  duration: 120,
  randomness: 0.35,
} as const;
</script>

<template>
  <ClickSpark global v-bind="clickSparkOptions">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ClickSpark>
</template>
