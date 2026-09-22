---
name: card-builder
tier: t0
primitive_of: analyzer-card-payload
bucket: card-work
description: "Reference spec for Domo KPI card payload structure covering all 207 chart types, column mapping rules, Pre-Render Validation Checklist, CRUD endpoints, and the complete body schema. Not directly user-invocable — consumed by card-kpi (T1) and other orchestrations."
kind: atom
status: draft
visibility: anyone
created_by: lane-L6
created_at: "2026-06-07T00:00:00Z"
userInvocable: false
---

# card-builder — Analyzer Card Payload Reference

Complete reference spec for Domo KPI card payload construction. Covers the full `AnalyzerCardUpdate` JSON shape, all 207 chart types, column mapping rules, the Pre-Render Validation Checklist, and CRUD endpoint contracts. Consumed by `card-kpi` (T1) and any orchestration that builds Domo cards programmatically.

## Payload example

```json
{
  "definition": {
    "subscriptions": {
      "big_number": {
        "name": "big_number",
        "columns": [
          {
            "column": "Revenue",
            "aggregation": "SUM",
            "alias": "Revenue",
            "format": { "type": "abbreviated", "format": "#A" }
          }
        ],
        "filters": []
      },
      "main": {
        "name": "main",
        "columns": [
          { "column": "Region", "mapping": "ITEM" },
          { "column": "Revenue", "mapping": "VALUE", "aggregation": "SUM" }
        ],
        "filters": [],
        "orderBy": [],
        "groupBy": [{ "column": "Region" }],
        "fiscal": false,
        "projection": false,
        "distinct": false
      }
    },
    "formulas":          { "dsUpdated": [], "dsDeleted": [], "card": [] },
    "annotations":       { "new": [], "modified": [], "deleted": [] },
    "conditionalFormats": { "card": [], "datasource": [] },
    "controls":  [],
    "segments":  { "active": [], "create": [], "update": [], "delete": [] },
    "charts": {
      "main": {
        "component": "main",
        "chartType": "badge_vert_bar",
        "overrides": {},
        "goal": null
      }
    },
    "dynamicTitle":       { "text": [{ "text": "Revenue by Region", "type": "TEXT" }] },
    "dynamicDescription": { "text": [{ "text": "", "type": "TEXT" }], "displayOnCardDetails": true },
    "chartVersion": "12",
    "inputTable":   false,
    "noDateRange":  false,
    "title":        "Revenue by Region",
    "description":  ""
  },
  "dataProvider": { "dataSourceId": "DATASET-UUID-HERE" },
  "variables": true,
  "columns":   false
}
```

## CRUD endpoints

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| CREATE | `PUT` | `/content/v3/cards/kpi?pageId=:pageId` | `pageId` query param is REQUIRED |
| READ | `PUT` | `/content/v3/cards/kpi/definition` | Uses PUT (unusual); body: `{"dynamicText":true,"variables":true,"urn":"CARD_ID"}` |
| UPDATE | `PUT` | `/content/v3/cards/kpi/:cardId` | Full body replacement; read first, modify, write back |
| COPY | `POST` | `/content/v1/cards/:id/copy` | Body: `{}`. Returns complete new card object |
| DELETE | `DELETE` | `/content/v1/cards/:id` | Permanent — no undo |

**Auth header**: `X-Domo-Authentication: {SID}` (handled by the MCP layer)

## Field reference — root level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `definition` | object | Yes | All card configuration lives here |
| `dataProvider.dataSourceId` | string | Yes | Dataset UUID. Use `dataSourceId` NOT `dsId` |
| `variables` | boolean | Yes | Must be `true` |
| `columns` | boolean | Yes | Must be `false` |

## Field reference — definition.subscriptions.main

| Field | Type | Description |
|-------|------|-------------|
| `columns` | array | Column definitions with mappings (see Column Mapping section) |
| `filters` | array | Filter objects: `{"column","values","filterType":"LEGACY","operand":"IN"}` |
| `orderBy` | array | Sort definitions |
| `groupBy` | array | Auto-built from all ITEM and SERIES columns |
| `fiscal` | boolean | Use fiscal calendar (default `false`) |
| `projection` | boolean | Enable projections (default `false`) |
| `distinct` | boolean | Distinct values only (default `false`) |

## Field reference — definition.subscriptions.big_number

| Field | Description |
|-------|-------------|
| `columns` | **Always non-empty.** For `badge_singlevalue` / `kpi`: one entry with the VALUE column + aggregation (e.g. `{"column":"revenue","aggregation":"SUM","alias":"Revenue"}`). For all other chart types: first VALUE column with its aggregation. Empty `[]` returns HTTP 400 `"big_number subscription missing select columns"` — see the **Selector card subscription requirements** section for the full rule (it applies to KPI cards too, not just the 6 selector types). |

## Field reference — definition.charts.main

| Field | Description |
|-------|-------------|
| `chartType` | One of 207 documented types (see Chart Types section) |
| `overrides` | Key-value map of chart styling overrides; all values must be strings |
| `goal` | Goal line object or `null` |

## Column mapping

| Mapping | Visual role | Aggregation | GroupBy |
|---------|-------------|-------------|---------|
| `ITEM` | X-axis / Category | Never | Yes |
| `VALUE` | Y-axis / Measure | Required (SUM/AVG/COUNT/MIN/MAX) | No |
| `SERIES` | Color / Legend | Never | Yes |
| `XTIME` | Time axis | Required | No |
| `BUBBLESIZE` | Bubble size | Required | No |

**Column object — dataset column:**
```json
{ "column": "Revenue", "mapping": "VALUE", "aggregation": "SUM", "alias": "Total Revenue" }
```

**Column object — beast mode:**
```json
{ "formulaId": "calculation_123456", "mapping": "VALUE", "aggregation": "SUM", "alias": "Win Rate %" }
```

**Beast mode aggregation rule (critical):** If the formula contains any of `SUM(`, `AVG(`, `COUNT(`, `MIN(`, `MAX(` it is aggregate — do NOT set `aggregation` on the card column. Row-level formulas (no aggregate function) DO need `aggregation`. Mixing these causes double aggregation or HTTP 400.

## Pre-Render Validation Checklist

Run these checks before creating any card. A confident wrong number is worse than a missing chart.

| Check | Rule | Action if fails |
|-------|------|-----------------|
| Profit ≤ Revenue | `sum(Profit) > sum(Revenue)` is impossible | Emit `DATA_ANOMALY`, skip ratio card |
| Percentage in range | Any % KPI outside [0%, 150%] | Flag anomaly, do not render gauge |
| Non-empty dimension | groupBy dimension returns 0 rows | Skip card entirely |
| Single-member groupBy | Distinct count of groupBy = 1 | Use `badge_singlevalue` instead |
| xybubble cardinality | SERIES has < 8 distinct values | Use `badge_horiz_stackedbar` instead |
| heatmap density | Either axis has < 3 distinct values | Use `badge_horiz_stackedbar` instead |
| Axis label count | ITEM distinct values > 12 (categorical) or > 16 (time) | Reduce grain or apply TOP N filter |

## Chart types — all 207

### Selection decision tree

- Single KPI number → `badge_singlevalue`
- Trend over time → `badge_trendline` or `badge_two_trendline`
- Category comparison → `badge_vert_bar` or `badge_horiz_bar`
- Composition / part-of-whole → `badge_vert_stackedbar` or `badge_pie`
- Two measures on dual axes → `badge_line_bar` or `badge_two_trendline`
- Geographic distribution → `badge_world_map` or `badge_map_us_state`
- Period-over-period → `badge_pop_trendline` or `badge_pop_bar_line`
- Table rows → `badge_basic_table`
- Selector / control widget → `badge_dropdown_selector`, `badge_date_selector`

### Summary — all 207 chart types

| # | Chart type | Group |
|---|-----------|-------|
| 1 | `badge_vert_bar` | Bar |
| 2 | `badge_horiz_bar` | Bar |
| 3 | `badge_vert_stackedbar` | Bar |
| 4 | `badge_horiz_stackedbar` | Bar |
| 5 | `badge_vert_multibar` | Bar |
| 6 | `badge_horiz_multibar` | Bar |
| 7 | `badge_vert_nestedbar` | Bar |
| 8 | `badge_horiz_nestedbar` | Bar |
| 9 | `badge_vert_percentbar` | Bar |
| 10 | `badge_horiz_percentbar` | Bar |
| 11 | `badge_vert_100pct` | Bar |
| 12 | `badge_horiz_100pct` | Bar |
| 13 | `badge_vert_dual_stackedbar` | Bar |
| 14 | `badge_horiz_dual_stackedbar` | Bar |
| 15 | `badge_vert_rtbar` | Bar |
| 16 | `badge_horiz_rtbar` | Bar |
| 17 | `badge_vert_rtmultibar` | Bar |
| 18 | `badge_horiz_rtmultibar` | Bar |
| 19 | `badge_vert_rtstackedbar` | Bar |
| 20 | `badge_horiz_rtstackedbar` | Bar |
| 21 | `badge_vert_bar_overlay` | Bar |
| 22 | `badge_horiz_bar_overlay` | Bar |
| 23 | `badge_vert_symbol` | Bar |
| 24 | `badge_spark_bar` | Bar |
| 25 | `badge_trendline` | Line |
| 26 | `badge_two_trendline` | Line |
| 27 | `badge_curvedline` | Line |
| 28 | `badge_stepline` | Line |
| 29 | `badge_symbolline` | Line |
| 30 | `badge_rttrendline` | Line |
| 31 | `badge_stackedtrend` | Line |
| 32 | `badge_variance_line` | Line |
| 33 | `badge_spark_line` | Line |
| 34 | `badge_curved_symbolline` | Line |
| 35 | `badge_horiz_trendline` | Line |
| 36 | `badge_horiz_curvedline` | Line |
| 37 | `badge_horiz_stepline` | Line |
| 38 | `badge_horiz_symbolline` | Line |
| 39 | `badge_horiz_curved_symbolline` | Line |
| 40 | `badge_horiz_stackedtrend` | Line |
| 41 | `badge_line_bar` | Combo |
| 42 | `badge_line_stackedbar` | Combo |
| 43 | `badge_line_clusterbar` | Combo |
| 44 | `badge_vert_bar_line` | Combo |
| 45 | `badge_horiz_bar_line` | Combo |
| 46 | `badge_curved_line_bar` | Combo |
| 47 | `badge_curved_line_stackedbar` | Combo |
| 48 | `badge_horiz_line_bar` | Combo |
| 49 | `badge_horiz_line_clusterbar` | Combo |
| 50 | `badge_horiz_line_stackedbar` | Combo |
| 51 | `badge_vert_100pct_linebar` | Combo |
| 52 | `badge_horiz_100pct_linebar` | Combo |
| 53 | `badge_vert_nested_linebar` | Combo |
| 54 | `badge_horiz_nested_linebar` | Combo |
| 55 | `badge_symbol_bar` | Combo |
| 56 | `badge_symbol_stackedbar` | Combo |
| 57 | `badge_horiz_symbol_bar` | Combo |
| 58 | `badge_horiz_symbol_stackedbar` | Combo |
| 59 | `badge_vert_area_overlay` | Area |
| 60 | `badge_horiz_area_overlay` | Area |
| 61 | `badge_vert_100pct_area` | Area |
| 62 | `badge_horiz_100pct_area` | Area |
| 63 | `badge_vert_curved_area_overlay` | Area |
| 64 | `badge_horiz_curved_area_overlay` | Area |
| 65 | `badge_vert_curved_stacked_area` | Area |
| 66 | `badge_horiz_curved_stacked_area` | Area |
| 67 | `badge_vert_curved_100pct_area` | Area |
| 68 | `badge_horiz_curved_100pct_area` | Area |
| 69 | `badge_vert_step_area_overlay` | Area |
| 70 | `badge_horiz_step_area_overlay` | Area |
| 71 | `badge_vert_step_stacked_area` | Area |
| 72 | `badge_horiz_step_stacked_area` | Area |
| 73 | `badge_vert_step_100pct_area` | Area |
| 74 | `badge_horiz_step_100pct_area` | Area |
| 75 | `badge_vert_dotplot_overlay` | Dot Plot |
| 76 | `badge_horiz_dotplot_overlay` | Dot Plot |
| 77 | `badge_vert_multi_dotplot` | Dot Plot |
| 78 | `badge_horiz_multi_dotplot` | Dot Plot |
| 79 | `badge_vert_stacked_dotplot` | Dot Plot |
| 80 | `badge_horiz_stacked_dotplot` | Dot Plot |
| 81 | `badge_vert_line_multi_dotplot` | Dot Plot |
| 82 | `badge_horiz_line_multi_dotplot` | Dot Plot |
| 83 | `badge_vert_line_stacked_dotplot` | Dot Plot |
| 84 | `badge_horiz_line_stacked_dotplot` | Dot Plot |
| 85 | `badge_pie` | Pie/Donut/Rose |
| 86 | `badge_donut` | Pie/Donut/Rose |
| 87 | `badge_nautilus` | Pie/Donut/Rose |
| 88 | `badge_nautilus_donut` | Pie/Donut/Rose |
| 89 | `badge_nightingale_rose` | Pie/Donut/Rose |
| 90 | `badge_basic_table` | Tables |
| 91 | `badge_pivot_table` | Tables |
| 92 | `badge_flex_table` | Tables |
| 93 | `badge_table` | Tables |
| 94 | `badge_heatmap_table` | Tables |
| 95 | `badge_singlevalue` | Single Value / Gauges |
| 96 | `badge_filledgauge` | Single Value / Gauges |
| 97 | `badge_gauge` | Single Value / Gauges |
| 98 | `badge_facegauge` | Single Value / Gauges |
| 99 | `badge_shapegauge` | Single Value / Gauges |
| 100 | `badge_compgauge` | Single Value / Gauges |
| 101 | `badge_compfillgauge_basic` | Single Value / Gauges |
| 102 | `badge_compfillgauge_adv` | Single Value / Gauges |
| 103 | `badge_progressbar` | Single Value / Gauges |
| 104 | `badge_radial_progress` | Single Value / Gauges |
| 105 | `badge_multi_radial_progress` | Single Value / Gauges |
| 106 | `badge_in_range_gauge` | Single Value / Gauges |
| 107 | `badge_imagegauge` | Single Value / Gauges |
| 108 | `badge_bullet` | Single Value / Gauges |
| 109 | `badge_multi_value` | Multi-Value |
| 110 | `badge_multi_value_cols` | Multi-Value |
| 111 | `badge_world_map` | Maps |
| 112 | `badge_map` | Maps |
| 113 | `badge_map_us_state` | Maps |
| 114 | `badge_map_us_county` | Maps |
| 115 | `badge_map_latlong` | Maps |
| 116 | `badge_map_latlong_route` | Maps |
| 117–152 | `badge_map_<country>` (36 country maps) | Maps |
| 153 | `badge_treemap` | Specialty |
| 154 | `badge_funnel` | Specialty |
| 155 | `badge_funnel_bars` | Specialty |
| 156 | `badge_funnel_swing` | Specialty |
| 157 | `badge_waffle` | Specialty |
| 158 | `badge_word_cloud` | Specialty |
| 159 | `badge_stream` | Specialty |
| 160 | `badge_stream_funnel` | Specialty |
| 161 | `badge_slope` | Specialty |
| 162 | `badge_bump` | Specialty |
| 163 | `badge_pareto` | Specialty |
| 164 | `badge_heatmap` | Specialty |
| 165 | `badge_gantt` | Gantt/Calendar |
| 166 | `badge_gantt_dep` | Gantt/Calendar |
| 167 | `badge_gantt_percent` | Gantt/Calendar |
| 168 | `badge_calendar` | Gantt/Calendar |
| 169 | `badge_ds_forecasting` | Data Science |
| 170 | `badge_ds_outliers` | Data Science |
| 171 | `badge_ds_pred_modeling` | Data Science |
| 172 | `badge_ds_spc` | Data Science |
| 173 | `badge_correlation_matrix` | Data Science |
| 174 | `badge_confusion_matrix` | Data Science |
| 175 | `badge_pop_trendline` | Period over Period |
| 176 | `badge_pop_trendline_var` | Period over Period |
| 177 | `badge_pop_rttrendline` | Period over Period |
| 178 | `badge_pop_bar_line` | Period over Period |
| 179 | `badge_pop_bar_line_var` | Period over Period |
| 180 | `badge_pop_line_bar` | Period over Period |
| 181 | `badge_pop_line_bar_var` | Period over Period |
| 182 | `badge_pop_vert_multibar` | Period over Period |
| 183 | `badge_pop_filledgauge` | Period over Period |
| 184 | `badge_pop_shapegauge` | Period over Period |
| 185 | `badge_pop_multi_value` | Period over Period |
| 186 | `badge_pop_progressbar` | Period over Period |
| 187 | `badge_pop_flex_table` | Period over Period |
| 188 | `badge_vert_histogram` | Histogram |
| 189 | `badge_horiz_histogram` | Histogram |
| 190 | `badge_vert_boxplot` | Box Plot |
| 191 | `badge_horiz_boxplot` | Box Plot |
| 192 | `badge_vert_waterfall` | Waterfall |
| 193 | `badge_horiz_waterfall` | Waterfall |
| 194 | `badge_xy_line` | Scatter/Bubble |
| 195 | `badge_xybubble` | Scatter/Bubble |
| 196 | `badge_checkbox_selector` | Selectors/Controls |
| 197 | `badge_date_selector` | Selectors/Controls |
| 198 | `badge_dropdown_selector` | Selectors/Controls |
| 199 | `badge_radio_selector` | Selectors/Controls |
| 200 | `badge_range_selector` | Selectors/Controls |
| 201 | `badge_slicer` | Selectors/Controls |
| 202 | `badge_textbox` | Text/Display |
| 203 | `badge_dynamic_textbox` | Text/Display |
| 204 | `badge_vert_marimekko` | Marimekko |
| 205 | `badge_horiz_marimekko` | Marimekko |
| 206 | `badge_vert_facetedbar` | Faceted Bar |
| 207 | `badge_horiz_facetedbar` | Faceted Bar |

**Known broken type:** `badge_line` always returns HTTP 400 on creation. Use `badge_two_trendline` or `badge_spark_line` instead.

## Selector card subscription requirements

**The 6 selector / control-widget chart types AND the `badge_singlevalue` / `kpi` chart type** require non-empty `big_number.columns`. The rule is broader than v1 docs implied: any chart that uses `big_number` as its primary data subscription (selectors for control population, KPI for the headline number) errors out without a populated columns array.

Failing to supply a non-empty `big_number.columns` array returns **HTTP 400** with the error body:

```json
{"message": "big_number subscription missing select columns", "type": "invalidSubscription"}
```

Verified live on `domo-alex-dengate` 2026-06-08 via `tools/audit-repros/B-cards-selector-400.mjs` (selector case) and during the App Studio simulation finish lane (KPI case — a `badge_singlevalue` card with `big_number.columns: []` returned the identical error string).

**Body-shape sensitivity:** the error string above ONLY surfaces if the rest of the `AnalyzerCardUpdate` body is well-formed and the `big_number` subscription is correctly nested under `definition.subscriptions.big_number` (NOT at root). A structurally malformed body returns a generic `"Bad Request"` with no diagnostic — fix the body shape first, then the columns rule will fire cleanly.

### All 6 selector chart types

| Chart type | Family | Required aggregation |
|---|---|---|
| `badge_checkbox_selector` | Selectors/Controls | COUNT on categorical column |
| `badge_dropdown_selector` | Selectors/Controls | COUNT on categorical column |
| `badge_radio_selector` | Selectors/Controls | COUNT on categorical column |
| `badge_slicer` | Selectors/Controls | COUNT on categorical column |
| `badge_date_selector` | Selectors/Controls | MAX on date column |
| `badge_range_selector` | Selectors/Controls | MIN + MAX on numeric column |

### Rule: `big_number.columns` must be non-empty

Unlike standard chart types where `big_number` shows a summary value, selector cards use `big_number` to drive the control population. An empty `columns` array triggers the 400 above — the card is never created.

### Correct payload shape — `badge_dropdown_selector` example

```json
"subscriptions": {
  "big_number": {
    "name": "big_number",
    "columns": [
      {
        "column": "region",
        "aggregation": "COUNT",
        "alias": "region",
        "format": {"type": "abbreviated", "format": "#A"}
      }
    ],
    "filters": []
  },
  "main": {
    "name": "main",
    "columns": [
      {"column": "region", "mapping": "ITEM"}
    ],
    "filters": [],
    "orderBy": [],
    "groupBy": [{"column": "region"}],
    "fiscal": false,
    "projection": false,
    "distinct": false
  }
}
```

### Per-type aggregation guidance

**Checkbox / dropdown / radio / slicer** (`badge_checkbox_selector`, `badge_dropdown_selector`, `badge_radio_selector`, `badge_slicer`):
- `big_number.columns`: one entry — the filtering column with `"aggregation": "COUNT"`
- `main.columns`: same column with `"mapping": "ITEM"`
- `main.groupBy`: `[{"column": "<column>"}]`

**Date selector** (`badge_date_selector`):
- `big_number.columns`: one entry — the date column with `"aggregation": "MAX"`
- `main.columns`: date column with `"mapping": "ITEM"`
- `main.groupBy`: `[]` (empty — date selectors do not group)

**Range selector** (`badge_range_selector`):
- `big_number.columns`: two entries — the numeric column with `"aggregation": "MIN"` and a second entry with `"aggregation": "MAX"`
- `main.columns`: numeric column with `"mapping": "VALUE"` and `"aggregation": "SUM"` (or MIN/MAX)
- `main.groupBy`: `[]`

### Style properties for page-level filter cards

When used as page-level filters in App Studio, add these to `cardMetadata.contentProperties`:

| Property | Value |
|---|---|
| `hideSummary` | `true` |
| `hideMargins` | `true` |
| `fitToFrame` | `true` |
| `hideTitle` | `true` |
| `hideDescription` | `true` |
| `hideFooter` | `true` |
| `hideTimeframe` | `true` |
| `hideBorder` | `true` |
| `style` | `null` (never use `ca3` or colored styles) |

Use template height of **6** for minimal vertical footprint.

## Critical gotchas

- `dataProvider.dataSourceId` NOT `dsId` — using `dsId` silently fails
- `variables: true` and `columns: false` are required at root level
- Both `big_number` AND `main` subscriptions must be present
- `conditionalFormats` must be object `{"card":[],"datasource":[]}` NOT an array
- `segments` must be object `{"active":[],"create":[],"update":[],"delete":[]}` NOT an array
- Period-over-period (`badge_pop_*`) cards require a `dateRangeFilter` on `main`; `dateGrain` and `periods` conflict
- Override values are always strings — booleans and numbers must be `"true"` / `"10"`
- READ returns `formulas` as `[]` and `conditionalFormats` as `[]` — must convert to object format before UPDATE
