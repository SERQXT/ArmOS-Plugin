# Domo API reference (debug and context)

The MCP tools (`domo-datasets`, `domo-pages`, `domo-publish`, `domo-appdb`, `domo-dataflows`, `domo-ai-chat`) are the primary interface for all Domo operations in this pipeline. This reference documents the underlying API endpoints those tools call — use it for debugging failures, understanding response shapes, and when the agent needs context about what an MCP tool does internally.

**When to load:** On demand — when an MCP tool returns an unexpected error and you need to understand the underlying API behavior.

---

## 1. Authentication (how the MCP tools authenticate)

The MCP servers handle auth transparently. You do NOT manage tokens.

Authentication is fully automatic — ArmOS injects the correct credentials into every MCP request. If a tool returns 401, call `authenticate_instance` to re-authenticate. Do NOT create developer tokens or set environment variables.

The MCP layer uses Ryuu CLI sessions internally (OAuth refresh → Bearer → SID exchange). This is invisible to you.

---

## 2. Dataset SQL query

**Endpoint:** `POST /api/query/v1/execute/{datasetId}`

```json
{"sql": "SELECT * FROM table WHERE col = 'val' LIMIT 10"}
```

- The table name is always `table` — it refers to the dataset itself
- Supports SELECT, WHERE, GROUP BY, ORDER BY, LIMIT, LIKE, IN, COUNT
- Column names with spaces: backtick-escape (`` `Column Name` ``)
- `LIMIT 0` returns column schema only (useful for discovery)
- Returns: `{ "columns": [...], "rows": [[...], ...], "metadata": [...] }`

---

## 3. Datasets

| Action | Method | Endpoint |
|--------|--------|----------|
| List | GET | `/api/data/v3/datasources?limit=50&offset=0` |
| Get one | GET | `/api/data/v3/datasources/{datasetId}` |

Max 50 per page (hard limit). Increment `offset` by 50 until returned list < 50.

Key response fields: `id` (UUID), `name`, `type` (connector type), `state` (IDLE/SUCCESS/ERROR), `rowCount`, `columnCount`, `lastUpdated` (epoch ms).

---

## 4. Dataflows / ETLs

| Action | Method | Endpoint |
|--------|--------|----------|
| List all | GET | `/api/dataprocessing/v1/dataflows` |
| Get details | GET | `/api/dataprocessing/v1/dataflows/{id}` |
| Update | PUT | `/api/dataprocessing/v1/dataflows/{id}` |
| Trigger execution | POST | `/api/dataprocessing/v1/dataflows/{id}/executions` |
| Execution history | GET | `/api/dataprocessing/v1/dataflows/{id}/executions?limit=5&offset=0` |

The list endpoint ignores `limit`/`offset` — returns ALL dataflows in one response.

**Modify workflow:** GET full dataflow JSON -> modify `actions[]` -> PUT entire object back -> POST to trigger execution. Do NOT use `?hydrate=full` (returns 400 for some dataflows).

Modifiable fields by tile type:
- `ExpressionEvaluator`: `expressions[].expression`, `expressions[].fieldName`
- `SelectValues`: `fields[].name`, `fields[].rename`
- `MergeJoin`: `keys1[]`, `keys2[]`
- `Filter`: `filterList[].leftField`
- `PythonEngineAction`: `script`
- `LoadFromVault`: `dataSourceId`

---

## 5. App Studio

| Action | Method | Endpoint |
|--------|--------|----------|
| App datastores | GET | `/api/datastores/v1/collections?appId={appId}` |
| Page info | GET | `/api/content/v1/pages/{pageId}` |
| Page cards | GET | `/api/content/v1/pages/{pageId}/cards` |

App IDs and page IDs come from App Studio URLs: `/app-studio/{appId}/pages/{pageId}`.

---

## 6. Known dataset types

Common `type` / `dataProviderType` values: `dataset-view`, `DataFlow`, `emailer`, `webform`, `api`, `large-file-upload`, `sftp-advanced`, `Jupyter`, `workbench-odbc`, `google-bigquery-service`, `domostats`, `domo-federateddata`, `salesforce`, `snowflake`, `postgresql`, `json5`, `amazon-s3`.

---

## 7. Debugging common MCP tool failures

| Error | Likely cause | Fix |
|-------|-------------|-----|
| 401 Unauthorized | SID expired or dev token invalid | MCP server should re-auth automatically; if persistent, check MCP config |
| 404 on dataset query | Wrong datasetId or dataset deleted | Verify ID with `domo-datasets` list tool |
| 400 on dataflow PUT | Used `?hydrate=full` on GET | Fetch without hydrate flag |
| Empty `domo.env` | Manifest missing `scopes: ["data", "user"]` | Add scopes to manifest.json |
| `procode_publish` targeting wrong instance | Instance mismatch in pipeline brief | Verify instance in pipeline brief; MCP config should have correct target |
