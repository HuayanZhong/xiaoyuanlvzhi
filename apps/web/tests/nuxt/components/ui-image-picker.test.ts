import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../app/utils/api";
import UiImagePicker from "../../../app/components/UiImagePicker.vue";

const uploadImage = vi.hoisted(() => vi.fn());

vi.mock("~/utils/upload-api", () => ({ uploadImage }));

const createObjectURL = vi.fn(() => "blob:preview");
const revokeObjectURL = vi.fn();

function imageFile(name = "leaf.png", type = "image/png") {
  return new File(["image"], name, { type });
}

async function selectFiles(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  files: File[],
) {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, "files", {
    value: files,
    configurable: true,
  });
  await input.trigger("change");
  await flushPromises();
}

describe("UiImagePicker", () => {
  beforeEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    uploadImage.mockReset();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it("uploads a valid image and shows a preview", async () => {
    uploadImage.mockResolvedValue({ id: 6 });
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });

    await selectFiles(wrapper, [imageFile()]);

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(wrapper.get(".ui-image-picker__image").attributes("src")).toBe(
      "blob:preview",
    );
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([[6]]);
    expect(wrapper.get(".ui-image-picker__counter").text()).toBe("1 / 3");
  });

  it("rejects unsupported file types before uploading", async () => {
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });

    await selectFiles(wrapper, [imageFile("note.gif", "image/gif")]);

    expect(uploadImage).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("只支持 JPG、PNG 或 WebP 图片");
  });

  it("rejects files larger than 5 MB", async () => {
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });
    const file = imageFile();
    Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 });

    await selectFiles(wrapper, [file]);

    expect(uploadImage).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("图片不能超过 5 MB");
  });

  it("keeps successful uploads when another file fails", async () => {
    uploadImage
      .mockResolvedValueOnce({ id: 6 })
      .mockRejectedValueOnce(
        new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
      );
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });

    await selectFiles(wrapper, [imageFile("a.png"), imageFile("b.png")]);

    expect(wrapper.findAll(".ui-image-picker__item")).toHaveLength(1);
    expect(wrapper.text()).toContain("无法连接后端服务，请稍后重试");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([[6]]);
  });

  it("revokes the preview when an image is removed", async () => {
    uploadImage.mockResolvedValue({ id: 6 });
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });
    await selectFiles(wrapper, [imageFile()]);

    await wrapper.get(".ui-image-picker__remove").trigger("click");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    expect(wrapper.findAll(".ui-image-picker__item")).toHaveLength(0);
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([[]]);
  });

  it("stops at the three image limit", async () => {
    uploadImage.mockResolvedValue({ id: 6 });
    const wrapper = await mountSuspended(UiImagePicker, {
      props: { id: "evidence", label: "凭证图片", modelValue: [] },
    });

    await selectFiles(wrapper, [
      imageFile("a.png"),
      imageFile("b.png"),
      imageFile("c.png"),
    ]);

    expect(uploadImage).toHaveBeenCalledTimes(3);
    expect(wrapper.get(".ui-image-picker__actions button").text()).toBe(
      "已达上限",
    );
    expect(
      wrapper.get(".ui-image-picker__actions button").attributes("disabled"),
    ).toBeDefined();
  });
});
