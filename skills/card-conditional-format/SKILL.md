---
name: card-conditional-format
tier: t0
primitive_of: card-conditional-format-rule
bucket: card-work
description: "Reference spec for Domo card conditional format rule structure — the conditionalFormats object shape, rule fields, color encoding, and the card vs datasource scope split. Not directly user-invocable — consumed by card-kpi (T1) and orchestrations that build styled Domo cards."
kind: atom
status: draft
visibility: anyone
created_by: lane-L6
created_at: "2026-06-07T00:00:00Z"
userInvocable: false
---

# card-conditional-format — Conditional Format Rule Reference

Reference spec for Domo card conditional format rules. Covers the `conditionalFormats` object shape, rule structure, color encoding, and the critical card vs datasource scope split. Consumed by `card-kpi` (T1) and any orchestration that builds cards with color-coded value thresholds.

## Payload example

```json
{
  "definition": {
    "conditionalFormats": {
      "card": [
        {
          "type": "COLOR",
          "column": "Revenue",
          "rules": [
            {
              "min": 0,
              "max": 50000,
              "color": "#FF0000",
              "label": "Below Target"
            },
            {
              "min": 50000,
              "max": 100000,
              "color": "#FFAA00",
              "label": "Near Target"
            },
            {
              "min": 100000,
              "color": "#00AA00",
              "label": "Above Target"
            }
          ]
        }
      ],
      "datasource": []
    }
  }
}
```

## Required structure

`conditionalFormats` **must be an object**, not an array. Passing `[]` instead of `{"card":[],"datasource":[]}` causes HTTP 400.

## Top-level field reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `card` | array | Yes | Card-level conditional format rules |
| `datasource` | array | Yes | Dataset-level conditional format rules |

## Conditional format rule fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Format type — `"COLOR"` for color-coding |
| `column` | string | Yes | Column name the rule applies to |
| `rules` | array | Yes | List of threshold/color rule objects (see below) |

## Rule object fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `min` | number | No | Lower bound (inclusive). Omit to match below `max` |
| `max` | number | No | Upper bound (exclusive). Omit to match above `min` |
| `color` | string | Yes | Hex color code (e.g. `"#FF0000"`) |
| `label` | string | No | Display label for the threshold band |

## Scope: card vs datasource

| Scope | `conditionalFormats` key | Visibility |
|-------|--------------------------|------------|
| Card-level | `card` | Only this card |
| Dataset-level | `datasource` | All cards using this dataset |

Use card-level rules for per-card styling decisions. Dataset-level rules apply globally across all cards on the dataset.

## Read → write format mismatch

The Domo READ endpoint returns `conditionalFormats` as a plain array `[]`. Before sending back in an UPDATE, convert to the object shape:

```json
"conditionalFormats": { "card": [], "datasource": [] }
```

Failing to do this causes HTTP 400 on the UPDATE call.

## Multi-column example

Multiple columns can each have independent rules:

```json
{
  "card": [
    {
      "type": "COLOR",
      "column": "Revenue",
      "rules": [
        { "max": 50000, "color": "#FF0000", "label": "Low" },
        { "min": 50000, "max": 100000, "color": "#FFAA00", "label": "Mid" },
        { "min": 100000, "color": "#00AA00", "label": "High" }
      ]
    },
    {
      "type": "COLOR",
      "column": "Win Rate",
      "rules": [
        { "max": 0.2, "color": "#FF0000", "label": "Poor" },
        { "min": 0.2, "max": 0.5, "color": "#FFAA00", "label": "Okay" },
        { "min": 0.5, "color": "#00AA00", "label": "Strong" }
      ]
    }
  ],
  "datasource": []
}
```

## Common mistakes

- Passing `conditionalFormats` as `[]` (array) instead of `{"card":[],"datasource":[]}` (object) — HTTP 400
- Referencing a column name that does not exist in the dataset or card columns — rule silently has no effect
- Overlapping `min`/`max` ranges — Domo applies the first matching rule; order matters
- Omitting both `min` and `max` — creates a catch-all rule; safe only if intentional as the last rule
