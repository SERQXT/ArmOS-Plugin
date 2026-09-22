---
name: card-table-build
description: "Build a Domo table card showing rows of data — either raw rows from the dataset or aggregated rows grouped by selected dimensions, calling the create-card-full substrate operation."
version: 1.0.0
tags: ["atom", "card-work", "table", "domo"]
---

---
version: 1
status: draft
visibility: anyone
name: card-table-build
kind: atom
bucket: card-work
intent: >-
  Build a Domo table card showing rows of data — either raw rows from the
  dataset or aggregated rows grouped by selected dimensions, calling the
  create-card-full substrate operation.
operations:
  - create-card-full
see-also:
  - card-build
  - dataset-profile
  - card-bar-build
  - card-line-build
  - card-pie-build
  - card-combo-build
  - card-single-value-build
description: >-
  Build a Domo table card showing rows of data — either raw rows from the
  dataset or aggregated rows grouped by selected dimensions, calling the
  create-card-full substrate operation.
---

# card-table-build

Build a Domo table card showing rows of data — raw rows or aggregated rows grouped by selected dimensions. Use this when the user wants to inspect the actual values, not a chart. For aggregated visual comparisons, use `card-bar-build`, `card-line-build`, or `card-pie-build` instead.

## When to use this skill

Use this atom when the deliverable is a tabular display of rows rather than a chart. The user wants to see values directly — either raw rows as they exist in the dataset, or aggregated rows grouped by one or more dimensions and presented as a summary table. The atom handles both modes; the orchestrator (or the user) signals which one.

Common user phrasings that should route here:

- "Show me the top N rows / records / items..."
- "List..."
- "Table of..."
- "...rows where..."
- "Pull every..."
- "Give me a list of all..."
- "Summary table of..." or "...broken out by..."
- "Show me the data" / "What's in this dataset"
- Explicit "table" requests

Example prompts:

- (Invoked by `card-build` when the chosen shape is table.)
- "Show the top 50 deals by ARR from dataset abc-123."
- "List all customers with HG grade red from dataset def-456."
- "Table of opportunities closing this quarter."
- "Show all rows where status = at-risk."
- "Give me a summary table of revenue and deal count by region."

## When NOT to use this skill

Don't use this atom when the deliverable is a chart that compares magnitudes across categories — use `card-bar-build`. A bar chart of "revenue by region" is bar, not table; a table of "revenue by region" loses the comparison signal.

Don't use this atom when the deliverable is a time series trend — use `card-line-build`. A line chart shows change over time better than a table can.

Don't use this atom when the deliverable shows parts of a whole — use `card-pie-build`. Tables can list percentages, but pies communicate the part-whole relationship visually.

Don't use this atom when the deliverable is a single aggregated value (current ARR, deals this quarter, NPS score) — use `card-single-value-build`. A table of one row, one column is a KPI card with extra steps.

Don't use this atom when the card needs to mix table data with chart data in one view — use `card-combo-build` (chart with overlay) or compose two cards on a dashboard.

Don't use this atom directly from a user prompt asking for "a chart from this dataset" — that prompt should route to `card-build`, which decides which category atom to call after profiling.

Don't use this atom when the dataset has not yet been profiled. This atom assumes `dataset-profile` has run upstream and that the orchestrator has supplied the column list and group_by / aggregation choices. Do not profile from inside this atom.

Don't use this atom for datasets that are far too wide to render usefully (hundreds of columns) without an explicit column list. If the caller asks for "all columns" on such a dataset, return a structured error rather than silently truncating.

## What this skill does

This atom assembles a complete table card payload and submits it via the `create-card-full` substrate operation. The chart type is fixed as a table variant (`table` for raw mode, `tableSummary` for summary mode, `tablestacked` for pivoted summary) by the time this atom runs. The configuration decisions below are about how to render the committed shape cleanly.

Configuration decisions the atom owns:

- **Table mode** — raw or summary. Raw mode displays rows as they appear in the dataset (after optional filtering). Summary mode applies a `group_by` on one or more dimension columns and aggregates the remaining numeric measures. The atom infers mode from inputs: if `group_by` is supplied with at least one aggregation, summary mode; otherwise raw mode. The user can override via `table_mode`.
- **Column selection** — when the caller passes `columns`, use exactly those columns in that order. When the caller passes `"*"` or omits `columns`, default to displaying all columns from the dataset up to a `max_columns` cap (default 12). Wider datasets emit a `configuration_warning` and surface the truncation. The orchestrator can request specific columns to override.
- **Column ordering** — when `columns` is supplied, the atom preserves the caller's order exactly. When defaulting, group_by dimensions go first (left), then numeric measures, then everything else, alphabetically within each group.
- **Sort** — default sort by the first numeric measure descending in summary mode; default sort by the dataset's natural order in raw mode. Allow override via `sort` (column name + direction).
- **Row cap** — default 100 rows. Lift to 500 only when the caller asks via `row_cap`. Never render more than 1000 rows — beyond that the card becomes unreadable; emit a `configuration_warning` and cap.
- **Aggregation defaults (summary mode)** — when `aggregations` is omitted in summary mode, infer per numeric column from name: SUM for totals (revenue, count, amount), AVG for rates (percentage, ratio, score), MAX for high-water-marks. Allow per-column override via `aggregations` map.
- **Filters** — passed through to `create-card-full` verbatim before aggregation. The atom does not invent filters; the caller supplies them or omits.
- **Column formatting** — numeric columns auto-formatted (thousands separators, two decimal places for floats, integer with separator for ints). Date columns formatted as `YYYY-MM-DD`. Percentage-named columns formatted with `%` suffix. Caller can override per column via `formats` map.

What the atom does NOT do:

- It does not profile the dataset (that's `dataset-profile`).
- It does not decide whether table is the right shape (that's `card-build`).
- It does not run QA or screenshot the card.
- It does not place the card on a page.
- It does not transform data; it displays it. For "show me revenue net of refunds" the caller must compute the column upstream (in the dataset or via a calculated field) — this atom won't add arithmetic.

## Operation reference

This atom invokes one substrate operation: **create-card-full**. Resolved at session boot to the active substrate (currently the `domo-pages` MCP `card_create_full` tool). The resolver decides the tool name at runtime; this atom does not reference the tool directly.

Operations used:

- `create-card-full` — Create a full Domo card with chart type, axes, columns, filters, groupBy, and orderBy. This atom always sets `chart_type` to a table variant (`table`, `tableSummary`, or `tablestacked`) and supplies the column list, optional groupBy, optional per-column aggregations, sort, filters, and row cap.

## Inputs

- `dataset_id` (required, string) — ID of the dataset backing the card. Must be the same dataset that was profiled upstream.
- `columns` (optional, array of strings | `"*"`, default `"*"`) — column list to display, in order. `"*"` means all columns up to `max_columns`.
- `table_mode` (optional, string, default inferred) — `raw` or `summary`. Inferred from presence of `group_by`.
- `group_by` (optional, array of strings) — dimension columns to group by in summary mode. Required when `table_mode: summary` is explicitly set.
- `aggregations` (optional, object) — map of measure column name → aggregation function (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`). Required for measures in summary mode; can be inferred per column-name heuristic.
- `sort` (optional, object `{ column, direction }`) — sort column and `asc` or `desc`. Default measure-desc in summary mode, natural order in raw mode.
- `row_cap` (optional, integer, default 100, max 1000) — row count cap.
- `max_columns` (optional, integer, default 12) — cap on columns when defaulting to `"*"`.
- `filters` (optional, array) — dataset-level filters applied before aggregation.
- `formats` (optional, object) — map of column name → display format override (`number`, `percent`, `currency`, `date`, `raw`).
- `title` (optional, string) — card title. When omitted, derived as "`group_by` summary" or "`columns[0]` and related fields" with sensible capitalization.

## Outputs

- `card_id` (string) — the new card's stable identifier in Domo.
- `card_url` (string) — direct link to the card for human review.
- `chart_type` (string) — the resolved table variant (`table`, `tableSummary`, `tablestacked`).
- `applied_config` (object) — final configuration values (table_mode, columns displayed, group_by, aggregations applied, sort, row_cap, max_columns truncation). Lets the orchestrator verify against intent.
- `configuration_warnings` (array of strings) — non-fatal flags such as "truncated to 12 of 38 columns," "row cap of 100 reached — dataset has more rows," "inferred SUM aggregation on `revenue` from column name."

## Failure modes and recovery

- **Column not found in dataset** — `columns`, `group_by`, or `aggregations` references a column that does not exist in the dataset's actual schema. Recovery: return a structured error naming each missing column. The orchestrator should re-run `dataset-profile` or pick different columns. Do not silently drop unknown columns.

- **Summary mode without measures** — caller set `table_mode: summary` and `group_by` but supplied no `aggregations` and the dataset has no numeric columns to infer measures from. Recovery: return a structured error noting that summary mode needs at least one numeric measure to aggregate, with the column list shown for context.

- **Aggregation on non-numeric column** — caller's `aggregations` map asks for SUM on a string or boolean column. Recovery: return a structured error naming the column, its actual shape, and the unsupported aggregation. Exception: COUNT works on any column type and should be allowed.

- **Row cap exceeded** — query returned more rows than `row_cap`. Recovery: truncate to `row_cap`, emit a `configuration_warning` naming how many rows were truncated and the cap. The orchestrator may re-run with a higher cap if needed.

- **Hard row ceiling reached** — caller requested `row_cap > 1000`. Recovery: cap at 1000, emit a `configuration_warning`. Larger results should be exported to a dataset, not displayed in a card.

- **Wide dataset with no column list** — dataset has more than `max_columns` columns and the caller did not specify `columns`. Recovery: pick the first `max_columns` (group_by first, then measures, then others alphabetically), emit a `configuration_warning` naming how many columns were skipped and suggesting `columns` be supplied.

- **All rows filtered out** — filters reduced the result set to zero rows. Recovery: build the card anyway (so the empty state is visible) with a `configuration_warning` naming the filter set that produced zero rows. Do not fabricate rows.

- **`create-card-full` payload rejected** — Domo card API returned a 400-class error. Recovery: surface the substrate error verbatim, include the submitted payload in debug output, do not retry blindly.

- **Domo API timeout or 5xx** — substrate call did not return or returned a 5xx. Recovery: retry up to 2 times with exponential backoff. After 3 attempts, surface the failure.

- **Dataset access denied** — caller's session lacks read permission on `dataset_id`. Recovery: surface the permission error verbatim. Hard failure; escalate to the user.

- **Calculated column requested** — caller's `columns` includes a column name that looks like an expression (`revenue - refunds`, `count(*)`, `100 * margin / revenue`). Recovery: refuse to evaluate, return a structured error directing the orchestrator to either pre-compute the column in the dataset (via `data-transformation`) or use a calculated field upstream.