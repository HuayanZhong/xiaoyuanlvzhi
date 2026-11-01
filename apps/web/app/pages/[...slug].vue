<script setup lang="ts">
definePageMeta({ layout: "auth" });

const { isAuthenticated } = useAuth();

const target = computed(() => (isAuthenticated.value ? "/" : "/login"));
const label = computed(() => (isAuthenticated.value ? "返回首页" : "前往登录"));
</script>

<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1 class="not-found__title">页面不存在</h1>
    <p class="not-found__description">你访问的页面可能已被移动或删除。</p>
    <NuxtLink :to="target" class="not-found__link">{{ label }}</NuxtLink>
  </section>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-6) 0;
  text-align: center;
}

.not-found__code {
  margin: 0;
  color: var(--color-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.not-found__title {
  margin: 0;
  font-size: var(--font-size-xl);
}

.not-found__description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.not-found__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-on-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}
</style>
