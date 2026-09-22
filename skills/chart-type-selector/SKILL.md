---
name: chart-type-selector
tier: 1
description: "Select the best Domo chart type for a given data shape and visualization goal. Trigger with 'what chart should I use for [data]', 'recommend a chart type for [goal]', 'which visualization fits [metric] by [dimension]', or any request to choose between chart types. Knows all 128 Domo chart types, their required column mappings, and when each is most effective."
maturity: alpha
audience: [delivery]
---

# Chart Type Selector

Recommends the best Domo chart type given a data shape (columns, types, cardinality) and visualization goal. Covers all 128 Domo chart types with real-world usage patterns from 3,015+ production cards.

## Triggers

- "what chart type should I use for [data]?"
- "recommend a visualization for [metric] by [dimension]"
- "which chart shows [comparison/trend/proportion] best?"
- "I have [columns] — what chart works?"
- "should I use a bar chart or line chart for this?"

## Execution Flow

### Step 1: Understand the Data Shape

Identify from the user's request or by profiling the dataset:

| Factor | Question |
|--------|----------|
| **Measures** | How many numeric columns? What do they represent? |
| **Dimensions** | How many categorical columns? What cardinality? |
| **Time** | Is there a date column? What granularity? |
| **Relationships** | Are we comparing, trending, ranking, or showing composition? |
| **Target/Goal** | Is there a target or benchmark to compare against? |

If the dataset ID is available, profile it:
```
dataset_schema(dataset_id)    → column names and types
dataset_profile(dataset_id)   → cardinality, value distributions
```

### Step 2: Classify the Visualization Intent

Map the request to one of these intent categories:

| Intent | Description | Example |
|--------|-------------|---------|
| **Single KPI** | Show one number prominently | "total revenue" |
| **Comparison** | Compare values across categories | "revenue by region" |
| **Trend** | Show change over time | "monthly sales trend" |
| **Composition** | Show parts of a whole | "revenue breakdown by channel" |
| **Distribution** | Show spread of values | "score distribution" |
| **Correlation** | Show relationship between measures | "spend vs revenue" |
| **Ranking** | Order items by value | "top 10 customers" |
| **Progress** | Show actual vs target | "quota attainment" |
| **Geographic** | Show data on a map | "sales by state" |
| **Flow** | Show movement between stages | "lead source to close" |
| **Tabular** | Show detailed rows/columns | "full transaction detail" |
| **Period Comparison** | Compare current vs prior period | "YoY revenue" |

### Step 3: Apply the Decision Tree

#### Single KPI (1 measure, 0-1 dimensions)
- **One number**: `badge_singlevalue` — large formatted number
- **Multiple KPIs**: `badge_multi_value` — 2-4 numbers side by side
- **Number + trend sparkline**: `badge_singlevalue` with ITEM date column

#### Comparison (1+ measures, 1+ categorical dimensions)
- **Few categories (<10), short labels**: `badge_vert_bar`
- **Many categories or long labels**: `badge_horiz_bar`
- **Multiple measures side-by-side**: `badge_vert_multibar` or `badge_horiz_multibar`
- **Nested/overlapping (actual vs target)**: `badge_vert_nestedbar`

#### Trend (1+ measures, 1 date dimension)
- **Single trend line**: `badge_trendline`
- **Two trend lines**: `badge_two_trendline`
- **Multiple series over time**: `badge_multi_trendline`
- **Trend + volume bars**: `badge_line_bar`
- **Area under curve**: `badge_area`
- **Stacked area**: `badge_stacked_area`

#### Composition (1 measure, 1-2 dimensions)
- **Few categories (<7)**: `badge_pie` or `badge_donut`
- **Many categories**: `badge_treemap`
- **Composition over time**: `badge_vert_stackedbar`
- **100% composition**: `badge_vert_100pct` or `badge_horiz_100pct`
- **Hierarchical composition**: `badge_sunburst`
- **Flow between categories**: `badge_sankey`
- **Stage conversion**: `badge_funnel`

#### Ranking
- **Top/bottom N**: `badge_horiz_bar` with orderBy DESCENDING
- **With category breakdown**: `badge_horiz_stackedbar`

#### Progress / Gauge
- **Single measure vs target**: `badge_filledgauge`
- **Multiple measures vs targets**: `badge_bullet` or `badge_vert_bullet`
- **Comparative (current vs previous)**: `badge_comparative_fill`
- **Radial progress**: `badge_radial_gauge`

#### Correlation / Scatter
- **Two measures per point**: `badge_xyscatterplot`
- **Two measures + size**: `badge_xybubble` (bubble chart)
- **Two dimensions + measure (grid)**: `badge_heatmap`

#### Geographic
- **US states**: `badge_map`
- **World countries**: `badge_world_map`
- **Lat/long points**: `badge_latlong_map`
- **Custom regions**: `badge_custom_region_map`

#### Period-over-Period
- **Bar + line with variance**: `badge_pop_bar_line_var`
- **Grouped bars**: `badge_pop_grouped_bar`
- **Stacked bars**: `badge_pop_stacked_bar`

#### Tabular
- **Simple table**: `badge_basic_table`
- **Pivot/cross-tab**: `badge_pivot_table`
- **Interactive table**: `supertable` (Domo app)

#### Filter / Selector
- **Dropdown filter**: `badge_dropdown_selector`
- **Checkbox filter**: `badge_checkbox_selector`
- **Date range filter**: `badge_date_selector`
- **Range slider**: `badge_range_selector`

### Step 4: Recommend with Rationale

Provide:
1. **Primary recommendation** — the best chart type with rationale
2. **Alternative** — a second option if the primary doesn't fit
3. **Required mappings** — what columns map to ITEM, VALUE, SERIES, etc.
4. **Configuration notes** — aggregation, groupBy, orderBy, dateGrain advice

Example output:
```
Recommendation: badge_vert_stackedbar
Rationale: You have a categorical dimension (Region) and want to show
composition by Channel — stacked bars show part-of-whole per category.

Required mappings:
  - Region → ITEM
  - Revenue → VALUE (SUM)
  - Channel → SERIES

Alternative: badge_horiz_stackedbar (if region names are long)

Configuration:
  - groupBy: [Region, Channel]
  - orderBy: Revenue SUM DESCENDING
```

---

## Column Mapping Quick Reference

| Mapping | Purpose | Aggregation | Common Charts |
|---------|---------|-------------|---------------|
| ITEM | Category/x-axis | Never | Bars, lines, pies |
| VALUE | Measure/y-axis | Required | All charts |
| SERIES | Color/group | Never | Stacked, multi-series |
| XTIME | X-axis measure | Required | Scatter, bubble |
| BUBBLESIZE | Size | Required | Bubble only |
| TARGET | Goal value | Required | Gauges, bullet |
| CURRENT | Current value | Required | Filled gauge |
| DATE | Date dimension | Never | Calendar |
| START_DATE / END_DATE | Date range | Never | Gantt |
| CATEGORY1 / CATEGORY2 | Hierarchy levels | Never | Sunburst, sankey |
| ROW / COLUMN | Pivot axes | Never | Pivot table |
| LATITUDE / LONGITUDE | Coordinates | Never | Lat/long maps |

---

## Top Chart Types by Usage (from 3,015 production cards)

| Rank | Chart Type | Count | Use Case |
|------|-----------|-------|----------|
| 1 | badge_vert_stackedbar | 303 | Composition across categories |
| 2 | badge_singlevalue | 226 | Single KPI number |
| 3 | badge_horiz_stackedbar | 136 | Horizontal stacked comparison |
| 4 | badge_trendline | 118 | Trend over time |
| 5 | badge_multi_trendline | 115 | Multiple trend lines |
| 6 | badge_basic_table | 114 | Data tables |
| 7 | badge_vert_bar | 86 | Category comparison |
| 8 | badge_multi_value | 82 | Multiple KPIs |
| 9 | badge_vert_multibar | 69 | Side-by-side measures |
| 10 | badge_vert_nestedbar | 60 | Actual vs target bars |

---

## Guardrails

- **Match chart to intent.** Don't use pie charts for trends or trendlines for categorical data.
- **Respect cardinality.** Pie charts work poorly with >7 slices. Use treemap or bar instead.
- **Date columns need dateGrain.** If ITEM is a date, recommend setting dateGrain (MONTH, QUARTER, etc.).
- **Don't over-complicate.** A simple bar chart is often better than an exotic chart type nobody understands.
- **Consider the audience.** Executives prefer single values and gauges. Analysts prefer tables and scatter plots.
- **Always suggest alternatives.** No chart type is universally correct — give the user options.

---

## Tool Mapping

| Step | Tools |
|------|-------|
| Profile dataset | `dataset_schema`, `dataset_profile` |
| Preview chart | `card_preview` |

## MCP Servers Required

- **domo-datasets** — for dataset schema and profiling

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: chart type selected, data shape analysis, why this type fits the use case, alternatives considered.

## Related Skills

- **Card Builder** (Build) — uses chart type selection to build cards
- **Card Spec Designer** (Build) — references chart types when designing specs
- **Beast Mode Writer** (Build) — creates calculated fields that charts consume
