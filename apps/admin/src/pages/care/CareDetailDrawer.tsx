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
  approveCareCheckin,
  getCareCheckin,
  listCareEvents,
  rejectCareCheckin,
  type AdminCheckinView,
  type AdminSubmissionView,
  type CareEventView,
} from "@/api/care";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import LoadFailure from "@/components/common/LoadFailure";
import ReasonModal from "@/components/common/ReasonModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import {
  accountStatusLabel,
  careStatusColor,
  careStatusLabel,
  plantStatusLabel,
  pointsSourceLabel,
} from "./labels";

type CareDetailDrawerProps = {
  checkinId: number;
  onClose: () => void;
  onChanged: () => void;
};

const EVENT_ACTION_LABELS: Record<string, string> = {
  CARE_APPROVE: "通过",
  CARE_REJECT: "驳回",
  APPROVE: "通过",
  APPROVED: "通过",
  REJECT: "驳回",
  REJECTED: "驳回",
};

function eventActionLabel(value: string): string {
  return EVENT_ACTION_LABELS[value] ?? (value || "操作");
}

function latestSubmission(
  checkin: AdminCheckinView | null,
): AdminSubmissionView | null {
  if (!checkin) {
    return null;
  }

  return checkin.submissions.reduce<AdminSubmissionView | null>(
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

function awardedPointsFor(checkin: AdminCheckinView): number | null {
  return (
    checkin.submissions
      .filter(
        (submission) =>
          submission.status === "APPROVED" && submission.awardedPoints != null,
      )
      .reduce<AdminSubmissionView | null>(
        (latest, submission) =>
          !latest || submission.version > latest.version ? submission : latest,
        null,
      )?.awardedPoints ?? null
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

function sortedEvents(events: CareEventView[]): CareEventView[] {
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
          alt={`养护凭证图片 ${fileId}`}
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
        <Tag color={careStatusColor(submission.status)}>
          {careStatusLabel(submission.status)}
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
      label: "说明",
      children: submission.note || "—",
      span: isMobile ? 1 : 2,
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

/** 养护详情：审核上下文、最新凭证、版本历史和审核操作记录。 */
export default function CareDetailDrawer({
  checkinId,
  onClose,
  onChanged,
}: CareDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<AdminCheckinView | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailFailed, setDetailFailed] = useState(false);
  const [events, setEvents] = useState<CareEventView[]>([]);
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
      const next = await getCareCheckin(id);

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
      const next = await listCareEvents(id);

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
    void loadDetail(checkinId);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时并行加载详情和事件
    void loadEvents(checkinId);
  }, [checkinId, loadDetail, loadEvents]);

  const refresh = useCallback(async () => {
    await Promise.all([loadDetail(checkinId), loadEvents(checkinId)]);
  }, [checkinId, loadDetail, loadEvents]);

  const retryDetail = () => {
    void refresh();
  };

  const retryEvents = () => {
    void loadEvents(checkinId);
  };

  const handleActionError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) {
        notifyError(error, "审核失败，请稍后重试");
        return;
      }

      switch (error.code) {
        case "CARE_CHECKIN_NOT_FOUND":
          emitToast("error", "打卡记录不存在或已被删除");
          onClose();
          onChanged();
          return;
        case "CARE_STATUS_INVALID":
          emitToast("error", "记录已被处理，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "CARE_SUBMISSION_ALREADY_REVIEWED":
          emitToast("error", "凭证已处理，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "DATA_CONFLICT":
          emitToast("error", "记录状态冲突，已刷新最新状态");
          void refresh();
          onChanged();
          return;
        case "CARE_CHECKIN_DUPLICATE":
          emitToast("error", "同株存在重复待审记录，请先处理重复记录");
          void refresh();
          onChanged();
          return;
        case "CARE_EVIDENCE_REQUIRED":
          emitToast("error", "证据缺失，请驳回并让学生补充");
          void refresh();
          return;
        case "CARE_INTERVAL_NOT_REACHED":
          emitToast("error", "养护间隔未到，暂不能通过");
          void refresh();
          return;
        case "CARE_POINTS_UNCONFIGURED":
          emitToast("error", "未配置养护积分，请先配置积分规则或品种积分");
          void refresh();
          return;
        case "POINTS_FREQUENCY_LIMIT":
          emitToast("error", "本周期积分发放已达上限，打卡保持待审");
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
      const updated = await approveCareCheckin(detail.id);
      setDetail(updated);
      const awarded = latestSubmission(updated)?.awardedPoints;
      emitToast(
        "success",
        awarded != null
          ? `已通过，发放 ${awarded} 积分`
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
      const updated = await rejectCareCheckin(detail.id, reason);
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
  const awardedPoints = detail ? awardedPointsFor(detail) : null;
  const pointsValue =
    detail?.status === "PENDING_REVIEW"
      ? detail.pointsSource === "NONE"
        ? "未配置"
        : `${detail.pendingPoints} 分 · ${pointsSourceLabel(
            detail.pointsSource,
          )}`
      : detail?.status === "APPROVED"
        ? awardedPoints != null
          ? `${awardedPoints} 分（已发放）`
          : "以积分流水为准"
        : "—";
  const eventItems = sortedEvents(events);

  const blockedReason = (() => {
    if (!detail) {
      return "详情尚未加载";
    }

    if (detail.status !== "PENDING_REVIEW") {
      return "该打卡已处理";
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

    if (detail.duplicatePending) {
      return "同株存在重复待审记录，请先处理重复记录";
    }

    if (detail.pointsSource === "NONE" || detail.pendingPoints <= 0) {
      return "未配置养护积分，请先配置积分规则或品种积分";
    }

    return null;
  })();

  const canReject = detail?.status === "PENDING_REVIEW" && !pending;
  const approveDisabled = pending || blockedReason !== null;

  const descriptionItems: DescriptionsProps["items"] = detail
    ? [
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
          key: "plant",
          label: "单株",
          children: detail.plantDisplayName
            ? `${detail.plantCode} · ${detail.plantDisplayName}`
            : detail.plantCode,
        },
        {
          key: "location",
          label: "位置",
          children: detail.location || "—",
        },
        {
          key: "plantStatus",
          label: "单株状态",
          children: plantStatusLabel(detail.plantStatus),
        },
        { key: "species", label: "品种", children: detail.speciesName },
        {
          key: "careInterval",
          label: "养护间隔",
          children: `${detail.careIntervalDays} 天`,
        },
        {
          key: "status",
          label: "状态",
          children: (
            <Tag color={careStatusColor(detail.status)}>
              {careStatusLabel(detail.status)}
            </Tag>
          ),
        },
        {
          key: "createdAt",
          label: "创建时间",
          children: formatDateTime(detail.createdAt),
        },
        {
          key: "updatedAt",
          label: "更新时间",
          children: formatDateTime(detail.updatedAt),
        },
        {
          key: "lastApprovedAt",
          label: "上次通过时间",
          children: formatDateTime(detail.lastApprovedAt),
        },
        {
          key: "points",
          label: detail.status === "PENDING_REVIEW" ? "待发积分" : "积分",
          children: pointsValue,
        },
        {
          key: "duplicatePending",
          label: "重复待审",
          children: detail.duplicatePending ? (
            <Typography.Text type="danger">存在重复待审</Typography.Text>
          ) : (
            "无"
          ),
        },
        {
          key: "light",
          label: "光照要求",
          children: detail.lightDescription || "—",
          span: isMobile ? 1 : 2,
        },
        {
          key: "water",
          label: "浇水要求",
          children: detail.waterDescription || "—",
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
                event.fromStatus ? careStatusLabel(event.fromStatus) : "—"
              } → ${event.toStatus ? careStatusLabel(event.toStatus) : "—"}）`
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
                  <div>单株：{detail.plantCode}</div>
                  <div>
                    预计积分：{detail.pendingPoints} 分（
                    {pointsSourceLabel(detail.pointsSource)}）
                  </div>
                </div>
              }
              disabled={approveDisabled}
              okText="确认通过"
              onConfirm={() => void handleApprove()}
              title="确认通过该养护凭证并发放积分？"
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
            <span>{detail.checkinNo}</span>
            <Tag color={careStatusColor(detail.status)}>
              {careStatusLabel(detail.status)}
            </Tag>
          </Flex>
        ) : (
          "养护详情"
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
                      <Tag color={careStatusColor(submission.status)}>
                        {careStatusLabel(submission.status)}
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
          title="驳回养护凭证"
        />
      )}
    </Drawer>
  );
}
