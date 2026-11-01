<script setup lang="ts">
const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="ui-theme-toggle"
    :aria-pressed="isDark"
    :aria-label="isDark ? '切换日间模式' : '切换暗夜模式'"
    @click="toggleTheme"
  >
    <span class="ui-theme-toggle__mark" aria-hidden="true" />
    <span class="ui-theme-toggle__text">{{ isDark ? "日间" : "暗夜" }}</span>
  </button>
</template>

<style scoped>
.ui-theme-toggle {
  display: inline-flex;
  flex: none;
  gap: var(--space-2);
  align-items: center;
  min-height: var(--touch-target);
  padding: 0 var(--space-3);
  background: transparent;
  border: var(--border-interactive);
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: 0.12em;
  line-height: 1;
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color);
}

.ui-theme-toggle:hover {
  background: var(--color-ink-wash);
  border-color: var(--color-ink);
}

.ui-theme-toggle__mark {
  width: 0.6875rem;
  height: 0.6875rem;
  background: linear-gradient(90deg, currentcolor 50%, transparent 50%);
  border: 1px solid currentcolor;
  border-radius: var(--radius-full);
}

.ui-theme-toggle__text {
  white-space: nowrap;
}
</style>
