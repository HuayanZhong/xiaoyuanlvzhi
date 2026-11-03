<script setup lang="ts">
import { isNavItemActive, type NavItem } from "~/utils/navigation";

const props = defineProps<{
  items: NavItem[];
  currentPath?: string;
}>();

const route = useRoute();

const activePath = computed(() => props.currentPath ?? route.path);

function isActive(item: NavItem) {
  return isNavItemActive(activePath.value, item);
}

const iconNames: Record<string, string> = {
  "/": "home",
  "/plants": "plants",
  "/tasks": "tasks",
  "/points": "points",
  "/me": "me",
};

function iconName(item: NavItem) {
  return iconNames[item.to] ?? "leaf";
}
</script>

<template>
  <nav class="ui-bottom-nav" aria-label="主导航">
    <ul class="ui-bottom-nav__list">
      <li v-for="item in items" :key="item.to" class="ui-bottom-nav__item">
        <NuxtLink
          :to="item.to"
          class="ui-bottom-nav__link"
          :class="{ 'ui-bottom-nav__link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <UiLeafMark
            :name="iconName(item)"
            :size="22"
            class="ui-bottom-nav__icon"
          />
          <span class="ui-bottom-nav__label">{{ item.label }}</span>
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
  background: var(--color-surface);
  border-top: var(--border-line);
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
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  align-items: center;
  justify-content: center;
  min-height: var(--nav-height);
  min-width: var(--touch-target);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  text-decoration: none;
  transition: color var(--motion-color);
}

.ui-bottom-nav__icon {
  flex: none;
}

.ui-bottom-nav__link--active {
  color: var(--color-leaf);
}

@media (min-width: 48rem) {
  .ui-bottom-nav {
    display: none;
  }
}
</style>
