import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadImage } from "@/api/files";
import { useFileUrl } from "@/hooks/useFileUrl";

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

const loadImageMock = vi.mocked(loadImage);
const createObjectURL = vi.fn();
const revokeObjectURL = vi.fn();
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function blob() {
  return new Blob(["image"], { type: "image/png" });
}

beforeEach(() => {
  loadImageMock.mockReset();
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
  createObjectURL.mockReturnValue("blob:image");
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("useFileUrl", () => {
  it("loads a file id into an object URL", async () => {
    loadImageMock.mockResolvedValue(blob());

    const { result } = renderHook(() => useFileUrl(7));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.url).toBe("blob:image"));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(loadImageMock).toHaveBeenCalledWith(7);
  });

  it("clears the old URL immediately when the file id changes", async () => {
    createObjectURL
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    loadImageMock.mockResolvedValue(blob());

    const { result, rerender } = renderHook(
      ({ fileId }: { fileId: number }) => useFileUrl(fileId),
      { initialProps: { fileId: 1 } },
    );

    await waitFor(() => expect(result.current.url).toBe("blob:first"));

    rerender({ fileId: 2 });

    expect(result.current.url).toBeNull();
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.url).toBe("blob:second"));
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first");
  });

  it("clears the URL when the file id becomes empty", async () => {
    loadImageMock.mockResolvedValue(blob());

    const { result, rerender } = renderHook(
      ({ fileId }: { fileId: number | null }) => useFileUrl(fileId),
      { initialProps: { fileId: 1 as number | null } },
    );

    await waitFor(() => expect(result.current.url).toBe("blob:image"));

    rerender({ fileId: null });

    expect(result.current.url).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:image");
  });

  it("reports a load failure", async () => {
    loadImageMock.mockRejectedValue(new Error("failed"));

    const { result } = renderHook(() => useFileUrl(7));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.url).toBeNull();
  });

  it("releases the object URL on unmount", async () => {
    loadImageMock.mockResolvedValue(blob());

    const { result, unmount } = renderHook(() => useFileUrl(7));

    await waitFor(() => expect(result.current.url).toBe("blob:image"));

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:image");
  });

  it("reloads after a failure", async () => {
    loadImageMock
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValue(blob());

    const { result } = renderHook(() => useFileUrl(7));

    await waitFor(() => expect(result.current.error).toBe(true));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.url).toBe("blob:image"));
    expect(loadImageMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe(false);
  });
});
