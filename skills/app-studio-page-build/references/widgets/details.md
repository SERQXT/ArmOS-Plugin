# Details Widget Reference

A Details component is a `type: "rooster"` card with `templateType: "details"` and `templateKey: "details-image-left"`. It renders a single dataset row as a two-panel record view. The defining structural feature is **two independent group arrays** — `params.groups` (left panel) and `params.otherGroups` (right panel).

## Top-level DML object

```json
{
  "dml": "<xml string>",
  "templateType": "details",
  "templateKey": "details-image-left",
  "params": {
    "groups": [],
    "otherGroups": [],
    "rowHeight": 1000,
    "itemPadding": 12,
    "gap": 8,
    "hiddenColumns": [],
    "___dmlEditorID___": "root",
    "dataSource": "<dataset-id>"
  }
}
```

| Param | Notes |
|---|---|
| `groups` | Left panel — hero image, title, primary text. |
| `otherGroups` | Right panel — metadata rows, tags, stat pairs. Both arrays required. Omitting either renders half the card blank. |
| `rowHeight` | Default 1000. This is intentional — the Details Component fills full page height. Do not reduce to gallery-card values. |

## Default left panel layout

```
groups[0]  hgroup  h=500 (fixed)   image-widget         <- hero image
groups[1]  hgroup  h=50  (fixed)   title-widget         <- primary heading
groups[2]  hgroup  flex=1           text-widget          <- primary body text
groups[3]  hgroup  flex=1           text-widget          <- secondary body text
```

## Default right panel layout

```
otherGroups[0]  hgroup  h=60 (fixed)  pill-list-widget                   <- tag/badge row
otherGroups[1]  hgroup  flex=1         text-widget + sm-image-text-widget <- labeled field + avatar
otherGroups[2-8] hgroup flex=1         text-widget + text-widget          <- two stats side-by-side
```

## Widget shapes

### `image-widget` (left panel hero)

Same shape as Gallery `image-widget` with `borderRadius: 16`. Only use when the bound column contains actual image URLs — binding to a text column renders a blank 500px block.

### `title-widget`

Uses `richTextTitle` with VARIABLE source binding. Update both `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`.

### `text-widget`

Uses `richText` with VARIABLE `datafield` binding. Same two-field update pattern. For stat pairs, place two `text-widget` entries in the same `hgroup` with `flex: 1` each.

### `pill-list-widget`

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
    "name": "Tags",
    "id": "Tags",
    "dataType": "string"
  }
}
```

Uses direct `column` key — NOT `richText`. Renders comma-separated values as pill badges.

### `sm-image-text-widget`

Small circular avatar + adjacent text. `column` controls avatar image; `richText.columns` controls adjacent text. Must be different columns — binding both to the same column renders the value twice.

## DML XML key points

- Must include both `<param name="@groups">` AND `<param name="@otherGroups">` declarations.
- `<query id="data">` SELECT must include columns from BOTH `@groups` and `@otherGroups`.
- Missing `<query id="data">` = blank white card (silent failure — no error).

## Variable controls (detail page integration)

After layout is set, register the variable system for master-detail wiring:

```
PUT /api/content/v1/cards/variable/controls/list         <- array of card IDs
PUT /api/content/v1/cards/variable/controls/default/list <- same array
```

## Gotchas

- `otherGroups` is a top-level key on `params` — not nested inside `groups`.
- `pill-list-widget` uses `widget.column` directly — not `richText`.
- `rowHeight: 1000` is correct — do not reduce it.
- `___dmlEditorID___` for `otherGroups` items use `root/otherGroups/N` paths.
- Variable controls must be called after the layout writelock is released.
- JSoQL must include all columns from both panels.
