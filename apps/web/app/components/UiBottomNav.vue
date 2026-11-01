<script setup lang="ts">
const props = defineProps<{
  items: Array<{ label: string; to: string }>;
  currentPath?: string;
}>();

const route = useRoute();

const activePath = computed(() => props.currentPath ?? route.path);

function isActive(to: string) {
  if (to === "/") {
    return activePath.value === "/";
  }

  return activePath.value === to || activePath.value.startsWith(`${to}/`);
}
</script>

<template>
  <nav class="ui-bottom-nav" aria-label="主导航">
    <ul class="ui-bottom-nav__list">
      <li v-for="item in items" :key="item.to" class="ui-bottom-nav__item">
        <NuxtLink
          :to="item.to"
          class="ui-bottom-nav__link"
          :class="{ 'ui-bottom-nav__link--active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.ui-bottom-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  padding-bottom: var(--safe-area-bottom);
  background: var(--color-sheet);
  border-top: var(--border-divider);
}

.ui-bottom-nav__list {
  display: flex;
  width: 100%;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

.ui-bottom-nav__item {
  flex: 1;
  min-width: 0;
}

.ui-bottom-nav__link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--nav-height);
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  letter-spacing: var(--tracking-label);
  text-decoration: none;
}

.ui-bottom-nav__link--active {
  color: var(--color-ink);
}

.ui-bottom-nav__link--active::before {
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: var(--color-ink);
  content: "";
}

@media (min-width: 48rem) {
  .ui-bottom-nav {
    display: none;
  }
}
</style>
