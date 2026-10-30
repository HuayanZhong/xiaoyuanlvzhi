import { Button, Result, Spin } from "antd";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth";

type SessionGateProps = {
  children: ReactNode;
};

/** 启动时验证本地 token；校验完成前不渲染受保护内容。 */
export default function SessionGate({ children }: SessionGateProps) {
  const status = useAuthStore((state) => state.status);
  const restore = useAuthStore((state) => state.restore);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span className="text-sm text-muted">正在验证登录状态…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Result
        extra={[
          <Button key="retry" onClick={() => void restore()} type="primary">
            重试
          </Button>,
          <Button key="login" onClick={clear}>
            重新登录
          </Button>,
        ]}
        status="warning"
        subTitle="后端服务暂时不可用，本地登录信息仍保留。"
        title="无法验证登录状态"
      />
    );
  }

  return children;
}
