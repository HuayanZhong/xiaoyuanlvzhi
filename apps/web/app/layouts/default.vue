<script setup lang="ts">
import { isNavItemActive, STUDENT_NAV } from "~/utils/navigation";

const navItems = STUDENT_NAV;
const route = useRoute();

function isActive(to: string) {
  const item = navItems.find((entry) => entry.to === to);

  return item ? isNavItemActive(route.path, item) : false;
}
</script>

<template>
  <div class="app-shell">
    <a class="app-shell__skip" href="#main">跳到主要内容</a>

    <header class="app-shell__masthead">
      <div class="app-shell__masthead-inner">
        <NuxtLink to="/" class="app-shell__brand">
          <span class="app-shell__seal" aria-hidden="true">植</span>
          <span class="app-shell__brand-copy">
            <span class="app-shell__brand-name">校园绿植档案</span>
            <span class="app-shell__brand-sub">CAMPUS PLANT ARCHIVE</span>
          </span>
        </NuxtLink>

        <nav class="app-shell__nav" aria-label="主导航">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="app-shell__nav-link"
            :class="{ 'app-shell__nav-link--active': isActive(item.to) }"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <p class="app-shell__masthead-meta">STUDENT FILE</p>

        <ThemeToggle class="app-shell__theme" />
      </div>
    </header>

    <main id="main" class="app-shell__content">
      <slot />
    </main>

    <footer class="app-shell__footer">
      <p class="app-shell__footer-text">校园绿植领养与环保激励系统</p>
      <p class="app-shell__footer-text">学生端 · STUDENT ACCESS</p>
    </footer>

    <UiBottomNav :items="navItems" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom));
  background: var(--color-paper);
}

.app-shell__skip {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 30;
  padding: var(--space-2) var(--space-3);
  background: var(--color-ink);
  color: var(--color-on-ink);
  font-size: var(--font-size-sm);
  text-decoration: none;
  transform: translateY(-200%);
}

.app-shell__skip:focus {
  transform: translateY(0);
}

.app-shell__masthead {
  display: block;
  background: var(--color-paper);
  border-bottom: var(--border-ink);
}

.app-shell__masthead::after {
  display: block;
  height: 3px;
  border-bottom: var(--border-ink);
  content: "";
}

.app-shell__masthead-inner {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  width: min(100%, calc(var(--layout-max-width) + var(--layout-gutter) * 2));
  min-height: var(--masthead-height);
  margin: 0 auto;
  padding: 0 var(--layout-gutter);
}

.app-shell__brand {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  color: var(--color-ink);
  text-decoration: none;
}

.app-shell__seal {
  display: grid;
  place-items: center;
  width: 2.125rem;
  height: 2.125rem;
  background: var(--color-seal);
  color: var(--color-on-seal);
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1;
}

.app-shell__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.app-shell__brand-name {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.2;
}

.app-shell__brand-sub {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: var(--tracking-code);
  line-height: 1.2;
}

.app-shell__nav {
  display: flex;
  gap: var(--space-6);
  margin-left: auto;
}

.app-shell__nav-link {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--masthead-height);
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  letter-spacing: var(--tracking-label);
  text-decoration: none;
  white-space: nowrap;
}

.app-shell__nav-link::after {
  position: absolute;
  inset: auto 0 1.25rem;
  height: 2px;
  background: transparent;
  content: "";
}

.app-shell__nav-link:hover,
.app-shell__nav-link--active {
  color: var(--color-ink);
}

.app-shell__nav-link:hover::after,
.app-shell__nav-link--active::after {
  background: var(--color-ink);
}

.app-shell__masthead-meta {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: var(--tracking-code);
}

.app-shell__content {
  flex: 1;
  width: min(100%, calc(var(--layout-max-width) + var(--layout-gutter) * 2));
  margin: 0 auto;
  padding: var(--space-5) var(--layout-gutter) var(--space-7);
}

.app-shell__footer {
  display: none;
  justify-content: space-between;
  width: min(100%, calc(var(--layout-max-width) + var(--layout-gutter) * 2));
  margin: 0 auto;
  padding: var(--space-4) var(--layout-gutter) var(--space-6);
  border-top: var(--border-hairline);
}

.app-shell__footer-text {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}

@media (min-width: 48rem) {
  .app-shell {
    padding-bottom: 0;
  }

  .app-shell__content {
    padding-top: var(--space-7);
  }

  .app-shell__footer {
    display: flex;
  }
}

@media (max-width: 47.99rem) {
  .app-shell__masthead-inner {
    gap: var(--space-3);
    min-height: var(--nav-height);
    padding-inline: var(--layout-gutter);
  }

  .app-shell__nav,
  .app-shell__masthead-meta,
  .app-shell__brand-sub {
    display: none;
  }

  .app-shell__seal {
    width: 1.875rem;
    height: 1.875rem;
    font-size: 1rem;
  }

  .app-shell__brand-name {
    font-size: 1rem;
  }

  .app-shell__theme {
    margin-left: auto;
  }
}

@media (max-width: 63.99rem) {
  .app-shell__masthead-meta {
    display: none;
  }

  .app-shell__nav {
    gap: var(--space-4);
  }
}

@media (max-width: 30rem) {
  .app-shell__masthead-inner,
  .app-shell__content {
    padding-inline: var(--space-gutter-320);
  }
}
</style>
