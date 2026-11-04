<script setup lang="ts">
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { clearHomeProfileCache } from "~/utils/profile-cache";
import { getStudentProfile, updateStudentProfile } from "~/utils/profile-api";

const { logout } = useAuth();

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData("me-profile", async () => {
  try {
    return { profile: await getStudentProfile(), errorMessage: "" };
  } catch (error) {
    return { profile: null, errorMessage: resolveRequestError(error) };
  }
});

const profile = computed(() => data.value?.profile ?? null);
const loading = computed(() => loadStatus.value === "pending");
const errorMessage = computed(() => data.value?.errorMessage ?? "");
const confirming = ref(false);
const loggingOut = ref(false);

const { data: notificationData } = await usePageData(
  "notifications",
  loadNotificationSnapshot,
);

const unreadCount = computed(() => notificationData.value?.unreadCount ?? 0);
const notificationError = computed(
  () => notificationData.value?.errorMessage ?? "",
);
const notificationValue = computed(() => {
  if (notificationError.value) {
    return "暂时不可用";
  }

  return unreadCount.value > 0 ? `${unreadCount.value} 条未读` : "暂无未读";
});

const editing = ref(false);
const phoneDraft = ref("");
const classDraft = ref("");
const savingProfile = ref(false);
const saveError = ref("");
const savedNotice = ref("");

const phoneError = computed(() => {
  if (!editing.value) {
    return "";
  }

  const phone = phoneDraft.value.trim();

  if (!phone) {
    return "请填写手机号";
  }

  return /^1[3-9]\d{9}$/.test(phone) ? "" : "手机号格式不正确";
});

const displayName = computed(() => {
  const current = profile.value;

  return (
    current?.fullName?.trim() ||
    current?.studentNumber ||
    current?.email ||
    "未填写"
  );
});

const pageTitle = computed(() => (profile.value ? displayName.value : "我的"));

type ProfileRow = {
  label: string;
  value: string;
  mono?: boolean;
  code?: string;
  stamp?: string;
  stampTone?: "alive" | "pending" | "danger" | "neutral";
  to?: string;
};

const recordRows = computed<ProfileRow[]>(() => {
  const current = profile.value;

  return [
    { label: "院系", value: placeholder(current?.department) },
    { label: "班级", value: placeholder(current?.className) },
    { label: "手机号", value: placeholder(current?.phone) },
    { label: "邮箱", value: placeholder(current?.email) },
  ];
});

const dataRows = computed<ProfileRow[]>(() => {
  const current = profile.value;
  const activeCount = current?.activeAdoptionCount ?? 0;

  return [
    {
      label: "当前积分",
      value: `${current?.pointsBalance ?? 0} 分`,
      mono: true,
      to: "/points",
    },
    {
      label: "在养绿植",
      value: activeCount > 0 ? `${activeCount} 株` : "暂无在养绿植",
      stamp: activeCount > 0 ? "在养中" : undefined,
      stampTone: "alive",
      mono: activeCount > 0,
    },
  ];
});

const missingOptional = computed(() => {
  const current = profile.value;

  if (!current) {
    return false;
  }

  return !current.phone?.trim() || !current.className?.trim();
});

function placeholder(value: string | null | undefined): string {
  return value?.trim() || "未填写";
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return value.slice(0, 10).replaceAll("-", ".");
}

function load() {
  return refresh();
}

function startEdit() {
  phoneDraft.value = profile.value?.phone ?? "";
  classDraft.value = profile.value?.className ?? "";
  saveError.value = "";
  savedNotice.value = "";
  editing.value = true;
}

function cancelEdit() {
  if (savingProfile.value) {
    return;
  }

  editing.value = false;
  saveError.value = "";
}

async function saveProfile() {
  if (savingProfile.value || !profile.value || phoneError.value) {
    return;
  }

  savingProfile.value = true;
  saveError.value = "";

  try {
    const updated = await updateStudentProfile({
      phone: phoneDraft.value.trim(),
      className: classDraft.value.trim(),
    });

    if (data.value) {
      data.value = { profile: updated, errorMessage: "" };
    }

    editing.value = false;
    savedNotice.value = "资料已更新";
    clearHomeProfileCache();
  } catch (error) {
    saveError.value = resolveActionError(error);
  } finally {
    savingProfile.value = false;
  }
}

async function confirmLogout() {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;

  try {
    const result = await logout();
    await navigateTo(
      result.revokeFailed
        ? { path: "/login", query: { notice: "revoke-failed" } }
        : "/login",
    );
  } finally {
    loggingOut.value = false;
    confirming.value = false;
  }
}
</script>

<template>
  <section class="me-page">
    <UiPageHeader
      eyebrow="我的账号"
      :title="pageTitle"
      subtitle="账号资料与登录状态"
      :meta="
        profile?.studentNumber ? `编号 ${profile.studentNumber}` : undefined
      "
    />

    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="me-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <template v-else-if="profile">
      <div class="me-page__sheet">
        <aside class="me-page__identity">
          <span class="tape" aria-hidden="true"></span>
          <p class="me-page__identity-label">学生</p>
          <dl class="me-page__identity-meta">
            <div>
              <dt>学号</dt>
              <dd>{{ placeholder(profile.studentNumber) }}</dd>
            </div>
            <div>
              <dt>加入时间</dt>
              <dd>{{ formatDate(profile.createdAt) }}</dd>
            </div>
          </dl>
          <UiStatusChip tone="alive">在读</UiStatusChip>
        </aside>

        <div class="me-page__record">
          <FolioSection title="登记资料">
            <Ledger>
              <TagRow
                v-for="row in recordRows"
                :key="row.label"
                :label="row.label"
                :value="row.value"
                :mono="row.mono"
                :code="row.code"
                :stamp="row.stamp"
                :stamp-tone="row.stampTone"
              />
            </Ledger>

            <UiAlert v-if="savedNotice" tone="success">
              <p class="me-page__notice">{{ savedNotice }}</p>
            </UiAlert>

            <form
              v-if="editing"
              class="me-page__edit"
              @submit.prevent="saveProfile"
            >
              <UiTextInput
                id="profile-phone"
                v-model="phoneDraft"
                label="手机号"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :maxlength="11"
                :error="phoneError"
                hint="手机号用于账号识别，不能清空。"
                :disabled="savingProfile"
              />

              <UiTextInput
                id="profile-class"
                v-model="classDraft"
                label="班级"
                hint="留空表示清空班级；最多 40 字。"
                :maxlength="40"
                :disabled="savingProfile"
              />

              <UiAlert v-if="saveError" tone="error">
                <p class="me-page__notice">{{ saveError }}</p>
              </UiAlert>

              <div class="me-page__edit-actions">
                <UiButton type="submit" :loading="savingProfile">
                  保存资料
                </UiButton>
                <UiButton
                  variant="secondary"
                  :disabled="savingProfile"
                  @click="cancelEdit"
                >
                  取消
                </UiButton>
              </div>
            </form>

            <UiButton v-else variant="secondary" @click="startEdit">
              修改手机号与班级
            </UiButton>
          </FolioSection>

          <FolioSection title="积分与领养">
            <Ledger>
              <template v-for="row in dataRows" :key="row.label">
                <NuxtLink v-if="row.to" :to="row.to" class="me-page__row-link">
                  <TagRow
                    :label="row.label"
                    :value="row.value"
                    :mono="row.mono"
                    :code="row.code"
                    :stamp="row.stamp"
                    :stamp-tone="row.stampTone"
                  />
                </NuxtLink>
                <TagRow
                  v-else
                  :label="row.label"
                  :value="row.value"
                  :mono="row.mono"
                  :code="row.code"
                  :stamp="row.stamp"
                  :stamp-tone="row.stampTone"
                />
              </template>
            </Ledger>

            <NuxtLink to="/my-plants" class="me-page__care-link">
              我的绿植 · 养护打卡
            </NuxtLink>
          </FolioSection>

          <FolioSection title="账号服务">
            <Ledger>
              <NuxtLink to="/notifications" class="me-page__row-link">
                <TagRow label="通知" :value="notificationValue" />
              </NuxtLink>
              <NuxtLink to="/feedback" class="me-page__row-link">
                <TagRow label="问题反馈" value="提交问题并查看回复" />
              </NuxtLink>
            </Ledger>
          </FolioSection>

          <UiEmptyState
            v-if="missingOptional"
            title="资料待补全"
            description="手机号或班级尚未填写，可以在“登记资料”中补齐。"
          />

          <div class="me-page__actions">
            <p class="me-page__actions-note">
              退出后需要重新登录才能查看个人资料。
            </p>
            <UiButton variant="danger" @click="confirming = true">
              退出登录
            </UiButton>
          </div>
        </div>
      </div>
    </template>

    <UiConfirmDialog
      :open="confirming"
      title="退出登录"
      message="退出后需要重新登录才能查看个人资料。"
      confirm-text="退出"
      :busy="loggingOut"
      @confirm="confirmLogout"
      @cancel="confirming = false"
    />
  </section>
</template>

<style scoped>
.me-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-bottom: var(--space-5);
}

.me-page__error-text {
  margin: 0 0 var(--space-3);
}

.me-page__sheet {
  display: grid;
  gap: var(--space-6);
  align-items: start;
}

.me-page__identity {
  position: relative;
  padding: var(--space-5);
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-paper);
}

.me-page__identity-label {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.me-page__identity-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-4) 0 var(--space-4);
  padding-top: var(--space-3);
  border-top: var(--border-line);
}

.me-page__identity-meta div {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.me-page__identity-meta dt {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.me-page__identity-meta dd {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--font-size-small);
}

.me-page__record {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.me-page__row-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.me-page__row-link:hover :deep(.ui-tag-row__value) {
  color: var(--color-leaf);
}

.me-page__care-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  margin-top: var(--space-3);
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.me-page__edit {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: var(--border-line);
}

.me-page__edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.me-page__notice {
  margin: 0;
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.me-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-4);
  border-top: var(--border-line);
}

.me-page__actions-note {
  max-width: 26rem;
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

@media (min-width: 48rem) {
  .me-page__sheet {
    grid-template-columns: minmax(16rem, 4fr) minmax(0, 8fr);
    gap: var(--space-8);
  }
}
</style>
