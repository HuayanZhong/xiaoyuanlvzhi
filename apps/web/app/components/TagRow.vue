<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  code?: string;
  stamp?: string;
  stampTone?: "alive" | "pending" | "danger" | "neutral";
  mono?: boolean;
}>();
</script>

<template>
  <div class="ui-tag-row">
    <span class="ui-tag-row__label">{{ label }}</span>
    <span
      class="ui-tag-row__value"
      :class="{ 'ui-tag-row__value--mono': mono }"
    >
      {{ value }}
    </span>
    <span v-if="code || stamp" class="ui-tag-row__meta">
      <span v-if="code" class="ui-tag-row__code">{{ code }}</span>
      <UiStatusChip v-if="stamp" :tone="stampTone">{{ stamp }}</UiStatusChip>
    </span>
  </div>
</template>

<style scoped>
.ui-tag-row {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  min-width: 0;
  min-height: 3.25rem;
  padding: 0.875rem 0;
  border-bottom: var(--border-line);
}

.ui-tag-row__label {
  flex: none;
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.ui-tag-row__value {
  flex: 1;
  min-width: 0;
  color: var(--color-ink);
  font-size: var(--font-size-small);
  transition: color var(--motion-color);
  overflow-wrap: anywhere;
  text-align: right;
}

.ui-tag-row__value--mono {
  font-family: var(--font-number);
  font-size: var(--font-size-body);
  font-variant-numeric: tabular-nums;
}

.ui-tag-row__meta {
  display: flex;
  flex: none;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
}

.ui-tag-row__code {
  color: var(--color-subtle);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-label);
  white-space: nowrap;
}
</style>
