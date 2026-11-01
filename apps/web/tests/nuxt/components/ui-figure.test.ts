import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
