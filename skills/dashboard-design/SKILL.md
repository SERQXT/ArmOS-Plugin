---
name: dashboard-design
tier: 1
description: "Discovery through blueprint approval for dashboard builds. Covers data profiling, dashboard audit (if redesign), design via dashboard-architect, and user approval checkpoint. Use when you need the design phase only, or as the first phase of a full dashboard build. Trigger with 'design a dashboard', 'what should this dashboard look like', or 'plan a dashboard for [dataset]'."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-build (T1) spec phase — the judgment and blueprint approval step is now baked into dashboard-build's dispatch protocol."
audience: [delivery]
---

# Dashboard Design — Discovery to Blueprint Approval

Handles the discovery and design phase of a dashboard build: data profiling, optional audit of existing dashboards, architecture via dashboard-architect, and user approval checkpoint. Produces an approved blueprint ready for dashboard-build.

## Triggers

- "design a dashboard"
- "what should this dashboard look like"
- "plan a dashboard for [dataset]"
- "audit and redesign this dashboard"

---

## Step 1: Output Type Selection

Ask the user what type of output to build:
- **(A) v1 Dashboard** — Traditional Domo dashboard. Cards in creation order, manual layout. Only for quick throwaway prototypes.
- **(B) v2 Page** — **Recommended default.** 60-unit grid positioning via `layout_set`. Best for any build where layout matters.
- **(C) App Studio App** — Custom drag-and-drop builder. Best for highly polished client-facing dashboards.

**Default to v2 Page** unless the user specifically requests otherwise.

---

## Step 2: Data Discovery

**Tools:** `dataset_schema`, `dataset_profile`, `dataset_query`

For each source dataset, run ALL of these mandatory queries:

1. `SELECT * FROM table LIMIT 5` — see actual data shapes
2. `SELECT DISTINCT <dimension_col> FROM table` — for EVERY string/categorical column
3. `SELECT MIN(<date_col>), MAX(<date_col>) FROM table` — date boundaries
4. `SELECT COUNT(*) FROM table WHERE <col> IS NOT NULL` — null checks for key columns
5. `SELECT COUNT(*) FROM table` — row count

**Output:** Column inventory with types, roles, cardinality, actual distinct values, date ranges, and data quality issues. This is the single source of truth for all subsequent steps.

---

## Step 3: Dashboard Audit (Redesign Only)

**Skill:** `dashboard-auditor`

Skip for new builds. For redesigns:
1. Invoke dashboard-auditor with the target page ID
2. Produce KEEP/REBUILD/DELETE classifications for each card
3. Present audit report to user before proceeding

---

## Step 4: Dashboard Architecture

**Skill:** `dashboard-architect`

Invoke with: output type, audience, business questions, column inventory, and constraints (if redesign).

**Output:** Full blueprint with page map, KPI row, card specs, color system, and interaction model.

---

### Blueprint Feasibility Check

Before returning the blueprint, validate against output_type constraints:
- **v1_dashboard**: Only card sizes (medium/large/full) — reject exact grid positions
- **v2_page**: Require exact {x, y, width, height} on 60-unit grid — check for overlaps
- **app_studio**: Require at least one `rooster:banner` component — reject all-KPI blueprints

---

## Step 5: Blueprint Validation + Approval

**Fast-track for simple dashboards:** If <= 1 dataset AND <= 12 cards AND user said "build it": present a brief "here's what I'm building" summary and proceed unless they object.

**For complex dashboards**, validate:
- [ ] Hero KPI row with 3-5 summary numbers + comparison context
- [ ] No pie/donut charts with 4+ slices
- [ ] No AVG() on pre-calculated averages
- [ ] Pivoted dataset deduplication addressed
- [ ] Total trend card for primary metric
- [ ] All chart types valid

Then present blueprint and wait for explicit approval.

---

## Output

The approved blueprint, ready for `dashboard-build` to execute. Includes:
- Output type (v1_dashboard, v2_page, app_studio)
- Column inventory from discovery
- Card specifications with chart types, columns, aggregations, filters
- Layout map with grid positions
- Interaction model (page filters, cross-filter map)

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: design decisions made — layout approach, color system, typography, persona alignment, interaction patterns.

## MCP Servers Required

- **domo-datasets** — dataset discovery, schema, profiling, queries
- **domo-pages** — card definitions (for audit), page cards
