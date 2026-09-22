---
name: dashboard-v2-build
tier: t2
bucket: dashboard-work
input_contract: "Requires: dataset ID(s), audience tier (exec/ops/analyst), card count estimate. Refuses when dataset schema cannot be retrieved, when the card count exceeds 20 without explicit override, or when the caller requests App Studio output (use app-studio-page-build instead)."
description: "Deterministic build path for v2 card-based Domo dashboards. KPI strip + 2-3 primary charts + filters on a v2 programmatic-layout page. Dispatched from dashboard-build (T1) with resolved output type."
status: draft
visibility: anyone
created_by: lane-L4
created_at: "2026-06-07T00:00:00Z"
---

# dashboard-v2-build

Deterministic build symphony for v2 card-based dashboards. Executes a fixed pipeline: discover data schema, design the card set (KPI strip + primary charts + supporting detail), create the cards via the Domo Go CLI, apply the 60-unit grid layout, and render-check every card.

Dispatched from `dashboard-build` (T1). Do not invoke directly unless the output type and input contract are already resolved.

## Steps

1. **Data discovery.** Run all five mandatory discovery queries against each source dataset using `domo dataset query`: sample rows (LIMIT 5), distinct values for every string/categorical column, date range (MIN/MAX), null check on key columns, row count. Record the exact column names, dimension values, and date boundaries — these are the only values that may appear in card specs.

2. **Card-set design.** Based on discovery output and the audience tier from the input contract, produce a card manifest:
   - Row 1 (KPI strip): 3–5 `badge_singlevalue` cards covering the primary measures. Each KPI must have a current value and a comparison context (vs prior year, vs target, or vs benchmark).
   - Row 2 (primary analysis): 1–2 charts showing the main trend or breakdown. Default chart types: `badge_vert_bar_grouped` for categorical breakdowns, `badge_line` for time-series trends.
   - Row 3 (supporting): up to 3 supporting breakdowns or drill-downs.
   - Row 4 (detail): 0–1 full-width table card.
   - Total card count must not exceed 20 without an explicit override in the input contract.

3. **Blueprint checkpoint.** Present the card manifest to the user before creating any cards. Wait for explicit approval ("yes", "build it", "go ahead"). Do not auto-proceed. Record any changes before proceeding.

4. **Page creation.** Use `domo page create` to create a fresh v2 page. Never reuse an existing page for a new build — existing pages may have `virtualAppendix: true` which blocks layout writes.

5. **Beast mode creation.** For any calculated field (YoY comparison, weighted average, deduplication), create the beast mode first using `domo beastmode create`. Beast modes must exist before any card that references them is created.

6. **Card creation.** For each card in the approved manifest: call `domo card preview` with the exact spec; only call `domo card create` after a successful preview. Create cards in visual order (KPI strip first, then primary, then supporting, then detail). After each card is created, run `domo card render-check`; if it fails, delete the card, fix the spec, re-preview, and retry (max 2 retries per card).

7. **Layout.** Call `domo page layout convert` to enable the 60-unit positioning grid, then `domo page layout set` with the full position payload for all cards at once. Use the single-payload approach — do not use incremental layout operations. Verify with `domo page layout get`: every card must have width > 0 and height > 0; full-width cards must use w=60.

8. **Render verification.** Call `domo card render-check` on every card on the page. For each failure: diagnose root cause (double aggregation, wrong column name, invalid filter value, out-of-range date), fix the spec, delete the broken card, re-create, and re-check. Document results in the handoff report.

## Call budget and multi-turn splits

This skill is a **heavy workflow** (~50 MCP/CLI call budget per turn). Call-count math:

- Each `domo card create` = 1 call; each `domo page layout set` slot = 1 call; total per dashboard ≈ 2 × card_count (plus beast mode creates and render-checks).
- A 10-card dashboard ≈ 35 calls. A 15-card dashboard ≈ 30 card + layout calls plus audit overhead — budget tight. A 20-card dashboard ≈ 50 calls (at budget limit).

**Split rule:** Dashboards with 15 or more cards **must** split into two turns:

- **Turn 1:** Create all cards. End with a progress checkpoint (see below).
- **Turn 2:** Read the card IDs from the Turn 1 result, then call `domo page layout set` to position them.

Confirm with the user before proceeding to Turn 2.

**Progress checkpoint — emit after all cards are created but before layout:**

```
## Progress Checkpoint
✅ Created [N] cards: [card_id_1, card_id_2, ...]
⏳ Next: Layout positioning (Turn 2)

If this message appears and the agent stops, a continuation agent can resume from the card IDs above.
```

**Budget overflow recovery:** If the agent hits the ~50-call budget mid-build, it must emit the partial card ID list and stop. Do NOT continue silently — dropping cards without emitting their IDs makes recovery impossible.

## Guardrails

- **Refuse when the dataset schema cannot be retrieved.** Step 1 is not optional — building cards from assumed column names produces wrong data silently.
- **Refuse when card count exceeds 20 and no explicit override is present in the input contract.** A dashboard with more than 20 cards is a reporting dump, not a dashboard.
- **Refuse when the caller requests App Studio output.** This symphony builds v2 card pages only. Route App Studio requests to `app-studio-page-build`.
- **Do not proceed past the blueprint checkpoint (Step 3) without explicit user approval.** Building from an unapproved spec wastes every API call that follows.
- **Never re-aggregate a pre-aggregated column.** If the input contract flags a pre-aggregated dataset, beast modes must use the raw numerator/denominator columns to compute ratios, not AVG() on the pre-calculated column.
- **Refuse to attempt card creation and layout in a single turn when the dashboard has 15 or more cards.** Split into two turns: turn 1 creates all cards; turn 2 reads the card IDs from the prior result and positions them via `domo page layout set`. Confirm with the user before proceeding to turn 2.

## Success criteria

- [ ] Every card in the manifest exists on the page (verified via `domo page cards`).
- [ ] Every card passes `domo card render-check` — no render failures in the final state.
- [ ] Layout verified: full-width cards use w=60, KPI strip is Row 1, no cards with width=0.
- [ ] Handoff report delivered: page name, page ID, card reference table (title, card ID, chart type, dataset, status), and next manual steps (page filters, cross-filtering configuration).
- [ ] Final card count equals planned card count (no silent drops from context-budget overflow).

## Dependencies

- **`dashboard-build`** (T1) — dispatches to this symphony with resolved output type and input contract.
- **Domo Go CLI** (`${ARMOS_DOMO_CLI_PATH}`) — `domo dataset query`, `domo page create`, `domo card preview`, `domo card create`, `domo beastmode create`, `domo page layout convert`, `domo page layout set`, `domo page layout get`, `domo card render-check`.
- **`card-beastmode`** (T0) — reference for beast mode formula patterns; invoke when calculated fields require complex formulas.
- **`card-builder`** (T0) — reference for chart-type column mapping rules.
