---
name: knowledge-explorer
tier: 1
bucket: knowledge-search
description: "Search and retrieve reusable PS assets from the Compass asset catalog, and recall engagement memory. Trigger with 'find a reusable asset', 'search the asset catalog', 'register an asset', 'compose an asset plan', 'what do we know about this customer', 'recall previous engagement notes', 'remember this for later', or any request to discover or store engagement knowledge."
maturity: alpha
---

# Knowledge Explorer — Assets and Engagement Memory

Search the Compass asset catalog for reusable technical components and recall engagement memory across sessions. Use this skill when the task involves finding existing PS deliverables to reuse, registering new assets, or retrieving previously stored engagement context.

## Scope

- **Compass Asset Catalog**: register, retrieve, and compose reusable technical assets
- **Compass Memory**: store and recall stakeholder details, decisions, engagement history, and artifacts

## MCP Tools

### Compass Asset Catalog (`compass-asset-catalog`)

| Tool | Purpose |
|------|---------|
| `asset_register` | Register a new reusable asset in the catalog |
| `asset_get` | Retrieve an asset by ID or name |
| `asset_compose` | Compose an asset reuse plan from the catalog |

### Compass Memory (`compass-memory`)

| Tool | Purpose |
|------|---------|
| `memory_remember` | Store information for future sessions |
| `memory_recall` | Retrieve previously stored engagement context |
| `memory_bundle` | Bundle multiple memory entries for an engagement |

## Workflow: Find and Reuse an Existing Asset

1. **Search** — call `asset_get` with a name or keyword to find relevant assets
2. **Compose** — call `asset_compose` to generate a reuse plan: which assets apply, how to adapt them, estimated time savings
3. **Present** — surface the asset details and compose plan to the user; let them confirm which to reuse
4. **Register** (if new) — call `asset_register` with the new asset details after the engagement is complete

## Workflow: Recall Engagement Context

1. **Recall** — call `memory_recall` with the customer/engagement identifier
2. **Surface** — present the retrieved context (stakeholder details, past decisions, key artifacts)
3. **Remember new info** — call `memory_remember` at the end of the session to persist new decisions or artifacts

## Guardrails

- `asset_register` persists data to the shared catalog — confirm the asset is genuinely reusable before registering
- `memory_remember` is scoped to the authenticated user's engagement — it does not share data across accounts unless explicitly bundled
- When `memory_recall` returns nothing, tell the user explicitly rather than fabricating context
- Do not store PII or customer credentials via `memory_remember`

## Related Skills

- `compass-core/account-360` — engagement briefing using memory + other data sources
- `compass-core/engagement-forecast` — forecast using catalog and engagement patterns
- `domo-search` toolkit — keyword search across Domo instance entities
