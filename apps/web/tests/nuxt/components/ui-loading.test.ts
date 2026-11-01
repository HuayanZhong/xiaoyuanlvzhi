import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiLoading from "../../../app/components/UiLoading.vue";

describe("UiLoading", () => {
  it("announces the loading state", async () => {
    const wrapper = await mountSuspended(UiLoading);

    expect(wrapper.get(".ui-loading").attributes("role")).toBe("status");
    expect(wrapper.text()).toContain("正在加载");
  });
});
