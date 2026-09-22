# App Studio — API Reference

This reference documents the complete App Studio REST API surface captured from live Domo network traffic. Used by build-appstudio, form-builder, and workflow-builder skills.

---

## Key ID Relationships

| Entity | ID Field | Format | Notes |
|--------|----------|--------|-------|
| App | `dataAppId` | Numeric (e.g. `1074388577`) | Primary identifier for all app operations |
| View/Page | `viewId` / `landingViewId` | Numeric (e.g. `60754997`) | Also used as `pageUrn` in layouts |
| Layout | `layoutId` | Numeric (e.g. `1990293829`) | One layout per page; contains component positions |
| Card | Card URN | Numeric (e.g. `872995420`) | Components are Domo cards placed on layouts |
| Stack | Stack ID | Numeric | Groups cards on a page |

## URL Pattern

Editor URL: `/app-studio/{dataAppId}/pages/{viewId}/edit`

Note: On initial creation, Domo uses staging IDs (`/app-studio/100/pages/110/edit?newApp=true`) until the first Save, after which the URL updates to real IDs.

---

## App Lifecycle

### Create

**Trigger:** Click `+ Create` on App Studio listing, select theme, click Save.

**API Sequence (6 steps):**

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/content/v1/dataapps` | Create the app (fires on first Save) |
| 2 | PUT | `/api/content/v1/dataapps/:id/persistSettings` | Set filter/variable persistence |
| 3 | PUT | `/api/content/v1/dataapps/:id` | Full app update (title, views, nav config) |
| 4 | PUT | `/api/content/v4/pages/layouts/:id/writelock` | Acquire page edit lock |
| 5 | PUT | `/api/content/v1/dataapps/:id/navigation/reorder` | Set default nav items |
| 6 | PUT | `/api/content/v4/pages/layouts/:id` | Save empty page layout |

**POST `/api/content/v1/dataapps`** — Create App

Request:
```json
{
  "iconDataFileId": 0,
  "type": "app",
  "title": "App title",
  "dataSourceId": null,
  "description": null,
  "navIconDataFileId": null,
  "enabled": true,
  "locked": false,
  "lastUpdated": null,
  "owners": [
    { "id": "11203081", "type": "USER", "displayName": "Alex Dengate" }
  ],
  "isOwner": true,
  "canEdit": true,
  "isFavorite": false,
  "showNavigation": true,
  "showDomoNavigation": true,
  "showTitle": true,
  "showLogo": false,
  "navOrientation": "TOP",
  "userAccess": null,
  "theme": { "name": "Clarion", "chartColorPalette": { ... }, "cards": [ ... ] }
}
```

Response:
```json
{
  "dataAppId": 1074388577,
  "title": "App title",
  "description": null,
  "landingViewId": 60754997,
  "enabled": true,
  "views": [
    {
      "viewId": 60754997,
      "title": null,
      "viewOrder": 1,
      "visible": false,
      "view": { "pageId": 60754997, "owners": [...] }
    }
  ]
}
```

### Save Protocol (Recurring)

Every Save triggers this exact 4-step sequence:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | PUT | `/api/content/v1/dataapps/:id/persistSettings` | Persist filter/interaction settings |
| 2 | PUT | `/api/content/v1/dataapps/:id?includeHiddenViews=true` | Full app config update |
| 3 | PUT | `/api/content/v1/dataapps/:id/navigation/reorder` | Navigation order |
| 4 | PUT | `/api/content/v4/pages/layouts/:id` | Page layout with component positions |

Step 4 may fire once per page. In multi-page apps, multiple layout PUTs are observed.

**PUT `/api/content/v1/dataapps/:id/persistSettings`**

```json
{
  "persistFiltersEnabled": false,
  "persistInteractionsEnabled": false,
  "persistDateEnabled": false,
  "persistVariablesEnabled": false,
  "persistedColumns": [],
  "dataAppId": 1074388577
}
```

**PUT `/api/content/v4/pages/layouts/:id`** — Page Layout

```json
{
  "layoutId": 1990293829,
  "pageUrn": "1185947993",
  "printFriendly": true,
  "background": null,
  "isDynamic": true,
  "content": [],
  "standard": {
    "aspectRatio": 1.67,
    "width": 60,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "STANDARD",
    "template": []
  },
  "compact": {
    "aspectRatio": 1,
    "width": 12,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "COMPACT",
    "template": []
  },
  "hasPageBreaks": false,
  "style": null
}
```

The `content` array contains component placement when cards are added to the page.

### Write Lock Protocol

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/content/v4/pages/layouts/:id/writelock` | Acquire lock on page open |
| PUT | `/api/content/v4/pages/layouts/:id/writelock/heartbeat` | Keep-alive every ~10 seconds |
| DELETE | `/api/content/v4/pages/layouts/:id/writelock` | Release lock on close/navigate away |

Lock response:
```json
{
  "layoutId": 1990293829,
  "userId": 11203081,
  "lockTimestamp": 1775692751577,
  "lockHeartbeat": 1775692751577
}
```

### Layout Structure Reference

**PUT `/api/content/v4/pages/layouts/:id`** — requires write lock acquired first.

**The Appendix Problem:** When cards are added via `POST /api/content/v1/cards?pageId=`, Domo auto-creates content and template items with `virtualAppendix: true`. These render as an "Appendix" section below the canvas. To position cards correctly, **replace** the content and template arrays entirely — don't append.

**Critical Rules:**
1. `content`, `standard.template`, and `compact.template` must have the SAME items (same contentKeys, same count)
2. Every content item needs both `cardUrn` (string) AND `cardId` (number)
3. Replace arrays entirely — start fresh with only the cards you want on the canvas
4. No orphans — a card in content but not in template becomes an Appendix item
5. Standard grid is **60 units wide**, compact grid is **12 units wide**

**Content item fields (all required):**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `contentKey` | number | Sequential (1,2,3...) | Links content to template |
| `cardId` | number | Card ID | Numeric card identifier |
| `cardUrn` | string | Card ID as string | String card identifier |
| `type` | string | `"CARD"` | Always CARD |
| `hideTitle` | boolean | `false` | |
| `hideDescription` | boolean | `true` | |
| `hideFooter` | boolean | `true` | |
| `acceptFilters` | boolean | `true` | |
| `acceptDateFilter` | boolean | `true` | |

**Template item fields:**

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `"CARD"` |
| `contentKey` | number | Matches content item |
| `x` | number | X position (0-based, max 60 for standard) |
| `y` | number | Y position (0-based) |
| `width` | number | Width in grid units |
| `height` | number | Height in grid units |
| `virtualAppendix` | boolean | **Must be `false`** for positioned cards |
| `virtual` | boolean | `false` |

---

### Read

**GET `/api/content/v1/dataapps/:id`** — returns full app config (same schema as PUT body).

### Delete

**DELETE `/api/content/v1/dataapps/:id`**

---

## Pages & Navigation

**POST `/api/content/v1/dataapps/:id/views`** — adds a new page/view to the app.

**PUT `/api/content/v1/dataapps/:id/navigation/reorder`** — set navigation order.

Default navigation items on a new app:

```json
[
  {
    "dataAppId": "698520181",
    "entity": "HOME",
    "entityId": "home",
    "title": "Home",
    "description": "App Domo apps",
    "navOrder": 1,
    "visible": true,
    "icon": { "value": "home", "size": "DEFAULT" },
    "iconPosition": "LEFT"
  },
  {
    "dataAppId": "698520181",
    "entity": "VIEW",
    "entityId": "1185947993",
    "title": "Page 1",
    "navOrder": 2,
    "visible": true,
    "icon": { "value": "pages", "size": "DEFAULT", "phosphor": "Pages" },
    "iconPosition": "LEFT"
  },
  {
    "dataAppId": "698520181",
    "entity": "AI_ASSISTANT",
    "entityId": "ai_assistant",
    "title": "Domo.AI",
    "navOrder": 3,
    "visible": true,
    "icon": { "value": "domoai", "size": "DEFAULT", "phosphor": "Sparkle" },
    "iconPosition": "LEFT"
  }
]
```

Entity types: `HOME`, `VIEW` (page), `AI_ASSISTANT`.

---

## Themes & Branding

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/content/v1/dataapps/themes` | List all available themes |
| GET | `/api/content/v1/dataapps/themes/color-palettes` | Theme color palette definitions |
| GET | `/api/brandkit/v1/chartColorPalettes` | Global chart color palettes |
| GET | `/api/brandkit/v1/chartColorPalettes/APP/entityType/DATA_APP/id/:id` | App-specific chart palette |

Theme is embedded in the app config (POST/PUT to `dataapps/:id`) under the `theme` key. Contains `name`, `chartColorPalette`, and `cards[]` array with font colors, background colors, border radius, drop shadow, padding, accent colors -- all using reference tokens (e.g. `c60`, `f4`).

Available themes: Clarion, Impact, Essential, Obsidian, Midnight, Domo Classic, Saturated Brand, Subtle Brand, Domo Retro, Domo Neutral.

---

## Components (Cards)

Components in App Studio are Domo "cards" -- the same card system used in dashboards, extended with App Studio-specific controls and layout.

**POST `/api/content/v1/cards`** — create a new card/component.
**PUT `/api/content/v1/cards/:id`** — update card configuration.
**PUT `/api/content/v1/cards/bulk/pages`** — assign multiple cards to pages at once.

### Component Types (26)

Each type has a GET options endpoint at `/api/content/v1/cards/kpi/{badge_type}/options` returning the configuration schema.

#### Charts

| Badge Type | Component |
|-----------|-----------|
| `badge_donut` | Donut Chart |
| `badge_pie` | Pie Chart |
| `badge_vert_multibar` | Grouped Bar Chart |
| `badge_vert_stackedbar` | Stacked Bar Chart |
| `badge_vert_nestedbar` | Nested Bar Chart |
| `badge_horiz_stackedbar` | Horizontal Stacked Bar |
| `badge_line_stackedbar` | Line + Stacked Bar Combo |
| `badge_two_trendline` | Dual Trendline |
| `badge_xybubble` | Bubble / Scatter Chart |
| `badge_heatmap` | Heatmap |
| `badge_word_cloud` | Word Cloud |
| `badge_world_map` | World Map |
| `badge_filledgauge` | Filled Gauge |
| `badge_singlevalue` | Single Value / KPI |
| `badge_pop_bar_line` | Period-over-Period Bar+Line |
| `badge_pop_line_bar` | Period-over-Period Line+Bar |
| `badge_pop_bar_line_var` | Period-over-Period Variance |

#### Tables

| Badge Type | Component |
|-----------|-----------|
| `badge_basic_table` | Table |
| `badge_pivot_table` | Pivot Table |

#### Controls (Interactive Filters)

| Badge Type | Component |
|-----------|-----------|
| `badge_dropdown_selector` | Dropdown |
| `badge_checkbox_selector` | Checkbox |
| `badge_radio_selector` | Radio Button |
| `badge_date_selector` | Date Picker |
| `badge_range_selector` | Range Slider |
| `badge_slicer` | Slicer / Filter |

#### Text & Display

| Badge Type | Component |
|-----------|-----------|
| `badge_textbox` | Text Box / Rich Text |

### KPI / Analyzer System

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/content/v3/cards/kpi` | Create/configure KPI card definition |
| PUT | `/api/content/v3/cards/kpi/:id` | Update specific card KPI config |
| PUT | `/api/content/v3/cards/kpi/definition` | Set field definitions (x-axis, y-axis, series) |
| PUT | `/api/content/v3/cards/kpi/values` | Set aggregated values |
| PUT | `/api/content/v3/cards/kpi/minavgmax` | Min/avg/max summary stats |
| PUT | `/api/content/v3/cards/kpi/render/preview` | Generate chart preview |
| GET | `/api/content/v1/cards/kpi/palette` | Available chart color palettes |
| PUT | `/api/content/v1/cards/rooster/query` | Beast Mode / calculated field query execution |
| PUT | `/api/content/v1/cards/kpi/:id/render` | Render card thumbnail preview |

### Variable Controls

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/content/v1/cards/variable/controls/list` | Set control-to-variable bindings |
| PUT | `/api/content/v1/cards/variable/controls/default/list` | Set default values for variable controls |

---

## Data Sources & Queries

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/data/ui/v3/datasources/search` | Search for datasets to connect |
| GET | `/api/data/v3/datasources/:id` | Get datasource metadata |
| GET | `/api/data/v3/datasources/:id/schema` | Get columns and types |
| GET | `/api/query/v1/datasources/:id/schema/indexed` | Indexed schema for query builder |
| GET | `/api/content/v1/datasources/:id` | Alternative datasource metadata |
| GET | `/api/content/v1/dataapps/:id/dataSourceDetails` | All datasources connected to this app |
| POST | `/api/query/v1/jsql` | Execute a JSQL query (card data rendering) |
| POST | `/api/query/v1/functions/list` | List available JSQL/Beast Mode functions |
| POST | `/api/query/v1/functions/list/id` | Function details by ID |
| GET | `/api/data/v1/providers` | Available data providers |

---

## Observed Action Chains

These are the exact API call chains observed during manual App Studio exploration (856 calls captured). Each chain represents a complete user action and must be replicated in sequence for programmatic operation.

### Chain: Add Component to Page

When a user drags a chart/table/control onto the canvas:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | PUT | `/api/content/v3/cards/kpi` | Create the KPI card definition |
| 2 | GET | `/api/content/v1/cards` | Refresh card list |
| 3 | PUT | `/api/content/v1/cards/bulk/pages` | Assign card to page |
| 4 | PUT | `/api/content/v4/pages/layouts/:id` | Update layout with card position |
| 5 | PUT | `/api/content/v3/cards/kpi/definition` | Set initial field definitions |
| 6 | GET | `/api/query/v1/datasources/:id/schema/indexed` | Load dataset schema |
| 7 | PUT | `/api/content/v1/cards/variable/controls/list` | Update variable control bindings |
| 8 | PUT | `/api/content/v1/cards/variable/controls/default/list` | Set control defaults |
| 9 | PUT | `/api/content/v1/cards/kpi/:id/render` | Render card preview |

### Chain: Configure Chart Fields

When a user changes x-axis, y-axis, series, or chart type:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | PUT | `/api/content/v3/cards/kpi/definition` | Update field mappings |
| 2 | GET | `/api/query/v1/datasources/:id/schema/indexed` | Reload schema |
| 3 | POST | `/api/query/v1/functions/list/id` | Load available functions |
| 4 | GET | `/api/content/v1/cards/kpi/{badge_type}/options` | Load options for new chart type |
| 5 | GET | `/api/data/v3/datasources/:id` | Datasource details |
| 6 | PUT | `/api/content/v3/cards/kpi/render/preview` | Re-render preview (may 400 during transition) |

Note: Steps 4-6 repeat for each chart type the user browses. A 400 on render/preview is normal during type switching -- the config is temporarily invalid.

### Chain: Save App

Fires every time user clicks Save:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | PUT | `/api/content/v1/dataapps/:id/persistSettings` | Persistence flags |
| 2 | PUT | `/api/content/v1/dataapps/:id?includeHiddenViews=true` | Full app config |
| 3 | PUT | `/api/content/v1/dataapps/:id/navigation/reorder` | Navigation order |
| 4 | PUT | `/api/content/v4/pages/layouts/:id` | Page layout (per page) |

### Chain: Create App (First Save Only)

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/content/v1/dataapps` | Create app (returns dataAppId, landingViewId) |
| 2 | PUT | `/api/content/v1/dataapps/:id/persistSettings` | Persistence flags |
| 3 | PUT | `/api/content/v1/dataapps/:id` | Full app config |
| 4 | PUT | `/api/content/v4/pages/layouts/:id/writelock` | Acquire edit lock |
| 5 | PUT | `/api/content/v1/dataapps/:id/navigation/reorder` | Navigation order |
| 6 | PUT | `/api/content/v4/pages/layouts/:id` | Save empty page layout |

### Chain: Connect Dataset

When a user connects a dataset to a component:

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/data/ui/v3/datasources/search` | Search for dataset |
| 2 | GET | `/api/data/v3/datasources/:id` | Get dataset details |
| 3 | GET | `/api/data/v3/datasources/:id/schema` | Get column list |
| 4 | GET | `/api/query/v1/datasources/:id/schema/indexed` | Indexed schema for queries |

### Chain: Create Form

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/forms/v2` | Create form definition |
| 2 | POST | `/api/forms/v2/:id/hydration` | Hydrate with defaults |
| 3 | PUT | `/api/forms/v2/:id/update` | Save form config |

See `appstudio-forms-reference.md` for full form API details.

### Chain: Create Workflow

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/workflow/v1/models/widget` | Create widget workflow |
| 2 | GET | `/api/workflow/v2/models/:id` | Get workflow model |
| 3 | GET | `/api/workflow/v2/models/:id/versions` | Get versions |
| 4 | POST | `/api/workflow/v1/models/permissions/me` | Check permissions |

See `appstudio-workflows-reference.md` for full workflow API details.

### Chain: Close Editor

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | _(Save chain)_ | | Auto-save on close |
| 2 | DELETE | `/api/content/v4/pages/layouts/:id/writelock` | Release edit lock |

---

## Endpoint Catalog

Remaining endpoints organized by domain, not covered in the sections above.

### Forms

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/forms/v2` | Create a new form |
| POST | `/api/forms/v2/:id/hydration` | Hydrate form with existing data |
| PUT | `/api/forms/v2/:id/update` | Update form configuration |

### Workflows

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/workflow/v1/models/widget` | Create a widget-triggered workflow |
| GET | `/api/workflow/v1/models/widget/:id` | Get widget workflow |
| GET | `/api/workflow/v2/models/:id` | Get workflow model |
| GET | `/api/workflow/v2/models/:id/versions` | List workflow versions |
| GET | `/api/workflow/v1/models/:id/versions/3.0.6/starts` | Get trigger/start configurations |
| POST | `/api/workflow/v1/models/permissions/me` | Check workflow permissions |

### Notebooks (Rich Text / Markdown)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/content/v1/cards/notebook` | Create a notebook card |
| POST | `/api/content/v1/cards/notebook/:id` | Save notebook content |
| POST | `/api/content/v1/cards/notebook/:id/update` | Update notebook |

### Files & Images

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/data/v1/data-files` | Upload a file (images, documents) |
| GET | `/api/data/v1/data-files/:id/details` | Get uploaded file details |
| GET | `/api/files/v1/filesets/:id` | Get fileset |
| POST | `/api/files/v1/filesets/:id/files/search` | Search files within a fileset |
| POST | `/api/files/v1/filesets/search` | Search across filesets |
| GET | `/api/content/v1/doc-previews/:id/:id2/meta` | Document preview metadata |
| GET | `/api/content/v1/doc-previews/:id/:id2/PNG` | Document preview as PNG |

### App Client Code (DDX)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/domo/datastores/v1/collections/ddx_app_client_code/documents` | List all code documents |
| GET | `/domo/datastores/v1/collections/ddx_app_client_code/documents/:id` | Get specific code document |
| POST | `/domo/datastores/v1/collections/ddx_app_client_code/documents/` | Create new code document |
| GET | `/domo/environment/v1` | DDX runtime environment info |

### Form Data Store

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/domo/datastores/v1/collections/form_data` | Get form data collection |
| GET | `/domo/datastores/v1/collections/form_data/documents` | List form data documents |
| PUT | `/domo/datastores/v1/collections/form_data` | Update form data collection |

### Page Analyzer

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/content/v3/pages/:id/analyzer` | Page analyzer config (filter interactions) |
| GET | `/api/content/v3/pages/:id/analyzer/named` | Named/saved filter configurations |
| GET | `/api/content/v3/stacks/:id/cards` | Cards in a page stack |
