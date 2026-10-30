import { Image, Skeleton } from "antd";
import type { CSSProperties } from "react";
import { useFileUrl } from "@/hooks/useFileUrl";

type AuthenticatedImageProps = {
  fileId: number;
  alt: string;
  width: number;
  height: number;
  style?: CSSProperties;
  preview?: boolean;
};

/** 需要登录态才能读取的图片；先带认证取 blob，再用对象 URL 渲染。 */
export default function AuthenticatedImage({
  fileId,
  alt,
  width,
  height,
  style,
  preview = true,
}: AuthenticatedImageProps) {
  const url = useFileUrl(fileId);

  if (!url) {
    return <Skeleton.Image active style={{ width, height }} />;
  }

  return (
    <Image
      alt={alt}
      height={height}
      preview={preview ? { mask: "预览" } : false}
      src={url}
      style={style}
      width={width}
    />
  );
}
