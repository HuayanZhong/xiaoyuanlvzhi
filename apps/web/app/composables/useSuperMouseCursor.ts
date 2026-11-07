import type { Supermouse } from "@supermousejs/core";
import type { Ref } from "vue";

type CursorController = {
  instance: Ref<Supermouse | null>;
  preference: Ref<boolean>;
  supported: Ref<boolean>;
  isEnabled: Ref<boolean>;
  setPreference: (value: boolean) => void;
};

/** 读取全局 Supermouse 偏好；SSR 阶段返回稳定默认值。 */
export function useSuperMouseCursor(): CursorController {
  const fallbackPreference = useState("cursor-effect-preference", () => true);
  const fallbackSupported = useState("cursor-effect-supported", () => false);
  const fallbackEnabled = useState("cursor-effect-enabled", () => false);
  const fallbackInstance = shallowRef<Supermouse | null>(null);
  const controller = useNuxtApp().$supermouse as CursorController | undefined;

  return (
    controller ?? {
      instance: fallbackInstance,
      preference: fallbackPreference,
      supported: fallbackSupported,
      isEnabled: fallbackEnabled,
      setPreference: (value: boolean) => {
        // oxlint-disable-next-line react/immutability -- useState exposes a writable ref
        fallbackPreference.value = value;
      },
    }
  );
}
