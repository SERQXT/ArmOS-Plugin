# App Studio — Workflow Widget API Reference

Complete API documentation for binding Domo Workflows to App Studio buttons, captured from live Domo network traffic. Used by workflow-builder and build-appstudio skills.

## Overview

App Studio workflows connect existing Domo Workflow models to app buttons, enabling one-click automation triggers from within an App Studio app. Two-layer system:

- **Workflow Widget** (REST API binding): ties a workflow model to a specific app/page
- **DML button-widget** (`WORKFLOW_START` type): triggers the workflow from a rooster card button

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Workflow Model** | Reusable automation definition created in the Domo Workflows tool. Identified by `modelId` (UUID) + `modelVersion` (semver string). Lives outside App Studio. |
| **Workflow Widget** | App Studio binding that ties a model to an app + page. Created via `POST /api/workflow/v1/models/widget`. Returns a `widgetId` (UUID). |
| **WORKFLOW_START Button** | DML `button-widget` with `__dmlActions.on-press-button.type = "WORKFLOW_START"` referencing the `widgetId` + `modelId`. |
| **Rooster Component** | Card hosting the button. Any rooster component (List, Gallery, Card, etc.) can host workflow buttons. |

## ID Relationships

| Entity | ID Field | Format | Notes |
|--------|----------|--------|-------|
| Workflow Model | `modelId` | UUID | Must pre-exist before widget creation |
| Workflow Version | `modelVersion` | Semver string (e.g. `"3.0.6"`) | Published version of the model |
| Workflow Widget | `widgetId` | UUID (from POST response) | App Studio-specific binding ID |
| App | `appId` | Numeric string | Parent app's `dataAppId` |
| View/Page | `appViewId` | Numeric string | Page the workflow is attached to (`landingViewId`) |

## CREATE Action Chain

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/workflow/v1/models/widget` | Create widget binding (model to app/page) |
| 2 | POST | `/api/content/v1/cards` | Create rooster card with WORKFLOW_START button |
| 3 | PUT | `/api/content/v1/cards/rooster/query` | Bind data source (optional) |
| 4 | PUT | `/api/content/v1/cards/bulk/pages` | Assign card to page |
| 5 | PUT | `/api/content/v4/pages/layouts/:id/writelock` | Acquire edit lock |
| 6 | PUT | `/api/content/v4/pages/layouts/:id` | Update layout with card position |
| 7 | DELETE | `/api/content/v4/pages/layouts/:id/writelock` | Release edit lock |

### Step 1: Create Workflow Widget -- POST /api/workflow/v1/models/widget

Binds a workflow model to a specific app and page. Returns the `widgetId` used in DML.

**Request Body Schema:**

```json
{
  "type": "object",
  "required": ["modelId", "modelVersion", "appId", "appViewId"],
  "properties": {
    "modelId": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the Domo Workflow model to bind"
    },
    "modelVersion": {
      "type": "string",
      "description": "Published version of the workflow model (e.g. \"3.0.6\")"
    },
    "appId": {
      "type": "string",
      "description": "Numeric string ID of the App Studio app (dataAppId)"
    },
    "appViewId": {
      "type": "string",
      "description": "Numeric string ID of the page/view (landingViewId)"
    }
  }
}
```

**Request example:**

```json
{
  "modelId": "9c717acd-b738-494b-a2c0-309bfa36db43",
  "modelVersion": "3.0.6",
  "appId": "1074388577",
  "appViewId": "60754997"
}
```

**Response:** Bare UUID string (not an object).

```json
"f8a2c1d4-3e5b-4f7a-9c1d-2e3f4a5b6c7d"
```

**Gotchas:**

- Response is a bare string UUID -- `JSON.parse` gives a string, not an object. Assign directly: `const widgetId = response;`
- `appId` and `appViewId` must be **string** type (numeric strings), not integers.
- The workflow model must be published (have at least one published version) before a widget can be created.

### Step 2: Create Rooster Card -- POST /api/content/v1/cards?pageId={viewPageId}

Creates the rooster card containing the workflow trigger button.

**Request Body Schema:**

```json
{
  "type": "object",
  "required": ["title", "type", "metadata", "subscriptions"],
  "properties": {
    "title": { "type": "string" },
    "type": { "type": "string", "enum": ["rooster"] },
    "metadata": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "dml": { "type": "string", "description": "JSON-stringified DML object" },
        "dmlXml": { "type": "string", "enum": [""] }
      }
    },
    "subscriptions": { "type": "array", "description": "Empty array on create" }
  }
}
```

**DML Structure -- WORKFLOW_START Button:**

The `metadata.dml` is a JSON-stringified object containing the button widget with `__dmlActions`:

```json
{
  "name": "button-widget",
  "label": "Run Workflow",
  "flex": 1,
  "widthType": "flex",
  "width": "fill",
  "heightType": "flex",
  "height": "fill",
  "verticalAlignment": "start",
  "___dmlEditorID___": "root/groups/0/widgets/0",
  "___dmlEditorParent___": "root/groups/0",
  "__dmlActions": {
    "on-press-button": {
      "type": "WORKFLOW_START",
      "entityId": "<widgetId-from-step-1>",
      "modelId": "<workflow-model-uuid>",
      "modelVersion": "<version-string>",
      "displayName": "Start",
      "parameters": []
    },
    "___dmlEditorID___": "root/groups/0/widgets/0/__dmlActions",
    "___dmlEditorParent___": "root/groups/0/widgets/0"
  }
}
```

**DML Action Types (all button action types):**

| `type` | Trigger | Required Fields |
|--------|---------|-----------------|
| `WORKFLOW_START` | Trigger a workflow | `entityId` (widgetId), `modelId`, `modelVersion`, `parameters[]` |
| `FORM_MODAL` | Open a form popup | `entityId` (formId), `formInstanceId`, `formMapping` |
| `WEBLINK` | Open external URL | `url`, `openInNewWindow` |
| `DOMOLINK` | Navigate to Domo content | `url`, `entityId`, `entityType`, `displayMode` |

### Step 3: Bind Data Source (optional) -- PUT /api/content/v1/cards/rooster/query

Required only if the rooster component displays data alongside the button. For a button-only component, skip this step.

```json
{
  "card": {
    "type": "rooster",
    "subscriptions": [
      {
        "name": "data",
        "componentName": "data",
        "dataSourceId": "<dataset-uuid>",
        "jsonQuery": "<serialized-jsql>"
      }
    ]
  }
}
```

## READ Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workflow/v1/models/widget/:widgetId` | Get widget binding details (modelId, appId, appViewId) |
| GET | `/api/workflow/v2/models/:modelId` | Get full workflow model definition (steps, transitions, variables) |
| GET | `/api/workflow/v2/models/:modelId/versions` | List all published versions of the model |
| GET | `/api/workflow/v1/models/:modelId/versions/:version/starts` | Get trigger input parameter schema for a version |
| POST | `/api/workflow/v1/models/permissions/me` | Check current user permissions for workflow models |

**Get Widget -- response schema:**

```json
{
  "id": "<widgetId>",
  "modelId": "<modelId>",
  "modelVersion": "<version>",
  "appId": "<appId>",
  "appViewId": "<appViewId>"
}
```

**Get Starts -- purpose:** Returns the trigger configuration (input parameters) for a workflow version. Use the response to populate `parameters[]` in the DML action.

**Check Permissions -- request body:**

```json
{ "modelIds": ["9c717acd-b738-494b-a2c0-309bfa36db43"] }
```

## UPDATE

Update the card DML via `PUT /api/content/v1/cards/:cardId`. Full DML replacement -- no partial update.

**Common update operations:**

| Operation | What to change in DML |
|-----------|----------------------|
| Update parameters | Modify `parameters[]` in `__dmlActions.on-press-button` |
| Change button label | Update `label` on the `button-widget` |
| Change workflow version | Update `modelVersion` in `__dmlActions.on-press-button` |

**Request body:**

```json
{
  "metadata": {
    "dml": "<updated-dml-json-string>",
    "dmlXml": ""
  }
}
```

## DELETE

No dedicated widget delete endpoint. Remove the rooster card:

`DELETE /api/content/v1/cards/:cardId`

The widget binding (from `POST /api/workflow/v1/models/widget`) may remain in the database but becomes orphaned. Domo does not expose a direct widget delete endpoint.

## Workflow Parameters

When a workflow requires input parameters, configure them in the `parameters[]` array of the DML action:

```json
{
  "type": "WORKFLOW_START",
  "entityId": "<widgetId>",
  "modelId": "<modelId>",
  "modelVersion": "<version>",
  "displayName": "Start",
  "parameters": [
    {
      "name": "orderId",
      "type": "column",
      "value": "Order ID"
    },
    {
      "name": "notes",
      "type": "static",
      "value": "Triggered from app"
    },
    {
      "name": "region",
      "type": "variable",
      "value": "@selectedRegion"
    }
  ]
}
```

**Parameter types:**

| Type | Description | Example value |
|------|-------------|---------------|
| `"column"` | Value from a dataset column (dynamic, row-level) | `"Order ID"` (column name) |
| `"static"` | Hardcoded value set at design time | `"Triggered from app"` |
| `"variable"` | Value from an App Studio variable | `"@selectedRegion"` |

## Complete CREATE Example

```typescript
// Prerequisites: appId, landingViewId, layoutId from POST /api/content/v1/dataapps
// Prerequisites: modelId and modelVersion from an existing published workflow

// 1. Create workflow widget
const widgetId = await api('POST', '/api/workflow/v1/models/widget', {
  modelId: 'YOUR-MODEL-UUID',
  modelVersion: '3.0.6',
  appId,
  appViewId: landingViewId,
});
// widgetId is a bare UUID string, not an object

// 2. Build DML with WORKFLOW_START button
const dml = JSON.stringify({
  params: {
    groups: [{
      widgets: [{
        name: 'button-widget',
        label: 'Run Workflow',
        flex: 1,
        widthType: 'flex',
        width: 'fill',
        heightType: 'flex',
        height: 'fill',
        verticalAlignment: 'start',
        '___dmlEditorID___': 'root/groups/0/widgets/0',
        '___dmlEditorParent___': 'root/groups/0',
        __dmlActions: {
          'on-press-button': {
            type: 'WORKFLOW_START',
            entityId: widgetId,
            modelId: 'YOUR-MODEL-UUID',
            modelVersion: '3.0.6',
            displayName: 'Start',
            parameters: [],
          },
          '___dmlEditorID___': 'root/groups/0/widgets/0/__dmlActions',
          '___dmlEditorParent___': 'root/groups/0/widgets/0',
        },
      }],
    }],
  },
});

// 3. Create rooster card
const cardRes = await api(
  'POST',
  `/api/content/v1/cards?pageId=${landingViewId}`,
  {
    title: 'Workflow Trigger',
    type: 'rooster',
    metadata: { title: 'Workflow Trigger', dml, dmlXml: '' },
    subscriptions: [],
  }
);

// 4. Assign card to page
await api('PUT', '/api/content/v1/cards/bulk/pages', [
  { cardId: cardRes.id, pageId: Number(landingViewId) },
]);

// 5-7. Acquire lock, update layout, release lock
await api('PUT', `/api/content/v4/pages/layouts/${layoutId}/writelock`, {});
await api('PUT', `/api/content/v4/pages/layouts/${layoutId}`, updatedLayout);
await api('DELETE', `/api/content/v4/pages/layouts/${layoutId}/writelock`);
```
