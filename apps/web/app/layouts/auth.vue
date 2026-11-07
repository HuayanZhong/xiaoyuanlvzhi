<template>
  <div class="auth-layout">
    <aside class="auth-layout__visual">
      <img
        class="auth-layout__image"
        src="/images/auth-repot-v2.jpg"
        alt=""
        aria-hidden="true"
      />
      <div class="auth-layout__shade" aria-hidden="true" />

      <NuxtLink to="/" class="auth-layout__brand">
        <UiLeafMark name="leaf" :size="20" />
        <span>一株</span>
      </NuxtLink>

      <div class="auth-layout__statement">
        <p class="auth-layout__index">PLANT JOURNAL / 01</p>
        <h1>把一株植物，<br />养进你的日常。</h1>
        <p>领养、照料、行动与回馈，都从一次真实的相遇开始。</p>
      </div>

      <p class="auth-layout__caption">一株 · 校园植物领养计划</p>
    </aside>

    <main class="auth-layout__main" tabindex="-1">
      <div class="auth-layout__theme">
        <ThemeToggle />
      </div>
      <div class="auth-layout__form">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  grid-template-columns: 55% 45%;
  min-height: 100vh;
  background: var(--color-paper);
}

.auth-layout__visual {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  overflow: hidden;
  padding: 2.25rem 3.5rem 2.5rem;
  color: var(--color-on-deep-pine);
}

.auth-layout__image,
.auth-layout__shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.auth-layout__image {
  object-fit: cover;
  object-position: center;
}

.auth-layout__shade {
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-deep-pine) 88%, transparent) 0%,
      color-mix(in srgb, var(--color-deep-pine) 34%, transparent) 72%,
      transparent 100%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--color-deep-pine) 86%, transparent) 0%,
      transparent 58%
    );
}

.auth-layout__brand,
.auth-layout__statement,
.auth-layout__caption {
  position: relative;
  z-index: 1;
}

.auth-layout__brand {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  align-self: flex-start;
  color: inherit;
  font-family: var(--font-display);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-display);
  text-decoration: none;
}

.auth-layout__brand:hover {
  color: inherit;
}

.auth-layout__statement {
  max-width: 43rem;
  margin-block: auto;
}

.auth-layout__index {
  margin: 0 0 1.25rem;
  color: color-mix(in srgb, var(--color-on-deep-pine) 76%, transparent);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.auth-layout__statement h1 {
  margin: 0;
  color: var(--color-on-deep-pine);
  font-family: var(--font-display);
  font-size: var(--font-size-auth-title);
  font-weight: var(--font-weight-display);
  letter-spacing: 0;
  line-height: 1.02;
  text-wrap: balance;
}

.auth-layout__statement > p:last-child {
  max-width: 32rem;
  margin: 1.5rem 0 0;
  color: color-mix(in srgb, var(--color-on-deep-pine) 78%, transparent);
  font-size: var(--font-size-body);
  line-height: 1.8;
}

.auth-layout__caption {
  margin: 0;
  color: color-mix(in srgb, var(--color-on-deep-pine) 68%, transparent);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: 0.04em;
}

.auth-layout__main {
  position: relative;
  display: grid;
  align-items: center;
  min-height: 100vh;
  padding: 5rem 5rem 4rem;
  background: var(--color-paper);
  box-shadow: inset 1px 0 0
    color-mix(in srgb, var(--color-line) 42%, transparent);
}

.auth-layout__main::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--color-surface) 52%, transparent) 0%,
    transparent 44%
  );
  content: "";
  pointer-events: none;
}

.auth-layout__theme {
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 1;
}

.auth-layout__form {
  position: relative;
  z-index: 1;
  width: min(100%, 28rem);
  margin-inline: auto;
}

:global([data-theme="dark"]) .auth-layout__image {
  filter: brightness(0.86) saturate(0.78);
}

:global([data-theme="dark"]) .auth-layout__shade {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-deep-pine) 28%, transparent) 0%,
      color-mix(in srgb, var(--color-deep-pine) 66%, transparent) 100%
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-deep-pine) 82%, transparent) 0%,
      color-mix(in srgb, var(--color-deep-pine) 42%, transparent) 62%,
      color-mix(in srgb, var(--color-deep-pine) 22%, transparent) 100%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--color-deep-pine) 78%, transparent) 0%,
      transparent 58%
    );
}

:global([data-theme="dark"]) .auth-layout__main {
  background: linear-gradient(
    145deg,
    var(--color-surface) 0%,
    var(--color-paper) 52%,
    var(--color-paper-deep) 100%
  );
  box-shadow:
    inset 1px 0 0 color-mix(in srgb, var(--color-ink) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--color-ink) 3%, transparent);
}

:global([data-theme="dark"]) .auth-layout__main::before {
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-ink) 3%, transparent) 0,
      transparent 18%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--color-citron) 4%, transparent) 0,
      transparent 30%
    );
}
</style>
