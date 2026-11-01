import type { AdminArticleDetail, AdminArticleSummary } from "@/api/articles";

export function makeArticle(
  overrides: Partial<AdminArticleSummary> = {},
): AdminArticleSummary {
  return {
    id: 1,
    title: "秋季绿植养护指南",
    category: "养护知识",
    summary: "秋季浇水与光照注意事项",
    coverFileId: null,
    status: "PUBLISHED",
    authorId: 1,
    authorEmail: "admin@qq.com",
    authorName: "管理员",
    publishedAt: "2026-10-01T09:00:00",
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-02T09:00:00",
    ...overrides,
  };
}

export function makeArticleDetail(
  overrides: Partial<AdminArticleDetail> = {},
): AdminArticleDetail {
  return {
    ...makeArticle(),
    content: "秋季气温下降，绿植需要减少浇水。",
    ...overrides,
  };
}
