<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { ApiError } from "~/utils/api";
import { resolveRequestError } from "~/utils/auth-errors";
import { formatDateTime } from "~/utils/datetime";
import {
  getOrder,
  cancelOrder,
  type RedemptionOrder,
} from "~/utils/reward-api";
import { clearRewardCaches } from "~/utils/reward-cache";
import { canCancelOrder, orderStatusMeta } from "~/utils/reward-status";

const route = useRoute();
const orderId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await useAsyncData(
  () => `order:${orderId.value}`,
  async () => {
    try {
      return {
        order: await getOrder(orderId.value),
        errorMessage: "",
        missing: false,
      };
    } catch (error) {
      const missing =
        error instanceof ApiError &&
        (error.status === 403 || error.status === 404);

      return {
        order: null,
        errorMessage: missing ? "" : resolveRequestError(error),
        missing,
      };
    }
  },
  { watch: [orderId] },
);

const order = computed<RedemptionOrder | null>(() => data.value?.order ?? null);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const missing = computed(() => data.value?.missing ?? false);
const loading = computed(() => loadStatus.value === "pending");
const statusMeta = computed(() => orderStatusMeta(order.value?.status ?? ""));

const confirming = ref(false);
const cancelling = ref(false);
const cancelError = ref("");

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function openCancel() {
  cancelError.value = "";

  if (order.value && canCancelOrder(order.value.status)) {
    confirming.value = true;
  }
}

async function confirmCancel() {
  const current = order.value;

  if (!current || cancelling.value) {
    return;
  }

  cancelling.value = true;
  cancelError.value = "";

  try {
    await cancelOrder(current.id);
    confirming.value = false;
    clearRewardCaches();
    await refresh();
  } catch (error) {
    cancelError.value = resolveActionError(error);
    confirming.value = false;
    clearRewardCaches();
    await refresh();
  } finally {
    cancelling.value = false;
  }
}
</script>

<template>
  <section class="order-detail">
    <UiPageHeader
      eyebrow="兑换订单 · ORDER FILE"
      :title="order?.rewardName || '订单详情'"
      :subtitle="order ? `订单 ${order.orderNo}` : '查看兑换订单的处理结果。'"
    >
      <template #meta>
        <NuxtLink to="/rewards/orders" class="order-detail__link">
          返回订单列表
        </NuxtLink>
      </template>
    </UiPageHeader>

    <UiLoading v-if="loading && !data" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="order-detail__error">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="refresh()">重试</UiButton>
    </UiAlert>

    <UiEmptyState
      v-else-if="missing || !order"
      title="无法查看这个订单"
      description="订单不存在，或不属于当前账号。"
    >
      <NuxtLink to="/rewards/orders" class="order-detail__link">
        返回订单列表
      </NuxtLink>
    </UiEmptyState>

    <template v-else>
      <div class="order-detail__summary">
        <Stamp :tone="statusMeta.tone">{{ statusMeta.label }}</Stamp>
        <p class="order-detail__hint">{{ statusMeta.hint }}</p>
      </div>

      <UiAlert v-if="cancelError" tone="error">
        <p class="order-detail__error">{{ cancelError }}</p>
        <UiButton variant="secondary" @click="refresh()">刷新订单</UiButton>
      </UiAlert>

      <section class="order-detail__section">
        <h2 class="order-detail__heading">订单档案</h2>

        <div class="order-detail__rows">
          <TagRow label="订单号" :value="order.orderNo" mono />
          <TagRow label="奖励" :value="order.rewardName" />
          <TagRow label="消耗积分" :value="`${order.pointsCost} PT`" mono />
          <TagRow label="领取地点" :value="order.location" />
          <TagRow
            label="领取截止"
            :value="formatDateTime(order.pickupDeadline)"
            mono
          />
          <TagRow
            label="下单时间"
            :value="formatDateTime(order.createdAt)"
            mono
          />
          <TagRow
            v-if="order.claimedAt"
            label="领取时间"
            :value="formatDateTime(order.claimedAt)"
            mono
          />
          <TagRow
            v-if="order.refundedAt"
            label="退分时间"
            :value="formatDateTime(order.refundedAt)"
            mono
          />
          <TagRow
            v-if="order.reason"
            label="取消或超时原因"
            :value="order.reason"
          />
        </div>
      </section>

      <div v-if="canCancelOrder(order.status)" class="order-detail__actions">
        <UiButton variant="secondary" @click="openCancel"> 取消订单 </UiButton>
      </div>

      <UiConfirmDialog
        :open="confirming"
        title="取消订单"
        message="取消后积分退回账户、库存释放；已领取的奖励不能取消。"
        confirm-text="取消订单"
        cancel-text="保留订单"
        :busy="cancelling"
        @confirm="confirmCancel"
        @cancel="confirming = false"
      >
        <div class="order-detail__confirm">
          <TagRow label="订单号" :value="order.orderNo" mono />
          <TagRow label="奖励" :value="order.rewardName" />
          <TagRow label="退回积分" :value="`${order.pointsCost} PT`" mono />
        </div>
      </UiConfirmDialog>
    </template>
  </section>
</template>

<style scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-5);
}

.order-detail__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.order-detail__error {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.order-detail__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-bottom: var(--space-3);
  border-bottom: var(--border-ink);
}

.order-detail__hint {
  margin: 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.order-detail__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.order-detail__heading {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
}

.order-detail__rows {
  display: flex;
  flex-direction: column;
}

.order-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.order-detail__confirm {
  display: flex;
  flex-direction: column;
}
</style>
