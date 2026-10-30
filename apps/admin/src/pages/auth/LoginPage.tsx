import { useNavigate, useSearchParams } from "react-router";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm, { type LoginValues } from "@/components/auth/LoginForm";
import { resolveReturnTo } from "@/lib/return-to";
import { emitToast } from "@/lib/toast-events";
import { useAuthStore } from "@/stores/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async ({ username, password }: LoginValues) => {
    await login(username, password);
    emitToast("success", "登录成功");
    navigate(resolveReturnTo(searchParams.get("returnTo")), {
      replace: true,
    });
  };

  return (
    <AuthLayout
      description="使用管理员账号登录校园绿植领养与环保激励系统。"
      title="登录管理后台"
    >
      <LoginForm onSubmit={handleSubmit} />
    </AuthLayout>
  );
}
