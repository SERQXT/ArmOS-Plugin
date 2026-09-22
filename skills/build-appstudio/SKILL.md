---
name: build-appstudio
tier: 1
description: "Build an App Studio app end-to-end: create the app, add tabs, place cards on each tab, position the layout, verify the result. Use for any 'create App Studio app', 'build App Studio dashboard', or 'assemble a data app with tabs and cards' request. NOT for Pro-Code Custom Apps — use procode-app-build for those. NOT for staging-page imports or browser-driven flows."
maturity: alpha
audience: [orchestration, code]
---

# Build App Studio — Direct API Pipeline

Builds Domo App Studio apps end-to-end using the `appstudio_create`, `appstudio_page_add`, `appstudio_layout`, and `card_create_full` REST-backed MCP tools. Cards are created and bound to the app's view pages at creation time (via `card_create_full(page_id=X)`); the layout is positioned via `appstudio_layout`; the result is verified via `appstudio_get_full`. No staging page, no dashboard import, no browser automation.

## Shared Knowledge

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `reference/appstudio-api-reference.md` | Full API surface: 113 endpoints, action chains, save/write-lock protocols | Before starting — the authoritative API reference |
| `reference/appstudio-forms-reference.md` | Forms API: field types, CREATE chain, request/response schemas | When adding forms to an app |
| `reference/appstudio-workflows-reference.md` | Workflow widget binding, WORKFLOW_START buttons, DML action types | When adding workflow buttons |
| `reference/rooster-dml-templates.md` | DML templates for all rooster component types | When creating rooster components |
| `reference/rooster-component-decision-matrix.md` | Component type decision tree (rooster vs KPI vs form vs workflow) | At design time |
| `../dashboard-builder/reference/output-type-guide.md` | App Studio build strategy, layout control | Before starting |
| `../dashboard-builder/reference/lessons-learned.md` | Layout gotchas, orphan cleanup, virtualAppendix | Before and after layout |
| `../dashboard-builder/reference/dashboard-review-criteria.md` | Visual quality checks | After layout |

## Triggers

- "build app studio app"
- "create App Studio app"
- "build-appstudio"
- Invoked by `dashboard-builder` Step 8.5 when `output_type = app_studio`

---

## Prerequisites

1. **Card specifications exist** — either from dashboard-builder's card-spec-designer or user-provided
2. **Dataset identified** — know which dataset(s) the cards use
3. **Layout plan** — know card positions on 60-unit grid (from dashboard-architect blueprint)

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| `app_name` | User or blueprint title | Yes |
| `card_specs` | Card specifications (from card-spec-designer or blueprint) | Yes |
| `layout_positions` | Grid positions for each card (from blueprint) | Yes |
| `dataset_id` | Primary dataset ID | Yes |
| `instance` | Domo instance name | Yes (from context) |

---

## Execution Flow

### Step 1: Create App Studio App

**Tool:** `appstudio_create`

```
appstudio_create(title: "CMO Executive Marketing Performance")
```

**Response includes:**
- `data_app_id` — the App Studio app ID
- `view_page_id` — the auto-created view page ID (this is where cards go)
- `app_url` — direct link to the app

**Save both IDs** — you need `view_page_id` for all subsequent steps.

---

### Step 2: Create Cards on the View Page

**Tool:** `card_create_full` (from card-builder skill)

Create each card using `card_create_full` with `page_id` set to the `view_page_id` from Step 1.

```
card_create_full(
  title: "Total Media Spend",
  dataset_id: "7a738f6d-...",
  chart_type: "single_value",
  columns: [...],
  page_id: <view_page_id>   ← THIS IS THE KEY: use view_page_id, not a staging page
)
```

Create all cards, collecting their card IDs. Run `card_render_check` on each to verify they render.

**If beast modes are needed:** Create them first with `beast_mode_create`, then reference the formula IDs in the card columns.

---

### Step 3: Position Cards with Layout

**Tool:** `appstudio_layout`

After ALL cards are created on the view page, position them in a single call:

```
appstudio_layout(
  view_page_id: <view_page_id>,
  positions: [
    { card_id: 123, x: 0,  y: 0,  width: 12, height: 8 },
    { card_id: 456, x: 12, y: 0,  width: 12, height: 8 },
    { card_id: 789, x: 0,  y: 10, width: 30, height: 22 },
    ...
  ]
)
```

This tool:
- Reads the existing layout (App Studio view pages already have one)
- Sets `virtualAppendix=false` on all items (enables positioning)
- Positions each card per your specifications
- Hides orphan content items (prevents ghost boxes)

**Grid:** 60 units wide. See blueprint for exact positions.

---

### Step 2b: Add Forms (if needed)

If the blueprint includes a data entry form, invoke the **form-builder** skill:

```
→ form-builder(app_id, view_page_id, layout_id, field_requirements)
```

Form-builder handles: form creation (POST /api/forms/v2), hydration, FORM_MODAL button card creation, and page assignment. See `reference/appstudio-forms-reference.md` for the complete 7-step action chain.

**When to add forms:** Any time the app needs data collection — intake forms, submission forms, feedback forms, order entry. Forms auto-create a backing Domo dataset for submissions.

---

### Step 2c: Add Workflow Buttons (if needed)

If the blueprint includes workflow trigger buttons, use **workflow-builder** for widget binding:

1. Create the workflow widget: `workflow_widget_create(model_id, model_version, app_id, view_page_id)` → returns `widgetId`
2. Create a rooster card with a `WORKFLOW_START` DML button referencing the `widgetId`
3. Assign to page and position in layout

See `reference/appstudio-workflows-reference.md` for the complete 7-step action chain and exact DML structure.

**When to add workflow buttons:** Any time the app needs one-click automation triggers — approval flows, data processing, notifications. Requires a pre-existing Domo Workflow model.

---

### Step 2d: Save the App

After creating all cards (KPI, rooster, forms, workflow buttons), execute the **Save Protocol**:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | PUT | `/api/content/v1/dataapps/:id/persistSettings` | Persist filter/interaction settings |
| 2 | PUT | `/api/content/v1/dataapps/:id?includeHiddenViews=true` | Full app config update |
| 3 | PUT | `/api/content/v1/dataapps/:id/navigation/reorder` | Navigation order |
| 4 | PUT | `/api/content/v4/pages/layouts/:id` | Page layout with component positions |

The `appstudio_layout` tool in Step 3 handles the layout PUT. Steps 1-3 of the save protocol are handled by the app update flow. See `reference/appstudio-api-reference.md` "Save Protocol" for full request bodies.

**Write Lock Protocol:** While editing, maintain a write lock:
- **Acquire:** `PUT /api/content/v4/pages/layouts/:id/writelock` — on page open
- **Heartbeat:** `PUT /api/content/v4/pages/layouts/:id/writelock/heartbeat` — every ~10 seconds
- **Release:** `DELETE /api/content/v4/pages/layouts/:id/writelock` — on close

The `appstudio_layout` tool manages write locks internally. Only manage them manually when doing direct layout API calls.

---

### Step 4: Set View Title

**Tool:** Use the Domo API directly via `appstudio_list` to verify, or the view title is set from the app name.

The app is now live at the URL from Step 1.

---

### Step 5: Verify & Report

1. Report the final state:

```
## App Studio App Built

**App:** [App Name] (ID: [data_app_id])
**URL:** [app_url]
**View Page:** [view_page_id]
**Cards:** [N] created and positioned

| # | Card Title | Card ID | Position | Status |
|---|-----------|---------|----------|--------|
| 1 | Total Media Spend | 123 | 0,0 12×8 | ✓ |
| 2 | ... | ... | ... | ✓ |
```

2. If any cards failed to render, attempt to fix using the PDCA pattern from card-builder.

---

## How This Works (Technical)

App Studio apps have a different architecture than dashboards:

1. `POST /api/content/v1/dataapps` creates an app with an auto-created **view page**
2. The view page already has a layout with `virtualAppendix: true` on all template items
3. Cards are added to the view page via `card_create_full(page_id=view_page_id)`
4. The layout API can still write to view pages — setting `virtualAppendix: false` unlocks positioning
5. No staging page, no import step, no browser automation needed

**Why not import?** The synchronous import endpoint (`/views/import/synchronous`) returns 400 on many instances. The async endpoint (`/views/import`) returns 200 but often doesn't complete. Direct card creation is reliable.

**Why not layout_convert?** App Studio view pages reject `layout_convert` with 400. But they already HAVE a layout — just read it directly with `layout_get` and modify it.

---

---

## Rooster Component Cards (Non-KPI App Studio Components)

App Studio's visual components — Gallery, List, FilterList, Details, Banner, and FormComponent — are **rooster cards**, not KPI cards. They use a different creation pathway.

### When to use rooster vs KPI cards

| Use Case | Card Type | Tool |
|----------|-----------|------|
| Charts, metrics, tables, summary numbers | KPI | `card_create_full` |
| Gallery, List, FilterList, Details, Banner | Rooster | `rooster_card_create` + `rooster_card_bind` |
| Text / rich text / headers inside a view | Notebook | `card_create_full` with notebook type |

### Rooster card creation flow

**Step 2a (if building rooster components):**

1. **Create the card** with empty or skeleton DML:

```
rooster_card_create(
  title: "Store Gallery",
  dml: "{\"dml\":\"<dml version=\\\"1\\\">\\n  <param name=\\\"@dataSource\\\" type=\\\"datasource\\\" label=\\\"DataSet\\\"/>\\n</dml>\\n\",\"params\":{},\"templateType\":\"gallery\",\"templateKey\":\"gallery-image-button\"}"
)
```

Returns `card_id` (numeric) — this is the ID used in layout positioning.

2. **Validate the DML** (optional but recommended before binding):

```
appstudio_jsql_parse(sql: "SELECT `columnName` FROM `__dmlParam@dataSource` LIMIT 1")
```

3. **Bind the card** to a real dataset with full DML params:

```
rooster_card_bind(
  card_id: <card_id>,
  title: "Store Gallery",
  dml: "<full DML JSON string with dataset columns bound>"
)
```

4. **Add card to page** using the existing page placement flow (same as KPI cards — the layout API handles them identically).

### DML templates

DML for each component type is in `armos/armos-radar/knowledge/` skill files:
- `skill-appstudio-gallery.md` — Gallery component
- `skill-appstudio-list.md` — List component  
- `skill-appstudio-filterlist.md` — FilterList component
- `skill-appstudio-banner.md` — Banner component
- `skill-appstudio-details.md` — Details component

The `metadata.dml` field is a **JSON-encoded string** (not a raw object) containing:
```json
{
  "dml": "<dml version=\"1\">...</dml>",
  "params": { /* bound column values */ },
  "templateType": "gallery",
  "templateKey": "gallery-image-button",
  "useSampleData": false
}
```

**Critical:** The `params` object must include `templateType` and `templateKey` or the card will return 403 on load. See memory: `feedback_rooster_dml_structure.md`.

---

## Themes and Color Palettes

### List available themes

```
appstudio_theme_list()
```

Returns `{ default: [...themes], saved: null|[...custom] }` where each theme has a `name` field (e.g. `"Clarion"`, `"Ember"`, `"Aquatic"`).

### Apply a theme

```
appstudio_theme_apply(app_id: <data_app_id>, theme_name: "Clarion")
```

Internally: clears per-view style overrides → reads app → sets `theme.name` → writes app back.

### List color palettes

```
appstudio_palette_list()
```

Returns available chart color palettes with `id` and `type` fields.

---

## Tool Mapping

| Step | Tool | MCP Server |
|------|------|------------|
| Create app | `appstudio_create` | domo-pages |
| Create KPI cards | `card_create_full` | domo-pages |
| Create rooster components | `rooster_card_create` → `rooster_card_bind` | domo-pages |
| Validate DML SQL | `appstudio_jsql_parse` | domo-pages |
| Create beast modes | `beast_mode_create` | domo-pages |
| Render check | `card_render_check` | domo-pages |
| Position layout | `appstudio_layout` | domo-pages |
| List apps | `appstudio_list` | domo-pages |
| List themes | `appstudio_theme_list` | domo-pages |
| Apply theme | `appstudio_theme_apply` | domo-pages |
| List palettes | `appstudio_palette_list` | domo-pages |
| Create form | `appstudio_form_create` | domo-pages |
| Get page context | `page_analyzer_get` | domo-pages |

## MCP Servers

- **domo-pages** — all App Studio, card, and layout operations
- **domo-datasets** — dataset discovery and profiling (for card-builder)

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
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: App Studio app name, source page ID, published app ID, import status, any configuration adjustments.

## Related Skills

- **Dashboard Builder** (Build) — the parent orchestrator that invokes this skill at Step 8.5
- **Card Builder** (Build) — creates individual cards (Step 2)
- **Card Spec Designer** (Build) — designs card specifications
- **Dashboard Architect** (Compass Core) — designs the blueprint with layout positions
