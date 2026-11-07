<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import {
  createApplication,
  listApplications,
  type AdoptionApplication,
} from "~/utils/adoption-api";
import { getSpecies, type PlantSpecies } from "~/utils/plant-api";
import { difficultyLabel, speciesCode } from "~/utils/plant-display";
import { fallbackPlantImage } from "~/utils/plant-media";

const route = useRoute();
const speciesId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData(
  () => `plant-detail:${speciesId.value}`,
  async () => {
    try {
      const [species, applications] = await Promise.all([
        getSpecies(speciesId.value),
        listApplications(),
      ]);

      return { species, applications, errorMessage: "" };
    } catch (error) {
      return {
        species: null,
        applications: [] as AdoptionApplication[],
        errorMessage: resolveRequestError(error),
      };
    }
  },
  { watch: [speciesId] },
);

const species = computed<PlantSpecies | null>(
  () => data.value?.species ?? null,
);
const applications = computed<AdoptionApplication[]>(
  () => data.value?.applications ?? [],
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

const pendingApplication = computed(() =>
  applications.value.find(
    (item) =>
      item.speciesId === species.value?.id && item.status === "PENDING_REVIEW",
  ),
);

const canApply = computed(
  () => (species.value?.availableCount ?? 0) > 0 && !pendingApplication.value,
);

const details = computed(() => {
  const current = species.value;

  if (!current) {
    return [];
  }

  return [
    { label: "养护难度", value: difficultyLabel(current.difficulty) },
    { label: "光照", value: current.lightDescription || "未填写" },
    { label: "浇水", value: current.waterDescription || "未填写" },
    {
      label: "养护间隔",
      value: current.careIntervalDays
        ? `${current.careIntervalDays} 天`
        : "未填写",
      mono: true,
    },
    {
      label: "打卡积分",
      value: `${current.carePoints ?? 0} 分`,
      mono: true,
    },
    { label: "其他说明", value: current.otherDescription || "未填写" },
  ];
});

const confirming = ref(false);
const note = ref("");
const submitting = ref(false);
const submitError = ref("");

const noteError = computed(() =>
  note.value.length > 200 ? "备注最多 200 字" : "",
);

watch(note, () => {
  submitError.value = "";
});

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function startApplication() {
  note.value = "";
  submitError.value = "";
  confirming.value = true;
}

async function submitApplication() {
  const current = species.value;

  if (!current || submitting.value || noteError.value) {
    return;
  }

  submitting.value = true;
  submitError.value = "";

  try {
    const application = await createApplication({
      speciesId: current.id,
      note: note.value,
    });

    await navigateTo(`/adoptions/${application.id}`);
  } catch (error) {
    submitError.value = resolveRequestError(error);
  } finally {
    submitting.value = false;
  }
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="plant-detail">
    <UiPageHeader
      eyebrow="品种详情"
      :title="species?.name ?? '品种详情'"
      :subtitle="species ? '查看养护说明后提交领养申请。' : undefined"
      :meta="species ? `编号 ${speciesCode(species.id)}` : undefined"
    />

    <UiLoading v-if="loading && !data" />

    <template v-else-if="species">
      <div class="plant-detail__sheet">
        <UiFigure
          :file-id="species.coverFileId"
          :fallback-src="fallbackPlantImage(species.name, species.id)"
          :alt="`${species.name}封面`"
          ratio="wide"
          priority
          :caption="`编号 ${speciesCode(species.id)}`"
        />

        <div class="plant-detail__body">
          <FolioSection title="养护说明">
            <Ledger>
              <TagRow
                v-for="row in details"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :mono="row.mono"
              />
            </Ledger>
          </FolioSection>

          <FolioSection title="可领养数量">
            <p class="plant-detail__stock">
              {{ species.availableCount }}<span>株</span>
            </p>
            <p class="plant-detail__note">
              管理员确认申请后会通知线下领取方式，学生不选择具体单株。
            </p>
          </FolioSection>

          <div class="plant-detail__actions">
            <NuxtLink
              v-if="pendingApplication"
              :to="`/adoptions/${pendingApplication.id}`"
              class="plant-detail__action-link"
            >
              查看申请
            </NuxtLink>

            <UiButton
              v-else-if="canApply"
              variant="primary"
              @click="startApplication"
            >
              申请领养
            </UiButton>

            <UiButton v-else disabled>暂无可领养植株</UiButton>

            <NuxtLink to="/plants" class="plant-detail__back"
              >返回目录</NuxtLink
            >
          </div>

          <section
            v-if="confirming"
            class="plant-detail__confirm"
            aria-label="确认领养申请"
          >
            <h2 class="plant-detail__confirm-title">确认申请</h2>
            <p class="plant-detail__confirm-row">
              <span>申请品种</span>
              <strong>{{ species.name }}</strong>
            </p>
            <p class="plant-detail__confirm-row">
              <span>领取说明</span>
              <strong>审核通过后按管理员通知的时间地点领取</strong>
            </p>

            <UiTextArea
              id="adoption-note"
              v-model="note"
              label="申请备注"
              :maxlength="200"
              hint="可选，最多 200 字"
              :error="noteError"
            />

            <UiAlert v-if="submitError" tone="error">{{ submitError }}</UiAlert>

            <div class="plant-detail__confirm-actions">
              <UiButton :loading="submitting" @click="submitApplication">
                提交申请
              </UiButton>
              <UiButton variant="ghost" @click="confirming = false">
                取消
              </UiButton>
            </div>
          </section>
        </div>
      </div>
    </template>

    <UiEmptyState
      v-else
      title="无法查看该品种"
      :description="errorMessage || '品种不存在或已经下架。'"
    >
      <div class="plant-detail__actions">
        <UiButton variant="secondary" @click="load">重试</UiButton>
        <NuxtLink to="/plants" class="plant-detail__back">返回目录</NuxtLink>
      </div>
    </UiEmptyState>
  </section>
</template>

<style scoped>
.plant-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.plant-detail__sheet {
  display: grid;
  gap: var(--space-6);
  align-items: start;
}

.plant-detail__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.plant-detail__stock {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-variant-numeric: tabular-nums;
  font-size: var(--font-size-reading);
  line-height: var(--line-height-display);
}

.plant-detail__stock span {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.plant-detail__note {
  margin: var(--space-3) 0 0;
  padding-top: var(--space-3);
  border-top: var(--border-line);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.plant-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-top: var(--space-4);
  border-top: var(--border-line);
}

.plant-detail__action-link,
.plant-detail__back {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.plant-detail__confirm {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
}

.plant-detail__confirm-title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-display);
}

.plant-detail__confirm-row {
  display: flex;
  gap: var(--space-4);
  align-items: baseline;
  justify-content: space-between;
  margin: 0;
  padding-bottom: var(--space-2);
  border-bottom: var(--border-line);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.plant-detail__confirm-row strong {
  color: var(--color-ink);
  font-weight: var(--font-weight-regular);
  text-align: right;
}

.plant-detail__confirm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (min-width: 48rem) {
  .plant-detail__sheet {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-8);
  }
}
</style>
