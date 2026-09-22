---
name: workflow-builder
tier: 1
agent:
  name: "Workflow Builder Agent"
  roles: ["Solutions Consultant", "Process Automation Engineer"]
  target_roi: "Programmatically create and manage Domo Workflows — automate business processes with forms, Code Engine functions, dataset queries, branching, and AI agents"
description: "Build Domo Workflows programmatically — orchestrates forms, Code Engine functions, dataset queries, branching, and AI agents into a process. Trigger with 'workflow', 'domo workflow', 'build a workflow', 'create a workflow', 'automate business process', 'workflow to collect [data] and [action]', or any request to create, modify, or manage a Domo Workflow. For in-app WorkflowClient SDK reference (starting workflows from a custom app) use the workflow skill."
maturity: alpha
audience: [orchestration]
---

# Workflow Builder Agent

Creates and manages Domo Workflows through the API. Takes a natural-language description of a business process, designs the workflow graph with appropriate node types, builds it in Domo, validates, and releases it. Handles forms, Code Engine functions, dataset queries, branching logic, parallel execution, AI agents, and execution monitoring.

> **Verified from 24 production workflows** mined from domo.domo.com (278 nodes, 269 edges, 114 sampled executions). All patterns, node types, and statistics below come from real deployed workflows.

## Triggers

- "build a workflow for [process]"
- "create a workflow that [does X]"
- "automate [business process]"
- "workflow to collect [data] and [action]"
- "create a form workflow for [use case]"
- "set up an approval workflow"
- "build an automation that triggers when [event]"
- "create a scheduled workflow to [task]"

---

## How Domo Workflows Work

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Model** | A workflow definition — the container that holds versions, triggers, and execution history. Has a numeric ID. |
| **Version** | An immutable snapshot of a workflow graph. Each edit creates a new version (e.g., 1.0.0, 1.0.1). Contains `savedJson` with the full graph. |
| **Deployment** | The currently active/released version that executes when triggered. Only one version is active at a time. |
| **Trigger** | How a workflow starts — manual, form submission, schedule (timer), API call, alert, or another workflow. |
| **Execution** | A single run of a deployed workflow. Tracks status, start/end times, and outputs. |

### API Structure

- **v1 endpoints** — broader access for reads, and **required for model creation** (v2 POST /models returns 404 — known Domo bug). `GET /api/workflow/v1/models` returns ALL models visible to the user (e.g., 24 on domo.domo.com).
- **v2 endpoints** — used for most writes and newer features. `GET /api/workflow/v2/models` returns only YOUR models (e.g., 3 vs 24). Version create/update/validate/release operations use v2. **Exception:** model creation must use v1.

### Graph Format

The workflow graph lives inside `savedJson` (a JSON string) on the version object. When parsed, it contains:

```json
{
  "version": 2,
  "designElements": [],
  "dataList": [],
  "schema": { "inputs": {}, "outputs": {} }
}
```

- **`designElements[]`** — Array of **both** nodes AND edges in the same array. Each node has `id`, `type`, `position: {x, y}`, `data`, `index`, and required styling fields. Each edge has `id`, `type`, `source`, `target`, and `data` with path/position info.
- **`dataList`** — Always include as empty array `[]` (required by the API).
- **`schema`** — Always include as `{ "inputs": {}, "outputs": {} }` (required by the API).

**Important:** `savedJson` is a JSON string, not a parsed object. You must `JSON.parse()` it when reading and `JSON.stringify()` it when writing.

**Important:** There is NO separate `designEdges[]` — edges go inside `designElements[]` alongside nodes.

---

## Node Types Reference

All node types discovered from mining 24 production workflows (278 total nodes):

| Node Type | Count | Purpose | Key Properties |
|-----------|-------|---------|----------------|
| `serviceTaskNode` | 140 | Execute Code Engine function or other service | `data.taskType: "nebulaFunction"`, `data.metadata.packageId`, `data.metadata.functionName`, `data.metadata.version` |
| `endNode` | 41 | Terminate a workflow path | `data.endType: "default"` |
| `rootNode` | 23 | Start node / form trigger | `data.isFormStart`, `data.formId`, `data.input[]` for form fields |
| `conditionalGatewayNode` | 22 | If/else branching | `data.conditions[]` with expressions, outgoing edges use `sourceHandle` |
| `DATASET_QUERY_TASK` | 16 | SQL query against a Domo dataset | `data.dataset.value` (datasetId), `data.query` (SQL string), `data.result` (output variable) |
| `userTaskNode` | 15 | Human approval or manual task | Requires user interaction to complete |
| `parallelGatewayNode` | 10 | Fork/join parallel execution paths | Splits flow into parallel branches, then merges |
| `AI_AGENT` | 4 | AI agent task | `data.taskType: "artificialIntelligence"`, `data.metadata` for agent config |
| `intermediateCatchEventNode` | 3 | Wait for event or timer | Pauses execution until a condition is met |
| `timerBoundary` | 2 | Timeout boundary on a task | Attached to another node, fires if the parent takes too long |
| `SUB_FLOW` | 1 | Call another workflow | `data.modelId` or `data.metadata.modelId` references another workflow model |
| `EMPTY` | 1 | No-op / placeholder | Pass-through node, no processing |

### Node Data Structure

Every node follows this structure (note the required `dimensions`, `_designNode`, `style`, and `index` fields):

```json
{
  "id": "randomString15ch",
  "type": "serviceTaskNode",
  "position": { "x": 400, "y": 200 },
  "data": {
    "title": "Human-readable name",
    "description": "Optional description",
    "dimensions": { "width": 250, "height": 60 },
    "_designNode": "serviceTaskNode",
    "taskType": "nebulaFunction",
    "metadata": {
      "packageId": "uuid-of-ce-package",
      "functionName": "functionName",
      "version": "1.0.0"
    },
    "input": [
      { "id": "inputFieldId", "name": "paramName", "type": "text", "required": true }
    ],
    "output": [
      { "id": "outputFieldId", "name": "resultName", "type": "object" }
    ]
  },
  "style": { "zIndex": 3, "outline": "none" },
  "index": 0
}
```

**Required fields on every node:**
- `data.dimensions: { width: 250, height: 60 }` — required for rendering
- `data._designNode: "<nodeType>"` — mirrors the element-level `type`
- `style: { zIndex: 3, outline: "none" }` — required styling
- `index: <number>` — position in the designElements array

**Special node data fields:**
- **rootNode**: `data.type: "Start"` (in addition to element-level `type: "rootNode"`)
- **endNode**: `data.type: "End"` and `data.terminating: false`

**Exception:** The root node always has `id: "rootNode"` (literal string, not random).

---

## Edge Types

| Edge Type | Purpose | Key Properties |
|-----------|---------|----------------|
| `defaultEdge` | Standard connection between nodes | `source`, `target` |
| `conditionalEdge` | Branch from a condition node | `source`, `target`, `sourceHandle` (branch identifier, e.g., "yes"/"no"), `label` (display text) |

### Edge Structure

Edges go inside `designElements[]` alongside nodes (there is no separate `designEdges[]`):

```json
{
  "id": "edge-sourceId-targetId-randomStr",
  "source": "rootNode",
  "target": "UcDDvNtodmOOlyx",
  "data": {
    "sourcePosition": "bottom",
    "targetPosition": "top",
    "path": [[525, 240], [525, 319]],
    "title": ""
  },
  "style": { "zIndex": 5 },
  "index": 2,
  "arrowHeadType": "arrow",
  "type": "defaultEdge"
}
```

**Required edge fields:**
- `data.sourcePosition` / `data.targetPosition` — typically `"bottom"` and `"top"` for vertical flows
- `data.path` — array of [x, y] coordinate pairs for the edge path
- `style: { zIndex: 5 }` — edges use higher zIndex than nodes
- `index` — position in the designElements array
- `arrowHeadType: "arrow"` — renders the arrow indicator

---

## Building a Workflow Step-by-Step

### Step 1: Create the Model

```
workflow_create(
  name: "Invoice Approval Workflow",
  description: "Collects invoice data via form, routes for approval, stores in AppDB"
)
```

Returns the model with its numeric `id`. Save this for all subsequent operations.

### Step 2: Create the First Version

```
workflow_version_create(model_id: <model_id>, version: "1.0.0")
```

Returns the version object (e.g., version `1.0.0`). The version starts in DRAFT state with an empty graph. **Note:** The body must include a version string — an empty body `{}` will fail.

### Step 3: Design the Graph

Build the `designElements[]` array (containing both nodes AND edges) following these rules:

1. **Every workflow needs a `rootNode`** with id `"rootNode"` — this is the entry point.
2. **Every workflow needs at least one `endNode`** — every execution path must terminate.
3. **Node IDs must be unique** — use random 15-character alphanumeric strings (except rootNode).
4. **Edge IDs follow pattern:** `"edge-{sourceId}-{targetId}-{randomStr}"`
5. **Position nodes on a canvas** — use x/y coordinates for visual layout in the Domo UI:
   - Start node: `x: 400, y: 200`
   - Processing nodes: increment y by ~160 per step (vertical flow)
   - Parallel branches: use different x values
   - End nodes: bottommost position
6. **Every node needs:** `dimensions`, `_designNode`, `style`, `index` (see Node Data Structure)
7. **Edges go in `designElements[]`** — not in a separate array
8. **Top-level definition must include:** `dataList: []` and `schema: { inputs: {}, outputs: {} }`

#### Minimal Workflow Example (rootNode + endNode)

```json
{
  "version": 2,
  "designElements": [
    {
      "id": "rootNode",
      "type": "rootNode",
      "position": { "x": 400, "y": 200 },
      "data": {
        "title": "Start",
        "type": "Start",
        "dimensions": { "width": 250, "height": 60 },
        "_designNode": "rootNode",
        "input": [],
        "output": []
      },
      "style": { "zIndex": 3, "outline": "none" },
      "index": 0
    },
    {
      "id": "endNode001xxxxxx",
      "type": "endNode",
      "position": { "x": 400, "y": 400 },
      "data": {
        "title": "End",
        "type": "End",
        "terminating": false,
        "dimensions": { "width": 250, "height": 60 },
        "_designNode": "endNode",
        "endType": "default"
      },
      "style": { "zIndex": 3, "outline": "none" },
      "index": 1
    },
    {
      "id": "edge-rootNode-endNode001xxxxxx-e1",
      "source": "rootNode",
      "target": "endNode001xxxxxx",
      "data": {
        "sourcePosition": "bottom",
        "targetPosition": "top",
        "path": [[525, 240], [525, 399]],
        "title": ""
      },
      "style": { "zIndex": 5 },
      "index": 2,
      "arrowHeadType": "arrow",
      "type": "defaultEdge"
    }
  ],
  "dataList": [],
  "schema": { "inputs": {}, "outputs": {} }
}
```

### Step 4: Update the Definition

```
workflow_version_update_definition(
  model_id: <model_id>,
  version: <version_number>,
  definition: { version: 2, designElements: [...], dataList: [], schema: { inputs: {}, outputs: {} } }
)
```

### Step 5: Validate

```
workflow_version_validate(
  model_id: <model_id>,
  version: <version_number>
)
```

Review validation results. Fix any errors before releasing.

### Step 6: Release

```
workflow_version_release(
  model_id: <model_id>,
  version: <version_number>
)
```

The version is now the active deployment. The workflow can be triggered.

---

## The dataList System — How Data Flows Between Nodes

**This is the most critical concept for building working workflows.** Data does not flow directly between nodes. Instead, every workflow definition has a `dataList[]` array that acts as a shared variable store. Nodes read and write to dataList entries via `mappedTo` references.

### How It Works

1. Each `dataList` entry is a variable with a unique `id` and `paramName`.
2. A node's **output** parameter has `mappedTo: "<dataListEntryId>"` — when the node completes, its output is written to that dataList variable.
3. A downstream node's **input** parameter has `mappedTo: "<dataListEntryId>"` — at execution time, the workflow engine reads the value from that dataList variable and passes it to the node.
4. Static values use `value` instead of `mappedTo` (e.g., a hardcoded collection ID).

### dataList Entry Format

```json
{
  "id": "unique15charId1",
  "paramName": "aiResult",
  "dataType": "text",
  "isList": false,
  "children": [],
  "showChildren": false,
  "entitySubType": null,
  "value": null,
  "isOutput": false
}
```

### Example: AI Output → Writer CE Input

```
AI tile output:       { paramName: "result", mappedTo: "PL8onAvXHgyXAgr" }
dataList entry:       { id: "PL8onAvXHgyXAgr", paramName: "aiResult", dataType: "text" }
Writer CE input:      { paramName: "analysis", mappedTo: "PL8onAvXHgyXAgr" }
```

The AI tile writes its result to the dataList entry. The Writer CE reads from the same entry. The `paramName` on the dataList entry is just a label — the `id` is what matters for mapping.

### Important Rules

- Every node output that will be consumed downstream MUST have a corresponding dataList entry.
- The `mappedTo` value on an input/output MUST match a dataList entry `id`.
- For static values (not mapped from another node), set `mappedTo: null` and put the value in `value` using rich text format.
- Add all new dataList entries to `def.dataList` — forgetting this causes silent data loss (the downstream node receives `null`).

---

## Code Engine Integration

**Code Engine is the primary workhorse of Domo Workflows.** 92% of service task nodes (138 of 140) use CE functions. 22 of 24 mined workflows contain at least one CE function call.

### Service Task Node for CE — Full Working Structure

The simplified structure shown in the Node Data Structure section above is for conceptual understanding. **The actual working structure** required by the workflow engine is more detailed:

```json
{
  "id": "nodeId15chars01",
  "type": "serviceTaskNode",
  "position": { "x": 400, "y": 200 },
  "data": {
    "dimensions": { "width": 250, "height": 60 },
    "title": "Create AppDB Document",
    "description": "",
    "_designNode": "serviceTaskNode",
    "taskType": "codeEngine",
    "metadata": {
      "packageId": "812991e0-e967-4bd6-ae80-7709c96155b0",
      "functionName": "createAppDBDocument",
      "version": "2.0.1"
    },
    "input": [
      {
        "aiDescription": null,
        "children": [],
        "configType": null,
        "customMappingType": null,
        "dataType": "text",
        "displayName": "collectionId",
        "entitySubType": null,
        "flag": "input",
        "id": "inputId1xxxxxxx",
        "isList": false,
        "mappedTo": null,
        "paramName": "collectionId",
        "required": true,
        "value": [{"type": "paragraph", "children": [{"text": "collection-uuid-here", "bold": false, "italic": false, "underlined": false, "sql": false}]}],
        "visible": true
      },
      {
        "aiDescription": null,
        "children": [],
        "configType": null,
        "customMappingType": null,
        "dataType": "object",
        "displayName": "document",
        "entitySubType": null,
        "flag": "input",
        "id": "inputId2xxxxxxx",
        "isList": false,
        "mappedTo": "writerResultDataListId",
        "paramName": "document",
        "required": true,
        "value": null,
        "visible": true
      }
    ],
    "output": [
      {
        "aiDescription": null,
        "children": [],
        "configType": null,
        "customMappingType": null,
        "dataType": "object",
        "displayName": "document",
        "entitySubType": null,
        "flag": "output",
        "id": "outputId1xxxxxx",
        "isList": false,
        "mappedTo": "appdbResultDataListId",
        "paramName": "document",
        "required": true,
        "value": null,
        "visible": true
      }
    ],
    "usesStructuredOutputs": false,
    "selectedTaskTitle": "Create AppDB Document",
    "selectedTaskDescription": ""
  },
  "style": { "zIndex": 3, "outline": "none" },
  "index": 4
}
```

### Rich Text Format for Static Values

When a node input has a static value (not mapped from another node), the `value` field uses rich text format — NOT a plain string:

```json
[{
  "type": "paragraph",
  "children": [{
    "text": "your-value-here",
    "bold": false,
    "italic": false,
    "underlined": false,
    "sql": false
  }]
}]
```

This applies to: DS Query SQL, AI tile instructions, static input parameters (e.g., a hardcoded collection ID). Always use this format — plain strings in `value` fields are silently ignored.

### Edge Format (v2 Definition API)

In the v2 definition API, edges live in `designElements[]` alongside nodes (not in a separate `designEdges[]`). Each edge also needs `data` with position info:

```json
{
  "id": "e-randomString12",
  "source": "sourceNodeId",
  "target": "targetNodeId",
  "data": {
    "sourcePosition": "bottom",
    "targetPosition": "top",
    "path": [],
    "title": ""
  },
  "style": { "zIndex": 5 },
  "arrowHeadType": "arrow",
  "type": "defaultEdge",
  "index": 7
}
```

### Re-indexing Elements

After adding/removing elements, re-index all designElements:

```javascript
def.designElements.forEach((e, i) => { e.index = i; });
```

### AI Tile (serviceTaskNode with artificialIntelligence)

The AI tile is a `serviceTaskNode` with `taskType: "artificialIntelligence"` (not "nebulaFunction"). It has special input parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | text | The data to analyze. Can be `mappedTo` a dataList variable or set via `value` (rich text). |
| `instructions` | text | The prompt/instructions for the AI. Always set via `value` (rich text). |
| `model` | text | The AI model to use (e.g., `"domo.domo_ai"`). |

The AI tile's output `result` contains `generatedText` — the AI's response as a string. Map it to a dataList entry to pass downstream.

**Tip:** For multi-row data analysis, embed the data directly in the `instructions` field rather than relying on DS Query → dataList (which only passes the first cell). This is the most reliable pattern for AI-driven analysis workflows.

### Built-in Global AppDB CE

Domo provides a built-in GLOBAL Code Engine package for AppDB operations. Use it instead of creating custom AppDB CE functions:

| Property | Value |
|----------|-------|
| Package ID | `63531352-593e-451a-8de5-406d9f4e9bd2` |
| Function | `createAppDBDocument` |
| Version | `2.1.0` |
| Input: `collectionId` | `text` — the AppDB collection UUID (static value in rich text) |
| Input: `document` | `object` — the document to store (mapped from upstream dataList) |
| Output: `document` | `object` — the stored document with generated `id` |

### Executing a Workflow via API

To trigger a workflow programmatically (without a trigger):

```
POST /api/workflow/v1/instances/message
Body: { "messageName": "start", "modelId": "<model-uuid>", "data": {} }
```

**Note:** Use the model's UUID (from the model object), not the numeric ID. The `data` field can pass initial variables. Do NOT include a `version` field — the API always runs the currently released version.

### Discovering CE Packages

Use the domo-codeengine MCP tools to find available packages and functions:

```
codeengine_package_list()                          → list all packages
codeengine_package_get(package_id: "uuid")         → get package with functions
codeengine_version_get(package_id: "uuid", version: 1) → get function code and manifest
```

### Common CE Function Categories (from 30 unique packages across 24 workflows)

| Category | Examples | Common Functions |
|----------|----------|-----------------|
| **Object Manipulation** | DOMO Object Utilities | `createObject`, `mergeObjects`, `getProperty` |
| **String/List Operations** | DOMO Text Utilities | `splitText`, `getTextFromList`, `joinList` |
| **AppDB Operations** | AppDB Helper | `createAppDBDocument`, `queryAppDB`, `updateDocument` |
| **HTTP Requests** | Custom packages | `sendRequest`, `postWebhook`, `callExternalAPI` |
| **Data Transformations** | Various | `transformData`, `flattenObject`, `convertCSV` |
| **Notifications** | DOMO Notifications | `sendEmail`, `sendBuzzMessage`, `postToTeams` |
| **Dataset Operations** | DOMO DataSets | `queryDatasetAndFlattenField`, `queryWithSql` |

### Version Pinning

Always specify the exact CE package version in `metadata.version`. Workflows reference specific released versions — if you update a CE package, existing workflows continue using the pinned version until you update the workflow definition.

---

## Form-Started Workflows

**67% of mined workflows (16 of 24) use form triggers** — this is the most common pattern.

### Root Node with Form

```json
{
  "id": "rootNode",
  "type": "rootNode",
  "position": { "x": 100, "y": 200 },
  "data": {
    "title": "Start Invoice Submission",
    "isFormStart": true,
    "formId": "uuid-of-form",
    "input": [
      { "id": "fieldId1xxxxxxx", "name": "invoiceNumber", "type": "text", "label": "Invoice Number", "required": true },
      { "id": "fieldId2xxxxxxx", "name": "amount", "type": "number", "label": "Amount", "required": true },
      { "id": "fieldId3xxxxxxx", "name": "vendor", "type": "text", "label": "Vendor Name", "required": true },
      { "id": "fieldId4xxxxxxx", "name": "notes", "type": "text", "label": "Notes", "required": false }
    ],
    "output": []
  }
}
```

### Form Field Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique 15-character field ID |
| `name` | string | Field variable name (used in downstream nodes) |
| `type` | string | Field type: `text`, `number`, `date`, `person`, `dataset`, `boolean`, `object` |
| `label` | string | Display label shown on the form |
| `required` | boolean | Whether the field must be filled |

### How Form Data Flows

Form field values become variables accessible to downstream nodes. Reference them in CE function inputs or condition expressions by their field `id` or `name`. The form submission automatically creates a workflow execution instance.

---

## Dataset Query Nodes

**33% of mined workflows (8 of 24) use dataset queries** for reading data from Domo datasets via SQL.

### DATASET_QUERY_TASK Node

```json
{
  "id": "queryNode1xxxxxx",
  "type": "DATASET_QUERY_TASK",
  "position": { "x": 350, "y": 200 },
  "data": {
    "title": "Lookup Customer",
    "dataset": {
      "value": "dataset-uuid-here"
    },
    "query": "SELECT customer_name, email FROM table WHERE customer_id = '${customerId}'",
    "result": "customerData",
    "input": [
      { "id": "inputParamId001", "name": "customerId", "type": "text" }
    ],
    "output": [
      { "id": "outputResultId01", "name": "customerData", "type": "object" }
    ]
  }
}
```

### Key Properties

| Property | Description |
|----------|-------------|
| `dataset.value` | UUID of the Domo dataset to query |
| `query` | SQL string — can use `${variable}` syntax for parameterized values |
| `result` | Name of the output variable containing query results |

---

## Branching and Parallel Execution

### Conditional Gateway (If/Else)

22 `conditionalGatewayNode` instances found across mined workflows.

```json
{
  "id": "condNode1xxxxxxx",
  "type": "conditionalGatewayNode",
  "position": { "x": 500, "y": 200 },
  "data": {
    "title": "Check Approval Status",
    "conditions": [
      {
        "expression": "${approvalStatus} == 'approved'",
        "label": "Approved"
      }
    ]
  }
}
```

**Conditional edges** use `sourceHandle` to route to different branches:

```json
{
  "id": "edge-condNode1-approvedPath-e1",
  "type": "conditionalEdge",
  "source": "condNode1xxxxxxx",
  "target": "approvedPathNode",
  "sourceHandle": "yes",
  "label": "Approved"
},
{
  "id": "edge-condNode1-rejectedPath-e2",
  "type": "conditionalEdge",
  "source": "condNode1xxxxxxx",
  "target": "rejectedPathNode",
  "sourceHandle": "no",
  "label": "Rejected"
}
```

### Parallel Gateway (Fork/Join)

10 `parallelGatewayNode` instances found. Used to split a workflow into parallel paths that execute simultaneously, then merge before continuing.

```json
{
  "id": "forkNode1xxxxxxx",
  "type": "parallelGatewayNode",
  "position": { "x": 400, "y": 200 },
  "data": {
    "title": "Process in Parallel"
  }
}
```

Fork pattern: one `parallelGatewayNode` with multiple outgoing edges to different paths. Join pattern: another `parallelGatewayNode` with multiple incoming edges converging.

---

## Triggers

### Trigger Types

| Type | Description | Usage |
|------|-------------|-------|
| `MANUAL` | User clicks "Run" in UI or triggers via API | Testing, ad-hoc execution |
| `TEST` | Test execution (non-production) | Development |
| `TIMER` | Schedule-based (cron) | Recurring automation |
| `API` | External API call triggers the workflow | Integration with external systems |
| `WORKFLOW` | Another workflow triggers this one | Chained workflows |
| `REMOTE` | Remote trigger from external service | Webhooks |
| `CUSTOM_APP` | Triggered from a Domo custom app | App-driven workflows |
| `APP_STUDIO` | Triggered from App Studio | App Studio integration |
| `ALERT` | Triggered by a Domo alert | Data-driven automation |
| `PAGE_ACCESS_REQUESTED` | User requests page access | Access management |
| `CARD_ACCESS_REQUESTED` | User requests card access | Access management |
| `DATA_APP_ACCESS_REQUESTED` | User requests data app access | Access management |

### Creating a Trigger

**Note:** Releasing a version automatically creates and activates a manual trigger. You only need to create triggers manually for non-manual types (TIMER, API, etc.) or if you need additional triggers.

```
workflow_trigger_create(
  trigger: {
    modelId: <model_id>,
    name: "Weekday Morning Run",
    type: "TIMER",
    config: {
      cronExpression: "0 8 * * 1-5"
    }
  }
)
```

After creating, activate the trigger:

```
workflow_trigger_activate(trigger_id: "<trigger_id>")
```

### Managing Triggers

```
workflow_trigger_list(model_id: <model_id>)      → list all triggers
workflow_trigger_get(trigger_id: "<id>")           → get trigger detail
workflow_trigger_update(trigger_id: "<id>", trigger: {...}) → update config
workflow_trigger_delete(trigger_id: "<id>")        → remove trigger
```

---

## Execution Monitoring

### Listing Executions

```
workflow_execution_list(model_id: <model_id>)
workflow_execution_list(model_id: <model_id>, status: "FAILED")
```

### Execution Statuses

| Status | Description |
|--------|-------------|
| `NOT_STARTED` | Queued but not yet running |
| `IN_PROGRESS` | Currently executing |
| `COMPLETED` | Finished successfully |
| `FAILED` | Encountered an error |
| `CANCELLED` | Manually cancelled |

### Getting Results

```
workflow_execution_get(execution_id: "<id>")       → full execution detail
workflow_execution_outputs(execution_id: "<id>")   → output values
```

### Retry and Cancel

```
workflow_execution_restart(execution_id: "<id>")   → retry a failed execution
workflow_execution_cancel(execution_ids: ["<id1>", "<id2>"]) → cancel running executions
```

### Production Statistics (from 114 sampled executions)

- **Success rate:** 82% (93 completed, 13 failed, 8 other)
- **Average nodes per workflow:** 11.6
- Most workflows have 5-15 nodes; the largest observed had 30+.

---

## Common Patterns (from 24 production workflows)

### Pattern 1: Form -> Process -> Store (Most Common)

The dominant pattern. A form collects user input, CE functions process it, and results are stored in AppDB or a dataset.

```
[rootNode (form)] --> [serviceTaskNode: createObject] --> [serviceTaskNode: createAppDBDocument] --> [endNode]
```

**Example workflows:** Use Case Submission, Collect Sales Use Cases, Submit AI Solution Showcase, Request AI Tool.

### Pattern 2: Form -> Branch -> Different Actions

Form input is evaluated by a condition node, routing to different processing paths.

```
[rootNode (form)] --> [conditionalGatewayNode] --yes--> [serviceTaskNode: approve] --> [endNode]
                                                --no---> [serviceTaskNode: reject]  --> [endNode]
```

**Example workflows:** Invoice Hold Approval, CED | Define Change, Code Review Request.

### Pattern 3: Scheduled Data Processing

Timer trigger kicks off dataset queries and CE processing on a schedule.

```
[rootNode] --> [DATASET_QUERY_TASK] --> [serviceTaskNode: transform] --> [serviceTaskNode: store] --> [endNode]
```

**Example workflows:** PMO Capacity Dataflow Run, Run Dataflow (DP26 Reg + Updates).

### Pattern 4: Multi-Step Approval

Form submission followed by a human approval task, then conditional routing based on the approval decision.

```
[rootNode (form)] --> [userTaskNode: review] --> [conditionalGatewayNode] --approved--> [serviceTaskNode: process] --> [endNode]
                                                                          --rejected--> [serviceTaskNode: notify]  --> [endNode]
```

**Example workflows:** Invoice Hold Approval, DomoFM: Product Feature Enablement.

### Pattern 5: AI-Augmented Processing

Data collection followed by an AI agent node for intelligent processing, then CE post-processing.

```
[rootNode] --> [serviceTaskNode: gather data] --> [AI_AGENT: analyze] --> [serviceTaskNode: format output] --> [endNode]
```

**Example workflows:** DDA | Roadmap Generator, HUB Hours Expiration Agent.

### Pattern 6: Parallel Processing

Fork into multiple parallel paths for independent processing, then join results.

```
[rootNode] --> [parallelGatewayNode: fork] --> [serviceTaskNode: path A] --> [parallelGatewayNode: join] --> [endNode]
                                           --> [serviceTaskNode: path B] -->
```

**Example workflows:** Brain Connect Create Event, Unified Support Triage Replies.

---

## Execution Flow — New Workflow

### Step 1: Understand Requirements

Parse the user's request to identify:
- **Business process** — what should the workflow automate?
- **Trigger type** — form submission, schedule, API call, manual?
- **Processing steps** — what happens at each stage?
- **Data sources** — any datasets to query? Which CE packages to use?
- **Branching logic** — any if/else decisions?
- **Human tasks** — any approval steps?
- **Output** — where do results go? (AppDB, dataset, email, Buzz, etc.)

### Step 2: Design the Workflow

Present the workflow design to the user before building:

```
Workflow: "Invoice Approval"
Trigger: Form submission

Flow:
  1. [Form] Invoice Number, Amount, Vendor, Notes
  2. [CE] Create invoice object from form fields
  3. [Dataset Query] Lookup vendor in approved vendors list
  4. [Condition] Amount > $5000?
     - Yes: [User Task] Manager approval required
       - Approved: [CE] Store in AppDB + [CE] Send confirmation email
       - Rejected: [CE] Send rejection email
     - No: [CE] Auto-approve, store in AppDB + [CE] Send confirmation email
  5. [End]
```

**Wait for user confirmation before proceeding to Step 3.**

### Step 3: Discover CE Packages

Use domo-codeengine tools to find or create the CE functions needed:

```
codeengine_package_list()                               → find existing utility packages
codeengine_package_get(package_id: "uuid")              → check available functions
codeengine_function_get(package_id: "uuid", function: "name") → get function signature
```

If needed CE functions don't exist, use the **Code Engine Builder** skill to create them first.

### Step 4: Build the Graph

Construct the full `designElements[]` and `designEdges[]` arrays following the node type reference and layout conventions above.

### Step 5: Create, Update, Validate, Release

```
workflow_create(name: "Invoice Approval", description: "...")              → get model_id (uses v1)
workflow_version_create(model_id: <id>, version: "1.0.0")                 → get version number
workflow_version_update_definition(model_id: <id>, version: <v>, definition: {...})  → uses PUT
workflow_version_validate(model_id: <id>, version: <v>)                   → check for errors
workflow_version_release(model_id: <id>, version: <v>)                    → deploy (auto-creates manual trigger)
```

### Step 6: Set Up Triggers

**Note:** Releasing a version automatically creates and activates a manual trigger. You typically only need this step for non-manual triggers (TIMER, API, etc.).

```
workflow_trigger_create(trigger: { modelId: <id>, name: "Scheduled Run", type: "TIMER", config: { cronExpression: "0 8 * * 1-5" } })
workflow_trigger_activate(trigger_id: "<trigger_id>")
```

### Step 7: Verify

```
workflow_get(model_id: <id>)                                   → confirm deployment
workflow_execution_list(model_id: <id>)                        → check run history
```

Report the result:
- Workflow model ID and version
- Deployed status
- Trigger configuration
- Link: `https://{instance}.domo.com/workflows/models/{model_id}`

---

## MCP Tools Reference

### Model Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `workflow_list` | List all workflow models | `limit`, `offset` |
| `workflow_get` | Get model detail with versions | `model_id` |
| `workflow_version_get` | Get full version with savedJson graph | `model_id`, `version` |
| `workflow_version_definition` | Get workflow graph definition | `model_id`, `version` |
| `workflow_create` | Create a new workflow model | `name`, `description` |
| `workflow_version_create` | Create a new version | `model_id` |
| `workflow_version_update_definition` | Update workflow graph | `model_id`, `version`, `definition` |
| `workflow_version_validate` | Validate a version | `model_id`, `version` |
| `workflow_version_release` | Release/deploy a version | `model_id`, `version` |

### Trigger Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `workflow_trigger_list` | List triggers for a model | `model_id` |
| `workflow_trigger_create` | Create a trigger | `trigger` (object with modelId, type, config) |
| `workflow_trigger_get` | Get trigger detail | `trigger_id` |
| `workflow_trigger_update` | Update a trigger | `trigger_id`, `trigger` |
| `workflow_trigger_delete` | Delete a trigger | `trigger_id` |
| `workflow_trigger_activate` | Activate a trigger | `trigger_id` |

### Execution Management

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `workflow_execution_list` | List executions for a model | `model_id`, `status`, `limit`, `offset` |
| `workflow_execution_get` | Get execution detail | `execution_id` |
| `workflow_execution_outputs` | Get execution outputs | `execution_id` |
| `workflow_execution_restart` | Restart a failed execution | `execution_id` |
| `workflow_execution_cancel` | Cancel running executions | `execution_ids` (array) |

### Utility

| Tool | Description |
|------|-------------|
| `workflow_health_check` | Verify Domo Workflows API connectivity |

---

## Gotchas and Tips

1. **`savedJson` is a JSON string** — not a parsed object. You must `JSON.parse()` it when reading from `workflow_version_get`. When updating via `workflow_version_update_definition`, pass the parsed object directly (the tool handles serialization).

2. **The rootNode ID is always literally `"rootNode"`** — do not generate a random ID for it. All other node IDs should be random 15-character alphanumeric strings.

3. **Edge IDs follow the pattern** `"edge-{sourceId}-{targetId}-{randomStr}"` — this is a convention, not enforced, but keeps things readable.

4. **v1 vs v2 model visibility** — `GET /v1/models` returns ALL models visible to the user. `GET /v2/models` returns only models YOU own. For discovery, use v1. For management, use v2.

5. **Versions are immutable** — once created, a version cannot be modified (even before release). To change a workflow, create a new version with the updated definition. Must validate then release for changes to take effect. **Version create requires a version string** (e.g. `"1.0.0"`) — an empty body fails.

6. **CE `metadata.version` is REQUIRED — runtime crash if missing.** The workflow engine's `NebulaMetadata` Java class requires a non-nullable `version` field. If you omit `version` from the CE node's `metadata`, the workflow will **validate successfully** but **fail at runtime** with `MissingKotlinParameterException`. Always include `version: '1.0.0'` (or the actual CE version) in every CE service task node's metadata. This error is not caught by validation — only by execution.

7. **Always validate before releasing** — `workflow_version_validate` catches graph errors (missing connections, invalid node types, unreachable nodes) before they cause runtime failures. However, validation does NOT catch all errors (see #6).

8. **Node IDs must be unique within a workflow** — duplicate IDs cause silent graph corruption.

9. **Multiple end nodes are normal** — workflows with branching often have 2+ end nodes (one per terminal path). The mined average is 1.7 end nodes per workflow.

10. **Inspect existing workflows for patterns** — use `workflow_list` + `workflow_version_get` + `workflow_version_definition` to study how production workflows are structured before building new ones.

11. **Condition edges need `sourceHandle`** — without `sourceHandle`, the workflow engine doesn't know which branch to follow. Use descriptive handles like `"yes"`/`"no"` or `"approved"`/`"rejected"`.

12. **Form fields use 15-character random IDs** — same format as node IDs. The `required` property determines whether the form enforces the field.

13. **Edges go in `designElements[]`, NOT in a separate `designEdges[]`** — the actual production format puts nodes and edges in the same array. Include `dataList: []` and `schema: { inputs: {}, outputs: {} }` at the top level.

14. **Nodes require dimensions and styling** — every node needs `data.dimensions: { width: 250, height: 60 }`, `data._designNode: "<nodeType>"`, `style: { zIndex: 3, outline: "none" }`, and `index`.

15. **Model creation uses v1** — `POST /api/workflow/v2/models` returns 404. Use `POST /api/workflow/v1/models` instead.

16. **Definition update uses PUT** — `POST` returns 405 Method Not Allowed. The correct method is `PUT /api/workflow/v2/models/{id}/versions/{v}/definition`.

17. **Releasing auto-creates a manual trigger** — you do not need to create a manual trigger separately after releasing a version. Only create triggers for non-manual types (TIMER, API, etc.).

18. **Cannot update a released version.** Attempting to PUT a definition to an already-released version returns 400. Always create a new version first.

19. **DS Query only passes the first cell value to downstream nodes.** The `DATASET_QUERY_TASK` node's `result` dataList variable receives only the first cell of the first row (e.g., `"East"`) — NOT the full query result. For multi-row data, either: (a) embed data directly in AI tile instructions, (b) use a CE function to query data via `codeengine.sendRequest('POST', 'api/query/v1/execute/{datasetId}', { sql })` instead of a DS Query node, or (c) use the DS Query for single-value lookups only.

20. **`SELECT *` without LIMIT can cause 500 on release.** Always include a `LIMIT` clause in DS Query SQL (e.g., `SELECT * FROM \`table\` LIMIT 100`).

21. **Version creation requires explicit semver string.** `POST /api/workflow/v2/models/{id}/versions` with body `{ "version": "7.0.0" }`. The version string must follow semver format.

22. **`displayName` fields are non-nullable.** Any input/output parameter with `displayName: null` will cause a validation error. Always set it to a non-empty string.

---

## App Studio Widget Binding (WORKFLOW_START Buttons)

App Studio's **WORKFLOW_START** button action requires a `widgetId` UUID — a stable per-app binding between a workflow model and an App Studio view. This is different from the workflow's model ID.

**Full API reference:** See `../build-appstudio/reference/appstudio-workflows-reference.md` for complete request/response schemas, DML structure, and TypeScript examples.

### When you need this

Any time an App Studio build requires a button that triggers a workflow (`actionType: "WORKFLOW_START"`), you must:

1. **Create a widget** binding the workflow to the App Studio app
2. **Use the returned `widgetId`** in the rooster card's DML button configuration

### Complete Action Chain

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | — | `workflow_list` + `workflow_version_list` | Get model ID and current version |
| 2 | POST | `/api/workflow/v1/models/widget` | Create widget binding (model → app/page) |
| 3 | POST | `/api/content/v1/cards` | Create rooster card with WORKFLOW_START button in DML |
| 4 | PUT | `/api/content/v1/cards/rooster/query` | Bind data source to component (optional) |
| 5 | PUT | `/api/content/v1/cards/bulk/pages` | Assign card to page |
| 6 | PUT | `/api/content/v4/pages/layouts/:id/writelock` → layout PUT → DELETE writelock | Update layout |

### Step 1: Get the workflow model ID and current version

```
workflow_list()  → find the model by name, get model_id
workflow_version_list(model_id)  → get the latest version string (e.g. "1.0.0")
```

### Step 2: Create the widget binding

**Tool:** `workflow_widget_create` (maps to `POST /api/workflow/v1/models/widget`)

```
workflow_widget_create(
  model_id: <numeric_model_id>,
  model_version: "1.0.0",
  app_id: <data_app_id>,
  app_view_id: <view_page_id>
)
```

**Request body:**
```json
{
  "modelId": "9c717acd-b738-494b-a2c0-309bfa36db43",
  "modelVersion": "3.0.6",
  "appId": "1074388577",
  "appViewId": "60754997"
}
```

**Response:** A bare UUID string (not an object): `"f8a2c1d4-3e5b-4f7a-9c1d-2e3f4a5b6c7d"`

**Gotchas:**
- Response is a bare string UUID — `JSON.parse` gives a string, not an object
- `appId` and `appViewId` must be **string** type (numeric strings), not integers
- The workflow model must be published (have at least one released version)

### Step 3: Create rooster card with WORKFLOW_START DML button

The DML button-widget uses `__dmlActions` with `type: "WORKFLOW_START"`:

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
      "entityId": "<widgetId-from-step-2>",
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

**All DML button action types:**

| `type` | Trigger | Required Fields |
|--------|---------|-----------------|
| `WORKFLOW_START` | Trigger a workflow | `entityId` (widgetId), `modelId`, `modelVersion`, `parameters[]` |
| `FORM_MODAL` | Open a form popup | `entityId` (formId), `formInstanceId`, `formMapping` |
| `WEBLINK` | Open external URL | `url`, `openInNewWindow` |
| `DOMOLINK` | Navigate to Domo content | `url`, `entityId`, `entityType`, `displayMode` |

**Workflow parameters** in `parameters[]` support three types:
- `"column"` — value from a dataset column (dynamic, row-level)
- `"static"` — hardcoded value set at design time
- `"variable"` — from an App Studio variable

### Pre-flight permission check

Before attempting workflow operations in App Studio context, verify the user has workflow permissions:

```
workflow_permissions_check(model_ids: [<model_id>])
```

Returns a map of `{ modelId: ["permissions"] }`. If `"START"` permission is missing, the WORKFLOW_START button will return 403 silently.

---

## Update Workflow

To modify a deployed workflow:

1. **Get the current version** — `workflow_version_definition(model_id, version)` to retrieve the current graph.
2. **Create a new version** — `workflow_version_create(model_id)` creates a new draft version.
3. **Update the definition** — modify the graph and call `workflow_version_update_definition` with the new definition.
4. **Validate and release** — `workflow_version_validate` then `workflow_version_release`.

**Never try to modify a released version.** Always create a new one.

---

## Guardrails

- **Confirm design before creating.** Always present the workflow design (Step 2 in Execution Flow) and wait for user approval before building.
- **Validate before releasing.** Always call `workflow_version_validate` before `workflow_version_release`.
- **Use existing CE packages when possible.** Check `codeengine_package_list` before creating new functions. Many common operations (object creation, text manipulation, email, AppDB) already exist.
- **Never delete without confirmation.** Deleting a workflow model or trigger is irreversible.
- **Check for existing workflows.** Use `workflow_list` to search for workflows with similar names before creating duplicates.
- **Test with manual trigger first.** Before setting up scheduled or API triggers, create a MANUAL trigger and run it once to verify the workflow executes correctly.
- **Handle errors in CE functions.** If a CE function fails, the entire workflow execution fails. Ensure CE functions have proper error handling.
- **Monitor after deployment.** After releasing, use `workflow_execution_list` to check for failures in the first few runs.

---

## MCP Servers Required

- **domo-workflows** — for all workflow model, version, trigger, and execution management
- **domo-codeengine** — for discovering and managing Code Engine packages used in service task nodes
- **domo-datasets** — for looking up dataset IDs used in DATASET_QUERY_TASK nodes

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"workflow"`
- `target_description`: a concise phrase describing what is being built (the result of Step 1)

This returns SOW scope items, named datasets, business rules, recent discussions, decisions, assumptions, risks, stakeholders, and prior work — all keyed to your build target, with confidence scores per section.

**Step 3 — Human review of memory hits.** Present the returned context to the user. For each section that has results:
- Show the section title and what was found (a 1-2 line summary per item)
- Show the confidence score
- Ask the user: "Are these relevant to what you're building? Reject anything that's about a different build, an older version, or a different engagement."

If a section returned 0 items, mention it explicitly so the user knows there's no prior context for that area.

**Step 4 — Plan with confirmed context.** Once the user confirms which items are relevant, use ONLY those confirmed items as inputs to your build plan. If the user rejected key context (e.g., no SOW scope was relevant), confirm with them whether to proceed greenfield or pause to gather more requirements.

If `memory_build_context` returns 0 total items, explicitly tell the user: "I found no prior memory context for this build. This will be a greenfield build — please confirm the requirements before I proceed."

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: workflow name, workflow ID, trigger configuration, action sequence, integration points, error handling.

## Related Skills

- **Code Engine Builder** (Build) — create CE functions that workflows call as service tasks
- **ETL Builder** (Build) — build data pipelines that can feed into or be triggered by workflows
- **AppDB Manager** (Build) — manage AppDB collections that workflows read from and write to
- **Account 360** (Discover) — understand customer context before designing workflow automations
