import { Flex, Modal, Radio, Typography } from "antd";
import { useState } from "react";
import type { ReturnResult } from "@/api/adoptions";
import { useIsMobile } from "@/hooks/useIsMobile";

type ReturnDecisionModalProps = {
  open: boolean;
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (result: ReturnResult) => void;
};

const RETURN_OPTIONS = [
  { value: "AVAILABLE", label: "重新开放领养" },
  { value: "MAINTENANCE", label: "转入维护" },
] as const;

/** 确认归还时必须选择单株去向，未选择时不发起请求。 */
export default function ReturnDecisionModal({
  open,
  saving = false,
  onCancel,
  onConfirm,
}: ReturnDecisionModalProps) {
  const [result, setResult] = useState<ReturnResult | null>(null);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const handleOk = () => {
    if (!result) {
      setError("请选择归还结果");
      return;
    }

    onConfirm(result);
  };

  return (
    <Modal
      cancelText="取消"
      confirmLoading={saving}
      mask={{ closable: false }}
      okText="确认归还"
      onCancel={() => {
        if (!saving) {
          onCancel();
        }
      }}
      onOk={handleOk}
      open={open}
      title="确认收到归还绿植"
      width={isMobile ? "94%" : 480}
    >
      <Flex gap={8} vertical>
        <Typography.Text type="secondary">
          确认后将结束领养关系，请选择单株去向。
        </Typography.Text>
        <Radio.Group
          onChange={(event) => {
            setResult(event.target.value as ReturnResult);
            setError("");
          }}
          options={[...RETURN_OPTIONS]}
          orientation="vertical"
          value={result}
        />
        {error && <Typography.Text type="danger">{error}</Typography.Text>}
      </Flex>
    </Modal>
  );
}
