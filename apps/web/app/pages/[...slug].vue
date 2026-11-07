<script setup lang="ts">
const { isAuthenticated } = useAuth();

const target = computed(() => (isAuthenticated.value ? "/" : "/login"));
const label = computed(() => (isAuthenticated.value ? "返回首页" : "前往登录"));
</script>

<template>
  <section class="not-found">
    <div class="not-found__card">
      <p class="not-found__code">404</p>
      <h1 class="not-found__title">页面不存在</h1>
      <p class="not-found__description">你访问的页面可能已被移动或删除。</p>
      <NuxtLink :to="target" class="not-found__action">{{ label }}</NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  padding: var(--space-8) 0;
}

.not-found__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  width: min(100%, 28rem);
  padding: var(--space-6);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
}

.not-found__code {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.not-found__title {
  margin: 0;
  font-family: var(--font-kai);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-display);
}

.not-found__description {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.not-found__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--control-height);
  margin-top: var(--space-3);
  padding: 0 var(--space-5);
  background: var(--color-leaf);
  color: var(--color-on-leaf);
  border-radius: var(--radius-chip);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.not-found__action:hover {
  color: var(--color-on-leaf);
  opacity: 0.92;
}
</style>
