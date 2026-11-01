<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import {
  buildSpeciesQuery,
  listSpecies,
  type PlantSpecies,
} from "~/utils/plant-api";
import { difficultyLabel, speciesCode } from "~/utils/plant-display";

const route = useRoute();

const queryKeyword = computed(() => readQuery(route.query.keyword));
const queryLocation = computed(() => readQuery(route.query.location));

const keyword = ref(queryKeyword.value);
const location = ref(queryLocation.value);

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData(
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

const speciesList = computed<PlantSpecies[]>(() => data.value?.species ?? []);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");
const hasFilters = computed(() =>
  Boolean(queryKeyword.value || queryLocation.value),
);

watch(queryKeyword, (value) => {
  keyword.value = value;
});
watch(queryLocation, (value) => {
  location.value = value;
});

function readQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function applyFilters() {
  void navigateTo(
    {
      path: "/plants",
      query: buildSpeciesQuery(keyword.value, location.value),
    },
    { replace: true },
  );
}

function clearFilters() {
  keyword.value = "";
  location.value = "";
  void navigateTo({ path: "/plants", query: {} }, { replace: true });
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="plants-page">
    <UiPageHeader
      eyebrow="品种目录 · SPECIES CATALOG"
      title="绿植"
      subtitle="浏览当前可领养的品种，提交申请后由管理员安排线下交接。"
    >
      <template #meta>
        <NuxtLink to="/adoptions" class="plants-page__mine">我的申请</NuxtLink>
      </template>
    </UiPageHeader>

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

    <ul v-else class="plants-page__grid">
      <li v-for="species in speciesList" :key="species.id">
        <NuxtLink :to="`/plants/${species.id}`" class="plants-page__plate">
          <UiFigure
            :file-id="species.coverFileId"
            :alt="`${species.name}封面`"
            :caption="speciesCode(species.id)"
          />

          <div class="plants-page__body">
            <h2 class="plants-page__name">{{ species.name }}</h2>
            <dl class="plants-page__facts">
              <div>
                <dt>难度</dt>
                <dd>{{ difficultyLabel(species.difficulty) }}</dd>
              </div>
              <div>
                <dt>可领养</dt>
                <dd class="plants-page__count">
                  {{ species.availableCount }}<span>PL</span>
                </dd>
              </div>
            </dl>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.plants-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.plants-page__mine,
.plants-page__home-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.plants-page__filters {
  display: grid;
  gap: var(--space-4);
  align-items: end;
  padding-bottom: var(--space-5);
  border-bottom: var(--border-hairline);
}

.plants-page__filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.plants-page__error {
  margin: 0 0 var(--space-3);
}

.plants-page__grid {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.plants-page__plate {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  color: var(--color-ink);
  text-decoration: none;
}

.plants-page__plate:hover .plants-page__name {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.plants-page__name {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.25;
}

.plants-page__facts {
  display: flex;
  gap: var(--space-5);
  margin: var(--space-3) 0 0;
  padding-top: var(--space-3);
  border-top: var(--border-hairline);
}

.plants-page__facts div {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
}

.plants-page__facts dt {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.plants-page__facts dd {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.plants-page__count {
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.plants-page__count span {
  margin-left: var(--space-1);
  color: var(--color-seal);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

@media (min-width: 48rem) {
  .plants-page__filters {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  }

  .plants-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 64rem) {
  .plants-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
