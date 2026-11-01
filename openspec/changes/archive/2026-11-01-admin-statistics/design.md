# Design

## Context

See `proposal.md` for motivation. The relevant current state:

- `/statistics` still renders the generic placeholder; every other admin module is implemented.
- Spring already exposes `GET /api/v1/admin/statistics` with optional `from` and `to`, returning cards, ranking, and two daily trends. The workbench calls it without dates for its default 30-day view.
- The endpoint is implemented in `DashboardService` and reuses repositories from adoption, care, task, points, account, and plant modules.
- The backend was generated from a single high-level prompt, so the statistics implementation is treated as untrusted until checked against `docs/product/admin.md` section 11 and `docs/product/business-rules.md` section 9.
- Admin already has a lazy `EChart` wrapper with `LineChart` and `BarChart` registered, a shared `ChartTokens` shape, and dashboard chart builders in `pages/dashboard/charts.ts`.
- `apps/admin` has no direct `dayjs` dependency; antd already brings `dayjs@1.11.23` into the pnpm store.

The data flow for the new page is:

```text
[admin /statistics]
   |  optional from/to
   v
[api/statistics.ts]
   |  GET /api/v1/admin/statistics
   v
[Spring AdminDashboardController]
   |
   v
[DashboardService] --> adoption_events / care_submissions / task_submissions
                   --> task_participations / point_ledger / accounts / plant_individuals
   |
   v
[StatisticsView] --> metric cards + four chart options
```

The Nuxt `web` app is not involved in this change.

## Goals / Non-Goals

**Goals:**

- Replace the statistics placeholder with a real page that matches the product's date range, metric, chart, empty, failure, responsive, and theme requirements.
- Keep the existing statistics response field names stable while correcting the calculations behind them.
- Make the statistics endpoint's optional-date behavior predictable and testable.
- Reuse the existing ECharts infrastructure and antd design tokens instead of adding a second charting layer.
- Keep the workbench behavior unchanged; its no-date statistics request must continue to mean the last 30 days.

**Non-Goals:**

- No new statistics endpoint, database table, migration, or authentication change.
- No CSV/Excel export, custom report builder, or saved views.
- No per-day task completion trend; the completion chart is a composition of the selected range.
- No URL query-string persistence for the selected range.
- No student-facing statistics page.
- No change to `@repo/http-client`, `@repo/env`, or other workspace packages.

## Decisions

### 1. Keep the endpoint and split the client module

`GET /api/v1/admin/statistics` remains the single source. `apps/admin/src/api/statistics.ts` will own `StatisticsRange`, `DailyValue`, `RankItem`, `StatisticsView`, and `getStatistics(range?)`; `api/dashboard.ts` keeps only the workbench endpoint and its types.

`getStatistics` passes `searchParams` only when both dates are present. The workbench continues to call it with no range, so the existing default-30-day behavior is preserved.

Alternative considered: keep statistics types in `api/dashboard.ts`. Rejected because the statistics page is a separate module and the dashboard file would keep growing with unrelated types.

### 2. Normalize optional dates on the server

`DashboardService.statistics` will resolve dates in this order:

| Input              | Resolved range                    |
| ------------------ | --------------------------------- |
| no `from`, no `to` | `today - 29 days` through `today` |
| `from` only        | `from` through `today`            |
| `to` only          | `to - 29 days` through `to`       |
| both               | use both                          |

Then it validates `from <= to` (`DATE_RANGE_INVALID`) and a maximum span of 367 days inclusive (`DATE_RANGE_TOO_LARGE`). Malformed dates continue to be rejected by Spring's type conversion as `INVALID_REQUEST`.

The server uses the existing `Asia/Shanghai` business clock. The page's first request sends no dates and adopts the returned `from`/`to`, so a browser in another timezone cannot make the initial range disagree with the server.

Alternative considered: require both dates. Rejected because the workbench and direct API callers already rely on the no-date default, and the single-date behavior is a small, intuitive extension.

### 3. Count adoption starts from the handover transition

`adoptionsStarted` and `adoptionTrend` will query adoption events with `from_status = WAITING_PICKUP` and `to_status = ACTIVE`, instead of every event whose `to_status` is `ACTIVE`.

This excludes the `RETURN_REVIEW -> ACTIVE` event created when an admin rejects a return request, so one adoption relationship is counted once. The event log remains the source for the daily trend.

Alternative considered: count `adoption_applications.handed_over_at` in the range. That is also correct, but would add a second application query and separate the count from the event timeline. The filtered event query keeps one source of truth.

### 4. Rank students with a dedicated query

The ranking query will use one SQL statement in the account mapper:

- include student accounts regardless of `status`, matching the confirmed product assumption;
- order by `points_balance DESC`;
- then by the latest positive `point_ledger.created_at` descending;
- then by account ID ascending for deterministic output;
- limit 10.

The existing `(account_id, created_at)` index on `point_ledger` supports the subquery. The adapter keeps a repository method whose name describes the ordering, and `DashboardService` maps the returned accounts to `RankItem`.

Alternative considered: load all students and sort in Java. Rejected because it transfers balances that the page never uses and makes the result depend on application memory. Alternative considered: order only by balance and ID. Rejected because it does not meet the product's tie-break rule.

### 5. Treat task completion as participation-record completion

`completedTaskParticipants` and `endedTaskParticipants` stay as participation-record counts:

- denominator: all participation records of tasks whose `ends_at` falls in the selected range;
- numerator: those records whose status is `APPROVED`;
- rate: numerator / denominator, or `null` when the denominator is zero;
- the same student joining two ended tasks contributes two records, and the UI note says so.

The page displays the rate with one decimal place and renders a two-part bar: “已通过” and “未完成/未通过”. When the denominator is zero, the rate is “—” and the chart is replaced by an empty state.

Alternative considered: count distinct students in the numerator and denominator. Rejected because it changes the meaning of the existing fields and makes a student who passes one of two tasks count as fully successful.

### 6. Extract chart builders into a shared admin module

The pure chart option builders and `ChartTokens` move from `pages/dashboard/charts.ts` to `src/lib/charts.ts`. The shared module will contain:

- `ChartTokens`
- `isTrendEmpty`
- `buildAdoptionTrendOption`
- `buildPointGrantTrendOption`
- `buildTaskCompletionOption`
- `buildPointRankingOption`
- the metric-note constants

`DashboardPage` and the new statistics page import from this module. `EChart` already registers `LineChart` and `BarChart`, so no chart type is added; the ranking is a horizontal bar built with the existing `BarChart`.

`ChartTokens` gains `colorWarning` for the “未完成/未通过” segment. All colors still come from `theme.useToken()` at the page level.

Alternative considered: duplicate the builders in `pages/statistics/charts.ts`. Rejected because the adoption and point-grant charts would drift from the workbench versions.

### 7. Page data flow and states

`StatisticsPage` will:

1. On mount, call `getStatistics()` with no range.
2. On success, store `data`, convert `data.from` and `data.to` to dayjs values for the range picker, and render cards and charts.
3. On “查询”, validate the selected range (not in the future, at most 367 days), call `getStatistics({from, to})`, and replace the data.
4. On “重置”, clear the picker and call `getStatistics()` again.
5. On refresh, repeat the last applied request; a ref guard prevents duplicate requests.
6. On failure, keep the filter area visible and show a single `LoadFailure` with a retry action; retry repeats the last applied request. 401 is left to the existing auth flow.
7. Render the page skeleton on first load and during a query; empty arrays and all-zero trends use section-level empty states.

The page uses `ModulePage`, `Row`/`Col`, `Card`, `Statistic`, `Empty`, `Skeleton`, `LoadFailure`, and the lazy `EChart` wrapper. The filter uses antd `DatePicker.RangePicker` with presets for 7/30/90 days and `maxDate`/`disabledDate` to block future dates.

### 8. Add dayjs as a direct admin dependency

`apps/admin/package.json` will add `dayjs@1.11.23`, matching the version already resolved in the pnpm store. It is used only for range picker values and presets. No shared package reads environment variables or gains dayjs.

### 9. Remove the placeholder page and update the route spec

`router/index.tsx` will render `StatisticsPage` at `/statistics`, and `pages/placeholder/PlaceholderPage.tsx` plus its test will be deleted because no route uses it. `admin-shell` replaces the old “模块路由与占位页” requirement with “模块路由”; the delta records the old requirement as removed and the new one as added.

### 10. Test and configuration impact

- Backend: add service tests for date normalization, adoption filtering, ranking ordering, and zero-denominator completion; add controller contract tests for the statistics endpoint and error responses; update repository adapter tests.
- Admin: add `api/statistics` tests, page tests for initial load, query, reset, failure/retry, empty and responsive behavior, chart-option tests, and router test updates. Existing dashboard tests move their statistics mock to the new API module.
- No `tsconfig`, Vitest include, coverage include, or Turbo input changes are needed: new files are under `src/**` and `tests/**`, which the existing configuration already covers.
- Oxc remains the only lint/format toolchain. No ESLint, Prettier, or new test runner is introduced.

## Risks / Trade-offs

- **Ranking SQL scans point_ledger for the latest positive grant.** → The existing `(account_id, created_at)` index and campus-scale data keep this acceptable; if volume grows, a materialized “last grant” column can replace the subquery without changing the API.
- **Task completion counts participation records, not unique students.** → The page note explicitly says “同一学生参加多个任务会分别计入”; this avoids presenting the number as a unique-person count.
- **The ranking includes disabled students.** → This follows the confirmed assumption and product text, which does not define an exclusion. If the product later excludes disabled accounts, only the query predicate changes.
- **Date range selection depends on the browser clock for future-date blocking.** → The server still validates `from <= to` and the 367-day limit; the initial range comes from the server, so the displayed default is authoritative.
- **Adding dayjs changes the lockfile.** → Pin the version already in the store and verify `pnpm install --frozen-lockfile` plus the admin test suite.
- **Removing `PlaceholderPage` can break stale imports.** → Search for all references, update the router test, and run `pnpm --filter admin check-types` and `pnpm --filter admin test`.
- **The backend currently loads range rows into memory for trends.** → This change corrects semantics, not the aggregation architecture; the current campus-scale volume is acceptable, and moving to SQL aggregates would be a separate performance change.

## Migration Plan

1. Deploy the Spring change first or together with admin. The response fields are unchanged; the only API behavior refinements are optional-date semantics and corrected counts.
2. Add `dayjs` to admin and update the lockfile.
3. Switch `/statistics` to the real page and remove the placeholder component.
4. No database migration is required. Rollback is a code revert; the statistics endpoint remains compatible with the workbench because its no-date behavior is unchanged.
