<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    placeholder?: string;
    maxlength?: number;
    rows?: number;
    error?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    rows: 4,
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const counter = computed(() =>
  props.maxlength === undefined
    ? ""
    : `${props.modelValue.length} / ${props.maxlength}`,
);

function handleInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
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
    <textarea
      :id="id"
      class="ui-control ui-text-area__input"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :rows="rows"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      @input="handleInput"
    />
    <p v-if="counter" class="ui-text-area__counter">{{ counter }}</p>
  </UiField>
</template>

<style scoped>
.ui-text-area__input {
  min-height: 7rem;
  font-family: inherit;
  line-height: var(--line-height-normal);
  resize: vertical;
}

.ui-text-area__counter {
  margin: 0;
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
  text-align: right;
}
</style>
