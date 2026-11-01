import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiBottomNav from "../../../app/components/UiBottomNav.vue";
import { STUDENT_NAV } from "../../../app/utils/navigation";

const items = [
  { label: "首页", to: "/" },
  { label: "我的", to: "/me" },
];

describe("UiBottomNav", () => {
  it("marks the current item with aria-current", async () => {
    const wrapper = await mountSuspended(UiBottomNav, {
      props: { items, currentPath: "/me" },
    });

    const links = wrapper.findAll("a");
    expect(links.map((link) => link.attributes("aria-current"))).toEqual([
      undefined,
      "page",
    ]);
  });

  it("links each item to its route", async () => {
    const wrapper = await mountSuspended(UiBottomNav, {
      props: { items, currentPath: "/" },
    });

    expect(wrapper.findAll("a").map((link) => link.attributes("href"))).toEqual(
      ["/", "/me"],
    );
  });

  it("highlights the current item and keeps every item keyboard focusable", async () => {
    const wrapper = await mountSuspended(UiBottomNav, {
      props: { items, currentPath: "/me" },
      attachTo: document.body,
    });

    const links = wrapper.findAll("a");
    expect(links[1]!.classes()).toContain("ui-bottom-nav__link--active");
    expect(links[0]!.classes()).not.toContain("ui-bottom-nav__link--active");

    links[0]!.element.focus();
    expect(document.activeElement).toBe(links[0]!.element);
    expect(
      links.every((link) => link.attributes("tabindex") === undefined),
    ).toBe(true);
  });

  it("exposes the implemented student modules and selects the plant entry", async () => {
    const wrapper = await mountSuspended(UiBottomNav, {
      props: { items: STUDENT_NAV, currentPath: "/plants/3" },
    });

    const links = wrapper.findAll("a");
    expect(links.map((link) => link.text())).toEqual([
      "首页",
      "绿植",
      "任务",
      "积分",
      "我的",
    ]);
    expect(links.map((link) => link.attributes("href"))).toEqual([
      "/",
      "/plants",
      "/tasks",
      "/points",
      "/me",
    ]);
    expect(links[1]!.attributes("aria-current")).toBe("page");
    expect(links[0]!.attributes("aria-current")).toBeUndefined();
  });

  it("selects the task entry on task detail pages", async () => {
    const wrapper = await mountSuspended(UiBottomNav, {
      props: { items: STUDENT_NAV, currentPath: "/tasks/7" },
    });

    const links = wrapper.findAll("a");
    expect(links[2]!.attributes("aria-current")).toBe("page");
    expect(links[2]!.classes()).toContain("ui-bottom-nav__link--active");
  });

  it("selects the points entry on points and rewards pages", async () => {
    const paths = ["/points", "/rewards", "/rewards/orders/9"];
    const wrappers = await Promise.all(
      paths.map((currentPath) =>
        mountSuspended(UiBottomNav, {
          props: { items: STUDENT_NAV, currentPath },
        }),
      ),
    );

    for (const wrapper of wrappers) {
      const links = wrapper.findAll("a");
      expect(links[3]!.attributes("aria-current")).toBe("page");
      expect(links[3]!.classes()).toContain("ui-bottom-nav__link--active");
      expect(links[2]!.attributes("aria-current")).toBeUndefined();
    }
  });
});
