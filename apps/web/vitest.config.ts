import { defineVitestConfig } from "@nuxt/test-utils/config";
import { baseTestConfig } from "@repo/vitest-config/base";

export default defineVitestConfig({
  test: {
    ...baseTestConfig,
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        domEnvironment: "jsdom",
      },
    },
    include: ["tests/nuxt/**/*.test.ts"],
  },
});
