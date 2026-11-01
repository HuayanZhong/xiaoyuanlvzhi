import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createArticle,
  getArticle,
  isArticleStatus,
  listArticles,
  publishArticle,
  updateArticle,
  withdrawArticle,
  type ArticleRequest,
} from "@/api/articles";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);
const post = vi.mocked(http.post);
const put = vi.mocked(http.put);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

const request: ArticleRequest = {
  title: "秋季养护",
  category: "养护知识",
  summary: "摘要",
  coverFileId: null,
  content: "正文",
  publish: false,
};

describe("articles api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("lists all articles", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await expect(listArticles()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith("admin/articles", {});
  });

  it("filters articles by status", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await listArticles("PUBLISHED");

    expect(get).toHaveBeenCalledWith("admin/articles", {
      searchParams: { status: "PUBLISHED" },
    });
  });

  it("loads article detail", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await expect(getArticle(5)).resolves.toEqual({ id: 5 });
    expect(get).toHaveBeenCalledWith("admin/articles/5", {});
  });

  it("creates an article", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await createArticle(request);

    expect(post).toHaveBeenCalledWith("admin/articles", { json: request });
  });

  it("updates an article", async () => {
    put.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await updateArticle(5, request);

    expect(put).toHaveBeenCalledWith("admin/articles/5", { json: request });
  });

  it("publishes and withdraws an article", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: { id: 5 }, error: null }),
    );

    await publishArticle(5);
    await withdrawArticle(5);

    expect(post).toHaveBeenNthCalledWith(1, "admin/articles/5/publish", {});
    expect(post).toHaveBeenNthCalledWith(2, "admin/articles/5/withdraw", {});
  });

  it("rejects a failed envelope", async () => {
    get.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "ARTICLE_NOT_FOUND", message: "资讯不存在" },
      }),
    );

    await expect(getArticle(9)).rejects.toMatchObject({
      code: "ARTICLE_NOT_FOUND",
      message: "资讯不存在",
    });
  });

  it("recognizes known article statuses", () => {
    expect(isArticleStatus("DRAFT")).toBe(true);
    expect(isArticleStatus("PUBLISHED")).toBe(true);
    expect(isArticleStatus("WITHDRAWN")).toBe(true);
    expect(isArticleStatus("ARCHIVED")).toBe(false);
  });
});
