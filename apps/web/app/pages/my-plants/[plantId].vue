<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { ApiError } from "~/utils/api";
import {
  listCheckins,
  listEligiblePlants,
  submitCheckin,
  type CareCheckin,
  type CareEligiblePlant,
} from "~/utils/care-api";
import { resolveCareError } from "~/utils/care-errors";
import { canCare, careStatusMeta } from "~/utils/care-status";
import { formatDateTime } from "~/utils/datetime";

const CONFLICT_CODES = new Set([
  "CARE_INTERVAL_NOT_REACHED",
  "CARE_CHECKIN_DUPLICATE",
  "CARE_NOT_ACTIVE",
]);

const route = useRoute();
const plantId = computed(() => readId(route.params.plantId));

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData(
  () => `plant-care:${plantId.value}`,
  async () => {
    try {
      const [plants, checkins] = await Promise.all([
        listEligiblePlants(),
        listCheckins(),
      ]);

      return { plants, checkins, errorMessage: "" };
    } catch (error) {
      return {
        plants: [] as CareEligiblePlant[],
        checkins: [] as CareCheckin[],
        errorMessage: resolveRequestError(error),
      };
    }
  },
  { watch: [plantId] },
);

const plant = computed<CareEligiblePlant | null>(
  () =>
    data.value?.plants.find((item) => item.plantId === plantId.value) ?? null,
);
const history = computed<CareCheckin[]>(() =>
  (data.value?.checkins ?? []).filter((item) => item.plantId === plantId.value),
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");
const available = computed(() => (plant.value ? canCare(plant.value) : false));

const note = ref("");
const imageIds = ref<number[]>([]);
const uploading = ref(false);
const submitting = ref(false);
const attempted = ref(false);
const submitError = ref("");

const noteError = computed(() => {
  if (note.value.length > 300) {
    return "说明最多 300 字";
  }

  return "";
});

const evidenceError = computed(() => {
  if (!attempted.value) {
    return "";
  }

  return note.value.trim() || imageIds.value.length > 0
    ? ""
    : "请至少填写打卡说明或上传一张凭证图片";
});

const blockedHint = computed(() => {
  const current = plant.value;

  if (!current) {
    return "";
  }

  if (current.pendingCheckinId) {
    return "已有待审核打卡，审核完成前不能重复提交";
  }

  return current.blockedReason || "当前不可打卡";
});

watch(note, () => {
  submitError.value = "";
});

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function statusMeta(item: CareCheckin) {
  return careStatusMeta(item.status);
}

async function submit() {
  attempted.value = true;
  submitError.value = "";

  if (
    !plant.value ||
    !available.value ||
    submitting.value ||
    uploading.value ||
    noteError.value ||
    evidenceError.value
  ) {
    return;
  }

  submitting.value = true;

  try {
    const created = await submitCheckin({
      plantId: plant.value.plantId,
      ...(note.value.trim() ? { note: note.value.trim() } : {}),
      ...(imageIds.value.length ? { imageFileIds: imageIds.value } : {}),
    });

    await navigateTo(`/care/${created.id}`);
  } catch (error) {
    submitError.value = resolveCareError(error);

    if (error instanceof ApiError && CONFLICT_CODES.has(error.code)) {
      await refresh();
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="plant-care-page">
    <UiPageHeader
      eyebrow="植株养护 · CARE"
      :title="plant?.plantName || '植株养护'"
      :subtitle="plant ? plant.plantCode : '查看本株养护信息和打卡记录。'"
    >
      <template #meta>
        <NuxtLink to="/my-plants" class="plant-care-page__link">
          返回我的绿植
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="plant-care-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="refresh()">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="!plant"
      title="当前不可养护"
      description="这株绿植不在养护中，或不属于当前账号。"
    >
      <NuxtLink to="/my-plants" class="plant-care-page__link">
        返回我的绿植
      </NuxtLink>
    </UiEmptyState>

    <template v-else>
      <div class="plant-care-page__rows">
        <TagRow label="摆放位置" :value="plant.location || '未填写'" />
        <TagRow label="养护间隔" :value="`${plant.careIntervalDays} 天`" mono />
        <TagRow
          label="上次通过"
          :value="formatDateTime(plant.lastApprovedAt)"
          mono
        />
        <TagRow
          label="下次可打卡"
          :value="formatDateTime(plant.nextEligibleAt)"
          mono
        />
      </div>

      <UiAlert v-if="!available" tone="info">
        <p class="plant-care-page__error">{{ blockedHint }}</p>
        <NuxtLink
          v-if="plant.pendingCheckinId"
          :to="`/care/${plant.pendingCheckinId}`"
          class="plant-care-page__link"
        >
          查看待审核打卡
        </NuxtLink>
      </UiAlert>

      <form v-else class="plant-care-page__form" @submit.prevent="submit">
        <h2 class="plant-care-page__heading">提交养护打卡</h2>

        <UiTextArea
          id="care-note"
          v-model="note"
          label="打卡说明（选填）"
          hint="最多 300 字；与凭证图片至少提供一项。"
          :maxlength="300"
          :error="noteError"
          :disabled="submitting"
        />

        <UiImagePicker
          id="care-images"
          v-model="imageIds"
          label="凭证图片（选填）"
          hint="最多 3 张，单张不超过 5 MB，支持 JPG、PNG、WebP。"
          :disabled="submitting"
          @busy="uploading = $event"
        />

        <UiInlineError v-if="evidenceError" :message="evidenceError" />

        <UiAlert v-if="submitError" tone="error">
          <p class="plant-care-page__error">{{ submitError }}</p>
        </UiAlert>

        <div class="plant-care-page__actions">
          <UiButton type="submit" :loading="submitting" :disabled="uploading">
            提交打卡
          </UiButton>
          <p v-if="uploading" class="plant-care-page__note">
            图片上传中，请稍候
          </p>
        </div>
      </form>

      <section class="plant-care-page__history">
        <h2 class="plant-care-page__heading">本株打卡</h2>

        <p v-if="history.length === 0" class="plant-care-page__empty">
          暂无打卡记录。
        </p>

        <ul v-else class="plant-care-page__list">
          <li v-for="item in history" :key="item.id">
            <NuxtLink :to="`/care/${item.id}`" class="plant-care-page__row">
              <span class="plant-care-page__no">{{ item.checkinNo }}</span>
              <span class="plant-care-page__date">
                {{ formatDateTime(item.createdAt) }}
              </span>
              <Stamp :tone="statusMeta(item).tone">
                {{ statusMeta(item).label }}
              </Stamp>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped>
.plant-care-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.plant-care-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.plant-care-page__error {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.plant-care-page__rows {
  display: flex;
  flex-direction: column;
}

.plant-care-page__form,
.plant-care-page__history {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: var(--border-ink);
}

.plant-care-page__heading {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
}

.plant-care-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.plant-care-page__note {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.plant-care-page__empty {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-sm);
}

.plant-care-page__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.plant-care-page__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target);
  padding: var(--space-3) 0;
  border-bottom: var(--border-hairline);
  color: var(--color-ink);
  text-decoration: none;
}

.plant-care-page__row:hover .plant-care-page__no {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.plant-care-page__no {
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.plant-care-page__date {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}
</style>
