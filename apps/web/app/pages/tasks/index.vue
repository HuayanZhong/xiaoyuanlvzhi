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
import { ECO_ACTION_IMAGE } from "~/utils/plant-media";

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
      title="今天，做一点绿色的事"
      subtitle="选择一项真实可完成的行动。提交凭证后，审核通过即获得环保积分。"
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

    <TransitionGroup v-else name="task-list" tag="ul" class="tasks-page__list">
      <li
        v-for="(task, index) in tasks"
        :key="task.id"
        class="tasks-page__card"
        :class="{
          'tasks-page__card--covered': task.coverFileId,
          'tasks-page__card--featured': index === 0,
        }"
        data-cursor-hover
      >
        <div v-if="index === 0" class="tasks-page__visual" aria-hidden="true">
          <img :src="ECO_ACTION_IMAGE" alt="" />
          <span>今日行动</span>
        </div>

        <UiFigure
          v-else-if="task.coverFileId"
          class="tasks-page__cover"
          :file-id="task.coverFileId"
          :alt="`${task.title}封面`"
          flat
        />

        <div class="tasks-page__body">
          <div class="tasks-page__head">
            <div>
              <p class="tasks-page__index">
                {{ String(index + 1).padStart(2, "0") }}
              </p>
              <h2 class="tasks-page__title">
                <NuxtLink :to="`/tasks/${task.id}`" class="tasks-page__link">
                  {{ task.title }}
                </NuxtLink>
              </h2>
            </div>
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
              查看行动
              <span aria-hidden="true">↗</span>
            </NuxtLink>
          </div>
        </div>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding-bottom: 2rem;
}

.tasks-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
  border-bottom: var(--border-line);
}

.tasks-page__filter {
  min-height: var(--touch-target);
  padding: 0 1rem;
  background: transparent;
  border: 0;
  border-radius: var(--radius-control);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color);
}

.tasks-page__filter--active {
  background: var(--color-deep-pine);
  color: var(--color-on-deep-pine);
}

.tasks-page__error {
  margin: 0 0 var(--space-3);
}

.tasks-page__list {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tasks-page__card {
  position: relative;
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: 1.5rem;
  overflow: hidden;
  min-height: 9rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: none;
  transition:
    border-color var(--motion-color),
    box-shadow var(--motion-color),
    transform var(--motion-color);
}

.tasks-page__card:hover {
  border-color: var(--color-leaf);
  box-shadow: 0 18px 44px -42px var(--color-shadow-strong);
}

.tasks-page__card--featured {
  grid-template-columns: 5fr 7fr;
  min-height: 26rem;
  padding: 0;
  background: var(--color-deep-pine);
  color: var(--color-on-deep-pine);
}

.tasks-page__visual {
  position: relative;
  min-height: 26rem;
  overflow: hidden;
}

.tasks-page__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--motion-image);
}

.tasks-page__card--featured:hover .tasks-page__visual img {
  transform: scale(1.025);
}

.tasks-page__visual span {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  padding: 0.35rem 0.6rem;
  background: var(--color-citron);
  border-radius: var(--radius-sticker);
  color: var(--palette-ink);
  font-size: var(--font-size-label);
  font-weight: 600;
}

.tasks-page__cover {
  width: 6rem;
}

.tasks-page__body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.tasks-page__card:not(.tasks-page__card--covered):not(
    .tasks-page__card--featured
  )
  .tasks-page__body {
  grid-column: 1 / -1;
}

.tasks-page__card--featured .tasks-page__body {
  justify-content: center;
  padding: 2.5rem;
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
  font-family: var(--font-display);
  font-size: var(--font-size-title);
  font-weight: 600;
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
}

.tasks-page__index {
  margin: 0 0 0.5rem;
  color: var(--color-subtle);
  font-family: var(--font-number);
  font-size: var(--font-size-small);
}

.tasks-page__card--featured .tasks-page__index {
  color: color-mix(in srgb, var(--color-on-leaf) 58%, transparent);
}

.tasks-page__link {
  color: var(--color-ink);
  text-decoration: none;
  transition: color var(--motion-color);
}

.tasks-page__link:hover {
  color: var(--color-leaf);
}

.tasks-page__card--featured .tasks-page__link {
  color: var(--color-on-deep-pine);
  font-size: var(--font-size-number-large);
  line-height: 1.2;
}

.tasks-page__card--featured :deep(.ui-tag-row) {
  border-bottom-color: color-mix(
    in srgb,
    var(--color-on-deep-pine) 16%,
    transparent
  );
}

.tasks-page__card--featured :deep(.ui-tag-row__label),
.tasks-page__card--featured :deep(.ui-tag-row__value) {
  color: color-mix(in srgb, var(--color-on-deep-pine) 76%, transparent);
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
  text-decoration: none;
}

.tasks-page__action span {
  transition: transform var(--motion-hover);
}

.tasks-page__action:hover span {
  transform: translate(3px, -3px);
}

.tasks-page__cover {
  width: 8rem;
}

.task-list-enter-active,
.task-list-leave-active {
  transition:
    opacity var(--motion-enter),
    transform var(--motion-enter);
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.task-list-move {
  transition: transform var(--motion-enter);
}

@media (max-width: 81rem) {
  .tasks-page__card--featured {
    min-height: 23rem;
  }

  .tasks-page__visual {
    min-height: 23rem;
  }
}
</style>
