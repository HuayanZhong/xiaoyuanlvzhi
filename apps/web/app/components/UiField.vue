<script setup lang="ts">
import UiInlineError from "./UiInlineError.vue";

const props = defineProps<{
  label?: string;
  controlId?: string;
  error?: string;
  hint?: string;
}>();

const errorId = computed(() =>
  props.controlId ? `${props.controlId}-error` : undefined,
);
const hintId = computed(() =>
  props.controlId ? `${props.controlId}-hint` : undefined,
);
</script>

<template>
  <div class="ui-field">
    <label v-if="label" class="ui-field__label" :for="controlId">
      {{ label }}
    </label>
    <slot :error-id="errorId" :hint-id="hintId" />
    <UiInlineError v-if="error" :id="errorId" :message="error" />
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.ui-field__label {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-label);
}

.ui-field__hint {
  margin: 0;
  color: var(--color-subtle);
  font-size: var(--font-size-small);
  line-height: var(--line-height-body);
}
</style>
