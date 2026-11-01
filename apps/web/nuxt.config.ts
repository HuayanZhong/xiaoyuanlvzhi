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
      script: [
        {
          key: "theme-init",
          tagPosition: "head",
          innerHTML:
            '(function(){try{var stored=localStorage.getItem("student-theme");var theme=stored==="dark"||stored==="light"?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(e){}})();',
        },
      ],
    },
  },
  css: [
    "~/assets/css/tokens.css",
    "~/assets/css/base.css",
    "~/assets/css/forms.css",
  ],
  runtimeConfig: {
    springApiOrigin: env.SPRING_API_ORIGIN,
    public: {
      apiBaseUrl: resolveApiBaseUrl(env.API_BASE_URL),
    },
  },
});
