---
name: data-webform
tier: 0
description: "Domo Webform dataset management — create webform datasets, update grid data, schema inspection, Stream API integration, typed columns. Trigger with 'webform', 'webform dataset', 'create webform', 'grid data'."
maturity: alpha
audience: [code]
---

# Data / Webform — API Reference

Raw Domo API reference for Webform dataset operations. Webforms are manually-editable datasets created directly in Domo — no connector or external data source needed. All endpoints require authenticated session cookies.

---

## Overview

Webforms are the simplest way to create a dataset in Domo. They support:

- **Creating** a dataset with inline rows and typed columns
- **Reading** the grid data (headers + rows)
- **Updating** the data (add/remove rows, change values, add/rename/retype columns)
- **Schema inspection** via the indexed schema endpoint

Webforms are backed by the Domo Stream API (`streamId`) with `transportType: "WEBFORM"` and `updateMethod: "REPLACE"`.

---

## ID Reference

| ID | Source | Used By |
|----|--------|---------|
| `streamId` | `POST /webforms` → `.id` | PUT updates, GET stream |
| `dataSourceId` | `POST /webforms` → `.dataSource.id` | GET grid, schema queries, partition list, dataset metadata, DELETE |

---

## Workflows

### 1. Create a Webform Dataset

**Sequence (Seq 6):**
1. `POST /api/data/v2/webforms` → returns `streamId` + `dataSourceId`
2. Server auto-indexes the data (~1.6s)

**Create body:**
```json
POST /api/data/v2/webforms
{
  "name": "My Webform Dataset",
  "cloudId": "domo",
  "columns": [
    {
      "name": "Name",
      "type": "STRING",
      "valid": true,
      "uniqueCount": 3
    },
    {
      "name": "Amount",
      "type": "LONG",
      "displayType": "NUMBER",
      "valid": true,
      "uniqueCount": 3,
      "changed": true
    },
    {
      "name": "Date",
      "type": "DATE",
      "displayType": "DATE",
      "valid": true,
      "uniqueCount": 2,
      "changed": true
    }
  ],
  "rows": [
    ["Alice", "100", "2026-01-01"],
    ["Bob", "200", "2026-01-02"],
    ["Charlie", "300", "2026-01-01"]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Dataset name (appears in Data Center) |
| `cloudId` | string | Always `"domo"` |
| `columns[].name` | string | Column header name |
| `columns[].type` | string | Storage type: `"STRING"`, `"LONG"`, `"DOUBLE"`, `"DATE"`, `"DATETIME"` |
| `columns[].displayType` | string | UI display hint: `"TEXT"`, `"NUMBER"`, `"DATE"` (optional, inferred from type) |
| `columns[].valid` | boolean | Always `true` |
| `columns[].uniqueCount` | number | Distinct value count (UI hint, not enforced) |
| `rows[]` | string[] | Row values as strings, in column order. Numbers and dates are string-encoded. |

**Response** (200, ~1638ms):
```json
{
  "id": 412,
  "dataSource": {
    "id": "427699c9-b62f-447d-9007-227184608946",
    "name": "My Webform Dataset",
    "type": "webform",
    "status": "SUCCESS",
    "rowCount": 0,
    "columnCount": 0,
    "owner": { "id": "11203081", "name": "Alex Dengate" },
    "streamId": 412,
    "transportType": "WEBFORM",
    "permissions": "READ_WRITE_DELETE_SHARE_ADMIN"
  },
  "schemaDefinition": {
    "columns": [
      { "type": "STRING", "name": "Name", "id": "Name", "visible": true },
      { "type": "LONG", "name": "Amount", "id": "Amount", "visible": true },
      { "type": "DATE", "name": "Date", "id": "Date", "visible": true }
    ]
  },
  "updateMethod": "REPLACE",
  "transport": { "type": "WEBFORM" }
}
```

`id` (412) is the `streamId`. `dataSource.id` is the UUID used for schema and query endpoints.

---

### 2. Read Webform Grid Data

**Sequence (Seq 7, step 3):**

```
GET /api/data/v2/webforms/{dataSourceId}/grid
```

**Note:** The grid endpoint uses the `dataSourceId` (UUID), NOT the `streamId` (numeric).

**Response** (200, ~191ms):
```json
{
  "headers": [
    { "name": "Name", "type": "STRING" },
    { "name": "Amount", "type": "LONG" },
    { "name": "Date", "type": "DATE" }
  ],
  "data": [
    ["Alice", "100", "2026-01-01"],
    ["Bob", "200", "2026-01-02"],
    ["Charlie", "300", "2026-01-01"]
  ]
}
```

All values in `data` are strings regardless of column type. Parse numbers and dates client-side.

---

### 3. Update a Webform Dataset

**Sequence (Seq 8):**
1. `PUT /api/data/v2/webforms/{streamId}` → replaces all data and schema
2. Server re-indexes (~1.4s)

**Update body:**
```json
PUT /api/data/v2/webforms/{streamId}
{
  "name": "My Webform Dataset",
  "cloudId": "domo",
  "columns": [
    {
      "name": "Name",
      "type": "STRING",
      "displayType": "TEXT",
      "valid": true,
      "uniqueCount": 4,
      "originalDisplayType": "TEXT",
      "originalName": "Name"
    },
    {
      "name": "Amount",
      "type": "LONG",
      "displayType": "NUMBER",
      "valid": true,
      "uniqueCount": 4,
      "originalDisplayType": "NUMBER",
      "originalName": "Amount"
    },
    {
      "name": "Date",
      "type": "DATE",
      "displayType": "DATE",
      "valid": true,
      "uniqueCount": 2,
      "originalDisplayType": "DATE",
      "originalName": "Date"
    },
    {
      "name": "New Column",
      "type": "STRING",
      "displayType": "TEXT",
      "valid": true,
      "uniqueCount": 4
    }
  ],
  "rows": [
    ["Alice", "100", "2026-01-01", "active"],
    ["Bob", "200", "2026-01-02", "inactive"],
    ["Charlie", "300", "2026-01-01", "active"],
    ["Diana", "400", "2026-01-03", "active"]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `columns[].originalName` | string | Previous column name (for rename tracking) |
| `columns[].originalDisplayType` | string | Previous display type (for type change tracking) |

The PUT is a **full replace** — send ALL columns and ALL rows. Omitting a row deletes it. Omitting a column drops it.

**Response** (200, ~1376ms): Same structure as POST — full stream object with updated `schemaDefinition`.

---

### 4. Get Schema

```
GET /api/query/v1/datasources/{dataSourceId}/schema/indexed
```

**Response** (200, ~282ms):
```json
{
  "name": "My Webform Dataset",
  "dataSourceId": "427699c9-b62f-447d-9007-227184608946",
  "versionId": "1",
  "tables": [
    {
      "columns": [
        { "name": "Name", "id": "Name", "type": "STRING", "visible": true, "order": 0 },
        { "name": "Amount", "id": "Amount", "type": "LONG", "visible": true, "order": 0 },
        { "name": "Date", "id": "Date", "type": "DATE", "visible": true, "order": 0 }
      ]
    }
  ]
}
```

---

### 5. Get Stream Metadata

```
GET /api/data/v1/streams/{streamId}
```

Returns the full stream object including execution history, schedule state, and dataset info. Key fields:

- `dataSource.rowCount` / `columnCount` — current data dimensions
- `dataSource.status` — `"SUCCESS"` when data is indexed
- `lastExecution.rowsInserted` / `bytesInserted` — last write stats
- `lastExecution.currentState` — `"SUCCESS"` or `"ERROR"`
- `updateMethod` — always `"REPLACE"` for webforms

---

## Column Types

| Type | displayType | Example Values |
|------|------------|----------------|
| `STRING` | `TEXT` | `"Alice"`, `"hello world"` |
| `LONG` | `NUMBER` | `"100"`, `"-5"`, `"0"` |
| `DOUBLE` | `NUMBER` | `"3.14"`, `"0.001"` |
| `DATE` | `DATE` | `"2026-01-01"` (YYYY-MM-DD) |
| `DATETIME` | `DATE` | `"2026-01-01 14:30:00"` |

All values are sent as **strings** in the `rows` array, regardless of type.

---

## Gotchas

1. **Full replace on PUT** — There is no partial update. Every PUT sends the complete dataset. To add a row, read the grid first, append, then PUT everything.

2. **Row counts lag** — After POST/PUT, the response shows `rowCount: 0` and `columnCount: 0`. The actual counts appear after indexing completes (~1-2s). Poll via `GET /streams/{id}` to confirm.

3. **All values are strings** — Numbers, dates, and booleans are all string-encoded in the `rows` array. The `type` field on the column controls how Domo parses them.

4. **Column order matters** — Values in each row correspond to columns by position, not by name. If you reorder columns, reorder every row's values to match.

5. **uniqueCount is advisory** — The `uniqueCount` field is used for UI hints only. It's not validated server-side.

6. **cloudId is always "domo"** — Webforms are Domo-native. Don't change this field.
