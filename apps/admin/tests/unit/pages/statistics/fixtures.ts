import type { StatisticsView } from "@/api/statistics";

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
