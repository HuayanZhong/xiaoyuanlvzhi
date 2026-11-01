import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiEmptyState from "../../../app/components/UiEmptyState.vue";

describe("UiEmptyState", () => {
  it("renders the default label, title and description", async () => {
    const wrapper = await mountSuspended(UiEmptyState, {
      props: {
        title: "暂无在养绿植",
        description: "领养一株后，这里会记录你的养护进度。",
      },
    });

    expect(wrapper.get(".ui-empty__label").text()).toBe("未登记");
    expect(wrapper.get(".ui-empty__title").text()).toBe("暂无在养绿植");
    expect(wrapper.text()).toContain("领养一株后");
  });

  it("can use a custom label", async () => {
    const wrapper = await mountSuspended(UiEmptyState, {
      props: { title: "资料待补全", label: "待补全" },
    });

    expect(wrapper.get(".ui-empty__label").text()).toBe("待补全");
  });
});
