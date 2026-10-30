import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Popconfirm,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import type { DescriptionsProps, TimelineProps } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/client";
import {
  approveTaskParticipation,
  getTaskParticipation,
  listTaskEvents,
  rejectTaskParticipation,
  type AdminParticipationView,
  type AdminSubmissionView,
  type TaskEventView,
} from "@/api/tasks";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import LoadFailure from "@/components/common/LoadFailure";
import ReasonModal from "@/components/common/ReasonModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import {
  accountStatusLabel,
  participationStatusColor,
  participationStatusLabel,
  taskStatusColor,
  taskStatusLabel,
} from "./labels";

type TaskReviewDrawerProps = {
  participationId: number;
  onClose: () => void;
  onChanged: () => void;
};

const EVENT_ACTION_LABELS: Record<string, string> = {
  TASK_APPROVE: "通过",
  TASK_REJECT: "驳回",
};

function eventActionLabel(value: string): string {
  return EVENT_ACTION_LABELS[value] ?? (value || "操作");
}

function latestSubmission(
  detail: AdminParticipationView | null,
): AdminSubmissionView | null {
  if (!detail) {
    return null;
  }

  return detail.submissions.reduce<AdminSubmissionView | null>(
    (latest, item) =>
      !latest || item.version > latest.version ? item : latest,
    null,
  );
}

function maxVersion(submissions: AdminSubmissionView[]): number {
  return submissions.reduce(
    (max, item) => (item.version > max ? item.version : max),
    0,
  );
}

function sortedSubmissions(
  submissions: AdminSubmissionView[],
): AdminSubmissionView[] {
  return (
    [...submissions]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => left.version - right.version)
  );
}

function sortedEvents(events: TaskEventView[]): TaskEventView[] {
  return (
    [...events]
      // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
      .sort((left, right) => {
        const byTime = left.createdAt.localeCompare(right.createdAt);
        return byTime !== 0 ? byTime : left.id - right.id;
      })
  );
}

function SubmissionImages({ fileIds }: { fileIds: number[] }) {
  if (fileIds.length === 0) {
    return <Typography.Text type="secondary">无图片</Typography.Text>;
  }

  return (
    <Flex gap={8} wrap>
      {fileIds.map((fileId) => (
        <AuthenticatedImage
          alt={`任务凭证图片 ${fileId}`}
          fileId={fileId}
          height={96}
          key={fileId}
          style={{ borderRadius: 8, objectFit: "cover" }}
          width={96}
        />
      ))}
    </Flex>
  );
}

function SubmissionDescriptions({
  submission,
  isMobile,
}: {
  submission: AdminSubmissionView;
  isMobile: boolean;
}) {
  const items: DescriptionsProps["items"] = [
    {
      key: "status",
      label: "状态",
      children: (
        <Tag color={participationStatusColor(submission.status)}>
          {participationStatusLabel(submission.status)}
        </Tag>
      ),
    },
    {
      key: "submittedAt",
      label: "提交时间",
      children: formatDateTime(submission.submittedAt),
    },
    {
      key: "reviewedAt",
      label: "审核时间",
      children: formatDateTime(submission.reviewedAt),
    },
    {
      key: "reviewer",
      label: "审核人",
      children: submission.reviewerName || submission.reviewerEmail || "—",
    },
    {
      key: "awardedPoints",
      label: "实际发放积分",
      children: submission.awardedPoints ?? "—",
    },
    {
      key: "note",
      label: "完成说明",
      children: submission.note || "—",
    },
    {
      key: "reviewReason",
      label: "审核原因",
      children: submission.reviewReason || "—",
      span: isMobile ? 1 : 2,
    },
  ];

  return (
    <Flex gap={12} vertical>
      <Descriptions column={isMobile ? 1 : 2} items={items} size="small" />
      <SubmissionImages fileIds={submission.imageFileIds} />
    </Flex>
  );
}

/** 任务参与审核：任务与学生上下文、凭证版本、审核记录和通过/驳回。 */
export default function TaskReviewDrawer({
  participationId,
  onClose,
  onChanged,
}: TaskReviewDrawerProps) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<AdminParticipationView | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailFailed, setDetailFailed] = useState(false);
  const [events, setEvents] = useState<TaskEventView[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const mountedRef = useRef(true);
  const detailTokenRef = useRef(0);
  const eventsTokenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    const token = detailTokenRef.current + 1;
    detailTokenRef.current = token;
    setDetailLoading(true);
    setDetailFailed(false);

    try {
      const next = await getTaskParticipation(id);

      if (mountedRef.current && token === detailTokenRef.current) {
        setDetail(next);
      }
    } catch {
      if (mountedRef.current && token === detailTokenRef.current) {
        setDetailFailed(true);
      }
    } finally {
      if (mountedRef.current && token === detailTokenRef.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  const loadEvents = useCallback(async (id: number) => {
    const token = eventsTokenRef.current + 1;
    eventsTokenRef.current = token;
    setEventsLoading(true);
    setEventsFailed(false);

    try {
      const next = await listTaskEvents(id);

      if (mountedRef.current && token === eventsTokenRef.current) {
        setEvents(next);
      }
    } catch {
      if (mountedRef.current && token === eventsTokenRef.current) {
        setEventsFailed(true);
      }
    } finally {
      if (mountedRef.current && token === eventsTokenRef.current) {
        setEventsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时并行加载详情和事件
    void loadDetail(participationId);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时并行加载详情和事件
    void loadEvents(participationId);
  }, [participationId, loadDetail, loadEvents]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadDetail(participationId),
      loadEvents(participationId),
    ]);
  }, [participationId, loadDetail, loadEvents]);

  const retryDetail = () => {
    void refresh();
  };

  const retryEvents = () => {
    void loadEvents(participationId);
  };

  const handleActionError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) {
        notifyError(error, "审核失败，请稍后重试");
        return;
      }

      switch (error.code) {
        case "TASK_PARTICIPATION_NOT_FOUND":
          emitToast("error", "参与记录不存在或已被删除");
          onClose();
          onChanged();
          return;
        case "TASK_PARTICIPATION_STATUS_INVALID":
          emitToast("error", "记录已被处理，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "TASK_SUBMISSION_ALREADY_REVIEWED":
          emitToast("error", "凭证已处理，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "TASK_SUBMISSION_NOT_FOUND":
          emitToast("error", "凭证不存在或已被删除，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "POINTS_FREQUENCY_LIMIT":
          emitToast("error", "本周期任务积分发放已达上限，记录保持待审");
          return;
        case "TASK_EVIDENCE_UNCONFIGURED":
          emitToast("error", "任务凭证要求未配置，暂不能通过");
          return;
        case "DATA_CONFLICT":
          emitToast("error", "记录状态冲突，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        default:
          notifyError(error, "审核失败，请稍后重试");
      }
    },
    [onChanged, onClose, refresh],
  );

  const handleApprove = async () => {
    if (!detail) {
      return;
    }

    setPending(true);

    try {
      const updated = await approveTaskParticipation(detail.id);
      setDetail(updated);
      emitToast(
        "success",
        updated.awardedPoints != null
          ? `已通过，发放 ${updated.awardedPoints} 积分`
          : "已通过，积分以积分流水为准",
      );
      onChanged();
      void loadEvents(updated.id);
    } catch (error) {
      handleActionError(error);
    } finally {
      setPending(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!detail) {
      return;
    }

    setPending(true);

    try {
      const updated = await rejectTaskParticipation(detail.id, reason);
      setDetail(updated);
      setReasonOpen(false);
      emitToast("success", "已驳回，已通知学生补充凭证");
      onChanged();
      void loadEvents(updated.id);
    } catch (error) {
      handleActionError(error);
    } finally {
      setPending(false);
    }
  };

  const latest = latestSubmission(detail);
  const submissions = detail ? sortedSubmissions(detail.submissions) : [];
  const latestVersion = detail ? maxVersion(detail.submissions) : 0;
  const eventItems = sortedEvents(events);

  const blockedReason = (() => {
    if (!detail) {
      return "详情尚未加载";
    }

    if (detail.status !== "PENDING_REVIEW") {
      return "该参与记录已处理";
    }

    if (!latest || latest.status !== "PENDING_REVIEW") {
      return "最新凭证已处理";
    }

    if (detail.latestVersion !== latestVersion) {
      return "凭证版本已变化，请刷新后重试";
    }

    if (!detail.hasEvidence) {
      return "证据缺失，请驳回并让学生补充";
    }

    return null;
  })();

  const canReject = detail?.status === "PENDING_REVIEW" && !pending;
  const approveDisabled = pending || blockedReason !== null;

  const descriptionItems: DescriptionsProps["items"] = detail
    ? [
        { key: "task", label: "任务", children: detail.taskTitle },
        {
          key: "taskStatus",
          label: "任务状态",
          children: (
            <Tag color={taskStatusColor(detail.taskStatus)}>
              {taskStatusLabel(detail.taskStatus)}
            </Tag>
          ),
        },
        {
          key: "taskTime",
          label: "开放时间",
          children: `${formatDateTime(detail.taskStartsAt)} 至 ${formatDateTime(
            detail.taskEndsAt,
          )}`,
          span: isMobile ? 1 : 2,
        },
        {
          key: "points",
          label: "奖励积分",
          children: `${detail.pointsPerPerson} 分`,
        },
        {
          key: "student",
          label: "学生",
          children: detail.studentName || detail.studentEmail,
        },
        {
          key: "studentNumber",
          label: "学号",
          children: detail.studentNumber || "—",
        },
        { key: "email", label: "邮箱", children: detail.studentEmail },
        {
          key: "studentStatus",
          label: "账号状态",
          children: detail.studentStatus
            ? accountStatusLabel(detail.studentStatus)
            : "—",
        },
        {
          key: "status",
          label: "参与状态",
          children: (
            <Tag color={participationStatusColor(detail.status)}>
              {participationStatusLabel(detail.status)}
            </Tag>
          ),
        },
        {
          key: "joinedAt",
          label: "报名时间",
          children: formatDateTime(detail.joinedAt),
        },
        {
          key: "latestVersion",
          label: "最新版本",
          children: `v${detail.latestVersion}`,
        },
        {
          key: "latestSubmittedAt",
          label: "最新提交",
          children: formatDateTime(detail.latestSubmittedAt),
        },
        {
          key: "awardedPoints",
          label: "实际发放积分",
          children: detail.awardedPoints ?? "—",
        },
        {
          key: "evidence",
          label: "证据",
          children: detail.hasEvidence ? "完整" : "缺失",
          span: isMobile ? 1 : 2,
        },
      ]
    : [];

  const timelineItems: TimelineProps["items"] = eventItems.map((event) => ({
    color:
      event.toStatus === "APPROVED"
        ? "green"
        : event.toStatus === "REJECTED"
          ? "red"
          : "blue",
    content: (
      <Space orientation="vertical" size={2}>
        <Typography.Text strong>
          {eventActionLabel(event.action)}
          {event.fromStatus || event.toStatus
            ? `（${
                event.fromStatus
                  ? participationStatusLabel(event.fromStatus)
                  : "—"
              } → ${
                event.toStatus ? participationStatusLabel(event.toStatus) : "—"
              }）`
            : ""}
        </Typography.Text>
        {event.reason && (
          <Typography.Text
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            type="secondary"
          >
            {event.reason}
          </Typography.Text>
        )}
        <Typography.Text type="secondary">
          {event.actorName || event.actorEmail || "—"}
        </Typography.Text>
      </Space>
    ),
    key: event.id,
    title: formatDateTime(event.createdAt),
  }));

  const footer =
    detail?.status === "PENDING_REVIEW" ? (
      <Flex gap={8} justify="flex-end" wrap>
        <Button
          danger
          disabled={!canReject}
          onClick={() => setReasonOpen(true)}
        >
          驳回
        </Button>
        <Tooltip title={blockedReason ?? undefined}>
          <span>
            <Popconfirm
              cancelText="取消"
              description={
                <div>
                  <div>学生：{detail.studentName || detail.studentEmail}</div>
                  <div>任务：{detail.taskTitle}</div>
                  <div>奖励积分：{detail.pointsPerPerson} 分</div>
                </div>
              }
              disabled={approveDisabled}
              okText="确认通过"
              onConfirm={() => void handleApprove()}
              title="确认通过该任务凭证并发放积分？"
            >
              <Button
                disabled={approveDisabled}
                loading={pending}
                type="primary"
              >
                通过
              </Button>
            </Popconfirm>
          </span>
        </Tooltip>
      </Flex>
    ) : null;

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={onClose}
      open
      size={isMobile ? "100%" : 640}
      title={
        detail ? (
          <Flex align="center" gap={8} wrap>
            <span>{detail.taskTitle}</span>
            <Tag color={participationStatusColor(detail.status)}>
              {participationStatusLabel(detail.status)}
            </Tag>
          </Flex>
        ) : (
          "任务审核详情"
        )
      }
    >
      {detailLoading ? (
        <Skeleton active />
      ) : detailFailed ? (
        <LoadFailure message="详情加载失败，请稍后重试" onRetry={retryDetail} />
      ) : detail ? (
        <Flex gap={24} vertical>
          <Descriptions
            column={isMobile ? 1 : 2}
            items={descriptionItems}
            size="small"
          />

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              最新凭证
            </Typography.Title>
            {latest ? (
              <SubmissionDescriptions isMobile={isMobile} submission={latest} />
            ) : (
              <Empty
                description="暂无凭证"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              凭证版本
            </Typography.Title>
            {submissions.length > 0 ? (
              <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                {submissions.map((submission) => (
                  <Card
                    extra={
                      <Tag color={participationStatusColor(submission.status)}>
                        {participationStatusLabel(submission.status)}
                      </Tag>
                    }
                    key={submission.id}
                    size="small"
                    title={`v${submission.version}${
                      submission.version === latestVersion ? " · 最新" : ""
                    }`}
                  >
                    <SubmissionDescriptions
                      isMobile={isMobile}
                      submission={submission}
                    />
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty
                description="暂无凭证版本"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>

          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              审核记录
            </Typography.Title>
            {eventsLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : eventsFailed ? (
              <Flex align="center" gap={8} vertical>
                <Typography.Text type="secondary">
                  审核记录加载失败
                </Typography.Text>
                <Button size="small" onClick={retryEvents}>
                  重试
                </Button>
              </Flex>
            ) : eventItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty
                description="暂无审核记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Flex>
      ) : null}

      {reasonOpen && detail && (
        <ReasonModal
          danger
          okText="确认驳回"
          onCancel={() => setReasonOpen(false)}
          onConfirm={(reason) => void handleReject(reason)}
          open
          saving={pending}
          title="驳回任务凭证"
        />
      )}
    </Drawer>
  );
}
