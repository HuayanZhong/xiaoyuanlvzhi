import { Typography } from "antd";
import { useNavigate } from "react-router";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

const { Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      description="使用管理员账号登录校园绿植领养与环保激励系统。"
      title="登录管理后台"
    >
      <LoginForm onSuccess={() => navigate("/dashboard", { replace: true })} />
      <Text className="mt-4 block text-center text-xs" type="secondary">
        当前为静态演示登录，不会发起真实请求。
      </Text>
    </AuthLayout>
  );
}
