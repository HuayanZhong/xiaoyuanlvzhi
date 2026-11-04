<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { loadHomeOverview, type PendingGroup } from "~/utils/home-overview";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { getStudentProfile } from "~/utils/profile-api";
import type { CareEligiblePlant } from "~/utils/care-api";
import { remainingQuota } from "~/utils/task-status";
import type { EcoTask } from "~/utils/task-api";

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData("home-profile", async () => {
  try {
    return { profile: await getStudentProfile(), errorMessage: "" };
  } catch (error) {
    return { profile: null, errorMessage: resolveRequestError(error) };
  }
});

const profile = computed(() => data.value?.profile ?? null);
const loading = computed(() => loadStatus.value === "pending");
const errorMessage = computed(() => data.value?.errorMessage ?? "");

const { data: notificationData } = await usePageData(
  "notifications",
  loadNotificationSnapshot,
);

const unreadCount = computed(() => notificationData.value?.unreadCount ?? 0);
const notificationError = computed(
  () => notificationData.value?.errorMessage ?? "",
);

const { data: overview, refresh: refreshOverview } = await usePageData(
  "home-overview",
  loadHomeOverview,
);

const pendingGroups = computed<PendingGroup[]>(
  () => overview.value?.pendingGroups ?? [],
);
const pendingError = computed(() => overview.value?.pendingError ?? "");
const joinableTasks = computed<EcoTask[]>(() => overview.value?.tasks ?? []);
const tasksError = computed(() => overview.value?.tasksError ?? "");
const duePlants = computed<CareEligiblePlant[]>(
  () => overview.value?.plants ?? [],
);
const plantsError = computed(() => overview.value?.plantsError ?? "");

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

function quotaLabel(task: EcoTask): string {
  const remaining = remainingQuota(task);

  return remaining === null ? "名额不限" : `剩余 ${remaining} 个名额`;
}

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

    <template v-else-if="profile">
      <div class="home-page__sheet">
        <FolioSection title="我的绿植">
          <NuxtLink
            v-if="activeCount > 0"
            to="/my-plants"
            class="home-page__record"
          >
            <span class="tape" aria-hidden="true"></span>
            <UiLeafMark
              name="plants"
              :size="30"
              class="home-page__record-leaf"
            />
            <span class="home-page__record-value">
              {{ activeCount }}<small>株在养</small>
            </span>
            <UiStatusChip tone="alive">在养中</UiStatusChip>
            <span class="home-page__record-link">查看我的绿植 →</span>
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
        </FolioSection>

        <FolioSection title="待处理事项">
          <UiAlert v-if="pendingError" tone="error">
            <p class="home-page__error-text">{{ pendingError }}</p>
            <UiButton variant="secondary" @click="refreshOverview()">
              重试
            </UiButton>
          </UiAlert>

          <UiEmptyState
            v-else-if="pendingGroups.length === 0"
            title="暂无待处理事项"
            description="审核结果、驳回重提和待领取事项会出现在这里。"
          />

          <Ledger v-else>
            <NuxtLink
              v-for="group in pendingGroups"
              :key="group.key"
              :to="group.to"
              class="home-page__pending-row"
            >
              <span class="home-page__row-title">{{ group.label }}</span>
              <span class="home-page__row-meta">{{ group.record }}</span>
              <span class="home-page__row-count">{{ group.count }}</span>
            </NuxtLink>
          </Ledger>
        </FolioSection>

        <FolioSection title="当前积分">
          <NuxtLink to="/points" class="home-page__points-link">
            <span class="home-page__reading">
              {{ profile.pointsBalance }}<small>分</small>
            </span>
            <span class="home-page__row-meta">
              参与任务或兑换后，余额会更新。
            </span>
          </NuxtLink>
        </FolioSection>

        <FolioSection title="环保任务">
          <UiAlert v-if="tasksError" tone="error">
            <p class="home-page__error-text">{{ tasksError }}</p>
            <UiButton variant="secondary" @click="refreshOverview()">
              重试
            </UiButton>
          </UiAlert>

          <UiEmptyState
            v-else-if="joinableTasks.length === 0"
            title="暂无可报名任务"
            description="任务开放报名后会显示在这里。"
          >
            <NuxtLink to="/tasks" class="home-page__browse">
              查看全部任务
            </NuxtLink>
          </UiEmptyState>

          <Ledger v-else>
            <NuxtLink
              v-for="task in joinableTasks"
              :key="task.id"
              :to="`/tasks/${task.id}`"
              class="home-page__row"
            >
              <span class="home-page__row-title">{{ task.title }}</span>
              <span class="home-page__row-meta">
                {{ task.pointsPerPerson }} 分 · {{ quotaLabel(task) }}
              </span>
            </NuxtLink>
          </Ledger>

          <NuxtLink
            v-if="!tasksError && joinableTasks.length > 0"
            to="/tasks"
            class="home-page__more"
          >
            全部任务 →
          </NuxtLink>
        </FolioSection>

        <FolioSection title="养护提醒">
          <UiAlert v-if="plantsError" tone="error">
            <p class="home-page__error-text">{{ plantsError }}</p>
            <UiButton variant="secondary" @click="refreshOverview()">
              重试
            </UiButton>
          </UiAlert>

          <UiEmptyState
            v-else-if="duePlants.length === 0"
            title="暂无到期养护"
            description="达到养护间隔的绿植会提醒你打卡。"
          />

          <Ledger v-else>
            <NuxtLink
              v-for="plant in duePlants"
              :key="plant.plantId"
              :to="`/my-plants/${plant.plantId}`"
              class="home-page__row"
            >
              <span class="home-page__row-title">{{ plant.plantName }}</span>
              <span class="home-page__row-meta">
                {{ plant.location || "位置未填写" }} · 可打卡
              </span>
            </NuxtLink>
          </Ledger>
        </FolioSection>

        <FolioSection title="消息">
          <NuxtLink to="/notifications" class="home-page__message">
            <span class="home-page__row-title">站内通知</span>
            <span class="home-page__row-meta">
              <template v-if="notificationError">消息暂时不可用</template>
              <template v-else-if="unreadCount > 0">
                {{ unreadCount }} 条未读
              </template>
              <template v-else>暂无未读</template>
            </span>
            <span class="home-page__row-action">查看 →</span>
          </NuxtLink>
        </FolioSection>
      </div>
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
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.home-page__sheet {
  display: grid;
  gap: var(--space-6);
}

.home-page__record {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-5) var(--space-4) var(--space-4);
  color: inherit;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-paper);
  text-decoration: none;
}

.home-page__record-leaf {
  color: var(--color-leaf);
}

.home-page__record-value {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  color: var(--color-ink);
  font-size: var(--font-size-reading);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-display);
}

.home-page__record-value small,
.home-page__reading small {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
}

.home-page__record-link {
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
}

.home-page__reading {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  color: var(--color-leaf);
  font-size: var(--font-size-reading);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-display);
}

.home-page__points-link {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  color: inherit;
  text-decoration: none;
}

.home-page__browse,
.home-page__more {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  margin-top: var(--space-2);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.home-page__pending-row,
.home-page__row,
.home-page__message {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  color: inherit;
  text-decoration: none;
}

.home-page__row-title {
  color: var(--color-ink);
  font-size: var(--font-size-body);
  overflow-wrap: anywhere;
}

.home-page__row-meta {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.home-page__row-count {
  color: var(--color-leaf);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.home-page__row-action {
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
}

@media (min-width: 48rem) {
  .home-page__sheet {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-7);
    align-items: start;
  }
}
</style>
