<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import {
  buildSpeciesQuery,
  listSpecies,
  type PlantSpecies,
} from "~/utils/plant-api";
import { difficultyLabel, speciesCode } from "~/utils/plant-display";
import { fallbackPlantImage } from "~/utils/plant-media";

const route = useRoute();

const queryKeyword = computed(() => readQuery(route.query.keyword));
const queryLocation = computed(() => readQuery(route.query.location));
const queryDifficulty = computed(() => readDifficulty(route.query.difficulty));
const queryAvailable = computed(() => readQuery(route.query.available) === "1");

const keyword = ref(queryKeyword.value);
const location = ref(queryLocation.value);
const difficulty = ref(queryDifficulty.value);
const availableOnly = ref(queryAvailable.value);

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData(
  "plants-catalog",
  async () => {
    try {
      return {
        species: await listSpecies({
          keyword: queryKeyword.value,
          location: queryLocation.value,
        }),
        errorMessage: "",
      };
    } catch (error) {
      return { species: [], errorMessage: resolveRequestError(error) };
    }
  },
  { watch: [queryKeyword, queryLocation] },
);

const rawSpeciesList = computed<PlantSpecies[]>(
  () => data.value?.species ?? [],
);
const speciesList = computed<PlantSpecies[]>(() =>
  rawSpeciesList.value.filter((species) => {
    if (difficulty.value && species.difficulty !== difficulty.value) {
      return false;
    }

    return !availableOnly.value || species.availableCount > 0;
  }),
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");
const hasFilters = computed(() =>
  Boolean(
    queryKeyword.value ||
    queryLocation.value ||
    queryDifficulty.value ||
    queryAvailable.value,
  ),
);
const totalAvailable = computed(() =>
  rawSpeciesList.value.reduce(
    (total, species) => total + species.availableCount,
    0,
  ),
);
const easyCount = computed(
  () =>
    rawSpeciesList.value.filter((species) => species.difficulty === "EASY")
      .length,
);
const fastestInterval = computed(() => {
  const intervals = rawSpeciesList.value
    .map((species) => species.careIntervalDays)
    .filter((value): value is number => value !== null && value > 0);

  return intervals.length > 0 ? Math.min(...intervals) : null;
});
const difficultyOptions = [
  { value: "", label: "全部" },
  { value: "EASY", label: "容易" },
  { value: "MEDIUM", label: "适中" },
  { value: "HARD", label: "挑战" },
] as const;

function difficultyCount(value: string): number {
  return value
    ? rawSpeciesList.value.filter((species) => species.difficulty === value)
        .length
    : rawSpeciesList.value.length;
}

const gallerySize = computed(() => {
  const count = speciesList.value.length;

  if (count <= 2) {
    return "two";
  }

  if (count === 3) {
    return "three";
  }

  if (count === 4) {
    return "four";
  }

  return "dense";
});

watch(queryKeyword, (value) => {
  keyword.value = value;
});
watch(queryLocation, (value) => {
  location.value = value;
});
watch(queryDifficulty, (value) => {
  difficulty.value = value;
});
watch(queryAvailable, (value) => {
  availableOnly.value = value;
});

function readQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readDifficulty(value: unknown): string {
  const current = readQuery(value).toUpperCase();

  return ["EASY", "MEDIUM", "HARD"].includes(current) ? current : "";
}

function applyFilters() {
  const query = buildSpeciesQuery(keyword.value, location.value);

  if (difficulty.value) {
    query.difficulty = difficulty.value;
  }

  if (availableOnly.value) {
    query.available = "1";
  }

  void navigateTo(
    {
      path: "/plants",
      query,
    },
    { replace: true },
  );
}

function clearFilters() {
  keyword.value = "";
  location.value = "";
  difficulty.value = "";
  availableOnly.value = false;
  void navigateTo({ path: "/plants", query: {} }, { replace: true });
}

function setDifficulty(value: string) {
  difficulty.value = value;
  applyFilters();
}

function toggleAvailableOnly() {
  availableOnly.value = !availableOnly.value;
  applyFilters();
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="plants-page">
    <UiPageHeader
      eyebrow="品种目录"
      title="发现一株"
      subtitle="从适合你生活节奏的植物开始。提交领养后，我们会安排线下交接。"
    >
      <template #meta>
        <p v-if="data" class="plants-page__meta-count">
          {{ rawSpeciesList.length }} 个品种 · {{ totalAvailable }} 株可领养
        </p>
        <NuxtLink to="/adoptions" class="plants-page__mine">我的申请</NuxtLink>
      </template>
    </UiPageHeader>

    <section
      v-if="!loading && !errorMessage"
      class="plants-page__summary"
      aria-label="图鉴概览"
    >
      <div>
        <span>CATALOG</span>
        <strong>{{ rawSpeciesList.length }}</strong>
        <small>个在册品种</small>
      </div>
      <div>
        <span>AVAILABLE</span>
        <strong>{{ totalAvailable }}</strong>
        <small>株可进入领养</small>
      </div>
      <div>
        <span>BEGINNER</span>
        <strong>{{ easyCount }}</strong>
        <small>个新手友好品种</small>
      </div>
      <div>
        <span>RHYTHM</span>
        <strong>{{ fastestInterval ?? "—" }}</strong>
        <small>{{
          fastestInterval ? "天的最短照料间隔" : "暂无周期数据"
        }}</small>
      </div>
    </section>

    <form class="plants-page__filters" @submit.prevent="applyFilters">
      <UiTextInput
        id="plants-keyword"
        v-model="keyword"
        label="品种关键词"
        placeholder="例如：绿萝"
      />
      <UiTextInput
        id="plants-location"
        v-model="location"
        label="摆放位置"
        placeholder="例如：图书馆"
      />
      <div class="plants-page__filter-actions">
        <UiButton type="submit">筛选</UiButton>
        <UiButton
          v-if="hasFilters || keyword || location"
          variant="ghost"
          @click="clearFilters"
        >
          清空筛选
        </UiButton>
      </div>

      <div class="plants-page__quick-filters">
        <div class="plants-page__difficulty">
          <span>养护难度</span>
          <div role="group" aria-label="按养护难度筛选">
            <button
              v-for="option in difficultyOptions"
              :key="option.value"
              type="button"
              class="plants-page__filter-chip"
              :class="{ 'is-active': difficulty === option.value }"
              :aria-pressed="difficulty === option.value"
              @click="setDifficulty(option.value)"
            >
              {{ option.label }}
              <small>{{ difficultyCount(option.value) }}</small>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="plants-page__stock-toggle"
          :class="{ 'is-active': availableOnly }"
          :aria-pressed="availableOnly"
          @click="toggleAvailableOnly"
        >
          <span aria-hidden="true" />
          仅看有库存
        </button>
      </div>
    </form>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="plants-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="speciesList.length === 0 && hasFilters"
      title="没有符合条件的品种"
      description="换一个关键词或位置，或者清空筛选查看全部。"
    >
      <UiButton variant="secondary" @click="clearFilters">清空筛选</UiButton>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="speciesList.length === 0"
      title="暂无可领养品种"
      description="管理员上架并分配可领养植株后，这里会显示品种。"
    >
      <NuxtLink to="/" class="plants-page__home-link">返回首页</NuxtLink>
    </UiEmptyState>

    <div v-else class="plants-page__collection">
      <div class="plants-page__collection-head">
        <p class="plants-page__collection-title">可领养图鉴</p>
        <p class="plants-page__collection-count">
          {{ speciesList.length }} 个品种
        </p>
      </div>

      <ul
        class="plants-page__grid"
        :class="`plants-page__grid--${gallerySize}`"
      >
        <li
          v-for="species in speciesList"
          :key="species.id"
          class="plants-page__item"
        >
          <NuxtLink
            :to="`/plants/${species.id}`"
            class="plants-page__plate"
            data-cursor-hover
          >
            <div class="plants-page__visual">
              <UiFigure
                :file-id="species.coverFileId"
                :fallback-src="fallbackPlantImage(species.name, species.id)"
                :alt="`${species.name}封面`"
                :caption="`编号 ${speciesCode(species.id)}`"
                :priority="species.id === speciesList[0]?.id"
                flat
              />
              <span
                class="plants-page__availability"
                :class="{
                  'plants-page__availability--empty':
                    species.availableCount === 0,
                }"
              >
                {{ species.availableCount > 0 ? "可领养" : "暂满" }}
              </span>
            </div>

            <div class="plants-page__body">
              <h2 class="plants-page__name">{{ species.name }}</h2>
              <div class="plants-page__care">
                <span>{{ species.lightDescription || "光照待补充" }}</span>
                <span>{{ species.waterDescription || "浇水待补充" }}</span>
                <span v-if="species.careIntervalDays">
                  每 {{ species.careIntervalDays }} 天
                </span>
                <span v-if="species.carePoints !== null">
                  照料 +{{ species.carePoints }} 分
                </span>
              </div>
              <p v-if="species.otherDescription" class="plants-page__note">
                {{ species.otherDescription }}
              </p>
              <dl class="plants-page__facts">
                <div>
                  <dt>难度</dt>
                  <dd>{{ difficultyLabel(species.difficulty) }}</dd>
                </div>
                <div>
                  <dt>可领养</dt>
                  <dd class="plants-page__count">
                    {{ species.availableCount }} 株
                  </dd>
                </div>
              </dl>
              <span class="plants-page__open">查看完整档案 →</span>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <section class="plants-page__guide">
        <header>
          <p>BEFORE ADOPTION</p>
          <h2>领养前，先确认这三件事</h2>
        </header>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>摆放位置稳定</strong>
              <p>确认日常停留的位置有合适光照，也方便持续照料。</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>能按周期打卡</strong>
              <p>记录植物状态并上传清晰凭证，审核通过后获得积分。</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>可以完成交接</strong>
              <p>申请通过后按通知中的时间和地点领取植株并建立档案。</p>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>

<style scoped>
.plants-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding-bottom: 2rem;
}

.plants-page__mine,
.plants-page__home-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.plants-page__meta-count {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: 0.04em;
}

.plants-page__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: var(--border-line);
  border-bottom: var(--border-line);
}

.plants-page__summary > div {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.2rem var(--space-3);
  align-items: end;
  min-height: 7rem;
  padding: 1.25rem 1.5rem;
}

.plants-page__summary > div + div {
  border-left: var(--border-line);
}

.plants-page__summary span {
  grid-column: 1 / -1;
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-journal);
}

.plants-page__summary strong {
  color: var(--color-ink);
  font-family: var(--font-number);
  font-size: var(--font-size-number-large);
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

.plants-page__summary small {
  max-width: 11rem;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  line-height: 1.45;
}

.plants-page__filters {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 1.5rem;
  align-items: end;
  padding: 0 0 1.5rem;
  background: transparent;
  border: 0;
  border-bottom: var(--border-line);
  box-shadow: none;
}

.plants-page__filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.plants-page__quick-filters {
  display: flex;
  grid-column: 1 / -1;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: var(--border-line);
}

.plants-page__difficulty {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.plants-page__difficulty > span {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
}

.plants-page__difficulty > div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.plants-page__filter-chip,
.plants-page__stock-toggle {
  min-height: 2.25rem;
  padding: 0 var(--space-3);
  background: transparent;
  border: var(--border-line);
  border-radius: var(--radius-chip);
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    color var(--motion-color),
    transform var(--motion-press);
}

.plants-page__filter-chip {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.plants-page__filter-chip small {
  color: inherit;
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
}

.plants-page__filter-chip:hover,
.plants-page__stock-toggle:hover {
  border-color: var(--color-leaf);
  color: var(--color-leaf);
}

.plants-page__filter-chip.is-active,
.plants-page__stock-toggle.is-active {
  background: var(--color-deep-pine);
  border-color: var(--color-deep-pine);
  color: var(--color-on-deep-pine);
}

.plants-page__filter-chip:active,
.plants-page__stock-toggle:active {
  transform: scale(0.97);
}

.plants-page__stock-toggle {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
}

.plants-page__stock-toggle > span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--color-line-strong);
  border-radius: 50%;
}

.plants-page__stock-toggle.is-active > span {
  background: var(--color-citron);
}

.plants-page__error {
  margin: 0 0 var(--space-3);
}

.plants-page__collection {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.plants-page__collection-head {
  display: flex;
  gap: var(--space-4);
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: var(--space-3);
  border-bottom: var(--border-line);
}

.plants-page__collection-title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-title);
}

.plants-page__collection-count {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.plants-page__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-flow: dense;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.plants-page__item {
  min-width: 0;
}

.plants-page__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.plants-page__grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.plants-page__grid--four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.plants-page__plate {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  overflow: hidden;
  color: var(--color-ink);
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: none;
  text-decoration: none;
  transition:
    border-color var(--motion-color),
    box-shadow var(--motion-color),
    transform var(--motion-color);
}

.plants-page__plate:hover {
  border-color: var(--color-line-strong);
  box-shadow: var(--shadow-panel);
  transform: translateY(-2px);
}

.plants-page__plate:hover .plants-page__name {
  color: var(--color-leaf);
}

.plants-page__plate:hover :deep(.ui-figure__image) {
  transform: scale(1.035);
}

.plants-page__visual {
  position: relative;
  padding: 0;
}

.plants-page__visual :deep(.ui-figure__frame) {
  aspect-ratio: 4 / 3;
  border: 0;
  border-radius: 0;
}

.plants-page__availability {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  padding: 0.25rem var(--space-2);
  background: var(--color-deep-pine);
  border-radius: var(--radius-chip);
  color: var(--color-on-deep-pine);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
}

.plants-page__availability--empty {
  background: var(--color-surface);
  border: var(--border-line);
  color: var(--color-subtle);
}

.plants-page__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--space-2);
  padding: var(--space-3);
}

.plants-page__name {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-item);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
  transition: color var(--motion-color);
}

.plants-page__care {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.plants-page__care span {
  padding: 0.18rem 0.4rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sticker);
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
}

.plants-page__note {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.plants-page__facts {
  display: flex;
  gap: var(--space-3);
  margin: 0;
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: var(--border-line);
}

.plants-page__facts div {
  display: flex;
  gap: 0.35rem;
  align-items: baseline;
}

.plants-page__facts dt {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.plants-page__facts dd {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.plants-page__count {
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.plants-page__open {
  color: var(--color-leaf);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
}

.plants-page__guide {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  padding-top: 2rem;
  border-top: var(--border-line);
}

.plants-page__guide header {
  grid-column: span 4;
}

.plants-page__guide header p {
  margin: 0;
  color: var(--color-leaf);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-journal);
}

.plants-page__guide h2 {
  max-width: 12ch;
  margin: 0.75rem 0 0;
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-display);
  line-height: 1.18;
}

.plants-page__guide ol {
  display: grid;
  grid-column: span 8;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.plants-page__guide li {
  display: flex;
  gap: 0.75rem;
  min-width: 0;
  padding: 0 1.25rem;
}

.plants-page__guide li + li {
  border-left: var(--border-line);
}

.plants-page__guide li > span {
  color: var(--color-leaf);
  font-family: var(--font-number);
  font-size: var(--font-size-small);
}

.plants-page__guide li div {
  min-width: 0;
}

.plants-page__guide strong {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-item);
  font-weight: var(--font-weight-display);
}

.plants-page__guide li p {
  margin: 0.55rem 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: 1.7;
}
</style>
