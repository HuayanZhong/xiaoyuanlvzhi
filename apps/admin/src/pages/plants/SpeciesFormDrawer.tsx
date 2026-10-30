import { Button, Drawer, Flex, Form, Input, InputNumber, Select } from "antd";
import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createSpecies,
  updateSpecies,
  type SpeciesRequest,
  type SpeciesView,
} from "@/api/plants";
import { SingleImageUpload } from "@/components/common/ImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";
import { DIFFICULTY_OPTIONS } from "./labels";

type SpeciesFormValues = {
  name: string;
  coverFileId: number | null;
  difficulty: string;
  lightDescription: string;
  waterDescription: string;
  careIntervalDays: number;
  carePoints: number;
  otherDescription?: string;
};

type SpeciesFormDrawerProps = {
  open: boolean;
  species: SpeciesView | null;
  onClose: () => void;
  onSaved: () => void;
};

const INITIAL_VALUES: Partial<SpeciesFormValues> = {
  coverFileId: null,
  difficulty: "EASY",
  careIntervalDays: 7,
  carePoints: 10,
  otherDescription: "",
};

function toRequest(values: SpeciesFormValues): SpeciesRequest {
  return {
    name: values.name.trim(),
    coverFileId: values.coverFileId ?? null,
    difficulty: values.difficulty,
    lightDescription: values.lightDescription.trim(),
    waterDescription: values.waterDescription.trim(),
    careIntervalDays: values.careIntervalDays,
    carePoints: values.carePoints,
    otherDescription: values.otherDescription?.trim() || null,
  };
}

/** 品种新增/编辑抽屉；保存失败时保留表单内容。 */
export default function SpeciesFormDrawer({
  open,
  species,
  onClose,
  onSaved,
}: SpeciesFormDrawerProps) {
  const [form] = Form.useForm<SpeciesFormValues>();
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (species) {
      form.setFieldsValue({
        name: species.name,
        coverFileId: species.coverFileId,
        difficulty: species.difficulty,
        lightDescription: species.lightDescription,
        waterDescription: species.waterDescription,
        careIntervalDays: species.careIntervalDays,
        carePoints: species.carePoints,
        otherDescription: species.otherDescription ?? "",
      });
      return;
    }

    form.resetFields();
  }, [form, open, species]);

  const handleFinish = async (values: SpeciesFormValues) => {
    setSaving(true);

    try {
      const input = toRequest(values);

      if (species) {
        await updateSpecies(species.id, input);
      } else {
        await createSpecies(input);
      }

      emitToast("success", species ? "品种已更新" : "品种已创建");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLANT_SPECIES_EXISTS") {
        form.setFields([{ name: "name", errors: [error.message] }]);
        return;
      }

      notifyError(error, "保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      destroyOnHidden
      footer={
        <Flex gap={8} justify="flex-end">
          <Button onClick={onClose}>取消</Button>
          <Button loading={saving} type="primary" onClick={() => form.submit()}>
            保存
          </Button>
        </Flex>
      }
      onClose={onClose}
      open={open}
      size={isMobile ? "100%" : 480}
      title={species ? "编辑品种" : "新增品种"}
    >
      <Form
        form={form}
        initialValues={INITIAL_VALUES}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          label="品种名称"
          name="name"
          rules={[
            { required: true, message: "请输入品种名称" },
            { max: 40, message: "品种名称最多 40 字" },
          ]}
        >
          <Input maxLength={40} placeholder="例如：绿萝" />
        </Form.Item>

        <Form.Item label="封面图片" name="coverFileId">
          <SingleImageUpload />
        </Form.Item>

        <Form.Item
          label="养护难度"
          name="difficulty"
          rules={[{ required: true, message: "请选择养护难度" }]}
        >
          <Select options={[...DIFFICULTY_OPTIONS]} />
        </Form.Item>

        <Form.Item
          label="光照说明"
          name="lightDescription"
          rules={[
            { required: true, message: "请填写光照说明" },
            { max: 200, message: "光照说明最多 200 字" },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={200}
            placeholder="例如：喜散射光，避免暴晒"
            showCount
          />
        </Form.Item>

        <Form.Item
          label="浇水说明"
          name="waterDescription"
          rules={[
            { required: true, message: "请填写浇水说明" },
            { max: 200, message: "浇水说明最多 200 字" },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={200}
            placeholder="例如：每周浇水一次，保持土壤微湿"
            showCount
          />
        </Form.Item>

        <Form.Item
          label="养护间隔（天）"
          name="careIntervalDays"
          rules={[
            { required: true, message: "请填写养护间隔" },
            {
              type: "number",
              min: 1,
              message: "养护间隔至少 1 天",
            },
          ]}
        >
          <InputNumber min={1} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="打卡默认积分"
          name="carePoints"
          rules={[
            { required: true, message: "请填写打卡默认积分" },
            {
              type: "number",
              min: 0,
              message: "打卡默认积分不能小于 0",
            },
          ]}
        >
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="其他说明"
          name="otherDescription"
          rules={[{ max: 500, message: "其他说明最多 500 字" }]}
        >
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
