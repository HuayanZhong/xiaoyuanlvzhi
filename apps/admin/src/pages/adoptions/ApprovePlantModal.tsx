import { Button, Empty, Flex, Input, Modal, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "@/api/client";
import { approveAdoption, type AdoptionView } from "@/api/adoptions";
import { listIndividuals, type IndividualView } from "@/api/plants";
import LoadFailure from "@/components/common/LoadFailure";
import { useIsMobile } from "@/hooks/useIsMobile";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";

type ApprovePlantModalProps = {
  adoption: AdoptionView;
  onCancel: () => void;
  onApproved: (updated: AdoptionView) => void;
  onStale: () => void;
};

const PLANT_COLUMNS: TableColumnsType<IndividualView> = [
  { title: "单株编号", dataIndex: "code", width: 140 },
  { title: "摆放位置", dataIndex: "location" },
  {
    title: "展示名称",
    dataIndex: "displayName",
    render: (displayName: string | null) =>
      displayName || <Typography.Text type="secondary">—</Typography.Text>,
  },
];

/** 通过申请时选择同品种、可领养的单株。 */
export default function ApprovePlantModal({
  adoption,
  onCancel,
  onApproved,
  onStale,
}: ApprovePlantModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [plants, setPlants] = useState<IndividualView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPlants = useCallback(async () => {
    try {
      setPlants(await listIndividuals());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 打开弹窗时获取可选单株；setState 发生在 await 之后。
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPlants();
  }, [loadPlants]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    void loadPlants();
  };

  const available = useMemo(() => {
    const term = keyword.trim().toLowerCase();

    return (
      plants
        .filter(
          (item) =>
            item.speciesId === adoption.speciesId &&
            item.status === "AVAILABLE",
        )
        .filter(
          (item) =>
            !term ||
            item.code.toLowerCase().includes(term) ||
            item.location.toLowerCase().includes(term),
        )
        // filter 已返回新数组，这里排序不会修改原列表。
        // oxlint-disable-next-line unicorn/no-array-sort -- tsconfig lib 低于 ES2023
        .sort((left, right) => left.code.localeCompare(right.code))
    );
  }, [adoption.speciesId, keyword, plants]);

  const handleApprove = async () => {
    if (selectedId === null) {
      setError("请选择要分配的单株");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await approveAdoption(adoption.id, selectedId);
      emitToast("success", "申请已通过，单株已绑定");
      onApproved(updated);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "PLANT_NOT_AVAILABLE") {
        setError(reason.message);
        await loadPlants();
        return;
      }

      if (
        reason instanceof ApiError &&
        (reason.code === "PLANT_SPECIES_DISABLED" ||
          reason.code === "ADOPTION_STATUS_INVALID")
      ) {
        notifyError(reason);
        onStale();
        return;
      }

      notifyError(reason, "通过失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const goToInstances = () => {
    onCancel();
    navigate(`/plants/instances?speciesId=${adoption.speciesId}`);
  };

  return (
    <Modal
      closable={!saving}
      footer={
        <Flex gap={8} justify="flex-end">
          <Button disabled={saving} onClick={onCancel}>
            取消
          </Button>
          <Button
            disabled={failed || available.length === 0}
            loading={saving}
            onClick={() => void handleApprove()}
            type="primary"
          >
            通过
          </Button>
        </Flex>
      }
      mask={{ closable: false }}
      onCancel={() => {
        if (!saving) {
          onCancel();
        }
      }}
      open
      title="通过申请并分配单株"
      width={isMobile ? "96%" : 680}
    >
      <Flex gap={12} vertical>
        <Typography.Text type="secondary">
          品种：{adoption.speciesName}。只显示状态为“可领养”的单株。
        </Typography.Text>

        {failed ? (
          <LoadFailure message="单株加载失败" onRetry={retry} />
        ) : (
          <>
            <Input
              allowClear
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="按编号或位置筛选可选单株"
              value={keyword}
            />
            <Table<IndividualView>
              columns={PLANT_COLUMNS}
              dataSource={available}
              loading={loading}
              locale={{
                emptyText: (
                  <Empty
                    description="该品种暂无可领养单株"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button onClick={goToInstances} type="link">
                      去单株库存
                    </Button>
                  </Empty>
                ),
              }}
              pagination={{
                hideOnSinglePage: true,
                pageSize: 5,
                showSizeChanger: false,
              }}
              rowKey="id"
              rowSelection={{
                onChange: (keys) => {
                  setSelectedId(keys.length > 0 ? Number(keys[0]) : null);
                  setError("");
                },
                selectedRowKeys: selectedId === null ? [] : [selectedId],
                type: "radio",
              }}
              size="small"
            />
          </>
        )}

        {error && <Typography.Text type="danger">{error}</Typography.Text>}
      </Flex>
    </Modal>
  );
}
