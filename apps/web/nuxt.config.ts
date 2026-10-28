import { env } from "./config/env";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-27",
  devServer: {
    port: env.WEB_PORT,
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: env.API_BASE_URL?.trim() || "/api/",
    },
  },
});
