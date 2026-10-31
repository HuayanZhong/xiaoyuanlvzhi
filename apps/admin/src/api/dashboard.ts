import { request } from "./client";

export type DashboardPendingItem = {
  businessType: string;
  businessId: number;
  title: string;
  actorName: string;
  status: string;
  submittedAt: string;
};

export type DashboardView = {
  pendingAdoptions: number;
  pendingAdoptionChanges: number;
  pendingCareCheckins: number;
  pendingTaskSubmissions: number;
  waitingRewardOrders: number;
  pendingFeedback: number;
  availablePlants: number;
  activePlants: number;
  recentItems: DashboardPendingItem[];
};

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

const DASHBOARD_PATH = "admin/dashboard";
const STATISTICS_PATH = "admin/statistics";

export function getDashboard(): Promise<DashboardView> {
  return request<DashboardView>(DASHBOARD_PATH);
}

/** 工作台只使用默认近 30 天范围，日期筛选留给数据统计页。 */
export function getStatistics(): Promise<StatisticsView> {
  return request<StatisticsView>(STATISTICS_PATH);
}
