<script setup lang="ts">
import Stamp, { type StampTone } from "./Stamp.vue";

withDefaults(
  defineProps<{
    label: string;
    value: string;
    code?: string;
    stamp?: string;
    stampTone?: StampTone;
    mono?: boolean;
    misregistered?: boolean;
  }>(),
  {
    stampTone: "neutral",
    mono: false,
    misregistered: false,
  },
);
</script>

<template>
  <div class="ui-tag-row">
    <span class="ui-tag-row__punch" aria-hidden="true" />
    <span class="ui-tag-row__label">{{ label }}</span>
    <span class="ui-tag-row__leader" aria-hidden="true" />
    <span
      class="ui-tag-row__value"
      :class="{ 'ui-tag-row__value--mono': mono }"
    >
      {{ value }}
    </span>
    <span v-if="code || stamp" class="ui-tag-row__meta">
      <span v-if="code" class="ui-tag-row__code">{{ code }}</span>
      <Stamp v-if="stamp" :tone="stampTone" :misregistered="misregistered">
        {{ stamp }}
      </Stamp>
    </span>
  </div>
</template>

<style scoped>
.ui-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-3);
  align-items: baseline;
  min-width: 0;
  padding: var(--space-3) 0;
  border-bottom: var(--border-hairline);
}

.ui-tag-row__punch {
  flex: none;
  width: 0.3125rem;
  height: 0.3125rem;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-none);
}

.ui-tag-row__label {
  flex: none;
  color: var(--color-graphite);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--tracking-label);
  white-space: nowrap;
}

.ui-tag-row__leader {
  flex: 1 1 2rem;
  min-width: 1.5rem;
  border-bottom: 1px dotted var(--color-rule-strong);
  transform: translateY(-0.28em);
}

.ui-tag-row__value {
  flex: none;
  max-width: 65%;
  color: var(--color-ink);
  font-size: var(--font-size-md);
  overflow-wrap: anywhere;
  text-align: right;
}

.ui-tag-row__value--mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--tracking-mono);
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
  font-family: var(--font-mono);
  font-size: var(--font-size-caption);
  letter-spacing: var(--tracking-mono);
}

@media (min-width: 22.5rem) {
  .ui-tag-row__meta {
    margin-left: auto;
  }
}

@media (max-width: 22.49rem) {
  .ui-tag-row__meta {
    flex-basis: 100%;
    justify-content: flex-end;
    margin-top: var(--space-1);
  }

  .ui-tag-row__leader {
    min-width: 1rem;
  }
}
</style>
