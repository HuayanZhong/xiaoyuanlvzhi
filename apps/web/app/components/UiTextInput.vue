<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    type?: string;
    autocomplete?: string;
    inputmode?:
      | "none"
      | "text"
      | "tel"
      | "url"
      | "email"
      | "numeric"
      | "decimal"
      | "search";
    placeholder?: string;
    maxlength?: number;
    error?: string;
    hint?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    type: "text",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

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
    <input
      :id="id"
      class="ui-input ui-control"
      :type="props.type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      @input="handleInput"
    />
  </UiField>
</template>

<style scoped>
.ui-input {
  width: 100%;
}
</style>
