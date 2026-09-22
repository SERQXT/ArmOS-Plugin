---
name: appstudio-header
tier: 0
description: "Domo App Studio Header component — styled text divider for page sections, layout-level element (not a card), full API payload reference. Trigger with 'header component', 'app studio header', 'section header', 'text divider'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/header.md"
audience: [code]
---

# Skill: AppStudio / Header Component

## Overview

The Header component inserts a styled text divider directly into an AppStudio page layout.
It is **not a card** — there is no `POST /api/content/v1/cards` call, no DML, no dataset,
and no `cardId`. A Header is a layout-level element placed inline in the
`PUT /api/content/v4/pages/layouts/{layoutId}` body as `type: "HEADER"` content items.

This makes it the **simplest AppStudio component to create programmatically** — the entire
flow is just 6 API calls (app creation + layout write).

---

## How It Works

```
1. Create app   →  POST /api/content/v1/dataapps
                   → { appId, landingViewId, layoutId }

2. (3 housekeeping calls)
   PUT /api/content/v1/dataapps/{appId}/persistSettings
   PUT /api/content/v1/dataapps/{appId}
   PUT /api/content/v1/dataapps/{appId}/navigation/reorder

3. Acquire lock →  PUT /api/content/v4/pages/layouts/{layoutId}/writelock

4. Set layout   →  PUT /api/content/v4/pages/layouts/{layoutId}
                   → content: [{ type: "HEADER", text: "...", ... }, ...]

5. Release lock →  DELETE /api/content/v4/pages/layouts/{layoutId}/writelock
```

No card creation, no DML, no data binding.

---

## Step 1 — Create App

Same POST body as all other AppStudio components. Always include `owners`, `enabled`,
`showNavigation`, etc. to get `views[0].layout.layoutId` populated.

```
POST /api/content/v1/dataapps
```

```json
{
  "iconDataFileId": 0,
  "type": "app",
  "title": "<app title>",
  "dataSourceId": null,
  "description": null,
  "navIconDataFileId": null,
  "enabled": true,
  "locked": false,
  "lastUpdated": null,
  "owners": [{ "id": "<userId>", "type": "USER", "displayName": "<name>" }],
  "isOwner": true,
  "canEdit": true,
  "isFavorite": false,
  "showNavigation": true,
  "showDomoNavigation": true,
  "showTitle": true,
  "showLogo": false,
  "navOrientation": "TOP",
  "userAccess": null
}
```

**Response fields needed:**
- `dataAppId` → `appId`
- `landingViewId` → `landingViewId`
- `views[0].layout.layoutId` → `layoutId`

---

## Step 2 — Housekeeping (3 calls)

### persistSettings
```
PUT /api/content/v1/dataapps/{appId}/persistSettings
```
```json
{
  "persistFiltersEnabled": false,
  "persistDateEnabled": false,
  "persistInteractionsEnabled": false,
  "persistVariablesEnabled": false,
  "persistedColumns": [],
  "dataAppId": <appId as number>
}
```

### Update app
```
PUT /api/content/v1/dataapps/{appId}
```
Body: spread the POST response, overriding `dataAppId`, `landingViewId`, and stringifying view IDs.

### Navigation reorder
```
PUT /api/content/v1/dataapps/{appId}/navigation/reorder
```
Standard 6-item nav array (HOME, VIEW, AI_ASSISTANT, CONTROLS, DISTRIBUTE, MORE).

---

## Step 3 — Acquire Layout Writelock

```
PUT /api/content/v4/pages/layouts/{layoutId}/writelock
```

No body required.

---

## Step 4 — Set Layout with Header Items

This is the only step that differs from other components.

```
PUT /api/content/v4/pages/layouts/{layoutId}
```

```json
{
  "layoutId": <layoutId>,
  "pageUrn": "<landingViewId>",
  "printFriendly": true,
  "background": null,
  "isDynamic": true,
  "content": [
    {
      "type": "HEADER",
      "contentKey": 0,
      "text": "Sales Dashboard",
      "acceptDateFilter": true,
      "acceptFilters": true,
      "acceptSegments": true,
      "fitToFrame": false,
      "hasSummary": false,
      "hideBorder": false,
      "hideFooter": true,
      "hideMargins": false,
      "hideSummary": false,
      "hideTimeframe": false,
      "hideTitle": false,
      "hideDescription": true,
      "hideWrench": false,
      "summaryNumberOnly": false,
      "background": null,
      "editInAppViewer": true,
      "compactInteractionDefault": true
    }
  ],
  "standard": {
    "aspectRatio": 1.67,
    "width": 60,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "STANDARD",
    "template": [
      {
        "type": "HEADER",
        "contentKey": 0,
        "x": 0,
        "y": 0,
        "width": 60,
        "height": 5,
        "virtualAppendix": false,
        "virtual": false
      }
    ]
  },
  "compact": {
    "aspectRatio": 1,
    "width": 12,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "COMPACT",
    "template": [
      {
        "type": "HEADER",
        "contentKey": 0,
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 2,
        "virtualAppendix": false,
        "virtual": false
      }
    ]
  },
  "hasPageBreaks": false,
  "style": null
}
```

### Multiple headers

Add more items to `content` and `template`, incrementing `contentKey` and stacking `y`:

```json
// content[1] — second header, styled
{
  "type": "HEADER",
  "contentKey": 1,
  "text": "Order Details",
  "style": { "sourceId": "h2" },
  ...same flags as above...
}

// standard.template[1]
{ "type": "HEADER", "contentKey": 1, "x": 0, "y": 5, "width": 60, "height": 5, ... }

// compact.template[1]
{ "type": "HEADER", "contentKey": 1, "x": 0, "y": 2, "width": 12, "height": 2, ... }
```

### Header style IDs

The `style.sourceId` field references a theme-defined header style. Omit `style` for default (h1).

| sourceId | Description |
|---|---|
| *(omit style)* | Default (h1) — largest, primary heading |
| `"h2"` | Secondary heading — smaller font |

The available IDs come from the app theme's `headers` array in
`GET /api/content/v1/dataapps/themes`.

---

## Step 5 — Release Layout Writelock

```
DELETE /api/content/v4/pages/layouts/{layoutId}/writelock
```

---

## Layout Grid

Standard layout uses a 60-column grid. Each header in the standard view occupies
`width: 60, height: 5` (full width, ~1 row height). In compact (mobile) view,
headers use `width: 12, height: 2`.

To place a header above cards, give the header a `y` value lower than the cards, and
give cards a `y` value equal to `(number of headers × height)`.

---

## Captured Example (2 headers)

From the live recording:

```json
"content": [
  { "type": "HEADER", "contentKey": 0, "text": "This is a header", ... },
  { "type": "HEADER", "contentKey": 1, "text": "This is another header",
    "style": { "sourceId": "h2" }, ... }
]
```

Standard template:
```json
[
  { "type": "HEADER", "contentKey": 0, "x": 0, "y": 0, "width": 60, "height": 5 },
  { "type": "HEADER", "contentKey": 1, "x": 0, "y": 5, "width": 60, "height": 5 }
]
```

---

## Gotchas

1. **No card creation.** Do not POST to `/api/content/v1/cards`. Headers are layout
   elements only — there is no `cardId`, no DML, no dataset binding.

2. **`layoutId` requires a fully populated POST body.** If you POST `/api/content/v1/dataapps`
   without `owners`, `enabled`, `showNavigation`, etc., `views[0].layout` will be `null`
   and you won't get a `layoutId`. Always include the full owner/display fields.

3. **`editInAppViewer: true` is required for in-app editing.** Without it the header
   text cannot be edited by app viewers. Set it on every HEADER content item.

4. **`contentKey` is zero-indexed and sequential.** The `contentKey` in `content[]` must
   match the `contentKey` in `template[]`. They are positional references, not IDs.

5. **`y` positions must not overlap.** Each header in the template has `height: 5`
   (standard) or `height: 2` (compact). Stack them by incrementing `y` by that height.
   Cards placed below headers must have `y >= (number of headers × 5)` in standard view.

6. **Style is optional — omit for default.** Don't pass `"style": null`; just omit the
   `style` key entirely for the default h1 style.

7. **DELETE writelock was not observed in the recording** (browser was closed), but
   it follows the same pattern as Banner/Image and should be called to release the lock
   properly. Always include it.

---

## When to Use

### Best For
- **Section dividers** — visually separate groups of cards on a page (e.g., "Summary" / "Detail")
- **Page titles** — a large H1 at the top of an app page when `showTitle` is off
- **Contextual labels** — "As of {date}" or "Region: West" headings above data cards
- **Multi-section dashboards** — interleave headers between card rows to create logical groupings

### Power Features
- **In-app editing** — with `editInAppViewer: true`, app viewers can edit header text
  directly in the app without going into the AppStudio editor
- **Theme-aware styling** — `style.sourceId` references the app theme, so headers
  automatically match the app's font and color scheme
- **Zero overhead** — no card, no dataset, no DML. Fastest component to add.

### Business Domains
- **Executive dashboards** — "Q2 Performance" / "Regional Breakdown" section labels
- **Operations** — "Open Tickets" / "Resolved Last 7 Days" dividers above KPI rows
- **Sales** — "Pipeline" / "Closed Won" section headers above list/gallery cards
- **Finance** — "Revenue" / "Expenses" / "Headcount" page section labels

### Do NOT Use When
- You need styled rich text (bold, italic, links, colors) → use the **Text** component (`type: "notebook"`)
- You want dynamic text that changes based on data → no data binding on headers; use a Text card with variable binding instead
- You need a banner/hero image with text → use the **Banner** component instead

### Anti-Patterns
- **Using headers as full-page titles when `showTitle` is enabled.** The app already has a
  title bar — a header immediately below it is redundant. Disable `showTitle` if you want
  a custom header as the page title.
- **Too many headers.** Each header takes `height: 5` (standard grid units). Three headers
  on a page consumes 15 rows before any cards appear. Use sparingly.
- **Not releasing the writelock.** Always DELETE the writelock after setting the layout.
  Orphaned writelocks can block other editors from modifying the page.

### Integration Patterns
- **Header + KPI row** — one H1 header above a row of KPI summary cards
- **Header + List** — section label above a Banner or List component
- **Multi-section page** — alternating headers and card groups:
  `[HEADER "Summary"] [KPI row] [HEADER "Orders"] [List/Banner]`
