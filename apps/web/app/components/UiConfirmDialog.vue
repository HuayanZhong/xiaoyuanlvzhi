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
  width: min(100%, 22rem);
  padding: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.ui-confirm__title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.ui-confirm__message {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.ui-confirm__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-5);
}
</style>
