---
name: form-builder
tier: 1
description: "Build App Studio forms with backing datasets. Creates form definition, hydrates fields, wires FORM_MODAL button to rooster card, and assigns to app page. Trigger with 'add a form to the app', 'create an intake form', 'build a submission form', or when build-appstudio needs a form component."
maturity: alpha
audience: [delivery]
pipeline:
  phase: build
  sub_phase: app-studio
  position: 7b
  output_type: component
  wave: 2
  state: ready
---

# Form Builder — App Studio Forms

Creates App Studio forms using the Forms v2 API. A form is a structured data-collection component that auto-creates a backing Domo dataset for submissions and is surfaced via a FORM_MODAL button on a rooster card.

## Shared Knowledge

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `../build-appstudio/reference/appstudio-forms-reference.md` | Full Forms API: field types, request/response schemas, action chain, TypeScript examples | Before building any form |
| `../build-appstudio/reference/appstudio-api-reference.md` | App lifecycle, write-lock protocol, layout API | For page assignment steps |
| `../build-appstudio/reference/rooster-dml-templates.md` | DML structure, double-encoding, card creation | For FORM_MODAL button card |

## Triggers

- "add a form to the app"
- "create an intake form"
- "build a submission form"
- "create a data entry form"
- Invoked by `build-appstudio` when a form component is needed

---

## Prerequisites

| Prerequisite | Source | Required |
|-------------|--------|----------|
| App Studio app exists | `appstudio_create` output | Yes — need `dataAppId` |
| Page/view exists | App creation or `appstudio_create` response | Yes — need `viewPageId`, `layoutId` |
| Form field requirements | User or engagement context | Yes — what fields, types, validation |

---

## Execution Flow

### Step 1: Design the Form

Gather requirements from the user:

1. **Form name** — what is this form called?
2. **Fields** — for each field, determine:
   - Label (question text shown to user)
   - Field type (see Field Type Reference below)
   - Required vs optional
   - Options (for MULTIPLE_CHOICE / SINGLE_CHOICE)
   - Default value (if any)
3. **Sections** — group fields logically (most forms need just one section)

Present the design to the user for approval before proceeding:

```
## Form Design: [Form Name]

| # | Label | Type | Required | Options |
|---|-------|------|----------|---------|
| 1 | Order ID | SHORT_ANSWER | Yes | — |
| 2 | Priority | SINGLE_CHOICE | Yes | Low, Medium, High, Critical |
| 3 | Notes | PARAGRAPH | No | — |
| 4 | Due Date | DATE_TIME | No | — |
```

**Wait for user confirmation before proceeding to Step 2.**

---

### Step 2: Create the Form

**Tool:** `appstudio_form_create` (maps to `POST /api/forms/v2`)

Build the form payload following the schema in `appstudio-forms-reference.md`:

- Generate client-side UUIDs for section ID and each field ID
- Set `domainType: "APP_STUDIO_APP"` and `domainId` to the app's `dataAppId` (as a string)
- Set `submitConfiguration: { type: "DATASET", name: "<form name>" }`
- For each field, set the correct `fieldType`, `dataType`, `acceptsInput`, `acceptsOutput`, `isList`, and `alias`
- Pass `fieldConfiguration: {}` — Domo populates targetMapping on create

**Alias rules:**
- Must be unique within the form
- Becomes the backing dataset column name
- Use `snake_Case` with no spaces (e.g., `Order_ID`, `Due_Date`)

**Save the response** — you need `formId` (UUID) for the button card.

---

### Step 3: Hydrate the Form

**Tool:** Call `POST /api/forms/v2/:id/hydration` immediately after creation.

Body: map each field ID to an empty object `{}`:

```json
{
  "<fieldId1>": {},
  "<fieldId2>": {}
}
```

This initializes field-level configuration. Skip this step and the form may not render correctly.

---

### Step 4: Create FORM_MODAL Button Card

**Tool:** `rooster_card_create`

Create a rooster card with a `FORM_MODAL` button action in the DML:

1. Build the `formMapping` object — for each field:
   - `defaultValue[fieldId].type`: `"static"` (hardcoded), `"column"` (from dataset), or `"variable"` (from app variable)
   - `output[fieldId].type`: `"none"` (don't write back) or `"variable"` (write to app variable)

2. Build the DML with a `button-widget` containing `__dmlActions.on-press-button` with:
   - `type: "FORM_MODAL"`
   - `entityId: "<formId>"`
   - `formInstanceId: "<formId>"`
   - `formMapping: { defaultValue: {...}, output: {...} }`

3. Create the card:
```
rooster_card_create(
  title: "<form name>",
  dml: "<JSON-stringified DML with FORM_MODAL button>"
)
```

See `appstudio-forms-reference.md` Step 3 for the exact DML JSON structure.

---

### Step 5: Assign Card to Page

**Tool:** Bulk page assignment

```
PUT /api/content/v1/cards/bulk/pages
```

Assign the new card to the app's view page.

---

### Step 6: Update Layout

**Tool:** `appstudio_layout`

1. Acquire write lock on the layout
2. Update the layout to include the form card at the desired position
3. Release the write lock

If build-appstudio is orchestrating, it handles layout positioning for all cards together. If form-builder is invoked standalone, position the card using `appstudio_layout`:

```
appstudio_layout(
  view_page_id: <viewPageId>,
  positions: [
    { card_id: <formCardId>, x: 0, y: 0, width: 30, height: 20 }
  ]
)
```

---

### Step 7: Verify

1. Confirm the form card appears on the page
2. Report the result:

```
## Form Created

**Form:** [Form Name] (ID: [formId])
**Backing Dataset:** [datasetId] (auto-created)
**Card:** [cardId] on page [viewPageId]
**Fields:** [N] fields across [M] sections

| # | Label | Type | Alias (Column) | Required |
|---|-------|------|----------------|----------|
| 1 | Order ID | SHORT_ANSWER | Order_ID | Yes |
| 2 | ... | ... | ... | ... |
```

---

## Field Type Reference

| `fieldType` | `dataType` | `isList` | `acceptsInput` | Notes |
|-------------|-----------|----------|----------------|-------|
| `SHORT_ANSWER` | `text` | `false` | `true` | Single-line text |
| `PARAGRAPH` | `text` | `false` | `true` | Multi-line text area |
| `MULTIPLE_CHOICE` | `text` | `true` | `true` | Checkbox group (or multi-select dropdown with `displayAsDropdown: true`) |
| `SINGLE_CHOICE` | `text` | `false` | `true` | Radio buttons (or single-select dropdown with `displayAsDropdown: true`) |
| `DATE_TIME` | `date` | `false` | `false` | Date/time picker |
| `DURATION` | `duration` | `false` | `false` | Duration input |
| `ATTACHMENT` | `FILE` | `false` | `false` | File upload; requires fileSetId |
| `TITLE_DESCRIPTION` | `text` | `false` | `false` | Read-only header/label (`acceptsOutput: false`, `readOnly: true`) |
| `LIST_RESPONSE` | `text` | `true` | `false` | Multi-value free-text list |

**Rules:**
- `TITLE_DESCRIPTION`: set `acceptsInput: false`, `acceptsOutput: false`, `readOnly: true`
- `DATE_TIME`, `DURATION`, `LIST_RESPONSE`, `ATTACHMENT`: set `acceptsInput: false`
- `MULTIPLE_CHOICE` / `SINGLE_CHOICE`: populate `options.values` with allowed choices
- `ATTACHMENT`: `dataType` must be `"FILE"`

---

## Tool Mapping

| Step | Tool | MCP Server |
|------|------|------------|
| Create form | `appstudio_form_create` | domo-pages |
| Hydrate form | (direct API) `POST /api/forms/v2/:id/hydration` | domo-pages |
| Create button card | `rooster_card_create` | domo-pages |
| Assign to page | `PUT /api/content/v1/cards/bulk/pages` | domo-pages |
| Position layout | `appstudio_layout` | domo-pages |

---

## Gotchas

- **Backing dataset is auto-created.** The `POST /api/forms/v2` response includes `submitConfiguration.id` — this is the UUID of the auto-created dataset. Don't create one manually.
- **`__submittedBy__` and `__submittedOn__` columns are auto-added.** Every form dataset gets these two columns automatically. No way to suppress them.
- **`fieldConfiguration` can be `{}` on create.** Domo populates `targetMapping` in the response. Don't try to pre-fill it.
- **Alias must be unique.** Duplicate aliases cause silent column collision in the backing dataset.
- **Changing an alias orphans the old column.** The old column remains in the dataset; a new one is created. Plan aliases carefully upfront.
- **Hydration is mandatory.** Skipping `POST /api/forms/v2/:id/hydration` may cause the form to not render correctly in the app.
- **Field IDs are client-generated.** Use `crypto.randomUUID()`. The server preserves your IDs in the response.
- **Full replacement on update.** `PUT /api/forms/v2/:id/update` replaces the entire form definition — no partial updates.

---

## Guardrails

- **Confirm design before creating.** Always present the form design (Step 1) and wait for user approval.
- **Validate field types against the reference.** Only use the 11 documented field types — others may exist but are not verified.
- **Don't delete the backing dataset.** `DELETE /api/forms/v2/:id` removes the form definition but NOT the backing dataset. Warn the user if they want to clean up both.
- **Test form submission.** After creation, recommend the user open the app and submit a test entry to verify all fields work.

---

## MCP Servers Required

- **domo-pages** — form creation, card creation, layout operations

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what form they want to build. If unclear, **STOP and ask**.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"app"`
- `target_description`: a concise phrase describing the form being built

**Step 3 — Human review of memory hits.** Present returned context. Ask the user to confirm relevance.

**Step 4 — Plan with confirmed context.** Use only confirmed items as inputs.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: form name, form ID, backing dataset ID, field count and types, which app/page it's attached to.

---

## Related Skills

- **Build App Studio** (Build) — the parent skill that invokes form-builder when a form component is needed
- **Workflow Builder** (Build) — often paired with forms (form submission triggers workflow)
- **Card Builder** (Build) — for KPI card creation (different from form cards)
- **Dashboard Builder** (Build) — orchestrator that may route through build-appstudio to form-builder
