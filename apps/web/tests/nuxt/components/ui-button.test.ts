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

  it("exposes primary, secondary, ghost and danger variants", async () => {
    const variants = ["primary", "secondary", "ghost", "danger"] as const;
    const wrappers = await Promise.all(
      variants.map((variant) =>
        mountSuspended(UiButton, {
          props: { variant },
          slots: { default: variant },
        }),
      ),
    );

    variants.forEach((variant, index) => {
      expect(wrappers[index]!.get("button").classes()).toContain(
        `ui-button--${variant}`,
      );
    });
  });

  it("marks a disabled button without removing it from the layout", async () => {
    const wrapper = await mountSuspended(UiButton, {
      props: { disabled: true },
      slots: { default: "不可用" },
    });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").classes()).toContain("ui-button");
  });
});
