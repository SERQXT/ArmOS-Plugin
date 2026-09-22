---
name: pbi-to-domo
tier: 1
maturity: alpha
owner: Jeff Croskrey
description: "Convert Power BI dashboards to Domo Pro-Code vanilla JS apps. Accepts a .pbix file directly — automatically renames to .zip and extracts the Report/Layout, DataModelSchema, and theme artifacts internally, so the end user doesn't need to perform any manual extraction. Analyzes the full report structure, generates an implementation plan and wireframe, and — after user approval — builds a multi-page Chart.js app deployed to Domo. Logic is pushed into Domo dataflows wherever possible; only aggregation metrics (SUM, COUNT, COUNT DISTINCT, AVG, etc.) remain in the visualization layer. Trigger with 'convert Power BI to Domo', 'migrate Power BI dashboard', 'recreate this Power BI report in Domo', 'Power BI to Domo', or 'build a Domo app from Power BI'."
plugin: ps-build
tags: [migration, power-bi, conversion, procode, vanilla-js, chart-js, dashboard]
---

# Power BI to Domo Converter

Convert Power BI dashboard reports into Domo Pro-Code vanilla JS applications. Accepts a `.pbix` file directly — the skill automatically handles renaming the file extension to `.zip`, extracting the archive, and locating the relevant artifacts (`Report/Layout`, `DataModelSchema`, theme files). The end user only needs to provide the original `.pbix` file. The skill then analyzes the full data model and report layout, designs an implementation plan with logic routing (dataflow vs. front-end), generates a wireframe covering all visuals across all pages, and — only after user approval — builds and deploys a multi-page Chart.js app to Domo.

## Triggers

- "convert Power BI to Domo"
- "migrate Power BI dashboard"
- "recreate this Power BI report in Domo"
- "Power BI to Domo"
- "build a Domo app from Power BI"
- "migrate this PBIX file"
- "convert this Power BI report"

> **NOT for App Studio or native Domo cards.** This skill builds a Pro-Code vanilla JS app using Chart.js. If the user wants native Domo cards/dashboards instead, redirect to the **Dashboard Builder** skill. If they want an App Studio app, redirect to **build-appstudio**.

---

## Design Principles

1. **Logic belongs in dataflows.** All Power BI logic — calculated columns, complex DAX measures involving filtering/context transitions, table relationships, row-level calculations — should be pushed into Domo Magic ETL dataflows. The front-end app should receive pre-computed, dashboard-ready data.

2. **Only aggregations stay in the front end.** The visualization layer handles only simple metric aggregations: `SUM`, `COUNT`, `COUNT DISTINCT`, `AVERAGE`, `MIN`, `MAX`. These are computed client-side in JavaScript from the pre-aggregated dataset rows.

3. **Chart.js is the default charting library.** Covers bar, line, area, pie, donut, scatter, radar, and combo charts. For unsupported visual types (treemaps, Sankey diagrams, custom Power BI marketplace visuals), provide the closest Chart.js equivalent and document the gap.

4. **Multi-page support is mandatory.** Power BI reports often have multiple pages (tabs). The Domo app must implement tabbed navigation matching the original page structure.

5. **User approval before building.** The skill produces an implementation plan and wireframe FIRST. No code is written until the user reviews and approves.

---

## Prerequisites

### Required Inputs

The user provides **one file** — their `.pbix` file. The skill handles everything else automatically.

| Input | Required | What the User Does | What the Skill Does |
|-------|----------|-------------------|---------------------|
| **`.pbix` file** | **Yes** | Drops the file into chat or provides a file path | Copies to workspace, renames to `.zip`, extracts archive, locates `Report/Layout` and `DataModelSchema` automatically |
| **`.pbit` file** | Alternative | If user has a `.pbit` template instead, also accepted | Same extraction process — rename to `.zip`, extract, locate artifacts |
| **Theme JSON** | No (optional) | Export from Power BI Desktop: View > Themes > Export Current Theme | If not provided, the skill extracts theme info from `Report/StaticResources` inside the archive, or uses sensible defaults |
| **DAX Measures** | No (optional) | Export via DAX Studio (only needed if DataModelSchema is incomplete) | DAX measures are typically embedded in the `DataModelSchema` and extracted automatically |

> **The end user does NOT need to know about ZIP extraction, file renaming, or internal PBIX structure.** The skill abstracts all of this. If asked, simply say: "Just give me the .pbix file and I'll handle the rest."

### What's Inside a .pbix File

A `.pbix` file is a ZIP archive containing:
```
├── [Content_Types].xml
├── DataMashup              (Power Query / M expressions — binary)
├── DataModelSchema         (JSON — table definitions, columns, measures, relationships)
├── DiagramState            (model diagram layout — not needed)
├── Report/
│   ├── Layout              (JSON — all pages, visuals, positions, data bindings, filters)
│   ├── LinguisticSchema    (Q&A schema — not needed)
│   ├── StaticResources/    (images, theme overrides)
│   └── CustomVisuals/      (marketplace visual packages — if any)
├── SecurityBindings        (RLS definitions — if any)
├── Settings                (report-level settings)
└── Version                 (format version)
```

**Files the skill extracts and uses:**
1. **`Report/Layout`** — The visual layout (pages, charts, positions, filters, formatting)
2. **`DataModelSchema`** — The data model (tables, columns, types, DAX measures, relationships)
3. **`Report/StaticResources/`** — Theme overrides, embedded images (if present)
4. **`SecurityBindings`** — RLS rules (if present, flagged for Domo PDP conversion)

### Domo Prerequisites

1. **Domo instance authenticated** — Verify with `health_check` on domo-datasets MCP server
2. **Dataset(s) available** — The user must either:
   - Provide existing Domo dataset ID(s) that contain the source data, OR
   - Create placeholder dataset(s) in Domo with the required schema (skill can help design the schema)
3. **Pro-Code publish access** — Verify with `health_check` on domo-publish MCP server

---

## Workflow

### Phase 1: Intake & Parse

#### Step 1.0: Collect and Extract the Power BI File

**Ask the user for their `.pbix` file.** Accept it as:
- A file dropped into the workspace or chat
- A file path on the local filesystem (e.g., `~/Downloads/SalesReport.pbix`)

Also accept `.pbit` (Power BI Template) files — same extraction process.

**Once the file is received, run the automated extraction:**

```bash
# 1. Create the working directory
mkdir -p {workspaceDir}/pbi-source/extracted

# 2. Copy the .pbix file to the working directory and rename to .zip
cp "{path-to-pbix-file}" "{workspaceDir}/pbi-source/report.zip"

# 3. Extract the ZIP archive
cd {workspaceDir}/pbi-source/extracted
unzip -o "{workspaceDir}/pbi-source/report.zip" -d "{workspaceDir}/pbi-source/extracted"

# 4. Locate and copy the key files to predictable paths
# Report Layout (may be at Report/Layout with no extension)
if [ -f "Report/Layout" ]; then
  cp "Report/Layout" "{workspaceDir}/pbi-source/Layout.json"
  echo "✅ Report/Layout extracted"
elif [ -f "Report/layout" ]; then
  cp "Report/layout" "{workspaceDir}/pbi-source/Layout.json"
  echo "✅ Report/layout extracted"
else
  echo "❌ Report/Layout not found in archive"
fi

# DataModelSchema (at root level, no extension)
if [ -f "DataModelSchema" ]; then
  cp "DataModelSchema" "{workspaceDir}/pbi-source/DataModelSchema.json"
  echo "✅ DataModelSchema extracted"
else
  echo "❌ DataModelSchema not found in archive"
fi

# Static Resources / Theme (optional)
if [ -d "Report/StaticResources" ]; then
  cp -r "Report/StaticResources" "{workspaceDir}/pbi-source/StaticResources"
  echo "✅ StaticResources extracted"
fi

# SecurityBindings (optional — for RLS/PDP flagging)
if [ -f "SecurityBindings" ]; then
  cp "SecurityBindings" "{workspaceDir}/pbi-source/SecurityBindings.json"
  echo "⚠️ SecurityBindings found — will flag for Domo PDP conversion"
fi

# 5. List what was extracted for verification
echo ""
echo "=== Extraction Summary ==="
ls -la {workspaceDir}/pbi-source/*.json 2>/dev/null
ls -la {workspaceDir}/pbi-source/StaticResources/ 2>/dev/null
```

**After extraction, verify the two required files exist:**
- `{workspaceDir}/pbi-source/Layout.json` — **REQUIRED** (fail if missing)
- `{workspaceDir}/pbi-source/DataModelSchema.json` — **REQUIRED** (fail if missing)

**If either file is missing:**
> "I extracted the archive but couldn't find {missing file}. This can happen with some PBIX versions. Could you try exporting the file as a Power BI Template (.pbit) from Power BI Desktop (File > Export > Power BI Template) and sending me that instead?"

**If extraction fails entirely (not a valid ZIP):**
> "This file doesn't appear to be a valid PBIX archive. Please confirm it's a .pbix or .pbit file exported from Power BI Desktop. If the file is corrupted, try re-saving it in Power BI Desktop before sharing."

**Report to the user what was extracted:**
> "I've extracted your Power BI file. Here's what I found:
> - ✅ Report Layout (X pages detected)
> - ✅ Data Model Schema (X tables, X measures)
> - ✅/❌ Theme resources
> - ✅/❌ Security bindings (RLS rules)
>
> Proceeding to analyze the report structure..."

**Output files (predictable paths for subsequent steps):**
```
{workspaceDir}/pbi-source/
  report.zip                    (renamed copy of the original .pbix)
  Layout.json                   (Report/Layout — the visual structure)
  DataModelSchema.json          (tables, columns, measures, relationships)
  StaticResources/              (images, theme overrides — if present)
  SecurityBindings.json         (RLS rules — if present)
  extracted/                    (full raw extraction — for reference)
```

#### Step 1.1: Parse Report Layout

Read the `Layout.json` file and extract:

1. **Pages** — Each `section` in the layout represents a page/tab:
   - `displayName` — page title
   - `displayOption` — page sizing mode
   - `width`, `height` — canvas dimensions
   - `visualContainers` — array of all visuals on the page

2. **Visuals** — For each `visualContainer`, extract:
   - `x`, `y`, `width`, `height` — position and size on the canvas
   - `config` (JSON string — parse it) containing:
     - `singleVisual.visualType` — chart type (e.g., `barChart`, `lineChart`, `card`, `slicer`, `tableEx`, `pivotTable`, `donutChart`, `filledMap`, `shape`, `textbox`, `image`)
     - `singleVisual.projections` — data field bindings (which columns map to axes, values, legends)
     - `singleVisual.prototypeQuery` — the query structure defining data access
     - `singleVisual.objects` — formatting options (colors, labels, titles, etc.)
   - `filters` (JSON string — parse it) — visual-level filters
   - `query` — data query definition
   - `dataTransforms` — column mappings and transforms

3. **Report-level filters** — Found in `config.filters` at the report level

4. **Bookmarks** — If present in `publicBookmarks`, note them (may not be fully reproducible)

Produce a structured inventory:
```markdown
## Report Structure

### Pages
1. Page: "Overview" (1280x720)
   - 12 visuals
2. Page: "Sales Detail" (1280x720)
   - 8 visuals
3. Page: "Trend Analysis" (1280x720)
   - 6 visuals

### Visual Inventory
| # | Page | Type | Position (x,y) | Size (w x h) | Data Fields | Filters |
|---|------|------|-----------------|---------------|-------------|---------|
| 1 | Overview | card (KPI) | 40, 20 | 200x120 | SUM(Revenue) | None |
| 2 | Overview | barChart | 260, 20 | 480x350 | Region, Revenue | Year=2024 |
| ... | ... | ... | ... | ... | ... | ... |
```

#### Step 1.2: Parse Data Model Schema

Read the `DataModelSchema.json` file and extract:

1. **Tables** — Each table definition:
   - `name` — table name
   - `columns` — column names, data types, `sourceColumn` (original source mapping)
   - `measures` — DAX measure definitions (name, expression, formatString)
   - `annotations` — metadata
   - `partitions` — data source information (M/Power Query expressions)

2. **Relationships** — Table joins:
   - `fromTable`, `fromColumn` — FK side
   - `toTable`, `toColumn` — PK side
   - `crossFilteringBehavior` — single or both directions
   - `isActive` — whether the relationship is active

3. **Calculated Columns** — Columns with DAX expressions (identified by `type: "calculated"` or presence of `expression` property)

4. **DAX Measures** — All measures with their full DAX expressions

5. **Hierarchies** — Drill-down hierarchies defined in the model

Produce a structured data model summary:
```markdown
## Data Model

### Tables
| Table | Columns | Measures | Type |
|-------|---------|----------|------|
| Sales | 12 | 5 | Data table |
| Date | 8 | 0 | Date dimension |
| Product | 6 | 2 | Dimension |

### Relationships
| From | To | Type | Active |
|------|-----|------|--------|
| Sales.ProductID | Product.ID | Many-to-One | Yes |
| Sales.DateKey | Date.DateKey | Many-to-One | Yes |

### DAX Measures
| Measure | Table | Expression | Complexity |
|---------|-------|------------|------------|
| Total Revenue | Sales | SUM(Sales[Revenue]) | Simple (front-end) |
| YoY Growth | Sales | DIVIDE(... CALCULATE... SAMEPERIODLASTYEAR...) | Complex (dataflow) |
| Running Total | Sales | CALCULATE(SUM(...), FILTER(ALL(...))) | Complex (dataflow) |
```

#### Step 1.3: Parse Theme (if provided)

Extract from the theme JSON:
- `dataColors` — chart color palette (array of hex values)
- `background`, `foreground` — page background and default text colors
- `tableAccent` — accent color for tables and highlights
- `textClasses` — font families and sizes for different text levels (title, header, label, etc.)
- `visualStyles` — default formatting for specific visual types

Map these to CSS variables:
```css
:root {
  --pbi-color-1: #118DFF;
  --pbi-color-2: #12239E;
  --pbi-color-3: #E66C37;
  /* ... from dataColors array */
  --pbi-font-family: 'Segoe UI', sans-serif;
  --pbi-bg: #FFFFFF;
  --pbi-text: #252423;
}
```

---

### Phase 2: Analysis & Planning

#### Step 2.0: Logic Classification

This is the critical step that determines what gets built where. Review every piece of logic from the Power BI file and classify it.

**Classification Rules:**

| Logic Type | Route To | Examples |
|------------|----------|---------|
| **Simple aggregations** | Front-end (JavaScript) | `SUM(column)`, `COUNT(column)`, `COUNTDISTINCT(column)`, `AVERAGE(column)`, `MIN(column)`, `MAX(column)` |
| **Calculated columns** | Dataflow | Any column computed from other columns (string concatenation, date extraction, conditional logic, lookups) |
| **Complex DAX measures** | Dataflow (pre-compute) | `CALCULATE` with filters, `FILTER`, `ALL`, `ALLEXCEPT`, `SAMEPERIODLASTYEAR`, `DATEADD`, `TOTALYTD`, `RANKX`, `EARLIER`, context transitions |
| **Time intelligence** | Dataflow | YoY, MoM, QoQ comparisons, running totals, period-over-period calculations, YTD/QTD/MTD |
| **Table relationships (joins)** | Dataflow | Power BI relationships become ETL joins — produce a flattened/star schema output |
| **Row-level security** | Domo PDP (not app code) | Power BI RLS rules → Domo Personalized Data Permissions |
| **Visual-level filters** | Front-end (JavaScript filters) | Simple WHERE-clause-style filters on already-computed data |
| **Slicers / interactive filters** | Front-end (JavaScript UI controls) | Dropdown, date range, checkbox filters that the user interacts with |
| **Conditional formatting** | Front-end (CSS/JS) | Color rules based on thresholds, data bars, icon sets |
| **Bookmarks / drill-through** | Front-end (JS navigation) | Page navigation, filtered views — approximate with tab switching and filter state |

**Produce the Logic Routing Table:**

```markdown
## Logic Routing Plan

### Dataflow Logic (to be pre-computed in Magic ETL)
| # | Logic | Source (Power BI) | Dataflow Output Column | Notes |
|---|-------|-------------------|----------------------|-------|
| 1 | YoY Revenue Growth | DAX: DIVIDE(SUM(Sales[Revenue]) - CALCULATE(SUM(Sales[Revenue]), SAMEPERIODLASTYEAR(Date[Date])), ...) | `revenue_yoy_growth` | Pre-compute per period |
| 2 | Product-Sales Join | Relationship: Sales.ProductID → Product.ID | Flattened table with product attributes | ETL join |
| 3 | Running Total | DAX: CALCULATE(SUM(Sales[Revenue]), FILTER(ALL(Date), Date[Date] <= MAX(Date[Date]))) | `revenue_running_total` | Window function in ETL |

### Front-End Aggregations (JavaScript)
| # | Metric | Aggregation | Applied To |
|---|--------|-------------|------------|
| 1 | Total Revenue | SUM | revenue column |
| 2 | Order Count | COUNT | order_id column |
| 3 | Unique Customers | COUNT DISTINCT | customer_id column |
| 4 | Average Order Value | AVERAGE | order_value column |

### Front-End Interactions (JavaScript UI)
| # | Interaction | Power BI Source | Domo Implementation |
|---|-------------|-----------------|---------------------|
| 1 | Region filter | Slicer visual | Dropdown select control |
| 2 | Date range | Date slicer | Date range picker |
| 3 | Category filter | Slicer visual | Multi-select checkbox |

### Not Migrated / Manual Resolution Required
| # | Feature | Reason | Suggested Alternative |
|---|---------|--------|----------------------|
| 1 | Custom marketplace visual "X" | No Chart.js equivalent | Closest alternative: [describe] |
| 2 | Row-level security | Requires Domo PDP setup | Configure PDP policies on dataset |
```

#### Step 2.1: Dataset Mapping

Map Power BI tables to Domo datasets. The user must provide existing dataset IDs or confirm creation of placeholders.

**Present the dataset mapping to the user:**

```markdown
## Dataset Mapping

### Required Domo Datasets
| Power BI Table(s) | Domo Dataset | Required Columns | Status |
|--------------------|-------------|------------------|--------|
| Sales + Product + Date (joined) | "Sales Dashboard - Main" | revenue, order_id, customer_id, product_name, category, region, order_date, revenue_yoy_growth, revenue_running_total | Needs creation or mapping |
| [Additional tables...] | ... | ... | ... |

### Dataflow Requirements
| Dataflow | Input Dataset(s) | Output Dataset | Transforms |
|----------|------------------|----------------|------------|
| "PBI Migration - Sales Prep" | Raw Sales, Products, Dates | "Sales Dashboard - Main" | Join tables, compute YoY, running totals, calculated columns |
```

**Ask the user:**
> "Here are the Domo datasets this app needs. For each one, please either:
> (a) Provide the Domo dataset ID if it already exists, or
> (b) Confirm you'd like me to create a placeholder dataset with the required schema.
>
> Note: If you have raw source data in Domo, I can also spec out the dataflow(s) needed to produce the dashboard-ready dataset."

**STOP and wait for the user's response before proceeding.**

#### Step 2.2: Visual Translation Matrix

Map every Power BI visual type to its Chart.js equivalent:

| Power BI Visual | Chart.js Type | Config Notes |
|-----------------|---------------|--------------|
| `barChart` / `clusteredBarChart` | `bar` (horizontal) | `indexAxis: 'y'` for horizontal bars |
| `columnChart` / `clusteredColumnChart` | `bar` | Default vertical orientation |
| `stackedBarChart` | `bar` | `stacked: true` on both axes |
| `stackedColumnChart` | `bar` | `stacked: true` on both axes |
| `lineChart` | `line` | `tension: 0.4` for smooth curves if Power BI uses smooth lines |
| `areaChart` | `line` | `fill: true` or `fill: 'origin'` |
| `stackedAreaChart` | `line` | `fill: true`, `stacked: true` |
| `pieChart` | `pie` | |
| `donutChart` | `doughnut` | |
| `card` (KPI) | HTML element | Custom `<div>` with large number + label + trend indicator |
| `multiRowCard` | HTML element | Multiple KPI boxes in a row |
| `slicer` | HTML `<select>` / `<input>` | Dropdown, date picker, or checkbox group depending on slicer type |
| `tableEx` | HTML `<table>` | Sortable, styled table |
| `pivotTable` / `matrix` | HTML `<table>` | Grouped/nested table with subtotals — complex; may simplify to flat table |
| `lineClusteredColumnComboChart` | Mixed chart | `datasets` array with `type: 'bar'` and `type: 'line'` entries |
| `filledMap` / `map` | Not natively supported | Options: (a) use a Chart.js geo plugin, (b) replace with a bar chart by region, (c) flag for user decision |
| `treemap` | Not natively supported | Options: (a) use chartjs-chart-treemap plugin, (b) replace with horizontal bar chart |
| `gauge` | `doughnut` (half) | Simulate with 180-degree doughnut + center text |
| `waterfallChart` | Not natively supported | Use floating bar chart pattern or flag for user decision |
| `scatterChart` | `scatter` | |
| `funnel` | HTML or horizontal bar | Custom funnel using stacked divs or horizontal bars |
| `textbox` | HTML `<div>` | Static text element |
| `shape` | HTML/CSS | Boxes, lines, dividers |
| `image` | `<img>` tag | Extract from RegisteredResources if available |
| `kpi` | HTML element | Number + trend arrow + sparkline (optional) |

#### Step 2.3: Wireframe Design

Create an ASCII/text wireframe for each page of the Power BI report, mapping the visual positions to a CSS Grid layout.

**Process:**
1. Read the canvas dimensions from the Layout JSON (typically 1280x720)
2. For each visual, note its `x`, `y`, `width`, `height`
3. Convert absolute pixel positions to a responsive CSS Grid layout
4. Group visuals into logical rows and columns

**Wireframe format (one per page):**

```markdown
## Wireframe: Page 1 — "Overview"

Canvas: 1280 x 720 → CSS Grid: 12 columns, auto rows

+--[KPI: Revenue]--+--[KPI: Orders]--+--[KPI: Customers]--+--[KPI: Avg Value]--+
|    $1.2M         |     4,521       |      1,893         |     $265.50        |
+------------------+-----------------+--------------------+--------------------+

+--------[Bar: Revenue by Region]--------+--------[Line: Revenue Trend]----------+
|                                        |                                       |
|  ####                                  |         /\    /\                      |
|  ########                              |        /  \  /  \  /\                |
|  ####                                  |   /\  /    \/    \/  \               |
|  ##########                            |  /  \/                 \             |
|                                        |                                       |
+----------------------------------------+---------------------------------------+

+--[Slicer: Region]--+----------[Table: Top Products]-----------------------------+
|  [ ] North         | Product     | Revenue  | Units | Growth                   |
|  [x] South         | Widget A    | $340K    | 1,200 | +12%                     |
|  [ ] East          | Widget B    | $280K    | 950   | +8%                      |
|  [x] West          | Gadget C    | $210K    | 780   | -3%                      |
+---------------------+----------------------------------------------------------+
```

**For each page, also document:**
- Grid layout specification (columns, rows, gaps)
- Responsive breakpoints (if applicable)
- Filter/slicer interactions (which visuals are affected by which filters)
- Cross-page navigation (tab switching behavior)

---

### Phase 3: Implementation Plan & Approval Gate

#### Step 3.0: Compile Implementation Plan

Combine all Phase 2 outputs into a single **Implementation Plan** document:

```markdown
# Power BI to Domo — Implementation Plan

## 1. Report Summary
- Source: {PBIX filename}
- Pages: {count} ({list of page names})
- Total Visuals: {count}
- DAX Measures: {count} ({simple count} simple, {complex count} complex)
- Relationships: {count}

## 2. Logic Routing
{Logic Routing Table from Step 2.0}

## 3. Dataset Mapping
{Dataset Mapping from Step 2.1}

## 4. Dataflow Specifications
{For each required dataflow: inputs, transforms, output schema}

## 5. Visual Translation
{Visual Translation Matrix from Step 2.2 — filtered to only visuals in this report}

## 6. Wireframes
{All page wireframes from Step 2.3}

## 7. Interactions & Filters
- Global filters: {list}
- Per-page slicers: {list with affected visuals}
- Cross-page navigation: {tab structure}

## 8. Known Gaps / Trade-offs
{Anything that cannot be 1:1 replicated, with proposed alternatives}

## 9. Estimated Complexity
- Architecture: Dataset-only / Dataset + Collections
- Dataset mappings: {count}
- Chart.js charts: {count}
- HTML elements (KPIs, tables, text): {count}
- Interactive controls (slicers/filters): {count}
- Pages/tabs: {count}
```

Save this as `{workspaceDir}/deliverables/implementation-plan.md`.

#### Step 3.1: Present to User for Approval

**MANDATORY APPROVAL GATE. Do NOT proceed to Phase 4 without explicit user approval.**

Present the implementation plan to the user with:

> "Here is the full implementation plan for converting your Power BI report to a Domo app. Please review:
>
> 1. **Logic Routing** — I've classified each piece of logic as dataflow (pre-computed) or front-end (aggregation only). Does this split look right?
> 2. **Dataset Mapping** — These are the Domo datasets the app needs. Are the dataset IDs correct? Any missing?
> 3. **Wireframes** — This is how each page will be laid out. Any visual changes or priorities?
> 4. **Known Gaps** — These Power BI features can't be replicated 1:1. Are the proposed alternatives acceptable?
>
> Please approve, or let me know what to change."

**Wait for the user to respond.** Accept one of:
- **Approved** — proceed to Phase 4
- **Approved with changes** — update the plan per feedback, re-present only the changed sections, get final approval
- **Not approved / major changes** — revise and re-present the full plan

> **GUARDRAIL:** Do NOT write any application code until the user explicitly approves the implementation plan. This gate prevents wasted effort on the wrong design.

---

### Phase 4: Build

#### Step 4.0: Project Setup

Create the project directory structure:

```
{workspaceDir}/app/
  manifest.json
  index.html
  app.js
  app.css
  thumbnail.png
  .schema/          (cached dataset schemas)
```

This is a vanilla JS app — no build step required.

**Technology stack (fixed):**
- `ryuu.js` — Domo SDK (mandatory)
- `Chart.js` — charting library (via CDN)
- `Tailwind CSS` — styling (via CDN browser build)
- No React, no build tools, no npm

#### Step 4.1: Configure Manifest

Create `manifest.json` with all mapped datasets:

```json
{
  "name": "{App Name from Power BI report title}",
  "version": "1.0.0",
  "size": { "width": 1, "height": 1 },
  "fullpage": true,
  "mapping": [
    {
      "dataSetId": "{uuid-from-user}",
      "alias": "{descriptive-alias}",
      "fields": []
    }
  ]
}
```

- Use `"fullpage": true` — this is a dashboard app
- Use `"mapping"` NOT `"datasetsMapping"` (critical — see procode-app-builder guardrails)
- Leave `"fields": []` (all columns accessible)
- One mapping entry per Domo dataset

#### Step 4.2: Cache Dataset Schemas

For every dataset in the manifest, export the schema:

```
dataset_schema_export(dataset_id: "{uuid}", output_path: "{appDir}/.schema/{alias}-schema.json")
```

**GUARDRAIL:** Do NOT write any `domo.get()` code without `.schema/` files present. Column names must come from the actual schema, not from the Power BI model (column names may differ in the Domo dataset).

#### Step 4.3: Build index.html

Structure the HTML with:

1. **CDN includes** (in `<head>`):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
   ```

2. **App structure** (in `<body>`):
   - Tab navigation bar (one tab per Power BI page)
   - Page containers (one `<div>` per page, shown/hidden by tab selection)
   - Within each page: CSS Grid layout matching the wireframe
   - Chart containers with unique IDs
   - KPI card containers
   - Filter/slicer controls
   - Data table containers

3. **SDK and app script** (at bottom of `<body>`):
   ```html
   <script src="https://unpkg.com/ryuu.js"></script>
   <script src="app.js"></script>
   ```

**Multi-page tab structure:**
```html
<nav id="page-tabs" class="flex border-b border-gray-200 mb-4">
  <button class="tab active" data-page="overview">Overview</button>
  <button class="tab" data-page="sales-detail">Sales Detail</button>
  <button class="tab" data-page="trends">Trend Analysis</button>
</nav>

<div id="page-overview" class="page-content active">
  <!-- Grid layout for Overview page visuals -->
</div>
<div id="page-sales-detail" class="page-content hidden">
  <!-- Grid layout for Sales Detail page visuals -->
</div>
<div id="page-trends" class="page-content hidden">
  <!-- Grid layout for Trends page visuals -->
</div>
```

#### Step 4.4: Build app.css

Apply the Power BI theme as CSS:

```css
:root {
  /* Colors from Power BI theme dataColors array */
  --chart-color-1: #118DFF;
  --chart-color-2: #12239E;
  --chart-color-3: #E66C37;
  --chart-color-4: #6B007B;
  --chart-color-5: #E044A7;
  /* ... */

  /* Typography from Power BI theme */
  --font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;

  /* Layout */
  --page-bg: #F3F2F1;
  --card-bg: #FFFFFF;
  --card-radius: 8px;
  --card-shadow: 0 1px 3px rgba(0,0,0,0.1);
  --grid-gap: 16px;
}
```

Include:
- Page layout (full viewport, scroll behavior)
- Tab navigation styles (active state, hover)
- Card containers (white background, shadow, rounded corners — matching Power BI visual containers)
- KPI card styles (large number, subtitle, trend indicator)
- Table styles (striped rows, header styling)
- Filter/slicer control styles
- Responsive adjustments
- Loading states (skeleton screens while data loads)
- Empty states (message when no data)

#### Step 4.5: Build app.js

Structure the JavaScript with clear separation:

```javascript
// ============================================================
// 1. CONFIGURATION
// ============================================================
const CONFIG = {
  aliases: {
    main: 'salesData',       // manifest alias for main dataset
    // ... additional aliases
  },
  colors: ['#118DFF', '#12239E', '#E66C37', ...],  // from PBI theme
  pages: ['overview', 'sales-detail', 'trends'],
};

// ============================================================
// 2. STATE MANAGEMENT
// ============================================================
let state = {
  currentPage: 'overview',
  filters: {},           // active filter values
  rawData: {},           // raw data from domo.get()
  charts: {},            // Chart.js instances (for updates/destroy)
};

// ============================================================
// 3. DATA LAYER
// ============================================================
async function loadData() {
  // Fetch all datasets in parallel
  const [mainData] = await Promise.all([
    domo.get(`/data/v1/${CONFIG.aliases.main}`),
    // ... additional datasets
  ]);
  state.rawData.main = mainData;
}

// ============================================================
// 4. AGGREGATION FUNCTIONS (front-end metrics only)
// ============================================================
function sum(data, field) {
  return data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
}

function count(data) {
  return data.length;
}

function countDistinct(data, field) {
  return new Set(data.map(row => row[field])).size;
}

function average(data, field) {
  const values = data.filter(row => row[field] != null);
  return values.length ? sum(values, field) / values.length : 0;
}

// ============================================================
// 5. FILTER ENGINE
// ============================================================
function applyFilters(data) {
  return data.filter(row => {
    return Object.entries(state.filters).every(([field, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return true;
      if (Array.isArray(value)) return value.includes(row[field]);
      return row[field] === value;
    });
  });
}

function onFilterChange(field, value) {
  state.filters[field] = value;
  renderCurrentPage();
}

// ============================================================
// 6. CHART BUILDERS (one function per chart)
// ============================================================
function renderRevenueByRegion(filteredData) {
  // Group, aggregate, render Chart.js bar chart
  // Destroy existing chart instance if it exists
  if (state.charts.revenueByRegion) state.charts.revenueByRegion.destroy();

  const grouped = groupBy(filteredData, 'region');
  const labels = Object.keys(grouped);
  const values = labels.map(label => sum(grouped[label], 'revenue'));

  state.charts.revenueByRegion = new Chart(
    document.getElementById('chart-revenue-by-region'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: CONFIG.colors.slice(0, labels.length),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        // ... additional options matching PBI formatting
      }
    }
  );
}

// ... one render function per chart visual

// ============================================================
// 7. KPI RENDERERS
// ============================================================
function renderKPIs(filteredData) {
  document.getElementById('kpi-revenue').textContent =
    formatCurrency(sum(filteredData, 'revenue'));
  document.getElementById('kpi-orders').textContent =
    formatNumber(count(filteredData));
  // ... additional KPIs
}

// ============================================================
// 8. TABLE RENDERERS
// ============================================================
function renderProductTable(filteredData) {
  // Build HTML table with sorted data
  // Include sort-on-click headers if applicable
}

// ============================================================
// 9. PAGE NAVIGATION
// ============================================================
function switchPage(pageId) {
  state.currentPage = pageId;
  document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`page-${pageId}`).classList.remove('hidden');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.querySelector(`.tab[data-page="${pageId}"]`).classList.add('active');
  renderCurrentPage();
}

function renderCurrentPage() {
  const filtered = applyFilters(state.rawData.main);
  // Call render functions for the current page's visuals
  switch (state.currentPage) {
    case 'overview':
      renderKPIs(filtered);
      renderRevenueByRegion(filtered);
      // ... other overview visuals
      break;
    case 'sales-detail':
      // ... sales detail visuals
      break;
    // ... additional pages
  }
}

// ============================================================
// 10. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Setup tab click handlers
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchPage(tab.dataset.page));
  });

  // Setup filter change handlers
  // ... bind onFilterChange to slicer controls

  // Show loading state
  document.getElementById('loading').style.display = 'flex';

  try {
    await loadData();
    renderCurrentPage();
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('error-state').style.display = 'flex';
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
});

// ============================================================
// 11. UTILITY FUNCTIONS
// ============================================================
function groupBy(data, field) {
  return data.reduce((acc, row) => {
    const key = row[field] || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPercent(value) {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value);
}
```

**Key patterns:**
- Every Chart.js instance is stored in `state.charts` so it can be `.destroy()`ed before re-render (prevents memory leaks and canvas reuse errors)
- All data access goes through `domo.get()` with aliases from manifest
- Aggregations are pure JavaScript functions (sum, count, countDistinct, average)
- Filters modify `state.filters` and trigger a full re-render of the current page
- Each page only renders its own visuals (performance optimization)
- Loading and error states are handled

#### Step 4.6: Pre-Publish Verification

Run the full verification gate from the **procode-app-builder** skill (Step 7):

1. **7a. Manifest Validation:**
   ```
   procode_manifest_validate(manifestPath: "{appDir}/manifest.json", app_dir: "{appDir}")
   ```

2. **7b. Dataset Reachability:** Verify each dataset UUID is accessible:
   ```
   dataset_schema(dataset_id: "{uuid}")
   ```

3. **7c. CLI Authentication:**
   ```
   health_check (on domo-publish MCP server)
   ```

4. **7f. UX Design Validation:** Review against the checklist in procode-app-builder Step 7f, calibrated to the dashboard monitoring persona.

**All checks must pass before publishing.** Fix any issues and re-verify.

---

### Phase 5: Deploy & Verify

#### Step 5.0: Publish to Domo

```
procode_publish(app_dir: "{appDir}")
```

The tool automatically normalizes the manifest after publish.

#### Step 5.1: Deploy to Page

```
procode_deploy_to_page(design_id: "{designId}", page_title: "{PBI Report Name} - Domo", card_size: "full")
```

#### Step 5.2: QA Verification

1. Log into Domo:
   ```
   qa_domo_login(instance, username, password)
   ```

2. Navigate to the page:
   ```
   qa_domo_page_navigate(instance, page_id: "{pageId}")
   ```

3. Screenshot:
   ```
   qa_screenshot(name: "pbi-migration-deploy", full_page: true)
   ```

4. Check for errors:
   ```
   qa_get_console_logs(level: "error")
   ```

**Apply the Honesty Gate from procode-app-builder Step 8e:**
- Blank screenshot = FAIL
- App content visible with data = PASS
- If QA fails twice, escalate to **procode-app-fixer** skill

#### Step 5.3: Comparison Report

After successful deployment, produce a comparison summary:

```markdown
# Power BI to Domo — Migration Report

## Source
- File: {PBIX filename}
- Pages: {count}
- Total Visuals: {count}

## Domo App
- Design ID: {id}
- Page: {page URL}
- Version: 1.0.0

## Visual Fidelity
| # | Visual | PBI Type | Domo Type | Status | Notes |
|---|--------|----------|-----------|--------|-------|
| 1 | Revenue KPI | card | HTML KPI | Migrated | |
| 2 | Revenue by Region | barChart | Chart.js bar | Migrated | |
| 3 | Custom Map Visual | filledMap | Bar chart | Approximated | No native map support |

## Logic Migration
- DAX measures moved to dataflow: {count}
- Aggregations kept in front-end: {count}
- Logic gaps: {count} (see Known Gaps)

## Known Gaps
{List any features not migrated and why}
```

---

## Guardrails

### Logic Routing (CRITICAL)
- **NEVER put complex DAX logic in the front-end.** If a DAX measure uses `CALCULATE`, `FILTER`, `ALL`, `SAMEPERIODLASTYEAR`, `RANKX`, `EARLIER`, or any context-transition function, it MUST be pre-computed in a Domo dataflow. The front-end JavaScript should only do simple aggregations: `SUM`, `COUNT`, `COUNT DISTINCT`, `AVERAGE`, `MIN`, `MAX`.
- **Table relationships become ETL joins.** Power BI's implicit relationship model does not exist in the front-end. All joins must be materialized in the dataflow output.

### Chart.js Constraints
- **Always destroy before re-rendering.** Store Chart.js instances and call `.destroy()` before creating a new chart on the same canvas. Failure to do this causes memory leaks and "Canvas is already in use" errors.
- **Use `responsive: true` and `maintainAspectRatio: false`.** This allows charts to fill their grid containers properly.
- **Limit datasets per chart to ~10.** Chart.js performance degrades with many datasets. If a Power BI chart has 15+ series, consider splitting or aggregating.

### Pro-Code App Rules (inherited from procode-app-builder)
- Use `"mapping"` NOT `"datasetsMapping"` in manifest.json
- Always include `<script src="https://unpkg.com/ryuu.js"></script>` before app script
- NEVER use `cdn.domo.com/domo.js` (returns 403)
- NEVER use `confirm()`, `alert()`, or `prompt()` (sandbox blocks them)
- Leave `"fields": []` in manifest dataset mappings
- Set `"fullpage": true` for dashboard apps
- NEVER use `type="module"` on script tags

### Approval Gate
- **Do NOT write application code before user approves the implementation plan.** Phase 3 is a hard gate.
- **Do NOT skip the wireframe.** Every visual from the Power BI report must appear in the wireframe.

---

## Related Skills

- **procode-app-builder** (ps-build) — The underlying Pro-Code build and deployment workflow. This skill delegates to its patterns for manifest, publish, and QA.
- **procode-app-fixer** (ps-build) — Diagnose and fix deployed apps that aren't working correctly.
- **etl-builder** (ps-build) — Build Magic ETL dataflows for the pre-computation logic routed out of the front-end.
- **etl-spec-designer** (ps-build) — Design ETL specifications from the logic routing plan.
- **dashboard-builder** (ps-build) — Alternative if the user wants native Domo cards instead of a Pro-Code app.
- **beast-mode-writer** (ps-build) — Write Beast Mode formulas if any DAX measures are simple enough to be Beast Modes instead of dataflow columns.

## MCP Servers Required

- **domo-datasets** — Dataset discovery, schema export, data queries
- **domo-publish** — App publishing, manifest validation, design management
- **domo-pages** — Page creation, card placement
- **domo-dataflows** — Dataflow creation (for pre-computation logic)
- **mcp-qa-testing** — Post-deployment verification screenshots

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context.

### After executing
- Call `memory_remember` scoped to `{account_id}` with:
  - Power BI source file name and page count
  - Dataset mapping (PBI tables to Domo dataset IDs)
  - Logic routing decisions (what went to dataflow vs front-end)
  - Known gaps and trade-offs
  - Deployed app design ID and page URL
