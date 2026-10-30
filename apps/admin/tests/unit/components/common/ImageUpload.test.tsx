import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ImageUpload, { validateImage } from "@/components/common/ImageUpload";
import { ApiError } from "@/api/client";
import { uploadImage } from "@/api/files";
import { emitToast } from "@/lib/toast-events";

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/components/common/AuthenticatedImage", () => ({
  default: ({ fileId, alt }: { fileId: number; alt: string }) => (
    <img alt={alt} src={`/api/v1/files/${fileId}`} />
  ),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const uploadImageMock = vi.mocked(uploadImage);
const emitToastMock = vi.mocked(emitToast);

function selectFile(file: File) {
  const input = document.querySelector('input[type="file"]');

  if (!(input instanceof HTMLInputElement)) {
    throw new Error("upload input not found");
  }

  fireEvent.change(input, { target: { files: [file] } });
}

function imageFile(name = "plant.png", type = "image/png") {
  return new File(["image"], name, { type });
}

describe("ImageUpload", () => {
  beforeEach(() => {
    uploadImageMock.mockReset();
    emitToastMock.mockReset();
  });

  it("uploads a valid image and appends its file id", async () => {
    uploadImageMock.mockResolvedValue({
      id: 7,
      url: "/api/v1/files/7",
      originalName: "plant.png",
      contentType: "image/png",
      sizeBytes: 5,
      isPublic: true,
    });
    const onChange = vi.fn();

    render(<ImageUpload max={1} onChange={onChange} value={[]} />);
    selectFile(imageFile());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([7]));
  });

  it("hides the upload entry at the limit", () => {
    render(<ImageUpload max={3} value={[1, 2, 3]} />);

    expect(
      screen.queryByRole("button", { name: /^上传图片$/ }),
    ).not.toBeInTheDocument();
  });

  it("removes an image from the value", () => {
    const onChange = vi.fn();

    render(<ImageUpload max={3} onChange={onChange} value={[1, 2]} />);
    fireEvent.click(screen.getByRole("button", { name: "移除图片 1" }));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("rejects an unsupported file type", () => {
    const onChange = vi.fn();

    render(<ImageUpload max={3} onChange={onChange} value={[]} />);
    selectFile(imageFile("anim.gif", "image/gif"));

    expect(uploadImageMock).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(emitToastMock).toHaveBeenCalledWith(
      "error",
      "仅支持 JPG、PNG、WebP 格式的图片",
    );
  });

  it("rejects a file larger than 5 MB", () => {
    const onChange = vi.fn();
    const large = imageFile("large.png");
    Object.defineProperty(large, "size", { value: 5 * 1024 * 1024 + 1 });

    render(<ImageUpload max={3} onChange={onChange} value={[]} />);
    selectFile(large);

    expect(uploadImageMock).not.toHaveBeenCalled();
    expect(emitToastMock).toHaveBeenCalledWith(
      "error",
      "图片大小不能超过 5 MB",
    );
  });

  it("keeps the value unchanged when the upload fails", async () => {
    uploadImageMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const onChange = vi.fn();

    render(<ImageUpload max={3} onChange={onChange} value={[]} />);
    selectFile(imageFile());

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "无法连接后端服务，请稍后重试",
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("validates format, size and count directly", () => {
    expect(validateImage(imageFile("a.gif", "image/gif"), 3, 0)).toBe(
      "仅支持 JPG、PNG、WebP 格式的图片",
    );
    expect(validateImage(imageFile(), 3, 3)).toBe("图片数量已达上限");
    expect(validateImage(imageFile(), 3, 0)).toBeNull();
  });
});
