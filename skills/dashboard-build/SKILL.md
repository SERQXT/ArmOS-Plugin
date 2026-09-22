---
name: dashboard-build
tier: t1
bucket: dashboard-work
description: "Builds Domo dashboards and App Studio pages from a dataset — the entry point for any request that asks to create, build, redesign, or assemble a multi-card page (App Studio page, v2 card page, v1 card page, or rooster filter-list portal). Judges output type, dataset shape, audience tier (exec / ops / embed), and refresh cadence, then dispatches to the right deterministic sub-symphony (dashboard-v2-build, app-studio-page-build, or dashboard-redesign). Use this whenever a user says: build a dashboard, build an App Studio page, create cards on a page, ship a dashboard, redesign a page, assemble a portal."
status: draft
visibility: anyone
created_by: lane-L4
created_at: "2026-06-07T00:00:00Z"
supersedes: dashboard-builder
audience: [orchestration]
---

# dashboard-build

Entry-point judgment layer for all Domo dashboard work. Evaluates the four axes that determine which build path to take — output type, dataset shape, audience, and refresh cadence — and dispatches to one of the T2 sub-symphonies below.

## When to use

- "Build an App Studio page on dataset <guid>" / "Build an App Studio page from this data"
- "Build me a dashboard from this dataset" / "Make a dashboard for <topic>"
- "Add 3-4 fresh KPI cards to a page on dataset <guid>"
- "Create cards on dataset <guid> and put them on an App Studio page"
- "Ship a dashboard to the exec team showing <metrics>"
- "Make a v2 page for the ops team"
- "Assemble a portal page for the customer"
- "Quick dashboard from the orders table"
- "Redesign the fulfillment page — it is a mess"
- "The existing dashboard is a mess, fix it"
- "Clean up the ghost slots on the ops page"
- "Redesign the X page"
- "Dashboard end-to-end from scratch"

This skill is the **single front door** for whole-page work. Card-only work (one card at a time) goes directly to `card-kpi`. Layout-only work (rearranging an existing page) goes to `app-studio-layout-builder`. Anything that touches a multi-card page — App Studio or v2 — starts here.

## When NOT to use

If the output type is already decided and the build spec is fully approved, skip this skill and invoke `dashboard-v2-build` or `app-studio-page-build` directly — they are deterministic and do not require the judgment pass this skill provides.

If the request is purely a card-level operation (add one card, fix a beast mode, change a chart type), use the `card-build` or `card-beastmode` skills — this skill orchestrates whole-dashboard workflows only.

If the request is a scope estimate or LOE, use `loe-estimator` instead.

## Judgment axes

Evaluate all four axes before dispatching:

### Axis 1 — Output type

| Signal | Output type | Dispatch to |
|--------|-------------|-------------|
| "App Studio", "no-code page", "portal", rooster components, custom layout | App Studio | `app-studio-page-build` |
| "v2 page", "new page", "enhanced layout", executive polish, programmatic grid | v2 card page | `dashboard-v2-build` |
| "quick build", "throwaway prototype", "v1", user explicitly says v1 | v1 card page | `dashboard-v2-build` with v1 flag |
| **User names an existing page**, "redesign", "clean up", "ghost slots", "the existing dashboard is a mess", "fix the X page" | **Redesign existing page** | **`dashboard-redesign`** |
| Ambiguous | Default to v2 card page | `dashboard-v2-build` |

Default: v2 card page. v1 has no programmatic positioning API and leaves ghost slots on card deletion — only use when explicitly requested.

**Redesign detection:** If the user's intent references an existing named page or uses phrasing like "redesign", "clean up", "the X page is a mess", or "ghost slots", dispatch to `dashboard-redesign` rather than the new-build path. `dashboard-redesign` handles audit → cleanup plan → user confirmation → rebuild via the appropriate T2 sub-symphony.

### Axis 2 — Dataset shape

| Signal | Shape | Action |
|--------|-------|--------|
| Columns named avg_, rate_, pct_, ratio_, or description says "already aggregated" | Pre-aggregated | Warn downstream T2 — do not re-aggregate; use raw values or weighted beast modes |
| Pivot dimension (multiple rows per entity-date with repeated additive measures) | Pivoted | Warn downstream T2 — deduplication required before SUM |
| Row-level transactional data | Raw | Standard aggregation is safe |

### Axis 3 — Audience

| Audience | Design implication |
|----------|--------------------|
| Executive | Minimise cards (8 or fewer), KPI hero row mandatory, polish required — prefer App Studio |
| Ops / analyst | More cards acceptable (up to 20), filters and cross-filtering matter |
| Embedded (customer-facing) | App Studio always; branding, PDP filters, share permissions matter |

### Axis 4 — Refresh cadence

| Cadence | Implication |
|---------|-------------|
| Near-real-time (under 1 hr) | Confirm dataset refresh schedule before building KPI comparisons |
| Daily/weekly | Standard build — no constraints |
| Historical / static | Date filters may need adjustment if data does not include recent dates |

## Dispatch protocol

After evaluating the four axes:

1. Summarise the judgment to the user: output type, dataset shape, audience, cadence.
2. Ask for confirmation if output type was ambiguous.
3. Dispatch to `dashboard-redesign`, `dashboard-v2-build`, or `app-studio-page-build` with the resolved parameters as the input contract.

For simple cases (single dataset, 12 or fewer cards, user gave a clear build signal), collapse confirmation into one sentence and proceed immediately.

If dispatching to `dashboard-redesign`, pass: the resolved page identifier, the inferred output type (v1 vs v2 vs App Studio) if determinable, and the dataset shape assessment from Axis 2.

## Design principles

- **Output type is not depth — it is a different build path.** Dispatching to the wrong sub-symphony wastes every step that follows.
- **Dataset shape must be assessed before design, not during card creation.** A pre-aggregated average averaged again is silent wrong data.
- **Audience determines KPI density and polish bar.** An exec dashboard with 18 cards is a failed dashboard regardless of card quality.
- **v1 pages are a last resort.** Ghost slots and no positioning API are not edge cases — they happen on every redesign. Default to v2.
- **The T2 sub-symphonies are contracts.** Once dispatched, do not override their guardrails from this layer.
