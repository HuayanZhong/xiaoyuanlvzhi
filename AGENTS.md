<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Repository guidance for coding agents

## Repository at a glance

pnpm + Turborepo workspace with three apps and two config-only packages:

| Package                   | Stack                            | Port | Role                   |
| ------------------------- | -------------------------------- | ---- | ---------------------- |
| `admin`                   | React 19 + Vite 8 + TypeScript 6 | 3000 | Admin SPA              |
| `web`                     | Nuxt 4 + Vue 3 + TypeScript 6    | 4000 | User-facing app        |
| `bff`                     | NestJS 12 + Express              | 5000 | HTTP BFF skeleton      |
| `@repo/typescript-config` | Shared tsconfig presets          | —    | `base`, `react-app`    |
| `@repo/vitest-config`     | Shared Vitest defaults           | —    | Test/coverage defaults |

The apps are currently minimal skeletons. There is no shared runtime or UI package, no authentication, no persistence, and the admin/web apps do not call the BFF yet. The BFF only exposes `GET /` and `GET /health`.

## Commands

Run all commands from the repository root. Root scripts delegate to `turbo`; the real build/lint/test commands live in each app's `package.json`.

```sh
pnpm install        # install workspace dependencies
pnpm dev            # start admin(3000), web(4000), and bff(5000) together
pnpm build          # build all apps
pnpm lint           # oxlint --deny-warnings in every package
pnpm lint:fix       # root oxlint --fix (not routed through Turbo)
pnpm format         # oxfmt in every package
pnpm format:check   # verify formatting
pnpm check-types    # type-check every package
pnpm test           # Vitest run in every app
pnpm test:coverage  # Vitest + V8 coverage in every app
```

Work on one app with a pnpm filter:

```sh
pnpm --filter admin dev
pnpm --filter web build
pnpm --filter bff check-types
pnpm --filter admin test:watch
```

Run a single test file or a single test by name:

```sh
pnpm --filter admin exec vitest run tests/unit/App.test.tsx
pnpm --filter admin exec vitest run tests/unit/App.test.tsx -t "renders the admin heading"
pnpm --filter web exec vitest run tests/nuxt/App.test.ts
pnpm --filter bff exec vitest run tests/e2e/app.e2e.test.ts
```

Build outputs are `apps/admin/dist`, `apps/web/.output`, and `apps/bff/dist`. Coverage reports are written to `apps/<app>/coverage/` and ignored by Git.

## How the workspace is wired

### Turborepo

`turbo.json` is the task graph:

- `build` depends on `^build` and caches `dist/**` and `.output/**`.
- `lint` and `check-types` run workspace dependencies first.
- `format` is uncached; `format:check` is cached.
- `test` includes `packages/vitest-config/**` as an input, so shared test config changes invalidate test caches.
- `test:coverage` also caches `coverage/**`.
- `dev` is persistent and uncached.

When a root-level config file affects a task, add it to that task's `inputs` (the existing lint/format/test tasks already reference the root Oxc, Oxfmt, and Vitest configs).

Only `admin`, `web`, `bff`, and the config packages participate. Package names, not folder paths, are used with `--filter` in the documented commands.

### `apps/admin`

React SPA with the entry point `src/main.tsx` rendering `src/App.tsx`. There is no router, state manager, or API layer yet.

`vite.config.ts` owns both Vite and Vitest configuration: React plugin, port 3000, jsdom environment, `tests/**/*.test.{ts,tsx}`, and `tests/setup.ts`. The setup file registers `@testing-library/jest-dom/vitest` and calls Testing Library `cleanup` after each test. The app tsconfig extends `@repo/typescript-config/react-app.json` and includes `tests` and `vite.config.ts`.

### `apps/web`

Nuxt 4 application. The root component is `app/app.vue`; `nuxt.config.ts` sets the compatibility date and port 4000.

`tsconfig.json` extends the generated `./.nuxt/tsconfig.json`. If types are stale after changing dependencies or app structure, run `pnpm --filter web exec nuxt prepare`. Nuxt's generated config includes `tests/nuxt/**/*`, which is why Nuxt tests live there.

`vitest.config.ts` uses `defineVitestConfig` from `@nuxt/test-utils/config`, the `nuxt` environment with jsdom, and `tests/nuxt/**/*.test.ts`. `apps/web/.nuxtrc` is generated by Nuxt/test-utils and should not be hand-edited.

### `apps/bff`

NestJS HTTP BFF. `src/main.ts` bootstraps `AppModule`; `AppModule` wires `AppController`, which serves `GET /` and `GET /health`. The port defaults to 5000 and can be overridden with `PORT`.

The runtime is CommonJS and uses Nest decorator metadata:

- `tsconfig.json` compiles `src` with `experimentalDecorators` and `emitDecoratorMetadata`.
- `tsconfig.build.json` excludes tests and the Vitest config from the Nest build.
- `tsconfig.test.json` includes `src`, `tests`, and `vitest.config.mts` with `rootDir: "."`; `check-types` uses this config.
- `vitest.config.mts` uses `unplugin-swc` because the default esbuild transform does not emit decorator metadata. Keep the `.mts` extension to avoid Vite's CJS/ESM loader warning.

Tests are split into `tests/unit` (direct controller construction) and `tests/e2e` (create a Nest application with `@nestjs/testing` and call it through Supertest). E2E tests do not require a separately running server.

### Shared config packages

- `@repo/typescript-config`: `base.json` is strict `NodeNext`/ES2022; `react-app.json` switches to bundler resolution, `react-jsx`, and `vite/client` types. The BFF and config packages extend `base.json`.
- `@repo/vitest-config`: exports `baseTestConfig` from `src/base.ts`. App configs spread it into their own `test` block and override `environment`, `include`, `setupFiles`, or `environmentOptions`. The shared coverage `include` currently covers `src`, `app`, and `shared`; update it if source moves.

These packages export source files directly; there is no build step for workspace config packages.

## Testing conventions

- All apps use Vitest 5 with the V8 coverage provider.
- `test` is the normal run; `test:coverage` enables coverage with `text`, `html`, and `lcov` reporters.
- Admin tests use jsdom + Testing Library. Web tests use the Nuxt runtime. BFF tests use Nest testing utilities and Supertest.
- Test files are type-checked as part of each app's normal type checking, except that the BFF uses the dedicated `tsconfig.test.json`.
- Keep test files in the app's configured `tests` directory; changing the directory requires updating both the Vitest `include` pattern and the relevant tsconfig/Nuxt setup.

## Toolchain and conventions

- Node.js version is pinned in `.nvmrc` (`26.12.1`); the root `engines` field requires `>=26.12.1`.
- pnpm 12.14.0. Most app/tool versions are exact pins; keep Vite, Vitest, and TypeScript versions aligned across apps when upgrading.
- pnpm 12 enforces a 24-hour `minimumReleaseAge`. A newly released pinned version must be added to `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. Native install scripts must be allowed under `allowBuilds` (currently `esbuild` and `@swc/core`).
- Oxc is the only lint/format toolchain; ESLint and Prettier are intentionally disabled. Root configs are `.oxlintrc.json` and `.oxfmtrc.json`; package scripts run `oxlint`/`oxfmt`.
- Formatting defaults: UTF-8, LF, 2 spaces, 80-column print width. Do not add conflicting formatter configs.
- OpenSpec is initialized for spec-driven changes; specs/changes live under `openspec/` and the workflow skills are under `.agents/skills/`.
