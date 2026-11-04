<script setup lang="ts">
import { resolveRequestError } from "~/utils/auth-errors";
import {
  getApplication,
  requestCancelApplication,
  requestReturnApplication,
  resubmitApplication,
  withdrawApplication,
  type AdoptionApplication,
  type AdoptionEvent,
} from "~/utils/adoption-api";
import {
  adoptionStatusMeta,
  canAdoption,
  type AdoptionAction,
} from "~/utils/adoption-status";
import { formatDateTime } from "~/utils/datetime";

const route = useRoute();
const applicationId = computed(() => readId(route.params.id));

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData(
  () => `adoption-detail:${applicationId.value}`,
  async () => {
    try {
      return {
        application: await getApplication(applicationId.value),
        errorMessage: "",
      };
    } catch (error) {
      return { application: null, errorMessage: resolveRequestError(error) };
    }
  },
  { watch: [applicationId] },
);

const application = computed<AdoptionApplication | null>(
  () => data.value?.application ?? null,
);
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const loading = computed(() => loadStatus.value === "pending");
const status = computed(() => application.value?.status);
const meta = computed(() => adoptionStatusMeta(status.value));

const activeAction = ref<AdoptionAction | null>(null);
const reason = ref("");
const note = ref("");
const busy = ref(false);
const attempted = ref(false);
const actionError = ref("");

const hasActions = computed(() => meta.value.actions.length > 0);
const reasonError = computed(() => {
  if (
    !attempted.value ||
    (activeAction.value !== "cancel" && activeAction.value !== "return")
  ) {
    return "";
  }

  const length = reason.value.trim().length;

  return length >= 5 && length <= 200 ? "" : "原因需要 5 到 200 字";
});
const noteError = computed(() =>
  attempted.value &&
  activeAction.value === "resubmit" &&
  note.value.length > 200
    ? "备注最多 200 字"
    : "",
);

const rows = computed<Array<{ label: string; value: string; mono?: boolean }>>(
  () => {
    const current = application.value;

    if (!current) {
      return [];
    }

    const list: Array<{ label: string; value: string; mono?: boolean }> = [
      { label: "申请编号", value: current.applicationNo, mono: true },
      { label: "品种", value: current.speciesName },
      { label: "提交时间", value: formatDateTime(current.createdAt) },
      { label: "更新时间", value: formatDateTime(current.updatedAt) },
      { label: "申请备注", value: current.note?.trim() || "未填写" },
    ];

    if (current.plantCode) {
      list.push({ label: "分配单株", value: current.plantCode, mono: true });
    }

    if (current.plantLocation) {
      list.push({ label: "摆放位置", value: current.plantLocation });
    }

    if (current.pickupDeadline) {
      list.push({
        label: "领取截止",
        value: formatDateTime(current.pickupDeadline),
      });
    }

    return list;
  },
);

const reasons = computed(() => {
  const current = application.value;

  if (!current) {
    return [];
  }

  const list: Array<{ label: string; value: string }> = [];

  if (current.reviewReason?.trim()) {
    list.push({ label: "审核原因", value: current.reviewReason.trim() });
  }

  if (current.returnReason?.trim()) {
    list.push({ label: "归还原因", value: current.returnReason.trim() });
  }

  if (current.returnResult) {
    list.push({
      label: "归还结果",
      value:
        current.returnResult === "AVAILABLE"
          ? "植株可再次领养"
          : current.returnResult === "MAINTENANCE"
            ? "植株转入维护"
            : current.returnResult,
    });
  }

  return list;
});

const timeline = computed(() =>
  (application.value?.timeline ?? []).map((event) => ({
    title: eventTitle(event),
    time: event.createdAt,
    note: event.reason,
  })),
);

const submitLabel = computed(() => {
  switch (activeAction.value) {
    case "resubmit":
      return "重新提交";
    case "cancel":
      return "提交取消申请";
    case "return":
      return "提交归还申请";
    default:
      return "确认";
  }
});

const reasonLabel = computed(() =>
  activeAction.value === "cancel" ? "取消原因" : "归还原因",
);

watch(status, () => {
  activeAction.value = null;
  actionError.value = "";
});

function readId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function eventTitle(event: AdoptionEvent): string {
  if (!event.fromStatus) {
    return "提交申请";
  }

  return `${adoptionStatusMeta(event.fromStatus).label} → ${
    adoptionStatusMeta(event.toStatus).label
  }`;
}

function openAction(action: AdoptionAction) {
  activeAction.value = action;
  actionError.value = "";
  attempted.value = false;

  if (action === "resubmit") {
    note.value = application.value?.note ?? "";
  } else {
    reason.value = "";
  }
}

function closeAction() {
  if (busy.value) {
    return;
  }

  activeAction.value = null;
  actionError.value = "";
}

async function submitAction() {
  const current = application.value;

  if (!current || !activeAction.value || busy.value) {
    return;
  }

  attempted.value = true;

  if (reasonError.value || noteError.value) {
    return;
  }

  busy.value = true;
  actionError.value = "";

  try {
    switch (activeAction.value) {
      case "withdraw":
        await withdrawApplication(current.id);
        break;
      case "resubmit":
        await resubmitApplication(current.id, note.value);
        break;
      case "cancel":
        await requestCancelApplication(current.id, reason.value);
        break;
      case "return":
        await requestReturnApplication(current.id, reason.value);
        break;
    }

    activeAction.value = null;
    await refresh();
  } catch (error) {
    actionError.value = resolveRequestError(error);
  } finally {
    busy.value = false;
  }
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="adoption-detail">
    <UiPageHeader
      eyebrow="领养申请"
      :title="application?.speciesName ?? '申请详情'"
      :subtitle="
        application ? '查看申请状态、状态记录和当前可执行的操作。' : undefined
      "
      :meta="application ? `编号 ${application.applicationNo}` : undefined"
    />

    <UiLoading v-if="loading && !data" />

    <template v-else-if="application">
      <div class="adoption-detail__status">
        <UiStatusChip :tone="meta.tone">{{ meta.label }}</UiStatusChip>
        <p class="adoption-detail__status-hint">{{ meta.hint }}</p>
      </div>

      <div class="adoption-detail__sheet">
        <section class="adoption-detail__column">
          <FolioSection title="状态记录">
            <UiTimeline :items="timeline" />
          </FolioSection>
        </section>

        <section class="adoption-detail__column">
          <FolioSection title="申请资料">
            <Ledger>
              <TagRow
                v-for="row in rows"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :mono="row.mono"
              />
            </Ledger>
          </FolioSection>

          <FolioSection v-if="reasons.length" title="审核说明">
            <Ledger>
              <TagRow
                v-for="row in reasons"
                :key="row.label"
                :label="row.label"
                :value="row.value"
              />
            </Ledger>
          </FolioSection>

          <section class="adoption-detail__actions" aria-label="申请操作">
            <NuxtLink
              v-if="status === 'ACTIVE'"
              to="/my-plants"
              class="adoption-detail__care-link"
            >
              去我的绿植提交养护打卡
            </NuxtLink>

            <template v-if="hasActions">
              <UiButton
                v-if="canAdoption(status, 'withdraw')"
                variant="danger"
                @click="openAction('withdraw')"
              >
                撤回申请
              </UiButton>
              <UiButton
                v-if="canAdoption(status, 'resubmit')"
                variant="secondary"
                @click="openAction('resubmit')"
              >
                修改备注后重提
              </UiButton>
              <UiButton
                v-if="canAdoption(status, 'cancel')"
                variant="danger"
                @click="openAction('cancel')"
              >
                取消申请
              </UiButton>
              <UiButton
                v-if="canAdoption(status, 'return')"
                variant="danger"
                @click="openAction('return')"
              >
                申请归还
              </UiButton>
            </template>

            <p v-else class="adoption-detail__readonly">
              当前状态只能查看，不能提交新操作。
            </p>
          </section>

          <form
            v-if="activeAction && activeAction !== 'withdraw'"
            class="adoption-detail__form"
            @submit.prevent="submitAction"
          >
            <UiTextArea
              v-if="activeAction === 'resubmit'"
              id="resubmit-note"
              v-model="note"
              label="申请备注"
              :maxlength="200"
              hint="修改后可重新提交，历史记录会保留"
              :error="noteError"
            />
            <UiTextArea
              v-else
              id="action-reason"
              v-model="reason"
              :label="reasonLabel"
              :maxlength="200"
              hint="5 到 200 字"
              :error="reasonError"
            />

            <UiAlert v-if="actionError" tone="error">
              <p class="adoption-detail__form-error">{{ actionError }}</p>
              <UiButton variant="secondary" @click="load">刷新详情</UiButton>
            </UiAlert>

            <div class="adoption-detail__form-actions">
              <UiButton type="submit" :loading="busy">
                {{ submitLabel }}
              </UiButton>
              <UiButton variant="ghost" :disabled="busy" @click="closeAction">
                取消
              </UiButton>
            </div>
          </form>

          <UiAlert v-else-if="actionError" tone="error">
            <p class="adoption-detail__form-error">{{ actionError }}</p>
            <UiButton variant="secondary" @click="load">刷新详情</UiButton>
          </UiAlert>

          <NuxtLink to="/adoptions" class="adoption-detail__back">
            返回申请列表
          </NuxtLink>
        </section>
      </div>
    </template>

    <UiEmptyState
      v-else
      title="无法查看该申请"
      :description="errorMessage || '申请不存在，或者不属于当前账号。'"
    >
      <div class="adoption-detail__empty-actions">
        <UiButton variant="secondary" @click="load">重试</UiButton>
        <NuxtLink to="/adoptions" class="adoption-detail__back">
          返回申请列表
        </NuxtLink>
      </div>
    </UiEmptyState>

    <UiConfirmDialog
      :open="activeAction === 'withdraw'"
      title="撤回申请"
      message="撤回后申请变为已取消，需要重新提交；审核记录会保留。"
      confirm-text="撤回"
      :busy="busy"
      @confirm="submitAction"
      @cancel="closeAction"
    />
  </section>
</template>

<style scoped>
.adoption-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.adoption-detail__status {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  padding-bottom: var(--space-4);
  border-bottom: var(--border-line);
}

.adoption-detail__status-hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.adoption-detail__sheet {
  display: grid;
  gap: var(--space-6);
  align-items: start;
}

.adoption-detail__column {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.adoption-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: var(--border-line);
}

.adoption-detail__readonly {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.adoption-detail__care-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.adoption-detail__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-surface);
  border: var(--border-dashed);
  border-radius: var(--radius-card);
}

.adoption-detail__form-error {
  margin: 0 0 var(--space-3);
}

.adoption-detail__form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.adoption-detail__back {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.adoption-detail__empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

@media (min-width: 48rem) {
  .adoption-detail__sheet {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-8);
  }
}
</style>
