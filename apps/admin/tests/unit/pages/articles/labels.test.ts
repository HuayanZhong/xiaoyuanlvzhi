import { describe, expect, it } from "vitest";
import {
  articleAuthorLabel,
  articleStatusColor,
  articleStatusLabel,
} from "@/pages/articles/labels";

describe("articles labels", () => {
  it("maps article statuses to Chinese labels", () => {
    expect(articleStatusLabel("DRAFT")).toBe("草稿");
    expect(articleStatusLabel("PUBLISHED")).toBe("已发布");
    expect(articleStatusLabel("WITHDRAWN")).toBe("已撤回");
    expect(articleStatusLabel("ARCHIVED")).toBe("ARCHIVED");
    expect(articleStatusLabel("")).toBe("未知状态");
  });

  it("maps article statuses to colors", () => {
    expect(articleStatusColor("DRAFT")).toBe("default");
    expect(articleStatusColor("PUBLISHED")).toBe("green");
    expect(articleStatusColor("WITHDRAWN")).toBe("orange");
    expect(articleStatusColor("ARCHIVED")).toBe("default");
  });

  it("prefers the author name and falls back to email", () => {
    expect(
      articleAuthorLabel({ authorName: "管理员", authorEmail: "admin@qq.com" }),
    ).toBe("管理员");
    expect(
      articleAuthorLabel({ authorName: null, authorEmail: "admin@qq.com" }),
    ).toBe("admin@qq.com");
  });
});
