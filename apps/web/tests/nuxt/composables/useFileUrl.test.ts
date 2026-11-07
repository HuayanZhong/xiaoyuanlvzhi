import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { defineComponent, h, ref } from "vue";
import {
  clearFileCache,
  useFileUrl,
} from "../../../app/composables/useFileUrl";

function harness(initial: number | null) {
  return defineComponent({
    setup() {
      const fileId = ref<number | null>(initial);
      const file = useFileUrl(fileId);

      return () =>
        h("div", [
          h("span", { class: "url" }, file.url.value ?? ""),
          h("span", { class: "loading" }, String(file.loading.value)),
          h("span", { class: "error" }, String(file.error.value)),
          h("button", {
            class: "retry",
            onClick: () => file.retry(),
          }),
        ]);
    },
  });
}

describe("useFileUrl", () => {
  it("returns a same-origin Nitro file URL", async () => {
    const wrapper = await mountSuspended(harness(3));

    expect(wrapper.get(".url").text()).toContain("/api/v1/files/3?v=");
    expect(wrapper.get(".loading").text()).toBe("false");
    expect(wrapper.get(".error").text()).toBe("false");
  });

  it("changes the URL when retrying", async () => {
    const wrapper = await mountSuspended(harness(5));
    const initial = wrapper.get(".url").text();

    clearFileCache();
    await wrapper.get(".retry").trigger("click");

    expect(wrapper.get(".url").text()).not.toBe(initial);
  });

  it("does not expose a URL without a file id", async () => {
    const wrapper = await mountSuspended(harness(null));

    expect(wrapper.get(".url").text()).toBe("");
  });
});
