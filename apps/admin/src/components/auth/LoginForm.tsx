import { Button, Form, Input } from "antd";
import { useState } from "react";
import { emitToast } from "@/lib/toast-events";

export type LoginValues = {
  username: string;
  password: string;
};

type LoginFormProps = {
  onSubmit: (values: LoginValues) => Promise<void>;
};

/** 登录表单负责交互状态；认证与跳转由页面传入。 */
export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: LoginValues) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(values);
    } catch (reason) {
      emitToast(
        "error",
        reason instanceof Error ? reason.message : "登录失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<LoginValues>
      autoComplete="on"
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
      size="large"
    >
      <Form.Item
        label="管理员账号"
        name="username"
        rules={[
          { required: true, message: "请输入管理员账号" },
          { whitespace: true, message: "账号不能为空白" },
        ]}
      >
        <Input autoComplete="username" placeholder="请输入管理员账号" />
      </Form.Item>

      <Form.Item
        label="密码"
        name="password"
        rules={[
          { required: true, message: "请输入密码" },
          { whitespace: true, message: "密码不能为空白" },
        ]}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder="请输入密码"
        />
      </Form.Item>

      <Button
        block
        disabled={submitting}
        htmlType="submit"
        loading={submitting}
        size="large"
        type="primary"
      >
        登录
      </Button>
    </Form>
  );
}
