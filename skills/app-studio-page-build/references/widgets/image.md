# Image Widget Reference

The Image component displays a static uploaded image inside an AppStudio app. It is **not** a rooster card — no DML, no params, no data binding. Card type: `"document"`.

## Creation flow

```
1. Upload file  →  POST /api/data/v1/data-files (multipart)   → { dataFileId }
2. Create card  →  POST /api/content/v1/cards (type: "document") → { id (cardId), metadata.revisionId }
3. (optional) Poll → GET /api/content/v1/doc-previews/{cardId}/{revisionId}/meta (404 until ready)
4. App flow     →  Standard 9-step app creation (no rooster/query binding step)
```

## File upload

```
POST /api/data/v1/data-files
Content-Type: multipart/form-data   <- set automatically by FormData, do NOT set manually
```

Body: `FormData` with single `file` field (binary + filename). Response: `{ "dataFileId": 61 }`.

## Card creation

```json
{
  "type": "document",
  "description": "<filename>",
  "metadata": {
    "title": "<filename>",
    "documentId": "<dataFileId>:undefined",
    "usingSampleData": "",
    "kpiType": "document",
    "description": "<filename>"
  }
}
```

| Field | Notes |
|---|---|
| `documentId` | `"{dataFileId}:undefined"` — the string "undefined" is correct. Server resolves the revision. |
| `kpiType` | `"document"` — required. |

Response captures: `id` (cardId), `metadata.revisionId`.

## Layout content item

```json
{
  "type": "CARD",
  "contentKey": 0,
  "cardId": "<cardId>",
  "cardUrn": "<cardId>",
  "cardType": "document"
}
```

## Verify upload

```
GET /api/data/v1/data-files/{dataFileId}/details
```

Response includes `currentRevision.scanState: "SAFE"` when the file passed Domo's content scan.

## Gotchas

- Do NOT set `Content-Type` manually on the file upload — FormData generates it with the boundary.
- `documentId: "{id}:undefined"` — "undefined" is literally correct.
- No `rooster/query` step — Image has no data binding.
- The 404 from `doc-previews/meta` is normal while processing (~0–5 seconds).
- Image is purely static — it does not update when data changes.
- Upload once; reuse the same `cardId` across pages. Do not re-upload the same image per page.
