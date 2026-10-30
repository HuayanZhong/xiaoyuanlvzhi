import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import { useFileUrl } from "@/hooks/useFileUrl";
import type { FileUrlResult } from "@/hooks/useFileUrl";

vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: vi.fn(),
}));

const useFileUrlMock = vi.mocked(useFileUrl);

function state(overrides: Partial<FileUrlResult> = {}): FileUrlResult {
  return {
    url: "blob:image",
    loading: false,
    error: false,
    reload: vi.fn(),
    ...overrides,
  };
}

describe("AuthenticatedImage", () => {
  beforeEach(() => {
    useFileUrlMock.mockReset();
  });

  it("renders the authenticated image", () => {
    useFileUrlMock.mockReturnValue(state());

    render(
      <AuthenticatedImage alt="凭证图片" fileId={7} height={64} width={64} />,
    );

    const image = screen.getByAltText("凭证图片");
    expect(image).toHaveAttribute("src", "blob:image");
    expect(useFileUrlMock).toHaveBeenCalledWith(7);
  });

  it("shows a skeleton while loading", () => {
    useFileUrlMock.mockReturnValue(state({ url: null, loading: true }));

    const { container } = render(
      <AuthenticatedImage alt="凭证图片" fileId={7} height={64} width={64} />,
    );

    expect(screen.queryByAltText("凭证图片")).not.toBeInTheDocument();
    expect(container.querySelector(".ant-skeleton-image")).not.toBeNull();
  });

  it("shows a failure placeholder and retries", () => {
    const reload = vi.fn();
    useFileUrlMock.mockReturnValue(
      state({ url: null, loading: false, error: true, reload }),
    );

    render(
      <AuthenticatedImage alt="凭证图片" fileId={7} height={64} width={64} />,
    );

    expect(screen.getByText("图片加载失败")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads when the file id changes", () => {
    useFileUrlMock.mockImplementation((fileId) =>
      state({ url: `blob:${String(fileId)}` }),
    );

    const { rerender } = render(
      <AuthenticatedImage alt="凭证图片" fileId={1} height={64} width={64} />,
    );

    expect(screen.getByAltText("凭证图片")).toHaveAttribute("src", "blob:1");

    rerender(
      <AuthenticatedImage alt="凭证图片" fileId={2} height={64} width={64} />,
    );

    expect(screen.getByAltText("凭证图片")).toHaveAttribute("src", "blob:2");
  });
});
