<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  cancelOrder,
  listOrders,
  type RedemptionOrder,
} from "~/utils/reward-api";
import { clearRewardCaches } from "~/utils/reward-cache";
import { canCancelOrder, orderStatusMeta } from "~/utils/reward-status";

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData("rewards-orders", async () => {
  try {
    return { orders: await listOrders(), errorMessage: "" };
  } catch (error) {
    return {
      orders: [] as RedemptionOrder[],
      errorMessage: resolveRequestError(error),
    };
  }
});

const orders = computed<RedemptionOrder[]>(() => data.value?.orders ?? []);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");

const pending = ref<RedemptionOrder | null>(null);
const cancelling = ref(false);
const cancelError = ref("");

function openCancel(current: RedemptionOrder) {
  cancelError.value = "";

  if (canCancelOrder(current.status)) {
    pending.value = current;
  }
}

function closeCancel() {
  if (cancelling.value) {
    return;
  }

  pending.value = null;
}

async function confirmCancel() {
  const current = pending.value;

  if (!current || cancelling.value) {
    return;
  }

  cancelling.value = true;
  cancelError.value = "";

  try {
    await cancelOrder(current.id);
    pending.value = null;
    clearRewardCaches();
    await refresh();
  } catch (error) {
    cancelError.value = resolveActionError(error);
    pending.value = null;
    clearRewardCaches();
    await refresh();
  } finally {
    cancelling.value = false;
  }
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="orders-page">
    <UiPageHeader
      eyebrow="兑换订单"
      title="我的订单"
      subtitle="待领取订单可以取消，取消后积分退回、库存释放。"
      :meta="`${orders.length} 笔订单`"
    >
      <template #meta>
        <NuxtLink to="/rewards" class="orders-page__link">奖励商城</NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="orders-page__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <UiAlert v-if="cancelError" tone="error">
      <p class="orders-page__error">{{ cancelError }}</p>
      <UiButton variant="secondary" @click="load">刷新订单</UiButton>
    </UiAlert>

    <UiEmptyState
      v-if="!loading && !errorMessage && orders.length === 0"
      title="还没有兑换订单"
      description="兑换奖励后，订单和领取截止时间会显示在这里。"
    >
      <NuxtLink to="/rewards" class="orders-page__link">去奖励商城</NuxtLink>
    </UiEmptyState>

    <ul v-else-if="!errorMessage" class="orders-page__list">
      <li v-for="item in orders" :key="item.id" class="orders-page__card">
        <div class="orders-page__head">
          <NuxtLink :to="`/rewards/orders/${item.id}`" class="orders-page__no">
            编号 {{ item.orderNo }}
          </NuxtLink>
          <UiStatusChip :tone="orderStatusMeta(item.status).tone">
            {{ orderStatusMeta(item.status).label }}
          </UiStatusChip>
        </div>

        <p class="orders-page__reward">{{ item.rewardName }}</p>

        <Ledger class="orders-page__rows">
          <TagRow label="消耗积分" :value="`${item.pointsCost} 分`" mono />
          <TagRow
            label="下单时间"
            :value="formatDateTime(item.createdAt)"
            mono
          />
          <TagRow label="领取地点" :value="item.location" />
          <TagRow
            label="领取截止"
            :value="formatDateTime(item.pickupDeadline)"
            mono
          />
          <TagRow
            v-if="item.claimedAt"
            label="领取时间"
            :value="formatDateTime(item.claimedAt)"
            mono
          />
          <TagRow
            v-if="item.refundedAt"
            label="退分时间"
            :value="formatDateTime(item.refundedAt)"
            mono
          />
          <TagRow v-if="item.reason" label="处理原因" :value="item.reason" />
        </Ledger>

        <p class="orders-page__hint">{{ orderStatusMeta(item.status).hint }}</p>

        <div v-if="canCancelOrder(item.status)" class="orders-page__actions">
          <UiButton variant="secondary" @click="openCancel(item)">
            取消订单
          </UiButton>
        </div>
      </li>
    </ul>

    <UiConfirmDialog
      :open="Boolean(pending)"
      title="取消订单"
      message="取消后积分退回账户、库存释放；已领取的奖励不能取消。"
      confirm-text="取消订单"
      cancel-text="保留订单"
      :busy="cancelling"
      @confirm="confirmCancel"
      @cancel="closeCancel"
    >
      <div v-if="pending" class="orders-page__confirm">
        <TagRow label="订单号" :value="pending.orderNo" mono />
        <TagRow label="奖励" :value="pending.rewardName" />
        <TagRow label="退回积分" :value="`${pending.pointsCost} 分`" mono />
      </div>
    </UiConfirmDialog>
  </section>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.orders-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.orders-page__error {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.orders-page__list {
  display: grid;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.orders-page__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4) var(--space-4);
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-paper);
}

.orders-page__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
}

.orders-page__no {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
  overflow-wrap: anywhere;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.orders-page__no:hover {
  color: var(--color-leaf);
}

.orders-page__reward {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-kai);
  font-size: var(--font-size-title);
  letter-spacing: var(--tracking-display);
  line-height: var(--line-height-title);
  overflow-wrap: anywhere;
}

.orders-page__rows {
  display: flex;
  flex-direction: column;
}

.orders-page__hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.orders-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.orders-page__confirm {
  display: flex;
  flex-direction: column;
}

@media (min-width: 48rem) {
  .orders-page__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4) var(--space-6);
  }
}
</style>
