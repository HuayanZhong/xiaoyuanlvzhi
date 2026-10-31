import { EditOutlined } from "@ant-design/icons";
import { Button, Tabs } from "antd";
import { useCallback, useEffect, useState } from "react";
import { listStudents, type StudentView } from "@/api/accounts";
import {
  listPointLedger,
  listPointRules,
  type PointLedgerView,
  type PointRuleView,
} from "@/api/points";
import ModulePage from "@/components/common/ModulePage";
import PointAdjustmentDrawer from "./PointAdjustmentDrawer";
import PointLedgerPanel from "./PointLedgerPanel";
import PointRuleDrawer from "./PointRuleDrawer";
import PointRulesPanel from "./PointRulesPanel";

/** 积分规则与流水：规则配置、全量流水和人工调整两个 tab。 */
export default function PointsPage() {
  const [activeTab, setActiveTab] = useState("rules");
  const [rules, setRules] = useState<PointRuleView[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesFailed, setRulesFailed] = useState(false);
  const [ledger, setLedger] = useState<PointLedgerView[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerFailed, setLedgerFailed] = useState(false);
  const [students, setStudents] = useState<StudentView[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsFailed, setStudentsFailed] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRuleView | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesFailed(false);

    try {
      setRules(await listPointRules());
    } catch {
      setRulesFailed(true);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    setLedgerFailed(false);

    try {
      setLedger(await listPointLedger());
    } catch {
      setLedgerFailed(true);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsFailed(false);

    try {
      setStudents(await listStudents());
    } catch {
      setStudentsFailed(true);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次并行加载规则、流水和账号目录
    void loadRules();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次并行加载规则、流水和账号目录
    void loadLedger();
    // oxlint-disable-next-line react/set-state-in-effect -- 页面首次并行加载规则、流水和账号目录
    void loadStudents();
  }, [loadLedger, loadRules, loadStudents]);

  const refreshAll = useCallback(() => {
    void Promise.all([loadRules(), loadLedger(), loadStudents()]);
  }, [loadLedger, loadRules, loadStudents]);

  const tabs = [
    {
      key: "rules",
      label: "积分规则",
      children: (
        <PointRulesPanel
          failed={rulesFailed}
          loading={rulesLoading}
          onEdit={setEditingRule}
          onRetry={() => {
            void loadRules();
          }}
          rules={rules}
        />
      ),
    },
    {
      key: "ledger",
      label: "积分流水",
      children: (
        <PointLedgerPanel
          failed={ledgerFailed}
          ledger={ledger}
          loading={ledgerLoading}
          onRetry={() => {
            void loadLedger();
          }}
          students={students}
          studentsFailed={studentsFailed}
        />
      ),
    },
  ];

  return (
    <ModulePage
      extra={
        activeTab === "ledger" ? (
          <Button
            icon={<EditOutlined />}
            type="primary"
            onClick={() => setAdjustmentOpen(true)}
          >
            人工调整
          </Button>
        ) : null
      }
      title="积分规则与流水"
    >
      <Tabs activeKey={activeTab} items={tabs} onChange={setActiveTab} />

      <PointRuleDrawer
        onClose={() => setEditingRule(null)}
        onSaved={() => {
          void loadRules();
        }}
        open={editingRule !== null}
        rule={editingRule}
      />

      <PointAdjustmentDrawer
        onClose={() => setAdjustmentOpen(false)}
        onSaved={refreshAll}
        open={adjustmentOpen}
        students={students}
        studentsFailed={studentsFailed}
        studentsLoading={studentsLoading}
      />
    </ModulePage>
  );
}
