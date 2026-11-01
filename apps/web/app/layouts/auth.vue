<template>
  <div class="auth-layout">
    <ThemeToggle class="auth-layout__theme" />

    <aside class="auth-layout__brand">
      <div class="auth-layout__brand-top">
        <span class="auth-layout__seal" aria-hidden="true">植</span>
        <span class="auth-layout__brand-mono">CAMPUS PLANT ARCHIVE</span>
      </div>

      <div class="auth-layout__brand-main">
        <p class="auth-layout__kicker">学生档案 · STUDENT FILE</p>
        <p class="auth-layout__title">领养一株，<br />记录一份成长。</p>
        <p class="auth-layout__note">
          用学籍身份建立你的绿植档案，每一次领养、积分与兑换都会归档。
        </p>
      </div>

      <p class="auth-layout__brand-foot">NO. 000—000</p>
      <span class="auth-layout__watermark" aria-hidden="true">植</span>
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  justify-content: space-between;
  overflow: hidden;
  padding: var(--space-6) var(--space-5);
  border-bottom: var(--border-ink);
}

.auth-layout__brand-top {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.auth-layout__seal {
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

.auth-layout__theme {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 20;
}

.auth-layout__brand-mono,
.auth-layout__brand-foot {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: var(--tracking-code);
}

.auth-layout__brand-main {
  position: relative;
  z-index: 1;
  max-width: 26rem;
  padding-top: var(--space-6);
  border-top: var(--border-hairline);
}

.auth-layout__kicker {
  margin: 0 0 var(--space-4);
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.auth-layout__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-sub);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.25;
}

.auth-layout__note {
  max-width: 22rem;
  margin: var(--space-5) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.auth-layout__brand-foot {
  position: relative;
  z-index: 1;
  margin: 0;
  padding-top: var(--space-4);
  border-top: var(--border-hairline);
}

.auth-layout__watermark {
  position: absolute;
  right: -0.5rem;
  bottom: -0.75rem;
  color: transparent;
  font-family: var(--font-serif);
  font-size: 15rem;
  line-height: 0.9;
  pointer-events: none;
  user-select: none;
  -webkit-text-stroke: 1px var(--color-rule);
}

.auth-layout__panel {
  display: grid;
  place-items: center;
  padding: var(--space-6) var(--space-5)
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
    border-right: var(--border-ink);
    border-bottom: 0;
  }

  .auth-layout__title {
    font-size: clamp(2.25rem, 3.6vw, 3.5rem);
  }

  .auth-layout__panel {
    min-height: 100vh;
    padding: var(--space-8) var(--space-7);
  }
}

@media (max-width: 30rem) {
  .auth-layout__brand,
  .auth-layout__panel {
    padding-inline: var(--space-gutter-320);
  }
}

@media (max-width: 47.99rem) {
  .auth-layout__brand {
    gap: var(--space-3);
    padding-block: var(--space-5);
  }

  .auth-layout__brand-main {
    margin-top: 0;
    padding-top: var(--space-4);
  }

  .auth-layout__title {
    font-size: 1.75rem;
  }

  .auth-layout__note,
  .auth-layout__brand-foot,
  .auth-layout__watermark {
    display: none;
  }
}
</style>
