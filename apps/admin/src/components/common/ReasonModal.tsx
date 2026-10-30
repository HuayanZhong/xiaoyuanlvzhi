import { Form, Input, Modal } from "antd";
import { useIsMobile } from "@/hooks/useIsMobile";

type ReasonModalProps = {
  open: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  okText?: string;
  danger?: boolean;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

type ReasonValues = {
  reason: string;
};

function validateReason(_: unknown, value: unknown): Promise<void> {
  const reason = typeof value === "string" ? value.trim() : "";

  if (!reason) {
    return Promise.reject(new Error("请填写原因"));
  }

  if (reason.length < 5 || reason.length > 200) {
    return Promise.reject(new Error("原因请填写 5 到 200 字"));
  }

  return Promise.resolve();
}

/** 需要填写原因的决策弹窗；提交失败时由调用方保持打开并保留输入。 */
export default function ReasonModal({
  open,
  title,
  label = "原因",
  placeholder = "请填写 5 到 200 字原因",
  okText = "确认",
  danger = false,
  saving = false,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const [form] = Form.useForm<ReasonValues>();
  const isMobile = useIsMobile();

  return (
    <Modal
      cancelText="取消"
      confirmLoading={saving}
      destroyOnHidden
      mask={{ closable: false }}
      okButtonProps={danger ? { danger: true } : undefined}
      okText={okText}
      onCancel={() => {
        if (!saving) {
          onCancel();
        }
      }}
      onOk={() => form.submit()}
      open={open}
      title={title}
      width={isMobile ? "94%" : 480}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => onConfirm(values.reason.trim())}
      >
        <Form.Item
          label={label}
          name="reason"
          rules={[{ validator: validateReason }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={200}
            placeholder={placeholder}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
