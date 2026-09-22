---
name: procode-app-builder
tier: 1
description: "Build and deploy Pro-Code custom apps to Domo. Supports vanilla (HTML/CSS/JS) and React (TypeScript/Vite) templates. Trigger with 'build a Domo app', 'create a custom app', 'deploy a Pro-Code app', 'make a vanilla app', 'build a React app in Domo', or any request to create a custom Domo application."
maturity: beta
deprecated: true
deprecation_note: "Split into procode-app-decide (T1, architecture decision matrix) + procode-app-build (T2, deterministic execute). Architecture Decision Matrix content mined into procode-app-decide."
audience: [code]
---

# ProCode App Builder

Build and deploy custom Pro-Code applications to Domo. Supports two development approaches: vanilla (HTML + CSS + JS, no build step) for simple apps, and React (TypeScript + Vite) for complex interactive apps. Apps are deployed to Domo via the `domo publish` CLI command.

> **Data source**: Patterns derived from 301 functional production apps out of 2,625 total designs (11.5% pass rate). Apps were filtered for quality — only those with multiple published versions AND active data mappings qualified. The remaining 89% were incomplete, abandoned, or template stubs. All numbers below reflect real, shipped apps.

## Triggers

- "build a Domo app"
- "create a custom app"
- "deploy a Pro-Code app"
- "make a vanilla app"
- "build a React app in Domo"
- "create a dashboard widget"
- "build a card app"

> **NOT for App Studio.** If the user asks for an "App Studio app", a dashboard, or a reporting page with cards — STOP and use the **Dashboard Builder** skill instead. App Studio is Domo's no-code drag-and-drop dashboard builder. Pro-Code is custom HTML/CSS/JS or React deployed via the `domo publish` CLI. These are completely different things.

---

## Prerequisites — Check Before Proceeding

Before starting the build:
1. **domo-datasets tools** — Call `mcp__domo-datasets__health_check` to verify dataset access. If unavailable, STOP and report the credential gap.
2. **Workspace directory** — Verify the project workspace exists and is writable.

Do NOT fall back to curl/CLI for dataset operations if domo-datasets tools are unavailable. The auth complexity makes manual API calls unreliable. Report the gap instead.

---

## Architecture Decision Matrix (from 301 production apps)

Choose the architecture pattern based on what your app needs. These are the real distribution patterns from production:

| Pattern | Count | % | When to use | Example |
|---------|-------|---|-------------|---------|
| **Dataset-only** | 129 | 43% | Data visualization, read-only dashboards, KPI cards | Sales dashboard, metric cards |
| **Dataset + Collections** | 108 | 36% | Apps that display data AND need mutable state (user prefs, saved configs) | "Deck Builder" (2 datasets + 5 collections), "AI Insights Bot" (2 datasets + 3 collections) |
| **Collections-only** | 27 | 9% | Pure state-management apps, form builders, config tools | Intake forms, settings panels |
| **Packages-only** | 27 | 9% | Serverless function UIs, AI/LLM interfaces | "AI Use Case Blueprint" (10 packages) |
| **Dataset + Packages** | 4 | 1% | Apps calling Code Engine for server-side data processing | ETL monitoring dashboards |
| **Full-stack** (Dataset + Collections + Packages) | 4 | 1% | The most complex pattern — display data, manage state, call server functions | "Live F1 Telemetry Dashboard" (7 datasets + 4 collections) |

**Additionally**: 14 apps use Workflow integrations for enterprise process automation.

**Default recommendation**: Start with **Dataset-only** (43% of production apps). Add Collections when you need mutable state. Add Packages only when you need server-side processing.

---

## Complexity Tiers (from 301 production apps)

| Tier | Mappings | Count | % | Guidance |
|------|----------|-------|---|----------|
| **Simple** | 0-2 | 179 | 59% | Good starting point. Most apps are simple. |
| **Medium** | 3-5 | 68 | 23% | Standard business apps. |
| **Complex** | 6+ | 54 | 18% | Enterprise apps — plan architecture carefully. |

**Top complex production apps** (for inspiration):
- "Live F1 Telemetry Dashboard" — 7 datasets + 4 collections (full-stack pattern)
- "AI Use Case Blueprint" — 10 packages (heavy Code Engine usage)
- "Deck Builder" — 2 datasets + 5 collections (stateful builder)
- "AI Insights Bot" — 2 datasets + 3 collections (AI-powered data exploration)

---

## Decision Matrix: Vanilla vs React

| Criteria | Vanilla | React |
|----------|---------|-------|
| **Complexity** | Simple display, 1-2 interactions | Forms, multi-page, heavy interactivity |
| **Build step** | None (just HTML/CSS/JS) | Vite build (TypeScript compilation, bundling) |
| **Development speed** | Faster for simple apps | Faster for complex apps (component reuse) |
| **State management** | Manual DOM manipulation | React state, hooks, context |
| **Routing** | Not practical | React Router or similar |
| **Charts** | Phoenix CDN (script tag) | Phoenix CDN or npm package |
| **Bundle size** | Minimal (just your code) | Larger (React runtime + dependencies) |
| **TypeScript** | Optional (use JSDoc for types) | Built-in |
| **Best for** | KPI widgets, simple data displays, chart cards | Intake forms, multi-tab apps, dashboards with filters, data editors |

**Default recommendation:** Start with vanilla. Switch to React only when you need component architecture, state management, or routing.

---

## Domo SDK Reference (from 202 production codebases)

> Source code was downloaded from 202 functional apps via `GET /api/apps/v1/designs/{id}/versions/{ver}/assets` (returns ZIP). Stats below reflect actual usage across real codebases.

### SDK Usage in Production

| Method | Apps Using | % | Purpose |
|--------|-----------|---|---------|
| `domo.get()` | 105 | 52% | Read datasets, AppDB docs, Code Engine results |
| `domo.post()` | 60 | 30% | Write AppDB docs, call Code Engine, SQL queries |
| `domo.put()` | 21 | 10% | Update AppDB documents |
| `domo.delete()` | 11 | 5% | Delete AppDB documents |
| `domo.env` | 14 | 7% | Access userId, locale, instanceId |
| `domo.onFiltersUpdate()` | 13 | 6% | React to Domo page filter changes |
| `domo.navigate()` | 6 | 3% | Navigate to pages/external URLs |

### Data Access Patterns (from production code)

**Dataset query via alias** (81 apps, 40% — the most common pattern):
```javascript
// Simple: returns all rows as array of objects
const data = await domo.get('/data/v1/salesData');
// → [{ Region: "West", Revenue: 45000 }, ...]

// With inline SQL
const filtered = await domo.get('/data/v1/salesData?sql=' +
  encodeURIComponent('SELECT Region, SUM(Revenue) as TotalRevenue FROM table GROUP BY Region'));
```

**SQL query via /sql/v1/** (3 apps — for complex cross-dataset queries):
```javascript
// From "Modular Competitive Cockpit":
const results = await domo.post(`/sql/v1/${datasetId}`, {
  sql: `SELECT title, text, source, comp, category FROM ${datasetId} LIMIT 20`
});
```

**AppDB read/write** (44 apps read, 27 write — second most common data pattern):
```javascript
// Read all documents from a collection
const docs = await domo.get('/domo/datastores/v1/collections/MY_COLLECTION/documents');

// Create a new document (from "Alaska Airlines Warranty Claims"):
await domo.post(`/domo/datastores/v1/collections/${collectionName}/documents`, {
  content: newClaim  // wrapped in { content: ... }
});

// Read configuration (from "AI-Powered App Summary Component"):
const config = await domo.get('/domo/datastores/v1/collections/aiConfiguration/documents');
```

**Code Engine function call** (19 apps — for server-side processing):
```javascript
// Most common pattern — call a named function (from "Coleman Health Services Demo"):
const result = await domo.post('/domo/codeengine/v2/packages/queryWithSql', {
  dataset: '37430177-e1eb-4767-80d2-8d81af61f712',
  sql: 'SELECT * FROM table'
});

// Authentication function (from "AI Use Case Blueprint"):
const auth = await domo.post('/domo/codeengine/v2/packages/authenticateUser', {
  email: emailVal,
  password: passwordVal,
});
```

**Page filter handling** (13 apps — for apps embedded in filtered Domo pages):
```javascript
// From "Domo Card Embed Switcher Application":
domo.onFiltersUpdate((filters) => {
  console.log('Page filters updated:', filters);
  this.currentFilters = filters || [];
  this.refreshData();
});
```

### Pro-Code SQL Limitations

The Pro-Code SQL endpoint (`/data/v1/{alias}?sql=...`) supports a **subset** of Domo's full SQL. Several functions that work in the standard SQL API (`/api/query/v1/execute/{datasetId}`) are NOT available in Pro-Code context:

| Function | Status | Workaround |
|----------|--------|------------|
| `YEAR()` | ❌ Not supported | Extract client-side: `new Date(row.dateCol).getFullYear()` |
| `MONTH()` | ❌ Not supported | Extract client-side: `new Date(row.dateCol).getMonth() + 1` |
| `DATEPART()` | ❌ Not supported | Parse dates client-side |
| `DATEDIFF()` | ❌ Not supported | Calculate client-side |
| `CONVERT()` / `CAST()` | ⚠️ Limited | Use client-side type conversion |
| `COUNT(DISTINCT ...)` | ✅ Supported | Works normally |
| `GROUP BY` | ✅ Supported | Works normally |
| `ORDER BY` | ✅ Supported | Works normally |
| `WHERE` with comparison operators | ✅ Supported | Works normally |
| `LIMIT` | ✅ Supported | Works normally |

**Pattern for date-based grouping** (replaces `YEAR()`):
```javascript
// Instead of: SELECT DISTINCT YEAR(`dateCol`) as year FROM table
// Do this:
const sql = `SELECT DISTINCT \`dateCol\` FROM table WHERE \`dateCol\` IS NOT NULL ORDER BY \`dateCol\` DESC LIMIT 10000`;
const rows = await domo.get('/data/v1/myAlias?sql=' + encodeURIComponent(sql));
const years = [...new Set(rows.map(r => new Date(r.dateCol).getFullYear()))].sort((a, b) => b - a);
```

> **Performance note:** When querying large datasets (millions of rows), fetching all distinct dates to extract years is expensive. Consider using `LIMIT` to cap the scan, or provide reasonable defaults with a fallback if the query times out.

### Navigation

```javascript
// Navigate within Domo (from "ModoCorp Solution Finder"):
domo.navigate(relativePath, true);

// Open external URL in new tab (from "CommBank Chat Agent"):
domo.navigate(url, true);
```

### Technology Stack in Production

| Library | Apps | % | Notes |
|---------|------|---|-------|
| **Chart.js** | 105 | 52% | Most popular charting — use for all standard charts |
| **Tailwind CSS** | 75 | 37% | Most popular CSS framework — use CDN `@tailwindcss/browser` |
| **React** | 33 | 16% | For complex multi-component apps |
| **D3.js** | 31 | 15% | For custom/advanced visualizations |
| **Bootstrap** | 30 | 15% | Alternative CSS framework |
| **ECharts** | 13 | 6% | For advanced interactive charts |
| **ryuu.js** (Domo SDK) | 145 | 72% | The Domo data SDK — ALWAYS include: `<script src="https://unpkg.com/ryuu.js"></script>` |

**Default vanilla stack**: ryuu.js (mandatory) + Chart.js + Tailwind CSS (covers 70%+ of production apps).

### File Structure Patterns (from 202 apps)

| Structure | Count | Description |
|-----------|-------|-------------|
| `app.js, index.html, manifest.json, thumbnail.png` | 70 (35%) | Minimal vanilla app — **the default** |
| `app.css, app.js, index.html, manifest.json, thumbnail.png` | 54 (27%) | Vanilla with separate CSS |
| `config.js, dist/bundle.js, index.html, manifest.json, ...` | 26 (13%) | React/built app |
| Other (multi-file) | 52 (25%) | Complex apps with images, components, etc. |

**Default template**: `index.html` + `app.js` + `manifest.json` + `thumbnail.png` (300x300 PNG). Add `app.css` when CSS grows beyond inline styles.

---

## Manifest.json Specification

> **Sourced from 301 functional production apps** (filtered from 2,625 total designs). The API decomposes manifest.json into individual version fields (`datasetsMapping`, `collectionsMapping`, `packagesMapping`, etc.) but `domo publish` expects the flat manifest format below.

Every Pro-Code app requires a `manifest.json` at the project root.

### Manifest Templates (from production patterns)

**Dataset-only app** (43% of production apps — the most common pattern):
```json
{
  "name": "Sales Dashboard",
  "version": "1.0.0",
  "size": { "width": 1, "height": 1 },
  "fullpage": true,
  "mapping": [
    {
      "dataSetId": "c30487e4-cd80-4b3b-8ffb-6dfb21c43991",
      "alias": "salesData",
      "fields": []
    }
  ]
}
```

> **Production insight**: 141 apps use exactly 1 dataset, 51 apps use 2-3. Heavy dashboards go up to 30. Most apps leave `fields` as an empty array (all columns available). DQL is effectively unused — 0 out of 1,026 dataset mappings used DQL filters.

**Dataset + Collections app** (36% of production apps):
```json
{
  "name": "Deck Builder",
  "version": "4.7.209",
  "size": { "width": 1, "height": 1 },
  "fullpage": true,
  "mapping": [
    {
      "dataSetId": "c30487e4-cd80-4b3b-8ffb-6dfb21c43991",
      "alias": "presetConfigurations",
      "fields": []
    },
    {
      "dataSetId": "d9aa2b84-3f53-4998-82e0-448d98fe2de5",
      "alias": "pages_fields",
      "fields": []
    }
  ],
  "collections": [
    {
      "name": "RogersMetadataCollection",
      "id": "180463f5-0ad7-411d-b6d5-1012f7cafb19",
      "schema": {
        "columns": [
          { "type": "DECIMAL", "name": "uniqueId" },
          { "type": "STRING", "name": "exportId" }
        ]
      },
      "syncEnabled": false
    },
    {
      "name": "ReportingBatchCollection",
      "id": "8ef069c7-3ec5-4a53-ab43-4df318f32afd",
      "schema": {
        "columns": [
          { "type": "STRING", "name": "batchId" },
          { "type": "STRING", "name": "batchName" },
          { "type": "STRING", "name": "batchConfig" },
          { "type": "STRING", "name": "createdDate" },
          { "type": "STRING", "name": "lastModifiedDate" },
          { "type": "STRING", "name": "createdBy" }
        ]
      },
      "syncEnabled": false
    }
  ]
}
```

**Collections-only app** (9% of production apps — no dataset dependency):
```json
{
  "name": "Settings Manager",
  "version": "1.0.0",
  "size": { "width": 1, "height": 1 },
  "fullpage": true,
  "mapping": [],
  "collections": [
    {
      "name": "AppSettings",
      "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "schema": {
        "columns": [
          { "type": "STRING", "name": "key" },
          { "type": "STRING", "name": "value" }
        ]
      },
      "syncEnabled": false
    }
  ]
}
```

**Packages-only app** (9% of production apps — serverless function UIs):
```json
{
  "name": "AI Assistant",
  "version": "1.0.0",
  "size": { "width": 5, "height": 3 },
  "fullpage": true,
  "mapping": [],
  "packages": [
    {
      "alias": "processQuery",
      "packageId": "02b77ae9-fc21-40c7-8a62-d9d735e2db9c",
      "version": "3.1.0",
      "functionName": "processQuery",
      "parameters": [
        { "alias": "input", "name": "input", "type": "text", "nullable": true, "isList": false }
      ],
      "output": { "alias": "results", "name": "results", "type": "object", "nullable": true, "isList": true }
    }
  ]
}
```

> **Production insight on packages**: 127 bindings across 57 unique functions. Parameters are commonly `text` or `object` types. Output is commonly `object` type. Used for workflow orchestration, data processing, and AI/LLM calls.

**Basic embedded card** (no data bindings):
```json
{
  "name": "My Card",
  "version": "1.0.0",
  "size": { "width": 1, "height": 1 },
  "mapping": []
}
```

### Size Guidelines (from 301 functional apps)

| Size | Count | % | Use case | fullpage |
|------|-------|---|----------|----------|
| **1x1** | 110 | 37% | Card-sized widgets — the default size | Either |
| **6x3** | 73 | 24% | Wide dashboard cards | true |
| **5x3** | 38 | 13% | Standard content cards | true |
| **5x4** | 29 | 10% | Tall content cards, builder apps | true |
| Other | 51 | 16% | Various custom sizes | Varies |

**67% of functional apps (203/301) are fullpage apps.** Default to `"fullpage": true` unless the app is specifically meant to be an embedded card widget.

### Dataset Mapping Patterns (from 1,026 production mappings)

| Datasets per app | Count | Notes |
|-----------------|-------|-------|
| 0 | 56 | Collections-only or packages-only apps |
| 1 | 141 | Most common — single data source |
| 2-3 | 51 | Multi-source apps |
| 4-10 | ~40 | Complex dashboards |
| 10-30 | ~13 | Heavy dashboard apps |

- **DQL usage**: 0 out of 1,026 mappings used DQL. Do not use DQL filters in manifest mappings — use SQL via `domo.get()` instead.
- **Fields array**: Almost always empty (`[]`). Leave fields empty to expose all columns; filter in app code.

### Collection Patterns (from 265 production collections across 139 apps)

| Property | Production pattern |
|----------|--------------------|
| **syncEnabled** | 222 false, 43 true — default to `false` |
| **Schema types** | Only `STRING` and `DECIMAL` are used in production |
| **Schema size** | Typically 2-5 columns per collection |

### Manifest Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Display name of the app |
| `version` | Yes | Semantic version (X.Y.Z) |
| `size` | Yes | Default card size: `{ width, height }` |
| `fullpage` | No | `true` for standalone fullscreen apps (default: false). 67% of production apps use this. |
| `mapping` | No | Dataset mappings array |
| `mapping[].dataSetId` | Yes | UUID of the Domo dataset |
| `mapping[].alias` | Yes | Alias used in `domo.get('/data/v1/{alias}')` |
| `mapping[].fields` | No | Specific fields to expose (empty array = all fields). Production apps always use empty. |
| `mapping[].dql` | No | DQL filter expression. Not used in production — use SQL queries in app code instead. |
| `collections` | No | AppDB collection mappings |
| `collections[].name` | Yes | Collection name |
| `collections[].id` | Yes | Collection UUID |
| `collections[].schema.columns` | No | Column definitions: `{ type: "STRING" | "DECIMAL", name }` (only types used in production) |
| `collections[].syncEnabled` | No | Enable sync (default: false). 84% of production collections leave this false. |
| `packages` | No | Code Engine function bindings |
| `packages[].alias` | Yes | Function alias for app code |
| `packages[].packageId` | Yes | Code Engine package UUID |
| `packages[].version` | Yes | Package version to use |
| `packages[].functionName` | Yes | Function name within the package |
| `packages[].parameters` | Yes | Function input parameters (commonly `text` or `object` types) |
| `packages[].output` | Yes | Function output definition (commonly `object` type) |
| `fileName` | No | Entry point HTML file (default: `index.html`) |
| `id` | Auto | App ID — auto-generated on first `domo publish` |
| `proxyId` | Auto | Proxy ID — auto-generated |

### API Representation (READ-ONLY — do NOT use these keys in manifest.json)

When read via `GET /api/apps/v1/designs?parts=versions`, the manifest is decomposed into different key names. **These are the API read format — NEVER use them in your manifest.json file:**
- `mapping` → API returns as `datasetsMapping` (**write `"mapping"` in manifest**)
- `collections` → API returns as `collectionsMapping` (**write `"collections"` in manifest**)
- `packages` → API returns as `packagesMapping` (**write `"packages"` in manifest**)
- Also returned: `accountsMapping`, `actionsMapping`, `workflowsMapping`, `databasesMapping`

### Source Code Download API

Download any app's source code for reference:
```
GET /api/apps/v1/designs/{designId}/versions/{version}        → file list (string[])
GET /api/apps/v1/designs/{designId}/versions/{version}/assets  → source code ZIP
```
Requires a developer token with access to the design. Use `checkAdminAuthority=true` on the designs list endpoint for full catalog access with admin tokens.

---

## Phoenix Chart Integration

Domo's Phoenix charting library is available via CDN for creating charts inside Pro-Code apps.

### CDN Setup (Vanilla)

```html
<script src="https://cdn.domo.com/libs/phoenix/3.2.0/phoenix.min.js"></script>
<link rel="stylesheet" href="https://cdn.domo.com/libs/phoenix/3.2.0/phoenix.min.css">
```

### Creating a Chart

```javascript
// After loading data via domo.get()
const data = await domo.get('/data/v1/salesData');

const chart = new Phoenix.Chart({
  element: document.getElementById('chart-container'),
  type: 'bar',
  data: {
    columns: [
      { name: 'Region', type: 'STRING', mapping: 'ITEM' },
      { name: 'Revenue', type: 'DOUBLE', mapping: 'VALUE', aggregation: 'SUM' }
    ],
    rows: data.map(row => [row.Region, row.Revenue])
  },
  options: {
    title: 'Revenue by Region',
    colors: ['#0090CF', '#FF6B35', '#2ECC71']
  }
});

chart.render();
```

---

## Execution Flow — New App

### Step 0: Verify Instance Authentication

Before starting any app development, verify that the target Domo instance is accessible:

1. Run `health_check` on the `domo-datasets` MCP server
2. If health check fails, run `domo login -i {instance}` via Bash to authenticate the Domo CLI
3. Re-run `health_check` to confirm access
4. Only proceed once authenticated — all subsequent steps depend on API access

> **NEVER ask the user to run `domo login` manually.** Run it via Bash yourself.

### Step 0.5: Persona Identification

Before making any architecture or design decisions, identify who will use this app. The audience shapes every downstream choice — layout complexity, data density, interaction patterns, and visual style.

**Gather or infer the following:**

| Dimension | Question | Impact |
|-----------|----------|--------|
| **Role** | Who is the primary user? (executive, analyst, ops manager, field rep, customer) | Executives need glanceable KPIs; analysts need drill-down; ops needs action buttons |
| **Technical literacy** | How comfortable are they with data tools? | Low literacy → simpler UI, guided interactions, fewer controls. High literacy → dense tables, filters, raw data access |
| **Device context** | Desktop, tablet, mobile, or TV/kiosk? | Mobile → larger touch targets (44px min), stacked layout. TV → high contrast, no hover states |
| **Primary task** | What are they trying to DO with this app? (monitor, explore, input, compare, act) | Monitor → auto-refresh dashboards. Input → forms with validation. Compare → side-by-side layouts |
| **Frequency** | Daily driver or occasional check-in? | Daily → optimize for speed, minimize clicks. Occasional → optimize for clarity, add context/labels |
| **Success metric** | What does "this app worked" look like? | Defines the acceptance criteria — "I found the answer in <10 seconds" vs "I submitted the form without errors" |

**If the user doesn't specify the audience**, ask before proceeding:
> "Who will use this app? Knowing the audience helps me make better design choices — things like layout density, interaction patterns, and how much context to show."

**If the user wants to skip**, default to: mid-technical business user on desktop, daily usage, monitoring task. Document the assumption.

Record the persona in a `PERSONA.md` file in the project root for reference during implementation.

### Step 0.7: Specification Document

Before choosing architecture or template, define what you're building. Present a specification to the user for approval — this is the "plan mode" checkpoint that prevents building the wrong thing.

**Generate a spec document covering:**

```markdown
# App Specification: {App Name}

## Persona
- Target user: {from Step 0.5}
- Device: {desktop/mobile/both}
- Usage pattern: {daily/weekly/occasional}

## Purpose
{One sentence: what does this app do and why does it exist?}

## Data Requirements
- Datasets needed: {list with names/IDs if known}
- Mutable state needed: {yes/no — user prefs, form data, config}
- Server-side processing: {yes/no — AI calls, heavy computation}

## Features / Deliverables
1. {Feature 1 — e.g., "KPI summary bar with 4 metrics"}
2. {Feature 2 — e.g., "Filterable data table with search"}
3. {Feature 3 — e.g., "Trend chart with date range selector"}

## Interactions
- {Key interaction 1 — e.g., "Click a row to see detail panel"}
- {Key interaction 2 — e.g., "Date picker filters all charts"}

## Acceptance Criteria
- [ ] {Criterion 1 — e.g., "App loads with data in under 3 seconds"}
- [ ] {Criterion 2 — e.g., "All 4 KPI metrics display correct values"}
- [ ] {Criterion 3 — e.g., "Table filters work across all columns"}

## Out of Scope
- {What this app does NOT do — prevents scope creep}
```

**Present the spec to the user** and wait for approval before proceeding. If the user modifies the spec, update it and re-confirm.

Save the approved spec as `SPEC.md` in the project root. Reference it during implementation to stay on track.

> **GUARDRAIL:** Do NOT proceed to Step 1 without an approved spec. Building without a spec leads to rework, scope creep, and apps that don't match expectations.

### Step 1: Choose Architecture Pattern

Use the Architecture Decision Matrix above. Ask: Does this app need datasets? Mutable state (collections)? Server-side logic (packages)?

- Most apps (43%) need only datasets.
- If it needs user preferences, form submissions, or app config, add collections.
- If it needs server-side processing or AI/LLM calls, add packages.

### Step 2: Choose Template (Vanilla vs React)

Based on the Vanilla vs React decision matrix, select the approach. Default to vanilla for simple/medium apps (82% of production apps are simple or medium complexity).

### Step 3: Scaffold the Project

Use the templates in this skill's `templates/` directory:

- `templates/vanilla/` — Vanilla app scaffold (manifest.json, index.html, app.js, app.css)
- `templates/react/` — React app scaffold (manifest.json, package.json, vite.config.ts, src/index.tsx, src/App.tsx)

Copy the template and customize for the specific app requirements.

### Step 3.5: Pull and Cache Schemas

**CRITICAL: Do this BEFORE writing any application code.**

For every dataset in the manifest `mapping` array, export the schema locally:

```
dataset_schema_export(dataset_id: "{uuid}", output_path: "{appDir}/.schema/{alias}-schema.json")
```

This creates a `.schema/` directory with one file per dataset containing exact column names, types, and sample rows. These files are your single source of truth for data access code.

> **GUARDRAIL:** NEVER write `domo.get()` or `domo.post()` code without `.schema/` files present. The schema files prevent column name typos, type mismatches, and incorrect SQL queries that would only fail at runtime in Domo.

### Step 4: Configure Manifest

Update `manifest.json` based on the architecture pattern:

1. Set `"fullpage": true` unless building an embedded card widget (67% of apps are fullpage)
2. Set size — default to `1x1` (37% of apps), use `6x3` for wide dashboards, `5x3` for content cards
3. Get dataset UUIDs from Domo (use `dataset_list` or `dataset_search` from domo-datasets MCP)
4. Add each dataset to `mapping` with a descriptive alias and empty `fields` array
5. Add AppDB collections if mutable state is needed (keep schemas to 2-5 STRING/DECIMAL columns)
6. Add package bindings if server-side processing is needed

### Step 5: Implement the App

**Vanilla:**
- Edit `index.html` for structure
- Edit `app.js` for logic and data fetching
- Edit `app.css` for styling

**React:**
- Edit `src/App.tsx` for the main component
- Create additional components in `src/components/`
- Edit `package.json` for additional dependencies

### Step 5.5: Generate Local Preview (Optional)

After implementing the app, generate a mock harness for local preview:

```
procode_generate_mock(app_dir: "{appDir}")
```

This creates:
- `domo-mock.js` — Mock Domo SDK with embedded sample data from `.schema/` files
- `dev.html` — Wrapper page that loads the mock before your app

The user can open `dev.html` in a browser to preview the app with mock data before deploying to Domo. This is useful for verifying layout, chart rendering, and data transformations without a live Domo connection.

> **Note:** Mock data is limited to the 5 sample rows from schema export. For full data testing, deploy to Domo.

### Step 6: Build (React only)

```bash
npm install
npm run build
```

Vite outputs the production bundle to the project root (`index.html` + `assets/`). The Vite config uses `outDir: '.'` and `format: 'iife'` because Domo's CDN serves `.js` as `application/octet-stream`, which breaks ESM `type="module"` scripts.

### Step 7: Pre-Publish Verification

A gate that MUST pass before `domo publish`. All checks must pass — do NOT publish with any failures.

**7a. Manifest Validation:**
```
procode_manifest_validate(manifestPath: "{appDir}/manifest.json", app_dir: "{appDir}")
```
Review all issues. Fix any critical issues before proceeding.

**7b. Dataset Reachability:**
For each dataset UUID in the manifest `mapping` array, verify it's accessible:
```
dataset_schema(dataset_id: "{uuid}")
```
If any dataset returns an error, the UUID is wrong or the instance credentials are invalid. Fix before publishing.

**7c. CLI Authentication:**
Verify the Domo CLI is authenticated to the target instance:
```
health_check (on domo-publish MCP server)
```
If it fails, run `domo login -i {instance}` via Bash. NEVER ask the user to do this manually.

**7d. Build Output Smoke Test (React apps only):**
Before publishing a React/Vite app, verify the build output:
1. `index.html` exists at project root (Vite builds to root, not dist/) — if missing, the build failed
2. `assets/` directory exists with the bundled JS file
3. `manifest.json` has `"fileName": "index.html"` — NEVER `"manifest.json"` or `"dist/index.html"`
4. `manifest.json` uses `"mapping"` (not `"datasetsMapping"`) and has entries matching expected dataset count
5. `index.html` does NOT have `type="module"`, `defer`, or `crossorigin` on any script tag — all three break in Domo's CDN. The Vite template's `domoScriptFix` plugin should strip these automatically; if present, the build is broken
6. ryuu.js `<script>` tag appears BEFORE the app script in `<body>` — execution order matters. If app runs before `domo` is defined, data calls fail silently
7. App script tag is at bottom of `<body>` (not in `<head>`) — prevents "Root element not found" errors
8. `thumbnail.png` exists at project root — required for `app_card_create` to place the app on a page. If missing, copy from template or generate a 300x300 placeholder

If any check fails, fix before publishing. Do NOT publish and hope QA catches it.

**7e. Publish Gate:**
Only proceed to Step 8 if ALL of the above pass:
- ✅ No critical manifest validation issues
- ✅ All dataset UUIDs reachable
- ✅ CLI authenticated
- ✅ Build output smoke test passed (React apps)
- ✅ Security review completed or explicitly skipped by user (Step 7f)

If any check fails, fix the issue and re-run the failed check. Do NOT skip checks.

**7f. Security Review Gate (Pre-Deploy):**

A security review is required before deploying any ProCode app. This gate runs the **`procode-security-review`** skill (70 checks across OWASP Top 10, LLM/Agentic/MCP security, Domo SDK safety, secrets, injection, CSRF, dependencies). It applies to every `domo publish` -- whether deploying to an internal instance or a customer instance.

**Conditional skip logic:**

1. Check if `SECURITY-REVIEW.md` already exists in the app workspace (or `artifacts/SECURITY-REVIEW.md` in 500 Apps pipeline context).
2. If it exists, compare the file's timestamp/date against the app source files (`index.html`, `app.js`, `app.css`, `manifest.json`, `src/**` for React apps, and any other `.js`, `.ts`, `.jsx`, `.tsx`, `.html`, `.css` files in the project). If **no code files have been modified** since the review was produced, the existing review is still valid.
3. If no review exists, or if code has changed since the last review, a new review is needed.

**Always prompt the user:**

Regardless of whether a review is needed, always present the status and ask:

- **If a current review exists (no code changes since last review):**
  > "A security review was completed on [date] and no code changes have been made since. The existing review is still valid. Would you like to re-run the security review anyway, or proceed to deploy?"

- **If no review exists or code has changed:**
  > "A security review is recommended before deploying. [Code has changed since the last review. / No prior security review found.] Would you like to run the security review now, or skip it and proceed to deploy?"

**If the user says yes (run the review):**
1. Invoke the **`procode-security-review`** skill against the app source directory
2. CRITICAL and HIGH findings are auto-fixed where possible
3. The report is saved as `SECURITY-REVIEW.md` in the app workspace
4. Present the deploy gate verdict:
   - **CLEAR TO DEPLOY** -- no blocking findings, proceed to Step 8
   - **PROCEED WITH CAVEATS** -- medium findings noted for follow-up, proceed to Step 8
   - **BLOCK DEPLOY** -- CRITICAL/HIGH findings remain after auto-fix. Do NOT proceed to Step 8. Fix the findings first, then re-run the review.

**If the user says no (skip the review):**
Log that the security review was skipped. Note the skip in deployment records. Proceed to Step 8.

> **Note:** The 500 Apps pipeline has its own mandatory security review (stage SEC between K and N) that cannot be skipped. This Step 7f gate is for the standalone procode-app-builder flow and gives the user the option to skip if the existing review is still current.

**7g. UX Design Validation:**

Before publishing, review the implemented code against UX best practices. This is a code review focused on the user experience, not functionality. Reference the persona from Step 0.5 and the spec from Step 0.7.

**Layout & Visual Hierarchy:**
- [ ] Clear visual hierarchy — the most important information is the most prominent (larger, bolder, higher on page)
- [ ] Consistent spacing — margins and padding follow a consistent scale (e.g., 8px grid)
- [ ] Logical grouping — related elements are visually grouped; unrelated elements have clear separation
- [ ] No orphaned elements — nothing floats alone without context or label
- [ ] Responsive behavior — layout doesn't break at common viewport widths (if applicable to device context)

**Typography & Readability:**
- [ ] Font sizes are readable — body text >= 14px, labels >= 12px, headings clearly differentiated
- [ ] Line lengths are comfortable — 45-75 characters per line for body text
- [ ] Sufficient contrast — text meets WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- [ ] Data values are formatted — numbers have thousands separators, dates are human-readable, percentages have consistent decimals

**Interaction Design:**
- [ ] Interactive elements are obvious — buttons look clickable, links are distinguishable, hover states exist (desktop)
- [ ] Touch targets are adequate — minimum 44x44px for mobile/tablet contexts
- [ ] Loading states exist — users see feedback while data loads (spinner, skeleton, or progress indicator)
- [ ] Empty states are handled — if no data, show a helpful message instead of blank space
- [ ] Error states are handled — if a data call fails, show a user-friendly message instead of a broken UI

**Information Density (calibrate to persona):**
- [ ] Executive users → high-level KPIs first, details on demand
- [ ] Analyst users → dense data is OK, provide filter/sort controls
- [ ] Ops/field users → action-oriented layout, minimal scrolling to key actions
- [ ] Low-tech users → generous whitespace, clear labels, guided flow

**Color & Branding:**
- [ ] Color is used meaningfully — not decoratively (green = good, red = alert, not random)
- [ ] Color is not the ONLY indicator — patterns, icons, or text reinforce color meaning (accessibility)
- [ ] Palette is limited — 2-3 primary colors max, plus neutrals. Avoid rainbow charts unless categorical data demands it

**Review process:** Read through the app's HTML, CSS, and JS/TSX files checking each item above. For any failures:
1. Fix the issue directly in the code
2. Re-check the fixed item
3. Log what was fixed (include in deployment notes)

> **This is a SOFT gate** — not every item must pass for every app (a simple KPI card doesn't need loading states for a single `domo.get()` call). Use judgment calibrated to the app's complexity and persona. But any app with 3+ UX failures should be fixed before publishing.

### Step 8: Deploy and Post-Publish Verification

**8a. Deploy:**

> **Always prefer the Domo CLI (`domo publish`) over the `procode_publish` MCP tool.** The CLI is faster, battle-tested across hundreds of deploys, and handles version creation + asset upload in one step. Use `procode_publish` MCP only when the CLI is unavailable (e.g., cloud MCP gateway on EC2-A, or inline-files mode from CoWork/Manus).

```bash
domo publish
```

On first publish, `manifest.json` is updated with `id` and `proxyId` fields. Subsequent publishes: bump the `version` field first.

> **Note:** The `procode_publish` MCP tool automatically normalizes the manifest after publish (renames `datasetsMapping` → `mapping`, fixes `fileName`, etc.). No manual normalization step is needed when using the tool. The result includes `manifestNormalized: true` when normalization was applied. If using `domo publish` CLI directly (not via the MCP tool), you must still normalize manually — see below.

<details>
<summary>Manual normalization (only needed if using CLI directly)</summary>

After `domo publish`, the CLI rewrites `manifest.json` with API-format keys that will break the next publish cycle. Normalize the manifest:

1. Re-read `manifest.json`
2. If `datasetsMapping` key exists, rename it back to `mapping`
3. If `collectionsMapping` key exists, rename it back to `collections`
4. If `packagesMapping` key exists, rename it back to `packages`
5. Fix `fileName` back to `"index.html"` if it was rewritten to `"manifest.json"`
6. Write the normalized manifest back to disk
</details>

### Known Issue: File Upload Verification

File uploads may return HTTP 200 but files don't appear in the design version. After uploading:
1. Call `mcp__domo-publish__procode_design_list` to verify files are present
2. If files are missing, try: delete the design version, create a new one, and re-upload
3. If still failing after 2 attempts, report the issue — do not loop endlessly

**8b. Deploy to Page:**
Use the compound tool to place the app on a Domo page in one step:
```
procode_deploy_to_page(design_id: "{designId}", page_title: "My App Page", card_size: "full")
```
This tool handles: find/create page → create app card → set card size. Returns `page_url` and `app_url` for verification.

If you need to add to an existing page by ID:
```
procode_deploy_to_page(design_id: "{designId}", page_id: 12345, card_title: "My App", card_size: "full")
```

**8c. Confirm Deployment & Dataset Bindings:**
Verify the new version appears in Domo:
```
procode_design_list()
```
Find your app by name and confirm the latest version matches what you just published.

After card creation, verify dataset bindings are active — not just that the card exists:
```
app_card_list(page_id: {pageId})
```
Check the response for your card. Confirm `datasetsMapping` or `mapping` entries match the datasets in your manifest. If bindings are empty or missing, the app will load but `domo.get()` calls will return nothing — the app renders blank with no errors.

**8d. QA Screenshot (if QA tools available):**

> **IMPORTANT: Always screenshot the PAGE view, not the card detail view.** Custom apps in card detail view render inside a cross-origin iframe (`domoapps.prod5.domo.com`), which Playwright cannot capture — the app area will appear blank. Page view (`/page/{pageId}`) renders the app inline without this issue.

```
1. qa_domo_login(instance, username, password)
2. qa_domo_page_navigate(instance, page_id: "<page-id>")  // Use page view, NOT card detail
3. qa_screenshot(name: "post-deploy", full_page: true)
4. qa_get_console_logs(level: "error")
```

**8e. Honesty Gate — Screenshot Verdict:**

> **CRITICAL: A blank screenshot is a FAILURE, not an unknown.** If every QA screenshot shows a blank white page, an error message, or empty content where the app should be — report it as **DEPLOY FAILED**. Do NOT declare success and tell the user to "verify manually." The screenshots ARE your verification. Specific rules:
>
> - **All screenshots blank/white** → FAIL. The app is broken.
> - **"Permission denied" or "page does not exist"** → FAIL. Card/page linkage is broken.
> - **App chrome visible but content area empty** → FAIL. Data bindings may be broken.
> - **Only the Domo page header visible, no app content** → FAIL. Cross-origin iframe issue — retry with page-level screenshot. If still blank, FAIL.
> - **App content visible with data** → PASS.
>
> "I can't see inside the iframe" is NOT the same as "it works." If you cannot confirm the app renders with data, the status is FAILED, not COMPLETE.

**8f. Error Handling & Escalation:**
If console errors are found or the screenshot shows issues:
1. Diagnose the error from console logs
2. Fix inline if it's a simple issue (typo, missing import, wrong alias)
3. Re-publish and re-verify (repeat 8a-8f)

> **ESCALATION RULE: If QA fails twice, STOP.** Do not attempt a third publish-and-hope cycle. Instead:
> 1. Invoke the **procode-app-fixer** skill — it has a systematic diagnostic workflow
> 2. Let the fixer identify the root cause before making more changes
> 3. Only resume building after the fixer confirms the issue is resolved
>
> Repeated publish-screenshot-fix loops without diagnosis waste time and mask root causes. Two failures = the problem is structural, not a typo.

---

## Template Reference

### Vanilla Template Files

| File | Purpose |
|------|---------|
| `templates/vanilla/manifest.json` | App configuration and dataset mappings |
| `templates/vanilla/index.html` | HTML structure with ryuu.js SDK (mandatory), Phoenix CDN |
| `templates/vanilla/app.js` | Application logic — data fetching, chart rendering |
| `templates/vanilla/app.css` | Styling — responsive layout, Domo-compatible styles |
| `templates/vanilla/thumbnail.png` | Default 300x300 app thumbnail (Domo blue) — required for card placement |

### React Template Files

| File | Purpose |
|------|---------|
| `templates/react/manifest.json` | App configuration and dataset mappings |
| `templates/react/index.html` | HTML entry point with ryuu.js SDK (mandatory) and Vite dev entry (`<script type="module" src="/src/index.tsx">`) |
| `templates/react/package.json` | Dependencies (React, Vite, TypeScript) |
| `templates/react/vite.config.ts` | Vite build configuration for Domo deployment |
| `templates/react/src/index.tsx` | React entry point with ErrorBoundary — crashes show red error banner, never blank white page |
| `templates/react/src/App.tsx` | Main application component with data fetching example |
| `templates/react/thumbnail.png` | Default 300x300 app thumbnail (Domo blue) — required for card placement |

---

## Common Deployment Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| **App loads but no data** | App renders HTML but all data calls fail / show empty | **#1 cause:** manifest uses `"datasetsMapping"` instead of `"mapping"`. `domo publish` silently ignores API-format keys. Fix: use `"mapping"`, `"collections"`, `"packages"` |
| **App shows manifest JSON** | Page displays raw JSON instead of the app | `"fileName"` in manifest is set to `"manifest.json"` instead of `"index.html"`. Fix: set `"fileName": "index.html"` (or `"dist/index.html"` for React) |
| `domo` is undefined | Console error: `domo is not defined` | Missing ryuu.js CDN include. Add `<script src="https://unpkg.com/ryuu.js"></script>` to `index.html` before your app script. This should ALWAYS be present in every Pro-Code app. |
| `domo publish` fails | CLI error about missing manifest | Ensure `manifest.json` exists at project root |
| App shows blank page | White screen, no errors | Check `fileName` in manifest points to the correct HTML file |
| "Cannot read properties of undefined" | Console error on data access | Dataset not mapped in manifest, or alias mismatch |
| Charts don't render | Empty chart container | Verify Phoenix CDN loads, check data format matches chart expectations |
| App works locally but not in Domo | Various errors | Replace direct `fetch()` with `domo.get()`. Domo apps run in an iframe with different security context |
| `confirm()` / `alert()` / `prompt()` blocked | Console: "Ignored call to 'confirm()'. The document is sandboxed, and the 'allow-modals' keyword is not set." | Domo's iframe sandbox does NOT allow native browser modals. Use a custom HTML/CSS modal overlay instead (see Sandbox Restrictions below) |
| Style conflicts | Domo UI styles bleeding into app | Use CSS specificity or CSS modules. Prefix all class names |
| **Manifest rewritten after publish** | After `domo publish`, manifest.json contains `datasetsMapping` instead of `mapping`, `collectionsMapping` instead of `collections`, and an unwanted `fileName` key | The Domo CLI rewrites manifest.json with API-format keys. Run the Post-Publish Manifest Normalization step (8a-fix) after every publish to restore correct keys |
| **JS module MIME type rejection** | Blank page, console: "Failed to load module script" or MIME type error | Domo CDN serves `.js` as `application/octet-stream`. Browsers reject `type="module"` scripts without proper MIME. Fix: build with `format: 'iife'` in Vite config, remove `type="module"` from script tags |
| **"Root element not found"** | Console error on load, blank page | IIFE scripts in `<head>` execute before DOM exists. Fix: move `<script>` tag to bottom of `<body>` with `defer` attribute |
| **Build in dist/ not served** | Blank page, Domo can't find entry file | Domo publishes from project root. If Vite builds to `dist/`, the `fileName` must be `"dist/index.html"` OR configure Vite to build to root (`outDir: '.'`). Preferred: build to root so all files are siblings |
| **cdn.domo.com/domo.js returns 403** | App loads but SDK unavailable, `domo` undefined | Domo CDN has access restrictions. Use `https://unpkg.com/ryuu.js` instead — same SDK, publicly hosted, no auth. NEVER use `cdn.domo.com/domo.js` |
| **Empty JS bundle (0 KB)** | Blank page after build, no errors | React template missing `index.html` with Vite dev entry point (`<script type="module" src="/src/index.tsx">`). Without it, Vite has nothing to bundle. Copy `index.html` from template |
| **Card creation fails: missing thumbnail** | `app_card_create` errors, design can't be placed on page | Design has no `thumbnail.png`. Add a 300x300 PNG to the project root before publishing. Template includes a default |

---

## Sandbox Restrictions — No Native Modals

Domo Pro-Code apps run inside a sandboxed iframe **without the `allow-modals` permission**. This means `confirm()`, `alert()`, and `prompt()` are completely blocked and will silently fail with:

```
Ignored call to 'confirm()'. The document is sandboxed, and the 'allow-modals' keyword is not set.
```

**You MUST use a custom modal instead.** Never use `confirm()`, `alert()`, or `prompt()` in any Pro-Code app.

### Custom Confirm Modal Pattern (Vanilla)

```html
<!-- Add to index.html -->
<div id="confirm-modal" class="modal-overlay" style="display:none">
  <div class="modal-box">
    <p id="confirm-message"></p>
    <div class="modal-actions">
      <button id="confirm-cancel" class="btn-cancel">Cancel</button>
      <button id="confirm-ok" class="btn-confirm">Confirm</button>
    </div>
  </div>
</div>
```

```css
/* Add to app.css */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-box {
  background: #fff; border-radius: 8px; padding: 24px; max-width: 400px; width: 90%;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel { padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; }
.btn-confirm { padding: 8px 16px; border: none; border-radius: 4px; background: #0090CF; color: #fff; cursor: pointer; }
```

```javascript
// Add to app.js — drop-in replacement for confirm()
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-message').textContent = message;
    modal.style.display = 'flex';
    document.getElementById('confirm-ok').onclick = () => { modal.style.display = 'none'; resolve(true); };
    document.getElementById('confirm-cancel').onclick = () => { modal.style.display = 'none'; resolve(false); };
  });
}

// Usage: replace confirm() with await showConfirm()
// BEFORE: if (confirm('Delete this item?')) { ... }
// AFTER:  if (await showConfirm('Delete this item?')) { ... }
```

### Custom Alert Modal Pattern (Vanilla)

```javascript
function showAlert(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-cancel').style.display = 'none';
    modal.style.display = 'flex';
    document.getElementById('confirm-ok').textContent = 'OK';
    document.getElementById('confirm-ok').onclick = () => {
      modal.style.display = 'none';
      document.getElementById('confirm-cancel').style.display = '';
      document.getElementById('confirm-ok').textContent = 'Confirm';
      resolve();
    };
  });
}
```

> **React apps:** Use a `<ConfirmModal>` component with state. Same principle — render a styled overlay instead of calling `confirm()`.

---

## Migrating Standalone Apps to Pro-Code

When converting an existing HTML/JS app (one that runs locally or uses direct API calls) into a Domo Pro-Code app, apply these transformations:

### Migration Checklist

| # | What to Change | Before (Standalone) | After (Pro-Code) |
|---|---------------|---------------------|-------------------|
| 1 | **Data access** | `fetch('/api/query/v1/execute/{datasetId}', { method: 'POST', body: JSON.stringify({ sql }) })` | `domo.get('/data/v1/{alias}?sql=' + encodeURIComponent(sql))` |
| 2 | **Dataset references** | Hardcoded dataset UUID in code | Manifest alias in `mapping[]`, alias string in code |
| 3 | **Authentication** | Developer token in headers, instance URL in config | None — Domo handles auth inside the iframe |
| 4 | **SDK include** | Not needed (direct API) | `<script src="https://unpkg.com/ryuu.js"></script>` REQUIRED |
| 5 | **SQL functions** | Full SQL dialect available | Restricted subset — see Pro-Code SQL Limitations above |
| 6 | **CORS/proxy** | Proxy server or CORS headers needed | Not needed — `domo.get()` handles proxying |
| 7 | **Environment config** | `.env` files, config objects with instance/token | Remove all — no credentials in Pro-Code apps |

### Migration Steps

1. **Create a copy** — Never modify the original app. Create a `-domo` suffixed copy (e.g., `app-2-domo/`).

2. **Remove credentials** — Delete all hardcoded tokens, instance URLs, `.env` files, and proxy server files. Pro-Code apps authenticate through the Domo iframe automatically.

3. **Add ryuu.js** — Add `<script src="https://unpkg.com/ryuu.js"></script>` to `index.html` BEFORE any app scripts.

4. **Create manifest.json** — Map each dataset the app uses:
   ```json
   {
     "name": "My App",
     "version": "1.0.0",
     "size": { "width": 1, "height": 1 },
     "fullpage": true,
     "mapping": [
       { "dataSetId": "uuid-from-target-instance", "alias": "myData", "fields": [] }
     ]
   }
   ```

5. **Replace data access layer** — Replace all `fetch()` / `XMLHttpRequest` calls with `domo.get()` / `domo.post()`:
   ```javascript
   // BEFORE: Direct API call with auth
   const response = await fetch(`https://instance.domo.com/api/query/v1/execute/${datasetId}`, {
     method: 'POST',
     headers: { 'X-DOMO-Developer-Token': token, 'Content-Type': 'application/json' },
     body: JSON.stringify({ sql })
   });
   const data = await response.json();

   // AFTER: Pro-Code pattern (no auth, no instance URL, uses alias)
   const data = await domo.get('/data/v1/myData?sql=' + encodeURIComponent(sql));
   ```

6. **Fix SQL compatibility** — Audit all SQL queries for unsupported functions (see Pro-Code SQL Limitations). Replace server-side functions with client-side equivalents.

7. **Verify dataset exists on target instance** — The dataset UUID must exist on the Domo instance where the app will be published. If migrating from a different instance, find or create the equivalent dataset on the target.

8. **Handle response format differences** — The `/data/v1/{alias}` endpoint returns an array of objects, while the standalone SQL API returns `{ columns: [...], rows: [...] }`. Your data transformation code may need to handle both formats for robustness:
   ```javascript
   // Handle both response formats
   let rows;
   if (Array.isArray(rawData)) {
     rows = rawData; // Pro-Code format: array of objects
   } else if (rawData.columns && rawData.rows) {
     // Standard SQL API format: transform to objects
     rows = rawData.rows.map(row => {
       const obj = {};
       rawData.columns.forEach((col, i) => obj[col] = row[i]);
       return obj;
     });
   }
   ```

### Common Migration Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Dataset UUID from wrong instance | App loads but data calls return 404/empty | Verify UUID exists on target instance using `dataset_search` |
| `fetch()` calls left in code | CORS errors in browser console | Replace ALL `fetch()` with `domo.get()`/`domo.post()` |
| `YEAR()` or date functions in SQL | Query returns error or empty results | Extract dates client-side (see SQL Limitations) |
| Response format mismatch | `undefined` errors on data access | Handle both array-of-objects and columns/rows formats |
| Dev proxy server included | Extra files deployed, potential errors | Remove `proxy-server.js`, `server.js`, `.env` from deploy copy |
| Token/instance still referenced | Console warnings or failed init | Remove all credential references from code |

---

## Reference Guides

For deep-dive patterns, load these references as needed:

| Reference | When to Load |
|-----------|-------------|
| `references/toolkit-api-patterns.md` | Building data access layer, AppDB integration, user identity |
| `references/redux-patterns.md` | Setting up state management in React apps |
| `references/testing-patterns.md` | Writing tests for Domo app components and services |
| `references/deployment-guide.md` | Multi-environment deployment, CI/CD setup |
| `references/schema-first-workflow.md` | Schema export workflow, file format, offline development |
| `references/pdca-publish-checklist.md` | Pre- and post-publish verification checklist |

---

## Guardrails (source-code-validated)

### CRITICAL — Manifest Format (Data Binding)

> **The #1 cause of "app loads but shows no data" is using API field names instead of CLI field names in manifest.json.**

- **Use `"mapping"` NOT `"datasetsMapping"` in manifest.json.** The `domo publish` CLI expects `"mapping"`. The Domo API returns this as `"datasetsMapping"` — but that is the API read format, NOT the manifest write format. If you use `"datasetsMapping"`, `domo publish` silently ignores it and your dataset bindings won't register. The app will load but all `domo.get('/data/v1/alias')` calls will fail.
- **Use `"collections"` NOT `"collectionsMapping"` in manifest.json.** Same issue — `"collectionsMapping"` is the API read format. The CLI expects `"collections"`.
- **Use `"packages"` NOT `"packagesMapping"`.** Same pattern for Code Engine package bindings.
- **`"fileName"` must point to your HTML entry file** (e.g. `"index.html"` or `"dist/index.html"` for React builds). NEVER set this to `"manifest.json"` — Domo would try to serve the JSON as your web page, resulting in a blank/broken app.

### Domo CDN Constraints (React/Vite apps)

- **ALWAYS use `format: 'iife'` in Vite build config.** Domo's CDN serves `.js` files as `application/octet-stream`. Browsers reject ESM `type="module"` scripts without proper MIME type. IIFE format works universally.
- **NEVER use `type="module"` on script tags.** Same MIME type issue. Remove any `type="module"` attributes from `index.html`.
- **Place script tags at bottom of `<body>` WITHOUT `defer`.** IIFE scripts must execute synchronously after ryuu.js loads. Do NOT use `defer` — it can cause the app script to run before `domo` is available from ryuu.js. The Vite template includes a `domoScriptFix` plugin that strips `type="module"`, `defer`, and `crossorigin` from the built HTML.
- **Build to project root, not `dist/`.** Use `outDir: '.'` and `emptyOutDir: false` in Vite config. This keeps `manifest.json`, `index.html`, and `assets/` as siblings, matching what `domo publish` expects.

### SDK & Libraries

- **Always use `domo.get()`/`domo.post()` for API calls.** 52% of apps use `domo.get()`, 30% use `domo.post()`. Direct `fetch()` calls will fail due to CORS in the Domo iframe.
- **ALWAYS include ryuu.js in every Pro-Code app.** Add `<script src="https://unpkg.com/ryuu.js"></script>` to `index.html` before your app script. This is the Domo SDK that provides the `domo` global for data access. While Domo's iframe runtime may inject it in some contexts, the CDN include is REQUIRED for reliable operation across all deployment scenarios (direct access, embedded cards, `domo dev` local development). Never omit it. Use exactly `https://unpkg.com/ryuu.js` (no `@latest/dist/...` path — that may not resolve).
- **NEVER use `cdn.domo.com/domo.js`.** Domo's CDN has access restrictions that return 403 Forbidden depending on instance tier and request origin. Always use `https://unpkg.com/ryuu.js` — same SDK, publicly hosted, no auth required, works in all contexts.
- **Use Chart.js for charts.** 52% of apps use Chart.js — it's the de facto standard. Load via CDN: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`.
- **Use Tailwind CSS for styling.** 37% of apps use it. Load via CDN: `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`.

### Data Access

- **Map datasets in manifest.json before using them.** You cannot access a dataset that is not mapped.
- **Do not use DQL in manifest mappings.** Zero production apps use DQL filters. Use SQL queries via `domo.get('/data/v1/alias?sql=...')` instead.
- **Leave `fields` arrays empty or omit them entirely.** Production apps universally use empty fields arrays — the manifest `"fields": []` means "pass all columns." Do NOT populate field names; they are not used by the runtime and may cause binding issues. Filter columns in your app code with SQL queries or client-side logic.
- **Default to syncEnabled: false for collections.** 84% of production collections disable sync.
- **Use only STRING and DECIMAL types in collection schemas.** These are the only types used across 265 production collections.
- **Keep collection schemas small (2-5 columns).** This is the production norm.
- **Wrap AppDB document content in `{ content: ... }`.** This is the required format for POST/PUT to datastores.

### Schema-First Development

- **Always export schemas before writing data access code.** Use `dataset_schema_export` to cache schemas to `.schema/` in the app directory. This prevents column name typos and type mismatches.
- **Reference `.schema/` files when writing `domo.get()` calls.** Use exact column names from the schema files, not guesses or assumptions.
- **NEVER write `domo.get()` or `domo.post()` data access code without `.schema/` files present.** If schemas haven't been exported yet, stop and export them first.

### Sandbox Restrictions

- **NEVER use `confirm()`, `alert()`, or `prompt()`.** Domo's iframe sandbox blocks all native browser modals. They will silently fail. Always use a custom HTML/CSS modal overlay instead (see Sandbox Restrictions section above).

### Project Structure

- **Start with the minimal file structure.** 35% of production apps are just `app.js + index.html + manifest.json + thumbnail.png`. Add `app.css` only when needed (27% of apps). Start with vanilla for simple/medium apps (84% of production).
- **Version your manifest.** Bump the version field on each publish so you can track deployments.
- **Test in Domo context, not just localhost.** The Domo iframe adds authentication, CORS proxying, and sandbox restrictions that `localhost` does not have.

---

## MCP Servers Required

- **domo-datasets** — for discovering dataset UUIDs and schemas
- **domo-appdb** — for setting up AppDB collections (if the app uses persistent storage)
- **mcp-qa-testing** — for post-deployment verification

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"app"`
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
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: app name, design ID, card ID, template type (vanilla/React), features implemented, deployment URL, version.

## Related Skills

- **App Orchestrator** (Build) — routes to this skill based on app complexity
- **AppDB Manager** (Build) — sets up persistent storage for apps
- **Code Engine Builder** (Build) — builds backend functions that apps can call
- **App Tester** (Build) — verifies deployed apps work correctly
- **ProCode Security Review** (Build) — OWASP security audit gate before deploy (Step 7f)
