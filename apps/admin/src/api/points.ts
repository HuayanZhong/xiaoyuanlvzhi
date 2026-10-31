import { request } from "./client";

export const POINT_SOURCES = [
  "CARE_CHECKIN",
  "ECO_TASK",
  "REDEMPTION",
  "REDEMPTION_REFUND",
  "ADJUSTMENT",
] as const;
export type PointSource = (typeof POINT_SOURCES)[number];

export const RULE_SOURCES = ["CARE_CHECKIN", "ECO_TASK"] as const;
export type RuleSource = (typeof RULE_SOURCES)[number];

export const FREQUENCY_PERIODS = ["DAILY", "WEEKLY"] as const;
export type FrequencyPeriod = (typeof FREQUENCY_PERIODS)[number];

export type PointRuleView = {
  id: number;
  sourceType: string;
  points: number;
  frequencyLimit: number | null;
  frequencyPeriod: string | null;
  enabled: boolean;
  effectiveFrom: string;
  updatedAt: string;
};

export type PointLedgerView = {
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

export type PointRuleRequest = {
  points: number;
  frequencyLimit: number | null;
  frequencyPeriod: FrequencyPeriod | null;
  enabled: boolean;
};

export type PointAdjustmentRequest = {
  accountId: number;
  deltaPoints: number;
  reason: string;
  requestId: string;
};

const POINTS_PATH = "admin/points";

export function isRuleSource(value: unknown): value is RuleSource {
  return RULE_SOURCES.includes(value as RuleSource);
}

export function isFrequencyPeriod(value: unknown): value is FrequencyPeriod {
  return FREQUENCY_PERIODS.includes(value as FrequencyPeriod);
}

export function isPointSource(value: unknown): value is PointSource {
  return POINT_SOURCES.includes(value as PointSource);
}

export function listPointRules(): Promise<PointRuleView[]> {
  return request<PointRuleView[]>(`${POINTS_PATH}/rules`);
}

export function updatePointRule(
  sourceType: RuleSource,
  input: PointRuleRequest,
): Promise<PointRuleView> {
  return request<PointRuleView>(`${POINTS_PATH}/rules/${sourceType}`, {
    method: "PUT",
    json: input,
  });
}

export function listPointLedger(): Promise<PointLedgerView[]> {
  return request<PointLedgerView[]>(`${POINTS_PATH}/ledger`);
}

export function adjustPoints(
  input: PointAdjustmentRequest,
): Promise<PointLedgerView> {
  return request<PointLedgerView>(`${POINTS_PATH}/adjustments`, {
    method: "POST",
    json: input,
  });
}
