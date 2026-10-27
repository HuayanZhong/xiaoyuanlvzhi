import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import { baseTestConfig } from "@repo/vitest-config/base";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    ...baseTestConfig,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
