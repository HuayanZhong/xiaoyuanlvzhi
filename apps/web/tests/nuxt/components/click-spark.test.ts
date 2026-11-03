import { mountSuspended } from "@nuxt/test-utils/runtime";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import ClickSpark from "../../../app/components/ClickSpark.vue";

describe("ClickSpark", () => {
  it("renders slot content above a decorative spark layer", async () => {
    const wrapper = await mountSuspended(ClickSpark, {
      slots: {
        default: () => h("button", { type: "button" }, "触发火花"),
      },
    });

    expect(wrapper.get(".click-spark button").text()).toBe("触发火花");
    const layer = wrapper.get(".click-spark__layer");
    expect(layer.attributes("aria-hidden")).toBe("true");
    expect(layer.classes()).toContain("click-spark__layer--front");
  });

  it("draws behind content when the layer prop is back", async () => {
    const wrapper = await mountSuspended(ClickSpark, {
      props: { layer: "back" },
    });

    expect(wrapper.get(".click-spark__layer").classes()).toContain(
      "click-spark__layer--back",
    );
  });
});
