import type { FeedbackEventView, FeedbackView } from "@/api/feedback";
import type { StudentView } from "@/api/accounts";

export function makeFeedbackEvent(
  overrides: Partial<FeedbackEventView> = {},
): FeedbackEventView {
  return {
    id: 1,
    actorId: 2,
    actorEmail: "student@qq.com",
    fromStatus: null,
    toStatus: "PENDING",
    message: "学生提交反馈",
    createdAt: "2026-10-30T10:00:00",
    ...overrides,
  };
}

export function makeFeedback(
  overrides: Partial<FeedbackView> = {},
): FeedbackView {
  return {
    id: 5,
    feedbackNo: "FB-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    type: "PLANT_ISSUE",
    relatedType: "ADOPTION",
    relatedId: "1",
    description: "绿植叶片发黄，不知道如何处理",
    imageFileIds: [],
    status: "PENDING",
    adminReply: null,
    handlerEmail: null,
    handledAt: null,
    createdAt: "2026-10-30T10:00:00",
    updatedAt: "2026-10-30T10:00:00",
    timeline: [makeFeedbackEvent()],
    ...overrides,
  };
}

export function makeStudent(overrides: Partial<StudentView> = {}): StudentView {
  return {
    id: 2,
    email: "student@qq.com",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    status: "ACTIVE",
    pointsBalance: 100,
    ...overrides,
  };
}
