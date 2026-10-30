import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadImage, uploadImage } from "@/api/files";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);
const post = vi.mocked(http.post);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

describe("files api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("uploads a public image as multipart", async () => {
    const uploaded = {
      id: 7,
      url: "/api/v1/files/7",
      originalName: "plant.png",
      contentType: "image/png",
      sizeBytes: 1024,
      isPublic: true,
    };
    post.mockReturnValue(
      jsonResponse({ success: true, data: uploaded, error: null }),
    );
    const file = new File(["image"], "plant.png", { type: "image/png" });

    await expect(uploadImage(file)).resolves.toEqual(uploaded);

    const [path, options] = post.mock.calls[0] as [
      string,
      { body: FormData; searchParams: Record<string, string> },
    ];
    expect(path).toBe("files");
    expect(options.searchParams).toEqual({ isPublic: "true" });
    expect(options.body.get("file")).toBe(file);
  });

  it("loads an image through the authenticated client", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    get.mockReturnValue({ blob: vi.fn().mockResolvedValue(blob) } as never);

    await expect(loadImage(7)).resolves.toBe(blob);
    expect(get).toHaveBeenCalledWith("files/7");
  });
});
