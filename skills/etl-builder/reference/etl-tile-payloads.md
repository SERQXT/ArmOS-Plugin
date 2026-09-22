# Magic ETL — Tile Payload Reference

Deep reference companion to etl-tiles.md. Contains full JSON payload schemas for all Magic ETL tile types, captured from live Domo API traffic. Use etl-tiles.md for quick tile type lookup; use this file for exact JSON structure when building dataflow actions.

## How tiles work in the API

Every tile is an action object sent inside the `inprogress` POST body:

```json
{
  "procedures": [{
    "actions": [ ...tiles... ]
  }]
}
```

Every tile shares these **universal wrapper fields**:

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique tile ID. Format: `{Type}-{uuid}`. Stable across saves. |
| `type` | string | Action type key. Must match exactly (case-sensitive). |
| `name` | string | Display label shown in the canvas. |
| `dependsOn` | string[] | IDs of upstream tiles this tile reads from. |
| `disabled` | boolean | Exclude tile from execution without deleting it. |
| `removeByDefault` | boolean | ETL-internal flag; usually `false`. |
| `notes` | array | Inline annotations. Usually `[]`. |
| `settings.preferredDatabaseEntityType` | string | Always `"TEMP_VIEW"`. |
| `previewRowLimit` | number | null | Row cap for previews. `null` = no limit. |
| `gui` | object | Canvas position: `{ x, y, id, type: "Tile", color? }` |

---

## Input / Output

### LoadFromVault

Reads an existing Domo DataSet into the dataflow.

| Field | Type | Description |
|---|---|---|
| `dataSourceId` | string | GUID of the source DataSet |
| `skipValidation` | boolean | Skip schema validation on load. Default `false`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "LoadFromVault-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "LoadFromVault",
  "name": "My Input Dataset",
  "dependsOn": [],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "dataSourceId": "12345678-abcd-efgh-ijkl-123456789012",
  "skipValidation": false,
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 50,
    "y": 100,
    "id": "LoadFromVault-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### FixedInput

Manual inline data entry — hardcodes rows directly in the dataflow definition.

| Field | Type | Description |
|---|---|---|
| `schema` | object[] | Column definitions: `{ name, type }`. Types: `STRING`, `LONG`, `DOUBLE`, `DATE`, `DATETIME`. |
| `rows` | array[] | Array of row arrays. Each inner array is positional against `schema`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "FixedInput-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "FixedInput",
  "name": "Lookup Table",
  "dependsOn": [],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "schema": [
    { "name": "Code", "type": "STRING" },
    { "name": "Label", "type": "STRING" },
    { "name": "Weight", "type": "DOUBLE" }
  ],
  "rows": [
    ["A", "Alpha", 1.0],
    ["B", "Bravo", 2.0],
    ["C", "Charlie", 3.0]
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 50,
    "y": 200,
    "id": "FixedInput-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### PublishToVault

Writes the result to a Domo DataSet (output tile).

| Field | Type | Description |
|---|---|---|
| `dataSource.guid` | string | Target DataSet GUID. Empty string to create new. |
| `dataSource.name` | string | Display name for the output DataSet. |
| `inputs` | object[] | Column mappings: `{ name, alias, type }`. |
| `versionChainType` | string | `"REPLACE"` (overwrite) or `"APPEND"`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "PublishToVault-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "PublishToVault",
  "name": "Output Dataset",
  "dependsOn": ["GroupBy-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "dataSource": {
    "guid": "99999999-aaaa-bbbb-cccc-dddddddddddd",
    "name": "My Output Dataset"
  },
  "inputs": [
    { "name": "Category", "alias": "Category", "type": "STRING" },
    { "name": "Total", "alias": "Total", "type": "DOUBLE" }
  ],
  "versionChainType": "REPLACE",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 900,
    "y": 100,
    "id": "PublishToVault-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### PublishToWriteback

Writes results to an external writeback connector.

| Field | Type | Description |
|---|---|---|
| `dataSource` | object | `{ guid, name }` of the writeback connector DataSet. |
| `writebackInfo.guid` | string | Writeback configuration GUID. |
| `inputs` | object[] | Column mappings: `{ name, alias, type }`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "PublishToWriteback-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "PublishToWriteback",
  "name": "Writeback to Snowflake",
  "dependsOn": ["SelectValues-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "dataSource": {
    "guid": "88888888-aaaa-bbbb-cccc-dddddddddddd",
    "name": "Snowflake Writeback"
  },
  "writebackInfo": {
    "guid": "77777777-aaaa-bbbb-cccc-dddddddddddd"
  },
  "inputs": [
    { "name": "id", "alias": "id", "type": "LONG" },
    { "name": "value", "alias": "value", "type": "DOUBLE" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 900,
    "y": 200,
    "id": "PublishToWriteback-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Combine / Join

### UnionAll

Stacks rows from two or more upstream tiles. Columns matched by name.

| Field | Type | Description |
|---|---|---|
| `dependsOn` | string[] | Two or more upstream tile IDs. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "UnionAll-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "UnionAll",
  "name": "Union All",
  "dependsOn": [
    "LoadFromVault-11111111-2222-3333-4444-555555555555",
    "LoadFromVault-66666666-7777-8888-9999-aaaaaaaaaaaa"
  ],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 150,
    "id": "UnionAll-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### MergeJoin

Joins two upstream tiles on one or more key columns.

| Field | Type | Description |
|---|---|---|
| `joinType` | string | `"INNER"`, `"LEFT"`, `"RIGHT"`, `"FULL"`. |
| `joinCondition` | object[] | Array of `{ leftField, rightField }` key pairs. |
| `dependsOn` | string[] | Exactly 2 upstream tile IDs: `[leftTileId, rightTileId]`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "MergeJoin-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "MergeJoin",
  "name": "Join on Customer ID",
  "dependsOn": [
    "LoadFromVault-11111111-2222-3333-4444-555555555555",
    "LoadFromVault-66666666-7777-8888-9999-aaaaaaaaaaaa"
  ],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "joinType": "LEFT",
  "joinCondition": [
    { "leftField": "customer_id", "rightField": "cust_id" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 400,
    "y": 150,
    "id": "MergeJoin-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Filter / Sort / Select

### SelectValues

Choose, rename, and reorder columns.

| Field | Type | Description |
|---|---|---|
| `fields` | object[] | Array of `{ fieldName }` — columns to keep, in output order. |
| `renames` | object[] | Array of `{ sourceFieldName, targetFieldName }` — rename columns. |
| `removes` | object[] | Array of `{ fieldName }` — columns to explicitly drop. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "SelectValues-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "SelectValues",
  "name": "Select and Rename",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fields": [
    { "fieldName": "customer_id" },
    { "fieldName": "full_name" },
    { "fieldName": "revenue" }
  ],
  "renames": [
    { "sourceFieldName": "full_name", "targetFieldName": "Customer Name" }
  ],
  "removes": [],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 100,
    "id": "SelectValues-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### Limit

Return only the first N rows (after any upstream sort).

| Field | Type | Description |
|---|---|---|
| `rowLimit` | number | Maximum number of rows to return. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Limit-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Limit",
  "name": "Top 100 Rows",
  "dependsOn": ["Order-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "rowLimit": 100,
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 600,
    "y": 100,
    "id": "Limit-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### Order

Sort rows by one or more columns.

| Field | Type | Description |
|---|---|---|
| `fields` | object[] | Array of `{ fieldName, ascending }`. `ascending`: `true` = ASC, `false` = DESC. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Order-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Order",
  "name": "Sort by Revenue DESC",
  "dependsOn": ["GroupBy-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fields": [
    { "fieldName": "total_revenue", "ascending": false }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 100,
    "id": "Order-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Text Operations

### ConcatFields

Concatenates two or more columns (or literals) into a new column.

| Field | Type | Description |
|---|---|---|
| `targetFieldName` | string | Name of the new concatenated column. |
| `separator` | string | Delimiter between values. Empty string for no separator. |
| `fields` | string[] | Column names to concatenate, in order. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "ConcatFields-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "ConcatFields",
  "name": "Build Full Name",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "targetFieldName": "Full Name",
  "separator": " ",
  "fields": ["First Name", "Last Name"],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 300,
    "id": "ConcatFields-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### ReplaceString

Find-and-replace within a string column (literal or regex).

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Column to operate on. |
| `replaceString` | string | Substring or regex pattern to find. |
| `replaceByString` | string | Replacement value. |
| `useRegEx` | boolean | `true` to treat `replaceString` as regex. |
| `isUnicode` | boolean | Enable Unicode-aware matching. |
| `wholeWord` | boolean | Match whole words only. |
| `caseSensitive` | boolean | Case-sensitive matching. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "ReplaceString-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "ReplaceString",
  "name": "Strip Whitespace",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "description",
  "replaceString": "\\s+",
  "replaceByString": " ",
  "useRegEx": true,
  "isUnicode": false,
  "wholeWord": false,
  "caseSensitive": false,
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 400,
    "id": "ReplaceString-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### SplitColumnAction

Splits a string column into multiple columns by delimiter.

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Source column to split. |
| `delimiter` | string | Delimiter string (e.g. `","`, `" - "`). |
| `newFieldNames` | string[] | Names for each resulting column, in order. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "SplitColumnAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "SplitColumnAction",
  "name": "Split City-State",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "location",
  "delimiter": ", ",
  "newFieldNames": ["City", "State"],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 500,
    "id": "SplitColumnAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### StringCalculator

Performs string operations: substring, trim, pad, length, etc.

| Field | Type | Description |
|---|---|---|
| `calcType` | string | Operation: `"SUBSTRING"`, `"TRIM"`, `"LTRIM"`, `"RTRIM"`, `"LPAD"`, `"RPAD"`, `"LENGTH"`, `"REVERSE"`, `"INITCAP"`. |
| `fieldName` | string | Source column. |
| `resultFieldName` | string | Output column name. |
| `startPos` | number | Start position (for SUBSTRING). 0-based. |
| `length` | number | Length (for SUBSTRING, PAD). |
| `padChar` | string | Padding character (for LPAD/RPAD). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "StringCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "StringCalculator",
  "name": "Extract First 3 Chars",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "calcType": "SUBSTRING",
  "fieldName": "product_code",
  "resultFieldName": "category_prefix",
  "startPos": 0,
  "length": 3,
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 600,
    "id": "StringCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### TextFormatting

Changes text case: upper, lower, title case.

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Column to format. |
| `formatType` | string | `"UPPER"`, `"LOWER"`, `"TITLE"`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "TextFormatting-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "TextFormatting",
  "name": "Uppercase Names",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "customer_name",
  "formatType": "UPPER",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 700,
    "id": "TextFormatting-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Numeric & Date

### NumericCalculator

Performs arithmetic between columns and/or constants.

| Field | Type | Description |
|---|---|---|
| `calcType` | string | `"ADD"`, `"SUBTRACT"`, `"MULTIPLY"`, `"DIVIDE"`, `"MODULO"`, `"ABS"`, `"CEIL"`, `"FLOOR"`, `"ROUND"`, `"POWER"`, `"LOG"`, `"SQRT"`. |
| `fieldA` | string | First operand column name. |
| `fieldB` | string | Second operand column name (for binary ops). |
| `valueA` | number | Constant for first operand (if no column). |
| `valueB` | number | Constant for second operand (if no column). |
| `resultFieldName` | string | Output column name. |
| `resultType` | string | `"DOUBLE"` or `"LONG"`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "NumericCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "NumericCalculator",
  "name": "Calculate Margin",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "calcType": "SUBTRACT",
  "fieldA": "revenue",
  "fieldB": "cost",
  "resultFieldName": "margin",
  "resultType": "DOUBLE",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 400,
    "y": 300,
    "id": "NumericCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### DateCalculator

Date/time arithmetic and extraction.

| Field | Type | Description |
|---|---|---|
| `calcType` | string | `"ADD_DAYS"`, `"ADD_MONTHS"`, `"ADD_YEARS"`, `"ADD_HOURS"`, `"ADD_MINUTES"`, `"DATE_DIFF"`, `"EXTRACT_YEAR"`, `"EXTRACT_MONTH"`, `"EXTRACT_DAY"`, `"EXTRACT_HOUR"`, `"EXTRACT_MINUTE"`, `"EXTRACT_DAY_OF_WEEK"`, `"EXTRACT_WEEK"`, `"EXTRACT_QUARTER"`, `"TRUNCATE"`, `"FORMAT"`. |
| `fieldName` | string | Source date column. |
| `fieldB` | string | Second date column (for DATE_DIFF). |
| `value` | number | Numeric amount to add (for ADD_* operations). |
| `resultFieldName` | string | Output column name. |
| `dateFormat` | string | Format string (for FORMAT operation, e.g. `"yyyy-MM-dd"`). |
| `truncateUnit` | string | Unit for TRUNCATE: `"YEAR"`, `"MONTH"`, `"DAY"`, `"HOUR"`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "DateCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "DateCalculator",
  "name": "Days Between",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "calcType": "DATE_DIFF",
  "fieldName": "start_date",
  "fieldB": "end_date",
  "resultFieldName": "duration_days",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 400,
    "y": 400,
    "id": "DateCalculator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Column Management

### Constant

Adds a new column with a fixed value for every row.

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Name of the new column. |
| `fieldType` | string | Data type: `"STRING"`, `"LONG"`, `"DOUBLE"`, `"DATE"`, `"DATETIME"`. |
| `fieldValue` | string | The constant value (always a string, even for numbers). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Constant-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Constant",
  "name": "Add Source Label",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "data_source",
  "fieldType": "STRING",
  "fieldValue": "CRM Export",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 800,
    "id": "Constant-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### Metadata

Adds a metadata column (batch ID, row number, current date, dataflow name, etc.).

| Field | Type | Description |
|---|---|---|
| `metadataType` | string | `"ROW_NUMBER"`, `"BATCH_ID"`, `"CURRENT_DATE"`, `"CURRENT_DATETIME"`, `"DATAFLOW_NAME"`, `"DATAFLOW_ID"`, `"EXECUTION_ID"`. |
| `fieldName` | string | Name of the new column. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Metadata-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Metadata",
  "name": "Add Row Number",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "metadataType": "ROW_NUMBER",
  "fieldName": "row_num",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 900,
    "id": "Metadata-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### SetValueField

Conditionally sets a column value based on a filter expression.

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Column to modify. |
| `setValue` | string | Value to set when condition is true. |
| `condition` | object | Filter condition (same structure as FilterRows). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "SetValueField-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "SetValueField",
  "name": "Flag High Value",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "tier",
  "setValue": "Premium",
  "condition": {
    "operator": "GREATER_THAN",
    "fieldName": "lifetime_value",
    "value": "10000"
  },
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 1000,
    "id": "SetValueField-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### SchemaAction

Changes column data types (cast/convert).

| Field | Type | Description |
|---|---|---|
| `changes` | object[] | Array of `{ fieldName, fromType, toType, formatMask? }`. |
| `tables` | array | Always `[{}]` |

`formatMask` is required when converting to/from date types. Example: `"yyyy-MM-dd"`.

```json
{
  "id": "SchemaAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "SchemaAction",
  "name": "Cast Types",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "changes": [
    { "fieldName": "amount", "fromType": "STRING", "toType": "DOUBLE" },
    { "fieldName": "created_at", "fromType": "STRING", "toType": "DATE", "formatMask": "yyyy-MM-dd" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 300,
    "y": 1100,
    "id": "SchemaAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Aggregate & Reshape

### GroupBy

Aggregate rows by grouping columns.

| Field | Type | Description |
|---|---|---|
| `groupFields` | string[] | Columns to group by. |
| `aggregates` | object[] | Array of `{ fieldName, calcType, resultFieldName }`. |
| `tables` | array | Always `[{}]` |

`calcType` values: `"SUM"`, `"COUNT"`, `"COUNT_DISTINCT"`, `"AVG"`, `"MIN"`, `"MAX"`, `"FIRST"`, `"LAST"`, `"CONCAT_COMMA"`, `"CONCAT_DISTINCT"`, `"STDDEV"`, `"VARIANCE"`, `"MEDIAN"`.

```json
{
  "id": "GroupBy-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "GroupBy",
  "name": "Revenue by Category",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "groupFields": ["category"],
  "aggregates": [
    { "fieldName": "amount", "calcType": "SUM", "resultFieldName": "total_revenue" },
    { "fieldName": "order_id", "calcType": "COUNT_DISTINCT", "resultFieldName": "order_count" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 300,
    "id": "GroupBy-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### WindowAction

Window functions — aggregate or rank over a partition without collapsing rows.

| Field | Type | Description |
|---|---|---|
| `partitionFields` | string[] | Columns to partition by (equivalent to PARTITION BY). |
| `orderFields` | object[] | Array of `{ fieldName, ascending }` for ordering within the window. |
| `windowFunction` | string | `"ROW_NUMBER"`, `"RANK"`, `"DENSE_RANK"`, `"LAG"`, `"LEAD"`, `"SUM"`, `"AVG"`, `"MIN"`, `"MAX"`, `"COUNT"`, `"FIRST_VALUE"`, `"LAST_VALUE"`, `"NTILE"`. |
| `fieldName` | string | Column to apply function to (not used for ROW_NUMBER/RANK). |
| `resultFieldName` | string | Output column name. |
| `offset` | number | Offset for LAG/LEAD. Default `1`. |
| `defaultValue` | string | Default for LAG/LEAD when offset goes out of bounds. |
| `ntileCount` | number | Number of buckets for NTILE. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "WindowAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "WindowAction",
  "name": "Running Total by Customer",
  "dependsOn": ["Order-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "partitionFields": ["customer_id"],
  "orderFields": [
    { "fieldName": "order_date", "ascending": true }
  ],
  "windowFunction": "SUM",
  "fieldName": "amount",
  "resultFieldName": "running_total",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 600,
    "y": 300,
    "id": "WindowAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### Denormaliser

Pivot (unpivot → pivot): turns row values into columns.

| Field | Type | Description |
|---|---|---|
| `keyField` | string | Column whose distinct values become new column headers. |
| `groupFields` | string[] | Columns that define each output row. |
| `valueField` | string | Column whose values populate the pivoted cells. |
| `aggType` | string | Aggregation for collisions: `"SUM"`, `"COUNT"`, `"MIN"`, `"MAX"`, `"AVG"`, `"FIRST"`, `"LAST"`. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Denormaliser-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Denormaliser",
  "name": "Pivot Months to Columns",
  "dependsOn": ["GroupBy-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "keyField": "month_name",
  "groupFields": ["product_id", "product_name"],
  "valueField": "monthly_revenue",
  "aggType": "SUM",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 700,
    "y": 300,
    "id": "Denormaliser-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### NormalizeAll

Unpivot all value columns into key-value rows (wide to long).

| Field | Type | Description |
|---|---|---|
| `keyColumns` | string[] | Columns to keep as-is (row identifiers). |
| `fieldNameColumn` | string | Name for the new column that holds the original column names. |
| `valueColumn` | string | Name for the new column that holds the values. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "NormalizeAll-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "NormalizeAll",
  "name": "Unpivot Metrics",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "keyColumns": ["date", "region"],
  "fieldNameColumn": "metric_name",
  "valueColumn": "metric_value",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 700,
    "y": 400,
    "id": "NormalizeAll-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### Normalizer

Unpivot specific named columns into key-value rows (selective unpivot).

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Name for the new column that holds the original column names. |
| `fields` | string[] | Specific columns to unpivot. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "Normalizer-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "Normalizer",
  "name": "Unpivot Q1-Q4",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "quarter",
  "fields": ["Q1", "Q2", "Q3", "Q4"],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 700,
    "y": 500,
    "id": "Normalizer-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Advanced / Scripting

### ExpressionEvaluator

Row-level expression engine — the most flexible native tile. Supports conditional logic, math, string manipulation, date operations, and type casting in a single expression.

| Field | Type | Description |
|---|---|---|
| `expressions` | object[] | Array of `{ resultFieldName, resultType, expression }`. |
| `tables` | array | Always `[{}]` |

`resultType`: `"STRING"`, `"LONG"`, `"DOUBLE"`, `"DATE"`, `"DATETIME"`.

Expression syntax uses backtick-quoted column names: `` `Column Name` ``. Supports: `CASE WHEN ... THEN ... ELSE ... END`, `CONCAT()`, `SUBSTRING()`, `TRIM()`, `UPPER()`, `LOWER()`, `CAST()`, `COALESCE()`, `IFNULL()`, `DATEDIFF()`, `DATEADD()`, `NOW()`, `+`, `-`, `*`, `/`, `%`, `AND`, `OR`, `NOT`, `IS NULL`, `IS NOT NULL`, `IN (...)`, `LIKE`, `BETWEEN`.

```json
{
  "id": "ExpressionEvaluator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "ExpressionEvaluator",
  "name": "Calculate Tier",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "expressions": [
    {
      "resultFieldName": "customer_tier",
      "resultType": "STRING",
      "expression": "CASE WHEN `lifetime_value` >= 100000 THEN 'Enterprise' WHEN `lifetime_value` >= 10000 THEN 'Premium' ELSE 'Standard' END"
    },
    {
      "resultFieldName": "margin_pct",
      "resultType": "DOUBLE",
      "expression": "(`revenue` - `cost`) / `revenue` * 100"
    }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 500,
    "id": "ExpressionEvaluator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### ExpressionRowGenerator

Generates rows from an expression — used for creating date spines, number series, or lookup tables dynamically.

| Field | Type | Description |
|---|---|---|
| `expression` | string | Generator expression. |
| `resultFields` | object[] | Array of `{ fieldName, fieldType }` for output schema. |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "ExpressionRowGenerator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "ExpressionRowGenerator",
  "name": "Generate Date Spine",
  "dependsOn": [],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "expression": "GENERATE_SERIES(CAST('2024-01-01' AS DATE), CAST('2024-12-31' AS DATE), INTERVAL 1 DAY)",
  "resultFields": [
    { "fieldName": "calendar_date", "fieldType": "DATE" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 50,
    "y": 500,
    "id": "ExpressionRowGenerator-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### SQL

Executes a raw SQL query against upstream tile outputs.

| Field | Type | Description |
|---|---|---|
| `query` | string | SQL query. Reference upstream tiles by their tile name as the table name. |
| `tables` | array | Always `[{}]` |

**Important**: Table names in the SQL query must match the `name` field of the upstream tile exactly (case-sensitive). Use double quotes around table names with spaces.

```json
{
  "id": "SQL-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "SQL",
  "name": "Custom SQL",
  "dependsOn": [
    "LoadFromVault-11111111-2222-3333-4444-555555555555",
    "GroupBy-66666666-7777-8888-9999-aaaaaaaaaaaa"
  ],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "query": "SELECT a.customer_id, a.name, b.total_revenue FROM \"My Input Dataset\" a LEFT JOIN \"Revenue by Category\" b ON a.category = b.category WHERE b.total_revenue > 1000",
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 600,
    "y": 500,
    "id": "SQL-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### ValueMapper

Maps discrete input values to output values (lookup/replace table).

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Source column to map from. |
| `targetFieldName` | string | Output column name. |
| `defaultValue` | string | Value when no mapping matches. |
| `sourceValues` | string[] | Input values to match (parallel array with `targetValues`). |
| `targetValues` | string[] | Output values (parallel array with `sourceValues`). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "ValueMapper-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "ValueMapper",
  "name": "Map Region Codes",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "region_code",
  "targetFieldName": "region_name",
  "defaultValue": "Unknown",
  "sourceValues": ["NA", "EU", "APAC", "LATAM"],
  "targetValues": ["North America", "Europe", "Asia Pacific", "Latin America"],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 600,
    "id": "ValueMapper-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### JsonExpandAction

Expands a JSON string column into multiple typed columns.

| Field | Type | Description |
|---|---|---|
| `fieldName` | string | Column containing JSON strings. |
| `expandFields` | object[] | Array of `{ jsonPath, fieldName, fieldType }`. |
| `tables` | array | Always `[{}]` |

`jsonPath` uses dot notation: `"$.key"`, `"$.nested.key"`, `"$.array[0]"`.

```json
{
  "id": "JsonExpandAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "JsonExpandAction",
  "name": "Parse Metadata JSON",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "fieldName": "metadata_json",
  "expandFields": [
    { "jsonPath": "$.status", "fieldName": "status", "fieldType": "STRING" },
    { "jsonPath": "$.score", "fieldName": "score", "fieldType": "DOUBLE" },
    { "jsonPath": "$.tags[0]", "fieldName": "primary_tag", "fieldType": "STRING" }
  ],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 700,
    "id": "JsonExpandAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## AI / ML

### PythonEngineAction

Executes Python code within the dataflow. Input data available as a pandas DataFrame.

| Field | Type | Description |
|---|---|---|
| `script` | string | Python source code. Input DataFrame is `input_data`. Must assign result to `output_data`. |
| `outputFields` | object[] | Array of `{ fieldName, fieldType }` defining output schema. |
| `packages` | string[] | Additional pip packages to install (beyond pandas/numpy). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "PythonEngineAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "PythonEngineAction",
  "name": "Python Transform",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "script": "import pandas as pd\n\noutput_data = input_data.copy()\noutput_data['name_length'] = output_data['customer_name'].str.len()\noutput_data['is_long_name'] = output_data['name_length'] > 20",
  "outputFields": [
    { "fieldName": "customer_name", "fieldType": "STRING" },
    { "fieldName": "name_length", "fieldType": "LONG" },
    { "fieldName": "is_long_name", "fieldType": "STRING" }
  ],
  "packages": [],
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 800,
    "id": "PythonEngineAction-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

### TextGeneration

AI text generation tile — sends column values to an LLM and writes the response to a new column.

| Field | Type | Description |
|---|---|---|
| `modelId` | string | Model identifier (e.g. `"domo-ai-v1"`). |
| `promptTemplate` | string | Prompt template. Use `{{column_name}}` for column interpolation. |
| `resultFieldName` | string | Output column for the generated text. |
| `maxTokens` | number | Max tokens for generation. |
| `temperature` | number | Temperature (0.0 - 1.0). |
| `tables` | array | Always `[{}]` |

```json
{
  "id": "TextGeneration-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "type": "TextGeneration",
  "name": "Classify Feedback",
  "dependsOn": ["LoadFromVault-11111111-2222-3333-4444-555555555555"],
  "disabled": false,
  "removeByDefault": false,
  "notes": [],
  "modelId": "domo-ai-v1",
  "promptTemplate": "Classify this customer feedback as Positive, Negative, or Neutral. Only respond with the classification.\n\nFeedback: {{feedback_text}}",
  "resultFieldName": "sentiment",
  "maxTokens": 10,
  "temperature": 0.0,
  "tables": [{}],
  "settings": {
    "preferredDatabaseEntityType": "TEMP_VIEW"
  },
  "previewRowLimit": null,
  "gui": {
    "x": 500,
    "y": 900,
    "id": "TextGeneration-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "type": "Tile"
  }
}
```

---

## Quick Reference

| Type | Category | Key Properties |
|---|---|---|
| `LoadFromVault` | Input | `dataSourceId` |
| `FixedInput` | Input | `schema`, `rows` |
| `PublishToVault` | Output | `dataSource.guid`, `inputs[]`, `versionChainType` |
| `PublishToWriteback` | Output | `dataSource`, `writebackInfo.guid` |
| `UnionAll` | Combine | `dependsOn` (2+ tiles) |
| `MergeJoin` | Join | `joinType`, `joinCondition[]` |
| `SelectValues` | Select | `fields[]`, `renames[]`, `removes[]` |
| `Limit` | Filter | `rowLimit` |
| `Order` | Sort | `fields[]` (with `ascending`) |
| `ConcatFields` | Text | `targetFieldName`, `separator`, `fields[]` |
| `ReplaceString` | Text | `fieldName`, `replaceString`, `replaceByString`, `useRegEx` |
| `SplitColumnAction` | Text | `fieldName`, `delimiter`, `newFieldNames[]` |
| `StringCalculator` | Text | `calcType`, `fieldName`, `resultFieldName` |
| `TextFormatting` | Text | `fieldName`, `formatType` |
| `NumericCalculator` | Numeric | `calcType`, `fieldA`, `fieldB`, `resultFieldName` |
| `DateCalculator` | Date | `calcType`, `fieldName`, `resultFieldName` |
| `Constant` | Column | `fieldName`, `fieldType`, `fieldValue` |
| `Metadata` | Column | `metadataType`, `fieldName` |
| `SetValueField` | Column | `fieldName`, `setValue`, `condition` |
| `SchemaAction` | Column | `changes[]` (with `fromType`, `toType`) |
| `GroupBy` | Aggregate | `groupFields[]`, `aggregates[]` |
| `WindowAction` | Aggregate | `partitionFields[]`, `orderFields[]`, `windowFunction` |
| `Denormaliser` | Reshape | `keyField`, `groupFields[]`, `valueField`, `aggType` |
| `NormalizeAll` | Reshape | `keyColumns[]`, `fieldNameColumn`, `valueColumn` |
| `Normalizer` | Reshape | `fieldName`, `fields[]` |
| `ExpressionEvaluator` | Advanced | `expressions[]` (with `expression`, `resultType`) |
| `ExpressionRowGenerator` | Advanced | `expression`, `resultFields[]` |
| `SQL` | Advanced | `query` |
| `ValueMapper` | Advanced | `sourceValues[]`, `targetValues[]`, `defaultValue` |
| `JsonExpandAction` | Advanced | `fieldName`, `expandFields[]` (with `jsonPath`) |
| `PythonEngineAction` | AI/ML | `script`, `outputFields[]`, `packages[]` |
| `TextGeneration` | AI/ML | `modelId`, `promptTemplate`, `resultFieldName` |
