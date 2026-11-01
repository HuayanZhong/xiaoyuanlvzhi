import { useApi } from "~/composables/useApi";

/** 一笔积分流水；`deltaPoints` 为负表示扣减。 */
export type PointLedgerEntry = {
  id: number;
  accountId: number;
  studentEmail: string;
  deltaPoints: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string | null;
  reason: string | null;
  actorEmail: string | null;
  createdAt: string;
};

/** 读取当前学生的积分余额。 */
export function getPointsBalance() {
  return useApi().request<number>("points/balance");
}

/** 读取当前学生的积分流水，服务端按时间倒序返回。 */
export function listPointLedger() {
  return useApi().request<PointLedgerEntry[]>("points/ledger");
}
