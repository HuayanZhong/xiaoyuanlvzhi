import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiButton from "../../../app/components/UiButton.vue";

describe("UiButton", () => {
  it("renders its label and a non-submitting button by default", async () => {
    const wrapper = await mountSuspended(UiButton, {
      slots: { default: "登录" },
    });

    expect(wrapper.get("button").text()).toContain("登录");
    expect(wrapper.get("button").attributes("type")).toBe("button");
  });

  it("disables itself and announces busy while loading", async () => {
    const wrapper = await mountSuspended(UiButton, {
      props: { loading: true },
      slots: { default: "登录" },
    });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
  });
});
