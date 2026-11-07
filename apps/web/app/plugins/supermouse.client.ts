import { Supermouse } from "@supermousejs/core";
import type { MouseState } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const STORAGE_KEY = "student-cursor-effect";

/**
 * 桌面精细指针下的品牌光标。插件只运行在浏览器，避免 SSR 读取 window。
 */
export default defineNuxtPlugin((nuxtApp) => {
  const preference = useState("cursor-effect-preference", () => true);
  const supported = useState("cursor-effect-supported", () => false);
  const isEnabled = useState("cursor-effect-enabled", () => false);
  const instance = shallowRef<Supermouse | null>(null);
  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let removeCursorListeners: (() => void) | null = null;
  let stopPreferenceWatch: (() => void) | null = null;

  function destroyCursor() {
    removeCursorListeners?.();
    removeCursorListeners = null;
    instance.value?.destroy();
    instance.value = null;
    isEnabled.value = false;
  }

  function createCursor() {
    destroyCursor();

    if (!preference.value || !finePointer.matches || reducedMotion.matches) {
      return;
    }

    const cursor = new Supermouse({
      smoothness: 0.16,
      cursor: "custom",
      enableTouch: false,
      autoDisableOnMobile: true,
      hideOnLeave: true,
      zIndex: 9999,
      dataPrefix: "plantcursor",
      hoverSelectors: ["a", "button", "[role='button']", "[data-cursor-hover]"],
      plugins: [
        Dot({
          size: (state: MouseState) =>
            state.isDown ? 4.5 : state.isHover ? 4 : 6,
          color: "var(--cursor-dot)",
          opacity: (state: MouseState) => (state.isDown ? 0.75 : 0.95),
          mixBlendMode: "normal",
          hideOnShape: true,
        }),
        Ring({
          size: (state: MouseState) =>
            state.isDown ? 27 : state.isHover ? 42 : 32,
          color: "var(--cursor-ring)",
          borderWidth: 1,
          opacity: (state: MouseState) =>
            state.isDown ? 0.72 : state.isHover ? 0.9 : 0.55,
          mixBlendMode: "normal",
        }),
      ],
    });

    const nativeSelector =
      "input, textarea, select, [contenteditable='true'], [data-supermouse-ignore]";
    const onPointerMove = (event: PointerEvent) => {
      const target = event.target;
      const native =
        target instanceof Element && Boolean(target.closest(nativeSelector));
      cursor.setCursor(native ? "native" : "custom");
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    removeCursorListeners = () => {
      window.removeEventListener("pointermove", onPointerMove);
    };

    instance.value = cursor;
    isEnabled.value = true;
  }

  function syncSupport() {
    supported.value = finePointer.matches && !reducedMotion.matches;
    createCursor();
  }

  function setPreference(value: boolean) {
    preference.value = value;

    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // 本地存储不可用时仍保留当前页面内的选择。
    }

    createCursor();
  }

  onNuxtReady(() => {
    try {
      preference.value = window.localStorage.getItem(STORAGE_KEY) !== "false";
    } catch {
      preference.value = true;
    }

    syncSupport();
    finePointer.addEventListener("change", syncSupport);
    reducedMotion.addEventListener("change", syncSupport);
    stopPreferenceWatch = watch(preference, createCursor);
  });

  const dispose = () => {
    stopPreferenceWatch?.();
    stopPreferenceWatch = null;
    finePointer.removeEventListener("change", syncSupport);
    reducedMotion.removeEventListener("change", syncSupport);
    destroyCursor();
  };

  nuxtApp.vueApp.onUnmount(dispose);
  import.meta.hot?.dispose(dispose);

  return {
    provide: {
      supermouse: {
        instance,
        preference,
        supported,
        isEnabled,
        setPreference,
      },
    },
  };
});
