# Magic ETL Example Patterns

Verified against live Domo instances. All examples use `databaseType: "MAGIC"`.

---

## Pattern 1: Input → GroupBy → Output

Simplest aggregation: read a dataset, group by a dimension, output.

```json
{
  "name": "Team Stats Summary",
  "databaseType": "MAGIC",
  "actions": [
    {
      "type": "LoadFromVault",
      "id": "LoadFromVault-input",
      "name": "Player Stats",
      "dataSourceId": "INPUT_DATASET_UUID",
      "executeFlowWhenUpdated": false,
      "pseudoDataSource": false,
      "truncateTextColumns": false,
      "truncateRows": false,
      "onlyLoadNewVersions": false,
      "recentVersionCutoffMs": 0,
      "tables": [{}]
    },
    {
      "type": "GroupBy",
      "id": "GroupBy-team",
      "name": "Aggregate by Team",
      "dependsOn": ["LoadFromVault-input"],
      "input": "LoadFromVault-input",
      "addLineNumber": false,
      "giveBackRow": false,
      "allRows": false,
      "groups": [{ "name": "Team" }],
      "fields": [
        { "name": "Total_Points", "expression": "SUM(`FP`)", "source": null, "type": null, "valuefield": null, "settings": null },
        { "name": "Avg_Points", "expression": "AVG(`FP`)", "source": null, "type": null, "valuefield": null, "settings": null },
        { "name": "Player_Count", "expression": "COUNT(`Name`)", "source": null, "type": null, "valuefield": null, "settings": null }
      ],
      "tables": [{}]
    },
    {
      "type": "PublishToVault",
      "id": "PublishToVault-output",
      "name": "Team Summary Output",
      "dependsOn": ["GroupBy-team"],
      "inputs": ["GroupBy-team"],
      "dataSource": {
        "guid": "OUTPUT_DATASET_UUID",
        "type": "DataFlow",
        "name": "Team Summary",
        "cloudId": "domo"
      },
      "versionChainType": "REPLACE",
      "schemaSource": "DATAFLOW",
      "partitioned": false,
      "tables": [{}]
    }
  ]
}
```

---

## Pattern 2: Join Two Datasets

```json
{
  "name": "Players with Teams",
  "databaseType": "MAGIC",
  "actions": [
    {
      "type": "LoadFromVault",
      "id": "LoadFromVault-players",
      "name": "Players",
      "dataSourceId": "PLAYERS_UUID",
      "executeFlowWhenUpdated": false, "pseudoDataSource": false,
      "truncateTextColumns": false, "truncateRows": false,
      "onlyLoadNewVersions": false, "recentVersionCutoffMs": 0,
      "tables": [{}]
    },
    {
      "type": "LoadFromVault",
      "id": "LoadFromVault-teams",
      "name": "Teams",
      "dataSourceId": "TEAMS_UUID",
      "executeFlowWhenUpdated": false, "pseudoDataSource": false,
      "truncateTextColumns": false, "truncateRows": false,
      "onlyLoadNewVersions": false, "recentVersionCutoffMs": 0,
      "tables": [{}]
    },
    {
      "type": "MergeJoin",
      "id": "MergeJoin-join",
      "name": "Join Players to Teams",
      "dependsOn": ["LoadFromVault-players", "LoadFromVault-teams"],
      "joinType": "INNER",
      "relationshipType": "MANY_TO_MANY",
      "step1": "LoadFromVault-players",
      "step2": "LoadFromVault-teams",
      "keys1": ["Team_ID"],
      "keys2": ["ID"],
      "tables": [{}]
    },
    {
      "type": "SelectValues",
      "id": "SelectValues-final",
      "name": "Select Output Columns",
      "dependsOn": ["MergeJoin-join"],
      "input": "MergeJoin-join",
      "fields": [
        { "name": "Player_Name", "rename": "", "type": null, "dateFormat": null, "settings": {}, "remove": false },
        { "name": "Team_Name", "rename": "", "type": null, "dateFormat": null, "settings": {}, "remove": false },
        { "name": "Points", "rename": "", "type": null, "dateFormat": null, "settings": {}, "remove": false }
      ],
      "tables": [{}]
    },
    {
      "type": "PublishToVault",
      "id": "PublishToVault-output",
      "name": "Output",
      "dependsOn": ["SelectValues-final"],
      "inputs": ["SelectValues-final"],
      "dataSource": {
        "guid": "OUTPUT_UUID",
        "type": "DataFlow",
        "name": "Players with Teams",
        "cloudId": "domo"
      },
      "versionChainType": "REPLACE",
      "schemaSource": "DATAFLOW",
      "partitioned": false,
      "tables": [{}]
    }
  ]
}
```

---

## Pattern 3: Formula + Select

Add calculated columns, then select the final output shape.

```json
{
  "type": "ExpressionEvaluator",
  "id": "ExpressionEvaluator-calc",
  "name": "Add Calculations",
  "dependsOn": ["LoadFromVault-input"],
  "input": "LoadFromVault-input",
  "expressions": [
    { "expression": "`Total_Points` / 17", "fieldName": "Points_Per_Game", "settings": {} },
    { "expression": "CONCAT(`First`, ' ', `Last`)", "fieldName": "Full_Name", "settings": {} },
    { "expression": "'US'", "fieldName": "Country", "settings": {} }
  ],
  "tables": [{}]
}
```

---

## Pattern 4: Multi-Output ETL (Branching Pipeline)

One ETL reads shared inputs and branches into multiple outputs via separate `PublishToVault` tiles. This is the standard pattern for input-affinity consolidation.

```json
{
  "name": "CRM Cleanup — Bronze",
  "databaseType": "MAGIC",
  "outputs": [
    { "dataSourceId": null, "dataSourceName": "Contacts — Cleaned", "versionChainType": "REPLACE" },
    { "dataSourceId": null, "dataSourceName": "Opportunities — Cleaned", "versionChainType": "REPLACE" }
  ],
  "actions": [
    {
      "type": "LoadFromVault",
      "id": "input-contacts",
      "name": "CRM Contacts",
      "dataSourceId": "CONTACTS_UUID",
      "executeFlowWhenUpdated": false, "pseudoDataSource": false,
      "truncateTextColumns": false, "truncateRows": false,
      "onlyLoadNewVersions": false, "recentVersionCutoffMs": 0,
      "tables": [{}]
    },
    {
      "type": "LoadFromVault",
      "id": "input-opps",
      "name": "CRM Opportunities",
      "dataSourceId": "OPPS_UUID",
      "executeFlowWhenUpdated": false, "pseudoDataSource": false,
      "truncateTextColumns": false, "truncateRows": false,
      "onlyLoadNewVersions": false, "recentVersionCutoffMs": 0,
      "tables": [{}]
    },
    {
      "type": "Unique",
      "id": "dedup-contacts",
      "name": "Dedup Contacts",
      "dependsOn": ["input-contacts"],
      "input": "input-contacts",
      "countRows": false,
      "fields": [{ "name": "Email", "caseInsensitive": true }],
      "tables": [{}]
    },
    {
      "type": "Metadata",
      "id": "cast-opps",
      "name": "Cast Opp Types",
      "dependsOn": ["input-opps"],
      "input": "input-opps",
      "fields": [
        { "name": "Amount", "rename": null, "type": "DOUBLE", "dateFormat": null, "settings": {}, "remove": false },
        { "name": "CloseDate", "rename": null, "type": "DATE", "dateFormat": "yyyy-MM-dd", "settings": {}, "remove": false }
      ],
      "tables": [{}]
    },
    {
      "type": "PublishToVault",
      "id": "output-contacts",
      "name": "Contacts — Cleaned",
      "dependsOn": ["dedup-contacts"],
      "inputs": ["dedup-contacts"],
      "dataSource": {
        "type": "DataFlow",
        "name": "Contacts — Cleaned",
        "cloudId": "domo"
      },
      "versionChainType": "REPLACE",
      "schemaSource": "DATAFLOW",
      "partitioned": false,
      "tables": [{}]
    },
    {
      "type": "PublishToVault",
      "id": "output-opps",
      "name": "Opportunities — Cleaned",
      "dependsOn": ["cast-opps"],
      "inputs": ["cast-opps"],
      "dataSource": {
        "type": "DataFlow",
        "name": "Opportunities — Cleaned",
        "cloudId": "domo"
      },
      "versionChainType": "REPLACE",
      "schemaSource": "DATAFLOW",
      "partitioned": false,
      "tables": [{}]
    }
  ]
}
```

Canvas layout for branching:
```
x=128        x=320            x=512
Input A ──→ Dedup ─────────→ Output A (Contacts)
(y=128)     (y=128)          (y=128)

Input B ──→ Cast Types ────→ Output B (Opps)
(y=320)     (y=320)          (y=320)
```

---

## GUI Layout Conventions

Position tiles on the canvas for readability:

- **Input tiles**: x=128, spread vertically (y=128, y=288, y=448, ...)
- **Processing tiles**: increment x by ~160-192 per step
- **Output tiles**: rightmost position
- **Parallel branches**: use different y values
- **Joins**: place at x where both inputs are ready

```
x=128        x=320        x=512        x=704
Input A ──→ GroupBy ──→ Select ──→ Output
(y=128)     (y=128)     (y=128)    (y=128)

Input B ──→ Join ──────┘
(y=288)     (y=288)
```

The `gui` on each action sets its canvas position. Optionally, include a top-level `gui.canvases.default.elements[]` array mirroring all action positions.

---

## Dataflow Creation Checklist

1. **Create output dataset first** — `dataset_create` with expected schema
2. **Set `databaseType: "MAGIC"`** — not REDSHIFT
3. **Use correct `type` strings** — `LoadFromVault`, `GroupBy`, `PublishToVault`, etc.
4. **Include `tables: [{}]`** on every action
5. **Use `dataSource.guid`** (UUID) for output, `dataSourceId` (UUID) for input
6. **Verify with `dataflow_get`** after creation to confirm actions were persisted correctly
7. **Execute with `dataflow_execute`** and poll `dataflow_executions` for status
