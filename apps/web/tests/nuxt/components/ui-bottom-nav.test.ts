import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import UiBottomNav from "../../../app/components/UiBottomNav.vue";

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
});
