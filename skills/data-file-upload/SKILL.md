---
name: data-file-upload
tier: 0
description: "Domo file upload workflow — CSV and XLSX chunked upload, preview/parse, sheet selection, Large File Upload connector, stream creation, full API reference with 25 endpoints. Trigger with 'file upload', 'upload CSV', 'upload XLSX', 'data upload', 'chunked upload'."
maturity: alpha
audience: [code]
---

# Data / File Upload (CSV + XLSX) — API Reference

Raw Domo API reference for uploading CSV and XLSX files as datasets. Both use the same Large File Upload connector (`com.domo.connector.large.fileupload`). Supports files up to 3 GB. All endpoints require authenticated session cookies.

---

## Overview

File upload in Domo is a multi-step process:

1. **Upload file chunks** → binary upload to temporary storage
2. **Preview/parse** → server reads the file, returns column headers and sample data
3. **Sheet selection** (XLSX only) → get available sheet names, select which to import
4. **Create stream** → creates the dataset with full configuration (file metadata, parse settings, schedule)
5. **Server indexes** → Domo processes the file asynchronously

Both CSV and XLSX use the same connector and endpoints. The difference is:
- **CSV**: uses `preview/chunked` to parse columns and data
- **XLSX**: uses `sheetnames/chunked` first to list sheets, then `preview/chunked` with sheet selection

---

## ID Reference

| ID | Source | Used By |
|----|--------|---------|
| `fileName` | `POST /data-files/large` → response | Preview, sheetnames, stream config |
| `streamId` | `POST /streams` → `.id` | Stream metadata, execution monitoring |
| `dataSourceId` | `POST /streams` → `.dataSource.id` | Schema queries, dataset operations |

---

## Workflows

### 1. Upload File Chunks

**Sequence (Seq 4 / Seq 11–12):**
1. `GET /api/data/v1/data-files/file-upload/config` → get chunk size
2. `POST /api/data/v1/data-files/large` → upload each chunk (binary)

#### Get upload config

```
GET /api/data/v1/data-files/file-upload/config
```

**Response** (200, ~58ms):
```json
{
  "threads": 30,
  "size": 1048576
}
```

`size` = chunk size in bytes (1 MB). Split the file into chunks of this size.

#### Upload chunks

```
POST /api/data/v1/data-files/large
Content-Type: application/octet-stream
```

Send raw binary data. Each chunk is a separate request. The server returns a `fileName` token (opaque string) that identifies the uploaded file for subsequent operations.

**Response** (200, ~876ms per chunk): The response contains the temporary `fileName` identifier.

---

### 2. Preview/Parse File (CSV)

**Sequence (Seq 5):**
1. `GET /api/connectors/file/fileupload/csvparams` → get supported encodings and delimiters
2. `POST /api/connectors/file/V2/fileupload/preview/chunked` → parse and preview

#### Get CSV parameters

```
GET /api/connectors/file/fileupload/csvparams
```

**Response** (200, ~50ms):
```json
{
  "encodings": ["Big5", "CESU-8", "UTF-8", "...170 more"],
  "delimiters": [",", "|", "^", "...3 more"],
  "rowCount": 0
}
```

#### Preview chunked file

```
POST /api/connectors/file/V2/fileupload/preview/chunked
```

**Body:**
```json
{
  "fileNameUI": "Sample Data.csv",
  "fileName": "wWi5A2agzwr_vAihETR6N",
  "fileLength": 2742436,
  "chunksQuantity": 3,
  "fileType": "csv",
  "rows": 100,
  "cols": 100,
  "generateHeaders": false,
  "keepLeadingZeros": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `fileNameUI` | string | Original file name (display only) |
| `fileName` | string | Server-assigned file token from chunk upload |
| `fileLength` | number | Total file size in bytes |
| `chunksQuantity` | number | Number of chunks uploaded |
| `fileType` | string | `"csv"` or `"xlsx"` |
| `rows` | number | Max preview rows (default: 100) |
| `cols` | number | Max preview columns (default: 100) |
| `generateHeaders` | boolean | Auto-generate column headers if first row isn't headers |
| `keepLeadingZeros` | boolean | Preserve leading zeros in numeric strings |

**Response** (200, ~171ms):
```json
[
  {
    "cellRange": "A1:AK3216",
    "data": [
      ["Order ID", "Order Date", "Order Priority", "...34 more"],
      ["6", "2013-11-13", "Not Specified", "...34 more"],
      ["32", "2013-04-07", "High", "...34 more"],
      "...97 more"
    ],
    "colRange": "A1:AK1",
    "dataRange": "A2:AK3216"
  }
]
```

First row of `data` contains column headers. Subsequent rows are data.

---

### 3. Sheet Selection (XLSX Only)

For XLSX files, get the list of sheets before previewing:

```
POST /api/connectors/file/V2/fileupload/sheetnames/chunked
```

**Body:**
```json
{
  "fileNameUI": "Sample Data.xlsx",
  "fileName": "i9PboPZ-NoPj5O2uvVNE5",
  "fileLength": 1570397,
  "chunksQuantity": 2,
  "fileType": "xlsx",
  "rows": 100,
  "cols": 100,
  "generateHeaders": false,
  "keepLeadingZeros": false
}
```

**Response** (200, ~962ms):
```json
["Sheet1"]
```

Returns an array of sheet names. Use the selected sheet name in the preview request by adding it to the `selectTables` configuration.

Then call `preview/chunked` with the same body (plus sheet selection metadata) to parse the selected sheet.

---

### 4. Create Stream (Dataset)

**Sequence (Seq 7 / Seq 14):**

```
POST /api/data/v1/streams
```

**Body:**
```json
{
  "transport": {
    "type": "CONNECTOR",
    "description": "com.domo.connector.large.fileupload",
    "version": 0
  },
  "configuration": [
    {
      "category": "METADATA",
      "name": "dragAndDrop",
      "type": "string",
      "value": "{\"fileNameUI\":\"Sample Data.csv\",\"fileName\":\"wWi5A2agzwr_vAihETR6N\",\"fileLength\":2742436,\"chunksQuantity\":3,\"fileType\":\"csv\",\"rows\":100,\"cols\":100}"
    },
    {
      "category": "METADATA",
      "name": "selectTables",
      "type": "string",
      "value": "{\"fileName\":\"wWi5A2agzwr_vAihETR6N\",\"fileLength\":2742436,\"chunksQuantity\":3,\"metadata\":{\"fileType\":\"csv\",\"rows\":100,\"cols\":100,\"generateHeaders\":false,\"keepLeadingZeros\":false,\"fileNameUI\":\"Sample Data.csv\",\"useRawNumbers\":true,\"addBatchColumns\":true,\"format\":\"col\",\"encoding\":\"UTF-8\",\"delimiter\":\",\",\"dateType\":\"mmddyy\"}}"
    },
    {
      "category": "METADATA",
      "name": "schedule.type",
      "type": "string",
      "value": "MANUAL"
    }
  ],
  "account": null,
  "updateMethod": "REPLACE",
  "dataProvider": {
    "key": "large-file-upload"
  },
  "dataSource": {
    "name": "My Dataset Name",
    "description": "Optional description",
    "cloudId": "domo"
  },
  "advancedScheduleJson": "{\"type\":\"MANUAL\",\"timezone\":\"UTC\"}",
  "scheduleRetryExpression": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `transport.type` | string | Always `"CONNECTOR"` |
| `transport.description` | string | Always `"com.domo.connector.large.fileupload"` |
| `configuration` | array | JSON-encoded metadata including file info and parse settings |
| `updateMethod` | string | `"REPLACE"` or `"APPEND"` |
| `dataProvider.key` | string | Always `"large-file-upload"` |
| `dataSource.name` | string | Dataset name in Data Center |
| `dataSource.cloudId` | string | Always `"domo"` |

**Key configuration fields (JSON-encoded strings):**

- `dragAndDrop` — file metadata (name, size, chunks, type)
- `selectTables` — parse settings including encoding, delimiter, date format, and sheet selection
- `schedule.type` — `"MANUAL"` for one-time upload

**Response** (201, ~889ms):
```json
{
  "id": 421,
  "dataSource": {
    "id": "9fb5e5f7-beee-423e-aa98-6c1cf57291be",
    "name": "My Dataset Name",
    "type": "large-file-upload",
    "status": "SUCCESS",
    "streamId": 421,
    "transportType": "CONNECTOR"
  },
  "updateMethod": "REPLACE",
  "scheduleState": "MANUAL"
}
```

After creation, the server indexes the uploaded file asynchronously. Monitor progress via `GET /api/data/v1/streams/{streamId}`.

---

## CSV vs XLSX Differences

| Aspect | CSV | XLSX |
|--------|-----|------|
| File type in requests | `"csv"` | `"xlsx"` |
| Sheet selection | Not needed | `sheetnames/chunked` → select sheet |
| Preview | `preview/chunked` | `preview/chunked` (after sheet selection) |
| Parse settings | `encoding`, `delimiter`, `dateType` | Same + sheet name in `selectTables` |
| Typical chunk count | Fewer (text is smaller) | More (binary format is larger) |

---

## selectTables Metadata Fields

The `selectTables` configuration value is a JSON string with these parse settings:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fileType` | string | — | `"csv"` or `"xlsx"` |
| `encoding` | string | `"UTF-8"` | File encoding (from csvparams) |
| `delimiter` | string | `","` | Column separator (CSV only) |
| `dateType` | string | `"mmddyy"` | Date parsing format |
| `generateHeaders` | boolean | `false` | Auto-generate headers from row 1 |
| `keepLeadingZeros` | boolean | `false` | Preserve leading zeros |
| `useRawNumbers` | boolean | `true` | Don't format numbers |
| `addBatchColumns` | boolean | `true` | Add _BATCH_ID_ and _BATCH_LAST_RUN_ columns |
| `format` | string | `"col"` | Parse format |

---

## Gotchas

1. **Chunks are binary** — `POST /data-files/large` uses `Content-Type: application/octet-stream`, not JSON. Each chunk is a raw binary segment of the file.

2. **Configuration values are double-encoded** — The `configuration` array in the stream body contains JSON objects where `value` is itself a JSON string. You must `JSON.stringify()` the metadata objects.

3. **Schema is null on create** — The `POST /streams` response has `schemaDefinition: null`. The schema is populated after the server finishes indexing. Poll `GET /streams/{id}` to see it.

4. **File tokens expire** — The `fileName` from chunk upload is temporary. Complete the stream creation promptly after upload.

5. **XLSX is slower** — Sheet name extraction (`sheetnames/chunked`) takes ~960ms vs ~170ms for CSV preview. XLSX parsing involves decompressing the binary format.

6. **Update method matters** — `"REPLACE"` overwrites all data on re-upload. `"APPEND"` adds new rows to existing data. Set this at stream creation time.
