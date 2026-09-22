---
name: appstudio-details
tier: 0
description: "Domo App Studio Details component — two-panel record view with dual group arrays, image-left template, master-detail patterns, and full API payload reference. Trigger with 'details component', 'app studio details', 'record view', 'detail card'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/details.md"
audience: [code]
---

# CLI Quick Start (community-domo-cli via MCP)

Create a Details component card using the rooster card tools:

```
rooster_card_create(
  title: "Record Detail",
  dml: "{\"dml\":\"<dml version=\\\"1\\\">\\n  <param name=\\\"@dataSource\\\" type=\\\"datasource\\\" label=\\\"DataSet\\\"/>\\n</dml>\\n\",\"params\":{},\"templateType\":\"details\",\"templateKey\":\"details-image-left\"}"
)
# Returns card_id

rooster_card_bind(
  card_id: <card_id>,
  title: "Record Detail",
  dml: "<full DML JSON string with both groups and otherGroups bound — see API Reference below>"
)
```

Position the card in an App Studio layout with `appstudio_layout(view_page_id, positions)`. For master-detail wiring, register variable controls after layout is set. See `build-appstudio` skill for the full app creation flow.

---

# Skill: AppStudio / Details Component

## Overview

A Details Component is a two-panel record view that renders a single dataset row as a
structured detail card. Like the List, Gallery, and FilterList components it is a
`type: "rooster"` card with `templateType: "details"` and `templateKey: "details-image-left"`.

The defining structural feature is that the Details Component has **two independent group
arrays** — `params.groups` (left panel) and `params.otherGroups` (right panel) — both
rendered side-by-side inside a single row. The left panel typically holds a hero image,
title, and a primary long-text field. The right panel holds supporting metadata fields,
optionally with pill-list widgets, sm-image-text widgets, and multi-column stat rows.

The component is most commonly used as the **detail page** of a master-detail layout:
a List, Gallery, or FilterList component on one page sends a row-click event; the
Details Component on a linked page receives it and renders the full record.

Only one `templateKey` exists for this component: `details-image-left`.

> **Two-panel distinction vs. all other rooster components:** Every other rooster component
> (`list`, `gallery`, `filter-list`) uses a single `params.groups` array. The Details
> Component is the only one with a second `params.otherGroups` array. Both arrays must
> exist in the DML object — omitting either causes half the card to render blank.

---

## Card Creation

Details Component cards use the same `POST /api/content/v1/cards` endpoint as all other
rooster components.

```
POST /api/content/v1/cards
```

```json
{
  "title": "App Component",
  "type": "rooster",
  "metadata": {
    "dmlXml": "",
    "dml": "<JSON-stringified DML object — see below>"
  },
  "subscriptions": []
}
```

**Response:** `{ "id": <cardId>, ... }` — capture the `id` for all subsequent steps.

> The initial POST `subscriptions` is always `[]`. Data binding is done separately via
> `PUT /api/content/v1/cards/rooster/query`.

---

## Top-Level DML Object

```json
{
  "dml": "<xml string — see DML XML section>",
  "templateType": "details",
  "templateKey": "details-image-left",
  "params": {
    "groups": [ ... ],
    "otherGroups": [ ... ],
    "rowHeight": 1000,
    "itemPadding": 12,
    "gap": 8,
    "hiddenColumns": [],
    "___dmlEditorID___": "root",
    "dataSource": "<dataset-id>"
  }
}
```

| Param | Type | Default | Notes |
|---|---|---|---|
| `groups` | array | — | Left panel group definitions (image, title, primary text) |
| `otherGroups` | array | — | Right panel group definitions (metadata rows) |
| `rowHeight` | number | 1000 | Total card height in px. This is large by design — the Details Component fills the full page height. |
| `itemPadding` | number | 12 | Inner padding around both panels in px |
| `gap` | number | 8 | Vertical gap between groups within a panel in px |
| `hiddenColumns` | array | `[]` | Column names to exclude from the dataset query |
| `dataSource` | string | — | Dataset UUID — only present in the DML after data binding. Omit from the initial POST body. |

---

## DML XML

> **CRITICAL:** The `dml` field must contain the **full render template** — not just
> param declarations. The DML XML drives the two-panel layout via two `<vblock>` elements:
> one bound to `@groups` (left) and one to `@otherGroups` (right), separated by a
> `<spacer size="48"/>`.

> **CRITICAL — Missing `<query>` = blank white card:** The `<list source="#data">` element
> references a data source named `#data`. If the XML does not contain a `<query id="data">`
> element, `#data` is undefined and the list silently renders nothing — no error, just a blank
> white card. This is the single most common cause of a Details Component rendering blank after
> a successful POST/PUT. The `<query>` element is **required** even though the subscription
> handles actual data binding.

Use this complete XML verbatim for the `details-image-left` template:

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@otherGroups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@dateColumn" type="datecolumn" label="Date Field" data-source="@dataSource"/>
  <param name="@queryOverrides" type="query-overrides"/>
  <param name="@hiddenColumns" type="column" list="true" hidden="true" />
  <query id="data" data-source-id="@dataSource" date-column="@dateColumn" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>richTextSmImg=>columns,
      @groups=>widgets=>column,
      @otherGroups=>widgets=>richText=>columns,
      @otherGroups=>widgets=>richTextTitle=>columns,
      @otherGroups=>widgets=>richTextSmImg=>columns,
      @otherGroups=>widgets=>column,
      @hiddenColumns
    FROM @dataSource
    LIMIT 100;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <list
      source="#data"
      item="@row"
      height="fill"
      width="fill"
      gap="32"
      direction="horizontal-wrap"
      item-style="component_item"
    >
      <vstack height="@rowHeight" width="fill" on-press="#on-component-clicked: @row">
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <hstack width="fill" height="fill">
            <vstack width="fill" height="fill" flex="1">
              <spacer size="@itemPadding"/>
                <vblock groups="@groups" row="@row" gap="@gap"/>
              <spacer size="@itemPadding"/>
            </vstack>
            <spacer size="48"/>
            <vstack width="fill" height="fill" flex="1">
              <spacer size="@itemPadding"/>
                <vblock groups="@otherGroups" row="@row" gap="@gap"/>
              <spacer size="@itemPadding"/>
            </vstack>
          </hstack>
          <spacer size="@itemPadding"/>
        </hstack>
      </vstack>
    </list>
  </vstack>
</dml>
```

Key structural notes:

- Both panels are `flex="1"` — they share the available width equally (50/50 split).
- The `<spacer size="48"/>` between panels creates a fixed 48px gutter.
- The `<query id="data">` is required — without it `<list source="#data">` has no data and renders blank.
- The `<query>` column selectors cover both `@groups` and `@otherGroups` — must include both.
- The `<list>` wraps both panels because the DML renderer always requires a list context,
  even though the Details Component typically shows only one row.
- When the cookie-cutter DML includes a `<csv id="data">` sample block, strip it before
  deploying with live data. The `rooster/query` subscription replaces it.

---

## Two-Panel Architecture

The Details Component renders two independent `<vblock>` elements fed by separate group
arrays. Understanding this split is the most important conceptual difference from other
rooster components:

| Panel | Param | Purpose |
|---|---|---|
| Left | `params.groups` | Primary identity — hero image, title, long description |
| Right | `params.otherGroups` | Supporting metadata — stat rows, tags, avatars, secondary fields |

Both panels use the same group/widget object shapes. Groups within each panel stack
vertically. Widgets within a group render horizontally (since groups are `hgroup` by
default).

---

## Left Panel (`params.groups`) — Default Layout

The recorded default uses 4 groups:

```
groups[0]  hgroup  h=500  (fixed)    image-widget         <- hero image
groups[1]  hgroup  h=50   (fixed)    title-widget         <- primary heading
groups[2]  hgroup  flex=1 (flex)     text-widget          <- primary body text
groups[3]  hgroup  flex=1 (flex)     text-widget          <- secondary body text
```

### Group object shape

```json
{
  "name": "hgroup",
  "width": "fill",
  "widthType": "flex",
  "height": 500,
  "heightType": "fixed",
  "widgets": [ ... ]
}
```

Use `"heightType": "flex"` + `"flex": 1` for groups that expand to fill remaining height.
Use `"heightType": "fixed"` + a pixel `height` for pinned-size groups.

---

## Right Panel (`params.otherGroups`) — Default Layout

The recorded default uses 9 groups. The right panel is designed for multiple compact
metadata rows — each row either a single field or two fields side-by-side:

```
otherGroups[0]  hgroup  h=60   (fixed)  pill-list-widget                  <- tag/badge row
otherGroups[1]  hgroup  flex=1 (flex)   text-widget + sm-image-text-widget <- labeled field + avatar
otherGroups[2]  hgroup  flex=1 (flex)   text-widget + sm-image-text-widget <- labeled field + avatar
otherGroups[3]  hgroup  flex=1 (flex)   text-widget + sm-image-text-widget <- labeled field + avatar
otherGroups[4]  hgroup  flex=1 (flex)   text-widget + text-widget          <- two stats side-by-side
otherGroups[5]  hgroup  flex=1 (flex)   text-widget + text-widget          <- two stats side-by-side
otherGroups[6]  hgroup  flex=1 (flex)   text-widget + text-widget          <- two stats side-by-side
otherGroups[7]  hgroup  flex=1 (flex)   text-widget + text-widget          <- two stats side-by-side
otherGroups[8]  hgroup  flex=1 (flex)   text-widget + text-widget          <- two stats side-by-side
```

The right panel supports more groups than the default — add or remove rows as needed for
your dataset. The `min-length="3"` / `max-length="10"` XML param constraints apply to
both `@groups` and `@otherGroups`.

---

## Widget Types

### `image-widget` — Hero image (left panel)

Same shape as the Gallery component. Place in `groups[0]` for the full-height hero image.

> **WARNING — Only use `image-widget` when the bound column contains actual image URLs.**
> Binding `image-widget` to a name, ID, or any non-URL string column renders a **blank
> white block** at the full fixed height (typically 500px) with no error message. The left
> panel title and body text groups below it are pushed into remaining space — often invisible.
> **Before adding `image-widget`, verify the column values look like `https://...`.**
> If no image URL column exists, use the No-Image Alternative below.

```json
{
  "name": "image-widget",
  "label": "Image URL",
  "fit": "fillSpace",
  "sourceType": "dataColumn",
  "width": "fill",
  "widthType": "flex",
  "flex": 1,
  "height": "fill",
  "heightType": "flex",
  "borderRadius": 16,
  "column": {
    "type": "STRING",
    "name": "Image URL",
    "isCalculation": false,
    "isAggregatable": true,
    "id": "Image URL",
    "classType": "COLUMN",
    "dataType": "string"
  }
}
```

| Field | Notes |
|---|---|
| `sourceType` | `"dataColumn"` = URL from dataset column; `"staticUrl"` = hardcoded URL |
| `column.name` / `column.id` | Must match the dataset column name containing the image URL |
| `borderRadius` | `16` = rounded corners; `0` = sharp edges |
| `fit` | `"fillSpace"` = image fills the container, cropped as needed |

### No-Image Alternative (when no image URL column exists)

When the dataset has no image URL column, replace `groups[0]` (the image group) with a
large `title-widget` and make all left-panel groups `flex` (no fixed heights). This avoids
the blank 500px hole while keeping the two-panel layout:

```
groups[0]  hgroup  flex=1  title-widget    <- primary name/heading (large)
groups[1]  hgroup  flex=1  text-widget     <- primary descriptor
groups[2]  hgroup  flex=1  text-widget     <- secondary descriptor
```

Keep `rowHeight: 600` (reduced from 1000) since the image group no longer needs its 500px.
Keep `templateKey: "details-image-left"` — it is the only template; the templateKey value
does not control rendering, only the XML and params do.

---

### `title-widget` — Primary heading (left panel)

Uses `richTextTitle` for column binding. Same structure as Gallery/FilterList.

```json
{
  "name": "title-widget",
  "width": "fill",
  "height": "fill",
  "flex": 1,
  "widthType": "flex",
  "heightType": "flex",
  "verticalAlignment": "center",
  "richTextTitle": {
    "columns": [
      {
        "name": "Category",
        "id": "Category"
      }
    ],
    "richTextDML": {
      "elementName": "vstack",
      "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "align": { "type": "STATIC_VALUE", "staticValue": "start" },
      "children": [
        {
          "elementName": "hstack",
          "align": { "type": "STATIC_VALUE", "staticValue": "start" },
          "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "children": [
            {
              "source": {
                "type": "VARIABLE",
                "variableName": "values",
                "property": { "propertyName": "Category", "type": "PROPERTY" }
              },
              "elementName": "datafield",
              "align": { "type": "STATIC_VALUE", "staticValue": "start" }
            }
          ]
        }
      ]
    }
  }
}
```

To bind to a different column: update `richTextTitle.columns[0].name`/`id` AND
`richTextDML.children[0].children[0].source.property.propertyName`. Both must match.

---

### `text-widget` — Body text / metadata field

Used in both panels. Uses `richText` (not `richTextTitle`). The `richTextDML` uses a
`datafield` element (not a static `text` element) when bound to a dataset column.

```json
{
  "name": "text-widget",
  "label": "TY Sls $",
  "width": "fill",
  "widthType": "flex",
  "flex": 1,
  "horizontalAlignment": "center",
  "verticalAlignment": "top",
  "richText": {
    "columns": [
      { "name": "TY Sls $", "id": "TY Sls $" }
    ],
    "richTextDML": {
      "elementName": "vstack",
      "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "align": { "type": "STATIC_VALUE", "staticValue": "start" },
      "children": [
        {
          "elementName": "hstack",
          "align": { "type": "STATIC_VALUE", "staticValue": "start" },
          "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "children": [
            {
              "source": {
                "type": "VARIABLE",
                "variableName": "values",
                "property": { "propertyName": "TY Sls $", "type": "PROPERTY" }
              },
              "elementName": "datafield",
              "align": { "type": "STATIC_VALUE", "staticValue": "start" }
            }
          ]
        }
      ]
    }
  }
}
```

**Two-stat side-by-side pattern:** Place two `text-widget` entries in the same `hgroup`
for a stat pair row. Each widget gets `flex: 1` / `widthType: "flex"` so they share width
equally.

---

### `pill-list-widget` — Tag / badge row

Renders the column value as a set of pill-shaped badges. Typically placed at the top of
the right panel for tags, categories, or goal text.

```json
{
  "name": "pill-list-widget",
  "label": "Labels",
  "width": "fill",
  "height": "fill",
  "flex": 1,
  "widthType": "flex",
  "heightType": "flex",
  "verticalAlignment": "top",
  "column": {
    "type": "STRING",
    "name": "Goals this wk",
    "isCalculation": false,
    "isAggregatable": true,
    "id": "Goals this wk",
    "classType": "COLUMN",
    "dataType": "string"
  }
}
```

| Field | Notes |
|---|---|
| `column.name` / `column.id` | Dataset column to render as pills |
| `column.dataType` | Must be `"string"`. Pill rendering parses comma-separated values. |
| `verticalAlignment` | `"top"` aligns pills to the top of the group row |
| `heightType: "fixed"` with `height: 60` | Default pill row height; adjust based on pill count |

> `pill-list-widget` column binding uses the direct `column` key — NOT `richText` or
> `richTextTitle`. This is different from `text-widget` and `title-widget`.

---

### `sm-image-text-widget` — Avatar + adjacent text

Renders a small circular thumbnail alongside text. Used in the right panel to show an
owner, assignee, or secondary identifier with their photo.

```json
{
  "name": "sm-image-text-widget",
  "label": "Category",
  "fit": "fillSpace",
  "shape": "circle",
  "widthType": "flex",
  "flex": 1,
  "width": "fill",
  "height": "fill",
  "heightType": "flex",
  "sourceType": "dataColumn",
  "column": {
    "type": "STRING",
    "name": "Image URL",
    "id": "Image URL",
    "isCalculation": false,
    "isAggregatable": true,
    "classType": "COLUMN",
    "dataType": "string"
  },
  "richText": {
    "columns": [
      { "name": "Category", "id": "Category" }
    ],
    "richTextDML": { ... }
  }
}
```

- `column` controls the avatar image source (must be STRING, same URL pattern as `image-widget`)
- `shape: "circle"` — always circular for this widget type
- `richText.columns` — the text displayed beside the avatar

In the default template, `sm-image-text-widget` appears in the right panel alongside a
`text-widget` within the same `hgroup`. The `text-widget` shows a label/key; the
`sm-image-text-widget` shows the value + avatar. This pattern creates labeled-field rows.

> **WARNING — Only use `sm-image-text-widget` when the `column` is an actual image URL.**
> Binding it to a name, number, or any non-URL column produces a blank grey circle avatar
> with the text still appearing. There is no error — just a broken visual.

> **WARNING — Duplicate value anti-pattern:** If you place a `text-widget` and an
> `sm-image-text-widget` in the same `hgroup` and bind both to the same column, the value
> appears twice on screen (once in each widget). The intended pattern is: `text-widget`
> bound to a **label** column (e.g. "Owner"), `sm-image-text-widget.richText` bound to the
> **value** column (e.g. "Owner Name"), and `sm-image-text-widget.column` bound to the
> **image URL** column (e.g. "Owner Photo URL"). All three should be different columns.
> If you don't have an image URL column, use two `text-widget`s side-by-side instead.

---

## Data Binding

Same flow as all other rooster components.

### Step 1: Bind data

```
PUT /api/content/v1/cards/rooster/query
```

```json
{
  "card": {
    "type": "rooster",
    "subscriptions": [
      {
        "name": "data",
        "componentName": "data",
        "dataSourceId": "<dataset-uuid>",
        "jsonQuery": "<JSoQL string>"
      }
    ]
  }
}
```

The `jsonQuery` is a serialized (JSON-stringified) JSoQL object. Include all columns
referenced in both `params.groups` and `params.otherGroups`. The recorded Details
Component fetched 71 columns in a single query — set a higher limit (500+) if your
dataset is wide and you want the full row available for all panels:

```typescript
function buildJsoQL(datasetId: string, columns: string[], limit = 100): string {
  return JSON.stringify({
    "@type": "SELECT",
    "selectBody": {
      "@type": "PLAIN_SELECT",
      "selectItems": columns.map(col => ({
        "@type": "SELECT_EXPRESSION_ITEM",
        "expression": { "@type": "COLUMN", "v": 1, "columnName": col }
      })),
      "fromItem": { "@type": "TABLE", "v": 1, "name": `\`${datasetId}\`` },
      "offsetBeforeLimit": false,
      "limit": {
        "rowCount": { "@type": "LONG_VALUE", "value": limit },
        "offset":   { "@type": "LONG_VALUE", "value": 0 }
      },
      "orderByElements": []
    }
  });
}
```

### Step 2: Update card with subscription

```
PUT /api/content/v1/cards/<cardId>
```

```json
{
  "metadata": {
    "title": "App Component",
    "dml": "<same full DML JSON string as in POST>",
    "dmlXml": ""
  },
  "subscriptions": [
    {
      "cardId": "<cardId>",
      "dataSourceId": "<dataset-uuid>",
      "componentName": "data",
      "jsonQuery": "<same JSoQL string used in rooster/query>"
    }
  ]
}
```

---

## Variable Controls (Detail Page Integration)

When the Details Component is used as a linked detail page that receives row data from a
parent List/Gallery/FilterList, two additional endpoints are called to register the
variable system:

### Register variable controls

```
PUT /api/content/v1/cards/variable/controls/list
```

Body: an array of card IDs that participate in variable-driven filtering on this page.

```json
["551764104", "1357727482", "1692286809", "1995662061"]
```

### Set default variable controls

```
PUT /api/content/v1/cards/variable/controls/default/list
```

Same body — the same card IDs. This sets which controls are active by default.

Both endpoints return `{}` on success. They are called as part of **Sequence 18** in the
build context (after the app/page is created and the layout is set), triggered when the
AppStudio editor connects the detail page to the master list component.

> These endpoints are only needed when the Details Component page receives inter-card
> interactions from another page. For standalone Detail cards they can be skipped.

---

## App Creation Flow

Same 11-step sequence as List and Gallery components. The Details Component recording
shows 4 cards on the same page (one List + one Details + supporting components), but
the per-card steps are identical:

1. `POST /api/content/v1/dataapps` — full rich body -> capture `dataAppId`, `landingViewId`, `views[0].layout.layoutId`
2. `PUT /api/content/v1/dataapps/<appId>/persistSettings`
3. `PUT /api/content/v1/dataapps/<appId>` — forward `views`, `owners`, `theme` from step 1 response
4. `PUT /api/content/v1/dataapps/<appId>/navigation/reorder` — all 6 nav items required
5. `POST /api/content/v1/cards` (repeat per component) -> capture each `cardId`
6. `PUT /api/content/v1/cards/rooster/query` — immediately after each POST
7. `PUT /api/content/v1/cards/<cardId>` — update metadata + subscription per card
8. `PUT /api/content/v1/cards/bulk/pages` — assign all cards to landing page
9. `PUT /api/content/v4/pages/layouts/<layoutId>/writelock`
10. `PUT /api/content/v4/pages/layouts/<layoutId>` — set layout
11. `DELETE /api/content/v4/pages/layouts/<layoutId>/writelock`

Optional (for detail page variable integration):
- `PUT /api/content/v1/cards/variable/controls/list`
- `PUT /api/content/v1/cards/variable/controls/default/list`

---

## Layout Body

Details Component cards use `cardType: "rooster"` in the layout content array. The
recording shows the Details Component rendered full-width at `height: 30` (standard grid
units) per card. Since the Details Component fills an entire detail page, you will
typically make it the only card at full height:

```json
{
  "layoutId": "<layoutId>",
  "pageUrn": "<landingViewId>",
  "printFriendly": true,
  "background": null,
  "isDynamic": true,
  "content": [
    {
      "type": "CARD",
      "contentKey": 0,
      "cardId": "<detailsCardId>",
      "cardUrn": "<detailsCardId>",
      "cardType": "rooster",
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
      "hideTitle": true,
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
        "type": "CARD",
        "contentKey": 0,
        "y": 0,
        "x": 0,
        "height": 55,
        "width": 60,
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
        "type": "CARD",
        "contentKey": 0,
        "y": 0,
        "x": 0,
        "height": 12,
        "width": 12,
        "virtualAppendix": false,
        "virtual": false
      }
    ]
  },
  "hasPageBreaks": false,
  "style": null
}
```

### Layout grid sizing

- Standard grid: 60 units wide. Full-width single Details Component: `x:0, width:60, height:55-60`
- The `rowHeight` param in the DML (default 1000px) controls the visual height of the
  card content. The layout grid height controls how much page space the card occupies.
  These two are independent — mismatch causes the card to clip or show excessive whitespace.
- **Always size large.** The Details Component is never small — it is a full-record view.
  If in doubt, set both `rowHeight: 1000` and layout `height: 55`.
- When the Details Component shares a page with a List or FilterList (master-detail on one
  page), split the layout vertically: e.g. List at `height: 30`, Details at `height: 30`
  (y=30), or side-by-side at `width: 30` each.

---

## Complete params Reference (copy-pasteable)

Minimal working params for a Details Component with 1 image, 1 title, 1 body text on the
left, and 3 metadata rows on the right. Replace column names as needed:

```json
{
  "groups": [
    {
      "name": "hgroup",
      "width": "fill",
      "widthType": "flex",
      "height": 500,
      "heightType": "fixed",
      "___dmlEditorID___": "root/groups/0",
      "___dmlEditorParent___": "root",
      "widgets": [
        {
          "name": "image-widget",
          "label": "Image URL",
          "fit": "fillSpace",
          "sourceType": "dataColumn",
          "width": "fill",
          "widthType": "flex",
          "flex": 1,
          "height": "fill",
          "heightType": "flex",
          "borderRadius": 16,
          "column": {
            "type": "STRING",
            "name": "Image URL",
            "id": "Image URL",
            "isCalculation": false,
            "isAggregatable": true,
            "classType": "COLUMN",
            "dataType": "string",
            "___dmlEditorID___": "root/groups/0/widgets/0/column",
            "___dmlEditorParent___": "root/groups/0/widgets/0"
          },
          "___dmlEditorID___": "root/groups/0/widgets/0",
          "___dmlEditorParent___": "root/groups/0"
        }
      ]
    },
    {
      "name": "hgroup",
      "width": "fill",
      "widthType": "flex",
      "height": 50,
      "heightType": "fixed",
      "___dmlEditorID___": "root/groups/1",
      "___dmlEditorParent___": "root",
      "widgets": [
        {
          "name": "title-widget",
          "width": "fill",
          "height": "fill",
          "flex": 1,
          "widthType": "flex",
          "heightType": "flex",
          "verticalAlignment": "center",
          "richTextTitle": {
            "columns": [{ "name": "Name", "id": "Name",
              "___dmlEditorID___": "root/groups/1/widgets/0/richTextTitle/columns/0",
              "___dmlEditorParent___": "root/groups/1/widgets/0/richTextTitle" }],
            "richTextDML": {
              "elementName": "vstack",
              "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "align": { "type": "STATIC_VALUE", "staticValue": "start" },
              "children": [{
                "elementName": "hstack",
                "align": { "type": "STATIC_VALUE", "staticValue": "start" },
                "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "children": [{
                  "source": {
                    "type": "VARIABLE",
                    "variableName": "values",
                    "property": { "propertyName": "Name", "type": "PROPERTY" }
                  },
                  "elementName": "datafield",
                  "align": { "type": "STATIC_VALUE", "staticValue": "start" }
                }]
              }]
            }
          },
          "___dmlEditorID___": "root/groups/1/widgets/0",
          "___dmlEditorParent___": "root/groups/1"
        }
      ]
    },
    {
      "name": "hgroup",
      "width": "fill",
      "height": "fill",
      "flex": 1,
      "widthType": "flex",
      "heightType": "flex",
      "___dmlEditorID___": "root/groups/2",
      "___dmlEditorParent___": "root",
      "widgets": [
        {
          "name": "text-widget",
          "label": "Description",
          "width": "fill",
          "widthType": "flex",
          "flex": 1,
          "horizontalAlignment": "center",
          "verticalAlignment": "top",
          "height": "fill",
          "heightType": "flex",
          "richText": {
            "columns": [{ "name": "Description", "id": "Description",
              "___dmlEditorID___": "root/groups/2/widgets/0/richText/columns/0",
              "___dmlEditorParent___": "root/groups/2/widgets/0/richText" }],
            "richTextDML": {
              "elementName": "vstack",
              "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "align": { "type": "STATIC_VALUE", "staticValue": "start" },
              "children": [{
                "elementName": "hstack",
                "align": { "type": "STATIC_VALUE", "staticValue": "start" },
                "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "children": [{
                  "source": {
                    "type": "VARIABLE",
                    "variableName": "values",
                    "property": { "propertyName": "Description", "type": "PROPERTY" }
                  },
                  "elementName": "datafield",
                  "align": { "type": "STATIC_VALUE", "staticValue": "start" }
                }]
              }]
            }
          },
          "___dmlEditorID___": "root/groups/2/widgets/0",
          "___dmlEditorParent___": "root/groups/2"
        }
      ]
    }
  ],
  "otherGroups": [
    {
      "name": "hgroup",
      "width": "fill",
      "height": 60,
      "widthType": "flex",
      "heightType": "fixed",
      "flex": 1,
      "___dmlEditorID___": "root/otherGroups/0",
      "___dmlEditorParent___": "root",
      "widgets": [
        {
          "name": "pill-list-widget",
          "label": "Labels",
          "width": "fill",
          "height": "fill",
          "flex": 1,
          "widthType": "flex",
          "heightType": "flex",
          "verticalAlignment": "top",
          "column": {
            "type": "STRING",
            "name": "Tags",
            "id": "Tags",
            "isCalculation": false,
            "isAggregatable": true,
            "classType": "COLUMN",
            "dataType": "string",
            "___dmlEditorID___": "root/otherGroups/0/widgets/0/column",
            "___dmlEditorParent___": "root/otherGroups/0/widgets/0"
          },
          "___dmlEditorID___": "root/otherGroups/0/widgets/0",
          "___dmlEditorParent___": "root/otherGroups/0"
        }
      ]
    },
    {
      "name": "hgroup",
      "width": "fill",
      "height": "fill",
      "flex": 1,
      "widthType": "flex",
      "heightType": "flex",
      "___dmlEditorID___": "root/otherGroups/1",
      "___dmlEditorParent___": "root",
      "widgets": [
        {
          "name": "text-widget",
          "label": "Status",
          "width": "fill",
          "widthType": "flex",
          "flex": 1,
          "horizontalAlignment": "center",
          "verticalAlignment": "center",
          "height": "fill",
          "heightType": "flex",
          "richText": {
            "columns": [{ "name": "Status", "id": "Status" }],
            "richTextDML": {
              "elementName": "vstack",
              "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "align": { "type": "STATIC_VALUE", "staticValue": "start" },
              "children": [{
                "elementName": "hstack",
                "align": { "type": "STATIC_VALUE", "staticValue": "start" },
                "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "children": [{
                  "source": {
                    "type": "VARIABLE",
                    "variableName": "values",
                    "property": { "propertyName": "Status", "type": "PROPERTY" }
                  },
                  "elementName": "datafield",
                  "align": { "type": "STATIC_VALUE", "staticValue": "start" }
                }]
              }]
            }
          }
        },
        {
          "name": "text-widget",
          "label": "Owner",
          "width": "fill",
          "widthType": "flex",
          "flex": 1,
          "horizontalAlignment": "center",
          "verticalAlignment": "center",
          "height": "fill",
          "heightType": "flex",
          "richText": {
            "columns": [{ "name": "Owner", "id": "Owner" }],
            "richTextDML": {
              "elementName": "vstack",
              "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "align": { "type": "STATIC_VALUE", "staticValue": "start" },
              "children": [{
                "elementName": "hstack",
                "align": { "type": "STATIC_VALUE", "staticValue": "start" },
                "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
                "children": [{
                  "source": {
                    "type": "VARIABLE",
                    "variableName": "values",
                    "property": { "propertyName": "Owner", "type": "PROPERTY" }
                  },
                  "elementName": "datafield",
                  "align": { "type": "STATIC_VALUE", "staticValue": "start" }
                }]
              }]
            }
          }
        }
      ]
    }
  ],
  "rowHeight": 1000,
  "itemPadding": 12,
  "gap": 8,
  "hiddenColumns": [],
  "___dmlEditorID___": "root"
}
```

---

## Gotchas

1. **`otherGroups` is a second sibling of `groups` in `params` — not nested inside it.**
   A common mistake is treating `otherGroups` as a sub-array of `groups`. It is a
   top-level key on the `params` object: `params.otherGroups`. Both `@groups` and
   `@otherGroups` are also declared as separate `<param>` elements in the DML XML.

2. **Both `@groups` and `@otherGroups` params must be declared in the DML XML.**
   The XML must contain both:
   ```xml
   <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
   <param name="@otherGroups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
   ```
   Omitting `@otherGroups` causes the right panel to render blank, with no error.

3. **`pill-list-widget` uses the direct `column` key, not `richText` / `richTextTitle`.**
   Binding a `pill-list-widget` the same way as a `text-widget` (using `richText.columns`)
   will not render the pills — it will silently show nothing. Always use `widget.column`
   directly for `pill-list-widget`.

4. **`rowHeight` of 1000 is intentional and correct.**
   This is not a bug in the recorded DML. The Details Component fills the full page
   height and the large `rowHeight` ensures it has room for all content. Reducing it to
   a smaller value (e.g. 300 like a Gallery card) clips the right panel metadata rows.

5. **Column binding in `richTextTitle` / `richText` requires updating two locations.**
   Both the `columns[n].name`/`id` entry AND the `richTextDML.children[0].children[0]
   .source.property.propertyName` must be updated to match. Changing only one silently
   binds the old column while the label shows the new column name.

6. **The recorded DML contains a `<csv id="data">` sample block — strip it for production.**
   The cookie-cutter DML embeds a single sample row with hardcoded retail data. This block
   is used by the AppStudio preview before data binding. Strip the entire `<csv id="data">
   ... </csv>` block from the DML XML before deploying with real data. Leaving it in does
   not cause errors but the sample row may flash briefly on load.

7. **`rooster/query` has no card ID in the path and must fire immediately after each POST.**
   The endpoint updates the card most recently created in the session. Batching all
   `rooster/query` calls at the end causes them to bind to the last card only.

8. **JSoQL must include all columns referenced in both `groups` AND `otherGroups`.**
   Unlike simpler rooster components where you only need a few columns, the Details
   Component typically binds 8-18 columns across both panels. A missing column renders
   as an empty field with no error — easy to miss in testing.

9. **`editInAppViewer: true` in the recorded layout is a potential issue.**
   The recording captures `"editInAppViewer": true` in the layout content entries. This
   adds an edit button visible to end users in the AppStudio viewer. Per the List Component
   skill, this should be `false` for published apps. Set `"editInAppViewer": false` in
   all content entries when deploying.

10. **`___dmlEditorID___` paths for `otherGroups` use `root/otherGroups/N` — not `root/groups/N`.**
    The path segments in `___dmlEditorID___` must match the actual param key. Using
    `root/groups/4` for `otherGroups[0]` causes the AppStudio editor to misroute changes.
    Use `root/otherGroups/0`, `root/otherGroups/1`, etc. for all right-panel groups and
    their widgets.

11. **The variable controls endpoints are order-sensitive.**
    `PUT /api/content/v1/cards/variable/controls/list` and `variable/controls/default/list`
    must be called after the layout writelock is released (after step 11 in the flow).
    Calling them before the layout is set causes the variable registration to reference a
    layout state that may change.

12. **The `___dmlEditorParent___` for `otherGroups` items is `"root"` — same as for `groups`.**
    Both group arrays are direct children of the root params object. The correct parent path
    for `otherGroups[0]` is `"root/otherGroups/0"` with `___dmlEditorParent___: "root"`.
    Widgets inside an otherGroup follow the pattern `"root/otherGroups/N/widgets/M"`.

13. **Wide-dataset queries: set `limit` to 1, not 100.**
    The Details Component shows one record at a time. Setting `limit: 100` in the JSoQL
    query fetches 100 rows and sends them all to the component, which only uses the first
    (or the one matching the active variable/filter). Use `limit: 1` when the record is
    pre-filtered by a variable, or `limit: 500` when you need the component to hold the
    full dataset in memory for variable-driven switching between records.

14. **Missing `<query id="data">` in the DML XML causes a completely blank card.**
    The `<list source="#data">` in the render template references a named data source `#data`.
    If no `<query id="data">` element exists in the XML, `#data` is undefined — the list
    renders nothing, silently. There is no error in the UI or the API response. The fix is
    to always include the full `<query>` block (see DML XML section above). This also applies
    when copy-pasting the XML from another component type that didn't include the query.

15. **`image-widget` with a non-URL column destroys left panel layout.**
    A 500px fixed-height image group bound to a text column (e.g. "Customer Name") renders
    as a 500px blank white area. Groups below it (title, body text) are pushed into the
    remaining `rowHeight - 500px` — often near-zero — and become invisible. Always verify
    image columns contain actual URLs before using `image-widget`. If not, use the
    No-Image Alternative layout described in the Widget Types section.

16. **`sm-image-text-widget` bound to the same column as a sibling `text-widget` creates duplicate values.**
    If `otherGroups[N]` contains a `text-widget` bound to "Sales" and a `sm-image-text-widget`
    also with `richText.columns[0].name = "Sales"`, the Sales value renders twice in the same
    row. The correct pattern: label `text-widget` uses a label string or label column;
    `sm-image-text-widget.richText` uses the value column; `sm-image-text-widget.column`
    uses a separate image URL column. Three distinct columns, one widget each.

---

## When to Use

### What the Details Component Is

The Details Component is a **record detail view** — it renders one row of a dataset as a
structured, two-panel layout. It is not a list, table, or comparison view. It is always
the answer to "show me everything about this one thing."

### Best For

- **Master-detail navigation** — the canonical use case. A List/Gallery/FilterList on page
  A shows items; the user clicks one; page B shows the Details Component with that record's
  full data. The click from page A forwards the row as a variable; the Details Component
  receives it as a filter.
- **Entity profiles** — displaying a complete record: a person's profile, a product's
  full spec sheet, an account's full snapshot, a support ticket's full view.
- **Data-rich records** — when a dataset has 10-20+ meaningful fields that won't fit in a
  gallery card or list row. The two-panel layout can accommodate 10+ metadata rows without
  scrolling.
- **"360 view" apps** — sales account 360, employee profile 360, product detail 360.
  The left panel carries the visual identity (photo, name); the right panel carries the
  operational data (metrics, status, owner, tags).

### Image vs. No-Image Decision Rule

**If an image column exists:** Use `details-image-left`. The left panel justifies its 50%
width share with the hero image. Without it, the left panel is half your page for a title
and a paragraph.

**If no image column exists:** Use a different approach entirely — either:
1. A List Component with expanded row height and many fields, or
2. A custom layout of KPI/stat cards + a text card for the description, or
3. Suppress `groups[0]` (the image group) and pad `groups[1]`-`groups[3]` with more
   fields, accepting that the left panel will have whitespace above the title.

The Details Component does not have a `details-no-image` variant. There is only
`details-image-left`. If you have no image, the left panel visual hierarchy breaks.

### Do NOT Use When

- You need to **compare multiple records** side-by-side — use a table or chart.
- You need to **display a list of records** — use List, Gallery, or FilterList.
- The dataset has **fewer than 4-5 meaningful fields** — the two-panel layout adds visual
  weight that is not justified for sparse records. Use a simpler KPI card or text widget.
- **No image column exists** — the 50/50 split wastes half the page on a mostly-empty
  left panel. See the Image vs. No-Image Decision Rule above.
- The user needs to **edit the record** — the Details Component is read-only. It renders
  data; it does not collect input. Pair it with a FORM_MODAL button (from a List or Gallery
  on the same page) for edit workflows.

### Anti-Patterns

- **Using Details as a list** — wrapping the `<list>` with multiple rows so it shows all
  records. The Details Component's visual weight is calibrated for one record. Showing
  10+ records creates an unusable dense wall of detail panels. Use List or Gallery instead.
- **Under-sizing `rowHeight`** — setting `rowHeight: 300` to match a gallery card. The
  Details Component needs 800-1200px to show the right panel metadata rows without
  clipping. Keep `rowHeight` at 1000 or adjust based on your right-panel row count.
- **Overloading the left panel** — putting 8+ fields in `params.groups`. The left panel
  is for the visual identity: image, title, and 1-2 lines of primary context. All
  supporting data belongs in `params.otherGroups`.
- **One Details Component per entity type on the same page** — building separate Detail
  Components for "Employee detail", "Account detail", "Product detail" on a single page.
  Each should be on its own app page, linked from its respective master list.
- **Skipping `pill-list-widget` for tag/label fields** — rendering a comma-separated tag
  string as a plain `text-widget` is a missed opportunity. `pill-list-widget` makes
  categorisation scannable; a raw string makes it harder to parse.

### Details Component vs. Other Rooster Components

| Question | Answer |
|---|---|
| "Show me all records" | List, Gallery, or FilterList |
| "Show me one record fully" | Details Component |
| "Show me a record with an image, some stats, and tags" | Details Component |
| "Show me a dense list I can scroll quickly" | List Component or FilterList |
| "Let me drill from a list into a record" | List + Details (master-detail pattern) |
| "Show me a grid of visual items" | Gallery |

### Integration Patterns

- **List + Details (two-page master-detail)** — the most common pattern. Page 1: a
  List or Gallery with `<forward-action payload="@row"/>` on each row. When the user
  clicks a row, the app navigates to Page 2 and passes the row data as a variable.
  Page 2 hosts the Details Component, which filters its `rooster/query` by the received
  variable (typically a record ID). Register the variable controls (`/variable/controls/list`
  and `/variable/controls/default/list`) after the layout is set, passing all card IDs on
  the detail page. This wires the inter-page variable handoff.
- **FilterList + Details (same page)** — both components on one page, split vertically.
  FilterList at top/left (height: 30), Details at bottom/right (height: 30). Row click in
  FilterList updates a variable; Details reads it. Avoids page navigation but reduces space
  for each component.
- **KPI row + Details** — aggregate metric cards at the top of a page (TY Sales, % Change,
  etc.), Details Component below showing the selected entity's full record. Combines
  summary context with full detail in one view.
- **Details + FORM_MODAL** — embed a button-widget in an `otherGroups` row that triggers
  a FORM_MODAL for in-place editing of the displayed record. The form pre-fills with the
  displayed row's column values via the variable passed from the parent list.
- **Details as a landing page** — used without a master list, filtered by a URL parameter
  or app variable. Each "entity page" (e.g. `/accounts/acme`) renders a pre-filtered
  Details Component for that entity. Common in embedded portals or customer-specific views.
