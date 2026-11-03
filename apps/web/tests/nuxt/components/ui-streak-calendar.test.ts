import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiStreakCalendar from "../../../app/components/UiStreakCalendar.vue";

describe("UiStreakCalendar", () => {
  it("renders done days as leaf stickers and labels empty days", async () => {
    const wrapper = await mountSuspended(UiStreakCalendar, {
      props: {
        title: "打卡日历",
        caption: "已打卡 2 次",
        items: [
          { key: "2026-11-01", label: "01", done: true },
          { key: "2026-11-02", label: "02", done: true, today: true },
          { key: "2026-11-03", label: "03" },
        ],
      },
    });

    expect(wrapper.get(".ui-streak__title").text()).toBe("打卡日历");
    expect(wrapper.get(".ui-streak__caption").text()).toBe("已打卡 2 次");
    expect(wrapper.findAll(".ui-streak__cell--done")).toHaveLength(2);
    expect(wrapper.find(".ui-streak__cell--today").exists()).toBe(true);
    expect(wrapper.text()).toContain("03");
  });
});
