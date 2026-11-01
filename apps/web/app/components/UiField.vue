<script setup lang="ts">
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
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="ui-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ui-field__label {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.ui-field__error,
.ui-field__hint {
  margin: 0;
  font-size: var(--font-size-xs);
}

.ui-field__error {
  color: var(--color-danger);
}

.ui-field__hint {
  color: var(--color-text-subtle);
}
</style>
