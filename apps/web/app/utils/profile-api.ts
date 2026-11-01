import { useApi } from "~/composables/useApi";
import type { StudentAccount } from "./auth-api";

export type StudentProfile = StudentAccount & {
  pointsBalance: number;
  activeAdoptionCount: number;
  createdAt: string;
  updatedAt: string;
};

/** 查询当前学生的资料、积分余额和在养绿植数。 */
export function getStudentProfile() {
  return useApi().request<StudentProfile>("profile");
}
