# Magic ETL Tile Reference

> Farmed from 2,279 real dataflows on domo.domo.com on 2026-03-12.
> 42 unique tile types discovered. Full raw JSON examples in `tile-types-raw.json`.
> **Deep reference:** For complete JSON payload schemas with every field documented (captured from live API traffic), see `etl-tile-payloads.md`.

## Critical Rules

- **`databaseType` must be `"MAGIC"`** — not `"REDSHIFT"`.
- **Action `type` is a plain string** — e.g., `"GroupBy"`, not `{"id": "domo-group-by", "version": "v2"}`.
- **Properties are flat on the action** — not nested in a `variables` object.
- **`tables: [{}]`** — required on every action.
- **Column references use backticks** in expressions: `` `Column Name` ``
- **Native tiles first** — always prefer the 27 native Transform tiles + `ExpressionEvaluator` over SQL/scripting tiles. SQL tiles are a last resort for logic that native tiles genuinely can't express. See the SKILL.md "Tile Selection: Native First" section for the full decision guide.

---

## Complete Tile Catalog (42 types)

### Input (3)
| Type | UI Name | Key Properties |
|------|---------|----------------|
| `LoadFromVault` | Input DataSet | `dataSourceId` |
| `LoadFromIce` | Adrenaline Input | `dataSourceId`, `sqlQuery`, `sourceType` |
| `FixedInput` | Manual Data Entry | `schema`, `rows` |

### Output (3)
| Type | UI Name | Key Properties |
|------|---------|----------------|
| `PublishToVault` | Output DataSet | `dataSource.guid`, `inputs[]`, `versionChainType` |
| `PublishToWriteback` | Writeback Output | `dataSource`, `writebackInfo.guid` |
| `MakoVectorOutputAction` | Vector Output | `indexId`, `embeddingModel`, `content` |

### Transform (27)
| Type | UI Name | Key Properties |
|------|---------|----------------|
| `GroupBy` | Group By | `groups[]`, `fields[]` (name + expression) |
| `MergeJoin` | Join Data | `joinType`, `step1`, `step2`, `keys1[]`, `keys2[]` |
| `UnionAll` | Append Rows | `inputs[]`, `unionType`, `schemaSource` |
| `Filter` | Filter Rows | `filterList[]` (expression-based) |
| `SplitFilter` | Split Filter | `branches[]` (predicate + table), `elseTable` |
| `SelectValues` | Select Columns | `fields[]` (name, rename, remove) |
| `ExpressionEvaluator` | Add Formula | `expressions[]` (expression, fieldName) |
| `Constant` | Add Constants | `fields[]` (name, type, value) |
| `SetValueField` | Set Column Value | `fields[]` (name, replaceby) |
| `Metadata` | Set Column Type | `fields[]` (name, type, dateFormat) |
| `Order` | Sort | `orderBy[]` (expression, orderType) |
| `Unique` | Remove Duplicates | `fields[]` (name), `countRows` |
| `Limit` | Limit Rows | `limit`, `offset` |
| `ValueMapper` | Value Mapper | `fieldToUse`, `targetField`, `mappings[]` |
| `ReplaceString` | Find & Replace | `fields[]` (inStreamName, replaceString, replaceByString) |
| `ConcatFields` | Combine Columns | `targetFieldName`, `fields[]` (name) |
| `SplitColumnAction` | Split Column | `sourceColumn`, `delimiterType`, `additions[]` |
| `WindowAction` | Rank & Window | `orderRules[]`, `additions[]` (operation type) |
| `DateCalculator` | Date Operations | `calculations[]` (calcType, fieldA) |
| `NumericCalculator` | Calculator | `calculations[]` (calcType, fieldA, fieldB) |
| `StringCalculator` | String Operations | `calculations[]` (calcType, fieldA) |
| `TextFormatting` | Text Formatting | `fields[]` (name, letterCaseMod) |
| `Denormaliser` | Pivot | `keyField`, `group[]`, `fields[]` |
| `Normalizer` | Unpivot | `typefield`, `fields[]` (sourceField, destField) |
| `NormalizeAll` | Dynamic Unpivot | `idFields[]`, `keyField`, `valueField` |
| `JsonExpandAction` | JSON Expander | `operations[]` |
| `StashAction` | Store Columns | `selection`, `stashName` |
| `SplitJoin` | Split Join | `step1`, `step2`, `keys1[]`, `keys2[]`, `rightAntiTable` |

### SQL (3) — LAST RESORT

> **Use native tiles first.** Only use SQL tiles when logic is impossible or unreasonably complex with native tiles (correlated subqueries, complex CTEs, recursive queries, QUALIFY). If you must use one, name it descriptively and comment the SQL explaining why native tiles weren't used.

| Type | UI Name | Key Properties |
|------|---------|----------------|
| `SQL` | SQL Transform (Magic ETL) | `inputs[]`, `statements[]` |
| `SqlAction` | SQL Action (MySQL ETL) | `inputs[]`, `statements[]` |
| `GenerateTableAction` | SQL Generate (MySQL ETL) | `tableName`, `selectStatement` |

### AI/ML (3)
| Type | UI Name | Key Properties |
|------|---------|----------------|
| `TextGeneration` | AI Text Generation | `modelId`, `temperature`, `prompt`, `outputColumnName` |
| `MLInferenceAction` | AutoML Inference | `mlModelId`, `inferenceColumn` |
| `UserDefinedAction` | Custom ML Action | `actionDefinitionId`, `variables` |

### Scripting (2) — AVOID

> **Do not use scripting tiles unless the user explicitly requests them.** Python/R tiles are opaque, harder to maintain, and break the native-first principle. Use native tiles + `ExpressionEvaluator` instead.

| Type | UI Name | Key Properties |
|------|---------|----------------|
| `PythonEngineAction` | Python Script | `script`, `condaEnv`, `additions[]` |
| `REngineAction` | R Script | `script`, `additions[]` |

---

## Action Examples (Most Common Tiles)

### LoadFromVault (Input)
```json
{
  "type": "LoadFromVault",
  "id": "LoadFromVault-players",
  "name": "Player Stats",
  "dataSourceId": "daadc4a2-73f0-46ff-ac8b-164b29b64a9e",
  "executeFlowWhenUpdated": false,
  "pseudoDataSource": false,
  "truncateTextColumns": false,
  "truncateRows": false,
  "onlyLoadNewVersions": false,
  "recentVersionCutoffMs": 0,
  "tables": [{}]
}
```

### PublishToVault (Output)
```json
{
  "type": "PublishToVault",
  "id": "PublishToVault-output",
  "name": "Team Summary Output",
  "dependsOn": ["GroupBy-team"],
  "inputs": ["GroupBy-team"],
  "dataSource": {
    "guid": "11783376-5c23-4320-a0cd-54c155eb89eb",
    "type": "DataFlow",
    "name": "Output Dataset Name",
    "cloudId": "domo"
  },
  "versionChainType": "REPLACE",
  "schemaSource": "DATAFLOW",
  "partitioned": false,
  "tables": [{}]
}
```

### GroupBy (Aggregate)
```json
{
  "type": "GroupBy",
  "id": "GroupBy-team",
  "name": "Aggregate by Team",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "addLineNumber": false,
  "giveBackRow": false,
  "allRows": false,
  "groups": [
    { "name": "Team" }
  ],
  "fields": [
    { "name": "Total_FP", "expression": "SUM(`FP`)", "source": null, "type": null, "valuefield": null, "settings": null },
    { "name": "Avg_FP", "expression": "AVG(`FP`)", "source": null, "type": null, "valuefield": null, "settings": null },
    { "name": "Player_Count", "expression": "COUNT(`Name`)", "source": null, "type": null, "valuefield": null, "settings": null }
  ],
  "tables": [{}]
}
```

### MergeJoin (Join)
```json
{
  "type": "MergeJoin",
  "id": "MergeJoin-join",
  "name": "Join Data",
  "dependsOn": ["LoadFromVault-left", "LoadFromVault-right"],
  "joinType": "INNER",
  "relationshipType": "MANY_TO_MANY",
  "step1": "LoadFromVault-left",
  "step2": "LoadFromVault-right",
  "keys1": ["order_id"],
  "keys2": ["order_number"],
  "schemaModification2": [
    { "name": "duplicate_col", "rename": "right.duplicate_col", "remove": true }
  ],
  "tables": [{}]
}
```
Join types: `INNER`, `LEFT`, `RIGHT`, `OUTER`

### Filter (Filter Rows)
```json
{
  "type": "Filter",
  "id": "Filter-active",
  "name": "Filter Active",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "filterList": [
    {
      "leftField": null, "rightField": null, "rightValue": null, "rightExpr": null,
      "operator": null,
      "expression": "`Status` = 'Active' AND `Amount` > 0",
      "andFilterList": []
    }
  ],
  "tables": [{}]
}
```
Uses SQL expressions in `filterList[].expression`.

### ExpressionEvaluator (Add Formula)
```json
{
  "type": "ExpressionEvaluator",
  "id": "ExpressionEvaluator-calc",
  "name": "Add Calculations",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "expressions": [
    { "expression": "CONCAT(`order_id`, '_', `rma_number`)", "fieldName": "UniqueID", "settings": {} },
    { "expression": "'US'", "fieldName": "Country", "settings": {} }
  ],
  "tables": [{}]
}
```

### SelectValues (Select/Rename Columns)

> **Convention:** `remove: false` = **keep** this column, `remove: true` = **drop** it. List every column you want to keep with `remove: false`. This is counterintuitive — you're listing columns to keep, not to remove.

```json
{
  "type": "SelectValues",
  "id": "SelectValues-final",
  "name": "Select Columns",
  "dependsOn": ["ExpressionEvaluator-calc"],
  "input": "ExpressionEvaluator-calc",
  "fields": [
    { "name": "Team", "rename": "", "type": null, "dateFormat": null, "settings": {}, "remove": false },
    { "name": "serial", "rename": "Serial_Number", "type": null, "dateFormat": null, "settings": {}, "remove": false },
    { "name": "unwanted_col", "rename": "", "type": null, "dateFormat": null, "settings": {}, "remove": true }
  ],
  "tables": [{}]
}
```

### UnionAll (Append Rows)
```json
{
  "type": "UnionAll",
  "id": "UnionAll-stack",
  "name": "Append Rows",
  "dependsOn": ["input-a", "input-b"],
  "inputs": ["input-a", "input-b"],
  "unionType": "INCLUDE_ALL",
  "schemaSource": "input-a",
  "strict": false,
  "tables": [{}]
}
```

### SQL (SQL Transform) — LAST RESORT

> **Prefer native tiles.** The example below (GROUP BY) should use a `GroupBy` tile instead. Only use SQL for logic that native tiles can't express — correlated subqueries, complex CTEs, recursive queries, QUALIFY, or multi-statement procedural logic. Name descriptively and comment why.

```json
{
  "type": "SQL",
  "id": "SQL-complex-attribution",
  "name": "Complex Attribution Logic — SQL",
  "dependsOn": ["LoadFromVault-input"],
  "inputs": ["LoadFromVault-input"],
  "statements": [
    "/* Native tiles can't handle this correlated subquery pattern */\nSELECT a.*, (SELECT MAX(\"score\") FROM \"LoadFromVault-input\" b WHERE b.\"team\" = a.\"team\" AND b.\"date\" < a.\"date\") AS \"prev_best\" FROM \"LoadFromVault-input\" a"
  ],
  "columnSettings": {},
  "tables": [{}]
}
```
SQL tiles reference upstream actions by their **action ID** as the table name. Use double quotes for identifiers.

### Order (Sort)
```json
{
  "type": "Order",
  "id": "Order-sort",
  "name": "Sort by Points",
  "dependsOn": ["GroupBy-team"],
  "input": "GroupBy-team",
  "orderBy": [
    {
      "orderType": "DESCENDING",
      "expression": { "type": "Field", "context": null, "table": null, "name": "Total_FP" },
      "settings": null,
      "invert": true
    }
  ],
  "tables": [{}]
}
```

### Unique (Remove Duplicates)
```json
{
  "type": "Unique",
  "id": "Unique-dedup",
  "name": "Remove Duplicates",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "countRows": false,
  "fields": [
    { "name": "account_id", "caseInsensitive": false }
  ],
  "tables": [{}]
}
```

### WindowAction (Rank & Window)
```json
{
  "type": "WindowAction",
  "id": "WindowAction-rank",
  "name": "Rank by Score",
  "dependsOn": ["GroupBy-team"],
  "input": "GroupBy-team",
  "orderRules": [
    { "column": "Total_FP", "caseSensitive": false, "ascending": false }
  ],
  "additions": [
    {
      "name": "Rank",
      "operation": { "type": "RANKING", "operationType": "ROW_NUMBER" }
    }
  ],
  "tables": [{}]
}
```

### Constant (Add Constants)
```json
{
  "type": "Constant",
  "id": "Constant-add",
  "name": "Add Constants",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "fields": [
    { "type": "STRING", "name": "Source", "value": "Fantasy Football", "expr": null }
  ],
  "tables": [{}]
}
```

### Metadata (Set Column Type)
```json
{
  "type": "Metadata",
  "id": "Metadata-types",
  "name": "Set Column Type",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "fields": [
    { "name": "Amount", "rename": null, "type": "DOUBLE", "dateFormat": null, "settings": {}, "remove": false }
  ],
  "tables": [{}]
}
```

### ValueMapper (Map Values)
```json
{
  "type": "ValueMapper",
  "id": "ValueMapper-map",
  "name": "Map Regions",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "fieldToUse": "State",
  "targetField": "Region",
  "unmappedBehavior": "KEEP_ORIGINAL",
  "mappings": [
    { "from": "CA", "fromExpr": null, "to": "West", "toExpr": null },
    { "from": "NY", "fromExpr": null, "to": "East", "toExpr": null }
  ],
  "tables": [{}]
}
```

### Limit (Limit Rows)
```json
{
  "type": "Limit",
  "id": "Limit-top",
  "name": "Top 1000",
  "dependsOn": ["Order-sort"],
  "input": "Order-sort",
  "limit": 1000,
  "offset": 1,
  "tables": [{}]
}
```

### Normalizer (Unpivot)
Converts wide columns into rows. Each entry in `fields[]` maps a source column to a row in the output. The `typefield` becomes a new column containing an identifier for which source column the value came from. Use `typefieldValue` to set a custom label (defaults to the source column name if null).
```json
{
  "type": "Normalizer",
  "id": "Normalizer-unpivot",
  "name": "Unpivot Service Types",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "typefield": "ServiceType",
  "fields": [
    { "sourceField": "DeliveryCount", "typefieldValue": "Delivery", "destField": "OrderCount" },
    { "sourceField": "PickupCount", "typefieldValue": "Pickup", "destField": "OrderCount" },
    { "sourceField": "ToGoCount", "typefieldValue": "ToGo", "destField": "OrderCount" }
  ],
  "tables": [{}]
}
```
**How it works:** Each row in the input produces N output rows (one per `fields[]` entry). All columns not listed in `fields[].sourceField` are passed through as-is. The `typefield` column gets the `typefieldValue` label, and the `destField` column gets the value from `sourceField`.

**Multiple value columns:** To unpivot multiple value columns per service type (e.g., OrderCount AND GrossSales), use multiple Normalizer tiles in sequence, or use multiple `fields[]` entries with different `destField` names pointing to the same `typefieldValue`. For complex multi-column unpivots, consider using a SQL tile instead.

### NormalizeAll (Dynamic Unpivot)
Unpivots ALL columns except the specified `idFields[]` into key-value pairs. Simpler than `Normalizer` when you want to melt everything.
```json
{
  "type": "NormalizeAll",
  "id": "NormalizeAll-melt",
  "name": "Melt All Metrics",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "idFields": ["StoreID", "Day_of_Business"],
  "keyField": "Metric",
  "valueField": "Amount",
  "tables": [{}]
}
```
**How it works:** Every column NOT in `idFields[]` becomes a row. The column name goes into `keyField`, the value into `valueField`. Output has: all `idFields` columns + `keyField` (STRING) + `valueField` (original type).

---

## Dataflow Wrapper

```json
{
  "name": "My ETL Name",
  "description": "What this ETL does",
  "databaseType": "MAGIC",
  "actions": [ ... ]
}
```

Optional top-level `gui` with `canvases.default.elements[]` for canvas positioning.
