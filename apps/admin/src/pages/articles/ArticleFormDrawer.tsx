import {
  AutoComplete,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Popconfirm,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createArticle,
  getArticle,
  updateArticle,
  withdrawArticle,
  type AdminArticleDetail,
  type ArticleRequest,
} from "@/api/articles";
import LoadFailure from "@/components/common/LoadFailure";
import { SingleImageUpload } from "@/components/common/ImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";
import { emitToast } from "@/lib/toast-events";
import {
  ARTICLE_CATEGORY_SUGGESTIONS,
  articleStatusColor,
  articleStatusLabel,
} from "./labels";

type ArticleFormDrawerProps = {
  open: boolean;
  articleId: number | null;
  categories: string[];
  onClose: () => void;
  onSaved: (article: AdminArticleDetail) => void;
  onMissing: () => void;
};

type ArticleFormValues = {
  title: string;
  category: string;
  summary: string;
  coverFileId: number | null;
  content: string;
};

const EMPTY_VALUES: ArticleFormValues = {
  title: "",
  category: "",
  summary: "",
  coverFileId: null,
  content: "",
};

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case "FILE_NOT_PUBLIC":
      return "封面必须是公开图片";
    case "FILE_NOT_FOUND":
      return "封面图片不存在";
    case "ARTICLE_STATUS_INVALID":
      return "当前状态不能撤回";
    default:
      return error.message || fallback;
  }
}

/** 新增/编辑资讯；保存内容不改变发布状态，撤回单独确认。 */
export default function ArticleFormDrawer({
  open,
  articleId,
  categories,
  onClose,
  onSaved,
  onMissing,
}: ArticleFormDrawerProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<ArticleFormValues>();
  const [detail, setDetail] = useState<AdminArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const loadDetail = useCallback(async () => {
    if (articleId == null) {
      return;
    }

    setLoading(true);
    setFailed(false);

    try {
      setDetail(await getArticle(articleId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      if (error instanceof ApiError && error.status === 404) {
        emitToast("error", error.message || "资讯不存在");
        onMissing();
        onClose();
        return;
      }

      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [articleId, onClose, onMissing]);

  useEffect(() => {
    if (!open) {
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 每次打开抽屉重置上一篇资讯
    setDetail(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 每次打开抽屉重置失败状态
    setFailed(false);
    form.resetFields();

    if (articleId == null) {
      form.setFieldsValue(EMPTY_VALUES);
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 打开编辑时请求详情
    void loadDetail();
  }, [articleId, form, loadDetail, open]);

  useEffect(() => {
    if (!open || !detail) {
      return;
    }

    form.setFieldsValue({
      title: detail.title,
      category: detail.category,
      summary: detail.summary ?? "",
      coverFileId: detail.coverFileId,
      content: detail.content,
    });
  }, [detail, form, open]);

  const categoryOptions = useMemo(() => {
    const values = [
      ...new Set([...categories, ...ARTICLE_CATEGORY_SUGGESTIONS]),
    ].filter(Boolean);

    return values.map((value) => ({ value }));
  }, [categories]);

  const notifyError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError && error.status === 401) {
      return;
    }

    if (error instanceof ApiError && error.status === 404) {
      emitToast("error", error.message || "资讯不存在");
      onMissing();
      onClose();
      return;
    }

    emitToast("error", errorMessage(error, fallback));
  };

  const submit = async (publish: boolean) => {
    if (savingRef.current) {
      return;
    }

    let values: ArticleFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    const input: ArticleRequest = {
      title: values.title.trim(),
      category: values.category.trim(),
      summary: values.summary?.trim() || null,
      coverFileId: values.coverFileId ?? null,
      content: values.content.trim(),
      publish,
    };

    try {
      const result =
        articleId == null
          ? await createArticle(input)
          : await updateArticle(articleId, input);

      if (articleId == null) {
        emitToast("success", publish ? "资讯已发布" : "资讯已保存为草稿");
      } else if (publish) {
        emitToast(
          "success",
          detail?.status === "WITHDRAWN" ? "资讯已重新发布" : "资讯已发布",
        );
      } else {
        emitToast("success", "资讯已更新");
      }

      onSaved(result);
      onClose();
    } catch (error) {
      notifyError(error, "保存失败，请稍后重试");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (articleId == null || savingRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const result = await withdrawArticle(articleId);
      emitToast("success", "资讯已撤回");
      onSaved(result);
      onClose();
    } catch (error) {
      notifyError(error, "撤回失败，请稍后重试");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) {
      onClose();
    }
  };

  const footer =
    loading || (articleId != null && (failed || !detail)) ? (
      <Flex justify="flex-end">
        <Button onClick={close}>关闭</Button>
      </Flex>
    ) : (
      <Flex gap={8} justify="flex-end" wrap>
        <Button disabled={saving} onClick={close}>
          取消
        </Button>

        {detail?.status === "PUBLISHED" ? (
          <>
            <Button disabled={saving} onClick={() => void submit(false)}>
              保存修改
            </Button>
            <Popconfirm
              cancelText="继续编辑"
              description="撤回后学生端不再显示该资讯，历史记录保留。"
              disabled={saving}
              okText="确认撤回"
              onConfirm={() => void withdraw()}
              title="确认撤回这条资讯？"
            >
              <Button danger disabled={saving}>
                撤回
              </Button>
            </Popconfirm>
          </>
        ) : detail?.status === "WITHDRAWN" ? (
          <>
            <Button disabled={saving} onClick={() => void submit(false)}>
              保存修改
            </Button>
            <Button
              loading={saving}
              type="primary"
              onClick={() => void submit(true)}
            >
              重新发布
            </Button>
          </>
        ) : (
          <>
            <Button disabled={saving} onClick={() => void submit(false)}>
              保存草稿
            </Button>
            <Button
              loading={saving}
              type="primary"
              onClick={() => void submit(true)}
            >
              发布
            </Button>
          </>
        )}
      </Flex>
    );

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={close}
      open={open}
      size={isMobile ? "100%" : 720}
      title={
        <Flex align="center" gap={8} wrap>
          <span>{articleId == null ? "新增资讯" : "编辑资讯"}</span>
          {detail && (
            <Tag color={articleStatusColor(detail.status)}>
              {articleStatusLabel(detail.status)}
            </Tag>
          )}
        </Flex>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : failed ? (
        <LoadFailure
          message="资讯详情加载失败，请稍后重试"
          onRetry={() => void loadDetail()}
        />
      ) : (
        <Flex gap={16} vertical>
          <Typography.Text type="secondary">
            正文按纯文本保存，换行会保留。
          </Typography.Text>

          <Form<ArticleFormValues> form={form} layout="vertical">
            <Form.Item
              label="标题"
              name="title"
              rules={[
                { required: true, message: "请填写标题" },
                { max: 80, message: "标题最多 80 字" },
              ]}
            >
              <Input
                maxLength={80}
                placeholder="例如：秋季绿植养护指南"
                showCount
              />
            </Form.Item>

            <Form.Item
              label="分类"
              name="category"
              rules={[
                { required: true, message: "请选择或填写分类" },
                { max: 40, message: "分类最多 40 字" },
              ]}
            >
              <AutoComplete
                allowClear
                filterOption={(inputValue, option) =>
                  String(option?.value ?? "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                options={categoryOptions}
              >
                <Input maxLength={40} placeholder="例如：养护知识" />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              label="摘要"
              name="summary"
              rules={[{ max: 200, message: "摘要最多 200 字" }]}
            >
              <Input.TextArea
                autoSize={{ maxRows: 4, minRows: 2 }}
                maxLength={200}
                placeholder="最多 200 字"
                showCount
              />
            </Form.Item>

            <Form.Item label="封面" name="coverFileId">
              <SingleImageUpload />
            </Form.Item>

            <Form.Item
              label="正文"
              name="content"
              rules={[{ required: true, message: "请填写正文" }]}
            >
              <Input.TextArea
                autoSize={{ maxRows: 24, minRows: 12 }}
                placeholder="请输入资讯正文"
              />
            </Form.Item>
          </Form>
        </Flex>
      )}
    </Drawer>
  );
}
