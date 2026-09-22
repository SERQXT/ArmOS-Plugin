# Schema-First Development Workflow

## Overview

The schema-first workflow ensures that all data access code is written against verified column names and types, eliminating runtime errors from typos or assumptions.

## Workflow

1. **Export schemas** — For each dataset in `manifest.json`, run:
   ```
   dataset_schema_export(dataset_id: "{uuid}", output_path: "{appDir}/.schema/{alias}-schema.json")
   ```

2. **Reference during coding** — When writing `domo.get('/data/v1/{alias}')` calls, read the corresponding `.schema/{alias}-schema.json` to get exact column names and types.

3. **Use sample data for testing** — Each schema file includes `sampleRows` with real data. Use these to verify your data transformations and chart configurations work before deploying.

## Schema File Format

```json
{
  "datasetId": "c30487e4-cd80-4b3b-8ffb-6dfb21c43991",
  "name": "Sales Data",
  "columns": [
    { "name": "Region", "type": "STRING" },
    { "name": "Revenue", "type": "DOUBLE" },
    { "name": "Date", "type": "DATE" }
  ],
  "sampleRows": [
    { "Region": "West", "Revenue": 45000, "Date": "2024-01-15" },
    { "Region": "East", "Revenue": 38000, "Date": "2024-01-15" }
  ]
}
```

## Benefits

- **No column name typos** — copy exact names from schema files
- **Correct type handling** — know whether to parse numbers, dates, or strings
- **Offline development** — sample data enables local testing without Domo access
- **Faster debugging** — if data doesn't display, compare app code column names against schema
