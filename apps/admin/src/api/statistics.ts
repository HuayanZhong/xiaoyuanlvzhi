import { request } from "./client";

export type DailyValue = {
  date: string;
  value: number;
};

export type RankItem = {
  accountId: number;
  displayName: string;
  studentNumber: string | null;
  pointsBalance: number;
};

export type StatisticsRange = {
  from: string;
  to: string;
};

export type StatisticsView = {
  from: string;
  to: string;
  currentActivePlants: number;
  adoptionsStarted: number;
  participatingStudents: number;
  completedTaskParticipants: number;
  endedTaskParticipants: number;
  taskCompletionRate: number | null;
  pointsGranted: number;
  pointRanking: RankItem[];
  adoptionTrend: DailyValue[];
  pointGrantTrend: DailyValue[];
};

const STATISTICS_PATH = "admin/statistics";

/** 获取统计数据；省略范围时由服务端返回默认近 30 天。 */
export function getStatistics(
  range?: StatisticsRange,
): Promise<StatisticsView> {
  return request<StatisticsView>(
    STATISTICS_PATH,
    range ? { searchParams: range } : {},
  );
}
