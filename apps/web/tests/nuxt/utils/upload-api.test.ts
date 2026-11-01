import { describe, expect, it, vi } from "vitest";
import { uploadImage } from "../../../app/utils/upload-api";

const requestForm = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ requestForm }),
}));

describe("upload api", () => {
  it("posts the file under the file field", async () => {
    const uploaded = {
      id: 4,
      url: "/api/v1/files/4",
      originalName: "leaf.png",
      contentType: "image/png",
      sizeBytes: 3,
      isPublic: false,
    };
    requestForm.mockResolvedValue(uploaded);
    const file = new File(["abc"], "leaf.png", { type: "image/png" });

    await expect(uploadImage(file)).resolves.toBe(uploaded);

    const [path, form] = requestForm.mock.calls[0] as [string, FormData];
    expect(path).toBe("files");
    const sent = form.get("file");
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe("leaf.png");
    expect((sent as File).type).toBe("image/png");
  });

  it("does not request a public upload", async () => {
    requestForm.mockResolvedValue({ id: 1, isPublic: false });

    await uploadImage(new File(["a"], "a.jpg", { type: "image/jpeg" }));

    const [, form] = requestForm.mock.calls[0] as [string, FormData];
    expect(form.get("isPublic")).toBeNull();
  });
});
