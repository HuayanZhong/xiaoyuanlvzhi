import {
  Button,
  Checkbox,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createTask,
  updateTask,
  type AdminTaskView,
  type TaskRequest,
} from "@/api/tasks";
import { SingleImageUpload } from "@/components/common/ImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";

export type TaskFormMode = "create" | "edit" | "copy" | "view";

type TaskFormDrawerProps = {
  open: boolean;
  mode: TaskFormMode;
  task: AdminTaskView | null;
  onClose: () => void;
  onSaved: () => void;
};

type TaskFormValues = {
  title: string;
  coverFileId: number | null;
  details: string;
  startsAt: string;
  endsAt: string;
  maxParticipants: number | null;
  pointsPerPerson: number;
  requireText: boolean;
  requirePhoto: boolean;
};

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  coverFileId: null,
  details: "",
  startsAt: "",
  endsAt: "",
  maxParticipants: null,
  pointsPerPerson: 10,
  requireText: true,
  requirePhoto: false,
};

function toInputDateTime(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : "";
}

function initialValues(
  task: AdminTaskView | null,
  mode: TaskFormMode,
): TaskFormValues {
  if (!task || mode === "create") {
    return DEFAULT_VALUES;
  }

  return {
    title: mode === "copy" ? `${task.title}（副本）` : task.title,
    coverFileId: task.coverFileId,
    details: task.details,
    startsAt: mode === "copy" ? "" : toInputDateTime(task.startsAt),
    endsAt: mode === "copy" ? "" : toInputDateTime(task.endsAt),
    maxParticipants: task.maxParticipants,
    pointsPerPerson: task.pointsPerPerson,
    requireText: task.requireText,
    requirePhoto: task.requirePhoto,
  };
}

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "保存失败，请稍后重试";
  }

  switch (error.code) {
    case "TASK_RULES_LOCKED":
      return "已有学生报名，不能修改时间、人数上限或奖励积分";
    case "TASK_STATUS_INVALID":
      return "任务已停用，请复制新建";
    case "TASK_TIME_INVALID":
      return "结束时间必须晚于开始时间";
    case "TASK_EVIDENCE_REQUIRED":
      return "至少选择文字说明或照片凭证";
    case "TASK_CAPACITY_INVALID":
      return "人数上限必须大于 0";
    case "FILE_NOT_PUBLIC":
      return "封面必须是公开图片";
    case "FILE_NOT_FOUND":
      return "封面图片不存在";
    default:
      return error.message;
  }
}

/** 新建、编辑、复制和只读查看任务；提交失败时保留表单内容。 */
export default function TaskFormDrawer({
  open,
  mode,
  task,
  onClose,
  onSaved,
}: TaskFormDrawerProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<TaskFormValues>();
  const [saving, setSaving] = useState(false);
  const readOnly = mode === "view";
  const lockRules = mode === "edit" && task != null && !task.canEditRules;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    form.setFieldsValue(initialValues(task, mode));
  }, [form, mode, open, task]);

  const submit = async (publish: boolean) => {
    let values: TaskFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (values.endsAt <= values.startsAt) {
      form.setFields([
        { name: "endsAt", errors: ["结束时间必须晚于开始时间"] },
      ]);
      return;
    }

    if (!values.requireText && !values.requirePhoto) {
      form.setFields([
        { name: "requirePhoto", errors: ["至少选择文字说明或照片凭证"] },
      ]);
      return;
    }

    const input: TaskRequest = {
      title: values.title.trim(),
      coverFileId: values.coverFileId ?? null,
      details: values.details.trim(),
      startsAt: values.startsAt,
      endsAt: values.endsAt,
      maxParticipants: values.maxParticipants ?? null,
      pointsPerPerson: values.pointsPerPerson,
      requireText: values.requireText,
      requirePhoto: values.requirePhoto,
      publish: publish && mode !== "copy",
    };

    setSaving(true);

    try {
      if (mode === "create" || mode === "copy") {
        await createTask(input);
      } else if (task) {
        await updateTask(task.id, input);
      }

      emitToast("success", mode === "edit" ? "任务已更新" : "任务已保存");
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.code === "TASK_RULES_LOCKED") {
        emitToast("error", errorMessage(error));
      } else {
        notifyError(error, errorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  };

  const footer = readOnly ? (
    <Flex justify="flex-end">
      <Button onClick={onClose}>关闭</Button>
    </Flex>
  ) : (
    <Flex gap={8} justify="flex-end" wrap>
      <Button disabled={saving} onClick={onClose}>
        取消
      </Button>
      {(mode === "create" || (mode === "edit" && task?.status === "DRAFT")) && (
        <Button loading={saving} onClick={() => void submit(false)}>
          保存草稿
        </Button>
      )}
      {mode === "copy" && (
        <Button
          loading={saving}
          type="primary"
          onClick={() => void submit(false)}
        >
          保存草稿
        </Button>
      )}
      {mode === "create" && (
        <Button
          loading={saving}
          type="primary"
          onClick={() => void submit(true)}
        >
          立即发布
        </Button>
      )}
      {mode === "edit" && task?.status === "DRAFT" && (
        <Button
          loading={saving}
          type="primary"
          onClick={() => void submit(true)}
        >
          发布
        </Button>
      )}
      {mode === "edit" && task?.status !== "DRAFT" && (
        <Button
          loading={saving}
          type="primary"
          onClick={() => void submit(false)}
        >
          保存修改
        </Button>
      )}
    </Flex>
  );

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={onClose}
      open={open}
      size={isMobile ? "100%" : 640}
      title={
        mode === "create"
          ? "新建任务"
          : mode === "copy"
            ? "复制新建任务"
            : mode === "view"
              ? "任务详情"
              : "编辑任务"
      }
    >
      <Form<TaskFormValues>
        form={form}
        layout="vertical"
        initialValues={DEFAULT_VALUES}
      >
        <Form.Item
          label="标题"
          name="title"
          rules={[{ required: true, message: "请填写任务标题" }]}
        >
          <Input
            disabled={readOnly}
            maxLength={60}
            placeholder="例如：校园垃圾分类宣传"
            showCount
          />
        </Form.Item>

        <Form.Item label="封面" name="coverFileId">
          <SingleImageUpload disabled={readOnly} />
        </Form.Item>

        <Form.Item
          label="任务说明"
          name="details"
          rules={[{ required: true, message: "请填写任务说明" }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 4, maxRows: 8 }}
            disabled={readOnly}
            maxLength={2000}
            placeholder="说明完成标准和安全要求"
            showCount
          />
        </Form.Item>

        <Flex gap={12} wrap>
          <Form.Item
            label="开始时间"
            name="startsAt"
            rules={[{ required: true, message: "请选择开始时间" }]}
            style={{ flex: "1 1 240px" }}
          >
            <Input
              aria-label="开始时间"
              disabled={readOnly || lockRules}
              type="datetime-local"
            />
          </Form.Item>
          <Form.Item
            label="结束时间"
            name="endsAt"
            rules={[{ required: true, message: "请选择结束时间" }]}
            style={{ flex: "1 1 240px" }}
          >
            <Input
              aria-label="结束时间"
              disabled={readOnly || lockRules}
              type="datetime-local"
            />
          </Form.Item>
        </Flex>

        <Flex gap={12} wrap>
          <Form.Item
            label="人数上限"
            name="maxParticipants"
            style={{ flex: "1 1 200px" }}
          >
            <InputNumber
              disabled={readOnly || lockRules}
              min={1}
              placeholder="留空表示不限"
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            label="每人奖励积分"
            name="pointsPerPerson"
            rules={[{ required: true, message: "请填写奖励积分" }]}
            style={{ flex: "1 1 200px" }}
          >
            <InputNumber
              disabled={readOnly || lockRules}
              min={1}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Flex>

        {lockRules && (
          <Typography.Paragraph type="secondary">
            已有学生报名，时间、人数上限和奖励积分已锁定；如需调整，请停用后复制新建。
          </Typography.Paragraph>
        )}

        <Form.Item name="requireText" valuePropName="checked">
          <Checkbox disabled={readOnly}>要求文字说明</Checkbox>
        </Form.Item>
        <Form.Item name="requirePhoto" valuePropName="checked">
          <Checkbox disabled={readOnly}>要求照片凭证</Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
