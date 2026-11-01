import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as articlesApi from "@/api/articles";
import { emitToast } from "@/lib/toast-events";
import ArticleFormDrawer from "@/pages/articles/ArticleFormDrawer";
import { makeArticleDetail } from "./fixtures";

vi.mock("@/api/articles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/articles")>();

  return {
    ...actual,
    getArticle: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    withdrawArticle: vi.fn(),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const getArticle = vi.mocked(articlesApi.getArticle);
const createArticle = vi.mocked(articlesApi.createArticle);
const updateArticle = vi.mocked(articlesApi.updateArticle);
const withdrawArticle = vi.mocked(articlesApi.withdrawArticle);
const emitToastMock = vi.mocked(emitToast);

function renderDrawer(
  overrides: Partial<Parameters<typeof ArticleFormDrawer>[0]> = {},
) {
  const props = {
    open: true,
    articleId: null,
    categories: [],
    onClose: vi.fn(),
    onSaved: vi.fn(),
    onMissing: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <ArticleFormDrawer {...props} />
    </ConfigProvider>,
  );

  return props;
}

function fillForm(
  overrides: {
    title?: string;
    category?: string;
    summary?: string;
    content?: string;
  } = {},
) {
  fireEvent.change(screen.getByLabelText("标题"), {
    target: { value: overrides.title ?? "秋季养护" },
  });
  fireEvent.change(screen.getByLabelText("分类"), {
    target: { value: overrides.category ?? "养护知识" },
  });
  fireEvent.change(screen.getByLabelText("摘要"), {
    target: { value: overrides.summary ?? "摘要" },
  });
  fireEvent.change(screen.getByLabelText("正文"), {
    target: { value: overrides.content ?? "正文内容" },
  });
}

describe("ArticleFormDrawer", () => {
  beforeEach(() => {
    getArticle.mockReset();
    createArticle.mockReset();
    updateArticle.mockReset();
    withdrawArticle.mockReset();
    emitToastMock.mockReset();
    getArticle.mockResolvedValue(makeArticleDetail());
    createArticle.mockResolvedValue(
      makeArticleDetail({ status: "DRAFT", publishedAt: null }),
    );
    updateArticle.mockResolvedValue(makeArticleDetail());
    withdrawArticle.mockResolvedValue(
      makeArticleDetail({ status: "WITHDRAWN" }),
    );
  });

  it("creates a draft with trimmed fields", async () => {
    const props = renderDrawer();

    fillForm({
      title: "  秋季养护  ",
      category: "  养护知识  ",
      summary: "  摘要  ",
      content: "  正文内容  ",
    });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() =>
      expect(createArticle).toHaveBeenCalledWith({
        title: "秋季养护",
        category: "养护知识",
        summary: "摘要",
        coverFileId: null,
        content: "正文内容",
        publish: false,
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "资讯已保存为草稿");
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("publishes directly", async () => {
    renderDrawer();

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /发\s*布/ }));

    await waitFor(() =>
      expect(createArticle).toHaveBeenCalledWith(
        expect.objectContaining({ publish: true }),
      ),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "资讯已发布");
  });

  it("loads detail and saves a published article without changing status", async () => {
    const props = renderDrawer({ articleId: 1 });

    expect(
      await screen.findByDisplayValue("秋季绿植养护指南"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "新的标题" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() =>
      expect(updateArticle).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: "新的标题", publish: false }),
      ),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "资讯已更新");
    expect(props.onSaved).toHaveBeenCalled();
  });

  it("withdraws a published article after confirmation", async () => {
    const props = renderDrawer({ articleId: 1 });

    await screen.findByDisplayValue("秋季绿植养护指南");
    fireEvent.click(screen.getByRole("button", { name: /撤\s*回/ }));
    fireEvent.click(await screen.findByRole("button", { name: "确认撤回" }));

    await waitFor(() => expect(withdrawArticle).toHaveBeenCalledWith(1));
    expect(emitToastMock).toHaveBeenCalledWith("success", "资讯已撤回");
    expect(props.onSaved).toHaveBeenCalled();
  });

  it("rejects a blank title before calling the API", async () => {
    renderDrawer();

    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    expect(await screen.findByText("请填写标题")).toBeInTheDocument();
    expect(createArticle).not.toHaveBeenCalled();
  });

  it("keeps form values when saving fails", async () => {
    createArticle.mockRejectedValue(
      new ApiError("INVALID_REQUEST", "标题最多 80 字", 400),
    );
    const props = renderDrawer();

    fillForm({ title: "保留的标题" });
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith("error", "标题最多 80 字"),
    );
    expect(screen.getByLabelText("标题")).toHaveValue("保留的标题");
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("maps file errors to a Chinese message", async () => {
    createArticle.mockRejectedValue(
      new ApiError("FILE_NOT_PUBLIC", "封面错误", 400),
    );
    renderDrawer();

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "保存草稿" }));

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith("error", "封面必须是公开图片"),
    );
  });

  it("closes and reports a missing article", async () => {
    getArticle.mockRejectedValue(
      new ApiError("ARTICLE_NOT_FOUND", "资讯不存在", 404),
    );
    const props = renderDrawer({ articleId: 9 });

    await waitFor(() => expect(props.onMissing).toHaveBeenCalled());
    expect(props.onClose).toHaveBeenCalled();
    expect(emitToastMock).toHaveBeenCalledWith("error", "资讯不存在");
  });

  it("shows a retry when detail loading fails", async () => {
    getArticle
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(makeArticleDetail());
    renderDrawer({ articleId: 1 });

    expect(
      await screen.findByText("资讯详情加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(
      await screen.findByDisplayValue("秋季绿植养护指南"),
    ).toBeInTheDocument();
    expect(getArticle).toHaveBeenCalledTimes(2);
  });
});
