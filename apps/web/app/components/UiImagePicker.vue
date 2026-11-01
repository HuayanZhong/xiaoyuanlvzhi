<script setup lang="ts">
import { resolveCareError } from "~/utils/care-errors";
import { uploadImage } from "~/utils/upload-api";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type DraftImage = {
  key: number;
  fileId: number;
  url: string;
};

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: number[];
    max?: number;
    hint?: string;
    error?: string;
    disabled?: boolean;
  }>(),
  {
    max: 3,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [ids: number[]];
  busy: [busy: boolean];
}>();

const drafts = ref<DraftImage[]>([]);
const uploading = ref(0);
const localError = ref("");
const input = ref<HTMLInputElement | null>(null);
let nextKey = 0;

const atLimit = computed(
  () => drafts.value.length + uploading.value >= props.max,
);
const busy = computed(() => uploading.value > 0);
const feedback = computed(() => props.error || localError.value);

function pick() {
  if (props.disabled || atLimit.value) {
    return;
  }

  input.value?.click();
}

function publish() {
  emit(
    "update:modelValue",
    drafts.value.map((draft) => draft.fileId),
  );
}

async function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = Array.from(target.files ?? []);
  target.value = "";
  localError.value = "";

  for (const file of files) {
    if (atLimit.value) {
      localError.value = `最多上传 ${props.max} 张图片`;
      break;
    }

    if (!ACCEPTED_TYPES.has(file.type)) {
      localError.value = "只支持 JPG、PNG 或 WebP 图片";
      continue;
    }

    if (file.size > MAX_BYTES) {
      localError.value = "图片不能超过 5 MB";
      continue;
    }

    uploading.value += 1;

    try {
      // oxlint-disable-next-line eslint/no-await-in-loop -- 逐张上传，避免并发写入与服务端限流
      const uploaded = await uploadImage(file);
      drafts.value = [
        ...drafts.value,
        {
          key: nextKey,
          fileId: uploaded.id,
          url: URL.createObjectURL(file),
        },
      ];
      nextKey += 1;
      publish();
    } catch (error) {
      localError.value = resolveCareError(error);
    } finally {
      uploading.value -= 1;
    }
  }
}

function remove(key: number) {
  const target = drafts.value.find((draft) => draft.key === key);

  if (!target) {
    return;
  }

  URL.revokeObjectURL(target.url);
  drafts.value = drafts.value.filter((draft) => draft.key !== key);
  localError.value = "";
  publish();
}

onBeforeUnmount(() => {
  for (const draft of drafts.value) {
    URL.revokeObjectURL(draft.url);
  }
});

watch(busy, (value) => {
  emit("busy", value);
});
</script>

<template>
  <UiField
    v-slot="{ errorId, hintId }"
    :label="label"
    :control-id="id"
    :error="feedback"
    :hint="hint"
  >
    <input
      :id="id"
      ref="input"
      class="ui-image-picker__input"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      :disabled="disabled || atLimit"
      :aria-invalid="feedback ? true : undefined"
      :aria-describedby="feedback ? errorId : hint ? hintId : undefined"
      @change="handleChange"
    />

    <div class="ui-image-picker__body">
      <div class="ui-image-picker__actions">
        <UiButton
          variant="secondary"
          :disabled="disabled || atLimit"
          :loading="busy"
          @click="pick"
        >
          {{ atLimit ? "已达上限" : "选择图片" }}
        </UiButton>
        <span class="ui-image-picker__counter">
          {{ drafts.length }} / {{ max }}
        </span>
      </div>

      <ul v-if="drafts.length" class="ui-image-picker__grid">
        <li
          v-for="draft in drafts"
          :key="draft.key"
          class="ui-image-picker__item"
        >
          <img
            class="ui-image-picker__image"
            :src="draft.url"
            alt="已选凭证图片"
          />
          <button
            type="button"
            class="ui-image-picker__remove"
            @click="remove(draft.key)"
          >
            移除
          </button>
        </li>
      </ul>
    </div>
  </UiField>
</template>

<style scoped>
.ui-image-picker__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.ui-image-picker__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.ui-image-picker__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.ui-image-picker__counter {
  color: var(--color-subtle);
  font-family: var(--font-mono);
  font-size: var(--font-size-label);
  letter-spacing: var(--tracking-code);
}

.ui-image-picker__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ui-image-picker__item {
  position: relative;
  min-width: 0;
  border: var(--border-hairline);
}

.ui-image-picker__image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.ui-image-picker__remove {
  position: absolute;
  right: var(--space-1);
  bottom: var(--space-1);
  min-height: var(--touch-target);
  padding: 0 var(--space-2);
  background: var(--color-sheet);
  border: var(--border-interactive);
  border-radius: var(--radius-none);
  color: var(--color-ink);
  font-size: var(--font-size-label);
}
</style>
