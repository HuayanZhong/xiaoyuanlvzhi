import { env } from "./config/env";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-27",
  devtools: { enabled: false },
  modules: ["motion-v/nuxt"],
  devServer: {
    port: env.WEB_PORT,
  },
  app: {
    pageTransition: { name: "page" },
    head: {
      title: "一株 · 植物成长档案",
      htmlAttrs: { lang: "zh-CN" },
      meta: [
        {
          name: "description",
          content:
            "一株：领养绿植、记录养护、参与环保行动，让每一次照料都有迹可循。",
        },
      ],
      script: [
        {
          key: "theme-init",
          tagPosition: "head",
          innerHTML:
            '(function(){try{var stored=localStorage.getItem("student-theme");var theme=stored==="dark"||stored==="light"?stored:"light";document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme="light";}})();',
        },
      ],
    },
  },
  css: [
    "~/assets/css/fonts.css",
    "@fontsource-variable/noto-serif-sc/index.css",
    "@fontsource-variable/noto-sans-sc/index.css",
    "@fontsource-variable/fraunces/index.css",
    "~/assets/css/tokens.css",
    "~/assets/css/base.css",
    "~/assets/css/forms.css",
  ],
  runtimeConfig: {
    springApiOrigin: env.SPRING_API_ORIGIN,
    sessionCookieSecure: process.env.NODE_ENV === "production",
  },
  vite: {
    optimizeDeps: {
      include: [
        "@supermousejs/core",
        "@supermousejs/dot",
        "@supermousejs/ring",
        "lucide-vue-next",
        "reka-ui",
      ],
    },
  },
});
