# Dashboard Design Principles

Shared reference for **dashboard-builder**, **card-spec-designer**, and **dashboard-auditor**. Read before designing, specifying, auditing, or building any dashboard.

These principles come from cognitive science, information visualization research, and Domo platform best practices. They are the "why" behind every design decision.

---

## 1. Information Hierarchy (Shneiderman's Mantra)

**Overview first, zoom and filter, then details on demand.**

Every dashboard follows this top-to-bottom structure:

| Row | Purpose | Card Types | User Action |
|-----|---------|-----------|-------------|
| Hero KPIs | "How are we doing?" — status at a glance | Single value, multi-value | Scan in <5 seconds |
| Analysis | "Why?" — trends, breakdowns, comparisons | Trendlines, bar charts, stacked bars | Click to explore |
| Detail | "Show me the data" — drill into specifics | Tables, pivot tables | Filter and export |

**Hard rule:** Every dashboard MUST have a KPI hero row as Row 1 with 3–5 summary number cards. Each KPI must have: label, current value, and comparison context (vs prior period, vs target, or vs benchmark).

---

## 2. KPI Design — The Five Elements

A KPI card that shows only a raw number (e.g., "Revenue: $1.2M") is the #1 dashboard anti-pattern. Without context, the viewer cannot tell if $1.2M is good, bad, better, or worse.

Every KPI card must include:

1. **Label** — what the metric is ("Total Revenue")
2. **Value** — the current number ("$1.2M")
3. **Comparison** — vs what? ("vs $1.1M last quarter" or "+9% YoY")
4. **Trend** — direction over time (sparkline or arrow)
5. **Status** — is this good or bad? (color: green/yellow/red, or icon)

At minimum, include label + value + comparison. A KPI without comparison context is incomplete.

---

## 3. Chart Type Selection Rules

| Rule | Detail |
|------|--------|
| Pie chart limit | No pie/donut charts with 4+ slices — replace with horizontal bar (sorted descending) |
| No dual axes | Dual-axis charts violate the principle of graphical integrity. Use two separate charts. |
| No 3D charts | 3D adds no information and distorts perception of values |
| No gauges for dashboards | Gauges waste space showing one number. Use single-value cards instead. |
| Match encoding to task | Position (bars) for comparison. Length (bars) for magnitude. Angle (pie) only for 2-3 part compositions. Slope (lines) for trends. |

**Chart type validity:** Every `chartType` in a blueprint must exist in `../card-builder/reference/chart-types.md`. Cross-reference before building.

---

## 4. Pre-Calculated Average Detection

**Never use `AVG()` on a column that is already an average.**

Columns whose names contain "avg", "average", "rate", "pct", "percent", or "ratio" are likely pre-calculated. Using `AVG()` on them gives equal weight to every row regardless of volume — a store-day with 5 orders and one with 500 orders contribute equally.

**Fix:** Create a beast mode from raw components:
```
SUM(`NetSales`) / NULLIF(SUM(`OrderCount`), 0)
```

---

## 5. Pivoted Dataset Deduplication

If the dataset has a pivot dimension (e.g., ServiceType) that creates multiple rows per entity-date, additive measures shared across pivot rows (like CustomerCount, NetSales) get counted N times when grouped by the pivot dimension.

**Detection query:**
```sql
SELECT entity_id, date_col, MIN(shared_measure), MAX(shared_measure)
FROM table
GROUP BY entity_id, date_col
HAVING MIN(shared_measure) != MAX(shared_measure)
LIMIT 5
```

If this returns 0 rows, the measure is shared/duplicated. Do NOT SUM it when grouped by the pivot dimension.

**Fixes:**
- Filter to a single pivot value: `SUM(CASE WHEN ServiceType = 'Delivery' THEN CustomerCount ELSE 0 END)`
- Use `MAX` per entity-date instead of `SUM`
- Note the measure is only valid when NOT grouped by the pivot dimension

---

## 6. Total Trend Requirement

Every dashboard must include at least one trend-over-time card showing the primary metric's overall trajectory (not broken out by series). This answers "is it getting better or worse?"

If missing: add a trendline card for the hero KPI metric by the time dimension.

---

## 7. Data Discovery Before Design

No guessing at column values, date ranges, or dimension members. The following mandatory queries must be run for every source dataset before designing card specs:

1. `SELECT * FROM table LIMIT 5` — actual data shapes
2. `SELECT DISTINCT <dimension_col> FROM table` — for EVERY string/categorical column
3. `SELECT MIN(<date_col>), MAX(<date_col>) FROM table` — date boundaries
4. `SELECT COUNT(*) FROM table WHERE <col> IS NOT NULL` — null checks
5. `SELECT COUNT(*) FROM table` — row count

The discovery output is the single source of truth for column names, filter values, and date ranges in all subsequent steps.

---

## 8. Card Count Guidelines

| Audience | Max Cards | Rationale |
|----------|-----------|-----------|
| Executive | 6–8 | Executives scan for status, not analysis |
| Manager | 8–12 | Managers need both status and breakdown |
| Analyst | 12–20 | Analysts drill into detail |
| Operations | 6–10 | Operations needs real-time status, not exploration |

More cards ≠ more value. Every card must answer a distinct business question.

---

## 9. Color Consistency

- Same color = same meaning across all cards (e.g., blue = revenue everywhere)
- Use a single color palette with 1 accent color for emphasis
- Red/green only for positive/negative status — never as decorative colors
- Rainbow palettes are banned — they convey no meaning and create visual noise

---

## Applying These Principles by Skill

| Skill | How to Apply |
|-------|-------------|
| **dashboard-builder** | Validate every blueprint against principles 1–6 in Step 4.5 (Blueprint Validation). Enforce hero KPI row, pie chart limits, pre-calculated average detection, and total trend requirement before presenting for approval. |
| **card-spec-designer** | Apply principle 4 (pre-calculated averages) and 5 (pivoted datasets) when writing card specs. Ensure principle 7 (data discovery) values are used for filter values and date ranges — never guess. |
| **dashboard-auditor** | Score existing dashboards against ALL principles. Principle 1 (hierarchy) and 2 (KPI design) are the most common failures. Cards violating principle 3 (chart type rules) should be classified as REBUILD. |
