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
} = await usePageData("points", async () => {
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
      eyebrow="绿色积累"
      title="我的积分"
      subtitle="每一次养护和行动被确认后，都会在这里留下清楚的记录。"
      :meta="`${entries.length} 笔流水`"
    />

    <UiLoading v-if="loading && !data" />

    <template v-else>
      <section class="balance-band" data-cursor-hover>
        <div class="balance-band__label">
          <span>当前余额</span>
          <span>POINTS BALANCE</span>
        </div>

        <UiAlert v-if="balanceError" tone="error">
          <p class="points-page__error">{{ balanceError }}</p>
          <UiButton variant="secondary" @click="load">重试</UiButton>
        </UiAlert>

        <div v-else class="balance-band__body">
          <p class="balance-band__amount">
            {{ balanceLabel }}<small>分</small>
          </p>
          <p class="balance-band__note">
            来自养护打卡、环保行动与必要的管理员调整。积分可用于兑换真实奖励。
          </p>
        </div>

        <nav class="balance-band__links" aria-label="积分相关页面">
          <NuxtLink to="/rewards" class="balance-band__link">
            去逛奖励
            <span aria-hidden="true">↗</span>
          </NuxtLink>
          <NuxtLink to="/rewards/orders" class="balance-band__link">
            我的兑换
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </nav>
      </section>

      <div class="points-page__grid">
        <section class="ledger-panel">
          <header class="section-heading">
            <div>
              <p>RECENT ACTIVITY</p>
              <h2>积分流水</h2>
            </div>
            <span>{{ entries.length }} 笔</span>
          </header>

          <UiAlert v-if="ledgerError" tone="error">
            <p class="points-page__error">{{ ledgerError }}</p>
            <UiButton variant="secondary" @click="load">重试</UiButton>
          </UiAlert>

          <UiEmptyState
            v-else-if="entries.length === 0"
            title="还没有积分流水"
            description="养护打卡或环保行动审核通过后，这里会出现第一笔积分。"
          />

          <Ledger v-else class="points-list">
            <article
              v-for="entry in entries"
              :key="entry.id"
              class="points-entry"
            >
              <div class="points-entry__main">
                <p class="points-entry__source">
                  {{ pointSourceLabel(entry.sourceType) }}
                </p>
                <p class="points-entry__meta">
                  {{ formatDateTime(entry.createdAt) }}
                  <span>变动后余额 {{ entry.balanceAfter }} 分</span>
                </p>
              </div>
              <span
                class="points-entry__delta"
                :class="{
                  'points-entry__delta--minus': isDeduction(entry.deltaPoints),
                }"
              >
                {{ formatPointDelta(entry.deltaPoints) }}
              </span>
            </article>
          </Ledger>
        </section>

        <aside class="points-aside">
          <p class="points-aside__index">HOW IT WORKS</p>
          <h2>积分不是目标，<br />照料才是。</h2>
          <p>
            积分记录你的持续参与。完成一次真实的照料或环保行动后，审核通过才会发放。
          </p>
          <dl>
            <div>
              <dt>养护打卡</dt>
              <dd>按品种与规则发放</dd>
            </div>
            <div>
              <dt>环保行动</dt>
              <dd>按任务奖励发放</dd>
            </div>
            <div>
              <dt>奖励兑换</dt>
              <dd>兑换成功即扣减</dd>
            </div>
          </dl>
          <NuxtLink to="/tasks" class="points-aside__action">
            查看可参加的行动
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.points-page {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding-bottom: 2rem;
}

.points-page__error {
  margin: 0;
}

.balance-band {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem 4rem;
  overflow: hidden;
  min-height: 22rem;
  padding: 3rem;
  background: var(--color-deep-pine);
  border-radius: var(--radius-card);
  color: var(--color-on-deep-pine);
}

.balance-band__label {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-on-leaf) 18%, transparent);
  color: color-mix(in srgb, var(--color-on-leaf) 62%, transparent);
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.balance-band__body {
  align-self: end;
}

.balance-band__amount {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  margin: 0;
  font-family: var(--font-number);
  font-size: var(--font-size-balance);
  font-variant-numeric: tabular-nums;
  line-height: 0.9;
}

.balance-band__amount small {
  margin-bottom: 0.7rem;
  color: var(--color-citron);
  font-family: var(--font-sans);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.balance-band__note {
  max-width: 34rem;
  margin: 1.25rem 0 0;
  color: color-mix(in srgb, var(--color-on-leaf) 70%, transparent);
  font-size: var(--font-size-small);
}

.balance-band__links {
  display: flex;
  flex-direction: column;
  align-self: end;
  border-top: 1px solid
    color-mix(in srgb, var(--color-on-leaf) 18%, transparent);
}

.balance-band__link {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-on-deep-pine) 18%, transparent);
  color: var(--color-on-deep-pine);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
}

.balance-band__link span {
  transition: transform var(--motion-hover);
}

.balance-band__link:hover span {
  transform: translate(3px, -3px);
}

.points-page__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
}

.ledger-panel {
  grid-column: span 8;
  padding: 2rem;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  padding-bottom: 1.25rem;
  border-bottom: var(--border-line);
}

.section-heading p,
.section-heading h2 {
  margin: 0;
}

.section-heading p,
.section-heading > span {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.section-heading h2 {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  line-height: 1.2;
}

.points-list {
  margin-top: 0.5rem;
}

.points-entry {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 5.5rem;
  padding: 1.25rem 0;
  border-bottom: var(--border-line);
}

.points-entry__source {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--font-size-body);
  font-weight: 600;
}

.points-entry__meta {
  display: flex;
  gap: 0.75rem;
  margin: 0.4rem 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.points-entry__delta {
  flex: none;
  min-width: 3.5rem;
  padding: 0.3rem 0.5rem;
  background: var(--color-leaf-wash);
  border-radius: var(--radius-sticker);
  color: var(--color-leaf);
  font-family: var(--font-number);
  font-size: var(--font-size-body);
  text-align: center;
}

.points-entry__delta--minus {
  background: var(--color-clay-wash);
  color: var(--color-clay);
}

.points-aside {
  grid-column: span 4;
  align-self: start;
  padding: 2rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-card);
}

.points-aside__index {
  margin: 0 0 1.25rem;
  color: var(--color-leaf);
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.12em;
}

.points-aside h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-subheading);
  font-weight: 600;
  line-height: 1.25;
}

.points-aside > p:not(.points-aside__index) {
  margin: 1rem 0 1.5rem;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.points-aside dl {
  margin: 0;
  border-top: var(--border-line);
}

.points-aside dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: var(--border-line);
}

.points-aside dt,
.points-aside dd {
  margin: 0;
  font-size: var(--font-size-small);
}

.points-aside dt {
  color: var(--color-ink);
  font-weight: 600;
}

.points-aside dd {
  color: var(--color-subtle);
  text-align: right;
}

.points-aside__action {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  margin-top: 1.5rem;
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
}
</style>
