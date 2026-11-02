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

const { data: overview, refresh: refreshOverview } = await useAsyncData(
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
const archiveNo = computed(() => profile.value?.studentNumber || "—");
const archivedOn = computed(() => formatDate(profile.value?.createdAt));

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 10).replaceAll("-", ".");
}

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
        <FolioSection index="01" title="我的绿植" meta="ADOPTIONS">
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

          <p v-if="activeCount === 0" class="home-page__note">
            领养审核通过后，植株会登记在这里。
          </p>
        </FolioSection>

        <FolioSection index="02" title="待处理事项" meta="PENDING">
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

          <ul v-else class="home-page__list">
            <li v-for="group in pendingGroups" :key="group.key">
              <NuxtLink :to="group.to" class="home-page__pending-row">
                <span class="home-page__pending-label">
                  {{ group.label }}
                </span>
                <span class="home-page__pending-record">
                  {{ group.record }}
                </span>
                <span class="home-page__pending-count">
                  {{ group.count }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </FolioSection>

        <FolioSection index="03" title="当前积分" meta="POINTS">
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

        <FolioSection index="04" title="环保任务" meta="TASKS">
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

          <ul v-else class="home-page__list">
            <li v-for="task in joinableTasks" :key="task.id">
              <NuxtLink :to="`/tasks/${task.id}`" class="home-page__row">
                <span class="home-page__row-title">{{ task.title }}</span>
                <span class="home-page__row-meta">
                  {{ task.pointsPerPerson }} PT · {{ quotaLabel(task) }}
                </span>
              </NuxtLink>
            </li>
          </ul>

          <NuxtLink
            v-if="!tasksError && joinableTasks.length > 0"
            to="/tasks"
            class="home-page__more"
          >
            全部任务 →
          </NuxtLink>
        </FolioSection>

        <FolioSection index="05" title="养护提醒" meta="CARE">
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

          <ul v-else class="home-page__list">
            <li v-for="plant in duePlants" :key="plant.plantId">
              <NuxtLink
                :to="`/my-plants/${plant.plantId}`"
                class="home-page__row"
              >
                <span class="home-page__row-title">{{ plant.plantName }}</span>
                <span class="home-page__row-meta">
                  {{ plant.location || "位置未填写" }} · 可打卡
                </span>
              </NuxtLink>
            </li>
          </ul>
        </FolioSection>

        <FolioSection index="06" title="消息" meta="NOTICES">
          <NuxtLink to="/notifications" class="home-page__message">
            <span class="home-page__message-label">站内通知</span>
            <span class="home-page__message-value">
              <template v-if="notificationError">消息暂时不可用</template>
              <template v-else-if="unreadCount > 0">
                {{ unreadCount }} 条未读
              </template>
              <template v-else>暂无未读</template>
            </span>
            <span class="home-page__message-action" aria-hidden="true">
              查看 →
            </span>
          </NuxtLink>
        </FolioSection>
      </div>

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
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
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
  padding: var(--space-1) 0 var(--space-3);
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

.home-page__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: var(--border-hairline);
  list-style: none;
}

.home-page__list li {
  border-bottom: var(--border-hairline);
}

.home-page__pending-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-1) var(--space-3);
  align-items: baseline;
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  color: inherit;
  text-decoration: none;
}

.home-page__pending-label {
  color: var(--color-ink);
  font-size: var(--font-size-md);
}

.home-page__pending-record {
  grid-column: 1;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
  overflow-wrap: anywhere;
}

.home-page__pending-count {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: 1.5rem;
  line-height: 1;
}

.home-page__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  color: inherit;
  text-decoration: none;
}

.home-page__row-title {
  color: var(--color-ink);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  overflow-wrap: anywhere;
}

.home-page__row-meta {
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.home-page__more {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-7);
    align-items: start;
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
