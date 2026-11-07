<script setup lang="ts">
import { resolveAuthError } from "~/utils/auth-errors";

definePageMeta({ layout: "auth" });

type FieldKey =
  | "email"
  | "code"
  | "password"
  | "confirmPassword"
  | "fullName"
  | "studentNumber"
  | "department"
  | "className"
  | "phone";

const { register } = useAuth();

const form = reactive<Record<FieldKey, string>>({
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  studentNumber: "",
  department: "",
  className: "",
  phone: "",
});
const errors = reactive<Record<FieldKey, string>>({
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  studentNumber: "",
  department: "",
  className: "",
  phone: "",
});
const formError = ref("");
const sendNotice = ref("");
const emailRegistered = ref(false);
const sending = ref(false);
const submitting = ref(false);
const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const loginLink = computed(() => {
  const value = form.email.trim();

  return value ? { path: "/login", query: { email: value } } : "/login";
});

watch(
  () => form.email,
  () => {
    errors.email = "";
    emailRegistered.value = false;
  },
);

onUnmounted(stopCountdown);

function stopCountdown() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startCountdown(seconds: number) {
  stopCountdown();
  countdown.value = Math.max(0, Math.floor(seconds));

  if (countdown.value === 0) {
    return;
  }

  timer = setInterval(() => {
    countdown.value -= 1;

    if (countdown.value <= 0) {
      countdown.value = 0;
      stopCountdown();
    }
  }, 1000);
}

function validateEmail(): string {
  const value = form.email.trim();

  if (!value) {
    return "请输入邮箱";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "请输入正确的邮箱地址";
  }

  if (!/^[^\s@]+@qq\.com$/i.test(value)) {
    return "注册邮箱必须是 QQ 邮箱";
  }

  return "";
}

function validate(): boolean {
  for (const key of Object.keys(errors) as FieldKey[]) {
    errors[key] = "";
  }

  errors.email = validateEmail();

  if (!form.code.trim()) {
    errors.code = "请输入验证码";
  } else if (!/^\d{6}$/.test(form.code.trim())) {
    errors.code = "请输入 6 位数字验证码";
  }

  if (!form.password) {
    errors.password = "请设置密码";
  } else if (form.password.length < 6 || form.password.length > 20) {
    errors.password = "密码长度需为 6–20 位";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "请再次输入密码";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "两次输入的密码不一致";
  }

  const fullName = form.fullName.trim();

  if (!fullName) {
    errors.fullName = "请输入姓名";
  } else if (fullName.length > 30) {
    errors.fullName = "姓名最多 30 个字";
  }

  if (!form.studentNumber.trim()) {
    errors.studentNumber = "请输入学号";
  }

  const department = form.department.trim();

  if (!department) {
    errors.department = "请输入院系";
  } else if (department.length > 60) {
    errors.department = "院系最多 60 个字";
  }

  const className = form.className.trim();

  if (!className) {
    errors.className = "请输入班级";
  } else if (className.length > 40) {
    errors.className = "班级最多 40 个字";
  }

  const phone = form.phone.trim();

  if (!phone) {
    errors.phone = "请输入手机号";
  } else if (!/^1[3-9]\d{9}$/.test(phone)) {
    errors.phone = "请输入正确的手机号";
  }

  return (Object.keys(errors) as FieldKey[]).every((key) => !errors[key]);
}

async function sendCode() {
  if (sending.value || countdown.value > 0) {
    return;
  }

  formError.value = "";
  sendNotice.value = "";
  errors.email = validateEmail();

  if (errors.email) {
    return;
  }

  sending.value = true;

  try {
    const result = await sendRegistrationCode(form.email.trim());
    const wait = result.resendAfterSeconds > 0 ? result.resendAfterSeconds : 60;
    const minutes = Math.max(1, Math.round(result.expiresInSeconds / 60));

    startCountdown(wait);
    sendNotice.value = `验证码已发送，${minutes} 分钟内有效。`;
  } catch (error) {
    const info = resolveAuthError(error);

    if (info.restartCountdown) {
      startCountdown(60);
    }

    if (info.field) {
      errors[info.field] = info.message;
    } else {
      formError.value = info.message;
    }

    if (info.action === "login") {
      emailRegistered.value = true;
    }
  } finally {
    sending.value = false;
  }
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
    await register({
      email: form.email.trim(),
      verificationCode: form.code.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      studentNumber: form.studentNumber.trim(),
      department: form.department.trim(),
      className: form.className.trim(),
      phone: form.phone.trim(),
    });
    await navigateTo("/");
  } catch (error) {
    const info = resolveAuthError(error);

    if (info.clearCode) {
      form.code = "";
    }

    if (info.field) {
      errors[info.field] = info.message;
    } else {
      formError.value = info.message;
    }

    if (info.action === "login") {
      emailRegistered.value = true;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="register-page">
    <header class="auth-page__head">
      <p class="register-page__eyebrow">CREATE YOUR JOURNAL</p>
      <h2 class="auth-page__heading">创建植物档案</h2>
      <p class="auth-page__sub">使用 QQ 邮箱完成验证，几步即可开始。</p>
    </header>

    <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>

    <form class="register-page__form" novalidate @submit.prevent="submit">
      <fieldset class="register-page__group">
        <legend class="register-page__legend">账号信息</legend>

        <UiTextInput
          id="register-email"
          v-model="form.email"
          label="QQ 邮箱"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="请输入 QQ 邮箱"
          :error="errors.email"
          required
        />
        <p v-if="emailRegistered" class="register-page__hint">
          <NuxtLink :to="loginLink" class="register-page__link">
            使用该邮箱去登录
          </NuxtLink>
        </p>

        <UiCodeField
          id="register-code"
          v-model="form.code"
          label="邮箱验证码"
          :sending="sending"
          :countdown="countdown"
          :error="errors.code"
          :hint="sendNotice"
          @send="sendCode"
        />

        <UiPasswordInput
          id="register-password"
          v-model="form.password"
          label="登录密码"
          autocomplete="new-password"
          hint="6–20 位"
          :error="errors.password"
          required
        />
        <UiPasswordInput
          id="register-confirm-password"
          v-model="form.confirmPassword"
          label="确认密码"
          autocomplete="new-password"
          :error="errors.confirmPassword"
          required
        />
      </fieldset>

      <fieldset class="register-page__group">
        <legend class="register-page__legend">学生资料</legend>

        <UiTextInput
          id="register-full-name"
          v-model="form.fullName"
          label="姓名"
          autocomplete="name"
          :maxlength="30"
          :error="errors.fullName"
          required
        />
        <UiTextInput
          id="register-student-number"
          v-model="form.studentNumber"
          label="学号"
          :error="errors.studentNumber"
          required
        />
        <UiTextInput
          id="register-department"
          v-model="form.department"
          label="院系"
          :maxlength="60"
          :error="errors.department"
          required
        />
        <UiTextInput
          id="register-class-name"
          v-model="form.className"
          label="班级"
          :maxlength="40"
          :error="errors.className"
          required
        />
        <UiTextInput
          id="register-phone"
          v-model="form.phone"
          label="手机号"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          :maxlength="11"
          :error="errors.phone"
          required
        />
      </fieldset>

      <UiButton type="submit" block :loading="submitting">
        注册并登录
      </UiButton>
    </form>

    <p class="register-page__switch">
      已经有账号？
      <NuxtLink :to="loginLink" class="register-page__link">去登录</NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.register-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.register-page__eyebrow {
  margin: 0;
  color: var(--color-leaf);
  font-family: var(--font-journal);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-journal);
}

.auth-page__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.auth-page__heading {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-auth-heading);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-display);
  line-height: 1.04;
}

.auth-page__sub {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
}

.register-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.register-page__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: var(--space-5) 0 0;
  border: 0;
  border-top: var(--border-line);
}

.register-page__legend {
  padding: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-display);
}

.register-page__hint,
.register-page__switch {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  text-align: center;
}

.register-page__switch {
  text-align: center;
}

.register-page__link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-target);
  padding: 0 var(--space-1);
  color: var(--color-leaf);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
