import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as plantsApi from "@/api/plants";
import SpeciesPage from "@/pages/plants/SpeciesPage";
import { emitToast } from "@/lib/toast-events";

vi.mock("@/api/plants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/plants")>();

  return {
    ...actual,
    listSpecies: vi.fn(),
    createSpecies: vi.fn(),
    updateSpecies: vi.fn(),
    setSpeciesEnabled: vi.fn(),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const listSpecies = vi.mocked(plantsApi.listSpecies);
const createSpecies = vi.mocked(plantsApi.createSpecies);
const updateSpecies = vi.mocked(plantsApi.updateSpecies);
const setSpeciesEnabled = vi.mocked(plantsApi.setSpeciesEnabled);
const emitToastMock = vi.mocked(emitToast);

function makeSpecies(overrides: Partial<plantsApi.SpeciesView> = {}) {
  return {
    id: 1,
    name: "绿萝",
    coverFileId: null,
    difficulty: "EASY",
    lightDescription: "散射光",
    waterDescription: "每周一次",
    careIntervalDays: 7,
    carePoints: 10,
    otherDescription: null,
    enabled: true,
    availableCount: 3,
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  } satisfies plantsApi.SpeciesView;
}

function InstancesStub() {
  const location = useLocation();

  return (
    <div data-testid="instances-location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderPage(initialEntry = "/plants/species") {
  const router = createMemoryRouter(
    [
      { path: "/plants/species", element: <SpeciesPage /> },
      { path: "/plants/instances", element: <InstancesStub /> },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

function openCreate() {
  fireEvent.click(screen.getByRole("button", { name: /新增品种/ }));
}

function fillRequiredSpeciesFields(name = "芦荟") {
  fireEvent.change(screen.getByLabelText("品种名称"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("光照说明"), {
    target: { value: "散射光" },
  });
  fireEvent.change(screen.getByLabelText("浇水说明"), {
    target: { value: "每周一次" },
  });
}

describe("SpeciesPage", () => {
  beforeEach(() => {
    listSpecies.mockReset();
    createSpecies.mockReset();
    updateSpecies.mockReset();
    setSpeciesEnabled.mockReset();
    emitToastMock.mockReset();
  });

  it("renders species rows with readable status text", async () => {
    listSpecies.mockResolvedValue([
      makeSpecies({ id: 1, name: "绿萝", enabled: true }),
      makeSpecies({ id: 2, name: "芦荟", enabled: false }),
    ]);

    renderPage();

    expect(await screen.findByText("绿萝")).toBeInTheDocument();
    expect(screen.getByText("芦荟")).toBeInTheDocument();

    const tableText = screen
      .getAllByRole("table")
      .map((table) => table.textContent)
      .join(" ");
    expect(tableText).toContain("启用");
    expect(tableText).toContain("停用");
    expect(tableText).toContain("简单");
    expect(screen.getAllByText("可领养单株").length).toBeGreaterThan(0);
  });

  it("filters by name", async () => {
    listSpecies.mockResolvedValue([
      makeSpecies({ id: 1, name: "绿萝" }),
      makeSpecies({ id: 2, name: "芦荟" }),
    ]);

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.change(screen.getByPlaceholderText("品种名称"), {
      target: { value: "芦" },
    });
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("绿萝")).not.toBeInTheDocument();
    expect(screen.getByText("芦荟")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    listSpecies.mockResolvedValue([
      makeSpecies({ id: 1, name: "绿萝", enabled: true }),
      makeSpecies({ id: 2, name: "芦荟", enabled: false }),
    ]);

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const dropdown = await waitFor(() => {
      const element = document.querySelector(".ant-select-dropdown");
      if (!element) {
        throw new Error("select dropdown not found");
      }
      return element as HTMLElement;
    });
    fireEvent.click(within(dropdown).getByText("停用"));
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("绿萝")).not.toBeInTheDocument();
    expect(screen.getByText("芦荟")).toBeInTheDocument();
  });

  it("paginates ten rows per page", async () => {
    const rows = Array.from({ length: 12 }, (_, index) =>
      makeSpecies({
        id: index + 1,
        name: `品种${index + 1}`,
        updatedAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
      }),
    );
    listSpecies.mockResolvedValue(rows);

    renderPage();
    await screen.findByText("品种12");

    expect(screen.getByText("品种3")).toBeInTheDocument();
    expect(screen.queryByText("品种2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("品种2")).toBeInTheDocument();
    expect(screen.getByText("品种1")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    listSpecies.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无品种")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /新增品种/ }),
    ).toBeInTheDocument();
  });

  it("retries after a load failure", async () => {
    listSpecies
      .mockRejectedValueOnce(new ApiError("NETWORK_ERROR", "无法连接后端服务"))
      .mockResolvedValueOnce([makeSpecies({ name: "绿萝" })]);

    renderPage();

    expect(
      await screen.findByText("品种加载失败，请稍后重试"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("绿萝")).toBeInTheDocument();
  });

  it("creates a species from the drawer", async () => {
    listSpecies.mockResolvedValue([]);
    createSpecies.mockResolvedValue(makeSpecies({ name: "芦荟" }));

    renderPage();
    await screen.findByText("暂无品种");

    openCreate();
    fillRequiredSpeciesFields("芦荟");
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    await waitFor(() =>
      expect(createSpecies).toHaveBeenCalledWith({
        name: "芦荟",
        coverFileId: null,
        difficulty: "EASY",
        lightDescription: "散射光",
        waterDescription: "每周一次",
        careIntervalDays: 7,
        carePoints: 10,
        otherDescription: null,
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "品种已创建");
  });

  it("shows required field errors without sending a request", async () => {
    listSpecies.mockResolvedValue([]);

    renderPage();
    await screen.findByText("暂无品种");

    openCreate();
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    expect(await screen.findByText("请输入品种名称")).toBeInTheDocument();
    expect(createSpecies).not.toHaveBeenCalled();
  });

  it("maps a duplicate name error to the name field", async () => {
    listSpecies.mockResolvedValue([]);
    createSpecies.mockRejectedValue(
      new ApiError("PLANT_SPECIES_EXISTS", "这个品种名称已存在", 409),
    );

    renderPage();
    await screen.findByText("暂无品种");

    openCreate();
    fillRequiredSpeciesFields("绿萝");
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    expect(await screen.findByText("这个品种名称已存在")).toBeInTheDocument();
    expect(emitToastMock).not.toHaveBeenCalledWith(
      "error",
      "这个品种名称已存在",
    );
  });

  it("edits a species", async () => {
    listSpecies.mockResolvedValue([makeSpecies({ id: 5, name: "绿萝" })]);
    updateSpecies.mockResolvedValue(
      makeSpecies({ id: 5, lightDescription: "新的光照" }),
    );

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.click(screen.getByRole("button", { name: /编\s*辑/ }));
    fireEvent.change(screen.getByLabelText("光照说明"), {
      target: { value: "新的光照" },
    });
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    await waitFor(() =>
      expect(updateSpecies).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ lightDescription: "新的光照" }),
      ),
    );
  });

  it("confirms before disabling a species", async () => {
    listSpecies.mockResolvedValue([makeSpecies({ id: 5, name: "绿萝" })]);
    setSpeciesEnabled.mockResolvedValue(makeSpecies({ id: 5, enabled: false }));

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.click(screen.getByRole("button", { name: /停\s*用/ }));
    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");
      if (!element) {
        throw new Error("popover not found");
      }
      return element as HTMLElement;
    });
    fireEvent.click(within(popover).getByRole("button", { name: /停\s*用/ }));

    await waitFor(() =>
      expect(setSpeciesEnabled).toHaveBeenCalledWith(5, false),
    );
  });

  it("keeps the species enabled when the confirmation is cancelled", async () => {
    listSpecies.mockResolvedValue([makeSpecies({ id: 5, name: "绿萝" })]);

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.click(screen.getByRole("button", { name: /停\s*用/ }));
    const popover = await waitFor(() => {
      const element = document.querySelector(".ant-popover");
      if (!element) {
        throw new Error("popover not found");
      }
      return element as HTMLElement;
    });
    fireEvent.click(within(popover).getByRole("button", { name: /取\s*消/ }));

    expect(setSpeciesEnabled).not.toHaveBeenCalled();
  });

  it("navigates to the instances page with the species filter", async () => {
    listSpecies.mockResolvedValue([makeSpecies({ id: 5, name: "绿萝" })]);

    renderPage();
    await screen.findByText("绿萝");

    fireEvent.click(screen.getByRole("button", { name: "查看单株" }));

    expect(await screen.findByTestId("instances-location")).toHaveTextContent(
      "/plants/instances?speciesId=5",
    );
  });
});
