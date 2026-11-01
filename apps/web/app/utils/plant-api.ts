import { useApi } from "~/composables/useApi";

export type PlantSpecies = {
  id: number;
  name: string;
  difficulty: string | null;
  lightDescription: string | null;
  waterDescription: string | null;
  careIntervalDays: number | null;
  carePoints: number | null;
  otherDescription: string | null;
  coverFileId: number | null;
  availableCount: number;
  enabled: boolean;
  updatedAt: string | null;
};

export type SpeciesFilters = {
  keyword?: string;
  location?: string;
};

/** 可领养品种列表；筛选条件为空时不带查询参数。 */
export function listSpecies(filters: SpeciesFilters = {}) {
  return useApi().request<PlantSpecies[]>(
    withFilters("plants", buildSpeciesQuery(filters.keyword, filters.location)),
  );
}

/** 把筛选输入整理成 URL 查询对象，去掉空白项。 */
export function buildSpeciesQuery(
  keyword?: string | null,
  location?: string | null,
): Record<string, string> {
  const query: Record<string, string> = {};
  const trimmedKeyword = keyword?.trim();
  const trimmedLocation = location?.trim();

  if (trimmedKeyword) {
    query.keyword = trimmedKeyword;
  }

  if (trimmedLocation) {
    query.location = trimmedLocation;
  }

  return query;
}

/** 单个品种的养护说明与当前可领养数量。 */
export function getSpecies(id: number | string) {
  return useApi().request<PlantSpecies>(`plants/${id}`);
}

function withFilters(path: string, filters: Record<string, string>): string {
  const query = new URLSearchParams(filters).toString();

  return query ? `${path}?${query}` : path;
}
