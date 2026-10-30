import { HTTPError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import {
  createIndividual,
  createSpecies,
  disableIndividual,
  finishMaintenance,
  listIndividuals,
  listSpecies,
  sendToMaintenance,
  setSpeciesEnabled,
  updateIndividual,
  updateSpecies,
  type IndividualRequest,
  type SpeciesRequest,
} from "@/api/plants";
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
const put = vi.mocked(http.put);

const species: SpeciesRequest = {
  name: "绿萝",
  coverFileId: 1,
  difficulty: "EASY",
  lightDescription: "散射光",
  waterDescription: "每周一次",
  careIntervalDays: 7,
  carePoints: 10,
  otherDescription: null,
};

const individual: IndividualRequest = {
  code: "PLANT-001",
  speciesId: 1,
  displayName: "图书馆的绿萝",
  location: "图书馆一楼",
  imageFileIds: [1, 2],
  notes: null,
};

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

function jsonFailure(error: unknown) {
  return { json: vi.fn().mockRejectedValue(error) } as never;
}

function httpError(status: number, code: string, message: string) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/test");
  const error = new HTTPError(response, request, {} as never);
  error.data = { success: false, data: null, error: { code, message } };
  return error;
}

describe("plants api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("lists species", async () => {
    get.mockReturnValue(jsonResponse({ success: true, data: [], error: null }));

    await expect(listSpecies()).resolves.toEqual([]);
    expect(get).toHaveBeenCalledWith("admin/plant-species", {});
  });

  it("creates and updates species", async () => {
    const view = { id: 1, name: "绿萝" };
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );
    put.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await expect(createSpecies(species)).resolves.toEqual(view);
    await expect(updateSpecies(1, species)).resolves.toEqual(view);

    expect(post).toHaveBeenCalledWith("admin/plant-species", {
      json: species,
    });
    expect(put).toHaveBeenCalledWith("admin/plant-species/1", {
      json: species,
    });
  });

  it("enables and disables a species", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: {}, error: null }),
    );

    await setSpeciesEnabled(3, true);
    await setSpeciesEnabled(3, false);

    expect(post).toHaveBeenNthCalledWith(1, "admin/plant-species/3/enable", {});
    expect(post).toHaveBeenNthCalledWith(
      2,
      "admin/plant-species/3/disable",
      {},
    );
  });

  it("lists, creates and updates individuals", async () => {
    const view = { id: 10, code: "PLANT-001" };
    get.mockReturnValue(
      jsonResponse({ success: true, data: [view], error: null }),
    );
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );
    put.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await expect(listIndividuals()).resolves.toEqual([view]);
    await expect(createIndividual(individual)).resolves.toEqual(view);
    await expect(updateIndividual(10, individual)).resolves.toEqual(view);

    expect(get).toHaveBeenCalledWith("admin/plant-individuals", {});
    expect(post).toHaveBeenCalledWith("admin/plant-individuals", {
      json: individual,
    });
    expect(put).toHaveBeenCalledWith("admin/plant-individuals/10", {
      json: individual,
    });
  });

  it("runs the individual status actions", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: {}, error: null }),
    );

    await sendToMaintenance(10);
    await finishMaintenance(10);
    await disableIndividual(10);

    expect(post).toHaveBeenNthCalledWith(
      1,
      "admin/plant-individuals/10/maintenance",
      {},
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "admin/plant-individuals/10/maintenance/complete",
      {},
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "admin/plant-individuals/10/disable",
      {},
    );
  });

  it("preserves known business error codes", async () => {
    post.mockReturnValue(
      jsonFailure(httpError(409, "PLANT_SPECIES_EXISTS", "这个品种名称已存在")),
    );

    const error = await createSpecies(species).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "PLANT_SPECIES_EXISTS",
      message: "这个品种名称已存在",
      status: 409,
    });
  });

  it("preserves the duplicate code error", async () => {
    post.mockReturnValue(
      jsonFailure(httpError(409, "PLANT_CODE_EXISTS", "单株编号已存在")),
    );

    await expect(createIndividual(individual)).rejects.toMatchObject({
      code: "PLANT_CODE_EXISTS",
      status: 409,
    });
  });

  it("preserves the disabled species error", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(400, "PLANT_SPECIES_DISABLED", "停用品种不能添加单株"),
      ),
    );

    await expect(createIndividual(individual)).rejects.toMatchObject({
      code: "PLANT_SPECIES_DISABLED",
      status: 400,
    });
  });
});
