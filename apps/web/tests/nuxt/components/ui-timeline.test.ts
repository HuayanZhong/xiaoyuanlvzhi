import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiTimeline from "../../../app/components/UiTimeline.vue";

const items = [
  {
    title: "提交申请",
    time: "2026-10-01T09:00:00",
    note: "希望在宿舍养护",
  },
  { title: "审核通过", time: "2026-10-02T10:30:00" },
  { title: "完成交接", time: "2026-10-03T16:00:00" },
];

describe("UiTimeline", () => {
  it("shows the newest event first and formats each time", async () => {
    const wrapper = await mountSuspended(UiTimeline, { props: { items } });

    const titles = wrapper
      .findAll(".ui-timeline__title")
      .map((item) => item.text());
    const times = wrapper
      .findAll(".ui-timeline__time")
      .map((item) => item.text());

    expect(titles).toEqual(["完成交接", "审核通过", "提交申请"]);
    expect(times[0]).toBe("2026.10.03 16:00");
    expect(wrapper.text()).toContain("希望在宿舍养护");
  });

  it("can keep the oldest event first", async () => {
    const wrapper = await mountSuspended(UiTimeline, {
      props: { items, order: "oldest-first" },
    });

    expect(
      wrapper.findAll(".ui-timeline__title").map((item) => item.text()),
    ).toEqual(["提交申请", "审核通过", "完成交接"]);
  });

  it("explains an empty timeline", async () => {
    const wrapper = await mountSuspended(UiTimeline, { props: { items: [] } });

    expect(wrapper.get(".ui-timeline__empty").text()).toBe("暂无状态记录");
  });
});
