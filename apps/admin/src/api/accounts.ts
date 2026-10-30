import { request } from "./client";

/** 领养列表展示学生资料所需的最小账号字段。 */
export type StudentView = {
  id: number;
  email: string;
  fullName: string | null;
  studentNumber: string | null;
  department: string | null;
  className: string | null;
  status: string;
};

export function listStudents(): Promise<StudentView[]> {
  return request<StudentView[]>("admin/accounts");
}
