import { request } from "./client";

export const PLANT_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type PlantDifficulty = (typeof PLANT_DIFFICULTIES)[number];

export const INDIVIDUAL_STATUSES = [
  "AVAILABLE",
  "WAITING_PICKUP",
  "ACTIVE",
  "MAINTENANCE",
  "DISABLED",
] as const;
export type IndividualStatus = (typeof INDIVIDUAL_STATUSES)[number];

export type SpeciesView = {
  id: number;
  name: string;
  coverFileId: number | null;
  difficulty: string;
  lightDescription: string;
  waterDescription: string;
  careIntervalDays: number;
  carePoints: number;
  otherDescription: string | null;
  enabled: boolean;
  availableCount: number;
  updatedAt: string;
};

export type SpeciesRequest = {
  name: string;
  coverFileId: number | null;
  difficulty: string;
  lightDescription: string;
  waterDescription: string;
  careIntervalDays: number;
  carePoints: number;
  otherDescription: string | null;
};

export type IndividualView = {
  id: number;
  code: string;
  speciesId: number;
  speciesName: string;
  displayName: string | null;
  location: string;
  status: string;
  imageFileIds: number[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IndividualRequest = {
  code: string;
  speciesId: number;
  displayName: string | null;
  location: string;
  imageFileIds: number[];
  notes: string | null;
};

const SPECIES_PATH = "admin/plant-species";
const INDIVIDUALS_PATH = "admin/plant-individuals";

export function listSpecies(): Promise<SpeciesView[]> {
  return request<SpeciesView[]>(SPECIES_PATH);
}

export function createSpecies(input: SpeciesRequest): Promise<SpeciesView> {
  return request<SpeciesView>(SPECIES_PATH, { method: "POST", json: input });
}

export function updateSpecies(
  id: number,
  input: SpeciesRequest,
): Promise<SpeciesView> {
  return request<SpeciesView>(`${SPECIES_PATH}/${id}`, {
    method: "PUT",
    json: input,
  });
}

export function setSpeciesEnabled(
  id: number,
  enabled: boolean,
): Promise<SpeciesView> {
  return request<SpeciesView>(
    `${SPECIES_PATH}/${id}/${enabled ? "enable" : "disable"}`,
    { method: "POST" },
  );
}

export function listIndividuals(): Promise<IndividualView[]> {
  return request<IndividualView[]>(INDIVIDUALS_PATH);
}

export function createIndividual(
  input: IndividualRequest,
): Promise<IndividualView> {
  return request<IndividualView>(INDIVIDUALS_PATH, {
    method: "POST",
    json: input,
  });
}

export function updateIndividual(
  id: number,
  input: IndividualRequest,
): Promise<IndividualView> {
  return request<IndividualView>(`${INDIVIDUALS_PATH}/${id}`, {
    method: "PUT",
    json: input,
  });
}

export function sendToMaintenance(id: number): Promise<IndividualView> {
  return request<IndividualView>(`${INDIVIDUALS_PATH}/${id}/maintenance`, {
    method: "POST",
  });
}

export function finishMaintenance(id: number): Promise<IndividualView> {
  return request<IndividualView>(
    `${INDIVIDUALS_PATH}/${id}/maintenance/complete`,
    { method: "POST" },
  );
}

export function disableIndividual(id: number): Promise<IndividualView> {
  return request<IndividualView>(`${INDIVIDUALS_PATH}/${id}/disable`, {
    method: "POST",
  });
}
