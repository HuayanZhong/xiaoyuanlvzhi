<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  createFeedback,
  listFeedback,
  type FeedbackView,
} from "~/utils/feedback-api";
import {
  FEEDBACK_TYPE_OPTIONS,
  RELATED_TYPE_OPTIONS,
  feedbackStatusMeta,
  feedbackTypeLabel,
  relatedRecordLabel,
} from "~/utils/feedback-status";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("feedback", async () => {
  try {
    return { items: await listFeedback(), errorMessage: "" };
  } catch (error) {
    return {
      items: [] as FeedbackView[],
      errorMessage: resolveRequestError(error),
    };
  }
});

const items = computed<FeedbackView[]>(() => data.value?.items ?? []);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

const formOpen = ref(false);
const formKey = ref(0);
const type = ref("");
const description = ref("");
const relatedType = ref("");
const relatedId = ref("");
const imageIds = ref<number[]>([]);
const uploading = ref(false);
const submitting = ref(false);
const attempted = ref(false);
const submitError = ref("");
const created = ref<FeedbackView | null>(null);

const typeError = computed(() =>
  attempted.value && !type.value ? "请选择反馈类型" : "",
);

const descriptionError = computed(() => {
  const length = description.value.trim().length;

  if (length > 500) {
    return "问题描述最多 500 字";
  }

  return attempted.value && length < 5 ? "问题描述至少 5 个字" : "";
});

const relatedError = computed(() => {
  if (!attempted.value) {
    return "";
  }

  const hasType = Boolean(relatedType.value);
  const hasId = Boolean(relatedId.value.trim());

  return hasType === hasId ? "" : "关联类型和编号需要同时填写或同时留空";
});

watch([type, description, relatedType, relatedId], () => {
  submitError.value = "";
});

function toggleForm() {
  if (submitting.value) {
    return;
  }

  formOpen.value = !formOpen.value;
  attempted.value = false;
  submitError.value = "";
}

function statusMeta(item: FeedbackView) {
  return feedbackStatusMeta(item.status);
}

function load() {
  return refresh();
}

async function submit() {
  attempted.value = true;
  submitError.value = "";

  if (
    submitting.value ||
    uploading.value ||
    typeError.value ||
    descriptionError.value ||
    relatedError.value
  ) {
    return;
  }

  submitting.value = true;

  try {
    const result = await createFeedback({
      type: type.value,
      description: description.value.trim(),
      ...(relatedType.value && relatedId.value.trim()
        ? { relatedType: relatedType.value, relatedId: relatedId.value.trim() }
        : {}),
      ...(imageIds.value.length ? { imageFileIds: imageIds.value } : {}),
    });

    created.value = result;
    applyCreated(result);
    resetForm();
    formOpen.value = false;
  } catch (error) {
    submitError.value = resolveActionError(error);
  } finally {
    submitting.value = false;
  }
}

function applyCreated(result: FeedbackView) {
  const current = data.value;
  const existing = current?.items ?? [];

  data.value = {
    items: [result, ...existing.filter((item) => item.id !== result.id)],
    errorMessage: "",
  };
}

function resetForm() {
  type.value = "";
  description.value = "";
  relatedType.value = "";
  relatedId.value = "";
  imageIds.value = [];
  attempted.value = false;
  formKey.value += 1;
}
</script>

<template>
  <section class="feedback-page">
    <UiPageHeader
      eyebrow="问题反馈 · FEEDBACK"
      title="问题反馈"
      subtitle="提交绿植、账号或奖励问题，管理员回复会显示在这里。"
      :meta="`${items.length} 条反馈`"
    >
      <template #meta>
        <UiButton variant="secondary" @click="toggleForm">
          {{ formOpen ? "收起表单" : "提交反馈" }}
        </UiButton>
      </template>
    </UiPageHeader>

    <UiAlert v-if="created" tone="success">
      <p class="feedback-page__message">
        反馈已提交：{{ created.feedbackNo }} · 待处理
      </p>
      <NuxtLink :to="`/feedback/${created.id}`" class="feedback-page__link">
        查看反馈
      </NuxtLink>
    </UiAlert>

    <form v-if="formOpen" class="feedback-page__form" @submit.prevent="submit">
      <h2 class="feedback-page__heading">提交反馈</h2>

      <UiField
        v-slot="{ errorId, hintId }"
        label="反馈类型"
        control-id="feedback-type"
        :error="typeError"
        hint="必填。"
      >
        <select
          id="feedback-type"
          v-model="type"
          class="ui-control"
          :disabled="submitting"
          :aria-invalid="typeError ? 'true' : undefined"
          :aria-describedby="typeError ? errorId : hintId"
        >
          <option value="">请选择反馈类型</option>
          <option
            v-for="option in FEEDBACK_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </UiField>

      <UiTextArea
        id="feedback-description"
        v-model="description"
        label="问题描述"
        hint="5–500 字，说明遇到的问题和处理期望。"
        :maxlength="500"
        :error="descriptionError"
        :disabled="submitting"
      />

      <div class="feedback-page__group">
        <p class="feedback-page__group-label">关联记录（选填）</p>

        <div class="feedback-page__related">
          <UiField label="业务类型" control-id="feedback-related-type">
            <select
              id="feedback-related-type"
              v-model="relatedType"
              class="ui-control"
              :disabled="submitting"
            >
              <option value="">不关联</option>
              <option
                v-for="option in RELATED_TYPE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </UiField>

          <UiTextInput
            id="feedback-related-id"
            v-model="relatedId"
            label="编号"
            hint="如申请编号、打卡编号或订单号。"
            :maxlength="64"
            :disabled="submitting"
          />
        </div>

        <UiInlineError v-if="relatedError" :message="relatedError" />
      </div>

      <UiImagePicker
        :key="formKey"
        id="feedback-images"
        v-model="imageIds"
        label="问题照片（选填）"
        hint="最多 3 张，单张不超过 5 MB，支持 JPG、PNG、WebP。"
        :disabled="submitting"
        @busy="uploading = $event"
      />

      <UiAlert v-if="submitError" tone="error">
        <p class="feedback-page__message">{{ submitError }}</p>
      </UiAlert>

      <div class="feedback-page__actions">
        <UiButton type="submit" :loading="submitting" :disabled="uploading">
          提交反馈
        </UiButton>
        <p v-if="uploading" class="feedback-page__note">图片上传中，请稍候</p>
      </div>
    </form>

    <UiLoading v-if="loading && !data" />

    <template v-else>
      <UiAlert v-if="errorMessage" tone="error">
        <p class="feedback-page__message">{{ errorMessage }}</p>
        <UiButton variant="secondary" @click="load">重试</UiButton>
      </UiAlert>

      <UiEmptyState
        v-if="!errorMessage && items.length === 0"
        title="还没有提交过反馈"
        description="遇到绿植、账号或奖励问题时，可以在这里提交给管理员。"
      >
        <UiButton @click="toggleForm">提交反馈</UiButton>
      </UiEmptyState>

      <ul v-else-if="items.length" class="feedback-page__list">
        <li v-for="item in items" :key="item.id">
          <NuxtLink :to="`/feedback/${item.id}`" class="feedback-page__item">
            <span class="feedback-page__head">
              <span class="feedback-page__no">{{ item.feedbackNo }}</span>
              <Stamp :tone="statusMeta(item).tone">
                {{ statusMeta(item).label }}
              </Stamp>
            </span>

            <span class="feedback-page__meta">
              {{ feedbackTypeLabel(item.type) }}
              <template v-if="item.relatedType">
                · {{ relatedRecordLabel(item.relatedType, item.relatedId) }}
              </template>
            </span>

            <span class="feedback-page__description">
              {{ item.description }}
            </span>

            <span class="feedback-page__foot">
              <span>{{ formatDateTime(item.createdAt) }}</span>
              <span>{{ item.timeline.length }} 条处理记录</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.feedback-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.feedback-page__message {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.feedback-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.feedback-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: var(--border-ink);
}

.feedback-page__heading {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-card);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
}

.feedback-page__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feedback-page__group-label {
  margin: 0;
  padding-top: var(--space-3);
  border-top: var(--border-hairline);
  color: var(--color-graphite);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-label);
}

.feedback-page__related {
  display: grid;
  gap: var(--space-3);
}

.feedback-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.feedback-page__note {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.feedback-page__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-top: var(--border-ink);
  list-style: none;
}

.feedback-page__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: var(--touch-target);
  padding: var(--space-4) 0;
  border-bottom: var(--border-hairline);
  color: inherit;
  text-decoration: none;
}

.feedback-page__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.feedback-page__no {
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  letter-spacing: var(--tracking-code);
}

.feedback-page__meta {
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.feedback-page__description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-ink);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.feedback-page__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  justify-content: space-between;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}

@media (min-width: 48rem) {
  .feedback-page__related {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
