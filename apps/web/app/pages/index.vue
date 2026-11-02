<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { loadNotificationSnapshot } from "~/utils/notification-api";
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

const { data: notificationData } = await useAsyncData(
  "notifications",
  loadNotificationSnapshot,
);

const unreadCount = computed(() => notificationData.value?.unreadCount ?? 0);
const notificationError = computed(
  () => notificationData.value?.errorMessage ?? "",
);

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
const archiveNo = computed(() => profile.value?.studentNumber || "—");
const archivedOn = computed(() => formatDate(profile.value?.createdAt));

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 10).replaceAll("-", ".");
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="home-page">
    <UiPageHeader
      eyebrow="学生档案 · STUDENT FILE"
      :title="`你好，${displayName}`"
      subtitle="今天也来看看你的绿植吧"
      :meta="archiveNo"
    />

    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="home-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <template v-else-if="profile">
      <div class="home-page__sheet">
        <FolioSection index="01" title="在养记录" meta="ADOPTIONS">
          <NuxtLink
            v-if="activeCount > 0"
            to="/my-plants"
            class="home-page__record"
          >
            <p class="home-page__record-label">在养数量</p>
            <p class="home-page__record-value">
              {{ activeCount }}<span class="home-page__unit">PL</span>
            </p>
            <Stamp tone="alive">在养中</Stamp>
          </NuxtLink>

          <UiEmptyState
            v-else
            title="暂无在养绿植"
            description="领养一株后，这里会记录你的养护进度。"
          >
            <NuxtLink to="/plants" class="home-page__browse">
              去看看可领养品种
            </NuxtLink>
          </UiEmptyState>

          <p class="home-page__note">领养审核通过后，植株会登记在这里。</p>
        </FolioSection>

        <FolioSection index="02" title="积分余额" meta="POINTS">
          <NuxtLink to="/points" class="home-page__points-link">
            <div class="home-page__points">
              <p class="home-page__points-value">
                {{ profile.pointsBalance
                }}<span class="home-page__unit">PT</span>
              </p>
              <p class="home-page__note">参与任务或兑换后，余额会更新。</p>
            </div>
          </NuxtLink>
        </FolioSection>
      </div>

      <NuxtLink to="/notifications" class="home-page__message">
        <span class="home-page__message-label">消息 · NOTICES</span>
        <span class="home-page__message-value">
          <template v-if="notificationError">消息暂时不可用</template>
          <template v-else-if="unreadCount > 0">
            {{ unreadCount }} 条未读
          </template>
          <template v-else>暂无未读</template>
        </span>
        <span class="home-page__message-action" aria-hidden="true">查看 →</span>
      </NuxtLink>

      <dl class="home-page__strip">
        <div class="home-page__strip-item">
          <dt class="home-page__strip-label">档案编号</dt>
          <dd class="home-page__strip-value">{{ archiveNo }}</dd>
        </div>
        <div class="home-page__strip-item">
          <dt class="home-page__strip-label">建档日期</dt>
          <dd class="home-page__strip-value">{{ archivedOn }}</dd>
        </div>
        <div class="home-page__strip-item">
          <dt class="home-page__strip-label">档案状态</dt>
          <dd class="home-page__strip-value">在册</dd>
        </div>
      </dl>
    </template>
  </section>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.home-page__error-text {
  margin: 0 0 var(--space-3);
}

.home-page__sheet {
  display: grid;
  gap: var(--space-6);
}

.home-page__record {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-1) 0 var(--space-5);
  color: inherit;
  text-decoration: none;
}

.home-page__record:hover .home-page__record-value {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.home-page__record-label {
  margin: 0;
  color: var(--color-graphite);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.home-page__record-value,
.home-page__points-value {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-measure);
  line-height: var(--line-height-reading);
}

.home-page__unit {
  color: var(--color-seal);
  font-size: var(--font-size-sm);
  letter-spacing: var(--tracking-code);
}

.home-page__points-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.home-page__points {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.home-page__note {
  margin: var(--space-4) 0 0;
  padding-top: var(--space-3);
  border-top: var(--border-hairline);
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.home-page__browse {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  margin-top: var(--space-2);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.home-page__message {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  border-top: var(--border-ink);
  border-bottom: var(--border-hairline);
  color: var(--color-ink);
  text-decoration: none;
}

.home-page__message-label {
  color: var(--color-graphite);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.home-page__message-value {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  letter-spacing: var(--tracking-title-cn);
}

.home-page__message-action {
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}

.home-page__strip {
  display: grid;
  margin: 0;
  border-top: var(--border-ink);
  border-bottom: var(--border-hairline);
}

.home-page__strip-item {
  padding: var(--space-3) 0;
}

.home-page__strip-label {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: var(--tracking-code);
}

.home-page__strip-value {
  margin: var(--space-1) 0 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

@media (min-width: 48rem) {
  .home-page__sheet {
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    gap: var(--space-8);
  }

  .home-page__strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-page__strip-item + .home-page__strip-item {
    padding-left: var(--space-5);
    border-left: var(--border-hairline);
  }
}

@media (max-width: 30rem) {
  .home-page__strip-item + .home-page__strip-item {
    padding-top: var(--space-2);
    border-top: var(--border-hairline);
  }
}
</style>
