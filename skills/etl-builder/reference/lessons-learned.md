# Magic ETL Lessons Learned

> Hard-won knowledge from building and testing the ETL Builder against
> domo-alex-dengate.domo.com, domo.domo.com, and squads.domo.com.
> Last updated: 2026-03-12.

---

## 1. databaseType Must Be "MAGIC" — Not "REDSHIFT"

**What happened:** Dataflows created with `"databaseType": "REDSHIFT"` were accepted by the API (201 Created) but **always failed execution** with error code `DP-50000` / `FAILED_DATA_FLOW`. No useful error message — just silent failure.

**Root cause:** The Domo API accepts both values without validation at create time, but the execution engine routes `REDSHIFT` to the old MySQL ETL runtime which doesn't understand Magic ETL action types.

**Fix:** Always use `"databaseType": "MAGIC"`. The only way we discovered this was by inspecting a working ETL on domo.domo.com via `dataflow_get` and comparing the `databaseType` field.

**Detection:** If an ETL creates successfully but consistently fails execution with no clear action-level error, check `databaseType` first.

---

## 2. Action Type Is a Plain String — Not an Object

**What happened:** The `dataflow_action_definitions` endpoint returns tile definitions with type objects like:
```json
{ "id": "domo-group-by", "version": "v2" }
```
We initially used these as the action `type` field. The API accepted the dataflow but properties were silently dropped.

**Root cause:** The action definitions endpoint describes the **tile catalog metadata**, not the runtime format. Real dataflows use plain strings like `"GroupBy"`, `"Filter"`, `"ExpressionEvaluator"`.

**Fix:** Always use the plain string type. See `etl-tiles.md` for the complete catalog of 42 verified type strings.

**How we discovered this:** Called `dataflow_get` on a real working ETL (Sony dataflow, ID 1 on domo-alex-dengate) and compared the action format.

---

## 3. Properties Are Flat — Not Nested in "variables"

**What happened:** Based on `dataflow_action_definitions`, we structured actions with properties inside a `variables` object:
```json
{
  "type": { "id": "domo-group-by", "version": "v2" },
  "variables": { "groupByFields": ["Team"], "aggregations": [...] }
}
```
The API accepted this silently but **dropped all the variables**. The created dataflow had empty actions.

**Root cause:** Magic ETL actions expect properties as flat, top-level fields on the action object. The `variables` nesting is a different format (possibly for older MySQL ETL or the action definitions catalog).

**Fix:** All properties go directly on the action:
```json
{
  "type": "GroupBy",
  "groups": [{ "name": "Team" }],
  "fields": [{ "name": "Total", "expression": "SUM(`Points`)" }]
}
```

**Key lesson:** The API's silent acceptance of malformed actions is the most dangerous gotcha. Always verify with `dataflow_get` after creation to confirm actions persisted correctly.

---

## 4. "FilterValues" Doesn't Exist — Use "Filter"

**What happened:** We guessed the filter tile type was `"FilterValues"` based on naming conventions. The API rejected it with `"Illegal action type: FilterValues"`.

**Root cause:** The correct type is `"Filter"` with a `filterList[]` array using SQL-style expressions.

**Fix:**
```json
{
  "type": "Filter",
  "filterList": [{
    "expression": "`Status` = 'Active' AND `Amount` > 0",
    "leftField": null, "rightField": null, "rightValue": null,
    "rightExpr": null, "operator": null, "andFilterList": []
  }]
}
```

**Key lesson:** Never guess type strings. Always reference `etl-tiles.md` or inspect a real dataflow. The tile names in the Domo UI don't match the API type strings.

---

## 5. "SQLTransform" Doesn't Exist — Use "SQL"

**What happened:** Attempted to create an action with `"type": "SQLTransform"`. Got `"Illegal action type: SQLTransform"`.

**Fix:** The correct type is `"SQL"` with `statements[]` and `inputs[]`. SQL tiles reference upstream actions by their **action ID** as the table name, using double-quoted identifiers:
```sql
SELECT "Team", SUM("FP") AS "Total" FROM "LoadFromVault-input" GROUP BY "Team"
```

---

## 6. GroupBy Uses "groups" and "fields" — Not "groupByFields" / "aggregations"

**What happened:** Used `groupByFields` and `aggregations` property names. The dataflow created but with empty GroupBy actions — properties silently dropped.

**Root cause:** The correct property names are:
- `groups: [{ "name": "Column_Name" }]` — columns to group by
- `fields: [{ "name": "Output_Name", "expression": "SUM(`Column`)" }]` — aggregation expressions

The `expression` field uses SQL aggregation syntax with backtick-quoted column names.

**Fix:** See `etl-tiles.md` → GroupBy section for the full verified schema.

---

## 7. Output Datasets — Do NOT Pre-Create via Streams API

**What happened (original):** Created a dataflow referencing a non-existent output dataset GUID. Execution failed.

**What happened (revised):** Pre-created the output dataset via `POST /api/data/v1/streams` with `dataProvider: "domo-csv"`. The dataflow executed, but the output dataset showed as type `domo-csv` ("dataset copy") instead of `DataFlow`. This is the wrong dataset type — real ETL outputs are `type: DataFlow`.

**Root cause:** The streams API creates API-upload datasets (`domo-csv` type). Magic ETL outputs should be `DataFlow` type, which is only created by the dataflow engine itself.

**Correct approach:** Do NOT pre-create output datasets. Instead, set `PublishToVault` with a `dataSource` that has `type: "DataFlow"` and a `name` but NO `guid`. The dataflow engine creates the output dataset on first execution with the correct type.

Verified format from working dataflows:
```json
{
  "type": "PublishToVault",
  "id": "output-my-data",
  "name": "My Output",
  "dependsOn": ["previous-step"],
  "inputs": ["previous-step"],
  "dataSource": {
    "type": "DataFlow",
    "name": "My Output Dataset Name",
    "cloudId": "domo"
  },
  "versionChainType": "REPLACE",
  "schemaSource": "DATAFLOW",
  "partitioned": false,
  "tables": [{}]
}
```

Also include in the top-level `outputs` array:
```json
"outputs": [{ "dataSourceId": null, "dataSourceName": "My Output Dataset Name", "versionChainType": "REPLACE" }]
```

The engine creates the dataset and backfills the `guid`/`dataSourceId` after first execution.

**If you need to wire to an EXISTING dataset** (e.g., replacing data in a dataset that already has cards), then use the existing dataset's GUID — but make sure it was originally created by a dataflow (`type: DataFlow`), not via the streams API.

---

## 8. The 403 on Dataflow Create May Be a Validation Error — Not Just Auth

**What happened:** `POST /api/dataprocessing/v1/dataflows` returned 403. We assumed it was purely a permissions/token issue.

**Root cause:** The 403 was partially caused by missing or invalid fields in the payload (e.g., no `databaseType`). Once we added `"databaseType": "MAGIC"`, the same token worked fine.

**Fix:** If you get a 403 on create:
1. First verify the payload has `databaseType: "MAGIC"` and valid action types
2. Then check token permissions (needs admin scope)
3. Call `authenticate_instance` to refresh credentials if the above checks pass

---

## 9. dataflow_action_definitions Only Returns Data Science Tiles

**What happened:** Called `GET /api/dataprocessing/v1/dataflows/action-definitions` expecting the full catalog of ~42 tile types. Only got ~10 results, mostly R/Python scripting tiles.

**Root cause:** This endpoint only catalogs "action definitions" for extensible/plugin tiles (Python, R, custom ML actions). The standard built-in tiles (GroupBy, Filter, Join, etc.) are hardcoded in the engine and not listed here.

**Fix:** To discover tile types, inspect real dataflows:
1. `dataflow_search` to find ETLs
2. `dataflow_get` on each to extract action configurations
3. We farmed 2,279 dataflows on domo.domo.com to build the complete 42-type catalog in `etl-tiles.md`

---

## 10. tables: [{}] Is Required on Every Action

**What happened:** Omitted the `tables` property from actions. Inconsistent behavior — some actions worked, others failed silently.

**Fix:** Always include `"tables": [{}]` on every action, even though it seems meaningless. This is a legacy field that the engine checks for.

---

## 11. Column References Use Backticks in Expressions, Double Quotes in SQL

**Expressions** (ExpressionEvaluator, GroupBy fields, Filter expressions):
```
`Column Name`
```

**SQL tiles** (SQL type with statements[]):
```sql
"Column Name"
```

Mixing these up causes silent failures or incorrect results.

---

## 12. Append Rows Uses "UnionAll" — Not "Append"

**What happened:** The UI calls it "Append Rows" but the API type is `"UnionAll"`, not `"Append"`.

**Fix:** Always use `"UnionAll"` with `inputs[]`, `unionType`, and `schemaSource` properties.

---

## 13. dataset_list Returns Nested Object — Not Direct Array

**What happened:** Expected `dataset_list` to return `[{...}, {...}]`. Got an error trying to iterate the response.

**Root cause:** The endpoint returns `{ "dataSources": [...], "_metaData": {...} }`.

**Fix:** Access `response.dataSources` for the array. The `_metaData` object has `totalCount`, `limit`, `offset` for pagination.

---

## 14. Dataset API Max Limit Is 50

**What happened:** Requested `limit=100` on dataset list. Got HTTP 400.

**Fix:** Maximum `limit` parameter is 50. Use `offset` for pagination:
```
GET /api/data/v3/datasources?limit=50&offset=0
GET /api/data/v3/datasources?limit=50&offset=50
```

---

## 15. Missing Accept Header Returns HTML Login Page — Not JSON

**What happened:** Raw `curl` and `fetch` calls to the Domo API returned HTTP 200 with `Content-Type: text/html` — the full Domo login page SPA shell. No error, no redirect, just HTML. The auth token was valid.

**Root cause:** Without `Accept: application/json`, some Domo instances route the request through their web application layer instead of the API layer. The web layer sees no session cookie, so it serves the login page as a 200 OK. This behavior varies by instance — some instances return JSON without the header, others don't.

**Fix:** Always send `Accept: application/json` alongside the auth header:
```javascript
const headers = {
  'X-DOMO-Developer-Token': token,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
```

**Detection:** If an API call returns 200 but the body starts with `<!DOCTYPE html>` or `content-type` is `text/html`, the Accept header is missing.

**Applied fix:** All `domo-client.js` files across `shared/mcps/` now include `Accept: application/json` by default.

---

## 16. Sort orderType Is "DESCENDING" / "ASCENDING" — Not "DESC" / "ASC"

**What happened:** Used `"orderType": "DESC"` on an Order action. Got validation error: `VALIDATION-DIV` — "The value is invalid for expected type" for `actions[n].orderBy[0].orderType`.

**Fix:** Use `"DESCENDING"` or `"ASCENDING"` (full words).

---

## 17. versionChainType Is "REPLACE" — Not "OVERWRITE"

**What happened:** Used `"versionChainType": "OVERWRITE"` on a PublishToVault action. Got `VALIDATION-DIV` error.

**Fix:** Use `"REPLACE"` (or `"APPEND"` for append mode).

---

## 18. PublishToVault dataSource Needs name, type, and cloudId

**What happened:** Output action had `"dataSource": {"guid": "..."}` but no `name`. Execution failed with `DP-61020`: "Action is not fully configured. It is missing the dataSource.name property."

**Fix:** The full `dataSource` object for a new output:
```json
"dataSource": {
  "type": "DataFlow",
  "name": "Output Dataset Name",
  "cloudId": "domo"
}
```
For an existing output (re-run), add `"guid": "existing-uuid"`.

See lesson #7 for the full PublishToVault pattern.

---

## 19. Newly Created Dataflows Start Paused

**What happened:** After creating a dataflow and attempting execution, got HTTP 400 Bad Request. The dataflow had `paused: true`.

**Fix:** After creating, update the dataflow with `"paused": false` before executing. Or include `"paused": false` in the initial create payload.

---

## 20. Magic ETL HAS Native Unpivot Tiles — Don't Simulate with Formula+Union

**What happened:** Built a 9-branch Formula + Union pipeline to simulate unpivoting, not knowing Magic ETL has native `Normalizer` (Unpivot) and `NormalizeAll` (Dynamic Unpivot) tiles.

**Root cause:** The tiles exist in the catalog (`etl-tiles.md`) but had no examples, so the agent defaulted to a manual approach. No real-world dataflows on domo.domo.com used them in the first 500 sampled.

**Fix:** Two native tiles exist:
- **`Normalizer`** (Unpivot): Maps specific wide columns to rows. Properties: `typefield` (new label column), `fields[]` with `sourceField`, `typefieldValue` (label for that row), `destField` (output value column).
- **`NormalizeAll`** (Dynamic Unpivot): Melts ALL columns except `idFields[]` into key-value pairs. Properties: `idFields[]`, `keyField`, `valueField`.

Both verified on domo-alex-dengate.domo.com — the API accepts them and the engine stores them correctly. See `etl-tiles.md` for full examples.

**Key lesson:** Always check the tile catalog before designing workarounds. If a tile exists in the catalog, use it — even if there are no example dataflows using it.

---

## 13. SelectValues: Omit Columns to Drop, Don't Use `remove: true`

**Symptom:** `domo_dataflow_save` (PUT) returns 400 with no detail when updating a dataflow that has SelectValues tiles with `remove: true` on fields.

**Cause:** The SelectValues tile's `fields` array should only list columns you want to KEEP. Including columns with `remove: true` causes the API to reject the payload silently. The `remove` property is not a valid way to drop columns — the tile works by inclusion, not exclusion.

**Fix:** To drop columns from a dataset, list ONLY the columns you want to keep in the SelectValues `fields` array. Do not include the columns you want to drop at all — not even with `remove: true`.

```json
{
  "type": "SelectValues",
  "fields": [
    { "columnName": "KeepThis", "remove": false },
    { "columnName": "AlsoKeep", "remove": false }
  ]
}
```

**Additional lesson:** `domo_dataflow_save` (PUT to update an existing dataflow) is less reliable than `domo_dataflow_create` (POST). If PUT returns 400 with no detail, create a new corrected dataflow instead of trying to fix the existing one. The new dataflow can target the same output dataset.

---

## 21. Always Use `wait=true` on `dataflow_execute`

**What happened:** The agent called `dataflow_execute(id)` (fire-and-forget), then manually polled `dataflow_status` or `dataflow_executions` in a loop every 5-10 seconds. This wasted 5-20 API calls per execution.

**Fix:** Use `dataflow_execute(dataflow_id, wait=true, timeout_seconds=300)`. The tool polls internally and returns the final execution status — success or failure — in a single call. Never manually poll with `dataflow_status` in a loop.

---

## 22. The ETL Spec Contains All Dataset IDs and Schemas — Use Them Directly

**What happened:** The agent received a spec from the ETL Spec Designer that already included dataset IDs, schemas, and profiling data. It then re-called `dataset_list(query=...)`, `dataset_schema(id)`, and `dataset_profile(id)` for every dataset — wasting 10+ API calls on data it already had.

**Fix:** The ETL spec is the source of truth. If it includes dataset IDs, use `dataset_get(id)` directly — don't search by name. If it includes schemas, don't re-call `dataset_schema`. Only profile datasets that aren't already documented in the spec.

---

## 23. Use `dataset_get(id)` When You Have the ID — Not `dataset_list(query=...)`

**What happened:** The agent had dataset IDs from the spec but called `dataset_list(query="VBEP")` and parsed the results to find the matching ID. This wastes a call and risks picking the wrong dataset if multiple match.

**Fix:** When you have a dataset ID (e.g., `5b1882e7-137c-4690-b83f-7959ba86d1eb`), call `dataset_get(dataset_id)` directly. Only use `dataset_list(query=...)` when you genuinely don't know the dataset ID.

---

## 24. Reference Datasets Must Be Webform Type — Not "Dataset Copy"

**What happened:** The agent created reference/lookup datasets using `dataset_create` with default settings, which used the Streams API (`POST /api/data/v1/streams`) with `dataProvider: { key: 'domo-csv' }`. This creates "Dataset Copy" type datasets. These corrupted datasets caused ETL dataflow creation to fail with 500 errors — the ETL engine couldn't read them as valid inputs.

**Root cause:** "Dataset Copy" (domo-csv) datasets are intended for bulk CSV imports via the Streams API. They are NOT the correct type for reference data, lookup tables, or editable datasets. The correct type is **Domo Webform**, which creates proper editable datasets via `POST /api/data/v2/webforms`. The columns must be a top-level array in the payload — NOT nested inside `schema` or `schemaDefinition`.

**How to tell them apart in the Domo UI:**
- "Dataset Copy • Domo ..." = wrong (domo-csv via streams API)
- "Domo Webform" = correct (webform via datasources API)

**Fix:** `dataset_create` now defaults to webform type. To create a reference dataset with initial data:
```
dataset_create(
  name="My Lookup Table",
  columns=[{name: "Code", type: "STRING"}, {name: "Label", type: "STRING"}],
  data=[{"Code": "A", "Label": "Active"}, {"Code": "I", "Label": "Inactive"}]
)
```

Only use `type="api"` when you need the Streams API for large CSV imports (100K+ rows).

**Data upload for webforms:** Use `PUT /api/data/v2/webforms/{streamId}` with JSON `{ cloudId: "domo", name, columns, rows: [["val1","val2"], ...] }`. Do NOT use the streams API (`/api/data/v1/streams/{id}/executions`) — it puts data in the dataset but the Domo UI shows "Rows: 0" and "Last Run: never" because the metadata doesn't update properly.

**Key lesson:** If ETL creation returns 500 and the inputs are newly created datasets, check the dataset type first. "Dataset Copy" inputs are likely the cause.

---

## 25. Transient 500 Errors on Dataflow Create — Don't Blame the Payload

**What happened:** `POST /api/dataprocessing/v1/dataflows` returned HTTP 500 consistently. The agent assumed the payload was malformed and spent 20+ steps simplifying it, trying minimal 2-tile ETLs, and redesigning the JSON. Even a scaffold-mode create with just LoadFromVault → PublishToVault failed with 500.

**Root cause:** The Domo API was experiencing transient server-side issues. Read endpoints (search, get) worked fine, but write endpoints (create, update) returned 500. This resolved on its own after ~30 minutes.

**How to distinguish transient 500 from payload issues:**
1. If a minimal scaffold-mode create also fails with 500, it's server-side — not your payload
2. If read operations work but writes fail, it's server-side
3. Payload issues return 400 (Bad Request) or 403 (Forbidden), not 500

**Fix (for the agent):**
1. Try the create once. If 500, try scaffold mode with the same inputs as a diagnostic.
2. If scaffold also returns 500, **stop retrying**. Tell the user: "Domo API is returning 500 on write operations. This is a server-side issue, not a payload problem. Read operations still work. Wait 15-30 minutes and retry."
3. Do NOT simplify the payload, redesign the ETL, or burn steps — the payload is fine.
4. Save the ETL JSON to the working folder so it can be submitted later without rebuilding.

**Fix (infrastructure):** The `dataflow_create` tool now uses `domoJsonWithRetry` with automatic retry (2s, 4s backoff) on 500 errors. This handles brief transient spikes silently.

---

## Summary: Verification Checklist

Before executing any programmatically created ETL:

1. `databaseType` is `"MAGIC"` (not REDSHIFT)
2. All action `type` values are plain strings from the verified catalog
3. All properties are flat on the action (not in `variables`)
4. Every action has `tables: [{}]`
5. Every `dependsOn` references a valid action ID
6. Do NOT pre-create output datasets via streams API — let the dataflow create them
7. `PublishToVault.dataSource` has `type: "DataFlow"`, `name`, and `cloudId: "domo"`
8. Call `dataflow_get` after create to verify actions persisted correctly
9. Column references use backticks in expressions, double quotes in SQL
10. `orderType` is `"DESCENDING"`/`"ASCENDING"` (not DESC/ASC)
11. `versionChainType` is `"REPLACE"` (not OVERWRITE)
12. Set `paused: false` before executing (new dataflows start paused)
