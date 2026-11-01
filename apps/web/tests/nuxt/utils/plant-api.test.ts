import { describe, expect, it, vi } from "vitest";
import { getSpecies, listSpecies } from "../../../app/utils/plant-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("plant api", () => {
  it("lists available species without filters", async () => {
    request.mockResolvedValue([]);

    await listSpecies();

    expect(request).toHaveBeenCalledWith("plants");
  });

  it("encodes keyword and location filters", async () => {
    request.mockResolvedValue([]);
    const expected = `plants?${new URLSearchParams({
      keyword: "绿萝",
      location: "图书馆",
    }).toString()}`;

    await listSpecies({ keyword: " 绿萝 ", location: "图书馆" });

    expect(request).toHaveBeenCalledWith(expected);
  });

  it("drops blank filters", async () => {
    request.mockResolvedValue([]);

    await listSpecies({ keyword: "  ", location: "" });

    expect(request).toHaveBeenCalledWith("plants");
  });

  it("loads one species by id", async () => {
    const species = { id: 3, name: "绿萝" };
    request.mockResolvedValue(species);

    await expect(getSpecies(3)).resolves.toBe(species);
    expect(request).toHaveBeenCalledWith("plants/3");
  });
});
