import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiPasswordInput from "../../../app/components/UiPasswordInput.vue";

describe("UiPasswordInput", () => {
  it("toggles password visibility from the trailing button", async () => {
    const wrapper = await mountSuspended(UiPasswordInput, {
      props: {
        id: "password",
        label: "密码",
        modelValue: "secret",
      },
    });

    const input = wrapper.get("input");
    expect(input.attributes("type")).toBe("password");

    await wrapper.get("button").trigger("click");

    expect(wrapper.get("input").attributes("type")).toBe("text");
    expect(wrapper.get("button").attributes("aria-pressed")).toBe("true");
    expect(wrapper.get("button").attributes("aria-label")).toBe("隐藏密码");
  });
});
