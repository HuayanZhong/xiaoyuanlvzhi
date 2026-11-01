import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Empty,
  Flex,
  Input,
  Select,
  Tag,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listArticles, type AdminArticleSummary } from "@/api/articles";
import AdminTable from "@/components/common/AdminTable";
import LoadFailure from "@/components/common/LoadFailure";
import ModulePage from "@/components/common/ModulePage";
import { formatDateTime } from "@/lib/format";
import ArticleFormDrawer from "./ArticleFormDrawer";
import {
  ARTICLE_STATUS_OPTIONS,
  articleAuthorLabel,
  articleStatusColor,
  articleStatusLabel,
  type ArticleStatusFilter,
} from "./labels";

const PAGE_SIZE = 10;

type ArticleFilters = {
  keyword: string;
  status: ArticleStatusFilter;
  category: string;
};

const EMPTY_FILTERS: ArticleFilters = {
  keyword: "",
  status: "all",
  category: "all",
};

function sortArticles(items: AdminArticleSummary[]): AdminArticleSummary[] {
  return (
    [...items]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byCreated = right.createdAt.localeCompare(left.createdAt);
        return byCreated !== 0 ? byCreated : right.id - left.id;
      })
  );
}

/** 资讯管理：摘要列表、筛选、分页和编辑入口。 */
export default function ArticlesPage() {
  const [articles, setArticles] = useState<AdminArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<ArticleFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<ArticleFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      setArticles(sortArticles(await listArticles()));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 首次进入资讯管理页时加载摘要列表；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次加载资讯列表
    void loadArticles();
  }, [loadArticles]);

  const categoryNames = useMemo(() => {
    const values = [
      ...new Set(articles.map((article) => article.category).filter(Boolean)),
    ];
    // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
    values.sort((left, right) => left.localeCompare(right, "zh-CN"));
    return values;
  }, [articles]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "全部分类" },
      ...categoryNames.map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [categoryNames],
  );

  const filtered = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesKeyword =
        !keyword ||
        [article.title, article.summary, article.category].some((value) =>
          value?.toLowerCase().includes(keyword),
        );
      const matchesStatus =
        filters.status === "all" || article.status === filters.status;
      const matchesCategory =
        filters.category === "all" || article.category === filters.category;

      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [articles, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const applyFilters = () => {
    setFilters(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (record: AdminArticleSummary) => {
    setEditingId(record.id);
    setEditorOpen(true);
  };

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingId(null);
  }, []);

  const refreshAfterChange = useCallback(() => {
    setEditorOpen(false);
    setEditingId(null);
    void loadArticles();
  }, [loadArticles]);

  const columns: TableColumnsType<AdminArticleSummary> = [
    {
      title: "标题",
      dataIndex: "title",
      width: 260,
      ellipsis: true,
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 130,
    },
    {
      title: "作者",
      key: "author",
      width: 140,
      render: (_: unknown, record) => articleAuthorLabel(record),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={articleStatusColor(value)}>{articleStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "发布时间",
      dataIndex: "publishedAt",
      width: 170,
      render: (value: string | null) => (value ? formatDateTime(value) : "—"),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "actions",
      width: 90,
      render: (_: unknown, record) => (
        <Button size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  const emptyState = (
    <Empty
      description={
        articles.length === 0 ? "暂无资讯" : "没有符合筛选条件的资讯"
      }
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Flex gap={8} justify="center" wrap>
        <Button onClick={() => void loadArticles()}>刷新</Button>
        <Button onClick={resetFilters}>清空筛选</Button>
      </Flex>
    </Empty>
  );

  return (
    <ModulePage
      extra={
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          新增资讯
        </Button>
      }
      title="资讯管理"
    >
      <Flex gap={16} vertical>
        <Flex align="center" gap={12} wrap>
          <Input
            allowClear
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                keyword: event.target.value,
              }))
            }
            onPressEnter={applyFilters}
            placeholder="标题、摘要或分类"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={draft.keyword}
          />
          <Select<ArticleStatusFilter>
            onChange={(status) =>
              setDraft((current) => ({ ...current, status }))
            }
            options={[...ARTICLE_STATUS_OPTIONS]}
            style={{ width: 140 }}
            value={draft.status}
          />
          <Select<string>
            onChange={(category) =>
              setDraft((current) => ({ ...current, category }))
            }
            options={categoryOptions}
            style={{ width: 160 }}
            value={draft.category}
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
        </Flex>

        {failed ? (
          <LoadFailure
            message="资讯列表加载失败，请稍后重试"
            onRetry={() => void loadArticles()}
          />
        ) : (
          <AdminTable<AdminArticleSummary>
            columns={columns}
            dataSource={filtered}
            loading={loading}
            locale={{ emptyText: emptyState }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              onChange: setPage,
            }}
            rowKey="id"
            scroll={{ x: 1060 }}
          />
        )}
      </Flex>

      <ArticleFormDrawer
        articleId={editingId}
        categories={categoryNames}
        onClose={closeEditor}
        onMissing={refreshAfterChange}
        onSaved={refreshAfterChange}
        open={editorOpen}
      />
    </ModulePage>
  );
}
