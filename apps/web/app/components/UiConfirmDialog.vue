<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogRoot,
  AlertDialogTitle,
} from "reka-ui";

withDefaults(
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

function handleOpenChange(open: boolean) {
  if (!open) {
    emit("cancel");
  }
}
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="handleOpenChange">
    <AlertDialogOverlay class="confirm-dialog__overlay" />
    <AlertDialogContent
      class="confirm-dialog ui-confirm"
      data-supermouse-ignore
      aria-modal="true"
      @keydown.esc.stop.prevent="emit('cancel')"
    >
      <p class="confirm-dialog__eyebrow">CONFIRM / 操作确认</p>
      <AlertDialogTitle class="confirm-dialog__title ui-confirm__title">
        {{ title }}
      </AlertDialogTitle>
      <AlertDialogDescription v-if="message" class="confirm-dialog__message">
        {{ message }}
      </AlertDialogDescription>
      <div v-if="$slots.default" class="confirm-dialog__body ui-confirm__body">
        <slot />
      </div>

      <div class="confirm-dialog__actions">
        <AlertDialogCancel as-child>
          <UiButton variant="secondary" :disabled="busy">
            {{ cancelText }}
          </UiButton>
        </AlertDialogCancel>
        <UiButton :loading="busy" @click="emit('confirm')">
          {{ confirmText }}
        </UiButton>
      </div>
    </AlertDialogContent>
  </AlertDialogRoot>
</template>

<style scoped>
.confirm-dialog__overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--color-overlay);
  backdrop-filter: blur(5px);
  animation: confirm-fade-in 180ms ease-out;
}

.confirm-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 9001;
  width: min(calc(100vw - 4rem), 28rem);
  padding: 2rem;
  background: var(--color-surface);
  border: var(--border-line);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-overlay);
  transform: translate(-50%, -50%);
  animation: confirm-dialog-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-dialog__eyebrow {
  margin: 0 0 0.75rem;
  color: var(--color-leaf);
  font-size: var(--font-size-label);
  font-weight: 600;
  letter-spacing: 0.1em;
}

.confirm-dialog__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-subheading);
  font-weight: 600;
  line-height: 1.25;
}

.confirm-dialog__message,
.confirm-dialog__body {
  margin: 0.75rem 0 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}

.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: var(--border-line);
}

@keyframes confirm-fade-in {
  from {
    opacity: 0;
  }
}

@keyframes confirm-dialog-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.97);
  }
}
</style>
