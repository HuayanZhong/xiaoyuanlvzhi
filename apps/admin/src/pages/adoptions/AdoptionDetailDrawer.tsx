import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Popconfirm,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import type { DescriptionsProps, TimelineProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  confirmHandover,
  decideCancel,
  decideReturn,
  getAdoption,
  rejectAdoption,
  type AdoptionView,
  type ReturnResult,
} from "@/api/adoptions";
import type { StudentView } from "@/api/accounts";
import LoadFailure from "@/components/common/LoadFailure";
import ReasonModal from "@/components/common/ReasonModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import ApprovePlantModal from "./ApprovePlantModal";
import ReturnDecisionModal from "./ReturnDecisionModal";
import {
  adoptionStatusColor,
  adoptionStatusLabel,
  returnResultLabel,
} from "./labels";

type ReasonAction = "reject" | "cancel-reject" | "return-reject";

type AdoptionDetailDrawerProps = {
  adoptionId: number;
  students: Map<number, StudentView>;
  onClose: () => void;
  onChanged: () => void;
};

const REASON_MODAL_TITLES: Record<ReasonAction, string> = {
  reject: "驳回领养申请",
  "cancel-reject": "拒绝取消申请",
  "return-reject": "驳回归还申请",
};

const REASON_MODAL_OK_TEXT: Record<ReasonAction, string> = {
  reject: "确认驳回",
  "cancel-reject": "确认拒绝",
  "return-reject": "确认驳回",
};

/** 领养详情：学生资料、申请信息、状态时间线和按状态出现的处理操作。 */
export default function AdoptionDetailDrawer({
  adoptionId,
  students,
  onClose,
  onChanged,
}: AdoptionDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<AdoptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const load = useCallback(async (id: number) => {
    try {
      setDetail(await getAdoption(id));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 打开抽屉时拉取详情；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect
    void load(adoptionId);
  }, [adoptionId, load]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    void load(adoptionId);
  };

  const runAction = async (
    key: string,
    action: () => Promise<AdoptionView>,
    success: string,
  ) => {
    setPending(key);

    try {
      const updated = await action();
      setDetail(updated);
      emitToast("success", success);
      onChanged();
      return updated;
    } catch (reason) {
      notifyError(reason, "操作失败，请稍后重试");

      if (
        reason instanceof ApiError &&
        reason.code === "ADOPTION_STATUS_INVALID"
      ) {
        setLoading(true);
        await load(adoptionId);
        onChanged();
      }

      return null;
    } finally {
      setPending(null);
    }
  };

  const handleReasonConfirm = async (reason: string) => {
    if (!detail || !reasonAction) {
      return;
    }

    const decisions: Record<
      ReasonAction,
      { action: () => Promise<AdoptionView>; success: string }
    > = {
      reject: {
        action: () => rejectAdoption(detail.id, reason),
        success: "申请已驳回",
      },
      "cancel-reject": {
        action: () => decideCancel(detail.id, false, reason),
        success: "已拒绝取消",
      },
      "return-reject": {
        action: () => decideReturn(detail.id, false, undefined, reason),
        success: "已驳回归还",
      },
    };
    const decision = decisions[reasonAction];
    const updated = await runAction(
      reasonAction,
      decision.action,
      decision.success,
    );

    if (updated) {
      setReasonAction(null);
    }
  };

  const handleReturnConfirm = async (result: ReturnResult) => {
    if (!detail) {
      return;
    }

    const updated = await runAction(
      "return-approve",
      () => decideReturn(detail.id, true, result),
      "已确认归还",
    );

    if (updated) {
      setReturnOpen(false);
    }
  };

  const handleApproved = (updated: AdoptionView) => {
    setDetail(updated);
    setApproveOpen(false);
    onChanged();
  };

  const handleStale = () => {
    setApproveOpen(false);
    setLoading(true);
    void load(adoptionId);
    onChanged();
  };

  const student = detail ? students.get(detail.studentId) : undefined;

  const descriptionItems: DescriptionsProps["items"] = detail
    ? [
        {
          key: "student",
          label: "学生",
          children: student?.fullName || detail.studentEmail,
        },
        {
          key: "studentNumber",
          label: "学号",
          children: student?.studentNumber || "—",
        },
        {
          key: "department",
          label: "院系",
          children: student?.department || "—",
        },
        {
          key: "className",
          label: "班级",
          children: student?.className || "—",
        },
        { key: "email", label: "邮箱", children: detail.studentEmail },
        { key: "species", label: "品种", children: detail.speciesName },
        {
          key: "plant",
          label: "单株",
          children: detail.plantCode
            ? `${detail.plantCode} · ${detail.plantLocation ?? "—"}`
            : "未分配",
        },
        {
          key: "createdAt",
          label: "申请时间",
          children: formatDateTime(detail.createdAt),
        },
        {
          key: "pickupDeadline",
          label: "领取截止",
          children: formatDateTime(detail.pickupDeadline),
        },
        {
          key: "handedOverAt",
          label: "交接时间",
          children: formatDateTime(detail.handedOverAt),
        },
        {
          key: "updatedAt",
          label: "更新时间",
          children: formatDateTime(detail.updatedAt),
        },
        {
          key: "reviewReason",
          label: "审核/驳回原因",
          children: detail.reviewReason || "—",
        },
        {
          key: "returnReason",
          label: "归还原因",
          children: detail.returnReason || "—",
        },
        {
          key: "returnResult",
          label: "归还结果",
          children: returnResultLabel(detail.returnResult),
        },
        {
          key: "note",
          label: "申请备注",
          children: detail.note || "—",
          span: isMobile ? 1 : 2,
        },
      ]
    : [];

  const timelineItems: TimelineProps["items"] = detail
    ? [...detail.timeline]
        // sort 只作用于副本，不修改接口返回的数组。
        // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((event, index) => ({
          color:
            event.toStatus === "REJECTED" || event.toStatus === "CANCELLED"
              ? "red"
              : event.toStatus === "ENDED"
                ? "gray"
                : "blue",
          content: (
            <Space orientation="vertical" size={2}>
              <Typography.Text strong>
                {event.fromStatus
                  ? `${adoptionStatusLabel(event.fromStatus)} → ${adoptionStatusLabel(event.toStatus)}`
                  : `提交申请（${adoptionStatusLabel(event.toStatus)}）`}
              </Typography.Text>
              {event.reason && (
                <Typography.Text type="secondary">
                  {event.reason}
                </Typography.Text>
              )}
            </Space>
          ),
          key: `${event.createdAt}-${index}`,
          title: formatDateTime(event.createdAt),
        }))
    : [];

  const footer = detail ? (
    <Flex gap={8} justify="flex-end" wrap>
      {detail.status === "PENDING_REVIEW" && (
        <>
          <Button danger onClick={() => setReasonAction("reject")}>
            驳回
          </Button>
          <Button type="primary" onClick={() => setApproveOpen(true)}>
            通过
          </Button>
        </>
      )}

      {detail.status === "WAITING_PICKUP" && (
        <Popconfirm
          cancelText="取消"
          okText="确认交接"
          onConfirm={() =>
            void runAction(
              "handover",
              () => confirmHandover(detail.id),
              "已确认交接",
            )
          }
          title="确认已在线下交付绿植？"
        >
          <Button loading={pending === "handover"} type="primary">
            确认交接
          </Button>
        </Popconfirm>
      )}

      {detail.status === "CANCEL_REVIEW" && (
        <>
          <Button danger onClick={() => setReasonAction("cancel-reject")}>
            拒绝取消
          </Button>
          <Popconfirm
            cancelText="取消"
            okText="同意取消"
            onConfirm={() =>
              void runAction(
                "cancel-approve",
                () => decideCancel(detail.id, true),
                "已取消申请",
              )
            }
            title="同意后单株将重新开放，确定取消？"
          >
            <Button loading={pending === "cancel-approve"} type="primary">
              同意取消
            </Button>
          </Popconfirm>
        </>
      )}

      {detail.status === "RETURN_REVIEW" && (
        <>
          <Button danger onClick={() => setReasonAction("return-reject")}>
            驳回归还
          </Button>
          <Button type="primary" onClick={() => setReturnOpen(true)}>
            确认归还
          </Button>
        </>
      )}
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
          <Flex align="center" gap={8}>
            <span>{detail.applicationNo}</span>
            <Tag color={adoptionStatusColor(detail.status)}>
              {adoptionStatusLabel(detail.status)}
            </Tag>
          </Flex>
        ) : (
          "领养详情"
        )
      }
    >
      {loading ? (
        <Skeleton active />
      ) : failed ? (
        <LoadFailure message="详情加载失败，请稍后重试" onRetry={retry} />
      ) : detail ? (
        <Flex gap={24} vertical>
          <Descriptions
            column={isMobile ? 1 : 2}
            items={descriptionItems}
            size="small"
          />
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              状态时间线
            </Typography.Title>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <Empty
                description="暂无状态记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Flex>
      ) : null}

      {approveOpen && detail && (
        <ApprovePlantModal
          adoption={detail}
          onApproved={handleApproved}
          onCancel={() => setApproveOpen(false)}
          onStale={handleStale}
        />
      )}

      {reasonAction && detail && (
        <ReasonModal
          danger
          okText={REASON_MODAL_OK_TEXT[reasonAction]}
          onCancel={() => setReasonAction(null)}
          onConfirm={(reason) => void handleReasonConfirm(reason)}
          open
          saving={pending === reasonAction}
          title={REASON_MODAL_TITLES[reasonAction]}
        />
      )}

      {returnOpen && detail && (
        <ReturnDecisionModal
          onCancel={() => setReturnOpen(false)}
          onConfirm={(result) => void handleReturnConfirm(result)}
          open
          saving={pending === "return-approve"}
        />
      )}
    </Drawer>
  );
}
