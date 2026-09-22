# App Studio — Forms API Reference

Complete API documentation for App Studio forms, captured from live Domo network traffic. Used by form-builder, build-appstudio, and workflow-builder skills.

## Overview

Forms are standalone entities scoped to an App Studio app (`domainType: "APP_STUDIO_APP"`). They:

- Define sections with typed fields (text, choice, date, attachment, etc.)
- Automatically create a backing Domo dataset for submissions (`submitConfiguration.type: "DATASET"`)
- Are surfaced via `FORM_MODAL` button actions on rooster cards
- Persist submission rows with auto-added `__submittedBy__` and `__submittedOn__` columns

## Key IDs

| Entity | Field | Format | Notes |
|--------|-------|--------|-------|
| Form | `id` | UUID | Returned from POST; used as `entityId` in FORM_MODAL action |
| App | `domainId` | Numeric string | The `dataAppId` of the parent app |
| Field | `id` | UUID | Each field has its own UUID; used in `formMapping` |
| Dataset | `submitConfiguration.id` | UUID | Auto-created dataset that receives submissions |
| Field alias | `alias` | Snake_Case string | Used as the dataset column name |

## Field Types

All 11 field types with their configuration values:

| `fieldType` | `dataType` | `isList` | `displayAsDropdown` | Notes |
|-------------|-----------|----------|---------------------|-------|
| `SHORT_ANSWER` | `text` | `false` | -- | Single-line text input |
| `PARAGRAPH` | `text` | `false` | -- | Multi-line text area |
| `MULTIPLE_CHOICE` | `text` | `true` | `false` | Checkbox group |
| `MULTIPLE_CHOICE` | `text` | `true` | `true` | Multi-select dropdown |
| `SINGLE_CHOICE` | `text` | `false` | `false` | Radio button group |
| `SINGLE_CHOICE` | `text` | `false` | `true` | Single-select dropdown |
| `SINGLE_CHOICE` | `time` | `false` | `true` | Time picker dropdown |
| `DATE_TIME` | `date` | `false` | -- | Date/time picker (`acceptsInput: false`) |
| `DURATION` | `duration` | `false` | -- | Duration input (`acceptsInput: false`) |
| `ATTACHMENT` | `FILE` | `false` | -- | File upload; Domo assigns `fileSetId` in response |
| `TITLE_DESCRIPTION` | `text` | `false` | -- | Read-only header/label (`readOnly: true`, both accepts false) |
| `LIST_RESPONSE` | `text` | `true` | -- | Multi-value free-text list (`acceptsInput: false`) |

## acceptsInput vs acceptsOutput

| Combination | Meaning |
|-------------|---------|
| `acceptsInput: true, acceptsOutput: true` | Field receives pre-filled values AND writes to dataset |
| `acceptsInput: false, acceptsOutput: true` | Read-only to user, but value is saved to dataset |
| `acceptsInput: false, acceptsOutput: false` | Display-only -- never saved (e.g. `TITLE_DESCRIPTION`) |

## CREATE Action Chain

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/forms/v2` | Create form + backing dataset |
| 2 | POST | `/api/forms/v2/:id/hydration` | Initialize field configuration |
| 3 | POST | `/api/content/v1/cards` | Create rooster card with FORM_MODAL button |
| 4 | PUT | `/api/content/v1/cards/bulk/pages` | Assign card to page |
| 5 | PUT | `/api/content/v4/pages/layouts/:id/writelock` | Acquire edit lock |
| 6 | PUT | `/api/content/v4/pages/layouts/:id` | Update layout with card position |
| 7 | DELETE | `/api/content/v4/pages/layouts/:id/writelock` | Release edit lock |

### Step 1: Create Form -- POST /api/forms/v2

**Request Body Schema:**

```json
{
  "type": "object",
  "required": ["version", "domainType", "domainId", "name", "sections", "submitConfiguration"],
  "properties": {
    "version": { "type": "string", "enum": ["0.0.0"] },
    "domainType": { "type": "string", "enum": ["APP_STUDIO_APP"] },
    "domainId": { "type": "string", "description": "Numeric string dataAppId of the parent app" },
    "name": { "type": "string" },
    "description": { "type": "string" },
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid", "description": "Client-generated UUID" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "fields": { "type": "array", "items": { "$ref": "#/definitions/field" } }
        }
      }
    },
    "settings": {
      "type": "object",
      "properties": { "hideSectionHeaderDetails": { "type": "boolean" } }
    },
    "attributes": {
      "type": "array",
      "description": "Rich-text description blocks",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["paragraph"] },
          "children": { "type": "array", "items": { "type": "object", "properties": { "text": { "type": "string" } } } }
        }
      }
    },
    "fieldConfiguration": {
      "type": "object",
      "description": "Map of fieldId to config. Pass {} on create; targetMapping filled by server.",
      "additionalProperties": { "type": "object" }
    },
    "submitConfiguration": {
      "type": "object",
      "required": ["type", "name"],
      "properties": {
        "type": { "type": "string", "enum": ["DATASET"] },
        "name": { "type": "string", "description": "Name for the backing dataset" }
      }
    },
    "searchable": { "type": "boolean" }
  }
}
```

**Field Object Schema:**

```json
{
  "id": "uuid-client-generated",
  "label": "Question label shown to user",
  "placeholder": "",
  "optional": false,
  "fieldType": "SHORT_ANSWER",
  "dataType": "text",
  "acceptsInput": true,
  "acceptsOutput": true,
  "options": { "values": [], "acceptsOther": false },
  "defaultValue": "",
  "alias": "Short_Answer_Question",
  "isList": false
}
```

**Key field rules:**

- `alias` must be unique within the form. Becomes the dataset column name. Use `snake_Case` with no spaces.
- `id` is client-generated UUID. Server preserves this ID in the response. Use `crypto.randomUUID()`.
- For `MULTIPLE_CHOICE` / `SINGLE_CHOICE`: populate `options.values` with allowed choices.
- For `ATTACHMENT`: `dataType` must be `"FILE"`. Domo assigns a `fileSetId` in the response.
- For `DATE_TIME` / `DURATION` / `LIST_RESPONSE` / `ATTACHMENT`: set `acceptsInput: false`.
- `TITLE_DESCRIPTION`: set `acceptsInput: false`, `acceptsOutput: false`, `readOnly: true`.

**Minimal request example (2 fields):**

```json
{
  "version": "0.0.0",
  "domainType": "APP_STUDIO_APP",
  "domainId": "1659229913",
  "name": "Order Intake Form",
  "description": "",
  "sections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "",
      "description": "",
      "fields": [
        {
          "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          "label": "Order ID",
          "placeholder": "",
          "optional": false,
          "fieldType": "SHORT_ANSWER",
          "dataType": "text",
          "acceptsInput": true,
          "acceptsOutput": true,
          "options": { "values": [], "acceptsOther": false },
          "defaultValue": "",
          "alias": "Order_ID",
          "isList": false
        },
        {
          "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          "label": "Notes",
          "placeholder": "",
          "optional": true,
          "fieldType": "PARAGRAPH",
          "dataType": "text",
          "acceptsInput": true,
          "acceptsOutput": true,
          "options": { "values": [], "acceptsOther": false },
          "defaultValue": "",
          "alias": "Notes",
          "isList": false
        }
      ]
    }
  ],
  "settings": { "hideSectionHeaderDetails": true },
  "attributes": [{ "type": "paragraph", "children": [{ "text": "" }] }],
  "fieldConfiguration": {},
  "submitConfiguration": { "type": "DATASET", "name": "Order Intake Form" },
  "searchable": true
}
```

**Response (key fields):**

```json
{
  "id": "4a60305e-bfc7-449e-96c7-9cb8795c01f2",
  "domainId": "1659229913",
  "name": "Order Intake Form",
  "sections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fields": [
        { "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "alias": "Order_ID" },
        { "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8", "alias": "Notes" }
      ]
    }
  ],
  "fieldConfiguration": {
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8": {
      "targetMapping": { "target": "Order_ID" }
    },
    "6ba7b811-9dad-11d1-80b4-00c04fd430c8": {
      "targetMapping": { "target": "Notes" }
    }
  },
  "submitConfiguration": {
    "type": "DATASET",
    "id": "549f2e69-2e2b-4c1b-bbe2-e7ac505d83b5",
    "isDatasetOwner": true,
    "name": "Order Intake Form",
    "datasetMapping": [
      { "dataSetColumnName": "Order_ID", "dataSetColumnType": "STRING", "formFieldName": "Order_ID" },
      { "dataSetColumnName": "Notes", "dataSetColumnType": "STRING", "formFieldName": "Notes" },
      { "dataSetColumnName": "__submittedBy__", "dataSetColumnType": "STRING", "formFieldName": "__submittedBy__" },
      { "dataSetColumnName": "__submittedOn__", "dataSetColumnType": "DATETIME", "formFieldName": "__submittedOn__" }
    ]
  }
}
```

**Gotchas:**

- `submitConfiguration.id` (the backing dataset UUID) is only in the response, not the request.
- Domo always appends `__submittedBy__` and `__submittedOn__` columns to the dataset -- no way to suppress them.
- `fieldConfiguration` in the request can be `{}` -- Domo populates `targetMapping` on create.
- Field `id`s in the request are preserved in the response. Use `crypto.randomUUID()` to generate them.

### Step 2: Hydrate Form -- POST /api/forms/v2/:id/hydration

Initializes field-level configuration after creation. Called immediately after Step 1.

**Request Body:** An object mapping field IDs to empty objects:

```json
{
  "6ba7b810-9dad-11d1-80b4-00c04fd430c8": {},
  "6ba7b811-9dad-11d1-80b4-00c04fd430c8": {}
}
```

**Response:** Full form object (same schema as `GET /api/forms/v2/:id`).

**Notes:**

- The body uses the client-generated field IDs from Step 1 (not server-assigned aliases).
- For `MULTIPLE_CHOICE` / `SINGLE_CHOICE` fields with options, the hydration body may include option values.

### Step 3: Create FORM_MODAL Button Card -- POST /api/content/v1/cards?pageId={viewPageId}

After creating and hydrating the form, expose it via a `FORM_MODAL` button action on a rooster card.

**DML button widget structure:**

```json
{
  "name": "button-widget",
  "label": "Open Form",
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
      "type": "FORM_MODAL",
      "entityId": "<formId>",
      "formInstanceId": "<formId>",
      "formMapping": {
        "defaultValue": {
          "<fieldId1>": { "type": "static" },
          "<fieldId2>": { "type": "static" }
        },
        "output": {
          "<fieldId1>": { "type": "none" },
          "<fieldId2>": { "type": "none" }
        }
      }
    },
    "___dmlEditorID___": "root/groups/0/widgets/0/__dmlActions",
    "___dmlEditorParent___": "root/groups/0/widgets/0"
  }
}
```

**`formMapping` structure:**

| Key | `type` options | Meaning |
|-----|---------------|---------|
| `defaultValue[fieldId].type` | `"static"` | Use a hardcoded default value |
| `defaultValue[fieldId].type` | `"column"` | Pre-fill from a dataset column |
| `defaultValue[fieldId].type` | `"variable"` | Pre-fill from an app variable |
| `output[fieldId].type` | `"none"` | Don't write output back to app after submission |
| `output[fieldId].type` | `"variable"` | Write submission value back to named variable |

## READ -- GET /api/forms/v2/:id

Returns the full form definition including:

- All sections and fields with resolved `fieldConfiguration.targetMapping`
- `submitConfiguration` with backing dataset ID and column mapping
- `userPermissions` array

## UPDATE -- PUT /api/forms/v2/:id/update

Full replacement of the form definition. No partial update support.

**Rules:**

- Send the complete form object with modifications applied (same schema as POST).
- After adding a new field, call `POST /api/forms/v2/:id/hydration` again with the new field ID.
- Changing a field's `alias` adds a new column to the backing dataset. The old column is orphaned -- not deleted.

**Sub-operations:**

| Operation | What to change | Follow-up |
|-----------|---------------|-----------|
| Rename form | Update `name` field | None |
| Add field | Append to `sections[0].fields` | Call hydration with new field ID |
| Update field label | Change `label` on target field | None (alias unchanged, preserves dataset column) |
| Remove field | Remove from `sections[0].fields` | None (dataset column orphaned) |

## DELETE -- DELETE /api/forms/v2/:id

Removes the form definition. The backing dataset is **not** automatically deleted.

Also remove the `FORM_MODAL` card from the page layout separately if one exists.

## Complete CREATE Example

```typescript
// Prerequisites: appId, landingViewId, layoutId from POST /api/content/v1/dataapps

const fieldId1 = crypto.randomUUID();
const fieldId2 = crypto.randomUUID();
const sectionId = crypto.randomUUID();

// 1. Create form
const formRes = await api('POST', '/api/forms/v2', {
  version: '0.0.0',
  domainType: 'APP_STUDIO_APP',
  domainId: appId,
  name: 'Order Intake Form',
  description: '',
  sections: [{
    id: sectionId,
    title: '',
    description: '',
    fields: [
      {
        id: fieldId1,
        label: 'Order ID',
        placeholder: '',
        optional: false,
        fieldType: 'SHORT_ANSWER',
        dataType: 'text',
        acceptsInput: true,
        acceptsOutput: true,
        options: { values: [], acceptsOther: false },
        defaultValue: '',
        alias: 'Order_ID',
        isList: false,
      },
      {
        id: fieldId2,
        label: 'Notes',
        placeholder: '',
        optional: true,
        fieldType: 'PARAGRAPH',
        dataType: 'text',
        acceptsInput: true,
        acceptsOutput: true,
        options: { values: [], acceptsOther: false },
        defaultValue: '',
        alias: 'Notes',
        isList: false,
      },
    ],
  }],
  settings: { hideSectionHeaderDetails: true },
  attributes: [{ type: 'paragraph', children: [{ text: '' }] }],
  fieldConfiguration: {},
  submitConfiguration: { type: 'DATASET', name: 'Order Intake Form' },
  searchable: true,
});
const formId = formRes.id;

// 2. Hydrate
await api('POST', `/api/forms/v2/${formId}/hydration`, {
  [fieldId1]: {},
  [fieldId2]: {},
});

// 3. Build FORM_MODAL button DML
const formMapping = {
  defaultValue: {
    [fieldId1]: { type: 'static' },
    [fieldId2]: { type: 'static' },
  },
  output: {
    [fieldId1]: { type: 'none' },
    [fieldId2]: { type: 'none' },
  },
};
const dml = JSON.stringify({
  params: {
    groups: [{
      widgets: [{
        name: 'button-widget',
        label: 'Open Form',
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
            type: 'FORM_MODAL',
            entityId: formId,
            formInstanceId: formId,
            formMapping,
          },
          '___dmlEditorID___': 'root/groups/0/widgets/0/__dmlActions',
          '___dmlEditorParent___': 'root/groups/0/widgets/0',
        },
      }],
    }],
  },
});

// 4. Create rooster card
const cardRes = await api(
  'POST',
  `/api/content/v1/cards?pageId=${landingViewId}`,
  {
    title: 'Order Form',
    type: 'rooster',
    metadata: { title: 'Order Form', dml, dmlXml: '' },
    subscriptions: [],
  }
);

// 5. Assign card to page
await api('PUT', '/api/content/v1/cards/bulk/pages', [
  { cardId: cardRes.id, pageId: Number(landingViewId) },
]);

// 6-7. Acquire lock, update layout, release lock
await api('PUT', `/api/content/v4/pages/layouts/${layoutId}/writelock`, {});
await api('PUT', `/api/content/v4/pages/layouts/${layoutId}`, updatedLayout);
await api('DELETE', `/api/content/v4/pages/layouts/${layoutId}/writelock`);
```

## Backing Dataset Columns

Domo auto-maps each field's `alias` to a dataset column. Column types by field type:

| `fieldType` | `dataType` | Dataset column type |
|-------------|-----------|---------------------|
| `SHORT_ANSWER` | `text` | `STRING` |
| `PARAGRAPH` | `text` | `STRING` |
| `MULTIPLE_CHOICE` | `text` | `STRING` |
| `MULTIPLE_CHOICE` | `date` | `STRING` (dates stored as strings) |
| `SINGLE_CHOICE` | `text` | `STRING` |
| `SINGLE_CHOICE` | `time` | `DATETIME` |
| `DATE_TIME` | `date` | `DATE` |
| `DURATION` | `duration` | `STRING` |
| `ATTACHMENT` | `FILE` | `STRING` (file reference) |
| `LIST_RESPONSE` | `text` | `STRING` |
| Auto-added | -- | `__submittedBy__`: `STRING`, `__submittedOn__`: `DATETIME` |
