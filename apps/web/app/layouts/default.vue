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
          <svg
            class="app-shell__leaf"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path
              d="M12 2C7 6 5 10 5 13a7 7 0 0 0 14 0c0-3-2-7-7-11Z"
              fill="currentColor"
            />
            <path
              d="M12 8v9"
              stroke="var(--color-paper)"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="app-shell__brand-name">校园绿植</span>
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

        <ThemeToggle class="app-shell__theme" />
      </div>
    </header>

    <main id="main" class="app-shell__content">
      <slot />
    </main>

    <footer class="app-shell__footer">
      <p class="app-shell__footer-text">校园绿植领养与环保激励系统</p>
      <p class="app-shell__footer-text">学生端</p>
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
}

.app-shell__skip {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 30;
  padding: var(--space-2) var(--space-3);
  background: var(--color-leaf);
  color: var(--color-on-leaf);
  border-radius: var(--radius-chip);
  font-size: var(--font-size-small);
  text-decoration: none;
  transform: translateY(-200%);
}

.app-shell__skip:focus {
  transform: translateY(0);
}

.app-shell__masthead {
  background: var(--color-paper);
  border-bottom: var(--border-dashed);
}

.app-shell__masthead-inner {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  min-height: var(--masthead-height-compact);
  margin: 0 auto;
  padding: 0 var(--space-gutter);
}

.app-shell__brand {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-ink);
  text-decoration: none;
}

.app-shell__leaf {
  color: var(--color-leaf);
}

.app-shell__brand-name {
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  letter-spacing: var(--tracking-display);
  line-height: 1.2;
}

.app-shell__nav {
  display: none;
  gap: var(--space-6);
  margin-left: auto;
}

.app-shell__nav-link {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--masthead-height);
  color: var(--color-subtle);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  white-space: nowrap;
  transition: color var(--motion-color);
}

.app-shell__nav-link::after {
  position: absolute;
  inset: auto 0 0.9rem;
  height: 2px;
  background: transparent;
  border-radius: var(--radius-chip);
  content: "";
  transition: background-color var(--motion-color);
}

.app-shell__nav-link:hover {
  color: var(--color-ink);
}

.app-shell__nav-link--active {
  color: var(--color-leaf);
}

.app-shell__nav-link--active::after {
  background: var(--color-leaf);
}

.app-shell__theme {
  margin-left: auto;
}

.app-shell__content {
  flex: 1;
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  margin: 0 auto;
  padding: var(--space-5) var(--space-gutter) var(--space-7);
}

.app-shell__footer {
  display: none;
  justify-content: space-between;
  width: min(100%, calc(var(--layout-max-width) + var(--space-gutter) * 2));
  margin: 0 auto;
  padding: var(--space-4) var(--space-gutter) var(--space-6);
  border-top: var(--border-line);
}

.app-shell__footer-text {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

@media (min-width: 48rem) {
  .app-shell {
    padding-bottom: 0;
  }

  .app-shell__masthead-inner {
    min-height: var(--masthead-height);
  }

  .app-shell__nav {
    display: flex;
  }

  .app-shell__theme {
    margin-left: 0;
  }

  .app-shell__content {
    padding-top: var(--space-7);
  }

  .app-shell__footer {
    display: flex;
  }
}
</style>
