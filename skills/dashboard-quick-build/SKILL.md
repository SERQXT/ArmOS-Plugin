---
name: dashboard-quick-build
tier: 2
description: "Streamlined single-skill dashboard build for simple cases: 1 dataset, up to 12 cards. Collapses the full 10-step orchestration into 3 phases: discover, build, verify. Use when the user wants a quick dashboard without the full design review ceremony. Trigger with 'quick dashboard from [dataset]', 'just build me a dashboard', 'simple dashboard for [topic]'."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-build (T1) — the fast-path judgment for simple single-dataset builds is now inline in dashboard-build's dispatch protocol."
audience: [orchestration]
---

# Dashboard Quick Build — Streamlined 3-Phase Build

For simple dashboards (1 dataset, <= 12 cards), this skill collapses the full 10-step dashboard-builder orchestration into 3 fast phases. No design review ceremony — just discover, build, verify.

## When to Use

- Single source dataset
- User wants speed over polish ("just build it", "quick dashboard")
- Straightforward reporting (not executive-grade design)
- <= 12 cards needed

**If the build is complex** (2+ datasets, 12+ cards, executive audience needing design review), use the full `dashboard-builder` skill instead.

## Triggers

- "quick dashboard from [dataset]"
- "just build me a dashboard"
- "simple dashboard for [topic]"
- "throw together a dashboard for this data"

---

## Phase 1: Discover + Design (5 min)

**Tools:** `dataset_schema`, `dataset_profile`, `dataset_query`

1. **Profile the dataset** — run all 5 mandatory discovery queries (sample rows, distinct values, date ranges, null checks, row count)
2. **Auto-design:** Based on the data profile, automatically design:
   - **KPI hero row:** 3-5 summary number cards for the most important measures
   - **Primary charts:** 2-3 charts showing the main dimensions (bar, trend, breakdown)
   - **Supporting detail:** 1-2 tables or supplementary views
3. **Brief summary to user:** "Building [N] cards on a v2 page: [1-line description]. Proceeding now."
4. **Default to v2 page** — no need to ask for output type on quick builds

---

## Phase 2: Build (10 min)

**Tools:** `beast_mode_create`, `page_create`, `card_preview`, `card_create_full`, `card_size_set`, `layout_convert`, `layout_set`

1. Create beast modes for any calculated fields
2. Create a v2 page
3. Preview each card, then create (in visual order as fallback)
4. Set card sizes
5. Apply v2 layout with `layout_convert` + `layout_set` using 60-unit grid

---

## Phase 3: Verify (2 min)

**Tools:** `card_render_check`, `card_delete`, `card_create_full`

1. Render-check every card
2. Fix any failures (delete, fix spec, recreate — max 2 retries)
3. Report results with card reference table

---

## Output

```
## Quick Dashboard Complete

**Page:** [Name] (ID: [page_id])
**Dataset:** [Dataset Name]
**Cards:** [N] created, [N] verified

| # | Card Title | Card ID | Chart Type | Status |
|---|-----------|---------|------------|--------|
| 1 | [Title] | [ID] | [Type] | Verified |
...

**Next steps (manual):**
- Add page filters: [suggested filters based on dimensions]
- Configure cross-filtering: [suggested source → target pairs]
```

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: page name, page ID, dataset used, cards auto-generated, quick build parameters chosen.

## MCP Servers Required

- **domo-pages** — card creation, sizing, layout, render checks
- **domo-datasets** — discovery, schema, queries
