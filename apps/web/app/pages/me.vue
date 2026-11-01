<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { getStudentProfile } from "~/utils/profile-api";

const { logout } = useAuth();

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("me-profile", async () => {
  try {
    return { profile: await getStudentProfile(), errorMessage: "" };
  } catch (error) {
    return { profile: null, errorMessage: resolveRequestError(error) };
  }
});

const profile = computed(() => data.value?.profile ?? null);
const loading = computed(() => loadStatus.value === "pending");
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const confirming = ref(false);
const loggingOut = ref(false);

const displayName = computed(() => {
  const current = profile.value;

  return (
    current?.fullName?.trim() ||
    current?.studentNumber ||
    current?.email ||
    "未填写"
  );
});

const rows = computed(() => {
  const current = profile.value;

  return [
    { label: "姓名", value: displayName.value },
    { label: "学号", value: placeholder(current?.studentNumber) },
    { label: "院系", value: placeholder(current?.department) },
    { label: "班级", value: placeholder(current?.className) },
    { label: "手机号", value: placeholder(current?.phone) },
    { label: "邮箱", value: placeholder(current?.email) },
    { label: "当前积分", value: String(current?.pointsBalance ?? 0) },
    {
      label: "在养绿植",
      value:
        (current?.activeAdoptionCount ?? 0) > 0
          ? String(current?.activeAdoptionCount)
          : "暂无在养绿植",
    },
  ];
});

function placeholder(value: string | null | undefined): string {
  return value?.trim() || "未填写";
}

function load() {
  return refresh();
}

async function confirmLogout() {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;

  try {
    const result = await logout();
    await navigateTo(
      result.revokeFailed
        ? { path: "/login", query: { notice: "revoke-failed" } }
        : "/login",
    );
  } finally {
    loggingOut.value = false;
    confirming.value = false;
  }
}
</script>

<template>
  <section class="me-page">
    <UiPageHeader title="我的" subtitle="账号资料与登录状态" />

    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="me-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <template v-else-if="profile">
      <dl class="me-page__list">
        <div v-for="row in rows" :key="row.label" class="me-page__row">
          <dt class="me-page__label">{{ row.label }}</dt>
          <dd class="me-page__value">{{ row.value }}</dd>
        </div>
      </dl>

      <UiButton variant="secondary" block @click="confirming = true">
        退出登录
      </UiButton>
    </template>

    <UiConfirmDialog
      :open="confirming"
      title="退出登录"
      message="退出后需要重新登录才能查看个人资料。"
      confirm-text="退出"
      :busy="loggingOut"
      @confirm="confirmLogout"
      @cancel="confirming = false"
    />
  </section>
</template>

<style scoped>
.me-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.me-page__list {
  margin: 0;
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.me-page__row {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.me-page__row:last-child {
  border-bottom: 0;
}

.me-page__label {
  flex: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.me-page__value {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-size: var(--font-size-md);
  text-align: right;
}

.me-page__error-text {
  margin: 0 0 var(--space-3);
}
</style>
