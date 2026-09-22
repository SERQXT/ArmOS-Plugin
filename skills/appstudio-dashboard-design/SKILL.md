---
name: appstudio-dashboard-design
tier: 0
description: "Dashboard design governance for Domo App Studio — pre-render validation, cardinality gates, two-pass chart selection logic, data anomaly handling, and layout algorithm. Trigger with 'dashboard design', 'chart selection', 'cardinality gates', 'design rules', 'chart type selection'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/dashboard-design.md"
audience: [code]
---

# Dashboard Design Skill — Domo App Studio

> Reference skill for an AI building Domo App Studio dashboards programmatically.
> This document governs HOW to design a dashboard, not just how to call the API.

---

## 0. Pre-Render Validation (Run Before Creating Any Card)

This is a mandatory gate. Do not create cards until every check passes.

### Data Integrity Checks

**Ratio / percentage metrics:**
- If `sum(Profit) > sum(Revenue)`, stop. This is impossible in a healthy dataset. Emit a `DATA_ANOMALY` warning, skip the derived ratio card, and note the issue in the response. Do not render a 503% margin gauge — it destroys trust in the entire dashboard.
- Any percentage metric outside [0%, 150%] is suspicious. Flag it and describe the anomaly before rendering.
- Derived KPIs (margin %, conversion rate, attainment %) must have a defined `plausible_range`. If the computed value falls outside it, warn before committing.

**Null / empty data:**
- If a chart's primary dimension returns 0 rows after aggregation, skip the card. Do not render an empty chart.

**Single-member dimensions:**
- If a `groupBy` dimension has only 1 distinct value, a grouped/series chart is meaningless. Use `badge_singlevalue` instead.

**Extreme outliers:**
- If one dimension member is more than 10x the next, the chart scale will crush all other values. Flag it for log scale consideration or outlier exclusion before rendering.

### Cardinality Gates

Before selecting a chart type, count distinct values of the SERIES/ITEM dimension:

| Chart Type | Minimum | Maximum | If below minimum → use instead |
|---|---|---|---|
| `badge_xybubble` | 8 data points | 50 | `badge_horiz_stackedbar` |
| `badge_heatmap` | 3x3 cells (both axes >= 3) | — | `badge_horiz_stackedbar` |
| `badge_donut` / `badge_pie` | 2 slices | 6 | `badge_horiz_stackedbar` if > 6 |
| `badge_vert_stackedbar` | 2 series | 6 | — |
| `badge_two_trendline` | 2 series | 8 | `badge_singlevalue` if 1 series |

**Never** generate a chart type where the dimension doesn't have enough members to make spatial spread meaningful. An xybubble with 3 dots in a void is not a visualization.

### Two-Pass Chart Selection

**Pass 1 — Shape match:** Do the available columns match the required mappings for this chart type?

**Pass 2 — Communication check:** Even if the shape matches, ask:
- Does the dimension have enough cardinality? (see table above)
- Will the chart be legible at the assigned card dimensions?
- Does this chart answer a clearer question than the simpler alternative?

**Default-to-simpler rule:** When in doubt between two chart types, always use the simpler one. Bubble over bar needs explicit justification. Bar over bubble is always safe.

---

## 1. Information Hierarchy

### The Golden Rule: Most Important Thing First

Every dashboard has one primary question. That question must be answerable within 5 seconds. Everything else is supporting evidence.

**The 5-Second Rule:** A viewer should be able to identify the headline metric, understand whether it is good or bad, and form a directional conclusion before they read a single label.

### Vertical Layout Zones

```
ROW 0–1  (y: 0–14)   HEADLINE ZONE      — KPI cards, scorecards, "state of the business"
ROW 2–3  (y: 14–28)  TREND ZONE         — time series, combo charts, directional movement
ROW 4–5  (y: 28–42)  BREAKDOWN ZONE     — composition, comparison, distribution by dimension
ROW 6+   (y: 42+)    DETAIL/CONTEXT ZONE — maps, scatter, heatmaps, supporting tables
```

Rules:
- Never put a detail chart in the headline zone. A heatmap or scatter plot does not belong at y=0.
- KPI singles (`badge_singlevalue`) belong in the headline zone. They lose their impact buried at y=40.
- Maps and bubble charts have high visual weight — they anchor the bottom of a dashboard, not the top.
- Text boxes (`badge_textbox`) should be used sparingly: one at most, as a dashboard header or section label.

### Headline Zone Rules

Cards in the headline KPI row must follow these rules without exception:

- **Zone homogeneity:** All cards in the headline row must use the same card type. `badge_singlevalue` only. Gauges (`badge_filledgauge`) do not belong in the headline row — they have a different visual language (scale/target) and will look like a different widget dropped in by accident. If a gauge is genuinely needed, it earns its own row below the KPIs.
- **Card height parity:** All cards in the same horizontal row must be assigned the same `height` value. Never mix card heights within a row. A singlevalue tile at h:12 next to a gauge at h:8 is incoherent.
- **Visual sizing hierarchy:** Headline KPIs are the smallest cards (compact is appropriate — h:10–12). Trend zone cards are taller (h:15–18). Detail zone cards are tallest (h:18+). Cards lower on the page should not be shorter than cards above them.

### Card Count Budget

- **Executive dashboard:** 4–8 cards total. Fewer is almost always better.
- **Analyst dashboard:** 8–14 cards. Never exceed 16.
- More than 12 cards on a single page signals a design problem, not thoroughness.

---

## 2. Chart Type Selection

The cardinal rule: **choose the chart that answers the question, not the chart that looks impressive.**

### Decision Framework

| Question Type | Best Chart | Acceptable | Avoid |
|---|---|---|---|
| How is one metric performing right now? | `badge_singlevalue` | `badge_filledgauge` | Any multi-series chart |
| How has a metric changed over time? | `badge_two_trendline` | `badge_line_stackedbar` | `badge_pie`, `badge_donut` |
| How do categories compare on one metric? | `badge_horiz_stackedbar` | `badge_vert_multibar` | `badge_pie` (if > 5 slices) |
| What is the part-to-whole composition? | `badge_donut` | `badge_pie` | `badge_vert_stackedbar` (if only composition) |
| How does composition change over time? | `badge_vert_stackedbar` | `badge_line_stackedbar` | `badge_pie` |
| How do categories rank? | `badge_horiz_stackedbar` | `badge_vert_multibar` | `badge_heatmap` |
| Where is performance geographically? | `badge_map` (US) or `badge_world_map` | none | `badge_pie` |
| Is a metric within a target range? | `badge_filledgauge` | `badge_singlevalue` with context | Any trend chart |
| How do two metrics relate across items? | `badge_xybubble` | none | `badge_heatmap` |
| Where are the hotspots across 2 dimensions? | `badge_heatmap` | none | `badge_vert_stackedbar` |
| How are two trends related? | `badge_two_trendline` | `badge_line_stackedbar` | Two separate single-values |
| What does a metric look like vs. target + trend? | `badge_line_stackedbar` | `badge_two_trendline` | `badge_pie` |

### Chart-by-Chart Usage Notes

**`badge_singlevalue`**
- The most powerful chart type for executive audiences.
- Use for total Sales, total Profit, order count, margin %.
- Always set a comparison value (prior period or target) — a number without context is not a KPI.
- Maximum 4 per dashboard. If you have 6 KPI singles in a row, you have 2–3 too many.

**`badge_two_trendline`**
- The workhorse for trend analysis. Use for Sales vs. Profit over time.
- Both lines should share a meaningful relationship — not just two random metrics.
- Requires: `ITEM` = `CalendarQuarter` (with `calendar: true`), `dateGrain` = `Order Date`, two VALUE columns.

**`badge_vert_stackedbar`**
- Best when you want to show total AND composition simultaneously.
- Use for Sales by Region over time, or Orders by Segment over quarters.
- Requires: `ITEM` = `CalendarQuarter` (with `calendar: true`), `VALUE` = measure, `SERIES` = category dimension.
- Avoid when the part-to-whole story does not matter — a grouped bar is clearer for pure comparison.

**`badge_vert_multibar`**
- Use for direct side-by-side comparison of categories across time or another dimension.
- Best for comparing 2–4 groups. More than 5 groups becomes cluttered — use horizontal instead.

**`badge_horiz_stackedbar`**
- Best for ranked comparisons of many categories (6+ items) where label readability matters.
- Use for "Sales by State" or "Profit by Product Sub-Category" — long names read better horizontally.
- Columns: `ITEM` = category dimension, `VALUE` = measure.

**`badge_donut`**
- Use only for part-to-whole with 3–6 slices. The center value is a key feature — always populate it.
- Works well for Customer Segment mix, Region share.
- Columns: `ITEM` = category, `VALUE` = measure.

**`badge_pie`**
- Acceptable for 2–4 slices only. With 5+ slices, use a bar chart.
- Never use when the viewer needs to compare specific values — bars are always more accurate.

**`badge_heatmap`**
- Excellent for showing performance density across two categorical dimensions.
- Use for "Sales by Region x Category" or "Profit by Segment x Ship Mode".
- Columns: `ITEM` = x-axis category, `VALUE` = measure, `SERIES` = y-axis category.

**`badge_line_stackedbar`**
- Combo chart — bars show volume, line shows a rate/ratio overlay.
- Classic use: bars = Sales by quarter, line = Profit Margin %.
- Both story threads must be meaningful to the same viewer.

**`badge_filledgauge`**
- Use only when there is a defined target or maximum that gives the fill meaning.
- Avoid using with open-ended metrics like total revenue — the "full" state has no meaning.
- Good for: on-time delivery rate %, margin vs. target %, quota attainment.

**`badge_xybubble`**
- Use for relationship/correlation analysis between two numeric dimensions.
- Bubble size (VALUE) adds a third dimension — use it for order quantity or revenue scale.
- Columns: `XTIME` = x-axis numeric, `VALUE` = y-axis numeric, `SERIES` = grouping dimension.

**`badge_map` / `badge_world_map`**
- `badge_map` for US state-level data (`State` column).
- `badge_world_map` for country-level data (`Country` column).
- These are anchor cards — give them width >= 20 and height >= 15.
- Columns: `ITEM` = geographic dimension (state name or country name), `VALUE` = measure.

**`badge_textbox`**
- Use as a dashboard title/header or section divider. Nothing else.
- Maximum 1 per dashboard page.

---

## 3. Layout Principles

### The 60-Unit Grid

The grid is 60 units wide. Standard heights are 12–15 units per row.

**Canonical card widths:**
- `15` units — small KPI, fits 4 across
- `20` units — standard card, fits 3 across
- `30` units — half-width, fits 2 across
- `60` units — full-width (banner, map)

**Standard row heights:**
- `12` — compact KPI row (badge_singlevalue, badge_filledgauge)
- `15` — standard chart row
- `18` — tall chart row for complex visuals (heatmap, bubble, map)

### Layout Patterns

**Pattern A — Executive Summary (4 KPIs + 2 charts):**
```
[ KPI ] [ KPI ] [ KPI ] [ KPI ]   x:0–14, 15–29, 30–44, 45–59 | y:0, h:12
[ Trend (30 wide) ] [ Donut (30 wide) ]                          | y:12, h:15
```

**Pattern B — Narrative Flow (KPIs → Trend → Breakdown):**
```
[ KPI 15 ] [ KPI 15 ] [ KPI 15 ] [ KPI 15 ]                     | y:0, h:12
[ Trendline (60 wide) ]                                           | y:12, h:15
[ Bar (30) ] [ Stacked Bar (30) ]                                 | y:27, h:15
[ Map (40) ] [ Heatmap (20) ]                                     | y:42, h:18
```

### Whitespace

- Never pack cards edge-to-edge without visual grouping intent. Use 1–2 unit gaps when needed.
- Leave at least 2 units of top margin (y >= 0 is fine, but don't crowd a title bar).
- Group related cards spatially — KPIs together, trend charts together. Random card placement destroys the narrative.

### Visual Weight

Cards with high visual weight (maps, bubble charts, heatmaps) draw the eye. Place them where they belong in the story — usually below the fold. Never use a full-width map as the first row.

---

## 4. Color Strategy

### Semantic Color

Always use color to mean something, never just to make things colorful.

| Color Role | Use For | Example |
|---|---|---|
| **Positive / Good** | Above target, profit, growth | Green (#34A853) |
| **Negative / Bad** | Below target, loss, decline | Red (#EA4335) |
| **Neutral / Informational** | Volume, count, no valence | Blue (#1A73E8) |
| **Comparison Series** | Second line or group | Orange (#F4A300) |

### Global Color Token System

Declare dimension-to-color assignments once at dashboard creation time and reuse them across every card. Never let individual charts choose their own palette independently — this is the single most common cause of cross-chart color inconsistency.

**Standard categorical palette (use in order):**

| Token | Hex | Use For |
|---|---|---|
| `color-1` | `#1A73E8` | First series (Consumer, East, First Class…) |
| `color-2` | `#F4A300` | Second series (Corporate, West, Second Class…) |
| `color-3` | `#34A853` | Third series (Home Office, Central, Standard…) |
| `color-4` | `#EA4335` | Fourth series (Small Business, South, Same Day…) |
| `color-5` | `#9334E6` | Fifth series |
| `color-6` | `#00ACC1` | Sixth series |

If a dimension appears on multiple charts (e.g. Region in a stacked bar AND a heatmap), it gets the same color assignment on both. If "West" is `#1A73E8` on the stacked bar, it is `#1A73E8` on the heatmap.

**Palette type rules:**
- **Categorical palette** (the 6-token system above): for all nominal dimensions — Customer Segment, Region, Ship Mode, Category. This is the default.
- **Sequential palette** (single-hue, light→dark): for continuous measures on choropleth maps and heatmaps only — e.g. Sales intensity by state.
- **Diverging palette** (two-hue with midpoint): only when a meaningful zero or midpoint exists — e.g. Profit variance (positive/negative), above/below target. Never use a diverging palette on a standard bar chart.

### Palette Discipline

- Maximum 5 distinct series colors on any one chart. If a dimension has 6+ values, combine the long tail into "Other".
- In `badge_two_trendline`: series line colors follow the categorical token order. If SERIES = Customer Segment and Consumer is first alphabetically, Consumer = `#1A73E8`.
- Never assign a diverging or sequential palette to a chart that shows nominal categories — this is the failure mode where a stacked bar ends up with greens/yellows/reds that imply performance valence when the data is just categories.

### Accessibility

- Never rely on color alone to convey information — use labels, patterns, or direct callouts.
- Ensure sufficient contrast between chart elements and background.
- Red/green colorblindness affects ~8% of male viewers. Where possible, pair color with a directional label (up/down arrow or +/– prefix on KPI values).

---

## 5. Naming and Labeling

### Card Titles

- Every card must have a title. Untitled cards are not acceptable in production dashboards.
- Format: **Noun + Metric** or **Question Form**
  - Good: `"Total Revenue"`, `"Sales by Region"`, `"Profit Trend by Quarter"`
  - Avoid: `"Chart 1"`, `"Stacked Bar"`, `"Revenue 2"`, `"Updated Title"`
- Titles should be 2–6 words. Anything longer is a description, not a title.

### Descriptions

- Use the card description field for context the title cannot carry:
  - Metric definition ("Includes returns and credits")
  - Period scope ("FY2010–FY2014")
  - Known caveat ("Excludes cancelled orders")
- Do not repeat the title verbatim as the description.

### Terminology Consistency

- Pick one term for each concept and use it everywhere: choose "Revenue" or "Sales" — not both.
- Use title case for all dimension values in labels (East, not east or EAST).
- Date grains: always write as "Q1 2013", never "2013-Q1" or "Q1/13".

---

## 6. Audience Design

### Executive Audience

- Primary question: "Are we on track?" → KPI singles with comparison values.
- Time horizon: current period vs. prior period. Not 4 years of raw history.
- Color should give an immediate red/green signal.
- Maximum card count: 6. An executive reads a dashboard in 30 seconds.
- No scatter plots, no heatmaps on the primary page.
- Trend charts should be quarterly or monthly — daily granularity is noise.

### Analyst Audience

- Primary question: "Where is the problem and what drives it?"
- Include breakdown by multiple dimensions (segment, region, category).
- Heatmaps, bubble charts, and geographic maps are appropriate here.
- Trend charts can show monthly or weekly data.
- More cards are acceptable (8–14), but each must earn its position.

### Mixed Audience (most common)

- Design for the executive first (headline zone), analyst second (detail zone).
- Use the vertical zone pattern: KPIs top, trends middle, breakdowns bottom.
- The executive reads rows 0–1 and leaves satisfied. The analyst continues to rows 2+.

---

## 7. Data Storytelling

### Lead with the Headline Insight

The first thing the viewer sees should answer: "What is the single most important thing about this data right now?"

Design choices that support this:
- Put the primary KPI (`badge_singlevalue`) in position x:0, y:0 — top-left is where the eye starts.
- Size headline KPIs larger than supporting cards (width: 15 for equal split, or 20 for the primary).
- Use a `badge_textbox` as a dashboard header only if it adds context not obvious from the title.

### Supporting the Headline with Context

After the headline, the next question is always "why?" Structure the dashboard to answer it:
1. **What is the number?** (KPI single)
2. **Is it getting better or worse?** (trend line)
3. **Who or what is driving it?** (breakdown by dimension — bar, stacked bar, donut)
4. **Where is it happening?** (map)
5. **Are there any anomalies?** (heatmap, scatter/bubble)

### Progressive Disclosure

Not every viewer needs every level. Design so each row adds depth:
- Row 1: headline numbers
- Row 2: directional context (trend)
- Row 3: dimensional breakdown ("West is the problem region")
- Row 4: detail and discovery ("Technology drives it in Q3")

---

## 8. Anti-Patterns to Avoid

### Pie Chart Abuse
- Never use `badge_pie` for more than 4 categories.
- Never use `badge_pie` when the viewer needs to compare specific values (use a bar chart).
- Never use `badge_pie` when the data is a time series (use a trendline).

### 3D and Decorative Charts
- This implementation does not support 3D charts — do not request them.
- Avoid visual decoration that adds no data: gradient fills, drop shadows, heavy borders.

### Chart Junk
- Do not add cards that show the same data in two different chart types "for variety."
- Do not include charts that have no clear question they are answering.
- Do not use `badge_textbox` for prose explanations — if the data needs that much explanation, the chart is wrong.

### Too Many KPIs
- Four `badge_singlevalue` cards in a row is the maximum before they lose impact.
- If you have 6–8 single-value KPIs, consolidate: are all of them truly headline-level?

### Inconsistent Scales
- Never place two bar charts side-by-side where the y-axis scales differ but are not labeled — viewers assume they match.
- When combining measures in `badge_two_trendline`, use a dual-axis if the ranges differ significantly.

### Unlabeled and Unexplained Cards
- Every card needs a title. No exceptions.
- If a card requires a paragraph of explanation, it is a bad chart. Redesign it.

### Misusing Date Grains
- For date-grain charts, ALWAYS set `ITEM` to `"CalendarQuarter"` with `"calendar": true` and reference `dateGrain: "Order Date"`.
- Never set `ITEM` directly to `"Order Date"` for trend charts — this produces row-level dates, not aggregated periods.

### Wrong Chart for the Question
- Do not use `badge_heatmap` for a single-dimension ranking (use a bar chart).
- Do not use `badge_xybubble` for time-series data (use trendline).
- Do not use `badge_filledgauge` without a meaningful maximum/target value.
- Do not use `badge_vert_stackedbar` for pure ranking (the stacking obscures the comparison).

### Sparse Charts
- Do not use `badge_xybubble` for a dimension with fewer than 8 distinct values. 3 dots in a massive void is not a visualization — use a horizontal bar chart instead.
- Do not use `badge_heatmap` unless both axes have at least 3 distinct values (minimum 3x3 = 9 cells). A 2x2 heatmap is a table.
- Before selecting any spatially-spread chart type, count the dimension cardinality. If it fails the minimum threshold, default to bar.

### Color Palette Per Chart
- Do not let each chart choose its own color palette independently. Every chart on the same dashboard must draw from the same global token system defined at dashboard-creation time.
- Symptom: a stacked bar uses greens/yellows/reds while the trendline uses blues. This breaks cross-chart comparison.
- Fix: map every dimension value to a color token before generating the first card. Hold those assignments for the entire dashboard.

### Axis Crush
- Do not group more than 2 dimensions on a single axis without checking the resulting label count.
- Maximum axis labels: 12 for categorical axes, 16 for time-based axes. Above these limits, reduce grain (quarters → years) or limit to top-N dimension members.
- For any time-axis chart with more than 8 time periods, verify that labels will not overlap at the assigned card width.

### Gauge in the Headline Row
- Do not mix `badge_filledgauge` into a `badge_singlevalue` headline row. They have different visual languages (scale vs. absolute value) and different default heights, making the row look incoherent.
- Gauges earn a dedicated row or are replaced with a singlevalue + description context.

---

## Quick Reference: Column Mapping Syntax

| Chart Type | Required Columns | Notes |
|---|---|---|
| `badge_singlevalue` | `VALUE` | Aggregate function applied server-side |
| `badge_two_trendline` | `ITEM`, `VALUE` (x2) | ITEM = CalendarQuarter, calendar: true |
| `badge_vert_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = CalendarQuarter for time axis |
| `badge_vert_multibar` | `ITEM`, `VALUE`, `SERIES` | ITEM = category or time |
| `badge_horiz_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = category (long names OK here) |
| `badge_donut` | `ITEM`, `VALUE` | No SERIES; ITEM drives slices |
| `badge_pie` | `ITEM`, `VALUE` | Same as donut; use donut instead |
| `badge_heatmap` | `ITEM`, `VALUE`, `SERIES` | ITEM = x-axis, SERIES = y-axis |
| `badge_line_stackedbar` | `ITEM`, `VALUE`, `SERIES` | ITEM = time grain |
| `badge_filledgauge` | `VALUE` | Needs target context in title/desc |
| `badge_xybubble` | `XTIME`, `VALUE`, `SERIES` | XTIME = x numeric, VALUE = y numeric |
| `badge_map` | `ITEM`, `VALUE` | ITEM = full state name |
| `badge_world_map` | `ITEM`, `VALUE` | ITEM = country name |
| `badge_textbox` | none | Static text content only |
