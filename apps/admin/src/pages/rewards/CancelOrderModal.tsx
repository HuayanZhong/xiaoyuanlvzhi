import { Button, Flex, Form, Input, Modal, Popconfirm, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/client";
import { cancelOrder, type OrderView } from "@/api/rewards";
import { useIsMobile } from "@/hooks/useIsMobile";
import { emitToast } from "@/lib/toast-events";

type CancelOrderModalProps = {
  open: boolean;
  order: OrderView | null;
  onClose: () => void;
  onSaved: () => void;
};

type CancelFormValues = { reason: string };

function reasonError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "取消订单失败，请稍后重试";
  }

  switch (error.code) {
    case "INVALID_REQUEST":
      return error.message || "请填写 5–200 字的取消原因";
    case "ORDER_STATUS_INVALID":
      return "订单已处理，请刷新后查看";
    case "ORDER_NOT_FOUND":
      return "订单不存在，请刷新后重试";
    default:
      return error.message;
  }
}

/** 取消待领取订单：原因 trim 后 5–200 字，提交前再次确认。 */
export default function CancelOrderModal({
  open,
  order,
  onClose,
  onSaved,
}: CancelOrderModalProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<CancelFormValues>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
  }, [form, open]);

  const submit = async () => {
    if (!order || savingRef.current) {
      return;
    }

    let values: CancelFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      await cancelOrder(order.id, { reason: values.reason.trim() });
      emitToast("success", "订单已取消，积分和库存已恢复");
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      if (error instanceof ApiError && error.code === "INVALID_REQUEST") {
        form.setFields([{ name: "reason", errors: [reasonError(error)] }]);
        return;
      }

      emitToast("error", reasonError(error));

      if (
        error instanceof ApiError &&
        (error.code === "ORDER_STATUS_INVALID" ||
          error.code === "ORDER_NOT_FOUND")
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
        返回
      </Button>
      <Popconfirm
        cancelText="继续编辑"
        description="取消后积分和库存会自动恢复，且不能撤销。"
        disabled={saving}
        okText="确认取消订单"
        onConfirm={() => void submit()}
        title="确认取消这个订单？"
      >
        <Button loading={saving} type="primary">
          确认取消
        </Button>
      </Popconfirm>
    </Flex>
  );

  return (
    <Modal
      destroyOnHidden
      footer={footer}
      onCancel={() => {
        if (!saving) {
          onClose();
        }
      }}
      open={open}
      title={order ? `取消订单 ${order.orderNo}` : "取消订单"}
      width={isMobile ? "calc(100vw - 32px)" : 520}
    >
      <Flex gap={16} vertical>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          取消后订单变为“已取消”，积分退回学生余额，预留库存释放。领取已超时的订单会按超时规则处理。
        </Typography.Paragraph>

        <Form<CancelFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="取消原因"
            name="reason"
            rules={[
              { required: true, message: "请填写取消原因" },
              {
                validator: (_, value: unknown) => {
                  const raw = typeof value === "string" ? value : "";
                  const length = raw.trim().length;

                  if (length === 0) {
                    return raw === ""
                      ? Promise.resolve()
                      : Promise.reject(new Error("请填写取消原因"));
                  }
                  if (length < 5) {
                    return Promise.reject(new Error("取消原因至少 5 字"));
                  }
                  if (length > 200) {
                    return Promise.reject(new Error("取消原因最多 200 字"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={200}
              placeholder="请说明取消原因，至少 5 字"
              showCount
            />
          </Form.Item>
        </Form>
      </Flex>
    </Modal>
  );
}
