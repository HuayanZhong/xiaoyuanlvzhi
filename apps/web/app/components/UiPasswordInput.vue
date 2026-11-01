<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    autocomplete?: string;
    error?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const visible = ref(false);

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
    <div class="ui-password">
      <input
        :id="id"
        class="ui-password__input ui-control"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        placeholder="请输入密码"
        @input="handleInput"
      />
      <button
        type="button"
        class="ui-password__toggle"
        :disabled="disabled"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? "隐藏" : "显示" }}
      </button>
    </div>
  </UiField>
</template>

<style scoped>
.ui-password {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
  min-width: 0;
}

.ui-password__input {
  flex: 1;
  min-width: 0;
}

.ui-password__toggle {
  flex: none;
  min-width: var(--touch-target);
  min-height: var(--control-height);
  padding: 0 var(--space-2);
  background: var(--color-sheet);
  border: var(--border-interactive);
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
}

.ui-password__toggle:disabled {
  background: var(--color-ink-wash);
  border: var(--border-dashed);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
</style>
