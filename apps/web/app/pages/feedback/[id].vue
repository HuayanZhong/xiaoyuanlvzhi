<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { ApiError } from "~/utils/api";
import { formatDateTime } from "~/utils/datetime";
import {
  closeFeedback,
  getFeedback,
  type FeedbackView,
} from "~/utils/feedback-api";
import {
  canCloseFeedback,
  feedbackStatusMeta,
  feedbackTypeLabel,
  relatedRecordLabel,
} from "~/utils/feedback-status";

const route = useRoute();
const feedbackId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData(
  () => `feedback:${feedbackId.value}`,
  async () => {
    try {
      return {
        feedback: await getFeedback(feedbackId.value),
        errorMessage: "",
        missing: false,
      };
    } catch (error) {
      const missing =
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404);

      return {
        feedback: null,
        errorMessage: missing ? "" : resolveRequestError(error),
        missing,
      };
    }
  },
  { watch: [feedbackId] },
);

const feedback = computed<FeedbackView | null>(
  () => data.value?.feedback ?? null,
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const missing = computed(() => data.value?.missing ?? false);
const loading = computed(() => loadStatus.value === "pending");
const statusMeta = computed(() =>
  feedbackStatusMeta(feedback.value?.status ?? ""),
);
const closable = computed(() =>
  feedback.value ? canCloseFeedback(feedback.value.status) : false,
);

const timeline = computed(() =>
  (feedback.value?.timeline ?? []).map((event) => ({
    title: feedbackStatusMeta(event.toStatus).label,
    time: event.createdAt,
    note: event.message,
  })),
);

const confirming = ref(false);
const closing = ref(false);
const actionError = ref("");

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function close() {
  const current = feedback.value;

  if (!current || closing.value) {
    return;
  }

  closing.value = true;
  actionError.value = "";

  try {
    await closeFeedback(current.id);
    confirming.value = false;
    await refresh();
  } catch (error) {
    actionError.value = resolveActionError(error);

    if (error instanceof ApiError && error.code === "FEEDBACK_STATUS_INVALID") {
      await refresh();
    }
  } finally {
    closing.value = false;
  }
}
</script>

<template>
  <section class="feedback-record">
    <UiPageHeader
      eyebrow="问题反馈"
      title="反馈详情"
      :subtitle="
        feedback
          ? `${feedbackTypeLabel(feedback.type)} · ${formatDateTime(feedback.createdAt)}`
          : '查看处理进度和管理员回复。'
      "
      :meta="feedback ? `编号 ${feedback.feedbackNo}` : undefined"
    >
      <template #meta>
        <NuxtLink to="/feedback" class="feedback-record__link">
          返回反馈列表
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="feedback-record__message">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="refresh()">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="missing || !feedback"
      title="无法查看这条反馈"
      description="反馈不存在，或不属于当前账号。"
    >
      <NuxtLink to="/feedback" class="feedback-record__link">
        返回反馈列表
      </NuxtLink>
    </UiEmptyState>

    <template v-else>
      <div class="feedback-record__summary">
        <UiStatusChip :tone="statusMeta.tone">{{
          statusMeta.label
        }}</UiStatusChip>
        <p class="feedback-record__hint">{{ statusMeta.hint }}</p>
      </div>

      <Ledger class="feedback-record__rows">
        <TagRow label="反馈编号" :value="feedback.feedbackNo" mono />
        <TagRow label="反馈类型" :value="feedbackTypeLabel(feedback.type)" />
        <TagRow
          label="关联记录"
          :value="relatedRecordLabel(feedback.relatedType, feedback.relatedId)"
        />
        <TagRow
          label="提交时间"
          :value="formatDateTime(feedback.createdAt)"
          mono
        />
        <TagRow
          v-if="feedback.handledAt"
          label="处理时间"
          :value="formatDateTime(feedback.handledAt)"
          mono
        />
      </Ledger>

      <FolioSection title="问题描述">
        <p class="feedback-record__text">{{ feedback.description }}</p>

        <ul v-if="feedback.imageFileIds.length" class="feedback-record__images">
          <li v-for="fileId in feedback.imageFileIds" :key="fileId">
            <UiFigure :file-id="fileId" alt="反馈图片" />
          </li>
        </ul>
      </FolioSection>

      <FolioSection v-if="feedback.adminReply" title="管理员回复">
        <p class="feedback-record__text">{{ feedback.adminReply }}</p>
      </FolioSection>

      <FolioSection title="处理记录">
        <UiTimeline :items="timeline" />
      </FolioSection>

      <UiAlert v-if="actionError" tone="error">
        <p class="feedback-record__message">{{ actionError }}</p>
        <UiButton variant="secondary" @click="refresh()">刷新状态</UiButton>
      </UiAlert>

      <div v-if="closable" class="feedback-record__actions">
        <p class="feedback-record__note">
          问题已解决？关闭后这条反馈不再接受处理。
        </p>
        <UiButton variant="danger" @click="confirming = true">
          关闭反馈
        </UiButton>
      </div>
    </template>

    <UiConfirmDialog
      :open="confirming"
      title="关闭反馈"
      message="关闭后不能再补充说明，确认问题已经解决？"
      confirm-text="确认关闭"
      :busy="closing"
      @confirm="close"
      @cancel="confirming = false"
    />
  </section>
</template>

<style scoped>
.feedback-record {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.feedback-record__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.feedback-record__message {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.feedback-record__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.feedback-record__hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.feedback-record__rows {
  display: flex;
  flex-direction: column;
}

.feedback-record__text {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.feedback-record__images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.feedback-record__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: var(--border-line);
}

.feedback-record__note {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}
</style>
