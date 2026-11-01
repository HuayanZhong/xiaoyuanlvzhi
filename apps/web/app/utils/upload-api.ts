import { useApi } from "~/composables/useApi";

export type UploadedImage = {
  id: number;
  url: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  isPublic: boolean;
};

/** 上传私有凭证图片；学生端不请求公开图片。 */
export function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file, file.name);

  return useApi().requestForm<UploadedImage>("files", form);
}
