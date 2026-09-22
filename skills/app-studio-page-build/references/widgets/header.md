# Header Widget Reference

The Header component inserts a styled text divider directly into an AppStudio page layout. It is **not a card** — no `POST /api/content/v1/cards`, no DML, no dataset. A Header is a layout-level element placed in the `PUT /api/content/v4/pages/layouts/{layoutId}` body as `type: "HEADER"`.

## Content item shape

```json
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
```

| Field | Notes |
|---|---|
| `text` | The header text displayed on screen. |
| `contentKey` | Zero-indexed, sequential, must match `contentKey` in `template[]`. |
| `editInAppViewer` | `true` = app viewers can edit text directly. |
| `style` | Optional. `{ "sourceId": "h2" }` for secondary heading. Omit for default (h1). |

## Template item shape (standard grid)

```json
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
```

Compact: `width: 12, height: 2`.

## Multiple headers

Increment `contentKey` and stack `y` values:

```json
// content[0]: contentKey 0, y=0 in template
// content[1]: contentKey 1, y=5 in standard template (y=2 compact)
// Cards below 2 headers: y >= 10 (standard), y >= 4 (compact)
```

## Header style IDs

| sourceId | Description |
|---|---|
| (omit `style`) | Default (h1) — largest, primary heading |
| `"h2"` | Secondary heading — smaller font |

Available IDs come from `GET /api/content/v1/dataapps/themes` -> `headers` array.

## Gotchas

- No card creation. Do not POST to `/api/content/v1/cards`.
- `y` positions must not overlap — each header takes `height: 5` (standard) or `height: 2` (compact).
- Don't pass `"style": null` — omit the `style` key entirely for default.
- `layoutId` requires a fully populated POST body for `/api/content/v1/dataapps`.
