import { Button, Form, Input } from "antd";

type LoginValues = {
  username: string;
  password: string;
};

type LoginFormProps = {
  onSuccess: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  return (
    <Form<LoginValues>
      autoComplete="on"
      layout="vertical"
      onFinish={() => onSuccess()}
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
          { min: 6, message: "密码至少 6 位" },
        ]}
      >
        <Input.Password
          autoComplete="current-password"
          placeholder="请输入密码"
        />
      </Form.Item>

      <Button block htmlType="submit" size="large" type="primary">
        登录
      </Button>
    </Form>
  );
}
