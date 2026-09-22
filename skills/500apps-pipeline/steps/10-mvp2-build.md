# Stage J1 — MVP2 build (fully functional on Domo)

**Maps to pipeline stage:** J1 — the post-discovery build. MVP2 replaces seed data and mocks with real Domo platform features: datasets, AppDB, Domo AI, and optionally Code Engine / Workflows.

## Inputs

- **Updated** `spec/BUILD-SPEC.md` (from stage I) — must include dataset schemas, AppDB collections, Domo AI integration plan, and any Code Engine / Workflow specs.
- **Updated** `objective/NORTHSTAR.md`, `spec/SURFACE-PLAN.md`, `spec/SAMPLE-DATA-PLAN.md` — all refreshed with discovery context.
- `documents/DISCOVERY-NOTES.md` — reference for persona details, data descriptions, and customer priorities.
- `artifacts/deploy-result.json` from G1/G2 — existing page, card, and design IDs to update (not recreate).
- Target: **internal** instance **`domo-ps-repo.domo.com`** (or as specified in pipeline brief).

## Outputs

1. **Real Domo datasets** created on the internal instance — sample data matching customer-described schemas.
2. **AppDB collections** created for any interactive state.
3. **MVP2 app** — deployed, powered by real datasets and AppDB instead of seed JS data.
4. **Domo AI integrations** — text generation calls wired into the app for agentic features.
5. **Code Engine functions** (if required) — deployed serverless functions.
6. **Workflows** (if required) — deployed automation flows.
7. `artifacts/MVP2-NOTES.md` — comprehensive notes on what was built, all Domo resource IDs.
8. `artifacts/deploy-result.json` — updated with MVP2 deployment data.

## Instructions

**Global output rules (see SKILL.md):**
- **No emojis** anywhere — use icon libraries.
- **No stage codes** in human-visible text.

### Pre-build: re-verify against updated BUILD-SPEC targets

Discovery may have changed the hero metric, personas, surface priorities, or the 5-to-9 lift table. Before building:
1. **Read the updated BUILD-SPEC** (from stage I) — check the lift table, viewport blueprints, and happy-path target. Build to the updated spec.
2. **Read `spec/BRAND-KIT.md`** — verify tokens still match (discovery may have revealed the customer's actual brand assets). Update if needed.
3. **Read `modules/api-wiring-patterns.md`** — follow the canonical wiring patterns for datasets, AppDB, AI, and Code Engine. Specifically: UPS pattern for full-stack, manulife pattern for queryWithSql, durhamlane pattern for mock-to-real migration.
4. **Check the risk checklist** in `api-wiring-patterns.md` §3 before proceeding — CSP, PDP scoping, manifest declarations, placeholder IDs.

### Post-build: verification gates (same as G1, updated for real data)

After deploying MVP2, verify:
- **Viewport blueprint** from updated BUILD-SPEC — hero metric and primary CTA visible at 1440x900 for each surface
- **Happy-path with real Domo features** — the timed happy-path now involves real dataset reads, AppDB writes, and AI calls. Verify end-to-end. Document click count.
- **5-to-9 progress** — in `artifacts/MVP2-NOTES.md`, note per surface where the build lands relative to the updated lift table targets

### 1. Create real Domo datasets

Read `spec/SAMPLE-DATA-PLAN.md` (updated in stage I) for dataset specifications.

**For each dataset specified:**
1. Use `domo-datasets` MCP tools to create the dataset with the correct schema (columns, types).
2. Populate with **highly representative sample data** — 20-50 rows per entity with a believable story. If the customer described their data (schemas, column names, systems), match those descriptions closely. The sample data should demonstrate the app's value when viewed.
3. Record all dataset IDs in `artifacts/MVP2-NOTES.md`.

**Important:** We are NOT connecting to the customer's instance. All datasets are created on the internal instance with sample data that mirrors what the customer described. The goal is to show "this is what it would look like with your real data."

### 2. Create AppDB collections

Read `spec/BUILD-SPEC.md` for AppDB requirements. Follow `appdb-manager` skill patterns.

**For each collection needed:**
1. Use `domo-appdb` MCP tools to create collections.
2. Set up schema/structure per the build spec.
3. Pre-populate with any default data (settings, initial state).
4. Wire into the app's manifest.json via `collections` field.

**Common AppDB use cases in MVP2:**
- User actions (approve, reject, flag, annotate)
- Saved filters or views
- AI-generated summaries and insights (cached)
- User preferences or settings
- Notes or comments on data items

### 3. Integrate Domo AI

Read `spec/BUILD-SPEC.md` for AI integration points. Domo AI text generation is a **platform API** that the app calls via the Domo SDK — the agent writes app code that makes these calls. There is no separate MCP tool to invoke; the agent builds the integration directly into the ProCode app source.

**The API endpoint:** `POST /api/ai/v1/text/generation`

**How it works in the app code:**
```javascript
async function generateAISummary(promptText, dataContext) {
  const response = await domo.post('/api/ai/v1/text/generation', {
    input: promptText + '\n\nData:\n' + JSON.stringify(dataContext),
    model: 'default'
  });
  return response;
}
```

The `domo.post()` call goes through the Domo SDK (ryuu.js), which handles auth and routing. The app must have ryuu.js loaded (per `procode-app-builder` patterns).

For each AI integration point:

1. **Identify the persona need** — what question does this AI call answer for the user?
2. **Write the app code** — use `domo.post('/api/ai/v1/text/generation', {...})` with a prompt that includes relevant data context from the datasets. The prompt should be specific to the use case (summary, flagging, recommendations).
3. **Cache responses in AppDB** — AI calls should not re-execute on every page load. Store responses in an AppDB collection with a timestamp; refresh on user action or time-based expiry.
4. **Surface in the UI** — display AI responses in a way that serves the persona:
   - **Executive persona**: brief summary card at the top, 3-5 bullet highlights
   - **Analyst persona**: inline insights next to data tables, drill-down explanations
   - **Ops persona**: action items, flagged priorities, next-step recommendations

**Domo AI patterns for agentic apps:**
- **Daily brief**: Summarize the current state of the data in 3-5 sentences. What's changed? What needs attention?
- **Priority flagging**: Analyze the dataset and surface the top 3-5 items that need action, with reasoning.
- **Inline insights**: For a selected data item, provide context, history, and recommendations.
- **Search / Q&A**: Allow natural language questions about the data, answered by AI.

### 4. Build Code Engine functions (if required)

Read `spec/BUILD-SPEC.md` for Code Engine requirements. Follow `code-engine-builder` skill.

**When to build Code Engine:**
- Server-side processing that shouldn't run in the browser
- Scheduled data transforms or summaries
- Webhook handlers for external integrations
- Complex calculations that need to run periodically
- Email or notification triggers

**Keep it light** — this is MVP2 on the internal instance. Build the minimum viable function, not a production-grade backend. Record the package ID and function details in `artifacts/MVP2-NOTES.md`.

### 5. Build Workflows (if required)

If the customer described processes involving notifications, approvals, or downstream actions:

1. Build a light Domo Workflow: trigger -> action -> notification
2. Keep scope minimal — demonstrate the pattern, don't build the full production workflow
3. Record workflow details in `artifacts/MVP2-NOTES.md`

### 6. Update the app code

Now rebuild the app to use real Domo features instead of seed data:

1. **Replace seed data loading** — remove `window.SEED_DATA` / `seeds.js` dependencies. Wire the app to read from Domo datasets via the SDK (`domo.get('/data/v1/...')`).
2. **Wire AppDB** — replace any in-memory state management with AppDB reads/writes via `domo.get('/domo/datastores/v1/collections/...')`.
3. **Wire Domo AI** — add AI call handlers using `domo.post('/api/ai/v1/text/generation', {...})` and cache results in AppDB.
4. **Update manifest.json** — add all dataset mappings in `mapping`, all AppDB collections in `collections`.
5. **Keep the design** — MVP2 should look like an improved version of MVP1/G2, not a completely different app. Preserve the visual design, navigation, and interaction patterns. The difference is that data is real, interactions persist, and AI is live.

### 7. Deploy and verify

Follow the same deploy pattern as G1 (`steps/05-mvp-build-v1.md`) but:
- **Reuse the existing page and design** from G1/G2 — do not create duplicates.
- **Publish as a new version** of the existing design (bump version in manifest.json).
- Verify datasets are accessible from the app.
- Verify AppDB collections are readable/writable.
- Verify AI calls return responses (even if sample data produces generic insights).

### 8. Write `artifacts/MVP2-NOTES.md`

Document everything that was built:

```markdown
# MVP2 Build Notes

## Domo Resources Created

### Datasets
| Name | Dataset ID | Rows | Purpose |
|------|-----------|------|---------|
| ... | ... | ... | ... |

### AppDB Collections
| Collection | Documents | Purpose |
|-----------|-----------|---------|
| ... | ... | ... |

### Domo AI Integrations
| Feature | Endpoint | Persona | Purpose |
|---------|----------|---------|---------|
| ... | ... | ... | ... |

### Code Engine (if any)
| Package | Function | Trigger | Purpose |
|---------|----------|---------|---------|
| ... | ... | ... | ... |

### Workflows (if any)
| Workflow | Trigger | Action | Purpose |
|---------|---------|--------|---------|
| ... | ... | ... | ... |

## What Changed from MVP1
- Data source: seed JS -> real Domo datasets
- Interactions: in-memory -> AppDB
- AI: none/mock -> Domo AI text generation
- [other changes]

## Known Limitations
- [things that need real customer data to work properly]
- [AI responses that are generic due to sample data]
- [features deferred to human review phase]
```

### 9. Update `artifacts/deploy-result.json`

Update with MVP2-specific data. Add `datasets`, `appdb_collections`, `ai_integrations` fields alongside the existing structure.

## Pre-checkpoint verification

| # | Check | If it fails |
|---|-------|-------------|
| 1 | Datasets created and populated on internal instance | App has no real data |
| 2 | AppDB collections created (if specified in spec) | Interactions won't persist |
| 3 | App loads data from Domo datasets (not seeds) | Still running on mock data |
| 4 | Domo AI calls work and return responses | Agentic features broken |
| 5 | AI responses cached in AppDB | Re-calling AI on every load |
| 6 | manifest.json has correct mapping + collections | Data wiring broken |
| 7 | Page and design reused from G1/G2 (no duplicates) | Cluttered instance |
| 8 | MVP2-NOTES.md lists all Domo resource IDs | No traceability |
| 9 | deploy-result.json updated | ArmOS can't link to MVP2 |
| 10 | No emojis in code or artifacts | Skill violation |

## Checkpoint

```
@500apps-pipeline checkpoint=stage-j1 status=complete
```
