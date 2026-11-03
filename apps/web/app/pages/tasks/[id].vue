<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { ApiError } from "~/utils/api";
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  getTask,
  joinTask,
  listParticipations,
  submitTaskEvidence,
  type EcoTask,
  type TaskParticipation,
  type TaskSubmission,
} from "~/utils/task-api";
import {
  canJoin,
  canSubmit,
  isFull,
  participationStatusMeta,
  remainingQuota,
  taskStatusMeta,
} from "~/utils/task-status";

const JOIN_CONFLICT_CODES = new Set([
  "TASK_NOT_OPEN",
  "TASK_ALREADY_JOINED",
  "TASK_FULL",
]);

const route = useRoute();
const taskId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData(
  () => `task:${taskId.value}`,
  async () => {
    try {
      const [task, participations] = await Promise.all([
        getTask(taskId.value),
        listParticipations(),
      ]);

      return {
        task,
        participation:
          participations.find((item) => item.taskId === taskId.value) ?? null,
        errorMessage: "",
        missing: false,
      };
    } catch (error) {
      const missing =
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404);

      return {
        task: null,
        participation: null,
        errorMessage: missing ? "" : resolveRequestError(error),
        missing,
      };
    }
  },
  { watch: [taskId] },
);

const task = computed<EcoTask | null>(() => data.value?.task ?? null);
const participation = computed<TaskParticipation | null>(
  () => data.value?.participation ?? null,
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const missing = computed(() => data.value?.missing ?? false);
const loading = computed(() => loadStatus.value === "pending");
const statusMeta = computed(() => taskStatusMeta(task.value?.status ?? ""));
const joinable = computed(() => (task.value ? canJoin(task.value) : false));

const joining = ref(false);
const joinError = ref("");

const note = ref("");
const imageIds = ref<number[]>([]);
const uploading = ref(false);
const submitting = ref(false);
const attempted = ref(false);
const submitError = ref("");

const evidenceConfigured = computed(() =>
  Boolean(task.value?.requireText || task.value?.requirePhoto),
);

const editable = computed(() => {
  const current = task.value;
  const record = participation.value;

  if (!current || !record) {
    return false;
  }

  return (
    current.status === "ONGOING" &&
    (record.status === "JOINED" || record.status === "REJECTED")
  );
});

const submitLabel = computed(() =>
  participation.value?.status === "REJECTED" ? "重新提交" : "提交凭证",
);

const noteLabel = computed(() =>
  task.value?.requireText ? "完成说明（必填）" : "完成说明（选填）",
);

const imageLabel = computed(() =>
  task.value?.requirePhoto ? "凭证图片（必填）" : "凭证图片（选填）",
);

const noteError = computed(() =>
  note.value.length > 500 ? "说明最多 500 字" : "",
);

const evidenceError = computed(() => {
  if (!attempted.value || !task.value) {
    return "";
  }

  if (task.value.requireText && !note.value.trim()) {
    return "请填写任务完成说明";
  }

  if (task.value.requirePhoto && imageIds.value.length === 0) {
    return "请上传任务照片";
  }

  return "";
});

watch(note, () => {
  submitError.value = "";
});

function submissionMeta(item: TaskSubmission) {
  return participationStatusMeta(item.status);
}

async function submit() {
  attempted.value = true;
  submitError.value = "";

  const current = task.value;
  const record = participation.value;

  if (
    !current ||
    !record ||
    !canSubmit(current, record) ||
    submitting.value ||
    uploading.value ||
    noteError.value ||
    evidenceError.value
  ) {
    return;
  }

  submitting.value = true;

  try {
    await submitTaskEvidence(record.id, {
      ...(note.value.trim() ? { note: note.value.trim() } : {}),
      ...(imageIds.value.length ? { imageFileIds: imageIds.value } : {}),
    });
    note.value = "";
    imageIds.value = [];
    attempted.value = false;
    await refresh();
  } catch (error) {
    submitError.value = resolveActionError(error);
  } finally {
    submitting.value = false;
  }
}

const windowLabel = computed(() => {
  const current = task.value;

  return current
    ? `${formatDateTime(current.startsAt)} — ${formatDateTime(current.endsAt)}`
    : "";
});

const participantLabel = computed(() =>
  task.value ? `${task.value.participantCount} 人` : "",
);

const quotaLabel = computed(() => {
  const current = task.value;

  if (!current) {
    return "";
  }

  const remaining = remainingQuota(current);

  return remaining === null ? "不限" : `${remaining} 个`;
});

const evidenceLabel = computed(() => {
  const current = task.value;

  if (!current) {
    return "";
  }

  if (current.requireText && current.requirePhoto) {
    return "文字说明 + 照片凭证";
  }

  if (current.requireText) {
    return "文字说明";
  }

  if (current.requirePhoto) {
    return "照片凭证";
  }

  return "未配置凭证要求";
});

const participationMeta = computed(() =>
  participation.value
    ? participationStatusMeta(participation.value.status)
    : null,
);

const joinHint = computed(() => {
  const current = task.value;

  if (!current || participation.value) {
    return "";
  }

  if (current.status === "UPCOMING") {
    return "尚未开始";
  }

  if (current.status === "ENDED") {
    return "任务已结束";
  }

  if (isFull(current)) {
    return "名额已满";
  }

  return "";
});

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function join() {
  const current = task.value;

  if (!current || !joinable.value || joining.value) {
    return;
  }

  joining.value = true;
  joinError.value = "";

  try {
    await joinTask(current.id);
    await refresh();
  } catch (error) {
    joinError.value = resolveActionError(error);

    if (error instanceof ApiError && JOIN_CONFLICT_CODES.has(error.code)) {
      await refresh();
    }
  } finally {
    joining.value = false;
  }
}
</script>

<template>
  <section class="task-detail">
    <UiPageHeader
      eyebrow="环保任务"
      :title="task?.title || '任务详情'"
      :subtitle="windowLabel || '查看任务要求和凭证进度。'"
    >
      <template #meta>
        <NuxtLink to="/tasks" class="task-detail__link">返回任务列表</NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="task-detail__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="refresh()">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="missing || !task"
      title="无法查看这个任务"
      description="任务不存在，或已经停用。"
    >
      <NuxtLink to="/tasks" class="task-detail__link">返回任务列表</NuxtLink>
    </UiEmptyState>

    <template v-else>
      <div class="task-detail__summary">
        <UiStatusChip :tone="statusMeta.tone">{{
          statusMeta.label
        }}</UiStatusChip>
        <p class="task-detail__hint">{{ statusMeta.hint }}</p>
      </div>

      <UiFigure
        v-if="task.coverFileId"
        ratio="wide"
        :file-id="task.coverFileId"
        :alt="`${task.title}封面`"
      />

      <FolioSection title="任务档案">
        <p class="task-detail__details">{{ task.details }}</p>

        <Ledger class="task-detail__rows">
          <TagRow label="开放时间" :value="windowLabel" mono />
          <TagRow label="已报名" :value="participantLabel" mono />
          <TagRow label="剩余名额" :value="quotaLabel" mono />
          <TagRow label="单人奖励" :value="`${task.pointsPerPerson} 分`" mono />
          <TagRow label="凭证要求" :value="evidenceLabel" />
        </Ledger>
      </FolioSection>

      <FolioSection title="我的参与">
        <template v-if="participation && participationMeta">
          <div class="task-detail__summary">
            <UiStatusChip :tone="participationMeta.tone">
              {{ participationMeta.label }}
            </UiStatusChip>
            <p class="task-detail__hint">{{ participationMeta.hint }}</p>
          </div>

          <Ledger class="task-detail__rows">
            <TagRow
              label="报名时间"
              :value="formatDateTime(participation.joinedAt)"
              mono
            />
          </Ledger>

          <FolioSection title="凭证记录">
            <UiEmptyState
              v-if="participation.submissions.length === 0"
              title="还没有提交凭证"
            />

            <div v-else class="task-detail__version-list">
              <article
                v-for="item in participation.submissions"
                :key="item.id"
                class="task-detail__version"
              >
                <header class="task-detail__version-head">
                  <p class="task-detail__version-no">
                    第 {{ item.version }} 次提交
                  </p>
                  <UiStatusChip :tone="submissionMeta(item).tone">
                    {{ submissionMeta(item).label }}
                  </UiStatusChip>
                </header>

                <p class="task-detail__time">
                  {{ formatDateTime(item.submittedAt) }}
                </p>

                <p v-if="item.note" class="task-detail__note">
                  {{ item.note }}
                </p>
                <p v-else class="task-detail__note task-detail__note--empty">
                  未填写说明
                </p>

                <ul v-if="item.imageFileIds.length" class="task-detail__images">
                  <li v-for="fileId in item.imageFileIds" :key="fileId">
                    <UiFigure :file-id="fileId" alt="任务凭证图片" />
                  </li>
                </ul>

                <p v-if="item.reviewReason" class="task-detail__reason">
                  审核意见：{{ item.reviewReason }}
                </p>

                <p v-if="item.reviewedAt" class="task-detail__time">
                  审核时间：{{ formatDateTime(item.reviewedAt) }}
                </p>
              </article>
            </div>
          </FolioSection>

          <p v-if="editable && !evidenceConfigured" class="task-detail__notice">
            该任务未配置凭证要求，暂时无法提交，请联系管理员。
          </p>

          <form
            v-if="editable && evidenceConfigured"
            class="task-detail__form"
            @submit.prevent="submit"
          >
            <FolioSection :title="submitLabel">
              <div class="task-detail__fields">
                <UiTextArea
                  id="task-evidence-note"
                  v-model="note"
                  :label="noteLabel"
                  hint="最多 500 字，是否必填以任务凭证要求为准。"
                  :maxlength="500"
                  :error="noteError"
                  :disabled="submitting"
                />

                <UiImagePicker
                  id="task-evidence-images"
                  v-model="imageIds"
                  :label="imageLabel"
                  hint="最多 3 张，单张不超过 5 MB，支持 JPG、PNG、WebP。"
                  :disabled="submitting"
                  @busy="uploading = $event"
                />

                <UiInlineError v-if="evidenceError" :message="evidenceError" />

                <div class="task-detail__actions">
                  <UiButton
                    type="submit"
                    :loading="submitting"
                    :disabled="uploading"
                  >
                    {{ submitLabel }}
                  </UiButton>
                  <p v-if="uploading" class="task-detail__time">
                    图片上传中，请稍候
                  </p>
                </div>
              </div>
            </FolioSection>
          </form>

          <UiAlert v-if="submitError" tone="error">
            <p class="task-detail__error">{{ submitError }}</p>
            <UiButton variant="secondary" @click="refresh()">
              刷新详情
            </UiButton>
          </UiAlert>
        </template>

        <template v-else>
          <div class="task-detail__actions">
            <UiButton v-if="joinable" :loading="joining" @click="join">
              参加任务
            </UiButton>
            <UiButton v-else-if="joinHint" disabled>
              {{ joinHint }}
            </UiButton>
          </div>
        </template>

        <UiAlert v-if="joinError" tone="error">
          <p class="task-detail__error">{{ joinError }}</p>
          <UiButton variant="secondary" @click="refresh()"> 刷新任务 </UiButton>
        </UiAlert>
      </FolioSection>
    </template>
  </section>
</template>

<style scoped>
.task-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.task-detail__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.task-detail__error {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.task-detail__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: var(--border-line);
}

.task-detail__hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.task-detail__details {
  margin: 0 0 var(--space-3);
  color: var(--color-subtle);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.task-detail__rows {
  display: flex;
  flex-direction: column;
}

.task-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.task-detail__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-detail__form {
  padding: var(--space-5);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
}

.task-detail__version-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-detail__version {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-paper);
}

.task-detail__version-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.task-detail__version-no {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.task-detail__time {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.task-detail__note {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
  overflow-wrap: anywhere;
}

.task-detail__note--empty {
  color: var(--color-subtle);
}

.task-detail__images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-detail__reason {
  margin: 0;
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border-left: 2px solid var(--color-blush);
  color: var(--color-blush);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.task-detail__notice {
  margin: 0;
  padding: var(--space-3);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-control);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}
</style>
