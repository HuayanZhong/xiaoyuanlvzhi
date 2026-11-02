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

export type StudentProfileUpdate = {
  /** 必填，不能清空；格式由服务端校验。 */
  phone: string;
  /** 允许空字符串清空班级。 */
  className: string;
};

/** 修改当前学生的手机号和班级，返回最新资料。 */
export function updateStudentProfile(input: StudentProfileUpdate) {
  return useApi().request<StudentProfile>("profile", {
    method: "PUT",
    body: input,
  });
}
