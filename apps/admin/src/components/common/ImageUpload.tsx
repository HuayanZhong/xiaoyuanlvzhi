import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Upload } from "antd";
import { useState } from "react";
import { uploadImage } from "@/api/files";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import { notifyError } from "@/lib/api-feedback";
import { emitToast } from "@/lib/toast-events";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMPTY_IDS: number[] = [];

export type ImageUploadProps = {
  value?: number[];
  onChange?: (value: number[]) => void;
  max?: number;
};

/** 校验图片格式、大小和数量；合法时返回 null。 */
export function validateImage(
  file: File,
  max: number,
  current: number,
): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "仅支持 JPG、PNG、WebP 格式的图片";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "图片大小不能超过 5 MB";
  }

  if (current >= max) {
    return "图片数量已达上限";
  }

  return null;
}

/** 受控图片上传：表单值只保存文件 ID，预览走公开文件地址。 */
export default function ImageUpload({
  value = EMPTY_IDS,
  onChange,
  max = 1,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const full = value.length >= max;

  const remove = (id: number) => {
    onChange?.(value.filter((item) => item !== id));
  };

  const upload = async (file: File) => {
    setUploading(true);

    try {
      const uploaded = await uploadImage(file);
      onChange?.([...value, uploaded.id]);
    } catch (error) {
      notifyError(error, "图片上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const problem = validateImage(file, max, value.length);

    if (problem) {
      emitToast("error", problem);
      return Upload.LIST_IGNORE;
    }

    void upload(file);
    return Upload.LIST_IGNORE;
  };

  return (
    <Flex gap={8} wrap>
      {value.map((id) => (
        <div key={id} style={{ position: "relative", width: 96, height: 96 }}>
          <AuthenticatedImage
            alt={`已上传图片 ${id}`}
            fileId={id}
            height={96}
            style={{ objectFit: "cover", borderRadius: 8 }}
            width={96}
          />
          <Button
            aria-label={`移除图片 ${id}`}
            icon={<CloseOutlined />}
            shape="circle"
            size="small"
            style={{ position: "absolute", top: 4, right: 4 }}
            onClick={() => remove(id)}
          />
        </div>
      ))}

      {!full && (
        <Upload
          accept={ACCEPTED_TYPES.join(",")}
          beforeUpload={beforeUpload}
          disabled={uploading}
          multiple={false}
          showUploadList={false}
        >
          <Button icon={<PlusOutlined />} loading={uploading}>
            上传图片
          </Button>
        </Upload>
      )}
    </Flex>
  );
}

/** 单图字段适配器：表单值使用 `number | null`，组件内部仍用数组。 */
export function SingleImageUpload({
  value,
  onChange,
}: {
  value?: number | null;
  onChange?: (value: number | null) => void;
}) {
  return (
    <ImageUpload
      max={1}
      onChange={(ids) => onChange?.(ids[0] ?? null)}
      value={value == null ? [] : [value]}
    />
  );
}
