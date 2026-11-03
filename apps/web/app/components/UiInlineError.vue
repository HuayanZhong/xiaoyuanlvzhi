<script setup lang="ts">
defineProps<{
  id?: string;
  message: string;
}>();
</script>

<template>
  <p :id="id" class="ui-inline-error" role="alert">{{ message }}</p>
</template>

<style scoped>
.ui-inline-error {
  margin: 0;
  color: var(--color-blush);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}
</style>
