import { mountSuspended } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import UiFigure from "../../../app/components/UiFigure.vue";

const useFileUrl = vi.hoisted(() => vi.fn());
const retry = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useFileUrl", () => ({ useFileUrl }));

function state(overrides: Record<string, unknown> = {}) {
  return {
    url: null,
    loading: false,
    error: false,
    retry,
    ...overrides,
  };
}

describe("UiFigure", () => {
  beforeEach(() => {
    useFileUrl.mockReset();
    retry.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a static loading placeholder", async () => {
    useFileUrl.mockReturnValue(state({ loading: true }));

    const wrapper = await mountSuspended(UiFigure, {
      props: { fileId: 3, alt: "绿萝封面" },
    });

    expect(wrapper.text()).toContain("载入中");
    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("shows a retry action when the file fails", async () => {
    useFileUrl.mockReturnValue(state({ error: true }));

    const wrapper = await mountSuspended(UiFigure, {
      props: { fileId: 3, alt: "绿萝封面" },
    });

    expect(wrapper.text()).toContain("图片加载失败");
    await wrapper.get(".ui-figure__retry").trigger("click");
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows the empty text when no file is set", async () => {
    useFileUrl.mockReturnValue(state());

    const wrapper = await mountSuspended(UiFigure, {
      props: { alt: "绿萝封面" },
    });

    expect(wrapper.text()).toContain("暂无封面");
  });

  it("renders the image, ratio class and caption", async () => {
    useFileUrl.mockReturnValue(state({ url: "blob:cover" }));

    const wrapper = await mountSuspended(UiFigure, {
      props: {
        fileId: 3,
        alt: "绿萝封面",
        ratio: "wide",
        caption: "SP-001",
      },
    });

    expect(wrapper.get("img").attributes("src")).toBe("blob:cover");
    expect(wrapper.get("img").attributes("alt")).toBe("绿萝封面");
    expect(wrapper.get(".ui-figure").classes()).toContain("ui-figure--wide");
    expect(wrapper.get(".ui-figure__caption").text()).toBe("SP-001");
  });

  it("waits for the figure to enter the viewport before loading", async () => {
    const observerRef: {
      current: IntersectionObserverCallback | null;
    } = { current: null };

    class FakeIntersectionObserver {
      root = null;
      rootMargin = "";
      thresholds = [];

      constructor(callback: IntersectionObserverCallback) {
        observerRef.current = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal(
      "IntersectionObserver",
      FakeIntersectionObserver as unknown as typeof IntersectionObserver,
    );

    useFileUrl.mockReturnValue(state());

    await mountSuspended(UiFigure, {
      props: { fileId: 3, alt: "绿萝封面" },
    });

    const options = useFileUrl.mock.calls[0]?.[1] as {
      enabled: { value: boolean };
    };
    expect(options.enabled.value).toBe(false);

    observerRef.current?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await nextTick();

    expect(options.enabled.value).toBe(true);
  });
});
