import { Button, Result } from "antd";

type LoadFailureProps = {
  message: string;
  onRetry: () => void;
};

/** 列表加载失败时的统一状态；重试由调用方重新发起请求。 */
export default function LoadFailure({ message, onRetry }: LoadFailureProps) {
  return (
    <Result
      extra={
        <Button type="primary" onClick={onRetry}>
          重试
        </Button>
      }
      status="warning"
      subTitle="请检查网络连接，或稍后再试"
      title={message}
    />
  );
}
