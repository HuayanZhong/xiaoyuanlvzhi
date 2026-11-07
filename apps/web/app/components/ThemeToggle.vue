<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "reka-ui";
import { Moon, Sun } from "lucide-vue-next";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <TooltipProvider :delay-duration="250">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="theme-toggle"
          :aria-label="isDark ? '切换至日间模式' : '切换至暗夜模式'"
          :aria-pressed="isDark"
          @click="toggleTheme"
        >
          <span class="theme-toggle__thumb" aria-hidden="true" />
          <span
            class="theme-toggle__icon theme-toggle__icon--sun"
            aria-hidden="true"
          >
            <Sun :size="17" :stroke-width="1.6" />
          </span>
          <span
            class="theme-toggle__icon theme-toggle__icon--moon"
            aria-hidden="true"
          >
            <Moon :size="16" :stroke-width="1.6" />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent class="theme-tooltip" :side-offset="8">
          {{ isDark ? "切换至日间" : "切换至暗夜" }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  width: 4.75rem;
  height: var(--touch-target);
  padding: var(--space-1);
  overflow: hidden;
  background: color-mix(
    in srgb,
    var(--color-surface) 76%,
    var(--color-surface-muted)
  );
  border: 1px solid
    color-mix(in srgb, var(--color-line-strong) 48%, transparent);
  border-radius: var(--radius-chip);
  color: var(--color-subtle);
  isolation: isolate;
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    box-shadow var(--motion-hover),
    transform var(--motion-press);
}

.theme-toggle:hover {
  border-color: var(--color-leaf);
  box-shadow:
    0 8px 20px -18px var(--color-shadow-strong),
    inset 0 1px 0 color-mix(in srgb, white 62%, transparent);
}

.theme-toggle:active {
  transform: scale(0.96, 0.92);
}

.theme-toggle:focus-visible {
  outline: var(--border-focus);
  outline-offset: 3px;
}

.theme-toggle__thumb {
  position: absolute;
  z-index: -1;
  top: var(--space-1);
  left: var(--space-1);
  width: calc(50% - var(--space-1));
  height: calc(100% - var(--space-2));
  background: var(--color-deep-pine);
  border-radius: var(--radius-chip);
  box-shadow:
    0 3px 10px -5px var(--color-shadow-strong),
    inset 0 1px 0 color-mix(in srgb, white 12%, transparent);
  transition:
    transform var(--motion-enter),
    background-color var(--motion-color),
    box-shadow var(--motion-color);
}

.theme-toggle[aria-pressed="true"] .theme-toggle__thumb {
  background: var(--color-citron);
  box-shadow:
    0 4px 12px -5px color-mix(in srgb, var(--color-citron) 72%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 48%, transparent);
  transform: translateX(100%);
}

.theme-toggle__icon {
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--color-subtle) 72%, transparent);
  transform: scale(0.88);
  transition:
    color var(--motion-color),
    transform var(--motion-enter);
}

.theme-toggle:not([aria-pressed="true"]) .theme-toggle__icon--sun,
.theme-toggle[aria-pressed="true"] .theme-toggle__icon--moon {
  transform: scale(1);
}

.theme-toggle:not([aria-pressed="true"]) .theme-toggle__icon--sun {
  color: var(--color-on-deep-pine);
}

.theme-toggle[aria-pressed="true"] .theme-toggle__icon--moon {
  color: var(--color-on-sticker);
}

.theme-toggle:not(:disabled):hover
  .theme-toggle__icon:not(.theme-toggle__icon--sun) {
  color: var(--color-ink);
}

.theme-toggle[aria-pressed="true"]:not(:disabled):hover
  .theme-toggle__icon--sun {
  color: var(--color-ink);
}

.theme-toggle:active .theme-toggle__thumb {
  transform: scale(0.94, 0.84);
}

.theme-toggle[aria-pressed="true"]:active .theme-toggle__thumb {
  transform: translateX(100%) scale(0.94, 0.84);
}

:global(.theme-tooltip) {
  z-index: 10001;
  padding: 0.4rem 0.6rem;
  background: var(--color-ink);
  border-radius: var(--radius-control);
  color: var(--color-paper);
  font-size: var(--font-size-label);
  line-height: 1.4;
  animation: tooltip-in 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle,
  .theme-toggle__thumb,
  .theme-toggle__icon {
    transition-duration: 0.01ms !important;
  }

  .theme-toggle,
  .theme-toggle:active {
    transform: none;
  }

  .theme-toggle__icon {
    transform: none;
  }

  .theme-toggle:active .theme-toggle__thumb {
    transform: none;
  }

  .theme-toggle[aria-pressed="true"]:active .theme-toggle__thumb {
    transform: translateX(100%);
  }
}
</style>
