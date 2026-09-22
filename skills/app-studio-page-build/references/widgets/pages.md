# Pages Widget Reference

App Studio apps support multiple pages (views). Each page has its own layout, cards, and filters. This reference covers adding pages, importing dashboards, reordering navigation, page filters, sharing, and persist settings.

## ID reference

| ID | Source | Used By |
|----|--------|---------|
| `dataAppId` | `POST /dataapps` -> `.dataAppId` | All app-level operations |
| `viewId` / `pageId` | `POST /dataapps/{id}/views` -> `.view.pageId` | Layout, filters, card rendering |
| `layoutId` | `POST /dataapps/{id}/views` -> `.layout.layoutId` | Layout writelock + PUT |
| `analyzerId` | `POST /pages/{id}/analyzer` -> `.analyzerId` | Filter global, delete filter |

## Add a page

```
POST /api/content/v1/dataapps/{dataAppId}/views
```

```json
{ "type": "dataappview", "title": "Page 2", "hasLayout": true, "appPageDataSourceId": "null" }
```

Response: `{ view: { pageId }, layout: { layoutId } }`. Use `view.pageId` and `layout.layoutId` for subsequent calls.

After adding a page, call in sequence:
1. `PUT .../dataapps/{id}/persistSettings`
2. `PUT .../dataapps/{id}` (update app metadata with new view in views array)
3. `PUT .../pages/layouts/{layoutId}/writelock`
4. `PUT .../dataapps/{id}/navigation/reorder`
5. `PUT .../pages/layouts/{layoutId}` (write layout)

## Import a dashboard as a page

```
PUT /api/content/v1/dataapps/{dataAppId}/views/import
```

```json
{
  "type": "DATA_APPS",
  "sourcePageId": 590399572,
  "title": "Imported Page",
  "cardTitlePrefix": "",
  "cardDuplicateType": "DUPLICATE_ALL_CARDS",
  "includeCardInteractions": false,
  "includeFilters": false
}
```

Returns immediately with empty body. Follow with `GET /dataapps/{id}` to get updated views array.

## Reorder navigation

```
PUT /api/content/v1/dataapps/{dataAppId}/navigation/reorder
```

Send ALL navigation items (HOME + every VIEW). Omitting a view removes it from navigation. `dataAppId` must be a number; `entityId` must be a string; `navOrder` is 1-based.

```json
[
  { "entity": "HOME", "entityId": "home", "navOrder": 1, "visible": true, "icon": { "value": "home", "size": "DEFAULT" } },
  { "entity": "VIEW", "entityId": "<pageId>", "navOrder": 2, "visible": true, "icon": { "value": "pages", "size": "DEFAULT" } }
]
```

## Page filters

Create a filter:

```
POST /api/content/v3/pages/{pageId}/analyzer
```

```json
{
  "pageUrn": "<pageId>",
  "filters": [{ "column": "Status", "dataType": "string", "operand": "IN", "values": ["Active"], "filterType": "LEGACY" }],
  "type": "NAMED",
  "isDefault": true,
  "scope": "USER"
}
```

Make global (visible to all users):

```
PUT /api/content/v3/pages/{pageId}/analyzer/{analyzerId}/global
```

## Share app

```
POST /api/content/v1/dataapps/share
```

```json
{
  "message": "Sharing this app.",
  "dataAppIds": ["<appId>"],
  "recipients": [{ "id": <userId>, "type": "user" }]
}
```

## Persist settings

```
PUT /api/content/v1/dataapps/{dataAppId}/persistSettings
```

```json
{
  "persistFiltersEnabled": false,
  "persistInteractionsEnabled": false,
  "persistDateEnabled": false,
  "persistVariablesEnabled": false,
  "persistedColumns": []
}
```

Applied app-level — affects all pages.

## Gotchas

- Import is async — returns empty body immediately; always follow with GET to refresh state.
- Navigation reorder is full-replace — send ALL items or tabs disappear.
- Filters with `scope: "USER"` are only visible to the creator — call `/global` to share.
- persistSettings is app-level, not per-page.
- Writelock heartbeat (`PUT .../writelock/heartbeat`) needed if editing layout for 30+ seconds.
