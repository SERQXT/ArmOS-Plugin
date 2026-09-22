---
name: card-beastmode
tier: t0
primitive_of: card-beastmode-payload
bucket: dataset-work
description: "Reference spec for Domo beast mode (calculated field) authoring — card-level vs dataset-level scope, creation payload, dataType options, and naming rules. Declares domo_beastmode_validate for formula pre-flight validation. Not directly user-invocable — consumed by card-kpi (T1) and orchestrations that build cards with calculated fields."
kind: atom
status: draft
visibility: anyone
created_by: lane-L6
created_at: "2026-06-07T00:00:00Z"
userInvocable: false
# tools: [domo_beastmode_validate]
# NOTE: T0 may declare tools; left commented here because the T1 orchestrator
# (card-kpi) declares it via the session MCP gate. Uncomment if this T0 needs to
# carry the tool itself.
---

# card-beastmode — Beast Mode Payload Reference

Reference spec for Domo beast mode (calculated field) authoring. Covers card-level vs dataset-level scope, the creation API payload, data types, naming rules, and the formula validation pre-flight via `domo_beastmode_validate`. Consumed by `card-kpi` (T1) and any orchestration that assembles cards with calculated fields.

## Payload example — dataset-level beast mode

```json
{
  "name": "Revenue per Deal",
  "owner": 705231757,
  "locked": false,
  "global": false,
  "expression": "SUM(`Distinct Closed Won ACV`) / COUNT(`Opportunity ID`)",
  "links": [
    {
      "resource": { "type": "DATA_SOURCE", "id": "DATASET-UUID-HERE" },
      "visible": true,
      "active": false,
      "valid": "VALID"
    }
  ],
  "aggregated": true,
  "analytic": false,
  "nonAggregatedColumns": [],
  "dataType": "DECIMAL",
  "status": "VALID",
  "cacheWindow": "non_dynamic",
  "columnPositions": [],
  "functions": [],
  "functionTemplateDependencies": [],
  "archived": false,
  "hidden": false,
  "variable": false
}
```

**Endpoint:** `POST /query/v1/functions/template?strict=false`

The response contains `id` (UUID) and `legacyId` (e.g. `calculation_abc123`). Use `legacyId` as `formulaId` when referencing the beast mode in card columns.

## Payload example — referencing beast mode in a card column

```json
{
  "formulaId": "calculation_abc123",
  "mapping": "VALUE",
  "aggregation": "SUM",
  "alias": "Revenue per Deal"
}
```

Note: use `formulaId` instead of `column` — they are mutually exclusive.

## Card-level beast mode structure

Card-level beast modes are embedded inside the card payload at `definition.formulas.card[]`. They live only on that card (not reusable across cards). Structure mirrors the dataset-level payload but is included inline in the card body.

```json
{
  "definition": {
    "formulas": {
      "dsUpdated": [],
      "dsDeleted": [],
      "card": [
        {
          "name": "Margin %",
          "expression": "(SUM(`Revenue`) - SUM(`Cost`)) / SUM(`Revenue`) * 100",
          "dataType": "DECIMAL",
          "links": [{ "resource": { "type": "DATA_SOURCE", "id": "DATASET-UUID" }, "visible": true, "active": false, "valid": "VALID" }],
          "aggregated": true
        }
      ]
    }
  }
}
```

## Scope decision

| Scope | Storage | Visibility | When to use |
|-------|---------|------------|-------------|
| Dataset-level | Created via API, stored on dataset | All cards on that dataset | Shared metric used across multiple cards or dashboards |
| Card-level | `definition.formulas.card[]` in card body | Only this card | One-off formula, prototype, or card-specific derivative |

## Field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name — must not conflict with existing dataset column names or other beast modes |
| `expression` | string | Yes | Formula body; column names wrapped in backticks |
| `dataType` | string | Yes | See dataType options below |
| `aggregated` | boolean | Yes | `true` if formula contains aggregate functions (SUM, AVG, COUNT, MIN, MAX) |
| `owner` | integer | Yes | Domo user ID of the formula owner |
| `links[].resource.id` | string | Yes | Dataset UUID this beast mode is linked to |
| `global` | boolean | No | `false` — keep formula private to this dataset link |
| `locked` | boolean | No | `false` default |
| `hidden` | boolean | No | `false` default |
| `variable` | boolean | No | `false` default |

## dataType options

| Value | Use for |
|-------|---------|
| `DECIMAL` | Currency, percentages, ratios (default) |
| `LONG` | Whole numbers, counts |
| `DOUBLE` | High-precision decimals |
| `STRING` | Text / category results |
| `DATE` | Date calculations |

## Aggregation rule — critical

If the formula contains any of `SUM(`, `AVG(`, `COUNT(`, `MIN(`, `MAX(` it is **aggregate**:
- Set `"aggregated": true` on the beast mode
- Do **NOT** set `aggregation` on the card column referencing it — double aggregation causes `SUM(SUM(...))` = wrong numbers

If the formula is row-level (no aggregate functions, e.g. `` `Revenue` - `Cost` ``):
- Set `"aggregated": false`
- **DO** set `aggregation` on the card column

## Naming rules

- Beast mode names must not conflict with existing dataset column names
- Before creating, call `domo_beastmode_validate` to check the formula and check existing names
- If a conflict is possible, prefix names (e.g. `"Calc: Delivery %"` instead of `"Delivery %"`)
- Duplicate names cause "Rename Beast Modes to avoid conflict" errors that break cards

## Validation workflow

1. Call `domo_beastmode_validate` with `{dataset_id, expression, name}` — this is a dry-run that catches syntax errors and column-name mismatches before committing
2. On pass: create the beast mode via `POST /query/v1/functions/template?strict=false`
3. Confirm creation by checking that `legacyId` is present in the response
4. Use `legacyId` as `formulaId` in card column definitions

Do not proceed to card creation until all beast modes validate, create, and are confirmed.

## Post-creation verification

After creating a beast mode, confirm it exists before building the card:
- The creation response must include both `id` and `legacyId`
- If creation fails, skip all cards that depend on that beast mode — do not attempt card creation with a missing `formulaId`

## Common formula patterns

```
# Revenue margin
(SUM(`Revenue`) - SUM(`Cost`)) / SUM(`Revenue`)

# Win rate
COUNT(CASE WHEN `Stage` = 'Closed Won' THEN 1 END) / COUNT(`Opportunity ID`)

# Days open (row-level)
DATEDIFF(NOW(), `Created Date`)

# Conditional label (row-level)
CASE WHEN `Score` >= 80 THEN 'Green' WHEN `Score` >= 60 THEN 'Yellow' ELSE 'Red' END
```
