import { http } from "@/lib/http";
import { request } from "./client";

/** Spring 文件视图。 */
export type UploadedFile = {
  id: number;
  url: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  isPublic: boolean;
};

const FILES_PATH = "files";

/** 上传公开图片；管理员上传的图片可被匿名读取，便于直接预览。 */
export function uploadImage(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append("file", file);

  return request<UploadedFile>(FILES_PATH, {
    method: "POST",
    body,
    searchParams: { isPublic: "true" },
  });
}

/** 通过带认证头的请求读取图片内容；文件接口不因为公开而跳过登录。 */
export function loadImage(id: number): Promise<Blob> {
  return http.get(`${FILES_PATH}/${id}`).blob();
}
