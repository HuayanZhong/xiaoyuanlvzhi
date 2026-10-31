import {
  Alert,
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import type { StudentView } from "@/api/accounts";
import { ApiError } from "@/api/client";
import { adjustPoints } from "@/api/points";
import { useIsMobile } from "@/hooks/useIsMobile";
import { emitToast } from "@/lib/toast-events";
import { formatDelta } from "./labels";

type PointAdjustmentDrawerProps = {
  open: boolean;
  students: StudentView[];
  studentsLoading: boolean;
  studentsFailed: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type Direction = "increase" | "decrease";

type AdjustmentValues = {
  accountId: number | null;
  direction: Direction;
  amount: number | null;
  reason: string;
};

const DEFAULT_VALUES: AdjustmentValues = {
  accountId: null,
  direction: "increase",
  amount: null,
  reason: "",
};

function newRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `adjust-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "调整失败，请稍后重试";
  }

  switch (error.code) {
    case "POINTS_INSUFFICIENT":
      return "调整后余额不足，请刷新后重试";
    case "STUDENT_NOT_FOUND":
      return "学生不存在或已变更，请刷新后重试";
    case "IDEMPOTENCY_KEY_REUSED":
      return "本次调整已提交，请刷新后查看";
    case "INVALID_REQUEST":
      return error.message || "调整信息不完整";
    case "POINTS_DELTA_REQUIRED":
      return "积分调整不能为 0";
    default:
      return error.message;
  }
}

/** 人工调整积分：选择学生、预览余额并带请求键提交。 */
export default function PointAdjustmentDrawer({
  open,
  students,
  studentsLoading,
  studentsFailed,
  onClose,
  onSaved,
}: PointAdjustmentDrawerProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<AdjustmentValues>();
  const [saving, setSaving] = useState(false);
  const [watchedValues, setWatchedValues] =
    useState<AdjustmentValues>(DEFAULT_VALUES);
  const savingRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);
  const accountId = watchedValues.accountId;
  const direction = watchedValues.direction;
  const amount = watchedValues.amount;
  const selected = students.find((student) => student.id === accountId) ?? null;
  const currentBalance = selected?.pointsBalance ?? 0;
  const signedDelta =
    direction === "decrease" ? -Number(amount ?? 0) : Number(amount ?? 0);
  const nextBalance = currentBalance + signedDelta;
  const insufficient = selected !== null && nextBalance < 0;
  const submitDisabled =
    saving ||
    studentsLoading ||
    studentsFailed ||
    !selected ||
    !amount ||
    amount < 1 ||
    insufficient;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(DEFAULT_VALUES);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时同步表单初值
    setWatchedValues(DEFAULT_VALUES);
    requestIdRef.current = null;
  }, [form, open]);

  const submit = async () => {
    if (savingRef.current) {
      return;
    }

    let values: AdjustmentValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (!selected || !values.amount || values.amount < 1) {
      return;
    }

    const deltaPoints =
      values.direction === "decrease" ? -values.amount : values.amount;

    if (currentBalance + deltaPoints < 0) {
      form.setFields([{ name: "amount", errors: ["调整后余额不能为负"] }]);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    requestIdRef.current ??= newRequestId();

    try {
      await adjustPoints({
        accountId: selected.id,
        deltaPoints,
        reason: values.reason.trim(),
        requestId: requestIdRef.current,
      });
      emitToast("success", `已调整 ${formatDelta(deltaPoints)} 积分`);
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }
      emitToast("error", errorMessage(error));

      if (
        error instanceof ApiError &&
        (error.code === "POINTS_INSUFFICIENT" ||
          error.code === "STUDENT_NOT_FOUND" ||
          error.code === "IDEMPOTENCY_KEY_REUSED")
      ) {
        onSaved();
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const footer = (
    <Flex gap={8} justify="flex-end" wrap>
      <Button disabled={saving} onClick={onClose}>
        取消
      </Button>
      <Popconfirm
        cancelText="取消"
        description={
          selected
            ? `${selected.fullName || selected.email}：${formatDelta(
                signedDelta,
              )} 积分，调整后余额 ${nextBalance} 分`
            : undefined
        }
        disabled={submitDisabled}
        okText="确认调整"
        onConfirm={() => void submit()}
        title="确认人工调整积分？"
      >
        <Button disabled={submitDisabled} loading={saving} type="primary">
          提交调整
        </Button>
      </Popconfirm>
    </Flex>
  );

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={() => {
        if (!saving) {
          onClose();
        }
      }}
      open={open}
      size={isMobile ? "100%" : 560}
      title="人工调整积分"
    >
      <Flex gap={16} vertical>
        {studentsFailed && (
          <Alert
            showIcon
            title="账号资料暂不可用，暂时无法选择学生"
            type="warning"
          />
        )}

        <Form<AdjustmentValues>
          form={form}
          initialValues={DEFAULT_VALUES}
          layout="vertical"
          onValuesChange={(_, allValues) => {
            setWatchedValues(allValues);
            requestIdRef.current = null;
          }}
        >
          <Form.Item
            label="学生"
            name="accountId"
            rules={[{ required: true, message: "请选择学生" }]}
          >
            <Select<number>
              loading={studentsLoading}
              optionFilterProp="label"
              options={students.map((student) => ({
                value: student.id,
                label: `${student.fullName || student.email}${
                  student.studentNumber ? ` · ${student.studentNumber}` : ""
                } · 余额 ${student.pointsBalance}`,
              }))}
              placeholder="按姓名、学号或邮箱搜索"
              showSearch
            />
          </Form.Item>

          <Flex gap={12} wrap>
            <Form.Item
              label="方向"
              name="direction"
              rules={[{ required: true, message: "请选择方向" }]}
              style={{ flex: "1 1 180px" }}
            >
              <Select<Direction>
                options={[
                  { value: "increase", label: "增加" },
                  { value: "decrease", label: "扣减" },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="积分"
              name="amount"
              rules={[
                { required: true, message: "请填写积分" },
                { min: 1, type: "number", message: "积分必须大于 0" },
              ]}
              style={{ flex: "1 1 180px" }}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Flex>

          <Form.Item
            label="原因"
            name="reason"
            rules={[
              { required: true, message: "请填写原因" },
              {
                validator: (_, value: unknown) => {
                  const reason = typeof value === "string" ? value.trim() : "";
                  return reason.length >= 5 && reason.length <= 200
                    ? Promise.resolve()
                    : Promise.reject(new Error("原因请填写 5 到 200 字"));
                },
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={200}
              placeholder="请填写 5 到 200 字原因"
              showCount
            />
          </Form.Item>
        </Form>

        <Flex gap={4} vertical>
          <Typography.Text type="secondary">
            当前余额：{selected ? `${currentBalance} 分` : "请选择学生"}
          </Typography.Text>
          <Typography.Text type={insufficient ? "danger" : undefined}>
            调整后余额：
            {selected ? `${nextBalance} 分` : "—"}
          </Typography.Text>
          {insufficient && (
            <Typography.Text type="danger">调整后余额不能为负</Typography.Text>
          )}
        </Flex>
      </Flex>
    </Drawer>
  );
}
