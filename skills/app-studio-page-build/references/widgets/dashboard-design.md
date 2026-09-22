# Dashboard Design Reference

Design principles and structural patterns for App Studio pages. Sourced from `appstudio-dashboard-design`.

## Core design principles

- **Hierarchy first** — place the most important metric or summary at the top. Users scan top-left to bottom-right. Do not bury KPIs below the fold.
- **Components match the use case** — Gallery for visual catalogs, List for work queues, FilterList for sidebar find-and-act, Details for single-record views. Mismatched components create friction.
- **Filter controls above data** — place filter bars, date pickers, and variable controls above the card rows they affect. Users set context before they read results.
- **Consistent card height** — cards in the same row should share height. Mixed heights (40 units vs 20 units) make pages look unfinished.
- **Size large** — AppStudio components almost never look right when undersized. Default to larger grid allocations and reduce if content is sparse.

## Layout patterns

### KPI summary + list

```
[KPI1][KPI2][KPI3]   height: 15, width: 20 each
[List/Banner]        height: 40, width: 60
```

### Split panel (master-detail on one page)

```
[FilterList (w:20, h:55)] | [Details (w:40, h:55)]
```

### Tab-organized views

```
[HEADER "Overview"]
[TABS (height: 60)]
  Tab 1: Summary KPIs
  Tab 2: Drill data
  Tab 3: Settings
```

### Multi-section page

```
[HEADER "Revenue"]        height: 5
[KPI row]                 height: 15
[HEADER "Orders"]         height: 5
[List component]          height: 35
```

## Component selection quick guide

| Signal | Component |
|---|---|
| "Show me everything about one record" | Details |
| "Show all records — text-focused, task-like" | List |
| "Show all records — image-first, browseable" | Gallery |
| "Show records in a sidebar column with filter" | FilterList |
| "Show image-row + key fields + action" | Banner |
| "Organize cards into groups" | Tab |
| "Add a section label" | Header |
| "Show a static logo or diagram" | Image |

## App creation flow (all components)

All AppStudio apps follow the same 4-step app setup before any card steps:

1. `POST /api/content/v1/dataapps` — full body (owners, enabled, showNavigation, theme)
2. `PUT .../persistSettings`
3. `PUT .../dataapps/{id}` — forward views/owners/theme from step 1 response
4. `PUT .../navigation/reorder` — all 6 items (HOME, VIEW, AI_ASSISTANT, CONTROLS, DISTRIBUTE, MORE) required

Then per-card steps (card create, rooster/query, card update), then layout (writelock, PUT layout, DELETE writelock).

## Grid reference

| Layout | Width | Card height range | Full-width | Half-width |
|---|---|---|---|---|
| Standard | 60 units | 10–60 | x:0, w:60 | x:0/30, w:30 |
| Compact | 12 units | 4–20 | x:0, w:12 | x:0/6, w:6 |
| Header (standard) | 60 | 5 | x:0, w:60, h:5 | — |
| Header (compact) | 12 | 2 | x:0, w:12, h:2 | — |

## Anti-patterns to avoid

- **Mixing component types without visual hierarchy** — Gallery + List + FilterList on one page without header separators looks chaotic.
- **Undersized rooster cards** — a Gallery at height 10 clips cards. Minimum gallery height: 30–40.
- **`editInAppViewer: true` in production** — adds an Edit button visible to end users. Always set to `false`.
- **Missing `PUT dataapps/{id}` after create** — app opens in a corrupted state. Required step.
- **Missing `navigation/reorder`** — app navigation is broken. Required step with all 6 items.

---

## Chart-type governance

App Studio pages embed Domo cards. When those embedded cards are chart-based, apply the governance rules in this section. The component-selector above answers "which rooster component?" — this section answers "which chart type and why?".

### Pre-render validation (mandatory gate)

Run every check before creating any card. Do not proceed until all pass.

**Data integrity checks:**
- If `sum(Profit) > sum(Revenue)`, stop. Emit a `DATA_ANOMALY` warning; skip the derived ratio card; note the issue in the response. Never render a 503% margin gauge.
- Any percentage metric outside [0%, 150%] is suspicious — flag before rendering.
- Derived KPIs (margin %, conversion rate, attainment %) must have a defined `plausible_range`; warn if the computed value falls outside it.
- If a chart's primary dimension returns 0 rows after aggregation, skip the card entirely.
- If a `groupBy` dimension has only 1 distinct value, a grouped/series chart is meaningless — use `badge_singlevalue` instead.
- If one dimension member is more than 10x the next, flag it for log-scale consideration before rendering.

### Cardinality gates table

Before selecting a chart type, count distinct values of the SERIES/ITEM dimension:

| Chart Type | Minimum | Maximum | Below minimum → use instead |
|---|---|---|---|
| `badge_xybubble` | 8 data points | 50 | `badge_horiz_stackedbar` |
| `badge_heatmap` | 3 distinct values on BOTH axes (min 3×3 = 9 cells) | — | `badge_horiz_stackedbar` |
| `badge_donut` / `badge_pie` | 2 slices | 6 | `badge_horiz_stackedbar` if > 6 |
| `badge_vert_stackedbar` | 2 series | 6 | — |
| `badge_two_trendline` | 2 series | 8 | `badge_singlevalue` if only 1 series |

Never generate a chart type where the dimension doesn't have enough members to make spatial spread meaningful. An xybubble with 3 dots is not a visualization.

### Two-pass chart selection logic

**Pass 1 — Shape match:** Do the available columns satisfy the required column mappings for this chart type?

**Pass 2 — Communication check:** Even if the shape matches, verify:
- Does the dimension have sufficient cardinality? (see cardinality gates table above)
- Will the chart be legible at the assigned card dimensions?
- Does this chart answer a clearer question than the simpler alternative?

**Default-to-simpler rule:** When in doubt between two chart types, always choose the simpler one. Bubble over bar requires explicit justification. Bar over bubble is always safe.

### Chart-type decision framework

| Question Type | Best Chart | Acceptable | Avoid |
|---|---|---|---|
| How is one metric performing right now? | `badge_singlevalue` | `badge_filledgauge` | Any multi-series chart |
| How has a metric changed over time? | `badge_two_trendline` | `badge_line_stackedbar` | `badge_pie`, `badge_donut` |
| How do categories compare on one metric? | `badge_horiz_stackedbar` | `badge_vert_multibar` | `badge_pie` (if > 5 slices) |
| What is the part-to-whole composition? | `badge_donut` | `badge_pie` | `badge_vert_stackedbar` (composition only) |
| How does composition change over time? | `badge_vert_stackedbar` | `badge_line_stackedbar` | `badge_pie` |
| How do categories rank? | `badge_horiz_stackedbar` | `badge_vert_multibar` | `badge_heatmap` |
| Where is performance geographically? | `badge_map` (US) or `badge_world_map` | none | `badge_pie` |
| Is a metric within a target range? | `badge_filledgauge` | `badge_singlevalue` with context | Any trend chart |
| How do two metrics relate across items? | `badge_xybubble` | none | `badge_heatmap` |
| Where are hotspots across 2 dimensions? | `badge_heatmap` | none | `badge_vert_stackedbar` |
| How are two trends related? | `badge_two_trendline` | `badge_line_stackedbar` | Two separate singlevalues |
| Metric vs. target + trend combined? | `badge_line_stackedbar` | `badge_two_trendline` | `badge_pie` |

### Per-chart-type usage notes

**`badge_singlevalue`**
- The most powerful chart type for executive audiences.
- Use for total Sales, total Profit, order count, margin %.
- Always set a comparison value (prior period or target) — a number without context is not a KPI.
- Maximum 4 per dashboard. If you have 6 KPI singles in a row, you have 2–3 too many.
- Column mapping: `VALUE` only. Aggregate function applied server-side.

**`badge_two_trendline`**
- The workhorse for trend analysis. Use for Sales vs. Profit over time.
- Both lines should share a meaningful relationship — not just two random metrics.
- Requires: `ITEM` = `CalendarQuarter` (with `calendar: true`), `dateGrain` = `Order Date`, two `VALUE` columns.
- Minimum 2 series; `badge_singlevalue` if only 1 series.

**`badge_vert_stackedbar`**
- Best when you want to show total AND composition simultaneously.
- Use for Sales by Region over time, or Orders by Segment over quarters.
- Requires: `ITEM` = `CalendarQuarter` (with `calendar: true`), `VALUE` = measure, `SERIES` = category dimension.
- Avoid when part-to-whole story does not matter — a grouped bar is clearer for pure comparison.

**`badge_vert_multibar`**
- Use for direct side-by-side comparison of categories across time or another dimension.
- Best for comparing 2–4 groups. More than 5 groups becomes cluttered — use horizontal instead.

**`badge_horiz_stackedbar`**
- Best for ranked comparisons of many categories (6+ items) where label readability matters.
- Use for "Sales by State" or "Profit by Product Sub-Category" — long names read better horizontally.
- Column mapping: `ITEM` = category dimension, `VALUE` = measure.

**`badge_donut`**
- Use only for part-to-whole with 3–6 slices. The center value is a key feature — always populate it.
- Works well for Customer Segment mix, Region share.
- Column mapping: `ITEM` = category, `VALUE` = measure. No `SERIES`.

**`badge_pie`**
- Acceptable for 2–4 slices only. With 5+ slices, use a bar chart.
- Never use when the viewer needs to compare specific values — bars are always more accurate.
- Column mapping: same as `badge_donut`; prefer donut over pie.

**`badge_heatmap`**
- Excellent for showing performance density across two categorical dimensions.
- Use for "Sales by Region × Category" or "Profit by Segment × Ship Mode".
- Both axes must have ≥ 3 distinct values — a 2×2 heatmap is just a table.
- Column mapping: `ITEM` = x-axis category, `VALUE` = measure, `SERIES` = y-axis category.

**`badge_line_stackedbar`**
- Combo chart — bars show volume, line shows a rate/ratio overlay.
- Classic use: bars = Sales by quarter, line = Profit Margin %.
- Both story threads must be meaningful to the same viewer.

**`badge_filledgauge`**
- Use only when there is a defined target or maximum that gives the fill meaning.
- Avoid with open-ended metrics like total revenue — the "full" state has no meaning.
- Good for: on-time delivery rate %, margin vs. target %, quota attainment.
- Do not mix into a `badge_singlevalue` headline row — they have different visual languages and break row height parity.

**`badge_xybubble`**
- Use for relationship/correlation analysis between two numeric dimensions.
- Bubble size (VALUE) adds a third dimension — use it for order quantity or revenue scale.
- Requires ≥ 8 distinct data points; below that use `badge_horiz_stackedbar`.
- Column mapping: `XTIME` = x-axis numeric, `VALUE` = y-axis numeric, `SERIES` = grouping dimension.

**`badge_map` / `badge_world_map`**
- `badge_map` for US state-level data (`State` column).
- `badge_world_map` for country-level data (`Country` column).
- These are anchor cards — give them width ≥ 20 and height ≥ 15.
- Column mapping: `ITEM` = geographic dimension (full state or country name), `VALUE` = measure.

**`badge_textbox`**
- Use as a dashboard title/header or section divider only.
- Maximum 1 per dashboard page. Never use for prose explanations.

### Column mapping quick reference

| Chart Type | Required Columns | Notes |
|---|---|---|
| `badge_singlevalue` | `VALUE` | Aggregate applied server-side |
| `badge_two_trendline` | `ITEM`, `VALUE` (×2) | ITEM = CalendarQuarter, calendar: true |
| `badge_vert_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = CalendarQuarter for time axis |
| `badge_vert_multibar` | `ITEM`, `VALUE`, `SERIES` | ITEM = category or time |
| `badge_horiz_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = category (long names OK) |
| `badge_donut` | `ITEM`, `VALUE` | No SERIES; ITEM drives slices |
| `badge_pie` | `ITEM`, `VALUE` | Same as donut; prefer donut |
| `badge_heatmap` | `ITEM`, `VALUE`, `SERIES` | ITEM = x-axis, SERIES = y-axis |
| `badge_line_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = time grain |
| `badge_filledgauge` | `VALUE` | Needs target context in title/desc |
| `badge_xybubble` | `XTIME`, `VALUE`, `SERIES` | XTIME = x numeric, VALUE = y numeric |
| `badge_map` | `ITEM`, `VALUE` | ITEM = full state name |
| `badge_world_map` | `ITEM`, `VALUE` | ITEM = country name |
| `badge_textbox` | none | Static text content only |

---

## Color, labeling, and storytelling

### Color strategy

**Semantic color — always use color to mean something:**

| Color Role | Use For | Hex |
|---|---|---|
| Positive / Good | Above target, profit, growth | `#34A853` (green) |
| Negative / Bad | Below target, loss, decline | `#EA4335` (red) |
| Neutral / Informational | Volume, count, no valence | `#1A73E8` (blue) |
| Comparison Series | Second line or group | `#F4A300` (orange) |

**Global color token system — declare once, reuse everywhere:**

| Token | Hex | Use For |
|---|---|---|
| `color-1` | `#1A73E8` | First series (Consumer, East, First Class…) |
| `color-2` | `#F4A300` | Second series (Corporate, West, Second Class…) |
| `color-3` | `#34A853` | Third series (Home Office, Central, Standard…) |
| `color-4` | `#EA4335` | Fourth series (Small Business, South, Same Day…) |
| `color-5` | `#9334E6` | Fifth series |
| `color-6` | `#00ACC1` | Sixth series |

Map every dimension value to a color token before generating the first card. If "West" is `color-1` on the stacked bar, it must be `color-1` on the heatmap and every other chart on the same page. Never let individual charts choose their own palettes independently.

**Palette type rules:**
- **Categorical palette** (6-token system): for all nominal dimensions — Customer Segment, Region, Ship Mode, Category.
- **Sequential palette** (single-hue, light→dark): for continuous measures on choropleth maps and heatmaps only.
- **Diverging palette** (two-hue with midpoint): only when a meaningful zero exists — e.g. Profit variance (positive/negative). Never on standard bar charts.
- **Maximum 5 distinct series colors per chart.** If a dimension has 6+ values, combine the long tail into "Other".

**Accessibility:** Never rely on color alone. Pair red/green signals with directional labels (+/– prefix or up/down arrow). Red/green colorblindness affects ~8% of male viewers.

### Naming and labeling rules

**Card titles:**
- Every card must have a title — untitled cards are not acceptable.
- Format: **Noun + Metric** or **Question Form**.
  - Good: `"Total Revenue"`, `"Sales by Region"`, `"Profit Trend by Quarter"`
  - Avoid: `"Chart 1"`, `"Stacked Bar"`, `"Revenue 2"`, `"Updated Title"`
- Length: 2–6 words. Anything longer is a description, not a title.

**Descriptions:** Use the card description for context the title cannot carry — metric definition, period scope, known caveats. Do not repeat the title verbatim.

**Terminology consistency:**
- Pick one term per concept and use it everywhere: "Revenue" or "Sales" — not both.
- Use title case for all dimension values (East, not east or EAST).
- Date grains: always write as "Q1 2013", never "2013-Q1" or "Q1/13".

**Axis label limits:**
- Maximum 12 labels on categorical axes; 16 on time-based axes.
- Above these limits, reduce grain (quarters → years) or limit to top-N dimension members.
- For time-axis charts with more than 8 periods, verify labels will not overlap at the assigned card width.

**Date grain syntax:**
- For trend charts, always set `ITEM` to `"CalendarQuarter"` with `"calendar": true` and reference `dateGrain: "Order Date"`.
- Never set `ITEM` directly to `"Order Date"` — this produces row-level dates, not aggregated periods.

### Information hierarchy and storytelling

**Vertical layout zones (60-unit grid, standard heights):**

```
ROW 0–1  (y: 0–14)   HEADLINE ZONE       — KPI cards, scorecards, state of the business
ROW 2–3  (y: 14–28)  TREND ZONE          — time series, combo charts, directional movement
ROW 4–5  (y: 28–42)  BREAKDOWN ZONE      — composition, comparison, distribution by dimension
ROW 6+   (y: 42+)    DETAIL/CONTEXT ZONE — maps, scatter, heatmaps, supporting tables
```

- Never put a detail chart in the headline zone. A heatmap or scatter does not belong at y=0.
- `badge_singlevalue` belongs in the headline zone — it loses impact buried at y=40.
- Maps and bubble charts anchor the bottom of a dashboard, not the top.

**Standard card widths:** 15 (4 across), 20 (3 across), 30 (half-width), 60 (full-width).
**Standard row heights:** 12 (compact KPI), 15 (standard chart), 18 (complex visual — heatmap, bubble, map).

**Progressive disclosure — reading order:**

1. **What is the number?** (KPI single — `badge_singlevalue`)
2. **Is it getting better or worse?** (trend line — `badge_two_trendline`)
3. **Who or what is driving it?** (breakdown — bar, stacked bar, donut)
4. **Where is it happening?** (map — `badge_map` / `badge_world_map`)
5. **Are there anomalies?** (heatmap, scatter/bubble)

**Headline zone rules:**
- All cards in the headline row must use the same card type — `badge_singlevalue` only.
- All cards in the same row must share the same `height` value.
- Headline KPIs are the smallest cards (h:10–12). Trend zone cards are taller (h:15–18). Detail zone tallest (h:18+).

**Card count budget:**
- Executive dashboard: 4–8 cards total. Fewer is almost always better.
- Analyst dashboard: 8–14 cards. Never exceed 16.
- More than 12 cards on a single page signals a design problem, not thoroughness.

### Audience design

**Executive audience:**
- Primary question: "Are we on track?" → KPI singles with comparison values.
- Time horizon: current period vs. prior period — not 4 years of raw history.
- Trend charts at quarterly or monthly granularity — daily is noise.
- Color gives an immediate red/green signal.
- Maximum 6 cards. No scatter plots or heatmaps on the primary page.

**Analyst audience:**
- Primary question: "Where is the problem and what drives it?"
- Include breakdowns by multiple dimensions (segment, region, category).
- Heatmaps, bubble charts, and geographic maps are appropriate.
- Trend charts can show monthly or weekly data.
- 8–14 cards acceptable, but each must earn its position.

**Mixed audience (most common):**
- Design for the executive first (headline zone), analyst second (detail zone).
- The executive reads rows 0–1 and leaves satisfied. The analyst continues to rows 2+.

### Anti-patterns (chart-level)

- **Pie chart abuse** — never `badge_pie` for > 4 categories; never for time-series data.
- **Sparse charts** — never `badge_xybubble` with < 8 points; never `badge_heatmap` with < 3×3 cells.
- **Gauge in the headline row** — do not mix `badge_filledgauge` into a `badge_singlevalue` headline row.
- **Color palette per chart** — each chart independently choosing its palette breaks cross-chart comparison.
- **Axis crush** — more than 12 categorical / 16 time-based labels without reducing grain.
- **Inconsistent scales** — two bar charts side-by-side with different y-axis scales that are not labeled.
- **Too many KPIs** — four `badge_singlevalue` cards is the maximum before they lose impact.
- **Wrong chart for the question** — `badge_heatmap` for single-dimension ranking (use bar); `badge_xybubble` for time-series (use trendline); `badge_filledgauge` without a meaningful maximum.
- **Chart junk** — cards that show the same data in two different chart types "for variety"; `badge_textbox` used for prose explanations.
