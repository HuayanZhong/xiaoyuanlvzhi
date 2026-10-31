import {
  Button,
  Checkbox,
  Drawer,
  Flex,
  Form,
  InputNumber,
  Select,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import {
  isRuleSource,
  updatePointRule,
  type FrequencyPeriod,
  type PointRuleRequest,
  type PointRuleView,
} from "@/api/points";
import { useIsMobile } from "@/hooks/useIsMobile";
import { emitToast } from "@/lib/toast-events";
import { frequencyPeriodLabel, ruleSourceLabel } from "./labels";

type PointRuleDrawerProps = {
  open: boolean;
  rule: PointRuleView | null;
  onClose: () => void;
  onSaved: () => void;
};

type RulePeriodValue = "NONE" | FrequencyPeriod;

type RuleFormValues = {
  points: number | null;
  enabled: boolean;
  frequencyPeriod: RulePeriodValue;
  frequencyLimit: number | null;
};

function initialValues(rule: PointRuleView | null): RuleFormValues {
  const period =
    rule?.frequencyPeriod === "DAILY" || rule?.frequencyPeriod === "WEEKLY"
      ? rule.frequencyPeriod
      : "NONE";

  return {
    points: rule?.sourceType === "ECO_TASK" ? 0 : (rule?.points ?? null),
    enabled: rule?.enabled ?? true,
    frequencyPeriod: period,
    frequencyLimit: rule?.frequencyLimit ?? null,
  };
}

function errorMessage(error: unknown, isEco: boolean): string {
  if (!(error instanceof ApiError)) {
    return "保存规则失败，请稍后重试";
  }

  switch (error.code) {
    case "POINT_RULE_POINTS_INVALID":
      return isEco ? "环保任务积分由任务配置决定" : "养护打卡积分必须大于 0";
    case "FREQUENCY_RULE_INVALID":
      return "次数上限和周期需要同时填写或同时留空";
    case "FREQUENCY_LIMIT_INVALID":
      return "次数上限必须大于 0";
    case "FREQUENCY_PERIOD_INVALID":
      return "首版只支持不限、每日或每周";
    case "POINT_RULE_NOT_FOUND":
      return "积分规则不存在，请刷新后重试";
    default:
      return error.message;
  }
}

/** 编辑一条积分规则；环保任务的积分不可编辑，只维护频控和启用状态。 */
export default function PointRuleDrawer({
  open,
  rule,
  onClose,
  onSaved,
}: PointRuleDrawerProps) {
  const isMobile = useIsMobile();
  const [form] = Form.useForm<RuleFormValues>();
  const [saving, setSaving] = useState(false);
  const [period, setPeriod] = useState<RulePeriodValue>("NONE");
  const [enabled, setEnabled] = useState(true);
  const isEco = rule?.sourceType === "ECO_TASK";

  useEffect(() => {
    if (!open || !rule) {
      return;
    }

    const next = initialValues(rule);

    form.resetFields();
    form.setFieldsValue(next);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时同步频控周期和启用状态
    setPeriod(next.frequencyPeriod);
    // oxlint-disable-next-line react/set-state-in-effect -- 打开抽屉时同步频控周期和启用状态
    setEnabled(next.enabled);
  }, [form, open, rule]);

  if (!rule) {
    return null;
  }

  const submit = async () => {
    let values: RuleFormValues;

    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (!isRuleSource(rule.sourceType)) {
      emitToast("error", "不支持的积分规则来源");
      return;
    }

    const input: PointRuleRequest = {
      points: isEco ? 0 : (values.points ?? 0),
      frequencyLimit:
        values.frequencyPeriod === "NONE" ? null : values.frequencyLimit,
      frequencyPeriod:
        values.frequencyPeriod === "NONE" ? null : values.frequencyPeriod,
      enabled: values.enabled,
    };

    setSaving(true);

    try {
      await updatePointRule(rule.sourceType, input);
      emitToast("success", "积分规则已更新");
      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return;
      }
      emitToast("error", errorMessage(error, isEco));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <Flex gap={8} justify="flex-end" wrap>
      <Button disabled={saving} onClick={onClose}>
        取消
      </Button>
      <Button loading={saving} type="primary" onClick={() => void submit()}>
        保存规则
      </Button>
    </Flex>
  );

  return (
    <Drawer
      destroyOnHidden
      footer={footer}
      onClose={onClose}
      open={open}
      size={isMobile ? "100%" : 540}
      title={`编辑${ruleSourceLabel(rule.sourceType)}规则`}
    >
      <Form<RuleFormValues>
        form={form}
        layout="vertical"
        onValuesChange={(changed) => {
          if (changed.frequencyPeriod) {
            setPeriod(changed.frequencyPeriod);
          }
          if (typeof changed.enabled === "boolean") {
            setEnabled(changed.enabled);
          }
        }}
      >
        {isEco ? (
          <Typography.Paragraph type="secondary">
            环保任务的每次积分由任务配置决定；本规则只控制启用状态和每日/每周频控。
          </Typography.Paragraph>
        ) : (
          <Typography.Paragraph type="secondary">
            规则积分优先；规则停用、未生效或积分不大于 0 时使用品种积分。
          </Typography.Paragraph>
        )}

        {!isEco && (
          <Form.Item
            label="每次积分"
            name="points"
            rules={[
              { required: true, message: "请填写积分" },
              ...(enabled
                ? [
                    {
                      min: 1,
                      type: "number" as const,
                      message: "启用规则时积分必须大于 0",
                    },
                  ]
                : []),
            ]}
          >
            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item label="频控周期" name="frequencyPeriod">
          <Select<RulePeriodValue>
            options={[
              { value: "NONE", label: "不限" },
              { value: "DAILY", label: frequencyPeriodLabel("DAILY") },
              { value: "WEEKLY", label: frequencyPeriodLabel("WEEKLY") },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="周期内最多次数"
          name="frequencyLimit"
          rules={
            period === "NONE"
              ? []
              : [
                  { required: true, message: "请填写次数上限" },
                  { min: 1, type: "number", message: "次数上限必须大于 0" },
                ]
          }
        >
          <InputNumber
            disabled={period === "NONE"}
            min={1}
            precision={0}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item name="enabled" valuePropName="checked">
          <Checkbox>启用规则</Checkbox>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
