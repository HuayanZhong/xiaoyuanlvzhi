import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import {
  useFileUrl,
  clearFileCache,
} from "../../../app/composables/useFileUrl";

const requestBlob = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ requestBlob }),
}));

const createObjectURL = vi.fn(() => "blob:first");
const revokeObjectURL = vi.fn();

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
            onClick: () => void file.retry(),
          }),
          h("button", {
            class: "next",
            onClick: () => {
              fileId.value = 8;
            },
          }),
        ]);
    },
  });
}

describe("useFileUrl", () => {
  beforeEach(() => {
    requestBlob.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    clearFileCache();
  });

  it("loads a file into an object URL", async () => {
    requestBlob.mockResolvedValue(new Blob(["a"], { type: "image/png" }));

    const wrapper = await mountSuspended(harness(3));
    await flushPromises();

    expect(requestBlob).toHaveBeenCalledWith("files/3");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(wrapper.get(".url").text()).toBe("blob:first");
    expect(wrapper.get(".loading").text()).toBe("false");
    expect(wrapper.get(".error").text()).toBe("false");
  });

  it("reports a failed file without throwing", async () => {
    requestBlob.mockRejectedValue(new Error("missing"));

    const wrapper = await mountSuspended(harness(4));
    await flushPromises();

    expect(wrapper.get(".url").text()).toBe("");
    expect(wrapper.get(".error").text()).toBe("true");
    expect(wrapper.get(".loading").text()).toBe("false");
  });

  it("retries the same file", async () => {
    requestBlob
      .mockRejectedValueOnce(new Error("flaky"))
      .mockResolvedValueOnce(new Blob(["b"], { type: "image/png" }));

    const wrapper = await mountSuspended(harness(5));
    await flushPromises();
    expect(wrapper.get(".error").text()).toBe("true");

    await wrapper.get(".retry").trigger("click");
    await flushPromises();

    expect(requestBlob).toHaveBeenCalledTimes(2);
    expect(wrapper.get(".url").text()).toBe("blob:first");
    expect(wrapper.get(".error").text()).toBe("false");
  });

  it("reuses cached object URLs for the same file", async () => {
    requestBlob.mockResolvedValue(new Blob(["c"], { type: "image/png" }));

    await mountSuspended(harness(6));
    await flushPromises();

    const second = await mountSuspended(harness(6));
    await flushPromises();

    expect(requestBlob).toHaveBeenCalledTimes(1);
    expect(second.get(".url").text()).toBe("blob:first");
  });

  it("does not request anything without a file id", async () => {
    const wrapper = await mountSuspended(harness(null));
    await flushPromises();

    expect(requestBlob).not.toHaveBeenCalled();
    expect(wrapper.get(".loading").text()).toBe("false");
  });
});
