<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { listEligiblePlants, type CareEligiblePlant } from "~/utils/care-api";
import { formatDate, formatDateTime } from "~/utils/datetime";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("my-plants", async () => {
  try {
    return { plants: await listEligiblePlants(), errorMessage: "" };
  } catch (error) {
    return { plants: [], errorMessage: resolveRequestError(error) };
  }
});

const plants = computed<CareEligiblePlant[]>(() => data.value?.plants ?? []);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

function hintFor(plant: CareEligiblePlant): string {
  if (plant.pendingCheckinId) {
    return "已有待审核打卡";
  }

  return plant.blockedReason || "现在可以打卡";
}

function stampTone(plant: CareEligiblePlant) {
  if (plant.pendingCheckinId) {
    return "pending" as const;
  }

  return plant.eligible ? ("alive" as const) : ("neutral" as const);
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="my-plants-page">
    <UiPageHeader
      eyebrow="在养绿植 · MY PLANTS"
      title="我的绿植"
      subtitle="养护打卡按品种的养护间隔开放，审核通过后按积分规则发放积分。"
    >
      <template #meta>
        <NuxtLink to="/adoptions" class="my-plants-page__link">
          我的申请
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="my-plants-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="plants.length === 0"
      title="暂无在养绿植"
      description="领养申请通过并完成线下交接后，植株会出现在这里。"
    >
      <NuxtLink to="/plants" class="my-plants-page__link">
        浏览品种目录
      </NuxtLink>
    </UiEmptyState>

    <ul v-else class="my-plants-page__list">
      <li
        v-for="plant in plants"
        :key="plant.plantId"
        class="my-plants-page__card"
      >
        <div class="my-plants-page__head">
          <p class="my-plants-page__code">{{ plant.plantCode }}</p>
          <h2 class="my-plants-page__name">{{ plant.plantName }}</h2>
          <p class="my-plants-page__hint">{{ hintFor(plant) }}</p>
        </div>

        <div class="my-plants-page__rows">
          <TagRow label="摆放位置" :value="plant.location || '未填写'" />
          <TagRow
            label="养护间隔"
            :value="`${plant.careIntervalDays} 天`"
            mono
          />
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

        <div class="my-plants-page__foot">
          <Stamp :tone="stampTone(plant)">{{ hintFor(plant) }}</Stamp>

          <NuxtLink
            v-if="plant.pendingCheckinId"
            :to="`/care/${plant.pendingCheckinId}`"
            class="my-plants-page__action"
          >
            查看打卡
          </NuxtLink>

          <NuxtLink
            v-else-if="plant.eligible"
            :to="`/my-plants/${plant.plantId}`"
            class="my-plants-page__action"
          >
            提交养护打卡
          </NuxtLink>

          <p v-else class="my-plants-page__wait">
            {{ formatDate(plant.nextEligibleAt) }} 后可打卡
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.my-plants-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.my-plants-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.my-plants-page__error {
  margin: 0 0 var(--space-3);
}

.my-plants-page__list {
  display: grid;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.my-plants-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-top: var(--border-ink);
  border-bottom: var(--border-hairline);
}

.my-plants-page__head {
  min-width: 0;
}

.my-plants-page__code {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.my-plants-page__name {
  margin: var(--space-2) 0 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.3;
}

.my-plants-page__hint {
  margin: var(--space-2) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.my-plants-page__rows {
  display: flex;
  flex-direction: column;
}

.my-plants-page__foot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.my-plants-page__action {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.my-plants-page__wait {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}
</style>
