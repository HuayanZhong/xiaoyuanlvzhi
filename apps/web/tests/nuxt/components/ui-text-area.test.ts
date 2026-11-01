import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiTextArea from "../../../app/components/UiTextArea.vue";

describe("UiTextArea", () => {
  it("renders a label, value and character counter", async () => {
    const wrapper = await mountSuspended(UiTextArea, {
      props: {
        id: "note",
        label: "申请备注",
        modelValue: "宿舍南向",
        maxlength: 200,
      },
    });

    expect(wrapper.get("label").text()).toBe("申请备注");
    expect(wrapper.get("textarea").element.value).toBe("宿舍南向");
    expect(wrapper.get("textarea").attributes("maxlength")).toBe("200");
    expect(wrapper.get(".ui-text-area__counter").text()).toBe("4 / 200");
  });

  it("replaces the hint with an error", async () => {
    const wrapper = await mountSuspended(UiTextArea, {
      props: {
        id: "note",
        label: "申请备注",
        modelValue: "",
        hint: "可写养护计划",
        error: "备注最多 200 字",
      },
    });

    expect(wrapper.text()).toContain("备注最多 200 字");
    expect(wrapper.text()).not.toContain("可写养护计划");
    expect(wrapper.get("textarea").attributes("aria-invalid")).toBe("true");
    expect(wrapper.get("textarea").attributes("aria-describedby")).toBe(
      "note-error",
    );
  });

  it("emits input updates", async () => {
    const wrapper = await mountSuspended(UiTextArea, {
      props: { id: "note", label: "申请备注", modelValue: "" },
    });

    await wrapper.get("textarea").setValue("已确认养护条件");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
      "已确认养护条件",
    ]);
  });

  it("supports the disabled state", async () => {
    const wrapper = await mountSuspended(UiTextArea, {
      props: {
        id: "note",
        label: "申请备注",
        modelValue: "",
        disabled: true,
      },
    });

    expect(wrapper.get("textarea").attributes("disabled")).toBeDefined();
  });
});
