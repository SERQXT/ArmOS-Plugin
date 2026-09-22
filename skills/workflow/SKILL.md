---
name: workflow
tier: 0
description: "Start and monitor Domo workflows from inside a custom app via WorkflowClient — alias-based methods, strict input-variable matching, manifest workflowMapping, and card-mapping requirements. Trigger with 'WorkflowClient', 'workflowMapping', 'start workflow from app', 'workflow card mapping', 'domo workflow alias'. For building or authoring workflows programmatically use the workflow-builder skill."
maturity: alpha
audience: [code]
---

# Rule: Domo App Platform Workflows (Toolkit-First)

This rule is **toolkit-first**. Use `WorkflowClient` for workflow operations in apps.

## Canonical Client

```bash
yarn add @domoinc/toolkit
```

```typescript
import { WorkflowClient } from '@domoinc/toolkit';

const startResponse = await WorkflowClient.startModel('myWorkflow', {
  inputVar: 'value',
  anotherVar: 123
});
const instance = startResponse.body;
```

Check status:
```typescript
const statusResponse = await WorkflowClient.getInstance('myWorkflow', instance.id);
const status = statusResponse.body.status;
```

## Correct method usage (aliases, not UUIDs)

`WorkflowClient` workflow methods use the workflow **alias** from `manifest.json` `workflowMapping`, not the UUID.

```typescript
await WorkflowClient.startModel('myWorkflow', { inputVar: 'value' });
await WorkflowClient.getAllModels();          // or getAllModels(true)
await WorkflowClient.getModelDetails('myWorkflow');
await WorkflowClient.getInstance('myWorkflow', 'instance-id');
```

## Manifest Requirements

Workflows still require `workflowMapping` entries in `manifest.json`.

```json
{
  "workflowMapping": [
    {
      "alias": "sendReport",
      "modelId": "d1373fa7-9df8-45d3-80ba-f931dda169b4",
      "parameters": [
        { "aliasedName": "reportType", "type": "string", "list": false, "children": null },
        { "aliasedName": "recipients", "type": "string", "list": true, "children": null }
      ]
    }
  ]
}
```

## Card mapping and input contract reminder

- In Domo, map the app card to the intended workflow model in the card/app configuration UI (not just in source files).
- Confirm the workflow start-node input parameters are configured in the workflow and match the payload keys your app sends in `WorkflowClient.startModel(workflowAlias, variables)`.
- If parameter names/types/list settings do not match, workflow starts may fail or silently mis-handle inputs.
- When recommending or generating `WorkflowClient.startModel(...)` calls, the agent must explicitly tell the user the exact input variable names and types being passed.

## Error Handling Pattern

```typescript
async function runWorkflow(workflowAlias: string, payload: Record<string, unknown>) {
  try {
    const response = await WorkflowClient.startModel(workflowAlias, payload);
    return response.body;
  } catch (error) {
    console.error(`WorkflowClient.startModel failed for ${workflowAlias}`, error);
    throw error;
  }
}
```

## Checklist
- [ ] `workflowMapping` is configured
- [ ] App card is mapped to the correct workflow in Domo UI
- [ ] Workflow start-node input parameters match app payload keys/types
- [ ] Calls use `WorkflowClient` alias-based methods (`startModel`, `getModelDetails`, `getInstance`)
- [ ] Agent states exact `startModel` input variable names/types in guidance
- [ ] Code passes workflow aliases (from `workflowMapping.alias`) rather than workflow UUIDs
- [ ] Response parsing uses `response.body`
- [ ] Long-running workflow UX includes status checks or async user feedback

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection.
