---
name: appstudio-action-button
tier: t0
primitive_of: appstudio-action-button
bucket: app-studio-work
description: "App Studio button-widget __dmlActions configuration — 5 action types (DISABLED, WEBLINK, DOMOLINK, FORM_MODAL, WORKFLOW_START), payload shapes, prerequisite creation steps."
status: published
visibility: anyone
created_by: lane-L5
created_at: 2026-06-07T00:00:00.000Z
userInvocable: false
---

# AppStudio Action Button (`button-widget`)

A `button-widget` inside any rooster component's `params.groups[n].widgets` array has a `__dmlActions` field controlling what happens on press. This T0 is the canonical reference for all 5 action types.

Trigger phrases: "action button", "dml action", "workflow start button", "form modal button", "WORKFLOW_START on each row", "FORM_MODAL action", "DOMOLINK button".

## `__dmlActions` wrapper shape

```json
{
  "__dmlActions": {
    "on-press-button": {
      "type": "<ACTION_TYPE>",
      "...type-specific fields..."
    },
    "___dmlEditorID___": "root/groups/<n>/widgets/<m>/__dmlActions",
    "___dmlEditorParent___": "root/groups/<n>/widgets/<m>"
  }
}
```

The `___dmlEditorID___` and `___dmlEditorParent___` paths must accurately reflect the button-widget's position in the groups tree.

## Action types

### 1. `DISABLED` — no action

```json
{ "type": "DISABLED" }
```

Safe default when no action is needed. Always include at minimum `{ "type": "DISABLED" }` — a button-widget with no `__dmlActions` throws a runtime error.

### 2. `WEBLINK` — open a URL

```json
{
  "type": "WEBLINK",
  "displayName": "",
  "url": "https://example.com",
  "openInNewWindow": true,
  "urlColumn": ""
}
```

| Field | Notes |
|---|---|
| `url` | Full URL. Hardcoded or per-row via `urlColumn`. |
| `openInNewWindow` | `true` = new tab. |
| `urlColumn` | Dataset column name for per-row URL. Overrides `url` when set. |

### 3. `DOMOLINK` — navigate to a Domo entity

```json
{
  "type": "DOMOLINK",
  "displayName": "",
  "url": "/kpis/details/<cardId>",
  "entityId": "<cardId>",
  "entityType": "card",
  "openInNewWindow": false,
  "persistFilters": true,
  "allowCardToCardInteractions": false,
  "mobileOpenScanner": false,
  "columns": [],
  "displayMode": "PRESENTATION",
  "interactionFilterMode": "NONE",
  "interactionColumns": []
}
```

| Field | Notes |
|---|---|
| `entityId` | Target entity ID (card ID, page ID). |
| `entityType` | `"card"` for KPI/rooster cards. |
| `persistFilters` | Pass current app filters to target. |
| `interactionFilterMode` | `"NONE"` = no column-level filter passing. |

### 4. `FORM_MODAL` — open a data-collection form popup

Requires creating a form first via `POST /api/forms/v2`.

```json
{
  "type": "FORM_MODAL",
  "entityId": "<formId>",
  "formInstanceId": "<formId>",
  "formMapping": {
    "defaultValue": {
      "<fieldId>": { "type": "static" }
    },
    "output": {
      "<fieldId>": { "type": "none" }
    },
    "fieldOptions": {
      "<fieldId>": { "type": "static" }
    }
  }
}
```

| Field | Notes |
|---|---|
| `entityId` | Form ID from `POST /api/forms/v2` response `id` field. |
| `formInstanceId` | Same as `entityId`. |
| `formMapping` keys | Field UUIDs from `sections[].fields[].id` — NOT human-readable `alias` values. |

### Create form (prerequisite)

```
POST /api/forms/v2
```

```json
{
  "version": "0.0.0",
  "domainType": "APP_STUDIO_APP",
  "domainId": "<appId>",
  "name": "My Action Form",
  "sections": [{
    "id": "<uuid>",
    "title": "",
    "fields": [{
      "id": "<uuid>",
      "label": "Notes",
      "fieldType": "SHORT_ANSWER",
      "dataType": "text",
      "optional": false,
      "acceptsInput": true,
      "acceptsOutput": true
    }]
  }],
  "submitConfiguration": { "type": "DATASET", "name": "My Action Form" }
}
```

Response captures: `id` (form UUID for `entityId`/`formInstanceId`), `sections[].fields[].id` (keys for `formMapping`).

### 5. `WORKFLOW_START` — trigger a Domo Workflow

Requires creating a workflow widget first via `POST /api/workflow/v1/models/widget`.

```json
{
  "type": "WORKFLOW_START",
  "entityId": "<widgetUUID>",
  "modelId": "<workflowModelId>",
  "modelVersion": "3.0.6",
  "displayName": "Start",
  "parameters": []
}
```

| Field | Notes |
|---|---|
| `entityId` | **Workflow widget UUID** — from `POST /api/workflow/v1/models/widget`. NOT the workflow model ID. |
| `modelId` | The workflow model UUID. |
| `modelVersion` | Active version string (from `GET /api/workflow/v2/models/<id>` -> `activeVersions[]`). |
| `parameters` | Input parameters to pass to start event. `[]` for no required inputs. |

### Create workflow widget (prerequisite)

```
POST /api/workflow/v1/models/widget
```

```json
{
  "modelId": "<workflowModelId>",
  "modelVersion": "3.0.6",
  "appId": "<dataAppId>",
  "appViewId": "<landingViewId>"
}
```

Response: plain string — the workflow widget UUID. Use as `entityId` in `WORKFLOW_START`.

## Full button-widget shape

```json
{
  "name": "button-widget",
  "label": "Edit",
  "flex": 1,
  "widthType": "flex",
  "width": "fill",
  "heightType": "flex",
  "height": "fill",
  "verticalAlignment": "start",
  "___dmlEditorID___": "root/groups/<n>/widgets/<m>",
  "___dmlEditorParent___": "root/groups/<n>",
  "__dmlActions": {
    "on-press-button": { "type": "DISABLED" },
    "___dmlEditorID___": "root/groups/<n>/widgets/<m>/__dmlActions",
    "___dmlEditorParent___": "root/groups/<n>/widgets/<m>"
  }
}
```

## Updating a button's action

The entire card must be re-PUT with the modified DML string:

```
PUT /api/content/v1/cards/<cardId>
```

Only `on-press-button` changes between action types. Everything else in the DML stays the same.

## Key gotchas

- `entityId` in `WORKFLOW_START` is the **widget** ID, not the workflow model ID.
- `formMapping` keys are field UUIDs — not `alias` strings.
- Include ALL form fields in `formMapping.output` — missing fields cause unexpected submission behavior.
- `FORM_MODAL` requires both `entityId` AND `formInstanceId` (same value).
- `___dmlEditorID___` paths must be correct — wrong paths cause silent rendering failures in the AppStudio editor.
- `DISABLED` is the safe default — never leave `__dmlActions` absent from a `button-widget`.
