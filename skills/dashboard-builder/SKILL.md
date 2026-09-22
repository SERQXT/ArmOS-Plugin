---
name: dashboard-builder
tier: 2
description: "End-to-end dashboard orchestration — design, spec, build, verify, and assemble. The single entry point for all dashboard work in Domo: new builds, redesigns, quick builds, and App Studio apps. Trigger with 'build a dashboard', 'redesign this dashboard', 'create a dashboard from scratch', 'quick dashboard from [dataset]', 'build from this blueprint', or any request to build, rebuild, or design a Domo dashboard."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-build (T1) in the v2 customer-delivery cluster."
audience: [orchestration, delivery]
---

# Dashboard Builder — End-to-End Dashboard Orchestration

The single orchestrator for all Domo dashboard work. Handles new builds, redesigns, quick builds, blueprint-only design, and build-from-existing-blueprint — all through one skill with conditional logic.

Chains together component skills (`dashboard-auditor`, `dashboard-architect`, `card-spec-designer`, `card-builder`) and shared reference knowledge with explicit checkpoints so the user stays in control.

## Shared Knowledge

Before starting any dashboard workflow, read these shared references in `reference/`:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `dashboard-principles.md` | Design science rules — KPI hero rows, chart type limits, pre-calculated averages, deduplication | Before Step 4 (design) and Step 4.5 (validation) |
| `dashboard-review-criteria.md` | 8-dimension visual scoring for screenshot evaluation | Step 7.7 (layout visual check) |
| `lessons-learned.md` | Common failure patterns — double aggregation, wrong columns, filter issues | Before Step 7 (card creation) and Step 9.5 (PDCA verification) |
| `output-type-guide.md` | v1 vs v2 vs App Studio capabilities, constraints, and layout recipes | Step 0.5 (output type selection) and Step 7/8 (branching) |

Also reference from `../card-builder/reference/`:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `chart-types.md` | 128 Domo chart types with column mappings | Step 4.5 (chart type validity check) |

## Triggers

- "build a dashboard"
- "redesign this dashboard"
- "rebuild the fulfillment page"
- "create a dashboard from scratch"
- "the dashboard is bad — fix it"
- "make me a dashboard for [dataset/topic]"
- "dashboard end to end"
- "quick dashboard from [dataset]"
- "just build me a dashboard"
- "design a dashboard" / "plan a dashboard"
- "build the dashboard" / "execute the blueprint"
- "verify the dashboard" / "check the cards render"

---

## MCP Call Budget

This skill is a **heavy workflow** (50 MCP call budget). Typical usage:
- 5-card dashboard: ~20 calls (create + preview + render check + layout)
- 10-card dashboard: ~35 calls
- 20-card dashboard: ~50 calls (at budget limit)

**Optimization rules:**
- Skip `card_preview` if confident in chart type selection (saves 1 call per card)
- Batch `card_render_check` — check all cards after creation, not one-by-one
- For 15+ card dashboards, split into two turns: create cards in turn 1, layout in turn 2

## Tools Required

| Tool | MCP Server | Required For |
|------|-----------|-------------|
| `dataset_schema` | domo-datasets | Step 1: Data discovery |
| `dataset_profile` | domo-datasets | Step 1: Data discovery |
| `dataset_query` | domo-datasets | Step 1: Data discovery |
| `page_create` | domo-pages | Step 7: Create target page |
| `card_create_full` | domo-pages | Step 7: Create cards |
| `card_preview` | domo-pages | Step 7: Preview cards |
| `card_render_check` | domo-pages | Step 9.5: Verify cards render |
| `beast_mode_create` | domo-pages | Step 7: Calculated fields |
| `layout_convert` | domo-pages | Step 7: v2/App Studio layout |
| `layout_set` | domo-pages | Step 7: Position cards |
| `card_size_set` | domo-pages | Step 7.5: Card sizing |

**Pre-flight:** Before starting, verify these tools are available. If any tool returns "unknown tool" or is not in the allowed tools list, STOP and report which tools are missing.

## If Tools Are Unavailable

If any required tool is not available (returns "unknown tool" error or is missing from allowed tools):

1. **Check credentials**: The customer's Domo instance may not be configured. Ask the user to verify their Domo connection.
2. **Continuation mode**: If you're in a continuation turn, read-only tools (dataset_list, dataset_query, search) are stripped. Use data from the checkpoint context instead of re-querying.
3. **Report the gap**: Tell the user which specific tool is unavailable and why the workflow can't proceed without it.
4. **Never guess**: Do not attempt to call tools that aren't available. Do not try alternative endpoints or raw API calls.

---

## Workflow Overview

```
User request
    │
    │     Step 0.5: Output Type Selection
    │     (v1 Dashboard / v2 Page / App Studio)
    │              │
    ├── New build? ──────────────────────┐
    │                                     │
    ├── Redesign? ─┐                     │
    │              │                      │
    │     Step 1: Data Discovery          │
    │              │                      │
    │     Step 2: Dashboard Audit    (skip for new)
    │              │                      │
    │     Step 3: Page Cleanup       (skip for new)
    │              │                      │
    │              └──────────────────────┘
    │                        │
    │              Step 4: Dashboard Design
    │              (output_type → architect)
    │                        │
    │         ╔══════════════════════════════╗
    │         ║  Step 5: CHECKPOINT          ║
    │         ║  User approves the blueprint ║
    │         ║  before ANY cards are built  ║
    │         ╚══════════════════════════════╝
    │                        │
    │              Step 6: Card Specification
    │              (output_type → spec designer)
    │                        │
    │              Step 7: Card Creation
    │              (branched by output_type)
    │                        │
    │              Step 7.7: Layout Visual Check (PDCA)
    │              (v2_page/app_studio only — screenshot → evaluate → fix → re-screenshot)
    │                        │
    │              Step 8: UI Setup Guide / Assembly Guide
    │              (branched by output_type)
    │                        │
    │              Step 8.5: App Studio Build (API)
    │              (app_studio only — appstudio_create + card_create_full + appstudio_layout)
    │                        │
    │              Step 9: Verification
    │                        │
    │              Step 9.5: PDCA Verification Loop
    │              (render-check → diagnose → fix → retry)
    │                        │
    │                      Done
```

---

## Step-by-Step Execution

### Step 0.5: Output Type Selection

**Purpose:** Determine what type of Domo output to build. The output type constrains the design (what the architect can plan) and the build process (what APIs are used), so it must be chosen before anything else.

**Ask the user:**

> What type of output should I build?
> - **(A) v1 Dashboard** — Traditional Domo dashboard. Cards created via API, layout arranged manually in the Domo UI. Best for: standard reporting, quick builds.
> - **(B) v2 Page** — Enhanced Domo page with richer styling and collections. Best for: polished executive views. *(Note: layout automation via API is not currently available — layout steps will be manual.)*
> - **(C) App Studio App** — No-code drag-and-drop builder with custom layouts, text blocks, images, embedded cards. Best for: highly customized client-facing dashboards. *(Cards are created and pre-positioned on a staging page via API, then imported into App Studio.)*

**Default recommendation logic:**
- **Default to (B) v2 Page** for ANY build where layout matters (which is nearly every build). v2 has the 60-unit grid via `layout_set` which enables programmatic card positioning. v1 has NO programmatic positioning — cards appear in creation order and must be manually dragged.
- Executive audience + high polish requirement → recommend **(C) App Studio App**
- Only recommend **(A) v1 Dashboard** for quick throwaway prototypes where layout quality doesn't matter
- If the user is unsure, default to **(B) v2 Page**

**Store `output_type`** as a workflow variable (`v1_dashboard`, `v2_page`, or `app_studio`) that flows through Steps 4, 6, 7, and 8.

| Output Type | Cards via API? | Layout via API? | Final Deliverable |
|---|---|---|---|
| v1 Dashboard | Yes (`card_create_full`) | **No** — cards appear in creation order, manual drag required | UI Setup Guide (current Step 8) |
| v2 Page | Yes (`card_create_full`) | **Yes** — `layout_convert` + `layout_set` with 60-unit grid | UI Setup Guide (v2-adapted) |
| App Studio | Yes (`card_create_full`) | **Yes** — `layout_convert` + `layout_set` on staging page (cards pre-positioned before import) | App Studio Assembly Guide |

> **Why v2 is the default:** v1 pages have two critical limitations: (1) no programmatic card positioning — cards appear in creation order, requiring manual drag-and-drop for every card, and (2) deleting cards leaves ghost placeholder slots that cannot be removed via API (you must create a new page). v2 pages solve both problems with the `layout_set` API on a 60-unit grid.

---

### Step 1: Data Discovery

**Purpose:** Understand what data is available before designing anything.

**Tools:** `dataset_schema`, `dataset_profile`, `dataset_query`

For each dataset that will power the dashboard:

1. **Pull the schema** — column names, types, and structure
2. **Profile the data** — row count, cardinality of dimensions, value ranges of measures, date ranges
3. **Sample the data** — run targeted queries to understand actual values, spot nulls, and validate assumptions

**Mandatory discovery queries — run ALL of these for every source dataset:**

1. **Sample rows:** `SELECT * FROM table LIMIT 5` — see actual data shapes, column formats, and real values before designing anything
2. **Dimension values:** For EVERY string/categorical column, run `SELECT DISTINCT <dimension_col> FROM table` — you MUST know the actual values (e.g., the column might contain "Current Year" not "CY", or "Completed" not "Complete")
3. **Date ranges:** For every date column, run `SELECT MIN(<date_col>), MAX(<date_col>) FROM table` — know the exact date boundaries so filters and comparisons reference valid ranges
4. **Null checks:** For key columns (measures, important dimensions, dates), run `SELECT COUNT(*) FROM table WHERE <col> IS NOT NULL` — identify columns with missing data before building cards that depend on them
5. **Row count:** `SELECT COUNT(*) FROM table` — know the data volume

**Critical rule:** The discovery output from these queries MUST be referenced when designing card specs in Steps 4 and 6. No guessing at column values, date ranges, or dimension members. If you did not run the discovery query, you do not know the value — and you must not assume it.

**Output:** A column inventory documenting:
- Every available column with its type and role (measure, dimension, date, identifier)
- Cardinality of each dimension (how many regions? how many products?)
- **Actual distinct values** for every dimension column (exact strings as they appear in the data)
- Date range coverage (earliest to latest, with exact dates)
- Any data quality issues (nulls, unexpected values, empty columns)
- Sample rows showing real data shapes

This inventory feeds into both the audit (Step 2) and the design (Step 4). It is also the single source of truth for column names and filter values in Steps 6 and 7.

**How to identify datasets:**
- If redesigning: extract dataset IDs from existing card definitions (Step 2 will provide these)
- If the user specifies datasets: use those
- If exploring: use `dataset_list` or `dataset_search` to find relevant datasets
- Check the account knowledgebase for prior data model documentation

---

### Step 2: Dashboard Audit (Redesign Only)

**Skip this step if building a new dashboard from scratch.**

**Skill:** `dashboard-auditor`

**Purpose:** Evaluate the existing dashboard to determine what to keep, rebuild, and delete.

**Execution:**
1. Invoke the dashboard-auditor skill with the target page ID
2. The auditor pulls all cards via `page_cards` + `card_bulk_definitions`
3. The auditor evaluates each card against design science criteria
4. The auditor produces an audit report with KEEP/REBUILD/DELETE classifications

**Output:** Audit report containing:
- Card-by-card assessment with keep/rebuild/delete decisions
- Missing elements that should be added
- Redesign constraints (datasets available, anti-patterns to avoid)

**Present the audit report to the user** with a summary of findings before proceeding. The user may want to override keep/rebuild/delete decisions.

---

### Step 3: Page Cleanup (Redesign Only)

**Skip this step if building a new dashboard from scratch.**

**Purpose:** Remove cards classified as DELETE by the audit, clearing space for the redesign.

**Tools:** `card_delete`

> **⚠️ CRITICAL: Ghost Slots on v1 Pages**
> Deleting cards from a v1 page leaves empty placeholder positions (ghost slots) that CANNOT be removed via API. The page will have visible gaps where deleted cards were.
>
> **If redesigning a v1 page with many deletions:** Do NOT delete cards from the existing page. Instead:
> 1. Create a fresh page with `page_create`
> 2. Migrate KEEP cards to the new page
> 3. Build new cards on the fresh page
> 4. Archive or delete the old page
>
> **If redesigning a v2 page:** Ghost slots are not an issue — use `layout_set` to reflow the remaining cards after deletion.

**Execution (when deletion is safe — v2 pages or few deletions on v1):**
1. List the cards marked DELETE from the audit report
2. **Confirm with the user** before deleting — present the list and ask for approval
3. Delete approved cards using `card_delete` for each card ID
4. Report which cards were deleted
5. **If v2 page:** Call `layout_set` to compact the remaining card positions

**Do NOT delete cards marked KEEP or REBUILD yet.** REBUILD cards are deleted later when their replacements are ready, or the card-builder creates new cards alongside them.

**Important:** Card deletion is irreversible. Always confirm before executing.

---

### Step 4: Dashboard Design

**Skill:** `dashboard-architect`

**Purpose:** Produce a complete dashboard blueprint grounded in design science.

**Execution:**
1. Invoke the dashboard-architect skill with:
   - The column inventory from Step 1 (available data)
   - The audit report from Step 2 (if redesign — constraints on what to preserve)
   - Any user-provided context (audience, business questions, goals)
2. The architect produces a full blueprint: page map, KPI row, card specifications, color system, interaction model

**Inputs to dashboard-architect:**
- **Output type:** The `output_type` from Step 0.5 (`v1_dashboard`, `v2_page`, or `app_studio`) — this constrains what the architect can design
- **Audience:** Who views this dashboard? (executive, manager, analyst, operations)
- **Business questions:** What top 3 questions should this answer?
- **Available datasets:** Column inventory from Step 1
- **Constraints (if redesign):**
  - Cards to preserve (KEEP list from audit)
  - Business questions inferred from existing cards
  - Anti-patterns to avoid (from audit findings)
  - Data gaps identified by the audit

**Output:** Dashboard blueprint with:
- Page map and layout (12-column grid positions for each card)
- KPI summary row design (with comparison context for every KPI)
- Card specifications (chart type, columns, aggregations, filters, beast modes)
- Color system
- Interaction model (page filters, cross-filter map, drill paths)

---

### Step 4.5: Blueprint Validation

**Complexity heuristic — fast-track simple dashboards:**
If ALL of the following are true, collapse Steps 4.5 + 5 into a single "here's what I'm building" summary and proceed unless the user objects:
- ≤ 1 source dataset
- ≤ 12 cards in the blueprint
- User gave a clear "build it" / "go ahead" signal (not "design something for me to review")

For simple dashboards, present a brief summary: "I'm building [N] cards on a [v1/v2] page from [dataset]. [1-line layout description]. Building now — let me know if you want changes." Then proceed directly to Step 6.

**For complex dashboards (2+ datasets, 12+ cards, or user wants review), validate against these hard rules before presenting for approval (Step 5).**
**If ANY check fails, fix the blueprint before proceeding — do not present a non-compliant blueprint.**

- [ ] **HERO KPI ROW:** The blueprint includes a KPI summary row as Row 1 with 3-5 summary number cards.
  Each KPI must have: label, current value, comparison context (vs PY, vs target, or vs benchmark).
  *If missing:* add a hero row with the top 3-5 metrics for the domain.

- [ ] **PIE CHART LIMIT:** No pie/donut charts with 4+ slices.
  *If a pie chart has 4+ categories:* replace with `badge_horiz_bar` (sorted descending).

- [ ] **NO PRE-CALCULATED AVERAGES:** No `AVG()` aggregation on columns that are already averages
  (column names containing "avg", "average", "rate", "pct", "percent", "ratio").
  *If detected:* replace with a beast mode that computes the weighted average from raw components
  (e.g., `SUM(numerator) / NULLIF(SUM(denominator), 0)`).

- [ ] **PIVOTED DATASET DEDUPLICATION:** If the dataset has a pivot dimension (e.g., ServiceType)
  that creates multiple rows per entity-date, check that additive measures shared across pivot
  rows (like CustomerCount, NetSales) are not double-counted when grouped by the pivot dimension.
  *If detected:* use a beast mode with a deduplication strategy (e.g., only count where pivot = first value,
  or use MAX per entity-date instead of SUM).

- [ ] **TOTAL TREND:** The blueprint includes at least one trend-over-time card showing the primary metric's
  overall trajectory (not broken out by series). This answers "is it getting better or worse?"
  *If missing:* add a trendline card for the hero KPI metric by the time dimension.

- [ ] **CHART TYPE VALIDITY:** Every `chartType` in the blueprint exists in `reference/chart-types.md`.
  Cross-reference before proceeding.

---

### Step 5: Checkpoint — User Approval

**THIS IS A HARD GATE. Do not proceed to card creation without explicit user approval.**

Present the blueprint to the user in a clear, readable format:

```
## Dashboard Blueprint: [Name]

### KPI Row
[List each KPI with its metric, comparison, and position]

### Cards
[For each card: title, chart type, what it shows, grid position]

### Interaction Model
[Page filters, cross-filter sources → targets]

### Layout
[ASCII grid showing card arrangement]

---

Does this look right? I'll build these cards once you approve.
You can ask me to:
- Add, remove, or modify any card
- Change chart types
- Adjust the KPI row
- Modify the interaction model
```

**Approval Protocol:**
Present the blueprint and ask: "Ready to build? (yes/no/change something)"
- "yes" or "build it" → proceed to Step 6
- "no" or specific feedback → return to Step 4 with modifications
- No response after presenting → wait, do not auto-proceed

**Wait for explicit approval** (e.g., "looks good", "go ahead", "approved", "build it").

If the user requests changes, iterate on the blueprint. Do not proceed until the user is satisfied.

---

### Step 6: Card Specification

**Skill:** `card-spec-designer`

**Purpose:** Transform the approved blueprint into buildable card specs with exact column mappings, aggregations, beast mode formulas, and filters.

**Execution:**
1. For each card in the approved blueprint, invoke card-spec-designer to produce a detailed spec
2. The spec designer resolves abstract blueprint descriptions ("revenue by region") into exact column names, aggregation types, and filter configurations
3. Beast mode formulas are written for any calculated fields (comparison %, YoY change, etc.)

**Mandatory validation rules — every spec MUST satisfy these before proceeding to Step 7:**

1. **Column name validation:** Every column name in the spec MUST match exactly (case-sensitive) a column from the dataset schema discovered in Step 1. If the schema says `Order Date`, the spec cannot say `order_date` or `OrderDate`.
2. **Beast mode column references:** Beast mode formulas MUST reference actual column names from the schema, escaped with backticks (e.g., `` `Revenue` ``, `` `Order Date` ``). Do not guess column names.
3. **Filter value validation:** Every filter value in the spec MUST use actual values discovered in Step 1's dimension queries. If `SELECT DISTINCT flag FROM table` returned `"Current Year"` and `"Prior Year"`, the filter cannot use `"CY"`, `"PY"`, `"FY26"`, or any other abbreviation. Use the exact string.
4. **Double-aggregation prevention:** If a beast mode formula contains an aggregation function (SUM, AVG, COUNT, MIN, MAX), then any card column that references that beast mode via `formulaId` MUST have `aggregation` set to `null` or omitted entirely. Setting `aggregation: "SUM"` on a column whose beast mode already does `SUM()` causes the double-aggregation bug (SUM of SUMs), which produces wildly wrong numbers.
5. **Date range validation:** Any date filters or date-based comparisons must fall within the actual date range discovered in Step 1. Do not filter for "Last 30 days" if the data ends 6 months ago.

**Output:** A set of card specs in the format expected by card-builder:
- Chart type
- Dataset ID
- Column mappings with exact column names and aggregation types
- GroupBy and OrderBy clauses
- Filters (using validated values from data discovery)
- Beast mode formulas (name + formula + purpose), with aggregation flags noted
- Date grain (if applicable)

---

### Step 7: Create Components

**Skill:** `card-builder`

**Purpose:** Create all cards and components in Domo on the target page.

Create components in this order based on `component_type` from the blueprint:

#### Step 7a: Structural Components (Rooster)
For specs with `component_type` starting with `rooster:`:
- Use `rooster_card_create` + `rooster_card_bind`
- Refer to `build-appstudio/reference/rooster-dml-templates.md` for DML patterns
- Create these FIRST — they define the page structure (headers, filters)

#### Step 7b: Data Visualization Cards (KPI)
For specs with `component_type: kpi` (or unspecified):
- Use existing `card_create_full` flow via card-builder skill
- This is the existing Step 7 behavior — unchanged

#### Step 7c: Custom Components (ProCode)
For specs with `component_type: procode`:
- Delegate to procode-app-builder skill for app creation
- Embed in page via `app_card_create`

**Branching by output_type:**

| Output Type | Page Creation | Card Creation | Layout | Notes |
|---|---|---|---|---|
| **v1 Dashboard** | `page_create` (v1) | `card_create_full` on page | **Creation order = visual order** | No layout API — cards appear in the order created |
| **v2 Page** | `page_create` (v1) | `card_create_full` on page | `layout_convert` + `layout_set` | Full 60-unit grid positioning |
| **App Studio** | `page_create` (v1) as card container | `card_create_full` on page | `layout_convert` + `layout_set` | Cards pre-positioned on staging page; Assembly Guide for App Studio import |

**Note:** Cards are always v1 API objects regardless of output type. The output type affects only the *container* (page vs. App Studio app) and the final assembly instructions (Step 8).

> **⚠️ v1 Card Ordering Rule:** On v1 pages, cards display in creation order. There is NO API to reposition them. You MUST create cards in the exact visual order: top-to-bottom, left-to-right. Create the KPI hero row cards first, then the primary analysis row, then supporting rows, then detail/table cards last.

> **v2/App Studio Layout — Design-Driven Positioning:**
>
> **The layout tells a story.** Position cards following the information hierarchy from `reference/dashboard-principles.md`:
> - **Row 1 — Hero KPIs**: Full width, equal columns. The viewer scans these in <5 seconds for overall status.
> - **Row 2 — Primary Analysis**: 2/3 + 1/3 split (or full width). The main trend or breakdown that explains the KPIs.
> - **Row 3 — Supporting Analysis**: Equal halves or thirds. Additional breakdowns, compositions, comparisons.
> - **Row 4 — Detail**: Full width. Tables, drill-downs, detailed data.
> - **Section headers** between rows help the viewer navigate (e.g., "Trends & Analysis", "Regional Breakdown").
>
> **Implementation (single-payload approach — the only reliable method):**
> 1. **Always use a fresh page** — `page_create`. Existing pages may have `virtualAppendix: true` which silently blocks layout writes. See `reference/lessons-learned.md` #11.
> 2. Create all cards on the fresh page via `card_create_full` with `page_id`
> 3. `layout_convert` → enables the positioning grid
> 4. **Verify cards are on page:** `page_cards(page_id)` — every card ID must be present before layout ops
> 5. `layout_get` → read the full layout to get `layoutId` and all `contentKey` mappings
> 6. Check `virtualAppendix` — if any item has `virtualAppendix: true`, STOP and create a fresh page
> 7. Build the COMPLETE layout payload with ALL headers + ALL card positions in a single object. Domo uses a 60-unit wide grid internally — translate the design intent to coordinates:
>    - KPI row (equal across top): N cards × `{w: 60/N, h:6}` starting at y=0
>    - 2/3 + 1/3 split: `{w:40, h:20}` + `{x:40, w:20, h:20}`
>    - Equal thirds: 3 × `{w:20, h:20}` at x=0, 20, 40
>    - Full width (standard chart): `{w:60, h:20}`
>    - Full width (app card — DDX/ProCode/iframe): `{w:60, h:56}` with header hidden (`w:0, h:0`)
>    - Section headers: `{w:60, h:5}` — full width, height ≥5 (smaller causes garbled text)
>    - Set `virtual: false` and `virtualAppendix: false` on every template item
>
> **⚠️ Single-card pages:** If a page has only ONE card (or one card per row), that card MUST use `w:60` (full grid width). The `w:40` value is ONLY for side-by-side layouts with a companion card at `x:40`. A lone card at `w:40` renders at 67% width and may become uneditable in the Domo UI.
>
> **App cards vs chart cards:** Custom apps (DDX, Pro-Code, iframe embeds) need significantly more height than standard charts. Use `h:56` for app cards that should fill the viewport. The `h:20` value is for standard chart cards only.
>
> **Header handling:** If the page has a HEADER content slot:
> - For **app-only pages** (single embedded app): Set header to `{x:0, y:0, w:0, h:0}` (hidden) to maximize card real estate
> - For **multi-card dashboards**: Set header to `{x:0, y:0, w:60, h:2}` for a visible section title
> - **Never** set a header to a width less than 60 if it's visible — a narrow header (e.g., w:40) will constrain the entire column below it
>
> 8. Writelock → PUT full payload → Release writelock
> 9. Verify with `layout_get` and check:
>    - Every visible card has `width > 0` and `height > 0`
>    - No single card has `width < 60` unless it's part of a multi-column row
>    - Full-width cards use exactly `w:60` (not 40, not 50)
>    - App cards have `h >= 40` (recommend `h:56` for viewport-filling apps)
>    - Headers are either hidden (`w:0`) or full-width (`w:60`) — never partial
>
> **WARNING:** Do NOT use incremental layout operations. `layout_set` with individual positions and `header_create` are unreliable on most pages. The single-payload PUT is the only verified working approach.

**Execution:**
1. Invoke card-builder with the full set of card specs from Step 6
2. Card-builder validates each spec against the dataset schema
3. Card-builder creates beast modes first (they must exist before cards reference them)
4. **Mandatory preview gate:** Before creating each card, call `card_preview` with the exact spec. If preview fails, DO NOT create the card — diagnose the spec issue and fix it before retrying the preview. Only proceed to creation after a successful preview.
5. After successful preview, create the card with `card_create_full` on the target page
6. **Immediate render verification:** After creation, call `card_render_check` on the new card ID to confirm it actually renders with data
7. **If render check fails:** Delete the broken card with `card_delete`, diagnose the spec issue (wrong column names? double aggregation? bad filters?), fix the spec, and retry from step 4. Maximum 2 retries per card.
8. Card-builder reports progress after each card (created + render verified, or failed with reason)

**Target page:**
- **Always create a fresh page with `page_create`** for v2 and App Studio builds. Existing pages may have `virtualAppendix` which silently blocks layout writes.
- If redesigning a v1 page: create a fresh page and migrate KEEP cards (v1 ghost slots, plus virtualAppendix risk on existing pages)
- If App Studio: the fresh staging page holds cards and gets layout positioning BEFORE import

**Error handling:**
- If a card fails preview, diagnose and fix the spec before retrying — do not create a card that failed preview
- If a card fails render check after creation, delete it and retry with a fixed spec (max 2 retries)
- After all cards are attempted, report successes, retried fixes, and permanent failures
- For permanent failures (exhausted retries): report the diagnosis so the user can intervene

**If REBUILD cards exist from the audit:** The old versions remain on the page alongside the new cards. The UI Setup Guide (Step 8) will instruct the user to remove the old cards and position the new ones.

#### Checkpoint: Emit Partial Results

After creating all cards but before layout, emit a status update to the user:
```
## Progress Checkpoint
✅ Created [N] cards: [card_id_1, card_id_2, ...]
⏳ Next: Layout positioning

If this message appears and I stop responding, a continuation agent will pick up from here.
The card IDs above are all that's needed to complete the layout step.
```

This ensures continuation agents have the card IDs needed to finish the workflow.

---

### Step 7.5: Card Sizing (Automated)

**Purpose:** Set card sizes on the page based on the blueprint's layout specification. This is now **fully automated** via `card_size_set`.

**Execution:**
1. Build a size map from the blueprint's layout section — each card's designated size (medium, large, or full)
2. Call `card_size_set` with `page_id` and a `sizes` object mapping each card ID to its blueprint-specified size
3. Cards with no explicit size in the blueprint remain at the default (small)

**Size values and visual reference:**
| Blueprint Size | API Value | Visual Width | Use For |
|---|---|---|---|
| Small / 1-column | *(default — don't set)* | ~200px (1/6 page) | KPI number cards only |
| Medium / 2-column | `"medium"` | ~300px (1/4 page) | KPI cards, small charts |
| Large / 3-column | `"large"` | ~434px (1/3 page) | Standard charts, breakdowns |
| Full width | `"full"` | ~1300px (full page) | Tables, detailed trends, hero charts |

> **Note:** "medium" is narrower than most people expect — it's still only ~1/4 of the page width. For most chart cards, use "large" or "full". Reserve "medium" for KPI summary numbers and small supplementary charts.

**Example call:**
```json
{
  "page_id": 12345,
  "sizes": {
    "111": "full",
    "222": "large",
    "333": "medium"
  }
}
```

**Note:** This sets the card *size* (width) but not the card *position* on the page grid. Positioning is still manual and covered in the UI Setup Guide (Step 8).

---

### Step 7.7: Layout Visual Check (PDCA Screenshot Loop)

**Only for `output_type` = `v2_page` or `app_studio`.** Skip for `v1_dashboard` (v1 uses flow layout, not the Layout API).

**Purpose:** Visually verify the dashboard layout by taking a screenshot and evaluating it against the blueprint. This is the "Check" step in the PDCA loop — Plan (blueprint) → Do (create cards + set layout) → **Check (screenshot review)** → Act (fix positions).

**Reference:** `reference/dashboard-review-criteria.md`
**Tools:** `qa_domo_page_screenshot`, `layout_set`

**Execution:**

1. Call `qa_domo_page_screenshot` with the staging page URL. The tool returns an MCP image block the agent can visually inspect.
2. Evaluate the screenshot using the 8-dimension scoring framework in `reference/dashboard-review-criteria.md`: Card Visibility, Layout Balance, Card Sizing, Spacing, Readability, Visual Hierarchy, Content Cleanliness, Content-Type Fit.
3. Score each dimension: PASS / MINOR_ISSUE / MAJOR_ISSUE.

**If any MAJOR_ISSUE:**
1. Determine corrected card positions (x, y, width, height adjustments based on the specific issue)
2. Call `layout_set` with the corrected positions
3. Wait 5 seconds, then re-screenshot with `qa_domo_page_screenshot`
4. Re-evaluate — maximum 2 correction iterations
5. If still MAJOR_ISSUE after 2 iterations: proceed with best-effort layout and note issues in the setup guide

**If PASS or MINOR_ISSUE only:** Proceed to Step 8. Log any MINOR_ISSUE notes for the guide.

**If screenshot tools are unavailable** (no browser credentials, `qa_domo_page_screenshot` not configured): Skip Step 7.7 entirely and note in the output: "Visual layout verification skipped — screenshot tools require browser login credentials (username/password), not available via dev token alone. Verify layout manually in Domo." This is NOT a build failure — proceed to Step 8.

---

### Step 8: UI Setup Guide / Assembly Guide

**Purpose:** Generate specific, actionable instructions for the manual steps that Domo's API cannot automate: card positioning (drag-and-drop), page filters, and cross-filter configuration. Note: card *sizing* is already handled automatically in Step 7.5.

**This is not vague advice. It is a step-by-step walkthrough with exact card names, positions, and settings.**

**Branching by output_type:**

| Output Type | Guide Type | What It Covers |
|---|---|---|
| **v1 Dashboard** | UI Setup Guide (full) | Card layout, page filters, cross-filtering, verification |
| **v2 Page** | UI Setup Guide (v2-adapted) | Same as v1, plus notes on v2-specific features (collections, enhanced styling) |
| **App Studio** | App Studio Assembly Guide | Create new app, embed cards by ID, position cards, add text blocks/headers, configure filters, publish |

**Generated from:** The approved blueprint's layout and interaction model, plus the actual card IDs/names from Step 7.

---

#### Output Type: v1 Dashboard / v2 Page

**Output format:**

```markdown
## UI Setup Guide — Manual Steps in Domo

Complete these steps in the Domo page editor to finish the dashboard.
Open the page: [Page Name] (ID: [page_id])
Click the wrench icon (top right) → Edit Dashboard

---

### Step 1: Remove Old Cards (Redesign Only)

Remove these cards that were replaced by new versions:
1. Find "[Old Card Title]" → click the X to remove from page (or delete)
2. Find "[Old Card Title]" → click the X to remove from page (or delete)
[repeat for each REBUILD card whose replacement was created]

---

### Step 2: Arrange Cards into Layout

Drag cards into the following layout:

**Row 1 — Hero KPIs (equal width across full page):**
| [Card A: Title] | [Card B: Title] | [Card C: Title] | [Card D: Title] | [Card E: Title] |

**Row 2 — Primary Analysis:**
| [Card F: Title] (wider — 8 columns) | [Card G: Title] (4 columns) |

**Row 3 — Supporting Breakdowns:**
| [Card H: Title] | [Card I: Title] | [Card J: Title] |

**Row 4 — Detail:**
| [Card K: Title] (full width) |

To set card widths: drag the right edge of each card to the target width.
Domo uses a 12-column grid — 8 columns = 2/3 width, 4 columns = 1/3 width.

---

### Step 3: Add Page Filters

Click the filter icon (funnel, top right of page) → Add Filter:

1. **Date Range**
   - Column: `[exact column name]` from dataset `[dataset name]`
   - Filter type: Date range
   - Default: Last 12 months

2. **[Dimension Name]**
   - Column: `[exact column name]` from dataset `[dataset name]`
   - Filter type: Dropdown (multi-select)
   - Default: All

3. **[Dimension Name]**
   - Column: `[exact column name]` from dataset `[dataset name]`
   - Filter type: Dropdown (multi-select)
   - Default: All

---

### Step 4: Configure Cross-Filtering (Domo Interactions)

For each source card below, enable interactions:

1. **"[Source Card Title]"**
   - Click the card → wrench icon → Interaction
   - Enable: ✅ "When this card is clicked, filter other cards"
   - Target cards: [Card A], [Card B], [Card C], [Card D]

2. **"[Source Card Title]"**
   - Click the card → wrench icon → Interaction
   - Enable: ✅ "When this card is clicked, filter other cards"
   - Target cards: [Card A], [Card B], [Card C], [Card D]

[repeat for each source card in the cross-filter map]

---

### Step 5: Verify the Dashboard

Run through these checks:

- [ ] **Layout:** All cards visible without excessive scrolling. KPI row is at the top.
- [ ] **Page filters:** Change the date range — all cards should update.
- [ ] **Page filters:** Select a single [dimension] value — all cards should filter.
- [ ] **Cross-filtering:** Click a bar/segment in "[Source Card]" — target cards should filter.
- [ ] **Cross-filtering:** Click the same bar again to deselect — all cards should reset.
- [ ] **Data:** No cards showing "No data in filtered range" in the default filter state.
- [ ] **Mobile:** Check the page on mobile — cards should stack cleanly.
- [ ] **5-second test:** Show the dashboard to someone for 5 seconds. Can they tell you the overall status?

---

### Card Reference

| Card Title | Card ID | Chart Type | Dataset |
|-----------|---------|------------|---------|
| [Title] | [ID] | [Type] | [Dataset Name] |
[repeat for each card created]
```

**For v2 Pages, add to the guide:**
- Note which cards should be grouped into collections (if the blueprint specifies collections)
- Reference any v2-specific styling options (enhanced headers, card borders, background colors)
- Collections are created in the Domo UI: Edit Dashboard → Add Collection → drag cards into collection

---

#### Output Type: App Studio

When `output_type` is `app_studio`, produce an **App Studio Assembly Guide** instead of the standard UI Setup Guide. Cards were already created and **pre-positioned** via API in Step 7 (using `layout_convert` + `layout_set` on the staging page) — this guide instructs how to import them into an App Studio app. Because cards are already positioned on the staging page, the App Studio import inherits a clean layout.

```markdown
## App Studio Assembly Guide

All cards have been created via API and **pre-positioned** on the staging page: [Page Name] (ID: [page_id]).
Cards are already laid out using the 60-unit grid (`layout_convert` + `layout_set`).
Follow these steps to assemble them into an App Studio app.

---

### Step 1: Create a New App Studio App

1. In Domo, click **+ New** → **App Studio**
2. Choose **Blank App** (start from scratch)
3. Name the app: "[Dashboard Name]"

---

### Step 2: Set Up the Layout

Create the following layout sections:

**Header Section:**
- Add a **Text Block** at the top with the dashboard title: "[Dashboard Name]"
- Font size: 24px, bold
- Add a subtitle text block: "[Dashboard description / audience]"

**KPI Row:**
- Add a **Row** container, full width
- Set to [N] equal columns

**Primary Analysis Row:**
- Add a **Row** container
- Column widths: [8/12, 4/12] (or as specified in blueprint)

**Supporting Analysis Row:**
- Add a **Row** container
- Column widths: [4/12, 4/12, 4/12] (or as specified)

**Detail Row:**
- Add a **Row** container, full width

---

### Step 3: Embed Cards

For each card below, drag it from the card picker into the correct layout position:

| Card Title | Card ID | Target Section | Position | Suggested Size |
|-----------|---------|---------------|----------|---------------|
| [Title] | [ID] | KPI Row | Column 1 | Equal width |
| [Title] | [ID] | KPI Row | Column 2 | Equal width |
| [Title] | [ID] | Primary Analysis | Left (8 cols) | 66% width |
| [Title] | [ID] | Primary Analysis | Right (4 cols) | 33% width |
| [Title] | [ID] | Supporting | Column 1 | Equal width |
[repeat for each card]

**To embed a card:** Click the section → **Add Content** → **Card** → search by card title or ID → select → resize to fit.

---

### Step 4: Add Branding & Text Blocks (Optional)

If the blueprint specifies branding:
1. **Logo:** Add an Image element in the header → upload the client logo
2. **Section headers:** Add Text Blocks above each row section with descriptive titles
3. **Color theme:** In App Settings → Theme, set primary color to [hex from blueprint color system]

---

### Step 5: Configure Filters

1. Click **Add Filter** in the App Studio toolbar
2. Add the following filters:

[Same filter list as v1 guide — Date Range, Dimensions, etc.]

3. **Connect filters to cards:** For each filter, select which embedded cards it should control (typically: all cards from the same dataset)

---

### Step 6: Publish

1. Click **Preview** to verify the layout and filters work correctly
2. Click **Publish** to make the app available
3. Set permissions: share with [audience from blueprint]

---

### Card Reference

| Card Title | Card ID | Chart Type | Dataset | App Section |
|-----------|---------|------------|---------|-------------|
| [Title] | [ID] | [Type] | [Dataset Name] | [Section] |
[repeat for each card created]
```

---

### Step 8.5: App Studio Build (App Studio Only)

**Only for `output_type` = `app_studio`.** Skip for v1_dashboard and v2_page.

**Purpose:** Build the App Studio app directly using REST APIs.

**Skill:** `build-appstudio`

**How it works for App Studio output:**
- In Step 7, cards are created directly on the App Studio view page (NOT a staging page)
- `appstudio_create` is called first to get the `view_page_id`
- `card_create_full` uses `page_id=view_page_id` for all cards
- `appstudio_layout` positions all cards on the view page

For each card spec from the blueprint:
- If `component_type` starts with `rooster:`: created in Step 7a via `rooster_card_create`
- If `component_type` is `kpi`: created in Step 7b via `card_create_full` with `page_id: view_page_id`
- If `component_type` is `procode`: created in Step 7c, embedded via `app_card_create`
- If `component_type` is `form`: build-appstudio invokes **form-builder** (creates form + FORM_MODAL button card)
- If `component_type` is `workflow_button`: build-appstudio creates a workflow widget binding + WORKFLOW_START rooster card

All component types converge at `appstudio_layout` for grid positioning.

**Forms and workflow buttons** are now natively supported through build-appstudio sub-skills. If the blueprint includes data entry forms or workflow trigger buttons, build-appstudio handles them automatically — no ProCode fallback needed.

**Execution:**
1. `appstudio_create(title)` → get `data_app_id` and `view_page_id`
2. Create all cards with `card_create_full(page_id=view_page_id, ...)`
3. `appstudio_layout(view_page_id, positions)` → position cards per blueprint
4. Report the app URL

**No staging page, no import, no browser automation.**

---

### Step 9: Verification

**Purpose:** Confirm all cards were created successfully and are on the target page.

**Tools:** `page_cards`, `card_metadata`

**Execution:**
1. Pull the page's card list with `page_cards(page_id)`
2. Verify each expected card exists on the page
3. Report the final state:

```
## Dashboard Build Complete

**Page:** [Page Name] (ID: [page_id])
**Cards Created:** [N of M successful]
**Cards Kept (from audit):** [N]

| # | Card Title | Card ID | Chart Type | Status |
|---|-----------|---------|------------|--------|
| 1 | [Title] | [ID] | [Type] | ✓ Created |
| 2 | [Title] | [ID] | [Type] | ✓ Created |
| 3 | [Title] | [ID] | [Type] | ✓ Kept (existing) |
| 4 | [Title] | [ID] | [Type] | ✗ Failed — [reason] |

**Next step:** Follow the UI Setup Guide above to arrange cards,
add page filters, and configure cross-filtering in the Domo editor.
```

---

### Step 9.5: PDCA Verification Loop

**Purpose:** After confirming cards exist on the page (Step 9), verify that every created card actually renders correctly with data. Catch and fix rendering failures before handing off to the user.

**Tools:** `card_render_check`, `card_metadata`, `card_delete`, `card_preview`, `card_create_full`, `dataset_query`

**Execution:**

1. **Render check every card:** Call `card_render_check` on every card ID created in Step 7. Record pass/fail for each.

2. **For each card that fails render check, diagnose the root cause:**
   - **Check column names:** Pull the card definition and compare every column reference against the dataset schema. Column names are case-sensitive — `revenue` ≠ `Revenue`.
   - **Check for double aggregation:** If the card uses a beast mode with SUM/AVG/COUNT, verify the card column referencing it does NOT also have an aggregation set. This is the #1 cause of render failures.
   - **Check beast mode validity:** Verify beast mode formulas reference real columns and use valid Domo SQL syntax.
   - **Check filter values:** If the card has filters, verify the filter values actually exist in the data. Run `dataset_query` with the filter combination to confirm rows are returned.
   - **Check date ranges:** If the card has date filters, verify the date range falls within the dataset's actual date boundaries (from Step 1 discovery).

3. **Attempt to fix failed cards (max 2 retries per card):**
   - Delete the broken card with `card_delete`
   - Fix the spec based on the diagnosis
   - Preview the fixed spec with `card_preview` — only proceed if preview succeeds
   - Recreate with `card_create_full`
   - Run `card_render_check` again on the new card
   - If it fails again, retry once more (attempt 2)
   - If it fails after 2 retries, mark as permanently failed

4. **Document results in the final report:**

```
## PDCA Verification Results

| Card Title | Card ID | Render Check | Fix Applied | Retries | Final Status |
|-----------|---------|-------------|-------------|---------|-------------|
| [Title] | [ID] | ✓ Pass | — | 0 | Verified |
| [Title] | [ID] | ✗ Fail → ✓ Pass | Removed double aggregation on Revenue column | 1 | Fixed & Verified |
| [Title] | [ID] | ✗ Fail → ✗ Fail → ✗ Fail | Filter value "CY" doesn't exist; tried "Current Year" — still no data | 2 | FAILED — needs manual fix |
```

**If any cards permanently failed:** Report the exact diagnosis so the user knows what to fix manually, or offer to investigate further.

#### Architectural Validation (App Studio Only)

After building, verify:
- [ ] At least one Rooster component exists (Banner for page header minimum)
- [ ] No `badge_singlevalue` cards used for styled KPIs (use Details or ProCode instead)
- [ ] FilterList components used for user-facing filters (not just card interactions)
- [ ] If zero Rooster components: flag as architectural concern and suggest alternatives

---

## Conditional Logic

| Condition | Steps to Run |
|-----------|-------------|
| **New dashboard** (no existing page or empty page) | 0.5 → 1 → 4 → 5 → 6 → 7 → 7.5 → 7.7* → 8 → 8.5** → 9 → 9.5 |
| **Redesign** (existing dashboard with cards) | 0.5 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 7.5 → 7.7* → 8 → 8.5** → 9 → 9.5 |
| **Blueprint only** (user just wants the design, not the build) | 0.5 → 1 → (2 if redesign) → 4 → 5 → stop |
| **Build from existing blueprint** (blueprint already approved) | 0.5 → 6 → 7 → 7.5 → 7.7* → 8 → 8.5** → 9 → 9.5 |

*Step 7.7 (Layout Visual Check) only runs for `v2_page` and `app_studio` output types.
**Step 8.5 (App Studio Build) only runs for `app_studio` output type.

Detect the mode from context:
- User mentions an existing page/dashboard → **Redesign**
- User says "from scratch" or no existing page → **New build**
- User says "just design it" or "don't build yet" → **Blueprint only**
- A dashboard-architect blueprint already exists in the conversation → **Build from existing blueprint**

---

## Tool Mapping

| Step | Tools / Skills | Notes |
|------|---------------|-------|
| 0.5 — Output Type | User interaction | Ask user: v1 Dashboard, v2 Page, or App Studio |
| 1 — Data Discovery | `dataset_schema`, `dataset_profile`, `dataset_query`, `dataset_list` | Profile all source datasets |
| 2 — Audit | **dashboard-auditor** skill, `page_cards`, `card_bulk_definitions` | Redesign only |
| 3 — Cleanup | `card_delete` | Redesign only; requires user confirmation |
| 4 — Design | **dashboard-architect** skill | Produces the blueprint; receives `output_type` |
| 5 — Checkpoint | User interaction | Hard gate — no card creation without approval |
| 6 — Spec | **card-spec-designer** skill | Turns blueprint into buildable specs; receives `output_type` |
| 7 — Build | **card-builder** skill (composes chart-type-selector, beast-mode-writer) | Creates cards in Domo; page creation branched by `output_type` |
| 7.7 — Visual Check | `reference/dashboard-review-criteria.md`, `qa_domo_page_screenshot`, `layout_set` | v2_page/app_studio only; screenshot PDCA loop |
| 8 — UI/Assembly Guide | Generated from blueprint + card IDs | v1/v2: UI Setup Guide; App Studio: Assembly Guide |
| 8.5 — App Studio Build | **build-appstudio** skill | app_studio only; direct API build (appstudio_create → card_create_full → appstudio_layout) |
| 9 — Verify | `page_cards`, `card_metadata` | Confirm all cards on page |
| 9.5 — PDCA Loop | `card_render_check`, `card_delete`, `card_preview`, `card_create_full`, `dataset_query` | Render-check every card; fix failures |

## MCP Servers Required

- **domo-pages** — card creation, preview, beast modes, page management, card definitions, layout API
- **domo-datasets** — dataset discovery, schema, profiling, queries
- **mcp-qa-testing** — card render verification (Step 9.5), screenshot capture for visual layout checks (Step 7.7), Domo login and browser automation

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"dashboard"`
- `target_description`: a concise phrase describing what is being built (the result of Step 1)

This returns SOW scope items, named datasets, business rules, recent discussions, decisions, assumptions, risks, stakeholders, and prior work — all keyed to your build target, with confidence scores per section.

**Step 3 — Human review of memory hits.** Present the returned context to the user. For each section that has results:
- Show the section title and what was found (a 1-2 line summary per item)
- Show the confidence score
- Ask the user: "Are these relevant to what you're building? Reject anything that's about a different build, an older version, or a different engagement."

If a section returned 0 items, mention it explicitly so the user knows there's no prior context for that area.

**Step 4 — Plan with confirmed context.** Once the user confirms which items are relevant, use ONLY those confirmed items as inputs to your build plan. If the user rejected key context (e.g., no SOW scope was relevant), confirm with them whether to proceed greenfield or pause to gather more requirements.

If `memory_build_context` returns 0 total items, explicitly tell the user: "I found no prior memory context for this build. This will be a greenfield build — please confirm the requirements before I proceed."

### After executing
- Call `memory_store_artifact` for **DomoPage** and **DomoCard** outputs as created; `memory_remember` for **engagement-working** build progress; use `engagement_state_update` when build phase or blockers change materially.

---

## Guardrails

- **Always ask for output type (Step 0.5) before starting.** The output type constrains the architect's design and the build process. Skipping it means building something the user didn't ask for. If the user provides no preference, default to v2 Page.
- **Default to v2 pages.** v1 pages have no programmatic card positioning and leave ghost slots on card deletion. v2 pages solve both problems. Only use v1 for quick throwaway prototypes.
- **On v1 pages, create cards in visual order.** Cards appear in creation order on v1 — there is no reposition API. Always create top-to-bottom, left-to-right.
- **Never delete cards from v1 pages during redesign.** Deletion leaves ghost slots. Create a fresh page and migrate KEEP cards instead.
- **Never skip the checkpoint (Step 5).** Building cards from an unapproved blueprint wastes API calls and creates cards that may need to be deleted. Design errors are 10x cheaper to fix in a blueprint than in built cards.
- **Never delete cards without user confirmation.** Step 3 presents the delete list and waits for approval. Card deletion is irreversible.
- **Profile data before designing.** Don't design cards for columns that don't exist or dimensions with 500 values. Step 1 exists for a reason.
- **The UI Setup Guide is not optional.** Since the API can't set layout, filters, or interactions, the guide IS the deliverable for those steps. Make it specific enough that someone unfamiliar with the dashboard could follow it.
- **Use exact card names and IDs in the UI Guide.** Don't say "the trend chart." Say "Card: Fulfillment Trend (ID: 12345)." The user will be looking at a page with 10+ cards — precision matters.
- **Handle partial failures gracefully.** If 3 of 5 cards build successfully, report what succeeded, what failed, and offer to retry the failures. Don't abandon the entire build.
- **Respect the audit's KEEP decisions.** If the auditor says a card is good, don't rebuild it. Design around it.

---

## Common Failure Patterns

These are the most frequent causes of card creation or rendering failures. When diagnosing a broken card in Step 7 or Step 9.5, check for these first.

### Double Aggregation
**Symptom:** Card renders but shows wildly inflated numbers (e.g., revenue shows 10x the actual value).
**Cause:** A beast mode formula contains `SUM(`Revenue`)` and the card column referencing that beast mode also has `aggregation: "SUM"`. Domo applies SUM on top of the beast mode's SUM, producing SUM(SUM(Revenue)).
**Fix:** When a card column references a beast mode that already contains an aggregation function (SUM, AVG, COUNT, MIN, MAX), set the card column's `aggregation` to `null` or omit it entirely. The beast mode handles the aggregation.

### Wrong Column Names
**Symptom:** Card fails to create or renders with "No data" / errors.
**Cause:** Column names in the card spec don't match the dataset schema exactly. Column names are case-sensitive — `revenue` is not `Revenue`, `Order Date` is not `order_date`.
**Fix:** Always copy column names exactly from the `dataset_schema` output. Never type them from memory or abbreviate them.

### Wrong Filter Values
**Symptom:** Card renders but shows "No data in filtered range" or shows zero rows.
**Cause:** Filter values in the spec don't match actual values in the data. Common examples: using `"CY"` when the data contains `"Current Year"`, using `"Completed"` when the data contains `"Complete"`, using `"Y"` when the data contains `"Yes"`.
**Fix:** Always use the exact values discovered by `SELECT DISTINCT <col> FROM table` in Step 1. Never guess or abbreviate filter values.

### Empty Date Ranges
**Symptom:** Card shows "No data in filtered range" even though the dataset has data.
**Cause:** Date filters specify a range outside the dataset's actual date boundaries. E.g., filtering for "Last 30 days" when the most recent data is from 6 months ago.
**Fix:** Check the MIN/MAX dates from Step 1 data discovery. Ensure all date filters and date-based comparisons fall within the actual data range.

### Pre-Calculated Average (Double-Averaging)
**Symptom:** Avg ticket shows $28 when the real weighted average is $31.
**Cause:** Dataset has a pre-calculated AvgTicket column (row-level). Using `AVG(AvgTicket)` gives equal weight to every row regardless of volume. A store-day with 5 orders and one with 500 orders contribute equally.
**Fix:** Create a beast mode: `` SUM(`NetSales_OST`) / NULLIF(SUM(`OrderCount`), 0) ``. Never `AVG()` a column that's already an average.

### Pivoted Dataset Overcounting
**Symptom:** Customer count shows 5x the actual number.
**Cause:** Dataset is pivoted — each store-day has one row per ServiceType. Columns like CustomerCount that are the same across all pivot rows get counted N times (once per pivot value) when grouped by the pivot dimension.
**Fix:** Either (a) filter to a single pivot value: `` SUM(CASE WHEN `ServiceType` = 'Delivery' THEN `CustomerCount` ELSE 0 END) ``, or (b) use a deduplication beast mode, or (c) note the measure is only valid when NOT grouped by the pivot dimension.

### "No Data in Filtered Range" — Filter Combination Issue
**Symptom:** Individual filters return data, but the combination of multiple filters returns zero rows.
**Cause:** The specific combination of filter values produces an empty result set. E.g., filtering for Region = "West" AND Product = "Widget X" when Widget X is only sold in the East region.
**Fix:** Before using a multi-filter combination in a card spec, test it with `dataset_query`: `SELECT COUNT(*) FROM table WHERE region = 'West' AND product = 'Widget X'`. If it returns 0, the filter combination is invalid — adjust or remove one of the filters.

---

## Related Skills

- **Dashboard Auditor** (Build) — evaluates existing dashboards; produces the audit report for Step 2
- **Dashboard Architect** (Compass Core) — design science principles; produces the blueprint for Step 4
- **Card Spec Designer** (Build) — turns blueprint into buildable card specs for Step 6
- **Card Builder** (Build) — creates cards in Domo for Step 7 (includes chart type selection and beast mode writing)
- **Build App Studio** (Build) — direct API App Studio build for Step 8.5 (appstudio_create + appstudio_layout)
- **Persona Builder** (Build) — audience discovery; feeds into dashboard-architect
