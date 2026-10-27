import {
  configDefaults,
  coverageConfigDefaults,
  type TestUserConfig,
} from "vitest/config";

/**
 * Options shared by every Vitest project in the workspace.
 *
 * Each application spreads these options into its own `test` block so it can
 * still choose the right environment, include pattern, and setup files.
 */
export const baseTestConfig = {
  clearMocks: true,
  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov"],
    reportsDirectory: "./coverage",
    include: ["src/**/*.{ts,tsx}", "app/**/*.{ts,vue}", "shared/**/*.{ts,vue}"],
    exclude: [
      ...coverageConfigDefaults.exclude,
      "**/.nuxt/**",
      "**/.output/**",
      "**/main.ts",
      "**/main.tsx",
      "**/tests/**",
    ],
  },
  environment: "node",
  exclude: [...configDefaults.exclude, "**/.nuxt/**", "**/.output/**"],
  hookTimeout: 30_000,
  restoreMocks: true,
  testTimeout: 10_000,
} satisfies TestUserConfig;
