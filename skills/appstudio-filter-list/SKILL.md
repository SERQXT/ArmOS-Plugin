---
name: appstudio-filter-list
tier: t0
primitive_of: appstudio-rooster-card
bucket: app-studio-work
description: "App Studio FilterList rooster component — fixed-width vertical list with filter-list-image template, image/content/button column layout, and full DML payload reference."
status: published
visibility: anyone
created_by: lane-L5
created_at: 2026-06-07T00:00:00.000Z
userInvocable: false
---

# AppStudio FilterList Component

A FilterList card is a `type: "rooster"` card with `templateType: "filter-list"` and `templateKey: "filter-list-image"`. Each row renders a fixed-width image panel on the left, a flex content panel in the middle, and a fixed-width button panel on the right — all controlled by `params.groups`.

Trigger phrases: "vertical list of accounts with thumbnail + button per row", "rooster filter-list-image card", "WORKFLOW_START button on each row", "sidebar filter list", "fixed-width list component".

## Top-level DML payload

```json
{
  "dml": "<xml string — see DML XML below>",
  "templateType": "filter-list",
  "templateKey": "filter-list-image",
  "params": {
    "rowHeight": 85,
    "listWidth": 400,
    "itemPadding": 0,
    "listGap": 16,
    "gap": 8,
    "noResultsMessage": "No results",
    "hiddenColumns": [],
    "offset": 0,
    "limit": 100,
    "dataSource": "<dataset-id>",
    "sort": { "columns": [], "enabled": false, "menuLabel": "Sort", "name": "sort-widget", "style": "b2", "width": "fill" },
    "search": { "columns": [], "enabled": false, "name": "search-widget", "placeholder": "Search", "style": "b2", "width": "fill" },
    "queryOverrides": { "filters": [], "orderBy": [], "search": { "columns": [], "searchString": "" } },
    "groups": [ "<see groups reference below>" ],
    "___dmlEditorID___": "root"
  },
  "useSampleData": true
}
```

The `dml` field must be a **JSON-stringified** version of this object, placed inside the card `POST /api/content/v1/cards` body under `metadata.dml`.

## Top-level params fields

| Field | Type | Notes |
|---|---|---|
| `rowHeight` | number | Height of each list row in px. Default 85. |
| `listWidth` | number | Fixed width of the entire list container in px. Default 400. NOT fill-width — must match the layout column allocation. |
| `itemPadding` | number | Inner padding inside each row in px. Default 0. |
| `listGap` | number | Vertical gap between rows in px. Default 16. |
| `gap` | number | Horizontal gap between group columns inside a row in px. Default 8. |
| `noResultsMessage` | string | Message shown when dataset returns no rows. |
| `hiddenColumns` | array | Column names to exclude from dataset query. |
| `offset` | number | Row offset for pagination. Default 0. |
| `limit` | number | Max rows to display. Default 100. |
| `dataSource` | string | Dataset UUID. Set after data binding. |
| `useSampleData` | boolean | `true` during initial creation; remove/set `false` after binding. |

## Template reference: `filter-list-image`

Three groups arranged as horizontal columns in each row:

```
groups[0]  vgroup  widthType: fixed  w=128   image-widget    <- thumbnail (left)
groups[1]  vgroup  widthType: flex   flex=1  title-widget    <- primary heading
                                             text-widget     <- secondary text
groups[2]  vgroup  widthType: fixed          button-widget   <- action button (right)
```

## Group object shape

```json
{
  "name": "vgroup",
  "width": 128,
  "height": "fill",
  "widthType": "fixed",
  "heightType": "flex",
  "___dmlEditorID___": "root/groups/0",
  "___dmlEditorParent___": "root",
  "widgets": []
}
```

| Field | Notes |
|---|---|
| `name` | Always `"vgroup"` for FilterList groups (unlike Gallery which uses `"hgroup"`). |
| `widthType` | `"fixed"` + pixel `width` for image (128px) and button panels; `"flex"` + `flex: 1` for content panel. |
| `heightType` | Always `"flex"` for all groups in FilterList. |

## Widget shapes

### `image-widget`

```json
{
  "name": "image-widget",
  "label": "Image URL",
  "fit": "fillSpace",
  "sourceType": "dataColumn",
  "heighType": "fixed",
  "width": "fill",
  "height": 85,
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
| `heighType` | Misspelled (missing 't') — this is a Domo API bug. Use `"heighType": "fixed"` exactly. `"heightType"` will not apply the height. |
| `height` | Must match `params.rowHeight` (default 85). |
| `sourceType` | `"dataColumn"` = URL from dataset column; `"staticUrl"` = hardcoded URL. |
| `column.name` / `column.id` | Both must match the dataset column containing the image URL. |

### `title-widget`

Uses `richTextTitle` for column binding. Update both `columns[0].name/id` AND the static `text` node in `richTextDML.children[0].children[0].text` when binding to a column.

### `text-widget`

Uses `richText` with a `datafield` VARIABLE reference. Update both `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName` when binding.

### `button-widget`

```json
{
  "name": "button-widget",
  "label": "Edit",
  "flex": 1,
  "heightType": "flex",
  "height": "fill",
  "widthType": "flex",
  "width": "fill",
  "verticalAlignment": "center",
  "__dmlActions": {
    "on-press-button": { "type": "DISABLED" }
  }
}
```

| Field | Notes |
|---|---|
| `__dmlActions.on-press-button.type` | One of `DISABLED`, `WEBLINK`, `DOMOLINK`, `FORM_MODAL`, `WORKFLOW_START`. See `appstudio-action-button` for full action type payloads. |
| Missing `__dmlActions` | Will throw a runtime error. Always include at minimum `{ "type": "DISABLED" }`. |

## DML XML (verbatim)

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@listWidth" type="number" i18n-label="common/listWidth" />
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@listGap" type="number" i18n-label="common/listGapSpacing"/>
  <param name="@sort" hidden="true" />
  <param name="@search" hidden="true" />
  <param name="@noResultsMessage" type="string" hidden=true label=" No Results Message"/>

  <query id="data" data-source-id="@dataSource" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>column,
      @hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <vstack width="@listWidth" align="end">
      <if is="@sort.enabled">
        <sort-widget source="@sort" config="@sort" menuLabel="Sort" width="@sort.width" query-overrides="@queryOverrides"/>
      </if>
      <if is="@search.enabled">
        <search-widget source="@search" config="@search" placeholder="Search" width="@search.width" query-overrides="@queryOverrides"/>
      </if>
    </vstack>
    <list source="#data" item="@row" height="fill" width="@listWidth" gap="@listGap"
          direction="vertical" pagination="scroll" no-results-message="@noResultsMessage" item-style="component_item">
      <vstack width="fill" height="@rowHeight" on-press="#on-component-clicked: @row">
        <spacer size="@itemPadding"/>
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <hblock groups="@groups" row="@row" gap="@gap"/>
          <spacer size="@itemPadding"/>
        </hstack>
        <spacer size="@itemPadding"/>
      </vstack>
    </list>
  </vstack>
</dml>
```

Key differences from Gallery DML:
- `<list direction="vertical" width="@listWidth">` — vertical rows, fixed-width container
- `<vstack width="@listWidth">` wraps sort/search (not `<hstack width="fill">`)
- `pagination="scroll"` — explicit scroll pagination
- No `<param name="@dateColumn">` declaration

## Data binding flow

Two-step bind, same as all rooster components:

1. `PUT /api/content/v1/cards/rooster/query` — bind dataset (`subscriptions[].dataSourceId`, `jsonQuery`)
2. `PUT /api/content/v1/cards/<cardId>` — update metadata + subscriptions, remove `useSampleData`

## Key gotchas

- `listWidth` is NOT fill-width. If your layout column is 600px but `listWidth` is 400, the list appears left-aligned with 200px of dead space. Always match `listWidth` to the allocated column width.
- `useSampleData: true` must be removed in the final PUT — leaving it renders embedded CSV rows instead of live data.
- `heighType` (not `heightType`) on `image-widget` — use the misspelled key.
- `groups[2]` (button panel) has `widthType: "fixed"` but no explicit pixel `width` — it auto-sizes to the button label.
- Initial POST `subscriptions` must be `[]` (not omitted).
