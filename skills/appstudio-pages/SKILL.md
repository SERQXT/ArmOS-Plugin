---
name: appstudio-pages
tier: 0
description: "Domo App Studio page management — add pages, import dashboards, reorder navigation, page filters, sharing, persist settings, 38 endpoints. Trigger with 'app studio page', 'add page', 'page filters', 'page navigation', 'page sharing'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/pages.md"
audience: [code]
---

# CLI Quick Start (community-domo-cli via MCP)

Create and manage App Studio pages using the MCP tools:

```
# Create the app first
appstudio_create(title: "My Multi-Page App")
# Returns data_app_id and view_page_id (landing page)

# Position cards on the landing page
appstudio_layout(view_page_id: <view_page_id>, positions: [...])

# List existing apps to find IDs
appstudio_list()
```

For adding pages, importing dashboards, reordering navigation, filters, and sharing -- use the REST API endpoints documented below. The `build-appstudio` skill covers the full app creation flow including multi-page layouts.

---

# AppStudio / Pages — API Reference

Raw Domo API reference for App Studio page and dashboard-level operations. All endpoints require authenticated session cookies. Timing observations are from live captures.

---

## Overview

App Studio apps support multiple pages (views). Each page has its own layout, cards, and filters. This skill covers:

- **Adding pages** to an existing app
- **Importing dashboards** as new pages
- **Reordering navigation** (page tabs)
- **Page-level filters** (create, set global scope)
- **Sharing** apps with users and groups
- **Persist settings** (filter/interaction persistence across sessions)

This skill complements `skill-appstudio-cards` (card CRUD) and `skill-appstudio-layouts` (grid positioning). Use those for card creation and layout manipulation within a page.

---

## ID Reference

| ID | Source | Used By |
|----|--------|---------|
| `dataAppId` | `POST /dataapps` -> `.dataAppId` | All app-level operations |
| `viewId` / `pageId` | `POST /dataapps/{id}/views` -> `.view.pageId` | Layout, filters, card rendering |
| `layoutId` | `POST /dataapps/{id}/views` -> `.layout.layoutId` | Layout writelock + PUT |
| `analyzerId` | `POST /pages/{id}/analyzer` -> `.analyzerId` | Set filter global, delete filter |
| `landingViewId` | `GET /dataapps/{id}` -> `.landingViewId` | Default page when app opens |

---

## Workflows

### 1. Add a Page to an Existing App

**Sequence (Seq 5, steps 2-7):**
1. `POST /api/content/v1/dataapps/{dataAppId}/views` -> returns new `pageId` + `layoutId`
2. `PUT /api/content/v1/dataapps/{dataAppId}/persistSettings` -> flush settings
3. `PUT /api/content/v1/dataapps/{dataAppId}` -> update app metadata (includes new view in views array)
4. `PUT /api/content/v4/pages/layouts/{layoutId}/writelock` -> lock the new page's layout
5. `PUT /api/content/v1/dataapps/{dataAppId}/navigation/reorder` -> set nav order for all pages
6. `PUT /api/content/v4/pages/layouts/{layoutId}` -> write initial layout (empty or with cards)

**Create view body:**
```json
POST /api/content/v1/dataapps/{dataAppId}/views
{
  "type": "dataappview",
  "title": "Page 2",
  "hasLayout": true,
  "appPageDataSourceId": "null"
}
```

**Response** (200, ~263ms):
```json
{
  "view": {
    "pageId": 745678784,
    "owners": [
      { "id": 1324037627, "type": "GROUP", "displayName": "Default" }
    ],
    "title": "Page 2",
    "pageName": "uuid-string",
    "locked": false,
    "mobileEnabled": true,
    "sharedViewPage": false,
    "virtualPage": true,
    "hasLayout": true
  },
  "layout": {
    "layoutId": 745678785,
    "pageUrn": "745678784",
    "standard": { "aspectRatio": 1.67, "width": 60 },
    "compact": { "aspectRatio": 1, "width": 12 }
  }
}
```

Use `view.pageId` as the page identifier and `layout.layoutId` for layout operations. See `skill-appstudio-layouts` for grid positioning details.

---

### 2. Import a Dashboard as a Page

Import an existing Domo dashboard into the app as a new page. This duplicates all cards from the source dashboard.

**Sequence (Seq 12, step after page add):**
1. Add page first (Workflow 1) to get the target view
2. `PUT /api/content/v1/dataapps/{dataAppId}/views/import` -> import dashboard cards

**Import body:**
```json
PUT /api/content/v1/dataapps/{dataAppId}/views/import
{
  "type": "DATA_APPS",
  "sourcePageId": 590399572,
  "title": "Instance Health Command Center",
  "cardTitlePrefix": "Prefix_",
  "cardDuplicateType": "DUPLICATE_ALL_CARDS",
  "includeCardInteractions": false,
  "includeFilters": false,
  "beacon": 1842818595
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sourcePageId` | number | The Domo dashboard page ID to import from |
| `title` | string | Display title for the imported page |
| `cardTitlePrefix` | string | Prefix prepended to duplicated card titles (use `""` for no prefix) |
| `cardDuplicateType` | string | `"DUPLICATE_ALL_CARDS"` — duplicates cards so originals are unaffected |
| `includeCardInteractions` | boolean | Whether to copy card drill paths and interactions |
| `includeFilters` | boolean | Whether to copy page-level filters |
| `beacon` | number | Client-generated tracking ID |

**Response** (200, ~93ms): Empty body. The app's views array is updated server-side. Follow up with `GET /api/content/v1/dataapps/{dataAppId}` to refresh the full app state.

---

### 3. Reorder Page Navigation

Controls the order, visibility, icons, and titles of navigation tabs. Call after adding, removing, or rearranging pages.

```
PUT /api/content/v1/dataapps/{dataAppId}/navigation/reorder
```

**Body** (array of navigation items):
```json
[
  {
    "dataAppId": 1008879523,
    "entity": "HOME",
    "entityId": "home",
    "title": "Home",
    "description": "All Domo apps",
    "navOrder": 1,
    "visible": true,
    "interaction": null,
    "icon": { "value": "home", "size": "DEFAULT" },
    "iconPosition": "LEFT",
    "style": null
  },
  {
    "dataAppId": 1008879523,
    "entity": "VIEW",
    "entityId": "475064280",
    "title": "App Page 1",
    "description": null,
    "navOrder": 2,
    "visible": true,
    "interaction": null,
    "icon": { "value": "pages", "size": "DEFAULT" },
    "iconPosition": "LEFT",
    "style": null
  },
  {
    "dataAppId": 1008879523,
    "entity": "VIEW",
    "entityId": "745678784",
    "title": "Page 2",
    "description": null,
    "navOrder": 3,
    "visible": true,
    "interaction": null,
    "icon": { "value": "pages", "size": "DEFAULT" },
    "iconPosition": "LEFT",
    "style": null
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `dataAppId` | number | The app ID — must be a **number**, not a string |
| `entity` | string | `"HOME"` for the home tab, `"VIEW"` for page tabs |
| `entityId` | string | `"home"` for HOME, or the `pageId` as a **string** for VIEW |
| `navOrder` | number | Position in nav bar — **1-based for all items including HOME** |
| `visible` | boolean | Whether the tab shows in navigation |
| `icon.value` | string | Icon name: `"home"` for HOME, `"pages"` for views |
| `icon.size` | string | Always `"DEFAULT"` |

**Response** (200, ~85ms): Returns the reordered array with server-assigned `navOrder` values.

---

### 4. Create a Page Filter

Filters are page-level analyzers that apply across all cards on the page that accept filters.

**Sequence (Seq 26):**
1. `POST /api/content/v3/pages/{pageId}/analyzer` -> create filter
2. `PUT /api/content/v3/pages/{pageId}/analyzer/{analyzerId}/global` -> make it global

#### Step 1: Get available filter values

```
PUT /api/content/v2/analyzer/stacks/{pageId}/datasources/{dataSourceId}/values
```

**Body:**
```json
{
  "column": "Health_Flag",
  "dataSourceId": "5526e86d-1f01-488c-b319-e4719da35860",
  "queryOverrides": {
    "filters": [],
    "limit": 500,
    "offset": 0
  },
  "search": ""
}
```

**Response** (200, ~438ms):
```json
{
  "values": ["Healthy", "Orphaned", "Stale"]
}
```

#### Step 2: Create the filter

```
POST /api/content/v3/pages/{pageId}/analyzer
```

**Body:**
```json
{
  "analyzerId": null,
  "pageUrn": "745678784",
  "filters": [
    {
      "values": ["Healthy"],
      "column": "Health_Flag",
      "dataType": "string",
      "operand": "IN",
      "label": "Health_Flag",
      "filterType": "LEGACY"
    }
  ],
  "dateTimeRange": {},
  "graphBy": null,
  "type": "NAMED",
  "isDefault": true,
  "name": "New Filter View (Default)",
  "scope": "USER",
  "segmentIds": [],
  "periods": null,
  "sortOrder": null,
  "functionOverrides": {}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pageUrn` | string | The `pageId` as a string |
| `filters[].column` | string | Column name from the dataset |
| `filters[].dataType` | string | `"string"`, `"numeric"`, `"date"` |
| `filters[].operand` | string | `"IN"`, `"NOT_IN"`, `"EQUALS"`, `"GREATER_THAN"`, etc. |
| `filters[].values` | array | Selected filter values |
| `type` | string | `"NAMED"` for saved filter views |
| `isDefault` | boolean | Whether this is the default filter view |
| `scope` | string | `"USER"` (personal) or `"PAGE"` (shared) |

**Response** (200, ~112ms):
```json
{
  "analyzerId": 987654321,
  "type": "NAMED",
  "scope": "USER",
  "pageUrn": "745678784",
  "ownerId": 11203081,
  "name": "New Filter View (Default)",
  "isDefault": true,
  "filters": [
    {
      "values": ["Healthy"],
      "column": "Health_Flag",
      "dataType": "string",
      "operand": "IN",
      "label": "Health_Flag",
      "filterType": "LEGACY"
    }
  ],
  "dateTimeRange": {},
  "segmentIds": [],
  "periods": null,
  "sortOrder": null
}
```

#### Step 3: Make filter global (applies to all users)

```
PUT /api/content/v3/pages/{pageId}/analyzer/{analyzerId}/global
```

**Response** (200, ~94ms): Empty body. The filter is now visible to all app users.

---

### 5. Share an App

Share the app with specific users or groups. Users receive a notification and gain access.

**Sequence (Seq 20 -> 23):**
1. `GET /api/content/v1/typeahead?query={search}` -> search for users/groups
2. `GET /api/content/v1/dataapps/{dataAppId}/access` -> check current access list
3. `POST /api/content/v1/dataapps/share` -> share with selected recipients

#### Search for users/groups

```
GET /api/content/v1/typeahead?query=david&type=user
```

**Response** (200, ~43ms):
```json
{
  "users": [
    {
      "id": 566865183,
      "displayName": "Example User",
      "email": "user@example.domo.com",
      "role": "Admin",
      "detail": {
        "email": "user@example.domo.com",
        "pending": false
      }
    }
  ]
}
```

#### Check current access

```
GET /api/content/v1/dataapps/{dataAppId}/access
```

**Response** (200, ~60ms):
```json
{
  "users": [
    {
      "id": 11203081,
      "displayName": "Alex Dengate",
      "userName": "alex.dengate@domo.com",
      "role": "Admin",
      "active": true
    }
  ],
  "totalUserCount": 1
}
```

#### Share

```
POST /api/content/v1/dataapps/share
```

**Body:**
```json
{
  "message": "I thought you might find this interesting.",
  "dataAppIds": ["446745867"],
  "recipients": [
    { "id": 566865183, "type": "user" }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Notification message sent to recipients |
| `dataAppIds` | string[] | Array of app IDs (as strings) to share |
| `recipients[].id` | number | User or group ID |
| `recipients[].type` | string | `"user"` or `"group"` |

**Response** (200, ~246ms): Empty body.

---

### 6. Persist Settings

Controls whether filters, interactions, date selections, and variables persist across user sessions.

```
PUT /api/content/v1/dataapps/{dataAppId}/persistSettings
```

**Body:**
```json
{
  "persistFiltersEnabled": false,
  "persistInteractionsEnabled": false,
  "persistDateEnabled": false,
  "persistVariablesEnabled": false,
  "persistedColumns": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `persistFiltersEnabled` | boolean | Remember user's filter selections between visits |
| `persistInteractionsEnabled` | boolean | Remember card drill-down state |
| `persistDateEnabled` | boolean | Remember date range filter selections |
| `persistVariablesEnabled` | boolean | Remember variable control selections |
| `persistedColumns` | array | Specific columns to persist (empty = all or none based on flags) |

**Response** (200, ~79ms): Empty body.

---

## Supporting Endpoints

### Page Load Sequence

When navigating to a page within an app, these fire in parallel (Seq 2, ~1208ms):

1. `GET /api/content/v3/stacks/{pageId}/cards` — card list + metadata
2. `GET /api/content/v1/pages/subpagessummary` — subpage hierarchy
3. `GET /api/content/v3/pages/{pageId}/analyzer/named` — saved filter views
4. `PUT /api/content/v1/analytics/views/cards/counts` — view count tracking
5. `GET /api/content/v1/pages/{pageId}/access` — page access permissions
6. `PUT /api/content/v1/cards/variable/controls/list` — variable controls state
7. `GET /api/content/v1/access/users/page/{pageId}` — user access list
8. `GET /api/content/v1/cards?pageId={pageId}` — full card definitions
9. `GET /api/data/v3/datasources/{id}` — dataset metadata
10. `GET /api/content/v3/pages/{pageId}/analyzer` — active filter state
11. `PUT /api/content/v1/cards/kpi/{cardId}/render` — render card data
12. `POST /api/content/v1/stats/cmetrics/client_card_page_load_end_summary` — performance telemetry

### Layout Operations

Layout read/write follows the same writelock pattern as `skill-appstudio-layouts`:

```
PUT  /api/content/v4/pages/layouts/{layoutId}/writelock           — acquire lock
PUT  /api/content/v4/pages/layouts/{layoutId}/writelock/heartbeat  — keep lock alive (~744ms)
PUT  /api/content/v4/pages/layouts/{layoutId}                      — write layout
GET  /api/content/v4/pages/layouts/{layoutId}                      — read layout
DELETE /api/content/v4/pages/layouts/{layoutId}/writelock           — release lock
```

---

## Gotchas

1. **Import is async-ish** — `PUT .../views/import` returns immediately with empty body. The imported cards and layout are created server-side. Always follow with `GET /dataapps/{id}` to get the updated views array.

2. **Navigation reorder is full-replace** — You must send ALL navigation items (HOME + every VIEW) in the reorder body. Omitting a view removes it from navigation. `dataAppId` must be a number, `entityId` must be a string, and `navOrder` is 1-based for all items including HOME.

3. **Filter scope matters** — Filters created with `scope: "USER"` are only visible to the creator. Call `PUT .../analyzer/{id}/global` to make them visible to all users.

4. **persistSettings is app-level** — It applies to all pages in the app, not per-page. Set it once after creating the app.

5. **Writelock heartbeat** — If editing a layout for more than ~30 seconds, the client sends periodic heartbeats (`PUT .../writelock/heartbeat`, ~744ms response). Always release the writelock when done with `DELETE`.

6. **Page IDs are view IDs** — In the dataapps API, `viewId`, `pageId`, and `landingViewId` all refer to the same concept. The layout API uses `pageId` in its URL path.
