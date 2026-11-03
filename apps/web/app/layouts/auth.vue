<template>
  <div class="auth-layout">
    <ThemeToggle class="auth-layout__theme" />

    <aside class="auth-layout__brand">
      <div class="auth-layout__brand-top">
        <svg
          class="auth-layout__leaf"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          aria-hidden="true"
        >
          <path
            d="M12 2C7 6 5 10 5 13a7 7 0 0 0 14 0c0-3-2-7-7-11Z"
            fill="currentColor"
          />
        </svg>
        <span class="auth-layout__brand-name">校园绿植</span>
      </div>

      <div class="auth-layout__brand-main">
        <h1 class="auth-layout__title">领养一株，<br />记录一份成长。</h1>
        <span class="squig" aria-hidden="true"></span>
        <p class="auth-layout__note">
          选一株喜欢的绿植，用日常的照顾换来积分，也换来一个自己的绿色角落。
        </p>
      </div>

      <p class="auth-layout__brand-foot">校园绿植领养与环保激励系统</p>
    </aside>

    <main class="auth-layout__panel">
      <div class="auth-layout__panel-inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  min-height: 100vh;
  background: var(--color-paper);
}

.auth-layout__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  justify-content: space-between;
  padding: var(--space-5) var(--space-gutter);
  border-bottom: var(--border-dashed);
}

.auth-layout__brand-top {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.auth-layout__leaf {
  color: var(--color-leaf);
}

.auth-layout__brand-name {
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  letter-spacing: var(--tracking-display);
}

.auth-layout__theme {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 20;
}

.auth-layout__brand-main {
  max-width: 26rem;
  padding-top: var(--space-4);
}

.auth-layout__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-display);
}

.auth-layout__note {
  max-width: 22rem;
  margin: var(--space-5) 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.auth-layout__brand-foot {
  margin: 0;
  padding-top: var(--space-4);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.auth-layout__panel {
  display: grid;
  place-items: center;
  padding: var(--space-6) var(--space-gutter)
    calc(var(--space-6) + var(--safe-area-bottom));
}

.auth-layout__panel-inner {
  width: min(100%, 27rem);
}

@media (min-width: 48rem) {
  .auth-layout {
    grid-template-columns: minmax(20rem, 5fr) minmax(0, 7fr);
  }

  .auth-layout__brand {
    position: sticky;
    top: 0;
    height: 100vh;
    padding: var(--space-7);
    border-right: var(--border-dashed);
    border-bottom: 0;
  }

  .auth-layout__panel {
    min-height: 100vh;
    padding: var(--space-8) var(--space-7);
  }
}

@media (max-width: 47.99rem) {
  .auth-layout__brand {
    gap: var(--space-2);
    padding-block: var(--space-4);
  }

  .auth-layout__brand-main {
    padding-top: 0;
  }

  .auth-layout__note,
  .auth-layout__brand-foot {
    display: none;
  }
}
</style>
