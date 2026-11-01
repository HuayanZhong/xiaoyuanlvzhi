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

const pageTitle = computed(() => (profile.value ? displayName.value : "我的"));

type ProfileRow = {
  label: string;
  value: string;
  mono?: boolean;
  code?: string;
  stamp?: string;
  stampTone?: "alive" | "pending" | "danger" | "neutral";
};

const recordRows = computed<ProfileRow[]>(() => {
  const current = profile.value;

  return [
    { label: "院系", value: placeholder(current?.department) },
    { label: "班级", value: placeholder(current?.className) },
    { label: "手机号", value: placeholder(current?.phone) },
    { label: "邮箱", value: placeholder(current?.email) },
  ];
});

const dataRows = computed<ProfileRow[]>(() => {
  const current = profile.value;
  const activeCount = current?.activeAdoptionCount ?? 0;

  return [
    {
      label: "当前积分",
      value: String(current?.pointsBalance ?? 0),
      code: "PT",
      mono: true,
    },
    {
      label: "在养绿植",
      value: activeCount > 0 ? String(activeCount) : "暂无在养绿植",
      code: "PL",
      stamp: activeCount > 0 ? "在养中" : undefined,
      stampTone: "alive",
      mono: activeCount > 0,
    },
  ];
});

const missingOptional = computed(() => {
  const current = profile.value;

  if (!current) {
    return false;
  }

  return !current.phone?.trim() || !current.className?.trim();
});

function placeholder(value: string | null | undefined): string {
  return value?.trim() || "未填写";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 10).replaceAll("-", ".");
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
    <UiPageHeader
      eyebrow="持档人档案 · HOLDER FILE"
      :title="pageTitle"
      subtitle="账号资料与登录状态"
      :meta="profile?.studentNumber || undefined"
    />

    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="me-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <template v-else-if="profile">
      <div class="me-page__sheet">
        <aside class="me-page__identity">
          <p class="me-page__identity-label">持档人 · HOLDER</p>
          <p class="me-page__identity-name">{{ displayName }}</p>
          <dl class="me-page__identity-meta">
            <div>
              <dt>档案编号</dt>
              <dd>{{ placeholder(profile.studentNumber) }}</dd>
            </div>
            <div>
              <dt>建档日期</dt>
              <dd>{{ formatDate(profile.createdAt) }}</dd>
            </div>
          </dl>
          <Stamp tone="alive">在册</Stamp>
        </aside>

        <div class="me-page__record">
          <FolioSection index="01" title="登记资料" meta="RECORD">
            <Ledger>
              <TagRow
                v-for="row in recordRows"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :mono="row.mono"
                :code="row.code"
                :stamp="row.stamp"
                :stamp-tone="row.stampTone"
              />
            </Ledger>
          </FolioSection>

          <FolioSection index="02" title="积分与领养" meta="POINTS">
            <Ledger>
              <TagRow
                v-for="row in dataRows"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :mono="row.mono"
                :code="row.code"
                :stamp="row.stamp"
                :stamp-tone="row.stampTone"
              />
            </Ledger>

            <NuxtLink to="/my-plants" class="me-page__care-link">
              我的绿植 · 养护打卡
            </NuxtLink>
          </FolioSection>

          <UiEmptyState
            v-if="missingOptional"
            title="资料待补全"
            description="手机号或班级尚未填写，请联系管理员更正。"
          />

          <div class="me-page__actions">
            <p class="me-page__actions-note">
              退出后需要重新登录才能查看个人资料。
            </p>
            <UiButton variant="danger" @click="confirming = true">
              退出登录
            </UiButton>
          </div>
        </div>
      </div>
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
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.me-page__error-text {
  margin: 0 0 var(--space-3);
}

.me-page__sheet {
  display: grid;
  gap: var(--space-6);
  align-items: start;
}

.me-page__identity {
  position: relative;
  padding: var(--space-5);
  border: var(--border-ink);
  box-shadow:
    inset 0 0 0 3px var(--color-paper),
    inset 0 0 0 4px var(--color-rule);
}

.me-page__identity-label {
  margin: 0;
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.me-page__identity-name {
  margin: var(--space-3) 0 var(--space-5);
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 2.5rem;
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.me-page__identity-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 0 var(--space-5);
  padding-top: var(--space-3);
  border-top: var(--border-hairline);
}

.me-page__identity-meta div {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.me-page__identity-meta dt {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: var(--tracking-code);
}

.me-page__identity-meta dd {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.me-page__record {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.me-page__care-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  margin-top: var(--space-3);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.me-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: var(--border-hairline);
}

.me-page__actions-note {
  max-width: 26rem;
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

@media (min-width: 48rem) {
  .me-page__sheet {
    grid-template-columns: minmax(16rem, 4fr) minmax(0, 8fr);
    gap: var(--space-8);
  }
}

@media (max-width: 30rem) {
  .me-page__identity-name {
    font-size: 2rem;
  }
}
</style>
