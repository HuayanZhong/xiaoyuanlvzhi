import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import TagRow from "../../../app/components/TagRow.vue";

describe("TagRow", () => {
  it("renders the punch, label, value and date code", async () => {
    const wrapper = await mountSuspended(TagRow, {
      props: {
        label: "当前积分",
        value: "120",
        code: "2026-11-01",
        mono: true,
      },
    });

    expect(wrapper.find(".ui-tag-row").exists()).toBe(true);
    expect(wrapper.find(".ui-tag-row__punch").exists()).toBe(true);
    expect(wrapper.find(".ui-tag-row__label").text()).toBe("当前积分");
    expect(wrapper.find(".ui-tag-row__value").text()).toBe("120");
    expect(wrapper.find(".ui-tag-row__value--mono").exists()).toBe(true);
    expect(wrapper.find(".ui-tag-row__code").text()).toBe("2026-11-01");
  });

  it("renders a status stamp when provided", async () => {
    const wrapper = await mountSuspended(TagRow, {
      props: {
        label: "在养绿植",
        value: "2",
        stamp: "在养中",
        stampTone: "alive",
      },
    });

    expect(wrapper.get(".ui-stamp").text()).toBe("在养中");
    expect(wrapper.get(".ui-stamp").classes()).toContain("ui-stamp--alive");
  });
});
