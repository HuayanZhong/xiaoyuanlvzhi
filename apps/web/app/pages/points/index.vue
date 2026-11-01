<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  getPointsBalance,
  listPointLedger,
  type PointLedgerEntry,
} from "~/utils/point-api";
import { formatPointDelta, pointSourceLabel } from "~/utils/point-source";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("points", async () => {
  const [balanceResult, ledgerResult] = await Promise.allSettled([
    getPointsBalance(),
    listPointLedger(),
  ]);

  return {
    balance: balanceResult.status === "fulfilled" ? balanceResult.value : null,
    balanceError:
      balanceResult.status === "rejected"
        ? resolveRequestError(balanceResult.reason)
        : "",
    entries: ledgerResult.status === "fulfilled" ? ledgerResult.value : [],
    ledgerError:
      ledgerResult.status === "rejected"
        ? resolveRequestError(ledgerResult.reason)
        : "",
  };
});

const balance = computed(() => data.value?.balance ?? null);
const balanceError = computed(() => data.value?.balanceError ?? "");
const entries = computed<PointLedgerEntry[]>(() => data.value?.entries ?? []);
const ledgerError = computed(() => data.value?.ledgerError ?? "");
const loading = computed(() => loadStatus.value === "pending");

const balanceLabel = computed(() =>
  balance.value === null ? "—" : String(balance.value),
);

function isDeduction(deltaPoints: number): boolean {
  return deltaPoints < 0;
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="points-page">
    <UiPageHeader
      eyebrow="积分档案 · POINTS FILE"
      title="积分"
      subtitle="每一笔积分都对应一次审核通过或兑换扣减，可按流水核对。"
      :meta="`${entries.length} 笔流水`"
    />

    <UiLoading v-if="loading && !data" />

    <template v-else>
      <FolioSection index="01" title="当前余额" meta="BALANCE">
        <UiAlert v-if="balanceError" tone="error">
          <p class="points-page__error">{{ balanceError }}</p>
          <UiButton variant="secondary" @click="load">重试</UiButton>
        </UiAlert>

        <div v-else class="points-page__balance">
          <p class="points-page__amount">
            {{ balanceLabel }}<span class="points-page__unit">PT</span>
          </p>
          <p class="points-page__note">
            积分来源包括养护打卡、环保任务与管理员调整。
          </p>
        </div>

        <nav class="points-page__links" aria-label="积分相关页面">
          <NuxtLink to="/rewards" class="points-page__link">奖励商城</NuxtLink>
          <NuxtLink to="/rewards/orders" class="points-page__link">
            我的订单
          </NuxtLink>
        </nav>
      </FolioSection>

      <FolioSection index="02" title="积分流水" meta="LEDGER">
        <UiAlert v-if="ledgerError" tone="error">
          <p class="points-page__error">{{ ledgerError }}</p>
          <UiButton variant="secondary" @click="load">重试</UiButton>
        </UiAlert>

        <UiEmptyState
          v-else-if="entries.length === 0"
          title="还没有积分流水"
          description="养护打卡或环保任务审核通过后，这里会出现第一笔积分。"
        />

        <ul v-else class="points-page__list">
          <li
            v-for="entry in entries"
            :key="entry.id"
            class="points-page__entry"
          >
            <div class="points-page__entry-head">
              <p class="points-page__source">
                {{ pointSourceLabel(entry.sourceType) }}
              </p>
              <span
                class="points-page__delta"
                :class="{
                  'points-page__delta--minus': isDeduction(entry.deltaPoints),
                }"
              >
                {{ formatPointDelta(entry.deltaPoints) }}
              </span>
            </div>

            <p class="points-page__meta">
              {{ formatDateTime(entry.createdAt) }}
              <template v-if="entry.sourceId">
                · 记录 {{ entry.sourceId }}
              </template>
            </p>

            <p class="points-page__after">
              变动后余额 {{ entry.balanceAfter }} PT
            </p>
          </li>
        </ul>
      </FolioSection>
    </template>
  </section>
</template>

<style scoped>
.points-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.points-page__error {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.points-page__balance {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.points-page__amount {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 3rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-mono);
  line-height: 1;
}

.points-page__unit {
  color: var(--color-subtle);
  font-size: var(--font-size-sm);
  letter-spacing: var(--tracking-code);
}

.points-page__note {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.points-page__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-5);
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: var(--border-hairline);
}

.points-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.points-page__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.points-page__entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) 0;
  border-bottom: var(--border-hairline);
}

.points-page__entry:last-child {
  border-bottom: 0;
}

.points-page__entry-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: baseline;
  justify-content: space-between;
}

.points-page__source {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.125rem;
  letter-spacing: var(--tracking-title-cn);
  overflow-wrap: anywhere;
}

.points-page__delta {
  flex: none;
  color: var(--color-status-alive);
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-mono);
}

.points-page__delta--minus {
  color: var(--color-seal-deep);
}

.points-page__meta {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-mono);
  overflow-wrap: anywhere;
}

.points-page__after {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}
</style>
