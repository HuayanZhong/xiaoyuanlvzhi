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
        class="ui-password__input"
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        @input="handleInput"
      />
      <button
        type="button"
        class="ui-password__toggle"
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
  gap: var(--space-1);
  align-items: stretch;
}

.ui-password__input {
  flex: 1;
  min-width: 0;
  min-height: var(--touch-target);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
}

.ui-password__input[aria-invalid="true"] {
  border-color: var(--color-danger);
}

.ui-password__toggle {
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  padding: 0 var(--space-2);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-primary-strong);
  font-size: var(--font-size-sm);
}
</style>
