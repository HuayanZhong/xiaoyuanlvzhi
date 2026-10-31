# Design

## Context

See `proposal.md` for motivation. The current state that shapes the approach:

- `/dashboard` still renders `PlaceholderPage`; `GET /api/v1/admin/dashboard` already returns counts and recent items, and `GET /api/v1/admin/statistics` already returns daily adoption and point-grant trends.
- `DashboardService.dashboard()` loads full pending lists and filters in memory before limiting to 30 per type; `statistics()` queries the point ledger twice.
- `apps/admin` has no chart dependency. The existing theme is driven by antd `theme.useToken()` and the `ThemeTokenBridge` CSS variables.
- `/points/orders` and `/plants/instances` do not read a status query parameter; `/adoptions` supports a single status query parameter but has no combined “change review” value.
- `apps/web` has no workbench or statistics integration and is not affected by this change.

Data flow after the change:

```text
apps/admin /dashboard
  |
  +-- api/dashboard.ts
  |     +-- GET /api/v1/admin/dashboard  -> counts + recent items
  |     +-- GET /api/v1/admin/statistics -> adoptionTrend + pointGrantTrend
  |
  +-- DashboardPage
        +-- count cards  --navigate--> existing filtered list pages
        +-- recent table --navigate--> existing filtered list pages
        +-- EChart wrapper -> echarts/core -> canvas

Spring: AdminDashboardController -> DashboardService -> repository ports -> MySQL
apps/web: unchanged; no runtime imports from apps/admin
```

## Goals / Non-Goals

**Goals:**

- Render a real workbench from the two existing admin APIs, with independent loading/failure states.
- Reuse one chart foundation for the two trend charts and later statistics work.
- Make every count card and recent item land on the correct filtered list.
- Keep backend query cost bounded by Top N and avoid duplicate statistics queries.
- Preserve existing API paths, request parameters, response fields, and authentication behavior.

**Non-Goals:**

- Implementing `/students`, `/articles`, or `/statistics` pages.
- Adding a dedicated trends endpoint or changing response DTOs.
- Server-side filtering or pagination for workbench recent items.
- Polling, websocket updates, exports, or scheduled refresh.
- Building a shared chart package or changing `apps/web`.

## Decisions

### 1. Reuse `/admin/dashboard` and `/admin/statistics`

The dashboard endpoint supplies counts and the recent queue; the statistics endpoint already supplies both daily series with the correct metric definitions. Reusing them avoids duplicating metric logic and keeps one source of truth for the later statistics page.

Alternative considered: add `GET /admin/dashboard/trends` or extend `DashboardView` with trends. Rejected for this change because it adds a second definition of the same metrics. If workbench latency becomes a problem, a dedicated lightweight trends endpoint can be added later without changing the page contract.

### 2. Use ECharts directly, not `echarts-for-react`

Use `echarts/core` with only `LineChart`, `BarChart`, `GridComponent`, `TooltipComponent`, `LegendComponent`, and `CanvasRenderer`. The wrapper owns `init`, `setOption`, `ResizeObserver`, and `dispose`.

Alternatives considered: `echarts-for-react` adds a peer wrapper but little value for two charts; full `echarts` import would pull unused chart types into the bundle.

### 3. Keep the chart wrapper inside `apps/admin`

Only admin uses charts in this change. Cross-application imports are prohibited, and creating a workspace package for one consumer would add package-boundary and build overhead. If `apps/web` later needs charts, extract the wrapper to a dedicated workspace package then.

### 4. Pure option builders, token-driven colors

Put `buildAdoptionTrendOption` and `buildPointGrantTrendOption` in `pages/dashboard/charts.ts`. Each accepts typed trend data and an explicit token subset derived from antd `theme.useToken()`. This keeps canvas lifecycle out of the option logic and lets tests verify labels, values, and metric notes without jsdom canvas.

Colors come from antd tokens; no second chart palette is introduced. Theme changes rebuild options, so light/dark switching does not require a page reload.

### 5. Bound backend work with Top N repository methods

Add recent-query methods to the existing ports/adapters instead of loading full tables and filtering in memory:

```text
AdoptionApplicationRepository  -> top 10 pending, top 10 change statuses (updatedAt/id)
CareCheckinRepository          -> top 10 pending (createdAt/id)
TaskSubmissionRepository       -> top 10 pending (submittedAt/id)
RedemptionOrderRepository      -> top 10 waiting (createdAt/id)
FeedbackRepository             -> top 10 pending (createdAt/id)
```

`DashboardService.dashboard()` fetches counts and Top N lists, maps them to `PendingItem`, merges, sorts by `submittedAt` descending with a stable `businessId` tie-breaker, and keeps the first 10. The existing `submittedAt` field is kept; for adoption change records it represents the latest update time.

Alternative considered: keep in-memory filtering. Rejected because history grows without bound and the workbench is the default landing page.

### 6. Optimize statistics without changing its contract

- Fetch the point ledger once and compute both `pointsGranted` and `pointGrantTrend` from that list.
- Inject `Clock` so the default “last 30 days” range is testable.
- Replace `participationRepository.findAll()` with a bounded query for participations whose task ended inside the requested range.

The endpoint path, query parameters, response fields, and error semantics stay unchanged.

### 7. Deep links are initial filters, not new backend queries

The target pages already fetch complete result sets and filter in the client. Add query-parameter parsing and synchronization only:

- `/adoptions`: `status=CHANGES` is a client-side pseudo-status matching `CANCEL_REVIEW` and `RETURN_REVIEW`; existing individual statuses and invalid-value fallback remain.
- `/points/orders`: parse `status` against known order statuses; apply as initial filter and sync on query/reset.
- `/plants/instances`: parse `status` against known individual statuses; preserve `speciesId` when syncing.

Alternative considered: auto-open a specific record from the recent queue. Existing list APIs do not expose a uniform record-locating query parameter, and the product requirement only asks for “去处理”; the filtered list is sufficient and avoids invasive page changes.

### 8. Error isolation

`DashboardPage` issues both requests in parallel:

- Dashboard request failure: full-page `LoadFailure` with retry; do not render zero-value cards.
- Statistics request failure: keep cards and recent records, show an inline chart-area error with “重试趋势”.
- Refresh re-fetches both, with a duplicate-submit guard.

### 9. Layout and responsive behavior

Use antd `Row`/`Col` and existing `ModulePage`/`LoadFailure`/`AdminTable` patterns. Cards use a 4-column grid on wide screens, 2 columns at medium widths, and 1 column at 320px. Recent records and charts use a two-column layout at desktop widths and stack below 992px; the recent table scrolls horizontally inside its container at 320px.

## Risks / Trade-offs

- **ECharts bundle growth** → Tree-shaken imports; run `pnpm --filter admin build` and inspect output. If the chunk warning becomes material, lazy-load the chart section without changing page behavior.
- **Canvas unavailable in jsdom** → Test option builders directly and mock the `EChart` component in page tests; do not assert canvas pixels.
- **Statistics endpoint computes metrics workbench does not use** → Reuse first, measure; a dedicated trends endpoint remains a future option and does not affect this change's page contract.
- **Top N SQL portability** → The project targets MySQL and MyBatis-Plus; use ordered wrappers plus a constant `LIMIT 10`, with adapter tests. Do not interpolate user input.
- **`CHANGES` is not a real backend status** → Keep it as a UI-only filter value; never send it to Spring.
- **Timestamp semantics differ by business type** → Document that `submittedAt` is the record's submission time, or latest change time for adoption changes; keep ordering stable with `businessId`.
- **Existing placeholder tests** → Update router and admin-login tests that currently assert the dashboard placeholder.

## Migration Plan

1. Add backend Top N methods and statistics optimization; deploy is backward compatible because API paths and payloads are unchanged.
2. Add `echarts` and the admin workbench/chart code; replace the dashboard placeholder.
3. Add deep-link parsing to the three list pages.
4. Update README and product docs.
5. Verify with backend tests, admin tests, root `pnpm verify`, and browser checks at 1440px and 320px.

No database migration, environment-variable change, or shared-package release is required. Rollback is a revert of the admin page/dependency and backend query changes; existing data is untouched.

## Toolchain and Test Configuration

- Add `echarts` to `apps/admin/package.json` only; no shared package or `apps/web` dependency.
- No `tsconfig`, Vitest, coverage-include, or Turbo input changes are expected. New tests live under `apps/admin/tests/unit` and are discovered by the existing configuration.
- Oxc remains the only lint/format toolchain; run `pnpm --filter admin lint`, `check-types`, and `test`, plus root `pnpm verify` before completion.
