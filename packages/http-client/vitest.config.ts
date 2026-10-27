import { baseTestConfig } from "@repo/vitest-config/base";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    ...baseTestConfig,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
