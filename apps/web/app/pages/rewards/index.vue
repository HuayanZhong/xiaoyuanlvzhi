<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import { getPointsBalance } from "~/utils/point-api";
import {
  listRewards,
  redeemReward,
  type RedemptionOrder,
  type Reward,
} from "~/utils/reward-api";
import { clearRewardCaches } from "~/utils/reward-cache";
import { canRedeem } from "~/utils/reward-status";

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData("rewards", async () => {
  const [rewardsResult, balanceResult] = await Promise.allSettled([
    listRewards(),
    getPointsBalance(),
  ]);

  return {
    rewards: rewardsResult.status === "fulfilled" ? rewardsResult.value : [],
    rewardsError:
      rewardsResult.status === "rejected"
        ? resolveRequestError(rewardsResult.reason)
        : "",
    balance: balanceResult.status === "fulfilled" ? balanceResult.value : null,
    balanceError:
      balanceResult.status === "rejected"
        ? resolveRequestError(balanceResult.reason)
        : "",
  };
});

const rewards = computed<Reward[]>(() => data.value?.rewards ?? []);
const rewardsError = computed(() => data.value?.rewardsError ?? "");
const balance = computed(() => data.value?.balance ?? null);
const balanceError = computed(() => data.value?.balanceError ?? "");
const loading = computed(() => loadStatus.value === "pending");

const selected = ref<Reward | null>(null);
const redeeming = ref(false);
const redeemError = ref("");
const lastOrder = ref<RedemptionOrder | null>(null);

const balanceLabel = computed(() =>
  balance.value === null ? "—" : String(balance.value),
);

const afterBalance = computed(() => {
  const current = selected.value;

  return current && balance.value !== null
    ? balance.value - current.pointsCost
    : null;
});

const afterBalanceLabel = computed(() =>
  afterBalance.value === null ? "—" : `${afterBalance.value} PT`,
);

function check(reward: Reward) {
  return canRedeem(reward, balance.value);
}

function coverId(reward: Reward): number | null {
  return reward.imageFileIds[0] ?? null;
}

function openConfirm(reward: Reward) {
  redeemError.value = "";

  if (check(reward).allowed) {
    selected.value = reward;
  }
}

function closeConfirm() {
  if (redeeming.value) {
    return;
  }

  selected.value = null;
}

async function confirmRedeem() {
  const current = selected.value;

  if (!current || redeeming.value) {
    return;
  }

  redeeming.value = true;
  redeemError.value = "";

  try {
    lastOrder.value = await redeemReward(current.id);
    selected.value = null;
    clearRewardCaches();
    await refresh();
  } catch (error) {
    redeemError.value = resolveActionError(error);
    selected.value = null;
    clearRewardCaches();
    await refresh();
  } finally {
    redeeming.value = false;
  }
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="rewards-page">
    <UiPageHeader
      eyebrow="奖励兑换 · REWARDS"
      title="奖励商城"
      subtitle="用积分兑换校园奖励，兑换后到领取地点线下领取。"
      :meta="`${rewards.length} 件奖励`"
    >
      <template #meta>
        <NuxtLink to="/rewards/orders" class="rewards-page__link">
          我的订单
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <template v-else>
      <div class="rewards-page__balance">
        <p class="rewards-page__balance-label">当前积分</p>
        <p class="rewards-page__balance-value">
          {{ balanceLabel }}<span class="rewards-page__unit">PT</span>
        </p>
        <UiAlert v-if="balanceError" tone="error">
          <p class="rewards-page__error">{{ balanceError }}</p>
          <UiButton variant="secondary" @click="load">重试</UiButton>
        </UiAlert>
      </div>

      <UiAlert v-if="lastOrder" tone="success">
        <p class="rewards-page__error">
          兑换成功：订单 {{ lastOrder.orderNo }}，请于
          {{ formatDateTime(lastOrder.pickupDeadline) }}
          前到 {{ lastOrder.location }} 领取。
        </p>
        <NuxtLink
          :to="`/rewards/orders/${lastOrder.id}`"
          class="rewards-page__link"
        >
          查看订单
        </NuxtLink>
      </UiAlert>

      <UiAlert v-if="redeemError" tone="error">
        <p class="rewards-page__error">{{ redeemError }}</p>
        <UiButton variant="secondary" @click="load">刷新商城</UiButton>
      </UiAlert>

      <UiAlert v-if="rewardsError" tone="error">
        <p class="rewards-page__error">{{ rewardsError }}</p>
        <UiButton variant="secondary" @click="load">重试</UiButton>
      </UiAlert>

      <UiEmptyState
        v-else-if="rewards.length === 0"
        title="暂时没有可兑换奖励"
        description="管理员上架奖励后，这里会显示可兑换的校园纪念品。"
      />

      <ul v-else class="rewards-page__list">
        <li
          v-for="reward in rewards"
          :key="reward.id"
          class="rewards-page__card"
        >
          <UiFigure
            v-if="coverId(reward)"
            class="rewards-page__cover"
            ratio="wide"
            :file-id="coverId(reward)"
            :alt="`${reward.name}图片`"
          />

          <div class="rewards-page__body">
            <h2 class="rewards-page__title">{{ reward.name }}</h2>

            <div class="rewards-page__rows">
              <TagRow
                label="所需积分"
                :value="`${reward.pointsCost} PT`"
                mono
              />
              <TagRow
                label="剩余数量"
                :value="`${reward.remainingStock} 件`"
                mono
              />
              <TagRow label="领取地点" :value="reward.location" />
            </div>

            <p v-if="reward.description" class="rewards-page__description">
              {{ reward.description }}
            </p>

            <div class="rewards-page__actions">
              <UiButton
                v-if="check(reward).allowed"
                @click="openConfirm(reward)"
              >
                兑换
              </UiButton>
              <UiButton v-else disabled>{{ check(reward).label }}</UiButton>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <UiConfirmDialog
      :open="Boolean(selected)"
      title="确认兑换"
      message="确认后立即扣除积分并占用库存；待领取订单可以在领取前取消。"
      confirm-text="确认兑换"
      :busy="redeeming"
      @confirm="confirmRedeem"
      @cancel="closeConfirm"
    >
      <div v-if="selected" class="rewards-page__confirm">
        <TagRow label="奖励" :value="selected.name" />
        <TagRow label="扣除积分" :value="`${selected.pointsCost} PT`" mono />
        <TagRow label="兑换后余额" :value="afterBalanceLabel" mono />
        <TagRow label="领取地点" :value="selected.location" />
        <TagRow label="领取期限" :value="`${selected.pickupDays} 天`" mono />
      </div>
    </UiConfirmDialog>
  </section>
</template>

<style scoped>
.rewards-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.rewards-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rewards-page__balance {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  align-items: baseline;
  padding: var(--space-4) 0;
  border-top: var(--border-ink);
  border-bottom: var(--border-hairline);
}

.rewards-page__balance-label {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.rewards-page__balance-value {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-mono);
  line-height: 1;
}

.rewards-page__unit {
  color: var(--color-subtle);
  font-size: var(--font-size-sm);
}

.rewards-page__error {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.rewards-page__list {
  display: grid;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.rewards-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-top: var(--border-ink);
  border-bottom: var(--border-hairline);
}

.rewards-page__cover {
  width: 100%;
}

.rewards-page__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}

.rewards-page__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.rewards-page__rows {
  display: flex;
  flex-direction: column;
}

.rewards-page__description {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  overflow-wrap: anywhere;
}

.rewards-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.rewards-page__confirm {
  display: flex;
  flex-direction: column;
}

@media (min-width: 48rem) {
  .rewards-page__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rewards-page__card {
    align-items: start;
  }
}

@media (min-width: 64rem) {
  .rewards-page__list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
