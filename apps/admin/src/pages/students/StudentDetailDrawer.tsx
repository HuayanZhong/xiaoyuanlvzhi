import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Skeleton,
  Table,
  Tabs,
  Tag,
  Typography,
  type DescriptionsProps,
  type TableColumnsType,
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  disableStudent,
  enableStudent,
  getStudent,
  getStudentHistory,
  type StudentHistoryAdoption,
  type StudentHistoryCare,
  type StudentHistoryOrder,
  type StudentHistoryPoint,
  type StudentHistoryTask,
  type StudentRecordView,
  type StudentHistoryView,
} from "@/api/accounts";
import { ApiError } from "@/api/client";
import LoadFailure from "@/components/common/LoadFailure";
import ReasonModal from "@/components/common/ReasonModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { formatDateTime } from "@/lib/format";
import { emitToast } from "@/lib/toast-events";
import {
  adoptionHistoryStatusColor,
  adoptionHistoryStatusLabel,
  careHistoryStatusColor,
  careHistoryStatusLabel,
  formatPointDelta,
  orderHistoryStatusColor,
  orderHistoryStatusLabel,
  participationHistoryStatusColor,
  participationHistoryStatusLabel,
  pointSourceLabel,
  studentDisplayName,
  studentStatusColor,
  studentStatusLabel,
} from "./labels";

type StudentDetailDrawerProps = {
  open: boolean;
  studentId: number | null;
  onClose: () => void;
  onChanged: (student: StudentRecordView) => void;
  onRefresh: () => void;
};

type HistoryTabKey = "adoptions" | "care" | "tasks" | "points" | "orders";

const historyPagination = {
  pageSize: 10,
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
};

function emptyHistory(description: string) {
  return (
    <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );
}

function pointDeltaText(value: number) {
  return (
    <Typography.Text
      type={value > 0 ? "success" : value < 0 ? "danger" : undefined}
    >
      {formatPointDelta(value)}
    </Typography.Text>
  );
}

/** 学生详情：基础资料、五组业务记录和账号启停。 */
export default function StudentDetailDrawer({
  open,
  studentId,
  onClose,
  onChanged,
  onRefresh,
}: StudentDetailDrawerProps) {
  const isMobile = useIsMobile();
  const [detail, setDetail] = useState<StudentRecordView | null>(null);
  const [history, setHistory] = useState<StudentHistoryView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<HistoryTabKey>("adoptions");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const statusRef = useRef(false);

  const loadDetail = useCallback(async () => {
    if (studentId == null) {
      return;
    }

    setDetailLoading(true);
    setDetailFailed(false);

    try {
      setDetail(await getStudent(studentId));
    } catch {
      setDetailFailed(true);
    } finally {
      setDetailLoading(false);
    }
  }, [studentId]);

  const loadHistory = useCallback(async () => {
    if (studentId == null) {
      return;
    }

    setHistoryLoading(true);
    setHistoryFailed(false);

    try {
      setHistory(await getStudentHistory(studentId));
    } catch {
      setHistoryFailed(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!open || studentId == null) {
      return;
    }

    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置上一名学生
    setDetail(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置上一名学生
    setHistory(null);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置失败状态
    setDetailFailed(false);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时重置失败状态
    setHistoryFailed(false);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时回到第一个标签
    setActiveTab("adoptions");
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时关闭上一次原因弹窗
    setReasonOpen(false);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时请求详情
    void loadDetail();
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时请求历史
    void loadHistory();
  }, [loadDetail, loadHistory, open, studentId]);

  const changeStatus = async (reason: string) => {
    if (!detail || statusRef.current) {
      return;
    }

    statusRef.current = true;
    setStatusSaving(true);

    try {
      const updated =
        detail.status === "ACTIVE"
          ? await disableStudent(detail.id, reason)
          : await enableStudent(detail.id, reason);

      setDetail(updated);
      onChanged(updated);
      setReasonOpen(false);
      emitToast(
        "success",
        updated.status === "DISABLED" ? "学生账号已禁用" : "学生账号已启用",
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      if (error instanceof ApiError && error.status === 404) {
        setReasonOpen(false);
        emitToast("error", error.message || "学生账号不存在");
        onRefresh();
        onClose();
        return;
      }

      emitToast(
        "error",
        error instanceof Error ? error.message : "操作失败，请稍后重试",
      );
    } finally {
      statusRef.current = false;
      setStatusSaving(false);
    }
  };

  const descriptionItems: DescriptionsProps["items"] = detail
    ? [
        {
          key: "name",
          label: "姓名",
          children: studentDisplayName(detail),
        },
        {
          key: "studentNumber",
          label: "学号",
          children: detail.studentNumber || "—",
        },
        { key: "email", label: "邮箱", children: detail.email },
        {
          key: "department",
          label: "院系",
          children: detail.department || "—",
        },
        {
          key: "className",
          label: "班级",
          children: detail.className || "—",
        },
        { key: "phone", label: "手机号", children: detail.phone || "—" },
        {
          key: "status",
          label: "账号状态",
          children: (
            <Tag color={studentStatusColor(detail.status)}>
              {studentStatusLabel(detail.status)}
            </Tag>
          ),
        },
        {
          key: "pointsBalance",
          label: "当前积分",
          children: detail.pointsBalance,
        },
        {
          key: "activeAdoptionCount",
          label: "在养绿植数",
          children: detail.activeAdoptionCount,
        },
        {
          key: "createdAt",
          label: "注册时间",
          children: formatDateTime(detail.createdAt),
        },
        {
          key: "updatedAt",
          label: "更新时间",
          children: formatDateTime(detail.updatedAt),
        },
      ]
    : [];

  const adoptionColumns: TableColumnsType<StudentHistoryAdoption> = [
    { title: "申请编号", dataIndex: "applicationNo", width: 140 },
    { title: "品种", dataIndex: "speciesName", width: 120 },
    {
      title: "单株编号",
      dataIndex: "plantCode",
      width: 120,
      render: (value: string | null) => value || "未分配",
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (value: string) => (
        <Tag color={adoptionHistoryStatusColor(value)}>
          {adoptionHistoryStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "申请时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const careColumns: TableColumnsType<StudentHistoryCare> = [
    { title: "打卡编号", dataIndex: "checkinNo", width: 140 },
    { title: "单株编号", dataIndex: "plantCode", width: 120 },
    { title: "单株名称", dataIndex: "plantName", width: 140 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={careHistoryStatusColor(value)}>
          {careHistoryStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "最新凭证说明",
      dataIndex: "latestNote",
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || "—",
    },
    {
      title: "提交时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const taskColumns: TableColumnsType<StudentHistoryTask> = [
    { title: "任务标题", dataIndex: "taskTitle", width: 180 },
    {
      title: "参与状态",
      dataIndex: "status",
      width: 110,
      render: (value: string) => (
        <Tag color={participationHistoryStatusColor(value)}>
          {participationHistoryStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "最新凭证状态",
      dataIndex: "latestSubmissionStatus",
      width: 130,
      render: (value: string | null) =>
        value ? (
          <Tag color={participationHistoryStatusColor(value)}>
            {participationHistoryStatusLabel(value)}
          </Tag>
        ) : (
          "—"
        ),
    },
    {
      title: "最新凭证说明",
      dataIndex: "latestNote",
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || "—",
    },
    {
      title: "报名时间",
      dataIndex: "joinedAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const pointColumns: TableColumnsType<StudentHistoryPoint> = [
    {
      title: "变化值",
      dataIndex: "deltaPoints",
      width: 100,
      render: (value: number) => pointDeltaText(value),
    },
    { title: "变动后余额", dataIndex: "balanceAfter", width: 110 },
    {
      title: "来源",
      dataIndex: "sourceType",
      width: 120,
      render: (value: string) => pointSourceLabel(value),
    },
    {
      title: "来源业务 ID",
      dataIndex: "sourceId",
      width: 120,
      render: (value: string | null) => value || "—",
    },
    {
      title: "原因",
      dataIndex: "reason",
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || "—",
    },
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const orderColumns: TableColumnsType<StudentHistoryOrder> = [
    { title: "订单号", dataIndex: "orderNo", width: 160 },
    { title: "奖励", dataIndex: "rewardName", width: 140 },
    { title: "消耗积分", dataIndex: "pointsCost", width: 100 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => (
        <Tag color={orderHistoryStatusColor(value)}>
          {orderHistoryStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "下单时间",
      dataIndex: "createdAt",
      width: 160,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "领取截止时间",
      dataIndex: "pickupDeadline",
      width: 160,
      render: (value: string | null) => formatDateTime(value),
    },
  ];

  const historyTabs = history
    ? [
        {
          key: "adoptions",
          label: "领养记录",
          children: (
            <Table<StudentHistoryAdoption>
              columns={adoptionColumns}
              dataSource={history.adoptions}
              locale={{ emptyText: emptyHistory("暂无领养记录") }}
              pagination={historyPagination}
              rowKey="id"
              scroll={{ x: 810 }}
              size="small"
            />
          ),
        },
        {
          key: "care",
          label: "养护打卡",
          children: (
            <Table<StudentHistoryCare>
              columns={careColumns}
              dataSource={history.careCheckins}
              locale={{ emptyText: emptyHistory("暂无养护打卡") }}
              pagination={historyPagination}
              rowKey="id"
              scroll={{ x: 880 }}
              size="small"
            />
          ),
        },
        {
          key: "tasks",
          label: "任务记录",
          children: (
            <Table<StudentHistoryTask>
              columns={taskColumns}
              dataSource={history.taskParticipations}
              locale={{ emptyText: emptyHistory("暂无任务记录") }}
              pagination={historyPagination}
              rowKey="id"
              scroll={{ x: 800 }}
              size="small"
            />
          ),
        },
        {
          key: "points",
          label: "积分流水",
          children: (
            <Table<StudentHistoryPoint>
              columns={pointColumns}
              dataSource={history.pointLedger}
              locale={{ emptyText: emptyHistory("暂无积分流水") }}
              pagination={historyPagination}
              rowKey="id"
              scroll={{ x: 830 }}
              size="small"
            />
          ),
        },
        {
          key: "orders",
          label: "兑换订单",
          children: (
            <Table<StudentHistoryOrder>
              columns={orderColumns}
              dataSource={history.rewardOrders}
              locale={{ emptyText: emptyHistory("暂无兑换订单") }}
              pagination={historyPagination}
              rowKey="id"
              scroll={{ x: 820 }}
              size="small"
            />
          ),
        },
      ]
    : [];

  const footer = detail ? (
    <Flex justify="flex-end">
      {detail.status === "ACTIVE" ? (
        <Button danger onClick={() => setReasonOpen(true)}>
          禁用账号
        </Button>
      ) : (
        <Button onClick={() => setReasonOpen(true)}>启用账号</Button>
      )}
    </Flex>
  ) : null;

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={onClose}
      open={open}
      size={isMobile ? "100%" : 960}
      title={
        detail ? (
          <Flex align="center" gap={8}>
            <span>{studentDisplayName(detail)}</span>
            <Tag color={studentStatusColor(detail.status)}>
              {studentStatusLabel(detail.status)}
            </Tag>
          </Flex>
        ) : (
          "学生详情"
        )
      }
    >
      <Flex gap={24} vertical>
        {detailLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : detailFailed ? (
          <LoadFailure
            message="学生详情加载失败，请稍后重试"
            onRetry={() => void loadDetail()}
          />
        ) : detail ? (
          <Descriptions
            column={isMobile ? 1 : 2}
            items={descriptionItems}
            size="small"
          />
        ) : null}

        <div>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            业务记录
          </Typography.Title>
          {historyLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : historyFailed ? (
            <Alert
              action={
                <Button onClick={() => void loadHistory()} size="small">
                  重试
                </Button>
              }
              showIcon
              title="学生历史加载失败，请稍后重试"
              type="warning"
            />
          ) : history ? (
            <Tabs
              activeKey={activeTab}
              items={historyTabs}
              onChange={(key) => setActiveTab(key as HistoryTabKey)}
            />
          ) : null}
        </div>
      </Flex>

      {detail && (
        <ReasonModal
          danger={detail.status === "ACTIVE"}
          key={`${detail.id}-${detail.status}-${reasonOpen ? "open" : "closed"}`}
          okText={detail.status === "ACTIVE" ? "确认禁用" : "确认启用"}
          onCancel={() => {
            if (!statusSaving) {
              setReasonOpen(false);
            }
          }}
          onConfirm={(reason) => void changeStatus(reason)}
          open={reasonOpen}
          saving={statusSaving}
          title={detail.status === "ACTIVE" ? "禁用学生账号" : "启用学生账号"}
        />
      )}
    </Drawer>
  );
}
