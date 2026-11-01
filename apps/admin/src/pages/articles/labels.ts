import type { AdminArticleSummary } from "@/api/articles";

export const ARTICLE_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "DRAFT", label: "草稿" },
  { value: "PUBLISHED", label: "已发布" },
  { value: "WITHDRAWN", label: "已撤回" },
] as const;

export type ArticleStatusFilter =
  (typeof ARTICLE_STATUS_OPTIONS)[number]["value"];

export const ARTICLE_CATEGORY_SUGGESTIONS = [
  "养护知识",
  "环保活动",
  "平台公告",
  "校园动态",
] as const;

const ARTICLE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  WITHDRAWN: "已撤回",
};

const ARTICLE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  PUBLISHED: "green",
  WITHDRAWN: "orange",
};

const UNKNOWN = "未知状态";

export function articleStatusLabel(value: string): string {
  return ARTICLE_STATUS_LABELS[value] ?? (value || UNKNOWN);
}

export function articleStatusColor(value: string): string {
  return ARTICLE_STATUS_COLORS[value] ?? "default";
}

export function articleAuthorLabel(
  article: Pick<AdminArticleSummary, "authorName" | "authorEmail">,
): string {
  return article.authorName || article.authorEmail;
}
