<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    busy?: boolean;
  }>(),
  {
    confirmText: "确认",
    cancelText: "取消",
    busy: false,
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const titleId = useId();
const confirmButton = ref<{ focus: () => void } | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      await nextTick();
      confirmButton.value?.focus();
    }
  },
);
</script>

<template>
  <div
    v-if="open"
    class="ui-confirm"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    :aria-labelledby="titleId"
    @keydown.esc="emit('cancel')"
  >
    <div class="ui-confirm__panel">
      <p class="ui-confirm__eyebrow">确认操作 · CONFIRM</p>
      <h2 :id="titleId" class="ui-confirm__title">{{ title }}</h2>
      <p v-if="message" class="ui-confirm__message">{{ message }}</p>
      <div class="ui-confirm__actions">
        <UiButton variant="secondary" :disabled="busy" @click="emit('cancel')">
          {{ cancelText }}
        </UiButton>
        <UiButton ref="confirmButton" :loading="busy" @click="emit('confirm')">
          {{ confirmText }}
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-confirm {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: var(--color-overlay);
}

.ui-confirm__panel {
  width: min(100%, 24rem);
  padding: var(--space-5);
  background: var(--color-sheet);
  border: var(--border-ink);
  border-radius: var(--radius-none);
  box-shadow: var(--shadow-overlay);
  animation: ui-confirm-in var(--motion-enter);
}

.ui-confirm__eyebrow {
  margin: 0 0 var(--space-3);
  color: var(--color-seal);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.ui-confirm__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-serif);
  font-size: var(--font-size-title-card);
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--tracking-title-cn);
  line-height: var(--line-height-tight);
}

.ui-confirm__message {
  margin: var(--space-3) 0 0;
  color: var(--color-graphite);
  font-size: var(--font-size-sm);
}

.ui-confirm__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: var(--border-hairline);
}

@keyframes ui-confirm-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 30rem) {
  .ui-confirm__actions {
    flex-direction: column-reverse;
  }

  .ui-confirm__actions :deep(.ui-button) {
    width: 100%;
  }
}
</style>
