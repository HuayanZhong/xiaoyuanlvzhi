<template>
  <div class="auth-layout">
    <header class="auth-layout__brand">
      <p class="auth-layout__mark">校园绿植</p>
      <p class="auth-layout__tagline">领养一株绿植，记录一份成长</p>
    </header>
    <main class="auth-layout__panel">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: min(100%, var(--layout-max-width));
  min-height: 100vh;
  margin: 0 auto;
  padding: calc(var(--space-7) + var(--safe-area-top)) var(--space-4)
    calc(var(--space-5) + var(--safe-area-bottom));
}

.auth-layout__brand {
  text-align: center;
}

.auth-layout__mark {
  margin: 0;
  color: var(--color-primary-strong);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
}

.auth-layout__tagline {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.auth-layout__panel {
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
</style>
