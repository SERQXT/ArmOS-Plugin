---
name: appstudio-gallery
tier: t0
primitive_of: appstudio-gallery-card
bucket: app-studio-work
description: "App Studio Gallery rooster component — horizontal-wrap card grid with 4 template keys, widget sizing, action buttons, and full DML payload reference."
status: published
visibility: anyone
created_by: lane-L5
created_at: 2026-06-07T00:00:00.000Z
userInvocable: false
---

# AppStudio Gallery Component

A Gallery component is a `type: "rooster"` card with `templateType: "gallery"`. Items render as a horizontal-wrap grid where each card displays one dataset row. Card dimensions are set by `params.widgetWidth` and `params.rowHeight`.

Trigger phrases: "gallery component", "app studio gallery", "card grid", "gallery card", "visual catalog component", "image grid", "product catalog layout".

## Top-level DML object

```json
{
  "dml": "<xml string — see DML XML below>",
  "templateType": "gallery",
  "templateKey": "gallery-image-button",
  "params": {
    "widgetWidth": 280,
    "rowHeight": 400,
    "listDirection": "horizontal-wrap",
    "itemPadding": 12,
    "listGap": 32,
    "gap": 8,
    "noResultsMessage": "No results",
    "hiddenColumns": [],
    "sort": { "columns": [], "enabled": false, "menuLabel": "Sort", "name": "sort-widget", "style": "b2", "width": "fill" },
    "search": { "columns": [], "enabled": false, "name": "search-widget", "placeholder": "Search", "style": "b2", "width": "fill" },
    "queryOverrides": { "filters": [], "orderBy": [], "search": { "columns": [], "searchString": "" } },
    "groups": [],
    "___dmlEditorID___": "root",
    "dataSource": "<dataset-id>"
  }
}
```

## Top-level params fields

| Field | Type | Notes |
|---|---|---|
| `widgetWidth` | number | Width of each gallery card in px. Default 280. |
| `rowHeight` | number | Height of each gallery card in px. Default 300–400. |
| `listDirection` | string | Always `"horizontal-wrap"` for the grid layout. |
| `itemPadding` | number | Inner padding of each card in px. Default 12. |
| `listGap` | number | Gap between cards in px. Default 32–33. |
| `gap` | number | Gap between widget groups inside a card in px. Default 8. |
| `noResultsMessage` | string | Message shown when dataset returns no rows. |
| `hiddenColumns` | array | Column names to exclude from the dataset query. |

## Available templateKey values

| templateKey | Image style | Groups |
|---|---|---|
| `gallery-image-button` | Rectangular hero image (top, rounded) | 5 |
| `gallery-full-image` | Full-bleed background image | 4 + special `topGroup` |
| `gallery-circle-images` | Small circular avatar image | 6 |
| `gallery-no-image` | No image | 5 |

## Template reference: `gallery-image-button` (default)

```
groups[0]  hgroup  h=150  image-widget          <- hero image (rounded rect)
groups[1]  hgroup  h=35   title-widget          <- primary heading
groups[2]  hgroup  flex=1 text-widget           <- body text
groups[3]  hgroup  h=60   sm-image-text-widget  <- avatar + metadata
groups[4]  hgroup  h=44   button-widget         <- action button
```

## Template reference: `gallery-full-image`

Full-bleed image is in `params.topGroup` (not inside `params.groups[]`):

```json
{
  "name": "hgroup",
  "width": "fill",
  "height": 150,
  "widthType": "flex",
  "heightType": "fixed",
  "widgets": [{
    "name": "image-widget",
    "borderRadius": 0,
    "editMode": "fixed",
    "isDeletable": false,
    "fit": "fillSpace",
    "sourceType": "dataColumn",
    "column": {}
  }]
}
```

Content groups: `groups[0]` title, `groups[1]` text, `groups[2]` sm-image-text, `groups[3]` button.

## Group object shape

```json
{
  "name": "hgroup",
  "width": "fill",
  "widthType": "flex",
  "height": 150,
  "heightType": "fixed",
  "___dmlEditorID___": "root/groups/0",
  "___dmlEditorParent___": "root",
  "widgets": []
}
```

Use `"heightType": "flex"` + `"flex": 1` for groups that expand to fill remaining space. Use `"heightType": "fixed"` + pixel `height` for pinned sizes.

## Widget shapes

### `image-widget`

```json
{
  "name": "image-widget",
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
    "dataType": "string"
  }
}
```

| Field | Notes |
|---|---|
| `sourceType` | `"dataColumn"` = URL from dataset column; `"staticUrl"` = hardcoded URL. |
| `borderRadius` | `16` = rounded corners; `0` = sharp (full-image template). |
| `shape` | `"circle"` for `gallery-circle-images` template only. |
| `column.dataType` | Must be `"string"`. Numeric/date columns will not work. |

### `title-widget`

Uses `richTextTitle` for binding. Update both `richTextTitle.columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`.

### `text-widget`

Uses `richText` with VARIABLE source binding. Same two-field update pattern as `title-widget`.

### `sm-image-text-widget`

Small circular avatar alongside text. `column` controls the avatar image; `richText.columns` controls the adjacent text. Both must be set.

### `button-widget`

```json
{
  "name": "button-widget",
  "label": "View Account",
  "width": "fill",
  "widthType": "flex",
  "heightType": "flex",
  "height": "fill",
  "flex": 1,
  "verticalAlignment": "center",
  "__dmlActions": {
    "on-press-button": {
      "type": "DOMOLINK",
      "entityId": "<cardId>",
      "entityType": "card",
      "url": "/kpis/details/<cardId>",
      "openInNewWindow": false,
      "persistFilters": true,
      "displayMode": "PRESENTATION",
      "interactionFilterMode": "NONE",
      "columns": [],
      "interactionColumns": []
    }
  }
}
```

See `appstudio-action-button` for full `__dmlActions` documentation.

## DML XML (verbatim)

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@widgetWidth" type="number" label="Card Width"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@listDirection" type="string" i18n-label="common/listDirection" />
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@listGap" type="number" i18n-label="common/listGapSpacing"/>
  <param name="@sort" hidden="true" />
  <param name="@search" hidden="true" />
  <param name="@noResultsMessage" type="string" hidden=true label=" No Results Message"/>
  <param name="@dateColumn" type="datecolumn" label="Date Field" data-source="@dataSource"/>
  <param name="@queryOverrides" type="query-overrides"/>
  <param name="@hiddenColumns" type="column" list="true" hidden="true" />
  <query id="data" data-source-id="@dataSource" date-column="@dateColumn" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>richTextSmImg=>columns,
      @groups=>widgets=>richTextDescription=>columns,
      @groups=>widgets=>column,
      @groups=>widgets=>hiddenColumns,
      @hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <hstack width="fill" align="end">
      <if is="@sort.enabled">
        <sort-widget source="@sort" config="@sort" menuLabel="Sort" width="@sort.width" query-overrides="@queryOverrides"/>
      </if>
      <if is="@search.enabled">
        <search-widget source="@search" config="@search" placeholder="Search" width="@search.width" query-overrides="@queryOverrides"/>
      </if>
    </hstack>
    <list source="#data" item="@row" height="fill" width="fill" gap="@listGap"
          direction="@listDirection" align="center" overflow="scroll"
          no-results-message="@noResultsMessage" item-style="component_item">
      <vstack height="@rowHeight" width="@widgetWidth" on-press="#on-component-clicked: @row">
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <vstack width="fill" height="fill">
            <spacer size="@itemPadding"/>
            <vblock groups="@groups" row="@row" gap="@gap"/>
            <spacer size="@itemPadding"/>
          </vstack>
          <spacer size="@itemPadding"/>
        </hstack>
      </vstack>
    </list>
  </vstack>
</dml>
```

## Data binding flow

Same two-step flow as List component — `PUT /api/content/v1/cards/rooster/query` then `PUT /api/content/v1/cards/<cardId>`.

## Key gotchas

- `gallery-full-image` uses `params.topGroup`, not `groups[0]`, for the background image.
- Column binding in `richTextTitle` / `richText` requires updating two locations.
- Image URL columns must be STRING type.
- `views[0].layout.layoutId` is only in the POST response when a rich body is sent (include `owners`, `enabled`, `showNavigation`, etc.).
- DOMOLINK `cardId` in button is not known until after the card POST — build DML in two phases with placeholder `'0'`, then update.
