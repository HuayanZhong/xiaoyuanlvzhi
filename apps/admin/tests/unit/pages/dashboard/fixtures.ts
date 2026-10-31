import type {
  DashboardPendingItem,
  DashboardView,
  StatisticsView,
} from "@/api/dashboard";

export function makeRecentItem(
  overrides: Partial<DashboardPendingItem> = {},
): DashboardPendingItem {
  return {
    businessType: "FEEDBACK",
    businessId: 1,
    title: "问题反馈 FB-1",
    actorName: "张三",
    status: "PENDING",
    submittedAt: "2026-10-30T10:00:00",
    ...overrides,
  };
}

export function makeDashboard(
  overrides: Partial<DashboardView> = {},
): DashboardView {
  return {
    pendingAdoptions: 1,
    pendingAdoptionChanges: 2,
    pendingCareCheckins: 3,
    pendingTaskSubmissions: 4,
    waitingRewardOrders: 5,
    pendingFeedback: 6,
    availablePlants: 7,
    activePlants: 8,
    recentItems: [makeRecentItem()],
    ...overrides,
  };
}

export function makeStatistics(
  overrides: Partial<StatisticsView> = {},
): StatisticsView {
  return {
    from: "2026-10-01",
    to: "2026-10-30",
    currentActivePlants: 8,
    adoptionsStarted: 2,
    participatingStudents: 3,
    completedTaskParticipants: 4,
    endedTaskParticipants: 5,
    taskCompletionRate: 0.8,
    pointsGranted: 120,
    pointRanking: [
      {
        accountId: 1,
        displayName: "张三",
        studentNumber: "20260001",
        pointsBalance: 100,
      },
    ],
    adoptionTrend: [
      { date: "2026-10-01", value: 1 },
      { date: "2026-10-02", value: 0 },
    ],
    pointGrantTrend: [
      { date: "2026-10-01", value: 30 },
      { date: "2026-10-02", value: 20 },
    ],
    ...overrides,
  };
}
