<script setup lang="ts">
import { LogOut } from "lucide-vue-next";
import { resolveActionError } from "~/utils/action-errors";
import { resolveRequestError } from "~/utils/auth-errors";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { clearHomeProfileCache } from "~/utils/profile-cache";
import { getStudentProfile, updateStudentProfile } from "~/utils/profile-api";
import { SwitchRoot, SwitchThumb } from "reka-ui";

const { logout } = useAuth();
const cursor = useSuperMouseCursor();

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
      eyebrow="我的档案"
      :title="pageTitle"
      subtitle="你的植物、行动与账号信息都在这里。"
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
          <div class="me-page__identity-head">
            <div class="me-page__avatar" aria-hidden="true">
              {{ displayName.slice(0, 1) }}
            </div>
            <div class="me-page__identity-heading">
              <p class="me-page__identity-label">学生档案</p>
              <p class="me-page__identity-name">{{ displayName }}</p>
            </div>
          </div>
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
          <FolioSection class="me-page__folio" title="登记资料">
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

          <FolioSection class="me-page__folio" title="积分与领养">
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

          <FolioSection class="me-page__folio" title="账号服务">
            <Ledger>
              <NuxtLink to="/notifications" class="me-page__row-link">
                <TagRow label="通知" :value="notificationValue" />
              </NuxtLink>
              <NuxtLink to="/feedback" class="me-page__row-link">
                <TagRow label="问题反馈" value="提交问题并查看回复" />
              </NuxtLink>
            </Ledger>
          </FolioSection>

          <FolioSection class="me-page__folio" title="偏好设置">
            <div class="me-page__preference">
              <div class="me-page__preference-copy">
                <p>鼠标指针效果</p>
                <span id="cursor-effect-help" class="me-page__preference-help">
                  在精细指针且未开启系统减弱动效时显示品牌指针。
                </span>
              </div>
              <SwitchRoot
                class="cursor-switch"
                :model-value="cursor.preference.value"
                aria-label="鼠标指针效果"
                aria-describedby="cursor-effect-help"
                @update:model-value="cursor.setPreference"
              >
                <span class="cursor-switch__label" aria-hidden="true">
                  {{ cursor.preference.value ? "开" : "关" }}
                </span>
                <SwitchThumb class="cursor-switch__thumb" />
              </SwitchRoot>
            </div>
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
            <UiButton
              class="me-page__logout-button"
              variant="danger"
              @click="confirming = true"
            >
              <LogOut :size="16" :stroke-width="1.8" aria-hidden="true" />
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
  padding-bottom: 2rem;
}

.me-page__error-text {
  margin: 0 0 var(--space-3);
}

.me-page__sheet {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.me-page__identity {
  grid-column: span 4;
  position: relative;
  overflow: hidden;
  padding: var(--space-6);
  background: var(--color-deep-pine);
  border-radius: var(--radius-card);
  box-shadow: none;
  color: var(--color-on-deep-pine);
}

.me-page__identity::after {
  position: absolute;
  right: -4rem;
  bottom: -5rem;
  width: 12rem;
  height: 12rem;
  border: 1px solid color-mix(in srgb, var(--color-on-forest) 14%, transparent);
  border-radius: 50%;
  content: "";
}

.me-page__identity-head {
  position: relative;
  z-index: 1;
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.me-page__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  background: var(--color-sticker);
  border-radius: 50%;
  color: var(--color-on-sticker);
  font-family: var(--font-display);
  font-size: var(--font-size-title);
}

.me-page__identity-heading {
  min-width: 0;
}

.me-page__identity-label {
  margin: 0;
  color: color-mix(in srgb, var(--color-on-forest) 58%, transparent);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.me-page__identity-name {
  margin: var(--space-1) 0 0;
  color: var(--color-on-deep-pine);
  font-family: var(--font-display);
  font-size: var(--font-size-title);
  overflow-wrap: anywhere;
}

.me-page__identity-meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-5) 0;
  padding-top: var(--space-4);
  border-top: 1px solid
    color-mix(in srgb, var(--color-on-forest) 16%, transparent);
}

.me-page__identity-meta div {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.me-page__identity-meta dt {
  color: color-mix(in srgb, var(--color-on-forest) 58%, transparent);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
}

.me-page__identity-meta dd {
  margin: 0;
  color: var(--color-on-deep-pine);
  font-size: var(--font-size-small);
}

.me-page__identity :deep(.ui-status-chip) {
  position: relative;
  z-index: 1;
  background: color-mix(in srgb, var(--color-on-forest) 10%, transparent);
  color: var(--color-on-deep-pine);
}

.me-page__identity :deep(.ui-status-chip::before) {
  background: var(--color-sticker);
}

.me-page__record {
  grid-column: span 8;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.me-page__folio {
  padding: 0 0 2rem;
  margin-bottom: 2rem;
  border-bottom: var(--border-line);
}

.me-page__folio:last-of-type {
  border-bottom: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0;
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
  padding: var(--space-4);
  background: var(--color-surface-muted);
  border-radius: var(--radius-card);
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
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  margin: 1rem 0 0;
  padding: 1rem 1.25rem;
  background: var(--color-blush-wash);
  border: 1px solid color-mix(in srgb, var(--color-clay) 52%, var(--color-line));
  border-radius: var(--radius-card);
}

.me-page__actions-note {
  max-width: 26rem;
  margin: 0;
  color: var(--color-ink);
  font-size: var(--font-size-small);
}

.me-page__logout-button {
  flex: none;
  min-height: 2.75rem;
  padding-inline: 1.15rem 1.3rem;
  background: color-mix(
    in srgb,
    var(--color-surface-raised) 88%,
    var(--color-blush-wash)
  );
  border-color: color-mix(in srgb, var(--color-clay) 62%, var(--color-line));
  border-radius: var(--radius-chip);
  color: var(--palette-blush);
  box-shadow: 0 8px 20px -15px var(--color-shadow-strong);
  transform-origin: center;
  transition:
    transform 420ms cubic-bezier(0.22, 1.35, 0.36, 1),
    background-color var(--motion-color),
    border-color var(--motion-color),
    box-shadow var(--motion-hover);
  will-change: transform;
}

.me-page__logout-button:not(:disabled):hover {
  background: var(--color-surface-raised);
  border-color: var(--color-clay);
  box-shadow: 0 12px 24px -18px var(--color-shadow-strong);
  animation: me-logout-jelly 620ms cubic-bezier(0.22, 0.8, 0.3, 1);
}

.me-page__logout-button:not(:disabled):active {
  animation: none;
  transform: scale(0.93, 0.88);
  transition-duration: 120ms;
}

.me-page__logout-button :deep(.ui-button__content) {
  gap: 0.45rem;
}

.me-page__logout-button :deep(svg) {
  flex: none;
}

@keyframes me-logout-jelly {
  0% {
    transform: scale(1);
  }

  22% {
    transform: scale(1.045, 0.94) translateY(1px);
  }

  43% {
    transform: scale(0.975, 1.03) translateY(-1px);
  }

  64% {
    transform: scale(1.018, 0.988);
  }

  82% {
    transform: scale(0.995, 1.006);
  }

  100% {
    transform: scale(1);
  }
}

.me-page__identity {
  position: sticky;
  top: calc(var(--masthead-height) + 1rem);
}

.me-page__preference {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2rem;
  align-items: start;
}

.me-page__preference-copy p,
.me-page__preference-help {
  margin: 0;
}

.me-page__preference-copy p {
  color: var(--color-ink);
  font-size: var(--font-size-body);
  font-weight: 600;
  line-height: 2rem;
}

.me-page__preference-help {
  display: block;
  max-width: 34rem;
  margin-top: 0.35rem;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.cursor-switch {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  width: 3.75rem;
  height: 2rem;
  padding: 0.25rem;
  background: color-mix(
    in srgb,
    var(--color-surface-muted) 78%,
    var(--color-surface-raised)
  );
  border: 1px solid
    color-mix(in srgb, var(--color-line-strong) 72%, transparent);
  border-radius: var(--radius-chip);
  box-shadow: inset 0 1px 2px var(--color-shadow);
  transition:
    background-color var(--motion-color),
    border-color var(--motion-color),
    transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow var(--motion-color);
}

.cursor-switch[data-state="checked"] {
  background: var(--color-deep-pine);
  border-color: var(--color-deep-pine);
}

.cursor-switch .cursor-switch__label {
  position: absolute;
  top: 50%;
  max-width: none;
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  line-height: 1;
  pointer-events: none;
  transform: translateY(-50%);
  transition:
    color var(--motion-color),
    opacity var(--motion-color);
}

.cursor-switch[data-state="unchecked"] .cursor-switch__label {
  right: 0.625rem;
}

.cursor-switch[data-state="checked"] .cursor-switch__label {
  left: 0.625rem;
  color: color-mix(in srgb, var(--color-on-deep-pine) 72%, transparent);
}

.cursor-switch:hover:not(:disabled) {
  border-color: var(--color-line-strong);
  transform: scale(1.02, 0.98);
}

.cursor-switch:active:not(:disabled) {
  transform: scale(0.96, 0.92);
}

.cursor-switch:active:not(:disabled) .cursor-switch__thumb {
  transform: scale(1.12, 0.88);
}

.cursor-switch:active:not(:disabled)
  .cursor-switch__thumb[data-state="checked"] {
  transform: translateX(1.625rem) scale(1.12, 0.88);
}

.cursor-switch:disabled {
  opacity: 0.45;
}

.cursor-switch:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

.cursor-switch__thumb {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  background: var(--color-surface-raised);
  border: 1px solid
    color-mix(in srgb, var(--color-line-strong) 42%, transparent);
  border-radius: 50%;
  box-shadow:
    0 2px 6px var(--color-shadow-strong),
    inset 0 1px 0 color-mix(in srgb, white 72%, transparent);
  transform: none;
  transition:
    transform 520ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color var(--motion-color),
    border-color var(--motion-color),
    box-shadow var(--motion-color);
}

.cursor-switch__thumb[data-state="checked"] {
  background: var(--color-citron);
  border-color: transparent;
  box-shadow:
    0 3px 8px color-mix(in srgb, var(--color-deep-pine) 32%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 58%, transparent);
  transform: translateX(1.625rem);
}

@media (prefers-reduced-motion: reduce) {
  .me-page__logout-button {
    transform: none !important;
  }

  .me-page__logout-button:not(:disabled):hover {
    animation: none;
  }

  .cursor-switch,
  .cursor-switch__thumb {
    transition-duration: 0.01ms !important;
  }

  .cursor-switch:hover:not(:disabled),
  .cursor-switch:active:not(:disabled) {
    transform: none;
  }

  .cursor-switch:active .cursor-switch__thumb {
    transform: none;
  }

  .cursor-switch:active .cursor-switch__thumb[data-state="checked"] {
    transform: translateX(1.625rem);
  }
}
</style>
