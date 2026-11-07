import { Supermouse } from "@supermousejs/core";
import type { MouseState } from "@supermousejs/core";
import { Pointer } from "@supermousejs/pointer";

const STORAGE_KEY = "student-cursor-effect";
const pointerSvg = `
<svg viewBox="0 0 36 36" fill="none" style="display:block;width:100%;height:100%;">
  <g transform="rotate(-45 16 16)">
    <path d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="var(--cursor-pointer-fill)"/>
    <path d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="var(--cursor-pointer-stroke)"/>
  </g>
</svg>`;

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
      smoothness: 0.22,
      cursor: "custom",
      enableTouch: false,
      autoDisableOnMobile: true,
      hideOnLeave: true,
      zIndex: 9999,
      dataPrefix: "plantcursor",
      hoverSelectors: ["a", "button", "[role='button']", "[data-cursor-hover]"],
      plugins: [
        Pointer({
          size: (state: MouseState) => (state.isDown ? 30 : 32),
          color: "currentColor",
          svg: pointerSvg,
          restingAngle: 0,
          returnToRest: true,
          restDelay: 160,
          opacity: (state: MouseState) => (state.isDown ? 0.8 : 0.96),
          rotationSmoothing: 0.2,
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
