import {
  Alert,
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Typography,
} from "antd";
import { useEffect, useRef } from "react";
import type { FeedbackView } from "@/api/feedback";
import { useIsMobile } from "@/hooks/useIsMobile";

export type FeedbackActionMode = "reply" | "close";

type FeedbackActionModalProps = {
  open: boolean;
  mode: FeedbackActionMode;
  feedback: FeedbackView | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void>;
};

type ActionFormValues = { content: string };

const CONFIG = {
  reply: {
    title: "回复反馈",
    label: "回复内容",
    placeholder: "请填写回复内容，至少 5 字",
    okText: "确认回复",
    hint: "回复后反馈变为“已回复”，学生将收到通知。",
    danger: false,
  },
  close: {
    title: "关闭反馈",
    label: "关闭结论",
    placeholder: "请填写关闭结论，至少 5 字",
    okText: "确认关闭",
    hint: "关闭后反馈不可再处理，结论会通知学生。",
    danger: true,
  },
} as const;

/** 回复和关闭共用弹窗；关闭前再次确认，提交失败时保留输入。 */
export default function FeedbackActionModal({
  open,
  mode,
  feedback,
  saving,
  error,
  onClose,
  onConfirm,
}: FeedbackActionModalProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<ActionFormValues>();
  const submitRef = useRef(false);
  const config = CONFIG[mode];
  const suffix = feedback ? ` ${feedback.feedbackNo}` : "";

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [form, open]);

  const submit = async () => {
    if (saving || submitRef.current) {
      return;
    }

    let values: ActionFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (submitRef.current) {
      return;
    }

    submitRef.current = true;

    try {
      await onConfirm(values.content.trim());
    } finally {
      submitRef.current = false;
    }
  };

  const footer = (
    <Flex gap={8} justify="flex-end" wrap>
      <Button disabled={saving} onClick={onClose}>
        取消
      </Button>
      {config.danger ? (
        <Popconfirm
          cancelText="继续编辑"
          description="关闭后不能撤销，学生将收到关闭结论。"
          disabled={saving}
          okText="确认关闭反馈"
          onConfirm={() => void submit()}
          title="确认关闭这条反馈？"
        >
          <Button danger loading={saving} type="primary">
            {config.okText}
          </Button>
        </Popconfirm>
      ) : (
        <Button loading={saving} type="primary" onClick={() => void submit()}>
          {config.okText}
        </Button>
      )}
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
      title={`${config.title}${suffix}`}
      width={isMobile ? "calc(100vw - 32px)" : 520}
    >
      <Flex gap={16} vertical>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {config.hint}
        </Typography.Paragraph>

        {error && <Alert showIcon title={error} type="error" />}

        <Form<ActionFormValues> form={form} layout="vertical" preserve={false}>
          <Form.Item
            label={config.label}
            name="content"
            rules={[
              { required: true, message: `请填写${config.label}` },
              {
                validator: (_, value: unknown) => {
                  const raw = typeof value === "string" ? value : "";

                  if (!raw) {
                    return Promise.resolve();
                  }

                  const length = raw.trim().length;

                  if (length === 0) {
                    return Promise.reject(new Error(`请填写${config.label}`));
                  }
                  if (length < 5) {
                    return Promise.reject(
                      new Error(`${config.label}至少 5 字`),
                    );
                  }
                  if (length > 500) {
                    return Promise.reject(
                      new Error(`${config.label}最多 500 字`),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 8 }}
              maxLength={500}
              placeholder={config.placeholder}
              showCount
            />
          </Form.Item>
        </Form>
      </Flex>
    </Modal>
  );
}
