<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    sending?: boolean;
    countdown?: number;
    error?: string;
    hint?: string;
    disabled?: boolean;
  }>(),
  {
    sending: false,
    countdown: 0,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
}>();

const sendDisabled = computed(
  () => props.disabled || props.sending || props.countdown > 0,
);

const sendLabel = computed(() => {
  if (props.sending) {
    return "发送中…";
  }

  if (props.countdown > 0) {
    return `${props.countdown} 秒后重发`;
  }

  return "获取验证码";
});

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<template>
  <UiField
    v-slot="{ errorId, hintId }"
    :label="label"
    :control-id="id"
    :error="error"
    :hint="hint"
  >
    <div class="ui-code">
      <input
        :id="id"
        class="ui-code__input"
        type="text"
        inputmode="numeric"
        maxlength="6"
        autocomplete="one-time-code"
        :value="modelValue"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        @input="handleInput"
      />
      <UiButton
        variant="secondary"
        :disabled="sendDisabled"
        :loading="sending"
        @click="emit('send')"
      >
        {{ sendLabel }}
      </UiButton>
    </div>
  </UiField>
</template>

<style scoped>
.ui-code {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
}

.ui-code__input {
  flex: 1;
  min-width: 0;
  min-height: var(--touch-target);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  letter-spacing: 0.2em;
}

.ui-code__input[aria-invalid="true"] {
  border-color: var(--color-danger);
}
</style>
