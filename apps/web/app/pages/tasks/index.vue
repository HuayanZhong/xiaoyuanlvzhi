<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  listParticipations,
  listTasks,
  type EcoTask,
  type TaskParticipation,
} from "~/utils/task-api";
import {
  canJoin,
  participationStatusMeta,
  remainingQuota,
  taskStatusMeta,
} from "~/utils/task-status";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "open", label: "可报名" },
  { key: "joined", label: "已参加" },
  { key: "ended", label: "已结束" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const activeFilter = ref<FilterKey>("all");

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData("tasks", async () => {
  try {
    const [tasks, participations] = await Promise.all([
      listTasks(),
      listParticipations(),
    ]);

    return { tasks, participations, errorMessage: "" };
  } catch (error) {
    return {
      tasks: [] as EcoTask[],
      participations: [] as TaskParticipation[],
      errorMessage: resolveRequestError(error),
    };
  }
});

const allTasks = computed<EcoTask[]>(() => data.value?.tasks ?? []);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

const participationByTask = computed(() => {
  const map = new Map<number, TaskParticipation>();

  for (const item of data.value?.participations ?? []) {
    map.set(item.taskId, item);
  }

  return map;
});

const tasks = computed(() =>
  allTasks.value.filter((task) => matchesFilter(task)),
);

function matchesFilter(task: EcoTask): boolean {
  switch (activeFilter.value) {
    case "open":
      return canJoin(task);
    case "joined":
      return participationByTask.value.has(task.id);
    case "ended":
      return task.status === "ENDED";
    default:
      return true;
  }
}

function quotaLabel(task: EcoTask): string {
  const remaining = remainingQuota(task);

  return remaining === null ? "不限" : `${remaining} / ${task.maxParticipants}`;
}

function windowLabel(task: EcoTask): string {
  return `${formatDateTime(task.startsAt)} — ${formatDateTime(task.endsAt)}`;
}

function myStatus(task: EcoTask) {
  const item = participationByTask.value.get(task.id);

  return item ? participationStatusMeta(item.status) : null;
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="tasks-page">
    <UiPageHeader
      eyebrow="环保任务"
      title="任务"
      subtitle="报名后提交完成凭证，审核通过按任务奖励发放积分。"
      :meta="`${allTasks.length} 项任务`"
    />

    <div class="tasks-page__filters" role="group" aria-label="任务筛选">
      <button
        v-for="filter in FILTERS"
        :key="filter.key"
        type="button"
        class="tasks-page__filter"
        :class="{ 'tasks-page__filter--active': activeFilter === filter.key }"
        :aria-pressed="activeFilter === filter.key"
        @click="activeFilter = filter.key"
      >
        {{ filter.label }}
      </button>
    </div>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="tasks-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="tasks.length === 0"
      title="当前筛选下暂无任务"
      description="切换筛选，或稍后再来看看新的环保任务。"
    />

    <ul v-else class="tasks-page__list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="tasks-page__card"
        :class="{ 'tasks-page__card--covered': task.coverFileId }"
      >
        <span class="tape" aria-hidden="true"></span>
        <UiFigure
          v-if="task.coverFileId"
          class="tasks-page__cover"
          :file-id="task.coverFileId"
          :alt="`${task.title}封面`"
          flat
        />

        <div class="tasks-page__body">
          <div class="tasks-page__head">
            <h2 class="tasks-page__title">
              <NuxtLink :to="`/tasks/${task.id}`" class="tasks-page__link">
                {{ task.title }}
              </NuxtLink>
            </h2>
            <UiStatusChip :tone="taskStatusMeta(task.status).tone">
              {{ taskStatusMeta(task.status).label }}
            </UiStatusChip>
          </div>

          <Ledger class="tasks-page__rows">
            <TagRow label="开放时间" :value="windowLabel(task)" mono />
            <TagRow label="剩余名额" :value="quotaLabel(task)" mono />
            <TagRow
              label="奖励积分"
              :value="`${task.pointsPerPerson} 分`"
              mono
            />
            <TagRow
              v-if="myStatus(task)"
              label="我的参与"
              :value="myStatus(task)?.label ?? ''"
            />
            <TagRow
              v-else
              label="已报名"
              :value="`${task.participantCount} 人`"
              mono
            />
          </Ledger>

          <div class="tasks-page__foot">
            <NuxtLink :to="`/tasks/${task.id}`" class="tasks-page__action">
              查看任务
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.tasks-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-line);
}

.tasks-page__filter {
  min-height: var(--touch-target);
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border: var(--border-strong);
  border-radius: var(--radius-chip);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color);
}

.tasks-page__filter--active {
  background: var(--color-leaf);
  border-color: var(--color-leaf);
  color: var(--color-on-leaf);
}

.tasks-page__error {
  margin: 0 0 var(--space-3);
}

.tasks-page__list {
  display: grid;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.tasks-page__card {
  position: relative;
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-4) var(--space-4);
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-paper);
}

.tasks-page__cover {
  width: 6rem;
}

.tasks-page__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.tasks-page__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.tasks-page__title {
  margin: 0;
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
}

.tasks-page__link {
  color: var(--color-ink);
  text-decoration: none;
  transition: color var(--motion-color);
}

.tasks-page__link:hover {
  color: var(--color-leaf);
}

.tasks-page__rows {
  display: flex;
  flex-direction: column;
}

.tasks-page__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.tasks-page__action {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (min-width: 48rem) {
  .tasks-page__card--covered {
    grid-template-columns: 9rem minmax(0, 1fr);
    align-items: start;
  }

  .tasks-page__cover {
    width: 9rem;
  }
}
</style>
