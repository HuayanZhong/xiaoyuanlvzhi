import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiTextInput from "../../../app/components/UiTextInput.vue";

describe("UiTextInput", () => {
  it("emits trimmed-free input values without rewriting the user value", async () => {
    const wrapper = await mountSuspended(UiTextInput, {
      props: { id: "email", label: "邮箱", modelValue: "" },
    });

    await wrapper.get("input").setValue("student@qq.com");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
      "student@qq.com",
    ]);
  });

  it("marks the field invalid and points assistive tech at the error", async () => {
    const wrapper = await mountSuspended(UiTextInput, {
      props: {
        id: "email",
        label: "邮箱",
        modelValue: "",
        error: "请输入邮箱",
      },
    });

    expect(wrapper.get("input").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("input").attributes("aria-describedby")).toBe(
      "email-error",
    );
    expect(wrapper.get("#email-error").text()).toBe("请输入邮箱");
    expect(wrapper.get("#email-error").attributes("role")).toBe("alert");
  });

  it("uses the shared control styles and supports the disabled state", async () => {
    const wrapper = await mountSuspended(UiTextInput, {
      props: {
        id: "email",
        label: "邮箱",
        modelValue: "",
        disabled: true,
      },
    });

    expect(wrapper.get("input").classes()).toContain("ui-control");
    expect(wrapper.get("input").attributes("disabled")).toBeDefined();
  });
});
