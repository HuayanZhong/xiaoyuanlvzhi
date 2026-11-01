<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { getStudentProfile } from "~/utils/profile-api";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("home-profile", async () => {
  try {
    return { profile: await getStudentProfile(), errorMessage: "" };
  } catch (error) {
    return { profile: null, errorMessage: resolveRequestError(error) };
  }
});

const profile = computed(() => data.value?.profile ?? null);
const loading = computed(() => loadStatus.value === "pending");
const errorMessage = computed(() => data.value?.errorMessage ?? "");

const displayName = computed(() => {
  const current = profile.value;

  return (
    current?.fullName?.trim() ||
    current?.studentNumber ||
    current?.email ||
    "同学"
  );
});

const activeCount = computed(() => profile.value?.activeAdoptionCount ?? 0);

function load() {
  return refresh();
}
</script>

<template>
  <section class="home-page">
    <UiPageHeader
      :title="`你好，${displayName}`"
      subtitle="今天也来看看你的绿植吧"
    />

    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="home-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <div v-else-if="profile" class="home-page__stats">
      <article class="home-page__card">
        <p class="home-page__label">当前积分</p>
        <p class="home-page__value">{{ profile.pointsBalance }}</p>
      </article>
      <article class="home-page__card">
        <p class="home-page__label">在养绿植</p>
        <p v-if="activeCount > 0" class="home-page__value">{{ activeCount }}</p>
        <p v-else class="home-page__empty">暂无在养绿植</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.home-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: var(--space-3);
}

.home-page__card {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.home-page__label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.home-page__value {
  margin: var(--space-2) 0 0;
  color: var(--color-primary-strong);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.home-page__empty {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.home-page__error-text {
  margin: 0 0 var(--space-3);
}
</style>
