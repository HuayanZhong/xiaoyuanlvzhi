import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiConfirmDialog from "../../../app/components/UiConfirmDialog.vue";

describe("UiConfirmDialog", () => {
  it("renders a labelled modal dialog when open", async () => {
    const wrapper = await mountSuspended(UiConfirmDialog, {
      props: { open: true, title: "退出登录", message: "确定退出吗？" },
    });

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.attributes("aria-modal")).toBe("true");
    expect(dialog.text()).toContain("退出登录");
    expect(dialog.text()).toContain("确定退出吗？");
  });

  it("renders slot content above the actions", async () => {
    const wrapper = await mountSuspended(UiConfirmDialog, {
      props: { open: true, title: "确认兑换", message: "兑换后不可撤回。" },
      slots: { default: "<p>扣除 50 PT</p>" },
    });

    expect(wrapper.get(".ui-confirm__body").text()).toContain("扣除 50 PT");
    expect(wrapper.findAll("button")).toHaveLength(2);
  });

  it("emits confirm and cancel", async () => {
    const wrapper = await mountSuspended(UiConfirmDialog, {
      props: { open: true, title: "退出登录" },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);
    await buttons[1]!.trigger("click");
    await buttons[0]!.trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("emits cancel on Escape", async () => {
    const wrapper = await mountSuspended(UiConfirmDialog, {
      props: { open: true, title: "退出登录" },
    });

    await wrapper.get('[role="dialog"]').trigger("keydown", { key: "Escape" });

    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });
});
