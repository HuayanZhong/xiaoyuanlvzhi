<script setup lang="ts">
import { resolveAuthError } from "~/utils/auth-errors";
import { resolveReturnTo } from "~/utils/auth-route";

definePageMeta({ layout: "auth" });

const { status, restore, clear, login } = useAuth();
const route = useRoute();

const email = ref(
  typeof route.query.email === "string" ? route.query.email : "",
);
const password = ref("");
const errors = reactive({ email: "", password: "" });
const formError = ref("");
const submitting = ref(false);

const returnTo = computed(() => resolveReturnTo(route.query.returnTo));
const notice = computed(() =>
  route.query.notice === "revoke-failed"
    ? "已退出本地登录，但服务端令牌可能仍未失效。"
    : "",
);
const registerLink = computed(() => {
  const value = email.value.trim();

  return value ? { path: "/register", query: { email: value } } : "/register";
});

watch(email, () => {
  errors.email = "";
});
watch(password, () => {
  errors.password = "";
});

function validate(): boolean {
  errors.email = "";
  errors.password = "";

  const value = email.value.trim();

  if (!value) {
    errors.email = "请输入邮箱";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.email = "请输入正确的邮箱地址";
  }

  if (!password.value) {
    errors.password = "请输入密码";
  }

  return !errors.email && !errors.password;
}

async function submit() {
  if (submitting.value) {
    return;
  }

  formError.value = "";

  if (!validate()) {
    return;
  }

  submitting.value = true;

  try {
    await login(email.value.trim(), password.value);
    await navigateTo(returnTo.value);
  } catch (error) {
    formError.value = resolveAuthError(error).message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="auth-page">
    <UiPageHeader title="登录" subtitle="使用 QQ 邮箱和密码进入学生端" />

    <UiAlert v-if="notice" tone="info">{{ notice }}</UiAlert>

    <UiAlert v-if="status === 'error'" tone="error">
      <p class="auth-page__alert-text">无法确认登录状态，请重试。</p>
      <div class="auth-page__actions">
        <UiButton variant="secondary" @click="restore()">重试</UiButton>
        <UiButton variant="ghost" @click="clear()">清除本地登录</UiButton>
      </div>
    </UiAlert>

    <form class="auth-page__form" novalidate @submit.prevent="submit">
      <UiTextInput
        id="login-email"
        v-model="email"
        label="邮箱"
        type="email"
        inputmode="email"
        autocomplete="email"
        placeholder="请输入 QQ 邮箱"
        :error="errors.email"
        required
      />
      <UiPasswordInput
        id="login-password"
        v-model="password"
        label="密码"
        autocomplete="current-password"
        :error="errors.password"
        required
      />

      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>

      <UiButton type="submit" block :loading="submitting">登录</UiButton>
    </form>

    <p class="auth-page__hint">忘记密码请联系管理员重置。</p>
    <p class="auth-page__switch">
      还没有账号？
      <NuxtLink :to="registerLink" class="auth-page__link">立即注册</NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-page__alert-text {
  margin: 0;
}

.auth-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.auth-page__hint,
.auth-page__switch {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
}

.auth-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0 var(--space-1);
  color: var(--color-primary-strong);
  font-weight: var(--font-weight-medium);
}
</style>
