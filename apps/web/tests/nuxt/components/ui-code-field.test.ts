import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiCodeField from "../../../app/components/UiCodeField.vue";

describe("UiCodeField", () => {
  it("emits send only when the resend button is available", async () => {
    const wrapper = await mountSuspended(UiCodeField, {
      props: {
        id: "code",
        label: "验证码",
        modelValue: "",
      },
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("send")).toHaveLength(1);
  });

  it("shows the countdown and disables resend while cooling down", async () => {
    const wrapper = await mountSuspended(UiCodeField, {
      props: {
        id: "code",
        label: "验证码",
        modelValue: "",
        countdown: 42,
      },
    });

    const button = wrapper.get("button");
    expect(button.text()).toContain("42 秒后重发");
    expect(button.attributes("disabled")).toBeDefined();
  });
});
