import { request } from "./client";

export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED", "WITHDRAWN"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

/** 管理端资讯摘要，不含正文。 */
export type AdminArticleSummary = {
  id: number;
  title: string;
  category: string;
  summary: string | null;
  coverFileId: number | null;
  status: ArticleStatus;
  authorId: number;
  authorEmail: string;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 管理端资讯详情，包含正文。 */
export type AdminArticleDetail = AdminArticleSummary & {
  content: string;
};

export type ArticleRequest = {
  title: string;
  category: string;
  summary: string | null;
  coverFileId: number | null;
  content: string;
  publish: boolean;
};

const ARTICLES_PATH = "admin/articles";

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus);
}

export function listArticles(
  status?: ArticleStatus,
): Promise<AdminArticleSummary[]> {
  return request<AdminArticleSummary[]>(
    ARTICLES_PATH,
    status ? { searchParams: { status } } : {},
  );
}

export function getArticle(id: number): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${ARTICLES_PATH}/${id}`);
}

export function createArticle(
  input: ArticleRequest,
): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(ARTICLES_PATH, {
    method: "POST",
    json: input,
  });
}

export function updateArticle(
  id: number,
  input: ArticleRequest,
): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${ARTICLES_PATH}/${id}`, {
    method: "PUT",
    json: input,
  });
}

export function publishArticle(id: number): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${ARTICLES_PATH}/${id}/publish`, {
    method: "POST",
  });
}

export function withdrawArticle(id: number): Promise<AdminArticleDetail> {
  return request<AdminArticleDetail>(`${ARTICLES_PATH}/${id}/withdraw`, {
    method: "POST",
  });
}
