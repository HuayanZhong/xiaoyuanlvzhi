<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  loadNotificationSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "~/utils/notification-api";
import { clearNotificationCache } from "~/utils/notification-cache";
import {
  notificationTarget,
  notificationTypeLabel,
} from "~/utils/notification-label";
import { listParticipations } from "~/utils/task-api";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("notifications", loadNotificationSnapshot);

const items = computed<NotificationItem[]>(() => data.value?.items ?? []);
const unreadCount = computed(() => data.value?.unreadCount ?? 0);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

const busyId = ref<number | null>(null);
const markingAll = ref(false);
const actionError = ref("");

async function open(item: NotificationItem) {
  if (busyId.value !== null || markingAll.value) {
    return;
  }

  actionError.value = "";

  if (!item.readAt) {
    busyId.value = item.id;

    try {
      await markNotificationRead(item.id);
      clearNotificationCache();
      await refresh();
    } catch (error) {
      actionError.value = resolveActionError(error);
      busyId.value = null;

      return;
    }

    busyId.value = null;
  }

  await openTarget(item);
}

async function markAll() {
  if (unreadCount.value === 0 || markingAll.value || busyId.value !== null) {
    return;
  }

  markingAll.value = true;
  actionError.value = "";

  try {
    await markAllNotificationsRead();
    clearNotificationCache();
    await refresh();
  } catch (error) {
    actionError.value = resolveActionError(error);
  } finally {
    markingAll.value = false;
  }
}

async function openTarget(item: NotificationItem) {
  const target = notificationTarget(item.businessType, item.businessId);

  if (!target) {
    return;
  }

  if (target.kind === "path") {
    await navigateTo(target.path);

    return;
  }

  let path = "/tasks";

  try {
    const participations = await listParticipations();
    const found = participations.find(
      (entry) => entry.id === target.participationId,
    );

    if (found) {
      path = `/tasks/${found.taskId}`;
    }
  } catch {
    path = "/tasks";
  }

  await navigateTo(path);
}

function isBusy(item: NotificationItem) {
  return busyId.value === item.id || markingAll.value;
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="notices-page">
    <UiPageHeader
      eyebrow="站内通知"
      title="通知"
      subtitle="领养审核、养护打卡、环保任务和兑换的结果会记录在这里。"
      :meta="unreadCount > 0 ? `${unreadCount} 条未读` : '暂无未读'"
    >
      <template #meta>
        <UiButton
          variant="secondary"
          :disabled="unreadCount === 0 || Boolean(busyId)"
          :loading="markingAll"
          @click="markAll"
        >
          全部标记已读
        </UiButton>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <template v-else>
      <UiAlert v-if="errorMessage" tone="error">
        <p class="notices-page__message">{{ errorMessage }}</p>
        <UiButton variant="secondary" @click="load">重试</UiButton>
      </UiAlert>

      <UiAlert v-if="actionError" tone="error">
        <p class="notices-page__message">{{ actionError }}</p>
      </UiAlert>

      <UiEmptyState
        v-if="!errorMessage && items.length === 0"
        title="暂无通知"
        description="审核结果、兑换进度和反馈回复会出现在这里。"
      />

      <ul v-else-if="items.length" class="notices-page__list">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            class="notices-page__item"
            :class="{ 'notices-page__item--unread': !item.readAt }"
            :disabled="isBusy(item)"
            @click="open(item)"
          >
            <span class="notices-page__head">
              <span class="notices-page__type">
                {{ notificationTypeLabel(item.businessType) }}
              </span>
              <UiStatusChip :tone="item.readAt ? 'neutral' : 'pending'">
                {{ item.readAt ? "已读" : "未读" }}
              </UiStatusChip>
            </span>

            <span class="notices-page__title">{{ item.title }}</span>
            <span v-if="item.summary" class="notices-page__summary">
              {{ item.summary }}
            </span>

            <span class="notices-page__foot">
              <span>{{ formatDateTime(item.createdAt) }}</span>
              <span v-if="busyId === item.id">处理中…</span>
              <span
                v-else-if="
                  notificationTarget(item.businessType, item.businessId)
                "
              >
                打开记录
              </span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.notices-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.notices-page__message {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.notices-page__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: var(--border-line);
  list-style: none;
}

.notices-page__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--touch-target);
  padding: var(--space-4) var(--space-2);
  background: transparent;
  border: 0;
  border-bottom: var(--border-line);
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-color);
}

.notices-page__item:not(:disabled):hover {
  background: var(--color-ink-wash);
}

.notices-page__item:disabled {
  background: var(--color-ink-wash);
  color: var(--color-subtle);
  cursor: progress;
  opacity: 1;
}

.notices-page__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.notices-page__type {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.notices-page__title {
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
  overflow-wrap: anywhere;
}

.notices-page__summary {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
  overflow-wrap: anywhere;
}

.notices-page__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: center;
  justify-content: space-between;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

@media (min-width: 48rem) {
  .notices-page__item {
    padding-inline: var(--space-3);
  }
}
</style>
