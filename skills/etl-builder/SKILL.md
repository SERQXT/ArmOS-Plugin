---
name: etl-builder
tier: 2
agent:
  name: "ETL Builder Agent"
  roles: ["Data Engineer", "Solutions Consultant"]
  target_roi: "Programmatically create Magic ETL dataflows in Domo — no manual drag-and-drop"
description: "Build Magic ETL dataflows in Domo programmatically. Trigger with 'build an ETL for [dataset]', 'create a dataflow that [does X]', 'ETL to join [A] and [B]', 'aggregate [dataset] by [dimension]', or any request to create, modify, or design a Domo Magic ETL pipeline."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by upstream `dataflow-build-and-edit` (v2 product-team). Use dataflow-build-and-edit for building or editing Magic ETL dataflows from scratch."
audience: [orchestration, delivery]
---

# ETL Builder Agent

Creates Magic ETL dataflows in Domo through the API. Takes a natural-language description of the desired data transformation, discovers the source datasets, profiles the data, designs the ETL pipeline, builds the JSON, creates it in Domo, and executes it.

## Triggers

- "build an ETL for [dataset]"
- "create a dataflow that [description]"
- "ETL to join [A] and [B]"
- "aggregate [dataset] by [dimension]"
- "create a Magic ETL that filters [dataset] where..."
- "build a pipeline to [transform description]"

---

## ETL Planning Principles

**Before designing any multi-source or multi-step ETL, read `reference/etl-planning-principles.md`.** It covers input affinity consolidation, Bronze/Silver/Gold layering, right-sizing, when to ask the user, and multi-output branching.

If the user provides a spec from the **ETL Spec Designer**, it will already include layer assignments — follow them.

---

## Tile Selection: Native First

**Always use native Magic ETL tiles. Only fall back to a SQL tile when the logic is impossible or unreasonably complex with native tiles — this is rare.**

The goal is user-friendly ETLs that are easy to read, audit, and modify in the Domo UI. Native tiles have clear labels, visible configuration, and are self-documenting on the canvas. SQL tiles are opaque black boxes to non-technical users.

### Decision Hierarchy

1. **Native tile exists for the operation** → use it. This covers 95%+ of transforms.
2. **`ExpressionEvaluator` (Formula) can handle it** → use it. Formula tiles support rich SQL-like expressions (CASE WHEN, date math, string functions, nested logic) and are readable on the canvas. Fair game for any calculated column.
3. **Multiple native tiles can compose the logic** → use a chain of native tiles. A Filter → GroupBy → Formula chain is more readable than one SQL tile doing all three.
4. **SQL tile as last resort** → only when the logic genuinely requires SQL (correlated subqueries, complex CTEs, recursive patterns, QUALIFY, or multi-statement procedural logic).

### Common Operations — Native Tile Mapping

| Operation | Native Tile | NOT SQL |
|-----------|------------|---------|
| Filter rows | `Filter` | |
| Join datasets | `MergeJoin` | |
| Aggregate / GROUP BY | `GroupBy` | |
| Calculated column | `ExpressionEvaluator` | |
| CASE WHEN logic | `ExpressionEvaluator` (supports CASE expressions) | |
| Rename / drop columns | `SelectValues` | |
| Type casting | `Metadata` | |
| Sort | `Order` | |
| Dedup | `Unique` | |
| Append / UNION | `UnionAll` | |
| Rank / ROW_NUMBER | `WindowAction` | |
| Pivot | `Denormaliser` | |
| Unpivot | `Normalizer` / `NormalizeAll` | |
| Find & replace | `ReplaceString` | |
| Value mapping (lookup) | `ValueMapper` | |
| Date operations | `DateCalculator` or `ExpressionEvaluator` | |
| String operations | `StringCalculator` or `ExpressionEvaluator` | |
| Add constant column | `Constant` | |
| Limit rows | `Limit` | |
| Conditional routing | `SplitFilter` | |
| Combine columns (concat) | `ConcatFields` or `ExpressionEvaluator` | |
| Split column by delimiter | `SplitColumnAction` | |
| JSON parsing | `JsonExpandAction` | |
| Anti-join (rows NOT in B) | `SplitJoin` (`rightAntiTable`) | |

### When SQL Is Acceptable

- Correlated subqueries or complex CTEs that would require 5+ chained native tiles
- QUALIFY / advanced window frames not supported by `WindowAction`
- Recursive queries
- Multi-statement procedural logic
- The user explicitly requests SQL

When you do use a SQL tile, **name it descriptively** (e.g., "Complex Attribution Logic — SQL") and add a comment in the `statements[]` explaining why native tiles weren't used.

---

## Execution Flow

### Step 1: Understand Requirements

Parse the user's request to identify:
- **Input datasets** — which Domo datasets to read from
- **Desired transformation** — filter, join, aggregate, formula, etc.
- **Output(s)** — what the result dataset(s) should look like (columns, names) — there may be multiple
- **Any constraints** — scheduling, naming conventions, specific business rules
- **Layering context** — how many source systems, how complex the logic, whether the user has a layering preference

If the request involves 3+ source systems or complex multi-step logic, ask the user:
- "This looks like it could benefit from a layered approach (staging → enrichment → model). Would you like me to design it that way, or keep it in a single ETL?"

### Step 2: Discover Datasets

**If the ETL spec (from ETL Spec Designer) already contains dataset IDs, use them directly — skip name-based searching.**

- When the spec includes dataset IDs (e.g., `5b1882e7-137c-4690-b83f-7959ba86d1eb`), use `dataset_get(dataset_id)` directly — do NOT search by name with `dataset_list`.
- Only use `dataset_list(query=...)` when the spec doesn't include dataset IDs.

```
dataset_get(dataset_id)            → use when ID is known (preferred)
dataset_list(query="keyword")      → search by name (only when ID is unknown)
dataflow_search(name_filter="...")  → check for existing ETLs
```

### Step 3: Profile Inputs

**If the ETL spec already contains dataset schemas and profiling data, use that directly — do NOT re-profile datasets that are already documented in the spec.** The spec is the source of truth.

Only profile datasets that are NOT already documented:

```
dataset_profile(dataset_id)  → column types, stats, distinct counts, top values, classifications
```

**Store all dataset metadata (IDs, schemas, row counts) gathered during profiling. Reuse in all subsequent steps — never re-call `dataset_schema` or `dataset_list` for data you already have.**

Use the profile to:
- Identify join keys (matching column names/types across datasets)
- Determine appropriate aggregation columns (numeric vs categorical)
- Validate that referenced columns actually exist
- Detect data quality issues (high null rates, unexpected types)
- **Group datasets by input affinity** — note which transforms share the same sources

### Step 3b: Discover ExpressionEvaluator Functions (if using formulas)

If the ETL design will use `ExpressionEvaluator` tiles with non-trivial expressions (date math, string functions, CASE WHEN with complex conditions), fetch the expression docs before designing the formulas:

```
dataflow_expression_docs()  → returns full expression function catalog
```

This is the same endpoint the Domo UI calls when rendering the formula editor. It returns the authoritative list of supported functions, their signatures, and examples. Use it to verify that the function you intend to use exists and confirm its exact syntax.

**When to skip:** Simple arithmetic, direct column references, basic CASE WHEN — these don't require verification.

### Step 4: Design the ETL Spec

Before building JSON, present a clear design to the user. For multi-output ETLs, show all branches:

```
ETL: "CRM Pipeline — Bronze"
Layer: L1 (Bronze / Staging)
Inputs: Salesforce Contacts (abc-123), Salesforce Opportunities (def-456)

Pipeline:
  1. Input → Salesforce Contacts
  2. Input → Salesforce Opportunities
  3. Dedup Contacts → on Email (keep latest)
  4. Cast Types → Amount to DOUBLE, CloseDate to DATE
  5. Normalize Names → trim whitespace, title-case Name fields

  Branch A → Output: "Contacts — Cleaned" (columns: ContactID, Name, Email, Account)
  Branch B → Output: "Opportunities — Cleaned" (columns: OppID, Amount, Stage, CloseDate, AccountID)
```

For single-output ETLs, the existing flat format is fine:

```
ETL: "Team Stats Summary"
Input: Fantasy Football Stats (dataset abc-123)

Pipeline:
  1. Input DataSet → read Fantasy Football Stats
  2. Filter Rows → Status = 'Active'
  3. Group By → group by Team, SUM(Points), AVG(Points), COUNT(Player)
  4. Sort → by Total_Points DESC
  5. Output DataSet → "Team Stats Summary" (new dataset)

Output columns: Team, Total_Points, Avg_Points, Player_Count
```

**Wait for user confirmation before proceeding to Step 5.**

### Step 5: Build the Dataflow JSON

Construct the full dataflow JSON following these rules:

1. **Unique action IDs** — use descriptive slugs (`input-stats`, `filter-active`, `group-by-team`)
2. **Valid DAG** — every `dependsOn` references an existing action ID, no cycles
3. **GUI positions (CRITICAL — do not skip)** — The ETL canvas must be readable in the Domo UI. Place tiles in a left-to-right flow with vertical separation:
   - **Inputs**: x=128, spread vertically (y=128, y=288, y=448, ...)
   - **Processing tiles**: increment x by ~160-192 per step
   - **Parallel branches**: use different y values so each branch is visually distinct
   - **Joins**: place at the x where both inputs are ready
   - **Outputs**: rightmost position
   - **NEVER place all tiles at the same y value** — this creates an unreadable single row. See `reference/etl-examples.md` "GUI Layout Conventions" for visual diagrams.
4. **Unique targetTableNames** — each output action must have a distinct `targetTableName`
5. **Type is MAGIC** — `databaseType` must be `"MAGIC"` (NOT `"REDSHIFT"` — REDSHIFT creates but always fails execution)
6. **Properties are flat** — all action properties go directly on the action object, NOT nested in a `variables` object
7. **Verify after create** — always call `dataflow_get` after creation to confirm actions persisted correctly (the API silently drops malformed properties)
8. **inputs/outputs arrays** — must match the dataSourceIds used in input/output actions
9. **Multiple outputs** — use multiple `PublishToVault` actions for multi-output ETLs. Each gets a unique action ID, its own `dataSource` with a distinct `name`, and connects to whatever upstream branch it serves. Include all outputs in the top-level `outputs[]` array.

Reference: `reference/etl-tiles.md` for tile types and JSON schemas, `reference/etl-examples.md` for complete patterns (including multi-output), `reference/lessons-learned.md` for gotchas and failure modes.

### Step 6: Create in Domo

```
dataflow_create(dataflow={...})  → creates the ETL, returns the dataflow ID
```

**Save the ETL JSON to the working folder first** (e.g., `code/etl-name.json`) so it can be resubmitted without rebuilding if the API has issues.

**Error recovery:**

- **400 Bad Request** — payload problem. Check action types, property names, missing fields. See lessons-learned.md.
- **403 Forbidden** — missing `databaseType`, invalid action types, or token lacks admin scope. Check payload first, then permissions.
- **500 Internal Server Error** — likely transient server-side issue, NOT a payload problem. The tool retries automatically (2s, 4s backoff). If it still fails:
  1. Try scaffold mode with the same inputs as a diagnostic — if that also returns 500, it's server-side.
  2. **Stop retrying. Do NOT simplify the payload or redesign the ETL.** The payload is fine.
  3. Tell the user: "Domo API is returning 500 on write operations. This is a server-side issue. Wait 15-30 minutes and retry with the saved JSON."
  4. Move on to other work (design next ETL, document, etc.) and come back to deploy later.

See `reference/lessons-learned.md` lesson #24 for full details.

### Step 7: Execute & Verify

**Always use `wait=true`** — it polls internally and returns the final status in a single call. This eliminates manual polling loops.

```
dataflow_execute(dataflow_id, wait=true, timeout_seconds=300)  → execute and wait for completion
```

Do NOT manually poll with `dataflow_status` or `dataflow_executions` in a loop — `wait=true` handles this internally.

Report the result:
- Execution status (success/failure)
- Rows processed
- Output dataset ID and link: `https://{instance}.domo.com/datacenter/dataflows/{id}/details`

---

## Common Tile Quick Reference

**CRITICAL:** `databaseType` must be `"MAGIC"`. Action `type` is a plain string. Properties are flat on the action, not in `variables`.

| Tile | Type String | Key Properties |
|------|-------------|----------------|
| Input | `LoadFromVault` | `dataSourceId` |
| Output | `PublishToVault` | `dataSource.guid`, `inputs[]`, `versionChainType` |
| Filter | `Filter` | `filterList[]` (expression-based, SQL syntax) |
| Group By | `GroupBy` | `groups[]` (name), `fields[]` (name, expression) |
| Join | `MergeJoin` | `joinType`, `step1`, `step2`, `keys1[]`, `keys2[]` |
| Formula | `ExpressionEvaluator` | `expressions[]` (expression, fieldName) |
| Select | `SelectValues` | `fields[]` (name, rename, remove) |
| Append | `UnionAll` | `inputs[]`, `unionType`, `schemaSource` |

See `reference/etl-tiles.md` for the full tile catalog and action JSON examples. For complete JSON payload schemas with every field documented for all 42+ tile types, see `reference/etl-tile-payloads.md`. Inspect real dataflows with `dataflow_get` to discover additional tile types.

---

## Tool Mapping

| Step | Tools |
|------|-------|
| Discover datasets | `dataset_list`, `dataset_get`, `dataflow_search` |
| Profile data | `dataset_profile`, `dataset_schema`, `dataset_query` |
| Discover tile types | `dataflow_action_definitions`, `dataflow_action_definition_get` |
| Inspect existing ETLs | `dataflow_get`, `dataflow_list` |
| Create dataflow | `dataflow_create` |
| Update dataflow | `dataflow_update` |
| Execute dataflow | `dataflow_execute` (use `wait=true`) |
| Monitor execution | handled by `dataflow_execute(wait=true)` — no manual polling needed |
| Delete dataflow | `dataflow_delete` |

---

## Guardrails

- **Native tiles first.** Always use native Magic ETL tiles over SQL tiles. Use `ExpressionEvaluator` for calculated columns and CASE logic. Only use a SQL tile when native tiles genuinely can't handle the logic. See "Tile Selection: Native First" above.
- **Confirm design before creating.** Always present the ETL spec (Step 4) and wait for approval.
- **Ask about layering before designing.** For 3+ source systems or complex logic, ask the user's preference on Bronze/Silver/Gold vs. collapsed layers. Don't assume.
- **Consolidate by input affinity.** If two transforms read the same datasets, put them in the same ETL with separate output branches — don't create redundant ETLs.
- **Validate dataset IDs exist.** Call `dataset_get` to confirm each input dataset is accessible before building.
- **Use descriptive names.** Action names should be human-readable, not generic (`"Filter Active Users"` not `"Filter 1"`). For multi-output ETLs, name each `PublishToVault` after its purpose.
- **Never delete without confirmation.** Deleting a dataflow is irreversible — always confirm with the user.
- **Check for existing ETLs.** Before creating, search for dataflows with similar names to avoid duplicates.
- **Do NOT pre-create output datasets.** Let the dataflow engine create them. Set `PublishToVault.dataSource` with `type: "DataFlow"`, `name`, and `cloudId: "domo"` — no `guid`. See `reference/lessons-learned.md` lesson #7.
- **Verify after create.** Always call `dataflow_get` after creation — the API silently drops malformed properties.
- **Test with small data first.** For complex ETLs, suggest running on a filtered subset before the full dataset.
- **Read lessons-learned.md.** Before building, review `reference/lessons-learned.md` for known gotchas.

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"etl"`
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
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: ETL dataflow name, dataflow ID, input/output dataset IDs, transform summary, any errors or workarounds applied.

## Related Skills

- **ETL Spec Designer** (Build) — design ETL specs from vague requirements before building. Use this first when the user doesn't have clear dataset/column/transform details.
- **Account 360** (Discover) — understand customer context before building ETLs
- **Weekly Status** (Build) — reference ETL builds in status updates
