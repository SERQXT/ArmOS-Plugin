---
name: card-kpi
tier: t1
bucket: card-work
description: "Build a complete KPI card or any of 207 Domo chart types — composes card-builder (payload + chart-type catalog), card-beastmode (calculated fields), and card-conditional-format (color-coded thresholds). Triggers on 'build a card', 'create a KPI card', 'chart for revenue', 'add a trendline', 'write a beast mode', 'color-code this metric'."
kind: orchestrator
status: draft
visibility: anyone
created_by: lane-L6
created_at: "2026-06-07T00:00:00Z"
supersedes: card-kpi
composes:
  - card-builder
  - card-beastmode
  - card-conditional-format
# LOCAL OVERRIDE — do not edit the upstream domo-platform copy.
# This file upgrades the upstream card-kpi from T0 to T1 (Orchestration layer).
# The upstream core/skills/domo-platform/skills/card-creation/SKILL.md is synced
# from the product-team plugins repo; editing it locally would be overwritten.
# This override in armos-internal-overrides takes precedence via plugin load order:
# discoverSkillPlugins() in agent.service.ts reads core/skills/ alphabetically and
# "armos-internal-overrides" sorts AFTER "domo-platform", so this plugin is
# registered last — and the Claude SDK skill-tool layer uses last-registration wins
# for same-named skills (shadowing). Verify by checking discoverSkillPlugins() output
# lists "armos-internal-overrides" after "domo-platform" before shipping to prod users.
# Surface upstream: once the v2 rebuild merges, delete this file and promote upstream.
---

# card-kpi — KPI Card Orchestration

Builds production-ready Domo KPI cards (and all 207 chart types) for a given dataset and metric spec. Composed over three T0 primitives: `card-builder` (payload schema + chart-type selection), `card-beastmode` (calculated field authoring), and `card-conditional-format` (threshold color rules).

## When to use

- "build a KPI card for total revenue"
- "create a trendline showing pipeline by quarter"
- "add a bar chart of deals by rep to this page"
- "build a card with a beast mode for win rate"
- "make a single-value card showing this month's ARR"
- "create a gauge showing quota attainment with red/yellow/green thresholds"

## When NOT to use

- For table cards (`badge_basic_table`, `badge_pivot_table`): use `card-table-build` which has table-specific column and sorting guidance
- For App Studio card placement and writelock flow: that is handled by the `app-studio-page-build` T1, not this skill
- For multiple cards that form a complete dashboard: use the `dashboard-build` T1 which orchestrates this skill as a sub-step

## What this skill does

1. **Receive card spec** — chart type (or description), dataset ID, column mappings, optional beast mode expressions, optional conditional format thresholds
2. **Validate dataset and columns** — confirm all referenced columns exist and types match the chosen chart type
3. **Author beast modes if required** — consult `card-beastmode` for scope decision (card vs dataset level), run `domo_beastmode_validate` pre-flight, then create
4. **Build the payload** — consult `card-builder` for the complete `AnalyzerCardUpdate` JSON shape, apply Pre-Render Validation Checklist (cardinality gates, anomaly checks)
5. **Apply conditional formats if required** — consult `card-conditional-format` for the `conditionalFormats` object structure
6. **Preview before create** — preview is mandatory; never skip (see `card-builder` gotchas)
7. **Create the card** — PUT to `/content/v3/cards/kpi?pageId=:pageId`
8. **Post-creation render check** — verify the card renders; diagnose and retry up to 2x if not

## Sub-skills

- `card-builder` — analyzer-card-payload T0: chart-type catalog (all 207 types), full payload schema, CRUD endpoints, Pre-Render Validation Checklist
- `card-beastmode` — card-beastmode-payload T0: beast mode creation, scope (card vs dataset), `domo_beastmode_validate` pre-flight
- `card-conditional-format` — card-conditional-format-rule T0: `conditionalFormats` object structure and threshold rules

## Design principles

- **Preview gates create.** Never call the card create endpoint without a passing preview. The Pre-Render Validation Checklist in `card-builder` runs before preview.
- **Beast modes precede cards.** All `formulaId` references must resolve before the card payload is assembled. A missing beast mode causes a silent 400 on card creation.
- **Scope beast modes deliberately.** Dataset-level beast modes are reusable across cards; card-level are card-private. Default to dataset-level for any metric likely to appear in more than one card.
- **Aggregation parity.** Aggregate formulas must not carry an `aggregation` field on the card column — see `card-beastmode` aggregation rule. Verify before each card.
- **Conditional formats are objects, not arrays.** Always send `{"card":[],"datasource":[]}`. See `card-conditional-format` for the read-vs-write shape mismatch.
- **One card = one dataset.** The `dataProvider.dataSourceId` references exactly one dataset. Multi-dataset cards are not supported via this API.
