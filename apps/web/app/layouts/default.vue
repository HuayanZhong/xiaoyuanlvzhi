<script setup lang="ts">
const navItems = [
  { label: "首页", to: "/" },
  { label: "我的", to: "/me" },
];
</script>

<template>
  <div class="app-shell">
    <main class="app-shell__content">
      <slot />
    </main>
    <UiBottomNav :items="navItems" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-top: var(--safe-area-top);
  padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom));
}

.app-shell__content {
  width: min(100%, var(--layout-max-width));
  margin: 0 auto;
  padding: 0 var(--space-4);
}
</style>
