---
name: card-spec-designer
tier: 1
description: "Design card/visualization specifications from customer context and dataset analysis. Trigger with 'design card specs', 'what cards do we need for [customer]', 'spec out the dashboard cards', or any request to plan visualizations. Profiles datasets, understands the data shape, then produces structured card specs that feed directly into the Card Builder."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by the upgraded `card-kpi` T1 (armos-internal-overrides plugin) which composes card-builder + card-beastmode + card-conditional-format T0s. Do not promote new skills based on this file."
audience: [orchestration, delivery]
---

# Card Spec Designer

Produces structured, buildable card specifications by analyzing dataset schemas, profiling data, and mapping business questions to appropriate chart types. The output is a set of card specs that can be handed directly to **card-builder** as input.

## Shared Knowledge

Before designing card specs, read these shared references:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `../card-builder/reference/chart-types.md` | 128 chart types with column mappings | Step 4 (mapping questions to charts) |
| `../card-builder/reference/card-patterns.md` | Real-world card JSON examples | Step 5 (producing specs) |
| `../card-builder/reference/beast-mode-reference.md` | Beast mode syntax and functions | Step 5 (when specs need calculated fields) |
| `../dashboard-builder/reference/dashboard-principles.md` | Design rules — KPI rows, pie limits, pre-calculated averages | Step 4 (ensuring specs follow principles) |
| `../dashboard-builder/reference/lessons-learned.md` | Common gotchas — double aggregation, wrong columns, filter issues | Before producing any spec |

## Triggers

- "design card specs for [customer/dataset]"
- "what cards should we build for [dashboard name]?"
- "spec out the visualizations for [dataset]"
- "plan the dashboard cards"
- "what charts would best show [metric/question]?"
- "review the data and recommend cards"

## Tools Required

| Tool | MCP Server | Required For |
|------|-----------|-------------|
| `dataset_list` | domo-datasets | Step 1: Find datasets |
| `dataset_get` | domo-datasets | Step 1: Dataset metadata |
| `dataset_schema` | domo-datasets | Step 1: Column names and types |
| `dataset_profile` | domo-datasets | Step 1: Data shape and cardinality |
| `dataset_query` | domo-datasets | Step 4.6: Detect shared measures |
| `page_list` | domo-pages | Step 3: Check existing pages |
| `page_cards` | domo-pages | Step 3: Check existing cards |
| `card_metadata` | domo-pages | Step 3: Inspect card details |

**Pre-flight:** Before starting, verify these tools are available. If any tool returns "unknown tool" or is not in the allowed tools list, STOP and report which tools are missing.

## If Tools Are Unavailable

If any required tool is not available (returns "unknown tool" error or is missing from allowed tools):

1. **Check credentials**: The customer's Domo instance may not be configured. Ask the user to verify their Domo connection.
2. **Continuation mode**: If you're in a continuation turn, read-only tools (dataset_list, dataset_query, search) are stripped. Use data from the checkpoint context instead of re-querying.
3. **Report the gap**: Tell the user which specific tool is unavailable and why the workflow can't proceed without it.
4. **Never guess**: Do not attempt to call tools that aren't available. Do not try alternative endpoints or raw API calls.

## When to Use This vs. Card Builder

| Situation | Use |
|-----------|-----|
| You know exactly what charts to build (chart type, columns, mappings) | Card Builder directly |
| Customer said "we need a dashboard for X" with no specifics | **Card Spec Designer** first |
| You have a dataset but aren't sure what visualizations make sense | **Card Spec Designer** first |
| You have card specs and want to create the cards | Card Builder directly |

---

## Execution Flow

### Step 1: Identify Target Datasets

Determine which datasets will power the cards:

1. **If specified by user** — use the provided dataset ID(s)
2. **If customer context available** — mine transcripts, emails, and docs for data requirements
3. **If exploring** — use `dataset_list` to find relevant datasets

For each dataset, gather:
```
dataset_get(dataset_id)       → metadata, row count
dataset_schema(dataset_id)    → column names and types
dataset_profile(dataset_id)   → data shape, cardinality, value distributions
```

### Step 2: Classify Columns

For each column in the dataset, classify:

| Column Type | Characteristics | Card Role |
|------------|-----------------|-----------|
| **numeric** | LONG, DOUBLE, DECIMAL | Measure (VALUE) — use with aggregation |
| **categorical** | STRING with ≤100 distinct values | Dimension (ITEM/SERIES) — for grouping |
| **freetext** | STRING with >1000 distinct values | Not suitable for grouping — table or filter only |
| **date** | DATE, DATETIME | Time dimension (ITEM with calendar:true) |
| **identifier** | Contains "id", "key", "code" | Join key or filter — rarely visualize directly |

Apply semantic hints from column names:
- "date", "time", "created" → temporal
- "region", "country", "state" → geographic
- "amount", "price", "revenue", "sales" → currency/financial
- "count", "quantity", "num" → quantity
- "category", "type", "status" → category

### Step 3: Gather Business Context

Mine available customer context:

1. **Meeting transcripts** — what questions were stakeholders asking?
2. **Dev spec / requirements** — what cards or dashboards are scoped?
3. **Existing cards** — use `page_cards` to see what already exists (avoid duplicates)
4. **User conversation** — what did the user ask for?

If context is limited, ask targeted questions:
- "This dataset has Revenue, Cost, and Region columns. Are you looking at profitability by region, or overall trends over time?"
- "I see date ranges from Jan 2023 to present. Should cards focus on recent performance (90 days) or year-over-year comparisons?"
- "There are 15 product categories — should we group some together or show all individually?"

### Step 4: Map Questions to Chart Types

For each business question, select the best chart type using this decision matrix:

| Data Shape | Recommended Chart | chartType |
|-----------|-------------------|-----------|
| Single KPI metric | Single Value | badge_singlevalue |
| Metric over time | Trendline | badge_trendline |
| Metric by category (≤8 groups) | Pie or Vertical Bar | badge_pie, badge_vert_bar |
| Metric by category (>8 groups) | Horizontal Bar or Treemap | badge_horiz_bar, badge_treemap |
| Metric by category with sub-groups | Stacked Bar | badge_vert_stackedbar |
| Metric over time by groups | Multi-series Trendline | badge_trendline (with SERIES) |
| Stage progression | Funnel | badge_funnel |
| Two-metric correlation | XY Scatter | badge_xyscatterplot |
| Two dimensions, one metric | Heatmap | badge_heatmap |
| Detailed data view | Table | badge_table |

### Step 4.5: Component Type Selection (App Studio Only)

If designing for `output_type: app_studio`, determine the component type for each card:

| Business Need | Component Type | Why |
|---|---|---|
| Page header with branding | `rooster:banner` | Native header with image + text + action |
| User-controlled filters | `rooster:filterlist` | Interactive filter with search + pagination |
| Full record detail view | `rooster:details` | Two-panel layout: hero left, fields right |
| Product/person card grid | `rooster:gallery` | Repeating cards with image + metadata |
| Status list with icons | `rooster:list` | Rows with avatar, tags, action buttons |
| Any chart, graph, or table | `kpi` | Standard Domo visualization |
| Custom UI beyond native | `procode` | Full HTML/CSS/JS |

**Default:** If unsure, use `kpi`. But for App Studio, at least the page header SHOULD be `rooster:banner`.

### Step 4.6: Detect Pre-Calculated and Shared Measures

Before speccing cards, classify each measure column:

| Column Pattern | Risk | Rule |
|---------------|------|------|
| Name contains "avg", "average", "rate", "pct", "percent", "ratio" | Pre-calculated average | NEVER use `AVG()` aggregation. Create a beast mode from raw components (e.g., `SUM(numerator) / NULLIF(SUM(denominator), 0)`). |
| Same value across all rows for a given entity-date (check with `dataset_query`) | Shared/duplicated in pivot | Do NOT `SUM` when grouping by the pivot dimension. Use `MAX`, or filter to one pivot value. |
| Normal additive measure | None | `SUM` as usual |

**To detect shared measures in a pivoted dataset**, run:

```sql
SELECT StoreID, `Day of Business`, MIN(CustomerCount), MAX(CustomerCount)
FROM table
WHERE `Year Flag` = 'Current Year'
GROUP BY StoreID, `Day of Business`
HAVING MIN(CustomerCount) != MAX(CustomerCount)
LIMIT 5
```

If this returns 0 rows, CustomerCount is shared across pivot rows and must NOT be summed when grouped by the pivot dimension. Use `MAX` per entity-date or filter to a single pivot value instead.

### Step 4.7: Dashboard Layout Design

**A dashboard tells a story.** The layout must follow the information hierarchy from `../dashboard-builder/reference/dashboard-principles.md`:

1. **Row 1 — Hero KPIs**: "How are we doing?" — 3-5 summary numbers with comparison context, spanning the full width equally
2. **Row 2 — Primary Analysis**: "Why?" — the main trend chart or breakdown that explains the KPIs. Typically 2/3 width for the primary chart + 1/3 for a supporting breakdown.
3. **Row 3 — Supporting Analysis**: Additional breakdowns, compositions, or comparisons. Equal-width columns (halves or thirds).
4. **Row 4 — Detail**: Tables or drill-down views. Full width for readability.

For each card spec, include its **section assignment** and **relative size**:
- `section` — which row/section it belongs to (e.g., "Hero KPIs", "Primary Analysis", "Detail")
- `width` — relative width within its row (e.g., "equal", "2/3", "1/3", "full")

The dashboard-builder translates these into Domo's layout API coordinates. Cards are always v1 API objects regardless of output type. For App Studio, cards are positioned on a staging page then imported.

### Step 5: Produce Card Specs

Output a structured spec for **each** card. Use this format:

```markdown
# Card Spec: [Card Title]

## Business Question
[What question does this card answer?]

## Chart Configuration
- **Chart Type:** badge_vert_bar
- **Component Type:** `kpi` | `rooster:banner` | `rooster:filterlist` | `rooster:details` | `rooster:gallery` | `rooster:list` | `procode`
- **Template Key:** _(Rooster only)_ e.g., `gallery-image-button`, `list-title-description`, `banner-image-left`, `filter-list-image`, `details-image-left`
- **DML Reference:** _(Rooster only)_ See `build-appstudio/reference/rooster-dml-templates.md`
- **Dataset:** [name] (ID: [uuid])

## Column Mappings
| Column | Mapping | Aggregation | Notes |
|--------|---------|-------------|-------|
| Region | ITEM | - | x-axis categories |
| Revenue | VALUE | SUM | bar heights |

## GroupBy
- Region

## Filters
| Column | Operand | Values |
|--------|---------|--------|
| Status | EQUALS | Active |

## OrderBy
| Column | Aggregation | Order |
|--------|-------------|-------|
| Revenue | SUM | DESCENDING |

## Date Grain (if applicable)
- Column: Date
- Element: MONTH

## Beast Modes Needed
- [name]: [formula] — [purpose]

## Notes
- [Any context about why this visualization was chosen]
- [Assumptions made]
```

### Step 6: Organize by Dashboard Story

Group card specs into sections that tell a top-down story. The viewer should be able to scan the dashboard in 5 seconds and know the overall status, then drill deeper.

```markdown
## Dashboard Layout — Story Flow

### Row 1: "How are we doing?" (Hero KPIs — full width, equal columns)
- Card 1.1: Total Revenue (badge_singlevalue) — with vs. prior period
- Card 1.2: Total Orders (badge_singlevalue) — with vs. target
- Card 1.3: Avg Order Value (badge_singlevalue) — with trend sparkline
Width: equal across row | Height: compact

### Row 2: "What's the trend?" (Primary Analysis — 2/3 + 1/3 split)
- Card 2.1: Revenue Over Time (badge_trendline) — 2/3 width, the main story
- Card 2.2: Revenue by Channel (badge_vert_stackedbar) — 1/3 width, composition context

### Row 3: "Where are the patterns?" (Supporting Breakdowns — equal thirds)
- Card 3.1: Revenue by Region (badge_vert_bar) — top categories
- Card 3.2: Top Products (badge_horiz_bar) — ranked descending
- Card 3.3: Customer Segments (badge_pie) — only if ≤3 segments

### Row 4: "Show me the data" (Detail — full width)
- Card 4.1: Transaction Detail (badge_table) — sortable, filterable
```

**Each section answers a question.** If a card doesn't answer a clear question that fits the story flow, reconsider whether it belongs.

### Step 7: Confirm and Hand Off

Present all specs to the user. Ask:
- "Ready to build these? I can create each card in Domo."
- If the user wants changes, iterate on specific specs.
- On confirmation, the specs feed into the Card Builder.

---

## Tool Mapping

| Step | Tools |
|------|-------|
| Identify datasets | `dataset_list`, `dataset_get` |
| Profile data | `dataset_schema`, `dataset_profile`, `dataset_query` |
| Check existing cards | `page_list`, `page_cards`, `card_metadata` |
| Analyze card patterns | `card_definition`, `card_bulk_definitions` |

## MCP Servers Required

- **domo-datasets** — for dataset discovery and profiling
- **domo-pages** — for checking existing pages/cards

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"card"`
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
- Call `memory_store_artifact` for **CardSpecs**; `memory_remember` with layout story, beast mode risks, and filter value gotchas.

---

## Guardrails

- **Profile before speccing.** Don't guess at column types — check the actual data.
- **Right chart for the data.** Don't use pie charts with 50 categories. Don't use trendlines for non-date dimensions.
- **Check for duplicates.** Search existing pages/cards before speccing new ones.
- **One card per question.** Each card should answer a single, clear business question.
- **Limit cardinality.** If a dimension has 100+ values, recommend filtering or grouping.
- **Consider the audience.** Executive dashboards need KPIs and trends. Analyst dashboards need detail tables and drill-downs.
- **Note assumptions.** If you're guessing about business logic, say so.

---

## Related Skills

- **Card Builder** (Build) — takes card specs and creates the actual cards in Domo (includes chart type selection and beast mode writing)
- **Dashboard Builder** (Build) — orchestrates end-to-end dashboard workflows (parent orchestrator)
- **ETL Spec Designer** (Build) — for designing data pipelines that feed the cards
- **ETL Builder** (Build) — for building the ETLs that produce the card source datasets
