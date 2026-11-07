<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  Gift,
  ListChecks,
  MessageSquareText,
  Sprout,
} from "lucide-vue-next";
import { resolveRequestError } from "~/utils/auth-errors";
import { careStatusMeta } from "~/utils/care-status";
import { loadHomeOverview } from "~/utils/home-overview";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { listPointLedger } from "~/utils/point-api";
import { formatPointDelta, pointSourceLabel } from "~/utils/point-source";
import { getStudentProfile } from "~/utils/profile-api";
import { remainingQuota } from "~/utils/task-status";
import type { EcoTask } from "~/utils/task-api";
import { ECO_ACTION_IMAGE, PLANT_HERO_IMAGE } from "~/utils/plant-media";

const {
  data,
  status: loadStatus,
  refresh,
} = await usePageData("home-profile", async () => {
  try {
    return { profile: await getStudentProfile(), errorMessage: "" };
  } catch (error) {
    return { profile: null, errorMessage: resolveRequestError(error) };
  }
});

const profile = computed(() => data.value?.profile ?? null);
const loading = computed(() => loadStatus.value === "pending");
const errorMessage = computed(() => data.value?.errorMessage ?? "");

const { data: notificationData } = await usePageData(
  "notifications",
  loadNotificationSnapshot,
);

const unreadCount = computed(() => notificationData.value?.unreadCount ?? 0);
const notificationError = computed(
  () => notificationData.value?.errorMessage ?? "",
);
const notificationPreview = computed(
  () => notificationData.value?.items.slice(0, 2) ?? [],
);

const { data: pointData } = await usePageData("point-ledger", async () => {
  try {
    return { entries: await listPointLedger(), errorMessage: "" };
  } catch (error) {
    return {
      entries: [],
      errorMessage: resolveRequestError(error),
    };
  }
});

const recentPointEntries = computed(() => {
  const entries = pointData.value?.entries ?? [];

  return entries
    .filter((entry) =>
      ["CARE_CHECKIN", "ECO_TASK", "REDEMPTION", "REDEMPTION_REFUND"].includes(
        entry.sourceType,
      ),
    )
    .filter((entry) => !/测试|验收|回滚|e2e/i.test(entry.reason ?? ""))
    .slice(0, 3);
});

const { data: overview, refresh: refreshOverview } = await usePageData(
  "home-overview",
  loadHomeOverview,
);

const pendingGroups = computed(() => overview.value?.pendingGroups ?? []);
const pendingError = computed(() => overview.value?.pendingError ?? "");
const joinableTasks = computed<EcoTask[]>(() => overview.value?.tasks ?? []);
const tasksError = computed(() => overview.value?.tasksError ?? "");
const duePlants = computed(() => overview.value?.plants ?? []);
const plantsError = computed(() => overview.value?.plantsError ?? "");
const recentCheckins = computed(() => overview.value?.recentCheckins ?? []);

const displayName = computed(
  () =>
    profile.value?.fullName?.trim() ||
    profile.value?.studentNumber ||
    profile.value?.email ||
    "同学",
);

const activeCount = computed(() => profile.value?.activeAdoptionCount ?? 0);
const currentPlant = computed(() => duePlants.value[0] ?? null);
const todayLabel = computed(() => {
  const now = new Date();
  const monthDay = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
    timeZone: "Asia/Shanghai",
  })
    .format(now)
    .replace("星期", "周");

  return `${monthDay} · ${weekday}`;
});

function quotaLabel(task: EcoTask): string {
  const remaining = remainingQuota(task);

  return remaining === null ? "名额不限" : `剩余 ${remaining} 个名额`;
}

function formatDay(value: string | null | undefined): string {
  return value ? value.slice(0, 10).replaceAll("-", ".") : "待记录";
}

function load() {
  return refresh();
}
</script>

<template>
  <section class="home-page">
    <UiLoading v-if="loading && !profile" />

    <UiAlert v-else-if="errorMessage" tone="error">
      <p class="home-page__error-text">{{ errorMessage }}</p>
      <UiButton variant="secondary" @click="load">重试</UiButton>
    </UiAlert>

    <template v-else-if="profile">
      <header class="home-hero">
        <div class="home-hero__copy">
          <div class="home-hero__kicker">
            <p class="home-hero__eyebrow">PLANT JOURNAL / TODAY</p>
            <span>{{ todayLabel }}</span>
          </div>
          <h1>
            你好，<span>{{ displayName }}</span>
          </h1>
          <p class="home-hero__note">
            一株植物的变化不会喧哗。今天，也给它一点被看见的时间。
          </p>

          <div class="home-hero__actions">
            <NuxtLink to="/plants" class="home-hero__primary">
              发现一株
              <ArrowRight :size="17" :stroke-width="1.5" />
            </NuxtLink>
            <NuxtLink to="/tasks" class="home-hero__secondary">
              查看环保行动
            </NuxtLink>
          </div>

          <dl class="home-hero__facts">
            <div>
              <dt>在养植物</dt>
              <dd>{{ activeCount }}<small>株</small></dd>
            </div>
            <div>
              <dt>绿色积分</dt>
              <dd>{{ profile.pointsBalance }}<small>分</small></dd>
            </div>
            <div>
              <dt>待处理</dt>
              <dd>{{ pendingGroups.length }}</dd>
            </div>
          </dl>
        </div>

        <div class="home-hero__visual">
          <div class="home-hero__image-frame">
            <img
              :src="PLANT_HERO_IMAGE"
              alt=""
              aria-hidden="true"
              fetchpriority="high"
            />
          </div>
          <div class="specimen">
            <div>
              <span>MY PLANT / 01</span>
              <strong>{{ currentPlant?.plantName ?? "你的下一株绿植" }}</strong>
            </div>
            <div class="specimen__meta">
              <span>{{ currentPlant?.location || "等待领养" }}</span>
              <span>{{ currentPlant ? "可照料" : "去发现" }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="home-grid">
        <section class="home-panel home-panel--care" data-cursor-hover>
          <header class="panel-heading">
            <div>
              <p>CARE / 今日照料</p>
              <h2>你的植物今天需要什么</h2>
            </div>
            <NuxtLink to="/my-plants">全部植株 ↗</NuxtLink>
          </header>

          <UiAlert v-if="plantsError" tone="error">
            <p class="home-page__error-text">{{ plantsError }}</p>
            <UiButton variant="secondary" @click="refreshOverview()">
              重试
            </UiButton>
          </UiAlert>

          <div v-else-if="duePlants.length > 0" class="care-schedule">
            <div class="care-schedule__list">
              <NuxtLink
                v-for="(plant, index) in duePlants"
                :key="plant.plantId"
                :to="`/my-plants/${plant.plantId}`"
                class="care-feature"
              >
                <span class="care-feature__index">
                  {{ String(index + 1).padStart(2, "0") }}
                </span>
                <span class="care-feature__icon"><Sprout :size="24" /></span>
                <span class="care-feature__copy">
                  <strong>{{ plant.plantName }}</strong>
                  <small>
                    {{ plant.location || "位置待补充" }} ·
                    {{
                      plant.eligible
                        ? "现在可以完成一次养护打卡"
                        : "下次照料还未到期"
                    }}
                  </small>
                </span>
                <span class="care-feature__action">开始照料 →</span>
              </NuxtLink>
            </div>

            <dl v-if="currentPlant" class="care-facts">
              <div>
                <dt>养护间隔</dt>
                <dd>{{ currentPlant.careIntervalDays }} 天</dd>
              </div>
              <div>
                <dt>上次通过</dt>
                <dd>{{ formatDay(currentPlant.lastApprovedAt) }}</dd>
              </div>
              <div>
                <dt>下次可打卡</dt>
                <dd>{{ formatDay(currentPlant.nextEligibleAt) }}</dd>
              </div>
              <NuxtLink
                :to="`/my-plants/${currentPlant.plantId}`"
                class="care-facts__link"
              >
                查看植物档案 →
              </NuxtLink>
            </dl>

            <div class="care-checklist">
              <div class="care-checklist__head">
                <p>打卡前确认</p>
                <span>清晰凭证能减少审核往返</span>
              </div>
              <ol>
                <li><span>01</span>土壤和叶面状态可见</li>
                <li><span>02</span>照片光线充足、没有遮挡</li>
                <li><span>03</span>说明今天观察到的变化</li>
              </ol>
              <NuxtLink
                v-if="currentPlant"
                :to="`/my-plants/${currentPlant.plantId}`"
              >
                开始本次打卡 →
              </NuxtLink>
            </div>
          </div>

          <NuxtLink
            v-else-if="activeCount > 0"
            to="/my-plants"
            class="care-empty"
          >
            <span>今天没有到期养护。</span>
            <strong>查看我的绿植 →</strong>
          </NuxtLink>

          <NuxtLink v-else to="/plants" class="care-empty">
            <span>从一株适合你的植物开始。</span>
            <strong>去发现绿植 →</strong>
          </NuxtLink>
        </section>

        <section class="home-panel home-panel--tasks" data-cursor-hover>
          <img
            class="home-panel__photo"
            :src="ECO_ACTION_IMAGE"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <div class="home-panel__overlay">
            <p class="panel-index">ACTION / 02</p>
            <h2>让今天多一点绿色行动</h2>

            <UiAlert v-if="tasksError" tone="error">
              <p class="home-page__error-text">{{ tasksError }}</p>
              <UiButton variant="secondary" @click="refreshOverview()">
                重试
              </UiButton>
            </UiAlert>

            <div v-else-if="joinableTasks.length > 0" class="task-list">
              <NuxtLink
                v-for="task in joinableTasks"
                :key="task.id"
                :to="`/tasks/${task.id}`"
                class="task-preview"
              >
                <span class="task-preview__copy">
                  <strong>{{ task.title }}</strong>
                  <small>
                    {{ task.pointsPerPerson }} 分 · {{ quotaLabel(task) }}
                  </small>
                </span>
                <ArrowRight :size="16" :stroke-width="1.5" />
              </NuxtLink>
            </div>

            <NuxtLink to="/tasks" class="home-panel__action">
              浏览全部行动
              <ArrowRight :size="17" :stroke-width="1.5" />
            </NuxtLink>
          </div>
        </section>

        <section class="home-panel home-panel--plants">
          <header class="panel-heading">
            <div>
              <p>COLLECTION / 03</p>
              <h2>我的绿植</h2>
            </div>
            <span
              >{{ activeCount }} 株在养 · {{ duePlants.length }} 株待照料</span
            >
          </header>

          <NuxtLink
            v-if="currentPlant"
            :to="`/my-plants/${currentPlant.plantId}`"
            class="plant-ledger"
            data-cursor-hover
          >
            <span class="plant-ledger__number">{{ activeCount }}</span>
            <span class="plant-ledger__copy">
              <strong>{{ currentPlant.plantName }}</strong>
              <small>
                {{ currentPlant.location || "位置待补充" }} ·
                {{ currentPlant.eligible ? "现在可照料" : "等待下次照料" }}
              </small>
            </span>
            <span class="plant-ledger__arrow">↗</span>
          </NuxtLink>

          <NuxtLink
            v-else
            :to="activeCount > 0 ? '/my-plants' : '/plants'"
            class="plant-ledger"
          >
            <span class="plant-ledger__number">{{ activeCount }}</span>
            <span class="plant-ledger__copy">
              <strong>
                {{ activeCount > 0 ? "查看在养绿植" : "还没有在养绿植" }}
              </strong>
              <small>
                {{
                  activeCount > 0
                    ? "今天暂无到期记录，可以查看完整档案。"
                    : "发现一株植物，让这里开始生长。"
                }}
              </small>
            </span>
            <span class="plant-ledger__arrow">↗</span>
          </NuxtLink>

          <dl v-if="currentPlant" class="plant-facts">
            <div>
              <dt>养护间隔</dt>
              <dd>{{ currentPlant.careIntervalDays }} 天</dd>
            </div>
            <div>
              <dt>上次通过</dt>
              <dd>{{ formatDay(currentPlant.lastApprovedAt) }}</dd>
            </div>
            <div>
              <dt>本次状态</dt>
              <dd>{{ currentPlant.eligible ? "可打卡" : "等待中" }}</dd>
            </div>
          </dl>

          <section v-if="recentCheckins.length > 0" class="plant-history">
            <header>
              <p>最近养护</p>
              <NuxtLink to="/my-plants">全部记录 →</NuxtLink>
            </header>
            <NuxtLink
              v-for="checkin in recentCheckins"
              :key="checkin.id"
              :to="`/care/${checkin.id}`"
              class="plant-history__row"
            >
              <span
                class="plant-history__status"
                :data-tone="careStatusMeta(checkin.status).tone"
              >
                {{ careStatusMeta(checkin.status).label }}
              </span>
              <span>
                <strong>{{ checkin.plantName }}</strong>
                <small>{{ formatDay(checkin.createdAt) }}</small>
              </span>
              <span>→</span>
            </NuxtLink>
          </section>
        </section>

        <aside class="home-side">
          <section class="points-card" data-cursor-hover>
            <p>POINTS / 04</p>
            <strong>{{ profile.pointsBalance }}</strong>
            <span>当前绿色积分</span>

            <div v-if="recentPointEntries.length > 0" class="points-ledger">
              <p>最近变动</p>
              <div
                v-for="entry in recentPointEntries"
                :key="entry.id"
                class="points-ledger__row"
              >
                <span>
                  <strong>{{ pointSourceLabel(entry.sourceType) }}</strong>
                  <small>{{ formatDay(entry.createdAt) }}</small>
                </span>
                <b :class="{ 'is-negative': entry.deltaPoints < 0 }">
                  {{ formatPointDelta(entry.deltaPoints) }}
                </b>
              </div>
            </div>

            <NuxtLink to="/points">查看流水 →</NuxtLink>
          </section>

          <section class="message-panel">
            <NuxtLink to="/notifications" class="message-row" data-cursor-hover>
              <span class="message-row__icon"><Bell :size="18" /></span>
              <span>
                <strong>站内消息</strong>
                <small>
                  {{
                    notificationError
                      ? "暂时不可用"
                      : unreadCount > 0
                        ? `${unreadCount} 条未读`
                        : "暂无未读"
                  }}
                </small>
              </span>
              <span>→</span>
            </NuxtLink>

            <div
              v-if="notificationPreview.length > 0"
              class="notification-preview"
            >
              <NuxtLink
                v-for="item in notificationPreview"
                :key="item.id"
                to="/notifications"
                class="notification-preview__row"
              >
                <span
                  class="notification-preview__dot"
                  :class="{ 'is-read': item.readAt }"
                  aria-hidden="true"
                />
                <span>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.summary || formatDay(item.createdAt) }}</small>
                </span>
              </NuxtLink>
            </div>
          </section>
        </aside>

        <section
          v-if="pendingError || pendingGroups.length > 0"
          class="home-panel home-panel--pending"
        >
          <header class="panel-heading">
            <div>
              <p>INBOX / 05</p>
              <h2>待处理事项</h2>
            </div>
          </header>

          <UiAlert v-if="pendingError" tone="error">
            <p class="home-page__error-text">{{ pendingError }}</p>
            <UiButton variant="secondary" @click="refreshOverview()">
              重试
            </UiButton>
          </UiAlert>

          <Ledger v-else>
            <NuxtLink
              v-for="group in pendingGroups"
              :key="group.key"
              :to="group.to"
              class="pending-row"
            >
              <span>{{ group.label }}</span>
              <small>{{ group.record }}</small>
              <strong>{{ group.count }}</strong>
            </NuxtLink>
          </Ledger>
        </section>

        <nav class="home-shortcuts" aria-label="常用入口">
          <NuxtLink to="/plants" class="home-shortcut">
            <span class="home-shortcut__icon"><Sprout :size="20" /></span>
            <span>
              <strong>绿植图鉴</strong>
              <small>寻找适合生活节奏的一株</small>
            </span>
            <ArrowRight :size="16" :stroke-width="1.5" />
          </NuxtLink>
          <NuxtLink to="/tasks" class="home-shortcut">
            <span class="home-shortcut__icon"><ListChecks :size="20" /></span>
            <span>
              <strong>环保行动</strong>
              <small>浏览可报名的新行动</small>
            </span>
            <ArrowRight :size="16" :stroke-width="1.5" />
          </NuxtLink>
          <NuxtLink to="/rewards" class="home-shortcut">
            <span class="home-shortcut__icon"><Gift :size="20" /></span>
            <span>
              <strong>奖励兑换</strong>
              <small>用绿色积分换取日常奖励</small>
            </span>
            <ArrowRight :size="16" :stroke-width="1.5" />
          </NuxtLink>
          <NuxtLink to="/feedback" class="home-shortcut">
            <span class="home-shortcut__icon">
              <MessageSquareText :size="20" />
            </span>
            <span>
              <strong>问题反馈</strong>
              <small>查看提交记录和管理员回复</small>
            </span>
            <ArrowRight :size="16" :stroke-width="1.5" />
          </NuxtLink>
        </nav>
      </div>
    </template>
  </section>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-section);
  padding-bottom: 2rem;
}

.home-page__error-text {
  margin: 0;
}

.home-hero {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0;
  min-height: 35rem;
  overflow: hidden;
  background: var(--color-sage);
  border-radius: 0;
}

.home-hero__copy {
  display: flex;
  grid-column: span 5;
  flex-direction: column;
  justify-content: center;
  padding: 3.5rem;
}

.home-hero__kicker {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.home-hero__kicker > span {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  letter-spacing: 0.04em;
}

.home-hero__eyebrow,
.panel-heading p {
  margin: 0;
  color: var(--color-leaf);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.home-hero h1 {
  max-width: 9ch;
  margin: 1.25rem 0 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-hero);
  font-weight: var(--font-weight-display);
  letter-spacing: 0;
  line-height: 0.98;
  text-wrap: balance;
}

.home-hero h1 span {
  display: block;
  margin-top: 0.08em;
}

.home-hero__note {
  max-width: 26rem;
  margin: 1.5rem 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-body);
  line-height: 1.8;
}

.home-hero__actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
}

.home-hero__primary,
.home-hero__secondary,
.home-panel__action {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border-radius: var(--radius-control);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
}

.home-hero__primary {
  background: var(--color-leaf);
  color: var(--color-on-leaf);
}

.home-hero__primary svg,
.home-panel__action svg {
  transition: transform var(--motion-hover);
}

.home-hero__primary:hover svg,
.home-panel__action:hover svg {
  transform: translateX(4px);
}

.home-hero__secondary {
  border: 1px solid color-mix(in srgb, var(--color-ink) 22%, transparent);
  color: var(--color-ink);
}

.home-hero__facts {
  display: flex;
  gap: 0;
  margin: 2.5rem 0 0;
  padding-top: 1.25rem;
  border-top: 1px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
}

.home-hero__facts div {
  min-width: 7rem;
  padding-right: 1.5rem;
}

.home-hero__facts div + div {
  padding-left: 1.5rem;
  border-left: 1px solid color-mix(in srgb, var(--color-ink) 15%, transparent);
}

.home-hero__facts dt {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: 0.04em;
}

.home-hero__facts dd {
  margin: 0.25rem 0 0;
  color: var(--color-ink);
  font-family: var(--font-number);
  font-size: var(--font-size-number-large);
  line-height: 1;
}

.home-hero__facts small {
  margin-left: 0.25rem;
  font-family: var(--font-sans);
  font-size: var(--font-size-label);
  font-weight: 500;
}

.home-hero__visual {
  position: relative;
  grid-column: span 7;
  min-height: 35rem;
}

.home-hero__image-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.home-hero__image-frame > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
}

.home-hero:hover .home-hero__image-frame > img {
  transform: scale(1.018);
}

.specimen {
  position: absolute;
  z-index: 2;
  right: 2rem;
  bottom: 2rem;
  left: -2.5rem;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: var(--border-line);
  border-radius: var(--radius-card);
  backdrop-filter: blur(14px);
  transition:
    transform var(--motion-hover),
    border-color var(--motion-color),
    background-color var(--motion-color);
}

.home-hero:hover .specimen {
  border-color: color-mix(in srgb, var(--color-line-strong) 72%, transparent);
  transform: translateY(-4px);
}

.specimen div:first-child {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.specimen span,
.specimen__meta {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.specimen strong {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-item);
}

.specimen__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
  justify-content: flex-end;
  letter-spacing: 0;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
}

.home-panel {
  min-width: 0;
  padding: 2rem;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
}

.home-panel--care {
  grid-column: span 7;
}

.home-panel--tasks {
  position: relative;
  grid-column: span 5;
  min-height: 28rem;
  overflow: hidden;
  padding: 0;
  border: 0;
  color: var(--color-on-deep-pine);
}

.home-panel__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-panel__overlay {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 28rem;
  padding: 2rem;
  background: linear-gradient(
    0deg,
    color-mix(in srgb, var(--color-deep-pine) 88%, transparent),
    color-mix(in srgb, var(--color-deep-pine) 8%, transparent)
  );
}

.panel-index {
  margin: 0;
  color: color-mix(in srgb, var(--color-on-deep-pine) 65%, transparent);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.home-panel--tasks h2 {
  max-width: 12ch;
  margin: 1rem 0 0;
  color: var(--color-on-deep-pine);
  font-family: var(--font-display);
  font-size: var(--font-size-feature);
  font-weight: 600;
  line-height: 1.15;
}

.task-list {
  display: flex;
  flex-direction: column;
  margin-top: auto;
  border-top: 1px solid
    color-mix(in srgb, var(--color-on-deep-pine) 24%, transparent);
}

.task-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-on-deep-pine) 24%, transparent);
  color: var(--color-on-deep-pine);
  text-decoration: none;
  transition:
    background-color var(--motion-color),
    padding var(--motion-hover);
}

.task-preview:hover {
  padding-left: 0.5rem;
  color: var(--color-on-deep-pine);
}

.task-preview__copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-preview__copy strong {
  font-family: var(--font-display);
  font-size: var(--font-size-item);
  font-weight: var(--font-weight-display);
}

.task-preview__copy small {
  color: color-mix(in srgb, var(--color-on-deep-pine) 66%, transparent);
  font-size: var(--font-size-label);
}

.home-panel__action {
  align-self: flex-start;
  margin-top: 1.25rem;
  padding: 0;
  color: var(--color-on-deep-pine);
}

.home-panel--plants {
  grid-column: span 8;
}

.panel-heading {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 1.25rem;
  border-bottom: var(--border-line);
}

.panel-heading h2 {
  margin: 0.35rem 0 0;
  font-family: var(--font-display);
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-display);
  line-height: 1.2;
}

.panel-heading > a,
.panel-heading > span {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  text-decoration: none;
}

.care-schedule {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(11rem, 0.55fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.care-schedule__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.care-feature {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  min-height: 7.25rem;
  padding: 1.25rem;
  background: var(--color-leaf-wash);
  border-radius: var(--radius-card);
  color: var(--color-ink);
  text-decoration: none;
  transition:
    background-color var(--motion-color),
    transform var(--motion-hover);
}

.care-feature:hover {
  background: color-mix(
    in srgb,
    var(--color-leaf-wash) 82%,
    var(--color-citron)
  );
  transform: translateY(-2px);
}

.care-feature__index {
  color: var(--color-subtle);
  font-family: var(--font-number);
  font-size: var(--font-size-label);
}

.care-feature__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background: var(--color-citron);
  border-radius: 50%;
  color: var(--palette-ink);
}

.care-feature__copy {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.care-feature__copy strong {
  font-family: var(--font-display);
  font-size: var(--font-size-title);
}

.care-feature__copy small {
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.care-feature__action {
  flex: none;
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.care-facts {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0.25rem 0 0.25rem 1.5rem;
  border-left: var(--border-line);
}

.care-facts div {
  display: flex;
  gap: 1rem;
  align-items: baseline;
  justify-content: space-between;
  padding: 0.85rem 0;
  border-bottom: var(--border-line);
}

.care-facts dt {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.care-facts dd {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-journal);
  font-size: var(--font-size-small);
}

.care-facts__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  margin-top: auto;
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.care-checklist {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(10rem, 0.7fr) minmax(0, 1.5fr) auto;
  gap: 1.5rem;
  align-items: center;
  padding-top: 1rem;
  border-top: var(--border-line);
}

.care-checklist__head p,
.plant-history header p {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-journal);
}

.care-checklist__head span {
  display: block;
  margin-top: 0.25rem;
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
}

.care-checklist ol {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.care-checklist li {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.55;
}

.care-checklist li span {
  color: var(--color-leaf);
  font-family: var(--font-number);
  font-size: var(--font-size-caption);
}

.care-checklist > a {
  color: var(--color-leaf);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  white-space: nowrap;
}

.care-empty {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 11rem;
  margin-top: 1.5rem;
  padding: 2rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-card);
  color: var(--color-subtle);
  text-decoration: none;
}

.care-empty strong {
  color: var(--color-leaf);
}

.plant-ledger {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  min-height: 10rem;
  color: var(--color-ink);
  text-decoration: none;
}

.plant-ledger__number {
  font-family: var(--font-number);
  font-size: var(--font-size-number-xl);
  line-height: 1;
}

.plant-ledger__copy {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.plant-ledger__copy strong {
  font-family: var(--font-display);
  font-size: var(--font-size-title);
}

.plant-ledger__copy small {
  color: var(--color-subtle);
}

.plant-ledger__arrow {
  font-size: var(--font-size-title);
}

.plant-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding-top: 1rem;
  border-top: var(--border-line);
}

.plant-facts div {
  min-width: 0;
  padding-right: 1rem;
}

.plant-facts div + div {
  padding-left: 1rem;
  border-left: var(--border-line);
}

.plant-facts dt {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  letter-spacing: 0.04em;
}

.plant-facts dd {
  margin: 0.3rem 0 0;
  color: var(--color-ink);
  font-size: var(--font-size-small);
}

.plant-history {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: var(--border-line);
}

.plant-history header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.plant-history header a {
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  text-decoration: none;
}

.plant-history__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  min-height: 3.5rem;
  border-bottom: var(--border-line);
  color: var(--color-ink);
  text-decoration: none;
}

.plant-history__row > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.plant-history__row strong {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
}

.plant-history__row small {
  color: var(--color-subtle);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
}

.plant-history__status {
  min-width: 3.5rem;
  padding: 0.2rem 0.45rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sticker);
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  text-align: center;
}

.plant-history__status[data-tone="alive"] {
  background: var(--color-leaf-wash);
  color: var(--color-leaf);
}

.plant-history__status[data-tone="pending"] {
  background: var(--color-clay-wash);
  color: var(--color-clay);
}

.plant-history__status[data-tone="danger"] {
  background: var(--color-blush-wash);
  color: var(--color-blush);
}

.home-side {
  display: flex;
  grid-column: span 4;
  flex-direction: column;
  gap: 1rem;
}

.points-card {
  display: flex;
  min-height: 23rem;
  padding: 2rem;
  background: var(--color-deep-pine);
  border-radius: var(--radius-card);
  color: var(--color-on-deep-pine);
  flex-direction: column;
}

.points-card p {
  margin: 0;
  color: color-mix(in srgb, var(--color-on-deep-pine) 58%, transparent);
  font-family: var(--font-journal);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.points-card strong {
  margin-top: auto;
  font-family: var(--font-number);
  font-size: var(--font-size-number-xl);
  line-height: 0.9;
}

.points-card > span {
  color: color-mix(in srgb, var(--color-on-deep-pine) 65%, transparent);
  font-size: var(--font-size-small);
}

.points-ledger {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 1.5rem;
  border-top: 1px solid
    color-mix(in srgb, var(--color-on-deep-pine) 16%, transparent);
}

.points-ledger > p {
  margin: 0.9rem 0 0.3rem;
  color: color-mix(in srgb, var(--color-on-deep-pine) 58%, transparent);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  letter-spacing: 0.06em;
}

.points-ledger__row {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-on-deep-pine) 12%, transparent);
}

.points-ledger__row > span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.points-ledger__row strong {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
}

.points-ledger__row small {
  color: color-mix(in srgb, var(--color-on-deep-pine) 52%, transparent);
  font-size: var(--font-size-caption);
}

.points-ledger__row b {
  color: var(--color-citron);
  font-family: var(--font-number);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
}

.points-ledger__row b.is-negative {
  color: var(--color-clay);
}

.points-card a {
  margin-top: 1.25rem;
  color: var(--color-citron);
  font-size: var(--font-size-small);
  font-weight: 600;
  text-decoration: none;
}

.message-panel {
  overflow: hidden;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-card);
}

.message-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 1.25rem;
  background: transparent;
  color: var(--color-ink);
  text-decoration: none;
}

.message-row__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-surface-muted);
  border-radius: 50%;
}

.message-row > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.message-row strong {
  font-size: var(--font-size-small);
}

.message-row small {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
}

.notification-preview {
  border-top: var(--border-line);
}

.notification-preview__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.65rem;
  align-items: start;
  padding: 0.85rem 1.25rem;
  color: var(--color-ink);
  text-decoration: none;
}

.notification-preview__row + .notification-preview__row {
  border-top: var(--border-line);
}

.notification-preview__row:hover {
  background: var(--color-surface-muted);
  color: var(--color-ink);
}

.notification-preview__dot {
  width: 0.4rem;
  height: 0.4rem;
  margin-top: 0.45rem;
  background: var(--color-citron);
  border-radius: 50%;
}

.notification-preview__dot.is-read {
  background: var(--color-line-strong);
}

.notification-preview__row > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.notification-preview__row strong {
  font-size: var(--font-size-small);
}

.notification-preview__row small {
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}

.home-panel--pending {
  grid-column: 1 / -1;
}

.pending-row {
  display: grid;
  grid-template-columns: minmax(8rem, 0.8fr) 1.5fr auto;
  gap: 1rem;
  align-items: center;
  min-height: 3.5rem;
  border-bottom: var(--border-line);
  color: var(--color-ink);
  text-decoration: none;
}

.pending-row small {
  color: var(--color-subtle);
}

.pending-row strong {
  color: var(--color-leaf);
  font-family: var(--font-number);
  font-size: var(--font-size-title);
}

.home-shortcuts {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 0.5rem;
  border-top: var(--border-line);
  border-bottom: var(--border-line);
}

.home-shortcut {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  min-height: 6.5rem;
  padding: 1.25rem;
  color: var(--color-ink);
  text-decoration: none;
  transition: background-color var(--motion-color);
}

.home-shortcut + .home-shortcut {
  border-left: var(--border-line);
}

.home-shortcut:hover {
  background: var(--color-surface);
  color: var(--color-ink);
}

.home-shortcut__icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-leaf-wash);
  border-radius: 50%;
  color: var(--color-leaf);
}

.home-shortcut > span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.home-shortcut strong {
  font-size: var(--font-size-small);
}

.home-shortcut small {
  color: var(--color-subtle);
  font-size: var(--font-size-caption);
  line-height: 1.5;
}

@media (max-width: 81rem) {
  .home-hero__copy {
    padding: 2.5rem;
  }

  .home-hero__facts div {
    min-width: 5.5rem;
    padding-right: 1rem;
  }

  .home-hero__facts div + div {
    padding-left: 1rem;
  }

  .care-schedule {
    grid-template-columns: minmax(0, 1fr);
  }

  .care-facts {
    padding: 0;
    border-top: var(--border-line);
    border-left: 0;
  }

  .care-checklist {
    grid-template-columns: minmax(0, 1fr);
  }

  .care-checklist ol {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
