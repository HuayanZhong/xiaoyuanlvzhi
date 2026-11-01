import { useNuxtApp } from "#app";
import type { ApiClient } from "~/utils/api";

/** 取得插件提供的学生端 API 客户端。 */
export function useApi(): ApiClient {
  return useNuxtApp().$api;
}
