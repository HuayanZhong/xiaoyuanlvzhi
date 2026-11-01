import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiAlert from "../../../app/components/UiAlert.vue";

describe("UiAlert", () => {
  it("renders an error alert as an assertive live region", async () => {
    const wrapper = await mountSuspended(UiAlert, {
      props: { tone: "error" },
      slots: { default: "邮箱或密码错误" },
    });

    expect(wrapper.get(".ui-alert").attributes("role")).toBe("alert");
    expect(wrapper.get(".ui-alert").text()).toBe("邮箱或密码错误");
  });

  it("renders non-error tones as status", async () => {
    const wrapper = await mountSuspended(UiAlert, {
      props: { tone: "info" },
      slots: { default: "提示" },
    });

    expect(wrapper.get(".ui-alert").attributes("role")).toBe("status");
  });

  it("renders warning and success tones with their own classes", async () => {
    const warning = await mountSuspended(UiAlert, {
      props: { tone: "warning" },
      slots: { default: "待你处理" },
    });
    const success = await mountSuspended(UiAlert, {
      props: { tone: "success" },
      slots: { default: "已通过" },
    });

    expect(warning.get(".ui-alert").classes()).toContain("ui-alert--warning");
    expect(success.get(".ui-alert").classes()).toContain("ui-alert--success");
    expect(success.get(".ui-alert").attributes("role")).toBe("status");
  });
});
