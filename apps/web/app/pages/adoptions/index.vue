<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import {
  listApplications,
  type AdoptionApplication,
} from "~/utils/adoption-api";
import { adoptionStatusMeta } from "~/utils/adoption-status";
import { formatDateTime } from "~/utils/datetime";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("adoptions-list", async () => {
  try {
    return { applications: await listApplications(), errorMessage: "" };
  } catch (error) {
    return { applications: [], errorMessage: resolveRequestError(error) };
  }
});

const applications = computed<AdoptionApplication[]>(() =>
  // oxlint-disable-next-line unicorn/no-array-sort -- 先复制再排序，不修改接口返回的数组
  [...(data.value?.applications ?? [])].sort((left, right) =>
    (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""),
  ),
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

function statusMeta(item: AdoptionApplication) {
  return adoptionStatusMeta(item.status);
}

function latestHint(item: AdoptionApplication): string {
  return (
    item.reviewReason?.trim() ||
    item.returnReason?.trim() ||
    statusMeta(item).hint
  );
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="adoptions-page">
    <UiPageHeader
      eyebrow="领养申请 · APPLICATIONS"
      title="我的申请"
      subtitle="按更新时间排列，审核结果和驳回原因都会记录在这里。"
    >
      <template #meta>
        <NuxtLink to="/plants" class="adoptions-page__browse"
          >去看品种</NuxtLink
        >
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="adoptions-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="applications.length === 0"
      title="暂无领养申请"
      description="浏览可领养品种后提交申请，审核进度会显示在这里。"
    >
      <NuxtLink to="/plants" class="adoptions-page__browse">
        浏览品种目录
      </NuxtLink>
    </UiEmptyState>

    <ul v-else class="adoptions-page__list">
      <li v-for="item in applications" :key="item.id">
        <NuxtLink :to="`/adoptions/${item.id}`" class="adoptions-page__row">
          <div class="adoptions-page__main">
            <p class="adoptions-page__no">{{ item.applicationNo }}</p>
            <h2 class="adoptions-page__species">{{ item.speciesName }}</h2>
            <p class="adoptions-page__hint">{{ latestHint(item) }}</p>
          </div>

          <div class="adoptions-page__side">
            <Stamp :tone="statusMeta(item).tone">
              {{ statusMeta(item).label }}
            </Stamp>
            <p class="adoptions-page__date">
              {{ formatDateTime(item.updatedAt) }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.adoptions-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.adoptions-page__browse {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.adoptions-page__error {
  margin: 0 0 var(--space-3);
}

.adoptions-page__list {
  margin: 0;
  padding: 0;
  border-top: var(--border-ink);
  list-style: none;
}

.adoptions-page__row {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-4) 0;
  border-bottom: var(--border-hairline);
  color: var(--color-ink);
  text-decoration: none;
}

.adoptions-page__row:hover .adoptions-page__species {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.adoptions-page__main {
  min-width: 0;
}

.adoptions-page__no {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.adoptions-page__species {
  margin: var(--space-2) 0 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.3;
}

.adoptions-page__hint {
  margin: var(--space-2) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.adoptions-page__side {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: var(--space-2);
  align-items: flex-end;
}

.adoptions-page__date {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
}

@media (max-width: 47.99rem) {
  .adoptions-page__row {
    flex-direction: column;
  }

  .adoptions-page__side {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
