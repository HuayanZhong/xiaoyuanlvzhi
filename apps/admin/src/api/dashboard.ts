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

const DASHBOARD_PATH = "admin/dashboard";

export function getDashboard(): Promise<DashboardView> {
  return request<DashboardView>(DASHBOARD_PATH);
}
