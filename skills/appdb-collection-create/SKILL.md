---
name: appdb-collection-create
tier: 0
description: "Create Domo AppDB collections via CLI-first workflows — provisions datastores, creates collections, captures identifiers for manifest wiring. Trigger with 'create AppDB collection', 'appdb collection create', 'new AppDB storage', 'provision AppDB datastore'."
maturity: alpha
audience: [code]
---

# AppDB Collection Create (CLI)

Use this skill when the app needs new AppDB storage and the CLI path can create both datastore and collection in one operation.

## Intent

This skill covers storage initialization lifecycle:

- create required datastore
- create collection inside that datastore
- capture resulting identifiers
- prepare follow-up manifest mapping and document-write usage

For document CRUD operations after collection exists, use `~/.agents/skills/appdb/SKILL.md`.

## Assumed CLI Behavior

Assume `community-domo-cli` includes:

- `appdb collection-create`

and that this operation handles datastore provisioning automatically when needed.

## Primary Execution Path

Prefer CLI:

```bash
community-domo-cli --instance <instance> appdb collection-create --body-file collection.json
```

If CLI support is unavailable in a given environment, fall back to direct endpoint workflows:

- `POST /api/datastores/v1` (create datastore)
- `POST /api/datastores/v1/{datastoreId}/collections` (create collection)

## Required Input Contract

Use a body that includes at least:

- collection `name`
- collection `schema.columns`
- optional `syncEnabled`

Example:

```json
{
  "name": "TasksCollection",
  "schema": {
    "columns": [
      { "name": "title", "type": "STRING" },
      { "name": "status", "type": "STRING" }
    ]
  },
  "syncEnabled": true
}
```

## Output Requirements

Return or persist:

- `datastoreId`
- `collectionId`
- `collectionName`

so downstream skills can:

- wire manifest mappings
- create documents in the new collection

## Manifest Follow-up

After successful creation, ensure app manifest contains collection wiring expected by the app project conventions in this repo.

## Checklist

- [ ] App requires new AppDB storage (not existing collection reuse)
- [ ] CLI collection-create path used first
- [ ] Datastore+collection identifiers captured
- [ ] Manifest collection mapping follow-up performed
- [ ] Hand-off to document CRUD flow (`~/.agents/skills/appdb/SKILL.md`) is clear

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection.
