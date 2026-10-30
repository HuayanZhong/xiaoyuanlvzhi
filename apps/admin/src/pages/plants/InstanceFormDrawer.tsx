import { Button, Drawer, Flex, Form, Input, Select } from "antd";
import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  createIndividual,
  updateIndividual,
  type IndividualRequest,
  type IndividualView,
  type SpeciesView,
} from "@/api/plants";
import ImageUpload from "@/components/common/ImageUpload";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";

type IndividualFormValues = {
  code: string;
  speciesId: number;
  displayName?: string;
  location: string;
  imageFileIds?: number[];
  notes?: string;
};

type InstanceFormDrawerProps = {
  open: boolean;
  individual: IndividualView | null;
  species: SpeciesView[];
  onClose: () => void;
  onSaved: () => void;
};

const INITIAL_VALUES: Partial<IndividualFormValues> = {
  displayName: "",
  imageFileIds: [],
  notes: "",
};

function toRequest(values: IndividualFormValues): IndividualRequest {
  return {
    code: values.code.trim(),
    speciesId: values.speciesId,
    displayName: values.displayName?.trim() || null,
    location: values.location.trim(),
    imageFileIds: values.imageFileIds ?? [],
    notes: values.notes?.trim() || null,
  };
}

/** 单株新增/编辑抽屉；编辑时编号和品种只读。 */
export default function InstanceFormDrawer({
  open,
  individual,
  species,
  onClose,
  onSaved,
}: InstanceFormDrawerProps) {
  const [form] = Form.useForm<IndividualFormValues>();
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (individual) {
      form.setFieldsValue({
        code: individual.code,
        speciesId: individual.speciesId,
        displayName: individual.displayName ?? "",
        location: individual.location,
        imageFileIds: individual.imageFileIds,
        notes: individual.notes ?? "",
      });
      return;
    }

    form.resetFields();
  }, [form, individual, open]);

  const speciesOptions = species
    .filter((item) => item.enabled || item.id === individual?.speciesId)
    .map((item) => ({ value: item.id, label: item.name }));

  const handleFinish = async (values: IndividualFormValues) => {
    setSaving(true);

    try {
      const input = {
        ...toRequest(values),
        code: individual?.code ?? values.code.trim(),
        speciesId: individual?.speciesId ?? values.speciesId,
      };

      if (individual) {
        await updateIndividual(individual.id, input);
      } else {
        await createIndividual(input);
      }

      emitToast("success", individual ? "单株已更新" : "单株已创建");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.code === "PLANT_CODE_EXISTS") {
        form.setFields([{ name: "code", errors: [error.message] }]);
        return;
      }

      if (
        error instanceof ApiError &&
        error.code === "PLANT_SPECIES_DISABLED"
      ) {
        form.setFields([{ name: "speciesId", errors: [error.message] }]);
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
      title={individual ? "编辑单株" : "新增单株"}
    >
      <Form
        form={form}
        initialValues={INITIAL_VALUES}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          label="单株编号"
          name="code"
          rules={[
            { required: true, message: "请输入单株编号" },
            { max: 80, message: "单株编号最多 80 字" },
          ]}
        >
          <Input
            disabled={Boolean(individual)}
            maxLength={80}
            placeholder="例如：PLANT-001"
          />
        </Form.Item>

        <Form.Item
          label="所属品种"
          name="speciesId"
          rules={[{ required: true, message: "请选择品种" }]}
        >
          <Select
            disabled={Boolean(individual)}
            optionFilterProp="label"
            options={speciesOptions}
            placeholder="请选择启用的品种"
            showSearch
          />
        </Form.Item>

        <Form.Item
          label="展示名称"
          name="displayName"
          rules={[{ max: 40, message: "展示名称最多 40 字" }]}
        >
          <Input
            allowClear
            maxLength={40}
            placeholder="可选，例如：图书馆的绿萝"
          />
        </Form.Item>

        <Form.Item
          label="摆放位置"
          name="location"
          rules={[
            { required: true, message: "请填写摆放位置" },
            { max: 100, message: "摆放位置最多 100 字" },
          ]}
        >
          <Input maxLength={100} placeholder="例如：图书馆一楼" />
        </Form.Item>

        <Form.Item label="图片" name="imageFileIds">
          <ImageUpload max={3} />
        </Form.Item>

        <Form.Item
          label="养护备注"
          name="notes"
          rules={[{ max: 300, message: "养护备注最多 300 字" }]}
        >
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
