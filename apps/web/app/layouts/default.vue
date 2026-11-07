<script setup lang="ts">
import { isNavItemActive, STUDENT_NAV } from "~/utils/navigation";

const navItems = STUDENT_NAV;
const route = useRoute();

function isActive(item: (typeof navItems)[number]) {
  return isNavItemActive(route.path, item);
}
</script>

<template>
  <div class="app-shell">
    <a class="app-shell__skip" href="#main">跳到主要内容</a>

    <header class="app-header">
      <div class="app-header__inner">
        <NuxtLink to="/" class="brand" aria-label="一株首页">
          <span class="brand__mark" aria-hidden="true">
            <UiLeafMark name="leaf" :size="20" />
          </span>
          <span class="brand__name">一株</span>
          <span class="brand__descriptor">植物成长档案</span>
        </NuxtLink>

        <nav class="app-nav" aria-label="主导航">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="app-nav__link"
            :class="{ 'app-nav__link--active': isActive(item) }"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="app-header__theme-toggle">
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main id="main" class="app-content" tabindex="-1">
      <slot />
    </main>

    <footer class="app-footer">
      <div class="app-footer__inner">
        <p class="app-footer__brand">一株 · 校园植物领养计划</p>
        <p>让一株植物，成为你的日常。</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: transparent;
}

.app-shell__skip {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10000;
  padding: 0.75rem 1rem;
  background: var(--color-leaf);
  border-radius: var(--radius-control);
  color: var(--color-on-leaf);
  font-size: var(--font-size-small);
  text-decoration: none;
  transform: translateY(-180%);
}

.app-shell__skip:focus {
  transform: translateY(0);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--color-paper) 82%, transparent);
  border-bottom: 1px solid transparent;
  backdrop-filter: blur(18px) saturate(1.15);
  transition:
    border-color var(--motion-color),
    background-color var(--motion-color);
}

.app-header:has(.app-nav__link--active) {
  border-bottom-color: color-mix(in srgb, var(--color-line) 70%, transparent);
}

.app-header__inner {
  display: grid;
  grid-template-columns: minmax(13rem, 1fr) auto minmax(13rem, 1fr);
  gap: var(--space-6);
  align-items: center;
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  min-height: var(--masthead-height);
  margin-inline: auto;
  padding-inline: var(--space-gutter);
}

.brand {
  display: inline-flex;
  gap: 0.625rem;
  align-items: baseline;
  justify-self: start;
  color: var(--color-ink);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-ink);
}

.brand__mark {
  align-self: center;
  color: var(--color-leaf);
  transform: translateY(0.1rem);
}

.brand__name {
  font-family: var(--font-display);
  font-size: var(--font-size-logo);
  font-weight: var(--font-weight-display);
  letter-spacing: 0;
  line-height: 1;
}

.brand__descriptor {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.app-nav {
  display: flex;
  gap: 1.75rem;
  align-items: center;
}

.app-nav__link {
  position: relative;
  padding: 1.6rem 0 1.5rem;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: 500;
  text-decoration: none;
  transition: color var(--motion-color);
}

.app-nav__link::after {
  position: absolute;
  right: 0;
  bottom: 0.75rem;
  left: 0;
  height: 2px;
  background: var(--color-leaf);
  content: "";
  transform: scaleX(0);
  transform-origin: center;
  transition: transform var(--motion-hover);
}

.app-nav__link:hover,
.app-nav__link--active {
  color: var(--color-ink);
}

.app-nav__link--active {
  font-weight: 600;
}

.app-nav__link--active::after {
  transform: scaleX(1);
}

.app-header__theme-toggle {
  display: flex;
  justify-self: end;
}

.app-content {
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  margin-inline: auto;
  padding: 2.5rem var(--space-gutter) var(--space-10);
}

.app-footer {
  border-top: var(--border-line);
}

.app-footer__inner {
  display: flex;
  justify-content: space-between;
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  margin-inline: auto;
  padding: 2.5rem var(--space-gutter) 3rem;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.app-footer p {
  margin: 0;
}

.app-footer__brand {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-small);
}
</style>
