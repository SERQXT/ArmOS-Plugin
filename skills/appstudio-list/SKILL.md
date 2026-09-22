---
name: appstudio-list
tier: t0
primitive_of: appstudio-list-card
bucket: app-studio-work
description: "App Studio List rooster component — fill-width vertical list with multiple template keys, JSoQL data binding, DML payload reference."
status: published
visibility: anyone
created_by: lane-L5
created_at: 2026-06-07T00:00:00.000Z
userInvocable: false
---

# AppStudio List Component

A List component is a `type: "rooster"` card with `templateType: "list"`. It renders dataset rows as a fill-width vertical list. Unlike FilterList, it fills the full card width (`width="fill"` in the DML list element, no `listWidth` param).

Trigger phrases: "list component", "app studio list", "rooster list", "data list", "task list component", "work queue component", "dense row list".

## Card creation endpoint

```
POST /api/content/v1/cards
```

```json
{
  "title": "My List",
  "type": "rooster",
  "metadata": {
    "dmlXml": "",
    "dml": "<JSON-stringified DML object>",
    "title": "My List"
  },
  "subscriptions": []
}
```

## Top-level DML object

```json
{
  "dml": "<xml string>",
  "templateType": "list",
  "templateKey": "list-title-description",
  "params": {
    "sort": { "columns": [], "enabled": false, "menuLabel": "Sort", "name": "sort-widget", "style": "b2", "width": "fill" },
    "search": { "columns": [], "enabled": false, "name": "search-widget", "placeholder": "Search", "style": "b2", "width": "fill" },
    "queryOverrides": { "filters": [], "orderBy": [], "search": { "columns": [], "searchString": "" } },
    "groups": []
  }
}
```

## Available templateKey values

| templateKey | Description |
|---|---|
| `list-title-description` | Simple title + body text rows |
| `list-with-avatar-tags-buttons` | Avatar + tags + action buttons |
| `list-rectangle-image` | Rectangle image thumbnail + text |
| `list-square-image-tags` | Square image + tag pills |

## DML params reference

| Param | Type | Purpose |
|---|---|---|
| `@groups` | `component list` | Column/group definitions (min 3, max 10) |
| `@dataSource` | `datasource` | Dataset selector |
| `@rowHeight` | `number` | Row height in px |
| `@listWidth` | `number` | List container width (fill-width by default; omit for fill) |
| `@gap` | `number` | Widget gap |
| `@itemPadding` | `number` | Inner item padding |
| `@listGap` | `number` | Gap between list items |
| `@sort` | hidden | Sort configuration |
| `@search` | hidden | Search configuration |
| `@noResultsMessage` | `string` hidden | Empty state message |

## Data binding: JSoQL query

Step 1 — bind dataset:

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
        "jsonQuery": "<serialized JSoQL string>"
      }
    ]
  }
}
```

The `jsonQuery` value is `JSON.stringify()` of a JSoQL SELECT object:

```json
{
  "@type": "SELECT",
  "selectBody": {
    "@type": "PLAIN_SELECT",
    "selectItems": [
      {
        "@type": "SELECT_EXPRESSION_ITEM",
        "expression": { "@type": "COLUMN", "v": 1, "columnName": "Column Name" }
      }
    ],
    "fromItem": { "@type": "TABLE", "v": 1, "name": "`<dataset-uuid>`" },
    "offsetBeforeLimit": false,
    "limit": {
      "rowCount": { "@type": "LONG_VALUE", "value": 100 },
      "offset":   { "@type": "LONG_VALUE", "value": 0 }
    },
    "orderByElements": []
  }
}
```

Step 2 — update card with subscription:

```
PUT /api/content/v1/cards/<cardId>
```

```json
{
  "metadata": { "title": "My List", "dml": "<full DML JSON string>" },
  "subscriptions": [
    {
      "cardId": "<cardId>",
      "dataSourceId": "<dataset-uuid>",
      "componentName": "data",
      "jsonQuery": "<same JSoQL string>"
    }
  ]
}
```

## Layout content fields

```json
{
  "type": "CARD",
  "contentKey": 0,
  "cardId": "<cardId>",
  "cardType": "rooster",
  "hideTitle": true,
  "hideDescription": true,
  "editInAppViewer": false,
  "acceptDateFilter": true,
  "acceptFilters": true,
  "acceptSegments": true
}
```

## Layout grid sizing

- Full-width single list: `x:0, width:60, height:55-60`
- Two stacked lists: first `height:35`, second `height:30` (y = first height)
- Two side-by-side: each `width:30, height:50`
- Minimum height for any visible list: `30`

## Key gotchas

- `templateType` and `templateKey` are required in the DML JSON — a minimal `{"dml":"<xml>"}` causes 403 when the app loads.
- `jsonQuery` must be `JSON.stringify()`'d — sending a raw object silently binds no data.
- The dataset UUID in `fromItem.name` must be backtick-wrapped: `` `<uuid>` ``.
- `PUT cards/rooster/query` has no card ID in the path — always call it immediately after the POST that created the card.
- `PUT cards/<cardId>` subscriptions must not be `[]` — empty array leaves the card unbound.
- `editInAppViewer: false` — setting `true` shows an Edit button to end users.
- `hideTitle: true` is the default for list components.
- `PUT dataapps/<id>` and `navigation/reorder` are both required after app creation.
