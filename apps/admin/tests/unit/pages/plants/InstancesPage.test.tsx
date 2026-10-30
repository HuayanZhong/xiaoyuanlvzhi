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
import InstancesPage from "@/pages/plants/InstancesPage";
import { emitToast } from "@/lib/toast-events";

vi.mock("@/api/plants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/plants")>();

  return {
    ...actual,
    listSpecies: vi.fn(),
    listIndividuals: vi.fn(),
    createIndividual: vi.fn(),
    updateIndividual: vi.fn(),
    sendToMaintenance: vi.fn(),
    finishMaintenance: vi.fn(),
    disableIndividual: vi.fn(),
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
const listIndividuals = vi.mocked(plantsApi.listIndividuals);
const createIndividual = vi.mocked(plantsApi.createIndividual);
const updateIndividual = vi.mocked(plantsApi.updateIndividual);
const sendToMaintenance = vi.mocked(plantsApi.sendToMaintenance);
const finishMaintenance = vi.mocked(plantsApi.finishMaintenance);
const disableIndividual = vi.mocked(plantsApi.disableIndividual);
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

function makeIndividual(overrides: Partial<plantsApi.IndividualView> = {}) {
  return {
    id: 10,
    code: "PLANT-001",
    speciesId: 1,
    speciesName: "绿萝",
    displayName: "图书馆的绿萝",
    location: "图书馆一楼",
    status: "AVAILABLE",
    imageFileIds: [],
    notes: null,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  } satisfies plantsApi.IndividualView;
}

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{location.search}</div>;
}

function renderPage(initialEntry = "/plants/instances") {
  const router = createMemoryRouter(
    [
      {
        path: "/plants/instances",
        element: (
          <>
            <InstancesPage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>,
  );
}

async function selectOption(combobox: HTMLElement, label: string) {
  fireEvent.mouseDown(combobox);

  const dropdown = await waitFor(() => {
    const candidates = Array.from(
      document.querySelectorAll(".ant-select-dropdown"),
    ).filter(
      (element) => !element.classList.contains("ant-select-dropdown-hidden"),
    );
    const last = candidates.at(-1);

    if (!last) {
      throw new Error("select dropdown not found");
    }

    return last as HTMLElement;
  });

  fireEvent.click(within(dropdown).getByText(label));
}

function rowOf(text: string) {
  const row = screen.getByText(text).closest("tr");

  if (!row) {
    throw new Error(`row for ${text} not found`);
  }

  return row as HTMLElement;
}

async function confirmPopover(label: string) {
  const popover = await waitFor(() => {
    const element = document.querySelector(".ant-popover");
    if (!element) {
      throw new Error("popover not found");
    }
    return element as HTMLElement;
  });

  fireEvent.click(within(popover).getByRole("button", { name: label }));
}

describe("InstancesPage", () => {
  beforeEach(() => {
    listSpecies.mockReset();
    listIndividuals.mockReset();
    createIndividual.mockReset();
    updateIndividual.mockReset();
    sendToMaintenance.mockReset();
    finishMaintenance.mockReset();
    disableIndividual.mockReset();
    emitToastMock.mockReset();
  });

  it("renders individuals with readable status text", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", status: "AVAILABLE" }),
      makeIndividual({
        id: 11,
        code: "PLANT-002",
        status: "MAINTENANCE",
      }),
    ]);

    renderPage();

    expect(await screen.findByText("PLANT-001")).toBeInTheDocument();
    expect(screen.getByText("PLANT-002")).toBeInTheDocument();
    expect(screen.getAllByText("可领养").length).toBeGreaterThan(0);
    expect(screen.getAllByText("维护中").length).toBeGreaterThan(0);
  });

  it("applies the species filter from the URL", async () => {
    listSpecies.mockResolvedValue([
      makeSpecies({ id: 1, name: "绿萝" }),
      makeSpecies({ id: 2, name: "芦荟" }),
    ]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", speciesId: 1 }),
      makeIndividual({
        id: 11,
        code: "PLANT-002",
        speciesId: 2,
        speciesName: "芦荟",
      }),
    ]);

    renderPage("/plants/instances?speciesId=2");

    expect(await screen.findByText("PLANT-002")).toBeInTheDocument();
    expect(screen.queryByText("PLANT-001")).not.toBeInTheDocument();
  });

  it("ignores an unknown species id", async () => {
    listSpecies.mockResolvedValue([makeSpecies({ id: 1 })]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", speciesId: 1 }),
    ]);

    renderPage("/plants/instances?speciesId=999");

    expect(await screen.findByText("PLANT-001")).toBeInTheDocument();
  });

  it("filters by keyword and status, then resets", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", location: "图书馆" }),
      makeIndividual({
        id: 11,
        code: "PLANT-002",
        location: "教学楼",
        status: "MAINTENANCE",
      }),
    ]);

    renderPage();
    await screen.findByText("PLANT-001");

    fireEvent.change(screen.getByPlaceholderText("单株编号或位置"), {
      target: { value: "图书" },
    });
    await selectOption(screen.getAllByRole("combobox")[1]!, "维护中");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.queryByText("PLANT-001")).not.toBeInTheDocument();
    expect(screen.queryByText("PLANT-002")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    expect(screen.getByText("PLANT-001")).toBeInTheDocument();
    expect(screen.getByText("PLANT-002")).toBeInTheDocument();
  });

  it("paginates ten rows per page", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        makeIndividual({
          id: index + 1,
          code: `PLANT-${String(index + 1).padStart(3, "0")}`,
          createdAt: `2026-10-${String(index + 1).padStart(2, "0")}T09:00:00`,
        }),
      ),
    );

    renderPage();
    await screen.findByText("PLANT-012");

    expect(screen.getByText("PLANT-003")).toBeInTheDocument();
    expect(screen.queryByText("PLANT-002")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("2"));

    expect(await screen.findByText("PLANT-002")).toBeInTheDocument();
    expect(screen.getByText("PLANT-001")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("暂无单株")).toBeInTheDocument();
  });

  it("creates an individual from the drawer", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([]);
    createIndividual.mockResolvedValue(makeIndividual({ id: 20 }));

    renderPage();
    await screen.findByText("暂无单株");

    fireEvent.click(screen.getByRole("button", { name: /新增单株/ }));
    fireEvent.change(screen.getByLabelText("单株编号"), {
      target: { value: "PLANT-010" },
    });
    await selectOption(
      screen.getAllByRole("combobox").at(-1) as HTMLElement,
      "绿萝",
    );
    fireEvent.change(screen.getByLabelText("摆放位置"), {
      target: { value: "图书馆" },
    });
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    await waitFor(() =>
      expect(createIndividual).toHaveBeenCalledWith({
        code: "PLANT-010",
        speciesId: 1,
        displayName: null,
        location: "图书馆",
        imageFileIds: [],
        notes: null,
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "单株已创建");
  });

  it("keeps code and species read-only when editing", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", speciesId: 1 }),
    ]);
    updateIndividual.mockResolvedValue(makeIndividual({ id: 10 }));

    renderPage();
    await screen.findByText("PLANT-001");

    fireEvent.click(screen.getByRole("button", { name: /编\s*辑/ }));

    expect(screen.getByLabelText("单株编号")).toBeDisabled();
    expect(
      screen.getAllByRole("combobox").at(-1)?.closest(".ant-select"),
    ).toHaveClass("ant-select-disabled");

    fireEvent.change(screen.getByLabelText("摆放位置"), {
      target: { value: "教学楼" },
    });
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    await waitFor(() =>
      expect(updateIndividual).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          code: "PLANT-001",
          speciesId: 1,
          location: "教学楼",
        }),
      ),
    );
  });

  it("maps a duplicate code error to the code field", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([]);
    createIndividual.mockRejectedValue(
      new ApiError("PLANT_CODE_EXISTS", "单株编号已存在", 409),
    );

    renderPage();
    await screen.findByText("暂无单株");

    fireEvent.click(screen.getByRole("button", { name: /新增单株/ }));
    fireEvent.change(screen.getByLabelText("单株编号"), {
      target: { value: "PLANT-001" },
    });
    await selectOption(
      screen.getAllByRole("combobox").at(-1) as HTMLElement,
      "绿萝",
    );
    fireEvent.change(screen.getByLabelText("摆放位置"), {
      target: { value: "图书馆" },
    });
    fireEvent.click(screen.getByRole("button", { name: /保\s*存/ }));

    expect(await screen.findByText("单株编号已存在")).toBeInTheDocument();
  });

  it("only offers actions allowed by the current status", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", status: "AVAILABLE" }),
      makeIndividual({ id: 11, code: "PLANT-002", status: "MAINTENANCE" }),
      makeIndividual({ id: 12, code: "PLANT-003", status: "ACTIVE" }),
    ]);

    renderPage();
    await screen.findByText("PLANT-001");

    const available = rowOf("PLANT-001");
    expect(
      within(available).getByRole("button", { name: /送\s*修/ }),
    ).toBeInTheDocument();
    expect(
      within(available).getByRole("button", { name: /停\s*用/ }),
    ).toBeInTheDocument();
    expect(
      within(available).queryByRole("button", { name: /维护完成/ }),
    ).not.toBeInTheDocument();

    const maintenance = rowOf("PLANT-002");
    expect(
      within(maintenance).getByRole("button", { name: /维护完成/ }),
    ).toBeInTheDocument();
    expect(
      within(maintenance).getByRole("button", { name: /停\s*用/ }),
    ).toBeInTheDocument();
    expect(
      within(maintenance).queryByRole("button", { name: /送\s*修/ }),
    ).not.toBeInTheDocument();

    const active = rowOf("PLANT-003");
    expect(
      within(active).queryByRole("button", { name: /送\s*修/ }),
    ).not.toBeInTheDocument();
    expect(
      within(active).queryByRole("button", { name: /维护完成/ }),
    ).not.toBeInTheDocument();
    expect(
      within(active).queryByRole("button", { name: /停\s*用/ }),
    ).not.toBeInTheDocument();
  });

  it("sends an available plant to maintenance after confirmation", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", status: "AVAILABLE" }),
    ]);
    sendToMaintenance.mockResolvedValue(
      makeIndividual({ id: 10, status: "MAINTENANCE" }),
    );

    renderPage();
    await screen.findByText("PLANT-001");

    fireEvent.click(screen.getByRole("button", { name: /送\s*修/ }));
    await confirmPopover("送 修");

    await waitFor(() => expect(sendToMaintenance).toHaveBeenCalledWith(10));
    expect(emitToastMock).toHaveBeenCalledWith("success", "单株已送修");
  });

  it("keeps the row state when an action fails", async () => {
    listSpecies.mockResolvedValue([makeSpecies()]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", status: "AVAILABLE" }),
    ]);
    sendToMaintenance.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );

    renderPage();
    await screen.findByText("PLANT-001");

    fireEvent.click(screen.getByRole("button", { name: /送\s*修/ }));
    await confirmPopover("送 修");

    await waitFor(() =>
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "无法连接后端服务，请稍后重试",
      ),
    );
    expect(within(rowOf("PLANT-001")).getByText("可领养")).toBeInTheDocument();
  });

  it("writes the species filter back to the URL", async () => {
    listSpecies.mockResolvedValue([
      makeSpecies({ id: 1, name: "绿萝" }),
      makeSpecies({ id: 2, name: "芦荟" }),
    ]);
    listIndividuals.mockResolvedValue([
      makeIndividual({ id: 10, code: "PLANT-001", speciesId: 1 }),
      makeIndividual({ id: 11, code: "PLANT-002", speciesId: 2 }),
    ]);

    renderPage();
    await screen.findByText("PLANT-001");

    await selectOption(screen.getAllByRole("combobox")[0]!, "芦荟");
    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));

    expect(screen.getByTestId("location")).toHaveTextContent("speciesId=2");
  });
});
