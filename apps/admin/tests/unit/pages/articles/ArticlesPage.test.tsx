import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as articlesApi from "@/api/articles";
import { emitToast } from "@/lib/toast-events";
import ArticlesPage from "@/pages/articles/ArticlesPage";
import { makeArticle, makeArticleDetail } from "./fixtures";

vi.mock("@/api/articles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/articles")>();

  return {
    ...actual,
    listArticles: vi.fn(),
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

const listArticles = vi.mocked(articlesApi.listArticles);
const getArticle = vi.mocked(articlesApi.getArticle);
const updateArticle = vi.mocked(articlesApi.updateArticle);
const withdrawArticle = vi.mocked(articlesApi.withdrawArticle);
const emitToastMock = vi.mocked(emitToast);

function renderPage() {
  const router = createMemoryRouter(
    [{ path: "/articles", element: <ArticlesPage /> }],
    { initialEntries: ["/articles"] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

function listRows() {
  const body = document.querySelector(".ant-table-tbody");
  return Array.from(
    body?.querySelectorAll<HTMLElement>("tr.ant-table-row") ?? [],
  );
}

async function selectOption(combobox: HTMLElement, label: string) {
  fireEvent.mouseDown(combobox);

  const dropdown = await waitFor(() => {
    const candidates = Array.from(
      document.querySelectorAll(".ant-select-dropdown"),
    ).filter(
      (element) => !element.classList.contains("ant-select-dropdown-hidden"),
    );
    const last = candidates.at(-1);

    if (!last) {
      throw new Error("select dropdown not found");
    }

    return last as HTMLElement;
  });

  fireEvent.click(within(dropdown).getAllByText(label).at(-1)!);
}

function comboboxes() {
  return screen.getAllByRole("combobox");
}

describe("ArticlesPage", () => {
  beforeEach(() => {
    listArticles.mockReset();
    getArticle.mockReset();
    updateArticle.mockReset();
    withdrawArticle.mockReset();
    emitToastMock.mockReset();
    listArticles.mockResolvedValue([makeArticle()]);
    getArticle.mockResolvedValue(makeArticleDetail());
    updateArticle.mockResolvedValue(makeArticleDetail());
    withdrawArticle.mockResolvedValue(
      makeArticleDetail({ status: "WITHDRAWN" }),
    );
  });

  it("renders article columns and status labels", async () => {
    listArticles.mockResolvedValue([
      makeArticle(),
      makeArticle({
        id: 2,
        title: "校园环保活动",
        category: "环保活动",
        status: "DRAFT",
        authorName: null,
        authorEmail: "editor@qq.com",
        publishedAt: null,
        createdAt: "2026-10-02T09:00:00",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("秋季绿植养护指南")).toBeInTheDocument();
    for (const header of [
      "标题",
      "分类",
      "作者",
      "状态",
      "发布时间",
      "更新时间",
      "操作",
    ]) {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("已发布")).toBeInTheDocument();
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("管理员")).toBeInTheDocument();
    expect(screen.getByText("editor@qq.com")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("applies keyword only after query", async () => {
    listArticles.mockResolvedValue([
      makeArticle(),
      makeArticle({ id: 2, title: "校园环保活动", summary: "校园活动" }),
    ]);
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.change(screen.getByPlaceholderText("标题、摘要或分类"), {
      target: { value: "环保" },
    });
    expect(screen.getByText("秋季绿植养护指南")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("校园环保活动")).toBeInTheDocument();
    expect(screen.queryByText("秋季绿植养护指南")).not.toBeInTheDocument();
  });

  it("filters by status and category", async () => {
    listArticles.mockResolvedValue([
      makeArticle(),
      makeArticle({
        id: 2,
        title: "校园环保活动",
        category: "环保活动",
        status: "DRAFT",
        publishedAt: null,
      }),
    ]);
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    const [status, category] = comboboxes();
    await selectOption(status!, "草稿");
    await selectOption(category!, "环保活动");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByText("校园环保活动")).toBeInTheDocument();
    expect(screen.queryByText("秋季绿植养护指南")).not.toBeInTheDocument();
  });

  it("resets filters and restores all articles", async () => {
    listArticles.mockResolvedValue([
      makeArticle(),
      makeArticle({ id: 2, title: "校园环保活动" }),
    ]);
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.change(screen.getByPlaceholderText("标题、摘要或分类"), {
      target: { value: "环保" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    expect(screen.queryByText("秋季绿植养护指南")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));

    expect(screen.getByText("秋季绿植养护指南")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("标题、摘要或分类")).toHaveValue("");
  });

  it("paginates ten articles at a time", async () => {
    listArticles.mockResolvedValue(
      Array.from({ length: 11 }, (_, index) =>
        makeArticle({
          id: index + 1,
          title: `资讯${index + 1}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );
    renderPage();

    expect(await screen.findByText("共 11 条")).toBeInTheDocument();
    expect(listRows()).toHaveLength(10);

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("资讯1")).toBeInTheDocument();
    expect(listRows()).toHaveLength(1);
  });

  it("shows an empty state when there are no articles", async () => {
    listArticles.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("暂无资讯")).toBeInTheDocument();
  });

  it("shows the filtered empty state", async () => {
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.change(screen.getByPlaceholderText("标题、摘要或分类"), {
      target: { value: "不存在" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(
      await screen.findByText("没有符合筛选条件的资讯"),
    ).toBeInTheDocument();
  });

  it("shows a failure and retries the list", async () => {
    listArticles
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([makeArticle()]);
    renderPage();

    expect(
      await screen.findByText("资讯列表加载失败，请稍后重试"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("秋季绿植养护指南")).toBeInTheDocument();
    expect(listArticles).toHaveBeenCalledTimes(2);
  });

  it("opens the edit drawer", async () => {
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.click(screen.getByRole("button", { name: /编\s*辑/ }));

    expect(
      await screen.findByDisplayValue("秋季绿植养护指南"),
    ).toBeInTheDocument();
    expect(getArticle).toHaveBeenCalledWith(1);
  });

  it("refreshes the list after saving an article", async () => {
    listArticles
      .mockResolvedValueOnce([makeArticle()])
      .mockResolvedValueOnce([makeArticle({ title: "更新后的标题" })]);
    updateArticle.mockResolvedValue(
      makeArticleDetail({ title: "更新后的标题" }),
    );
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.click(screen.getByRole("button", { name: /编\s*辑/ }));
    await screen.findByDisplayValue("秋季绿植养护指南");
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "更新后的标题" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存修改" }));

    await waitFor(() => expect(listArticles).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("更新后的标题")).toBeInTheDocument();
  });

  it("refreshes the list after withdrawing an article", async () => {
    listArticles
      .mockResolvedValueOnce([makeArticle()])
      .mockResolvedValueOnce([makeArticle({ status: "WITHDRAWN" })]);
    renderPage();
    await screen.findByText("秋季绿植养护指南");

    fireEvent.click(screen.getByRole("button", { name: /编\s*辑/ }));
    await screen.findByDisplayValue("秋季绿植养护指南");
    fireEvent.click(screen.getByRole("button", { name: /撤\s*回/ }));
    fireEvent.click(await screen.findByRole("button", { name: "确认撤回" }));

    await waitFor(() => expect(withdrawArticle).toHaveBeenCalledWith(1));
    await waitFor(() => expect(listArticles).toHaveBeenCalledTimes(2));
    expect(emitToastMock).toHaveBeenCalledWith("success", "资讯已撤回");
  });
});
