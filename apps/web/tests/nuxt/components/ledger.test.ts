import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import { h } from "vue";
import Ledger from "../../../app/components/Ledger.vue";
import TagRow from "../../../app/components/TagRow.vue";

describe("Ledger", () => {
  it("renders an empty ledger container", async () => {
    const wrapper = await mountSuspended(Ledger);

    expect(wrapper.find(".ui-ledger").exists()).toBe(true);
    expect(wrapper.findAll(".ui-tag-row")).toHaveLength(0);
  });

  it("renders a single row", async () => {
    const wrapper = await mountSuspended(Ledger, {
      slots: {
        default: () => h(TagRow, { label: "当前积分", value: "120" }),
      },
    });

    expect(wrapper.findAll(".ui-tag-row")).toHaveLength(1);
  });

  it("renders multiple rows", async () => {
    const wrapper = await mountSuspended(Ledger, {
      slots: {
        default: () => [
          h(TagRow, { label: "当前积分", value: "120" }),
          h(TagRow, { label: "在养绿植", value: "2" }),
        ],
      },
    });

    expect(wrapper.findAll(".ui-tag-row")).toHaveLength(2);
    expect(wrapper.text()).toContain("当前积分");
    expect(wrapper.text()).toContain("在养绿植");
  });
});
