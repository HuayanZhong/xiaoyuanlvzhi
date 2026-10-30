import react from "@vitejs/plugin-react";
import { baseTestConfig } from "@repo/vitest-config/base";
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import { env } from "./src/config/env";

// 环境变量由 dotenv-cli 注入 process.env；校验通过后转成 Vite 的暴露前缀。
process.env.VITE_API_BASE_URL = env.API_BASE_URL ?? "";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: env.ADMIN_PORT,
    proxy: {
      "/api": {
        target: env.SPRING_API_ORIGIN,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: env.ADMIN_PORT,
  },
  test: {
    ...baseTestConfig,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
