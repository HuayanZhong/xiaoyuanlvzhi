import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Skeleton,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { DescriptionsProps, TimelineProps } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StudentView } from "@/api/accounts";
import { ApiError } from "@/api/client";
import {
  closeFeedback,
  getFeedback,
  replyFeedback,
  startFeedback,
  type FeedbackView,
} from "@/api/feedback";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import LoadFailure from "@/components/common/LoadFailure";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import FeedbackActionModal, {
  type FeedbackActionMode,
} from "./FeedbackActionModal";
import { feedbackActionError, isStaleFeedbackError } from "./errors";
import {
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTypeLabel,
  relatedBusinessLabel,
} from "./labels";

type FeedbackDetailDrawerProps = {
  open: boolean;
  feedbackId: number | null;
  students: StudentView[];
  initialAction: FeedbackActionMode | null;
  onClose: () => void;
  onChanged: () => void;
  onActionConsumed: () => void;
};

function sortedTimeline(feedback: FeedbackView) {
  return (
    [...feedback.timeline]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = left.createdAt.localeCompare(right.createdAt);
        return byTime !== 0 ? byTime : left.id - right.id;
      })
  );
}

/** 反馈详情：描述、图片、回复和完整处理时间线；操作成功后就地刷新。 */
export default function FeedbackDetailDrawer({
  open,
  feedbackId,
  students,
  initialAction,
  onClose,
  onChanged,
  onActionConsumed,
}: FeedbackDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<FeedbackView | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [actionMode, setActionMode] = useState<FeedbackActionMode | null>(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const actionRef = useRef(false);
  const startRef = useRef(false);

  const loadDetail = useCallback(async () => {
    if (feedbackId == null) {
      return;
    }

    setLoading(true);
    setFailed(false);

    try {
      setDetail(await getFeedback(feedbackId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [feedbackId]);

  useEffect(() => {
    if (!open || feedbackId == null) {
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置详情状态
    setDetail(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置失败状态
    setFailed(false);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时关闭上一次操作弹窗
    setActionMode(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时清除上一次操作错误
    setActionError(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时按反馈 ID 请求详情
    void loadDetail();
  }, [feedbackId, loadDetail, open]);

  useEffect(() => {
    if (!detail || !initialAction) {
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 详情加载后响应列表带入的操作意图
    setActionMode(initialAction);
    onActionConsumed();
  }, [detail, initialAction, onActionConsumed]);

  const student = detail
    ? students.find((item) => item.id === detail.studentId)
    : undefined;

  const start = async () => {
    if (!detail || startRef.current) {
      return;
    }

    startRef.current = true;
    setStarting(true);

    try {
      const updated = await startFeedback(detail.id);

      setDetail(updated);
      emitToast("success", "已开始处理");
      onChanged();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      emitToast(
        "error",
        feedbackActionError(error, "开始处理失败，请稍后重试"),
      );

      if (isStaleFeedbackError(error)) {
        await loadDetail();
        onChanged();
      }
    } finally {
      startRef.current = false;
      setStarting(false);
    }
  };

  const submitAction = async (value: string) => {
    if (!detail || !actionMode || actionRef.current) {
      return;
    }

    actionRef.current = true;
    setActionSaving(true);
    setActionError(null);

    try {
      const updated =
        actionMode === "reply"
          ? await replyFeedback(detail.id, { reply: value })
          : await closeFeedback(detail.id, { conclusion: value });

      setDetail(updated);
      setActionMode(null);
      emitToast(
        "success",
        actionMode === "reply" ? "回复成功，已通知学生" : "反馈已关闭",
      );
      onChanged();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      if (isStaleFeedbackError(error)) {
        setActionMode(null);
        emitToast("error", feedbackActionError(error, "操作失败，请稍后重试"));
        await loadDetail();
        onChanged();
      } else {
        setActionError(feedbackActionError(error, "操作失败，请稍后重试"));
      }
    } finally {
      actionRef.current = false;
      setActionSaving(false);
    }
  };

  const descriptionItems: DescriptionsProps["items"] = detail
    ? [
        { key: "feedbackNo", label: "反馈编号", children: detail.feedbackNo },
        {
          key: "student",
          label: "学生",
          children: (
            <Flex gap={4} vertical>
              <span>{student?.fullName || detail.studentEmail}</span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {student?.studentNumber || detail.studentEmail}
              </Typography.Text>
            </Flex>
          ),
        },
        {
          key: "type",
          label: "类型",
          children: feedbackTypeLabel(detail.type),
        },
        {
          key: "related",
          label: "关联业务",
          children: relatedBusinessLabel(detail.relatedType, detail.relatedId),
        },
        {
          key: "status",
          label: "状态",
          children: (
            <Tag color={feedbackStatusColor(detail.status)}>
              {feedbackStatusLabel(detail.status)}
            </Tag>
          ),
        },
        {
          key: "createdAt",
          label: "提交时间",
          children: formatDateTime(detail.createdAt),
        },
        {
          key: "handler",
          label: "处理人",
          children: detail.handlerEmail || "—",
        },
        {
          key: "handledAt",
          label: "处理时间",
          children: formatDateTime(detail.handledAt),
        },
      ]
    : [];

  const timelineItems: TimelineProps["items"] = detail
    ? sortedTimeline(detail).map((item) => ({
        key: item.id,
        color: feedbackStatusColor(item.toStatus),
        content: (
          <Flex gap={2} vertical>
            <Typography.Text strong>
              {feedbackStatusLabel(item.toStatus)}
            </Typography.Text>
            <Typography.Text>{item.message || "—"}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {item.actorEmail || "系统"} · {formatDateTime(item.createdAt)}
            </Typography.Text>
          </Flex>
        ),
      }))
    : [];

  const footer = detail ? (
    <Flex gap={8} justify="flex-end" wrap>
      {detail.status === "PENDING" && (
        <Button loading={starting} onClick={() => void start()}>
          开始处理
        </Button>
      )}
      {(detail.status === "PENDING" || detail.status === "IN_PROGRESS") && (
        <Button
          type="primary"
          onClick={() => {
            setActionError(null);
            setActionMode("reply");
          }}
        >
          回复
        </Button>
      )}
      {(detail.status === "IN_PROGRESS" || detail.status === "REPLIED") && (
        <Button
          danger
          onClick={() => {
            setActionError(null);
            setActionMode("close");
          }}
        >
          关闭
        </Button>
      )}
    </Flex>
  ) : null;

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={onClose}
      open={open}
      size={isMobile ? "100%" : 640}
      title={
        detail ? (
          <Flex align="center" gap={8}>
            <span>{detail.feedbackNo}</span>
            <Tag color={feedbackStatusColor(detail.status)}>
              {feedbackStatusLabel(detail.status)}
            </Tag>
          </Flex>
        ) : (
          "反馈详情"
        )
      }
    >
      {loading ? (
        <Skeleton active />
      ) : failed ? (
        <LoadFailure
          message="反馈详情加载失败，请稍后重试"
          onRetry={() => void loadDetail()}
        />
      ) : detail ? (
        <Flex gap={24} vertical>
          <Descriptions
            column={isMobile ? 1 : 2}
            items={descriptionItems}
            size="small"
          />

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              问题描述
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {detail.description}
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              反馈图片
            </Typography.Title>
            {detail.imageFileIds.length > 0 ? (
              <Flex gap={8} wrap>
                {detail.imageFileIds.slice(0, 3).map((fileId) => (
                  <AuthenticatedImage
                    alt={`反馈图片 ${fileId}`}
                    fileId={fileId}
                    height={96}
                    key={fileId}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                    width={96}
                  />
                ))}
              </Flex>
            ) : (
              <Typography.Text type="secondary">无图片</Typography.Text>
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              管理员回复
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0 }}>
              {detail.adminReply || (
                <Typography.Text type="secondary">暂无回复</Typography.Text>
              )}
            </Typography.Paragraph>
          </div>

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              处理时间线
            </Typography.Title>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty
                description="暂无处理记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Flex>
      ) : null}

      {detail && (
        <FeedbackActionModal
          error={actionError}
          feedback={detail}
          key={actionMode ?? "reply"}
          mode={actionMode ?? "reply"}
          onClose={() => {
            if (!actionSaving) {
              setActionMode(null);
              setActionError(null);
            }
          }}
          onConfirm={submitAction}
          open={actionMode !== null}
          saving={actionSaving}
        />
      )}
    </Drawer>
  );
}
