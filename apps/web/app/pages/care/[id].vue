<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { ApiError } from "~/utils/api";
import {
  getCheckin,
  resubmitCheckin,
  type CareCheckin,
  type CareSubmission,
} from "~/utils/care-api";
import { resolveActionError } from "~/utils/action-errors";
import { canResubmit, careStatusMeta } from "~/utils/care-status";
import { formatDateTime } from "~/utils/datetime";

const route = useRoute();
const checkinId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData(
  () => `care-checkin:${checkinId.value}`,
  async () => {
    try {
      return {
        checkin: await getCheckin(checkinId.value),
        errorMessage: "",
        missing: false,
      };
    } catch (error) {
      const missing =
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404);

      return {
        checkin: null,
        errorMessage: missing ? "" : resolveRequestError(error),
        missing,
      };
    }
  },
  { watch: [checkinId] },
);

const checkin = computed<CareCheckin | null>(() => data.value?.checkin ?? null);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const missing = computed(() => data.value?.missing ?? false);
const loading = computed(() => loadStatus.value === "pending");
const statusMeta = computed(() => careStatusMeta(checkin.value?.status ?? ""));
const resubmittable = computed(() =>
  checkin.value ? canResubmit(checkin.value.status) : false,
);

const note = ref("");
const imageIds = ref<number[]>([]);
const uploading = ref(false);
const submitting = ref(false);
const attempted = ref(false);
const submitError = ref("");

const noteError = computed(() =>
  note.value.length > 300 ? "说明最多 300 字" : "",
);

const evidenceError = computed(() => {
  if (!attempted.value) {
    return "";
  }

  return note.value.trim() || imageIds.value.length > 0
    ? ""
    : "请至少填写打卡说明或上传一张凭证图片";
});

watch(note, () => {
  submitError.value = "";
});

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function submissionMeta(item: CareSubmission) {
  return careStatusMeta(item.status);
}

async function submit() {
  attempted.value = true;
  submitError.value = "";

  if (
    !checkin.value ||
    !resubmittable.value ||
    submitting.value ||
    uploading.value ||
    noteError.value ||
    evidenceError.value
  ) {
    return;
  }

  submitting.value = true;

  try {
    await resubmitCheckin(checkin.value.id, {
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
</script>

<template>
  <section class="checkin-page">
    <UiPageHeader
      eyebrow="养护打卡 · CARE RECORD"
      :title="checkin?.checkinNo || '打卡详情'"
      :subtitle="
        checkin
          ? `${checkin.plantName} · ${checkin.location || '位置未填写'}`
          : '查看凭证版本和审核结果。'
      "
    >
      <template #meta>
        <NuxtLink to="/my-plants" class="checkin-page__link">
          返回我的绿植
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="checkin-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="refresh()">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="missing || !checkin"
      title="无法查看这条打卡"
      description="记录不存在，或不属于当前账号。"
    >
      <NuxtLink to="/my-plants" class="checkin-page__link">
        返回我的绿植
      </NuxtLink>
    </UiEmptyState>

    <template v-else>
      <div class="checkin-page__summary">
        <Stamp :tone="statusMeta.tone">{{ statusMeta.label }}</Stamp>
        <p class="checkin-page__hint">{{ statusMeta.hint }}</p>
      </div>

      <div class="checkin-page__rows">
        <TagRow label="植株" :value="checkin.plantName" />
        <TagRow label="摆放位置" :value="checkin.location || '未填写'" />
        <TagRow
          label="提交时间"
          :value="formatDateTime(checkin.createdAt)"
          mono
        />
        <TagRow
          label="最新版本"
          :value="`第 ${checkin.latestVersion} 次提交`"
          mono
        />
      </div>

      <section class="checkin-page__versions">
        <h2 class="checkin-page__heading">凭证版本</h2>

        <article
          v-for="item in checkin.submissions"
          :key="item.id"
          class="checkin-page__version"
        >
          <header class="checkin-page__version-head">
            <p class="checkin-page__version-no">第 {{ item.version }} 次提交</p>
            <Stamp :tone="submissionMeta(item).tone">
              {{ submissionMeta(item).label }}
            </Stamp>
          </header>

          <p class="checkin-page__time">
            {{ formatDateTime(item.submittedAt) }}
          </p>

          <p v-if="item.note" class="checkin-page__note">{{ item.note }}</p>
          <p v-else class="checkin-page__note checkin-page__note--empty">
            未填写说明
          </p>

          <ul v-if="item.imageFileIds.length" class="checkin-page__images">
            <li v-for="fileId in item.imageFileIds" :key="fileId">
              <UiFigure :file-id="fileId" alt="打卡凭证图片" />
            </li>
          </ul>

          <p v-if="item.reviewReason" class="checkin-page__reason">
            审核意见：{{ item.reviewReason }}
          </p>

          <p v-if="item.reviewedAt" class="checkin-page__time">
            审核时间：{{ formatDateTime(item.reviewedAt) }}
          </p>
        </article>
      </section>

      <form
        v-if="resubmittable"
        class="checkin-page__form"
        @submit.prevent="submit"
      >
        <h2 class="checkin-page__heading">重新提交</h2>

        <UiTextArea
          id="care-resubmit-note"
          v-model="note"
          label="补充说明（选填）"
          hint="最多 300 字；与凭证图片至少提供一项。"
          :maxlength="300"
          :error="noteError"
          :disabled="submitting"
        />

        <UiImagePicker
          id="care-resubmit-images"
          v-model="imageIds"
          label="凭证图片（选填）"
          hint="最多 3 张，单张不超过 5 MB，支持 JPG、PNG、WebP。"
          :disabled="submitting"
          @busy="uploading = $event"
        />

        <UiInlineError v-if="evidenceError" :message="evidenceError" />

        <UiAlert v-if="submitError" tone="error">
          <p class="checkin-page__error">{{ submitError }}</p>
          <UiButton variant="secondary" @click="refresh()"> 刷新详情 </UiButton>
        </UiAlert>

        <div class="checkin-page__actions">
          <UiButton type="submit" :loading="submitting" :disabled="uploading">
            重新提交
          </UiButton>
          <p v-if="uploading" class="checkin-page__time">图片上传中，请稍候</p>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.checkin-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.checkin-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.checkin-page__error {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.checkin-page__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: var(--border-ink);
}

.checkin-page__hint {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.checkin-page__rows {
  display: flex;
  flex-direction: column;
}

.checkin-page__versions,
.checkin-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.checkin-page__heading {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
}

.checkin-page__version {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-top: var(--border-hairline);
}

.checkin-page__version-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.checkin-page__version-no {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.checkin-page__time {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}

.checkin-page__note {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  overflow-wrap: anywhere;
}

.checkin-page__note--empty,
.checkin-page__time {
  color: var(--color-subtle);
}

.checkin-page__images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.checkin-page__reason {
  margin: 0;
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border-left: 2px solid var(--color-seal-deep);
  color: var(--color-seal-deep);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.checkin-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}
</style>
