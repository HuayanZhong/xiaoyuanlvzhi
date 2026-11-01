import { env } from "./config/env";
import { resolveApiBaseUrl } from "./shared/utils/api";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-27",
  devServer: {
    port: env.WEB_PORT,
  },
  app: {
    head: {
      htmlAttrs: { lang: "zh-CN" },
    },
  },
  css: ["~/assets/css/tokens.css", "~/assets/css/base.css"],
  runtimeConfig: {
    springApiOrigin: env.SPRING_API_ORIGIN,
    public: {
      apiBaseUrl: resolveApiBaseUrl(env.API_BASE_URL),
    },
  },
});
