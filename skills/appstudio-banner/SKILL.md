---
name: appstudio-banner
tier: 0
description: "Domo App Studio Banner component — horizontal row list with hblock DML, image-left template, action buttons, and full API payload reference. Trigger with 'banner component', 'app studio banner', 'banner card', 'horizontal list'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/banner.md"
audience: [code]
---

# CLI Quick Start (community-domo-cli via MCP)

Create a Banner component card using the rooster card tools:

```
rooster_card_create(
  title: "My Banner",
  dml: "{\"dml\":\"<dml version=\\\"1\\\">\\n  <param name=\\\"@dataSource\\\" type=\\\"datasource\\\" label=\\\"DataSet\\\"/>\\n</dml>\\n\",\"params\":{},\"templateType\":\"banner\",\"templateKey\":\"banner-image-left\"}"
)
# Returns card_id

rooster_card_bind(
  card_id: <card_id>,
  title: "My Banner",
  dml: "<full DML JSON string with dataset columns bound — see API Reference below>"
)
```

Position the card in an App Studio layout with `appstudio_layout(view_page_id, positions)`. See `build-appstudio` skill for the full app creation flow.

---

# Skill: AppStudio / Banner Component

## Overview

A Banner component is a **horizontal row list** where each row lays out dataset
columns side-by-side from left to right. Like the Gallery and List components it
is a `type: "rooster"` card with `templateType: "banner"`. The key structural
difference from other rooster components is the `<hblock>` DML element — groups
are arranged horizontally across the row rather than stacked vertically.

The default (and most common) template is `banner-image-left`: a fixed-width
image on the left, a text content group in the middle, and an optional
action button on the right.

The button-widget inside Banner supports the same 4 action types as the List and
Gallery components (`WEBLINK`, `DOMOLINK`, `FORM_MODAL`, `WORKFLOW_START`) — see
`skill-appstudio-listcomponent-actionbutton.md` for full action type documentation.

---

## Card Creation

Banner cards use the same `POST /api/content/v1/cards` endpoint as all rooster
components.

```
POST /api/content/v1/cards
```

```json
{
  "title": "My Banner",
  "type": "rooster",
  "metadata": {
    "dml": "<JSON-stringified DML object — see below>",
    "dmlXml": ""
  },
  "subscriptions": []
}
```

The response includes `id` (the `cardId`) used in all subsequent calls.

---

## Template Keys

Only one template key was observed in network captures:

| templateKey | Layout | Groups |
|---|---|---|
| `banner-image-left` | Image left, text middle, button right | 3 |

Additional template keys may exist (`banner-no-image`, `banner-text-only`) but have
not been captured. Use `banner-image-left` as the default.

---

## Top-Level DML Object

```json
{
  "dml": "<xml string — see DML XML section below>",
  "templateType": "banner",
  "templateKey": "banner-image-left",
  "useSampleData": false,
  "params": {
    "groups": [ ... ],
    "rowHeight": 152,
    "itemPadding": 12,
    "gap": 8,
    "hiddenColumns": [],
    "dataSource": "<dataset-id>"
  }
}
```

| Param | Type | Notes |
|---|---|---|
| `rowHeight` | number | Height of each banner row in px (default 152) |
| `itemPadding` | number | Inner padding of each row in px (default 12) |
| `gap` | number | Gap between widget groups within a row in px (default 8) |
| `hiddenColumns` | array | Column names to exclude from the dataset query |
| `dataSource` | string | Dataset ID — required for data binding |
| `useSampleData` | boolean | `false` for real data; `true` only uses CSV sample data in DML |

> **Note:** Banner has a simpler params set than Gallery — no `widgetWidth`,
> `listDirection`, `listGap`, `sort`, or `search`. Banner is a full-width list;
> each row always spans the full container width.

---

## DML XML

> **CRITICAL:** The `dml` field must contain the **full render template** XML.
> A params-only XML causes a blank white page or client-side crash.
> The `templateKey` does NOT substitute for the render XML.

Use this complete XML for `banner-image-left` (both creation and update):

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>

  <query id="data" data-source-id="@dataSource">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>column,
      @groups=>widgets=>hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <list source="#data" height="fill" width="fill" item="@row" row-height="@rowHeight" item-style="component_item">
      <hstack width="fill" height="fill" on-press="#on-component-clicked: @row">
        <spacer size="@itemPadding" />
        <vstack width="fill" height="fill">
          <spacer size="@itemPadding" />
            <hblock groups="@groups" row="@row" gap="@gap"/>
          <spacer size="@itemPadding" />
        </vstack>
        <spacer size="@itemPadding" />
      </hstack>
    </list>
  </vstack>
</dml>
```

> **`<hblock>` vs `<vblock>`:** Gallery uses `<vblock>` — groups stack vertically
> inside each card. Banner uses `<hblock>` — groups sit side-by-side horizontally
> across the row. This is the structural difference that makes Banner a row layout
> rather than a card grid.

> **Sample data vs real data:** The initial creation captured by radar used
> `<csv id="data">` with hardcoded rows (sample data mode). For real data binding,
> replace the `<csv>` block with the `<query>` block above and set
> `"useSampleData": false` in params.

---

## Widget Types

### `image-widget` — Row thumbnail (left side)

Renders an image from a dataset column containing a URL.

```json
{
  "name": "image-widget",
  "label": "Image URL",
  "fit": "fillSpace",
  "sourceType": "dataColumn",
  "borderRadius": 8,
  "height": "fill",
  "width": "fill",
  "heightType": "flex",
  "column": {
    "type": "STRING",
    "name": "Image URL",
    "isCalculation": false,
    "isAggregatable": true,
    "id": "Image URL",
    "classType": "COLUMN",
    "dataType": "string",
    "___dmlEditorID___": "root/groups/0/widgets/0/column",
    "___dmlEditorParent___": "root/groups/0/widgets/0"
  },
  "___dmlEditorID___": "root/groups/0/widgets/0",
  "___dmlEditorParent___": "root/groups/0"
}
```

| Field | Notes |
|---|---|
| `sourceType` | `"dataColumn"` = URL from dataset column; `"staticUrl"` = hardcoded URL |
| `column` | Only present when `sourceType: "dataColumn"`. Match `name`/`id` to dataset column. |
| `borderRadius` | `8` = slightly rounded (default for banner); `0` = sharp edges |
| `fit` | `"fillSpace"` = image fills the container, cropped as needed |

---

### `text-widget2` — Title + body text (middle column)

The Banner's primary content widget renders **both** a title heading and a body
text field from dataset columns. This is a dual-field widget: `richTextTitle` for
the heading, `richText` for the body.

```json
{
  "name": "text-widget2",
  "width": "fill",
  "height": "fill",
  "flex": 1,
  "widthType": "flex",
  "heightType": "flex",
  "verticalAlignment": "center",
  "richTextTitle": {
    "columns": [
      {
        "name": "Manager",
        "id": "Manager",
        "___dmlEditorID___": "root/groups/1/widgets/0/richTextTitle/columns/0",
        "___dmlEditorParent___": "root/groups/1/widgets/0/richTextTitle"
      }
    ],
    "richTextDML": {
      "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "elementName": "vstack",
      "align": { "type": "STATIC_VALUE", "staticValue": "start" },
      "children": [
        {
          "elementName": "hstack",
          "align": { "type": "STATIC_VALUE", "staticValue": "start" },
          "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
          "children": [
            {
              "elementName": "text",
              "text": "Manager",
              "align": { "type": "STATIC_VALUE", "staticValue": "start" }
            }
          ]
        }
      ]
    }
  },
  "richText": {
    "columns": [
      {
        "name": "Manager",
        "id": "Manager",
        "___dmlEditorID___": "root/groups/1/widgets/0/richText/columns/0",
        "___dmlEditorParent___": "root/groups/1/widgets/0/richText"
      }
    ],
    "richTextDML": {
      "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
      "elementName": "vstack",
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
                "property": { "propertyName": "Manager", "type": "PROPERTY" }
              },
              "elementName": "datafield",
              "align": { "type": "STATIC_VALUE", "staticValue": "start" }
            }
          ]
        }
      ]
    }
  },
  "___dmlEditorID___": "root/groups/1/widgets/0",
  "___dmlEditorParent___": "root/groups/1"
}
```

**To bind title and body to different columns:**
- `richTextTitle`: change `columns[0].name/id` and the inner `text` element's `text` field
  (this is a static label, not a variable — it shows the column name as the heading)
- `richText`: change `columns[0].name/id` and `richTextDML.children[0].children[0].source.property.propertyName`
  (this is a dynamic data binding — shows the actual cell value)

---

### `button-widget` — Action button (right side)

Identical to List and Gallery button-widget. Supports `WEBLINK`, `DOMOLINK`,
`FORM_MODAL`, and `WORKFLOW_START` via `__dmlActions.on-press-button`.

See `skill-appstudio-listcomponent-actionbutton.md` for full `__dmlActions` documentation.

```json
{
  "name": "button-widget",
  "label": "Edit",
  "height": "fill",
  "width": "fill",
  "flex": 1,
  "widthType": "flex",
  "heightType": "flex",
  "verticalAlignment": "center",
  "___dmlEditorID___": "root/groups/2/widgets/0",
  "___dmlEditorParent___": "root/groups/2"
}
```

---

## Template Reference: `banner-image-left`

3 groups arranged horizontally via `<hblock>`:

```
groups[0]  vgroup  w=192 (fixed)  image-widget     <- thumbnail (left)
groups[1]  vgroup  w=fill (flex)  text-widget2     <- title + body (center)
groups[2]  vgroup  w=fixed        button-widget    <- action (right)
```

### Full `params.groups` for `banner-image-left`

```json
[
  {
    "name": "vgroup",
    "width": 192,
    "height": "fill",
    "widthType": "fixed",
    "heightType": "flex",
    "___dmlEditorID___": "root/groups/0",
    "___dmlEditorParent___": "root",
    "widgets": [
      {
        "name": "image-widget",
        "label": "Image URL",
        "fit": "fillSpace",
        "sourceType": "dataColumn",
        "borderRadius": 8,
        "height": "fill",
        "width": "fill",
        "heightType": "flex",
        "column": {
          "type": "STRING",
          "name": "Image URL",
          "isCalculation": false,
          "isAggregatable": true,
          "id": "Image URL",
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
    "name": "vgroup",
    "width": "fill",
    "height": "fill",
    "flex": 1,
    "widthType": "flex",
    "heightType": "flex",
    "___dmlEditorID___": "root/groups/1",
    "___dmlEditorParent___": "root",
    "widgets": [
      {
        "name": "text-widget2",
        "width": "fill",
        "height": "fill",
        "flex": 1,
        "widthType": "flex",
        "heightType": "flex",
        "verticalAlignment": "center",
        "richTextTitle": {
          "columns": [{ "name": "Manager", "id": "Manager" }],
          "richTextDML": {
            "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
            "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
            "elementName": "vstack",
            "align": { "type": "STATIC_VALUE", "staticValue": "start" },
            "children": [{
              "elementName": "hstack",
              "align": { "type": "STATIC_VALUE", "staticValue": "start" },
              "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
              "children": [{
                "elementName": "text",
                "text": "Manager",
                "align": { "type": "STATIC_VALUE", "staticValue": "start" }
              }]
            }]
          }
        },
        "richText": {
          "columns": [{ "name": "Manager", "id": "Manager" }],
          "richTextDML": {
            "width": { "type": "STATIC_VALUE", "staticValue": "fill" },
            "height": { "type": "STATIC_VALUE", "staticValue": "fill" },
            "elementName": "vstack",
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
                  "property": { "propertyName": "Manager", "type": "PROPERTY" }
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
    "name": "vgroup",
    "height": "fill",
    "widthType": "fixed",
    "heightType": "flex",
    "___dmlEditorID___": "root/groups/2",
    "___dmlEditorParent___": "root",
    "widgets": [
      {
        "name": "button-widget",
        "label": "Edit",
        "height": "fill",
        "width": "fill",
        "flex": 1,
        "widthType": "flex",
        "heightType": "flex",
        "verticalAlignment": "center",
        "___dmlEditorID___": "root/groups/2/widgets/0",
        "___dmlEditorParent___": "root/groups/2"
      }
    ]
  }
]
```

---

## Data Binding

Same two-step flow as List and Gallery components:

**Step 1 — Bind dataset to card:**

```
PUT /api/content/v1/cards/rooster/query
```

```json
{
  "card": {
    "type": "rooster",
    "subscriptions": [{
      "name": "data",
      "componentName": "data",
      "dataSourceId": "<datasetId>",
      "jsonQuery": "<JSoQL string>"
    }]
  }
}
```

**Step 2 — Update card with subscription:**

```
PUT /api/content/v1/cards/<cardId>
```

```json
{
  "metadata": {
    "title": "My Banner",
    "dml": "<updated DML JSON string with dataSource set>",
    "dmlXml": ""
  },
  "subscriptions": [{
    "cardId": "<cardId>",
    "dataSourceId": "<datasetId>",
    "componentName": "data",
    "jsonQuery": "<JSoQL string>"
  }]
}
```

---

## App Creation Flow

Identical to the Gallery and List component flow. The same 11-step sequence:

1. `POST /api/content/v1/dataapps` — rich body (see below) -> capture `appId`, `landingViewId`, `views[0].layout.layoutId`
2. `PUT /api/content/v1/dataapps/<appId>/persistSettings`
3. `PUT /api/content/v1/dataapps/<appId>`
4. `PUT /api/content/v1/dataapps/<appId>/navigation/reorder`
5. `POST /api/content/v1/cards` — with banner DML -> capture `cardId`
6. `PUT /api/content/v1/cards/rooster/query` — bind dataset
7. `PUT /api/content/v1/cards/<cardId>` — update with subscription
8. `PUT /api/content/v1/cards/bulk/pages` — assign card to page
9. `PUT /api/content/v4/pages/layouts/<layoutId>/writelock` — acquire lock
10. `PUT /api/content/v4/pages/layouts/<layoutId>` — set layout
11. `DELETE /api/content/v4/pages/layouts/<layoutId>/writelock` — release lock

### POST /api/content/v1/dataapps body

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
  "userAccess": null,
  "theme": {
    "name": "Clarion",
    "chartColorPalette": { "id": "Domo Default Palette", "type": "DOMO" }
  }
}
```

> **`views[0].layout.layoutId` is only populated with the rich body.** Sending a
> minimal `{title, type}` returns `views[0].layout = null`. Include all fields above
> or the layout ID will be missing and step 9-11 will fail.

### DELETE card

```
DELETE /api/content/v1/cards/bulk
```

Body: `{ "cardIds": ["<cardId>"] }` (uses the card ID from step 5)

---

## Gotchas

1. **`useSampleData: false` is required for real data.** The UI defaults to
   `useSampleData: true` with a hardcoded `<csv>` block. For data-bound banners
   always set `"useSampleData": false` and use the `<query>` DML block.

2. **`text-widget2` requires updating TWO column references per field.**
   For `richTextTitle`: change `columns[0].name/id` (column binding) and the
   `children[0].children[0].text` value (the static label string).
   For `richText`: change `columns[0].name/id` and
   `richTextDML.children[0].children[0].source.property.propertyName`.
   Both must match or the column won't render.

3. **`hblock` layout — groups are horizontal, not vertical.** Each group in
   `params.groups[]` is a vertical column rendered side-by-side. This is the
   opposite of Gallery (`vblock` = groups stacked top-to-bottom). Designing a
   banner means thinking in columns across a row, not rows within a card.

4. **Image column must be STRING type.** The `column` object in `image-widget`
   requires `"dataType": "string"`. The column must contain a URL string.

5. **Group 2 (button) width is not set explicitly.** In the capture, the button
   vgroup does not have an explicit `width` value — it auto-sizes to the button
   label. Set `widthType: "fixed"` and a pixel `width` if you need a consistent
   button column width.

6. **`views[0].layout.layoutId` gotcha — same as Gallery.** POST dataapps with a
   minimal body returns `layout: null`. Always send the full body including `theme`,
   `owners`, `showNavigation`, etc.

7. **`___dmlEditorID___` and `___dmlEditorParent___` fields are required.** They
   must be present in the group/widget objects exactly as shown. Missing them can
   cause the AppStudio editor to fail to parse the DML and render a blank component.

---

## When to Use

### Best For
- **Image-accompanied row data** — datasets where each row has a thumbnail, headshot,
  or product image that should appear inline alongside text (not in a full card grid)
- **Entity lists with visual identity** — rep profiles, product line-ups, location
  lists where the image aids recognition but the row format is more space-efficient
  than a gallery
- **Mixed-density layouts** — apps that need a compact visual row list alongside charts,
  KPIs, or filter bars on the same page
- **Browse-and-act with context** — each row shows image + key fields + one action button
  (edit, view, request) so users can identify and act without navigating away

### Power Features
- **Image in a row, not a card** — Banner is the only rooster component that puts an
  image inline within a scrolling list row. Gallery cards are tall and wide; Banner rows
  are compact and full-width.
- **Dual text fields per row** — `text-widget2` shows both a title (column label) and
  body (cell value) in the same horizontal space — label-value pair in a single widget.
- **Same action button system** — WEBLINK, DOMOLINK, FORM_MODAL, WORKFLOW_START all work
  identically to List and Gallery. Full workflow integration in a row format.
- **Compact vertical density** — at `rowHeight: 152`, a banner shows 4-5 rows in a
  standard card height. Gallery at the same height shows 1-2 cards. Use Banner when
  row density matters more than visual impact.

### Business Domains
- **Sales ops** — rep performance rows with headshot + quota attainment + action button
- **HR / People ops** — employee lookup list with photo + role + action (especially
  when an org directory doesn't need the grid aesthetic of Gallery)
- **Retail / Field ops** — store or territory list with location image + KPIs + action
- **IT / Asset management** — device or asset list with thumbnail + status + action
- **Support / Case management** — case list with customer avatar + subject + action button

### Do NOT Use When
- No image column is available — use List component instead (text-only rows)
- Items are visually equal-weight entities that benefit from a grid scan — use Gallery
- The primary need is column comparison or sorting across many attributes — use table
- Row count is very high (500+) and users need to scroll through all of them — Banner
  is not a virtualized high-row-count table
- The layout needs multiple action buttons per row — List component is more flexible
  for multi-button rows

### Anti-Patterns
- **Banner without images** — if there's no meaningful image column, Banner offers
  no advantage over List. The fixed-width image group just wastes space.
- **Inconsistent image sizes** — portrait headshots mixed with landscape product shots
  in the same banner look broken. Standardize image aspect ratios in the data pipeline.
- **Over-stuffing the text group** — `text-widget2` holds one title + one body field.
  It's not designed for 3-4 fields. Use List component if you need more fields per row.
- **Using `rowHeight: 152` for small images** — if the image column has small thumbnails
  (icon-size), reduce `rowHeight` to 60-80 and the image group `width` to 48-64 to match.
- **Forgetting `useSampleData: false`** — deploying a banner that shows hardcoded CSV
  sample data instead of the real dataset is a common error when copying DML from radar
  captures.

### Banner vs. List Component

**Choose Banner when:**
- Each row has a meaningful image (headshot, product photo, location thumbnail)
- Rows are the primary content (not a work queue)
- Visual identity at row level matters more than action density

**Choose List when:**
- Rows are text-only or images are absent/inconsistent
- Multiple action buttons per row are needed
- Items form a work queue or ordered backlog
- The layout needs more than 3 horizontal groups per row

### Banner vs. Gallery

**Choose Banner when:**
- The list format is more appropriate than a card grid (long lists, compact views)
- The page already has other components and you need vertical space efficiency
- Items have a clear sort/sequence (banners are list rows, not browseable cards)

**Choose Gallery when:**
- Items benefit from larger image presentation (product catalog, course library)
- Users need to scan a grid to visually identify items
- Row density is low (20-50 items) and visual impact matters

### Integration Patterns
- **KPI row + Banner** — aggregate metrics at top, banner below for per-entity breakdown
- **Filter bar + Banner** — FilterList or variable control above narrows the banner list
- **Banner + FORM_MODAL** — click a row to open an in-place edit/action form without navigation
- **Banner + DOMOLINK** — each row navigates to a detail page pre-filtered to that entity
- **Banner + WORKFLOW_START** — trigger automation per entity directly from the row
