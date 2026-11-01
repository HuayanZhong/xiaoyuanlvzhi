<script setup lang="ts">
definePageMeta({ layout: "auth" });

const { isAuthenticated } = useAuth();

const target = computed(() => (isAuthenticated.value ? "/" : "/login"));
const label = computed(() => (isAuthenticated.value ? "返回首页" : "前往登录"));
</script>

<template>
  <section class="not-found">
    <p class="not-found__eyebrow">未登记 · UNFILED</p>
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
  align-items: flex-start;
  padding: var(--space-6) 0 var(--space-5);
}

.not-found__eyebrow {
  margin: 0;
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.not-found__code {
  margin: 0;
  padding-bottom: var(--space-3);
  border-bottom: var(--border-ink);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 6rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title);
  line-height: 0.9;
}

.not-found__title {
  margin: var(--space-2) 0 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-sub);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: var(--line-height-tight);
}

.not-found__description {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.not-found__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-height);
  margin-top: var(--space-3);
  padding: 0 var(--space-5);
  border: var(--border-ink);
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.not-found__link:hover {
  background: var(--color-ink-wash);
}
</style>
