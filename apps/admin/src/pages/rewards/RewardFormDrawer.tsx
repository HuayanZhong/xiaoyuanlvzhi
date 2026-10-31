import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createReward,
  updateReward,
  type RewardRequest,
  type RewardView,
} from "@/api/rewards";
import ImageUpload from "@/components/common/ImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";
import { emitToast } from "@/lib/toast-events";

type RewardFormValues = {
  name: string;
  description?: string;
  imageFileIds: number[];
  pointsCost: number;
  availableStock: number;
  location: string;
  pickupDays: number;
  enabled: boolean;
};

type RewardFormDrawerProps = {
  open: boolean;
  reward: RewardView | null;
  onClose: () => void;
  onSaved: () => void;
};

const INITIAL_VALUES: RewardFormValues = {
  name: "",
  description: "",
  imageFileIds: [],
  pointsCost: 10,
  availableStock: 0,
  location: "",
  pickupDays: 7,
  enabled: true,
};

function toRequest(values: RewardFormValues): RewardRequest {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || null,
    imageFileIds: values.imageFileIds,
    pointsCost: values.pointsCost,
    availableStock: values.availableStock,
    location: values.location.trim(),
    pickupDays: values.pickupDays,
    enabled: values.enabled,
  };
}

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "保存奖励失败，请稍后重试";
  }

  switch (error.code) {
    case "REWARD_STOCK_RESERVED":
      return "总库存不能低于已预留和已领取数量";
    case "INVALID_IMAGE_FILES":
      return "奖励图片不存在或尚未设为公开图片";
    case "REWARD_NOT_FOUND":
      return "奖励不存在，请刷新后重试";
    case "REWARD_FIELDS_INVALID":
      return "兑换积分必须为正数，库存不能为负数，领取期限至少为 1 天";
    case "INVALID_REQUEST":
      return error.message || "奖励信息不完整";
    default:
      return error.message;
  }
}

/** 奖励新增/编辑抽屉；库存与图片错误保留在表单内。 */
export default function RewardFormDrawer({
  open,
  reward,
  onClose,
  onSaved,
}: RewardFormDrawerProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<RewardFormValues>();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const occupied = reward ? reward.reservedStock + reward.claimedCount : 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (reward) {
      form.setFieldsValue({
        name: reward.name,
        description: reward.description ?? "",
        imageFileIds: reward.imageFileIds,
        pointsCost: reward.pointsCost,
        availableStock: reward.availableStock,
        location: reward.location,
        pickupDays: reward.pickupDays,
        enabled: reward.enabled,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue(INITIAL_VALUES);
  }, [form, open, reward]);

  const handleFinish = async (values: RewardFormValues) => {
    if (savingRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const input = toRequest(values);

      if (reward) {
        await updateReward(reward.id, input);
      } else {
        await createReward(input);
      }

      emitToast("success", reward ? "奖励已更新" : "奖励已创建");
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }

      if (error instanceof ApiError && error.code === "REWARD_STOCK_RESERVED") {
        form.setFields([
          { name: "availableStock", errors: [errorMessage(error)] },
        ]);
        return;
      }

      if (error instanceof ApiError && error.code === "INVALID_IMAGE_FILES") {
        form.setFields([
          { name: "imageFileIds", errors: [errorMessage(error)] },
        ]);
        return;
      }

      emitToast("error", errorMessage(error));
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
      <Button loading={saving} type="primary" onClick={() => form.submit()}>
        保存奖励
      </Button>
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
      title={reward ? "编辑奖励" : "新增奖励"}
    >
      {reward && (
        <Alert
          showIcon
          description="库存不能低于已预留和已领取数量；下架只阻止新兑换，不影响待领取订单。"
          title={`已预留 ${reward.reservedStock}，已领取 ${reward.claimedCount}，剩余可兑换 ${reward.remainingStock}`}
          type="info"
        />
      )}

      <Form
        form={form}
        initialValues={INITIAL_VALUES}
        layout="vertical"
        onFinish={handleFinish}
        style={{ marginTop: reward ? 16 : 0 }}
      >
        <Form.Item
          label="奖励名称"
          name="name"
          rules={[
            { required: true, message: "请输入奖励名称" },
            { max: 60, message: "奖励名称最多 60 字" },
          ]}
        >
          <Input maxLength={60} placeholder="例如：环保帆布袋" />
        </Form.Item>

        <Form.Item
          label="奖励描述"
          name="description"
          rules={[{ max: 500, message: "奖励描述最多 500 字" }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={500}
            placeholder="说明奖励内容和兑换须知"
            showCount
          />
        </Form.Item>

        <Form.Item label="奖励图片" name="imageFileIds">
          <ImageUpload max={3} />
        </Form.Item>

        <Flex gap={12} wrap>
          <Form.Item
            label="兑换积分"
            name="pointsCost"
            rules={[
              { required: true, message: "请填写兑换积分" },
              { type: "number", min: 1, message: "兑换积分至少为 1" },
            ]}
            style={{ flex: "1 1 180px" }}
          >
            <InputNumber min={1} precision={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            extra={
              reward
                ? `已预留 ${reward.reservedStock}、已领取 ${reward.claimedCount}`
                : "总库存不能小于已占用数量"
            }
            label="总库存"
            name="availableStock"
            rules={[
              { required: true, message: "请填写总库存" },
              {
                type: "number",
                min: occupied,
                message: `总库存不能低于 ${occupied}`,
              },
            ]}
            style={{ flex: "1 1 180px" }}
          >
            <InputNumber
              min={occupied}
              precision={0}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Flex>

        <Form.Item
          label="领取地点"
          name="location"
          rules={[
            { required: true, message: "请填写领取地点" },
            { max: 200, message: "领取地点最多 200 字" },
          ]}
        >
          <Input maxLength={200} placeholder="例如：学生活动中心 101" />
        </Form.Item>

        <Form.Item
          label="领取期限（天）"
          name="pickupDays"
          rules={[
            { required: true, message: "请填写领取期限" },
            { type: "number", min: 1, message: "领取期限至少为 1 天" },
          ]}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="enabled" valuePropName="checked">
          <Checkbox>上架奖励</Checkbox>
        </Form.Item>

        <Typography.Paragraph type="secondary">
          图片最多 3 张，仅支持 JPG、PNG、WebP，单张不超过 5 MB。
        </Typography.Paragraph>
      </Form>
    </Drawer>
  );
}
