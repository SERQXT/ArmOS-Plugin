---
name: etl-input-adapter
tier: t1
bucket: customer-delivery
status: draft
visibility: anyone
userInvocable: true
description: >-
  Analyze a target Magic ETL's required input schema, help the user select
  source datasets, perform gap analysis, plan the transforms needed to map
  source data to the ETL's expected inputs, then build upstream adapter ETLs
  that produce correctly shaped intermediate datasets. Works for any domain —
  includes domain-specific reference playbooks (finance GL, balance sheet) that
  are loaded when the use case matches.
version: "2.0.0"
audience: [orchestration, delivery]
pipeline:
  phase: build
  sub_phase: execution
  position: 2
  output_type: output
  wave: 2
  state: draft
  inputs:
    - agent: data-strategy
      required: false
      data: metric map or data contract specifying target schema
  outputs:
    - name: adapter-etls
      format: domo-dataflow
      downstream:
        - agent: etl-builder
  data_sources:
    - tool: domo_attach
      required: true
    - tool: domo_dataflow_list
      required: true
    - tool: domo_dataflow_get
      required: true
    - tool: domo_schema
      required: true
    - tool: domo_search
      required: true
    - tool: domo_dataflow_create
      required: true
    - tool: domo_dataflow_save
      required: true
    - tool: domo_dataflow_execute
      required: false
  phase_gate: false
---

# ETL Input Adapter

Prepares data for an existing Magic ETL by building new upstream adapter dataflows. Given a target ETL (often a data product template), this skill analyzes what input schemas it expects, helps the user pick source datasets, performs gap analysis, plans the necessary transforms, and builds new staging ETLs that produce correctly shaped intermediate datasets.

**Critical rule: Never edit or delete any existing asset in the client's instance.** All existing ETLs, datasets, cards, and pages are treated as read-only. This skill only creates new ETLs. The one exception is the data product template ETL itself, which may have sections marked as optional or requiring adjustment (comments/notes in the ETL like "if no currency conversion, drop this input and join branch"). Those marked sections — and only those — may be edited in the template.

## When to use

- "prepare inputs for [ETL name]" — user has a target ETL and needs source data shaped to match its input contract
- "build adapter for [ETL name]" — explicit request to build a staging/adapter dataflow
- "map datasets to [ETL] inputs" — source-to-target schema mapping needed
- "ETL input prep for [ETL name]" — any request to prepare data for an existing ETL
- "finance data product" / "build balance sheet ETL" / "GL pipeline" — domain-specific finance adapter work
- "what does [ETL name] need as input?" — gap analysis before building

## When NOT to use

- Use `dataflow-spec-design` (v2 upstream) when the user needs to design a brand-new ETL pipeline from vague requirements — that skill generates the spec, this skill adapts source data to an already-defined spec.
- Use `dataflow-build-and-edit` (v2 upstream) when the user wants to build or edit a dataflow from scratch rather than produce upstream adapter ETLs for an existing template.
- Use `dataflow-debug` (v2 upstream) when an existing dataflow is failing and needs diagnosis — not when input schemas need adapting.

## Domain-Specific Reference Playbooks — READ BEFORE PHASE 1

Before starting Phase 1, check if the use case matches a domain playbook below. If it matches, read the playbook file FIRST — it provides battle-tested patterns, known root causes, validation methodology, and source-system-specific guidance that the generic phases do not cover.

Domain playbooks live in the `reference/` folder.

### Finance Data Product (Balance Sheet / Income Statement)

**Trigger:** The target ETL produces a Trial Balance, Balance Sheet, Income Statement, or Finance Dashboard — from any ERP GL source (NetSuite, SAP, Oracle, Sage, QuickBooks, Dynamics, etc.).

**Action:** Read `reference/finance-data-product-playbook.md` before proceeding.

**What the playbook covers:**

- The template model (data product ETL is fixed; staging layer is where all adaptation happens)
- Full validation methodology: starting balance validation, period-by-period stepping, retained earnings troubleshooting, intercompany handling, currency conversion, sign adjustment, dimension explosion prevention
- Staged test plan (Gates 1–6) and validation checklist (Phases A–H)
- ERP-specific reference sections for NetSuite, Sage Intacct, SAP, Oracle, QuickBooks, and Microsoft Dynamics — covering table names, account type codes, gotchas, and date field selection per source system
- Reusable staging layer design patterns (four-table join, TB-start + GL-forward, pre-aggregation, IC flagging)

## Shared ETL Knowledge

This skill builds dataflows. Before building, read these shared references in `../etl-builder/reference/`:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `etl-planning-principles.md` | Layering, input affinity, multi-output branching | Before designing adapter architecture |
| `etl-tiles.md` | All 42 tile types with verified JSON schemas | When selecting tiles for Phase 4 |
| `lessons-learned.md` | Critical gotchas (MAGIC type, flat properties, silent drops, output creation) | Before building any dataflow JSON (Phase 5) |
| `etl-examples.md` | Complete verified dataflow patterns including multi-output | When constructing adapter JSON |

### Planning Principles Summary

Adapter ETLs are inherently L1 (Bronze / Staging) layer dataflows. Key application points:

- **Consolidate by input affinity.** If two input slots share the same source, build one adapter with multiple `PublishToVault` output branches.
- **Native tiles first.** Always use native Magic ETL tiles over SQL. See the ETL Builder's "Tile Selection: Native First" for the full decision guide and operation-to-tile mapping.
- **Right-size the adapter.** If the adapter needs heavy joins/aggregations/formulas, suggest `dataflow-spec-design` for a layered pipeline plan instead.
- **Ask before assuming.** If the target ETL has 3+ input slots sourced from the same system, ask: "Should I build one consolidated adapter with multiple outputs, or keep them as separate adapters for independent scheduling?"

## How It Works

```
User says: "prepare inputs for the Revenue Rollup ETL"
                    |
    Phase 1: Analyze target ETL
    → What inputs does it expect? What columns/types per input?
                    |
    Phase 2: Discover source datasets
    → What's available in this instance? User picks sources.
                    |
    Phase 3: Gap analysis
    → Compare source schemas vs required input schemas
    → What's missing, mismatched, or needs transformation?
                    |
    Phase 4: Transform planning
    → For each input slot: what transforms bridge the gap?
                    |
    Phase 5: Build adapter ETLs
    → Create new dataflows: source → transforms → output matching target schema
                    |
    Phase 6: Connect & verify
    → Wire adapter outputs as inputs to the target ETL
    → Execute and validate
```

## Prerequisites

The domo-platform MCP must be attached to the target instance:

```
domo_attach(instance="<instance-name>")
```

This is a one-time step per session.

## Execution Flow

### Phase 1: Analyze Target ETL

**Goal:** Determine the exact input schema the target ETL expects per input slot.

```
Step 1.1: Find the target ETL
  → domo_dataflow_list()
  → Match by name (user provides ETL name)
  → If ambiguous, present matches and ask user to pick

Step 1.2: Fetch full ETL definition
  → domo_dataflow_get(dataflow_id, format="full")
  → Parse the response JSON

Step 1.3: Extract input slots
  → Filter actions where type == "LoadFromVault"
  → For each: record tile name, dataSourceId, action ID

Step 1.4: Trace column usage per input
  → For each input tile, follow the dependency chain forward:
    - Which downstream tiles depend on this input? (check dependsOn)
    - What columns do those tiles reference?
      - MergeJoin: keys1/keys2 (join columns)
      - ExpressionEvaluator: column references in expressions
      - SelectValues: fields[].name
      - Filter: filterList[].leftField
      - GroupBy: groups[].name + fields[].source
  → Build the "required columns" list per input slot

Step 1.5: Fetch current input schemas (if datasets exist)
  → domo_schema(dataset_id) for each input's dataSourceId
  → This shows what the ETL currently receives

Step 1.6: Output the input contract
  → Per input slot: slot name, required columns, column types,
    how each column is used (join key, filter, expression, group-by, passthrough)
```

**Present to user:** "This ETL has N input slots. Here's what each one needs:"

| Input Slot | Required Columns | Join Keys | Notes |
|-----------|-----------------|-----------|-------|
| Slot A: "Revenue Data" | revenue_amount (DOUBLE), period_id (LONG), account_id (STRING) | period_id, account_id | Used in join + group-by |
| Slot B: "Account Dim" | account_id (STRING), account_name (STRING), region (STRING) | account_id | Lookup dimension |

### Phase 2: Discover Source Datasets

**Goal:** Help user find and select source datasets to feed each input slot.

```
Step 2.1: For each input slot, suggest candidates
  → domo_search(query=<keywords from slot name and column names>)
  → Present results with row counts and column counts

Step 2.2: User selects source dataset(s) per input slot

Step 2.3: Fetch source schemas
  → domo_schema(dataset_id) for each selected source
```

### Phase 3: Gap Analysis

**Goal:** For each input slot, compare source schema vs required schema.

```
Step 3.1: Column matching
  → Exact name match → mapped
  → Similar name (fuzzy) → suggest mapping, ask user to confirm
  → Missing in source → flag as GAP
  → Extra in source → ignore (won't be used)

Step 3.2: Type checking
  → Same type → pass
  → Compatible types (LONG → DOUBLE, STRING → DATE) → flag as CAST needed
  → Incompatible → flag as TRANSFORM needed

Step 3.3: Structural gaps
  → Source needs aggregation? (e.g., daily data → monthly summary)
  → Source needs join? (multiple source tables to produce one input)
  → Source needs filter? (subset of rows)
  → Source needs calculated columns? (derived fields)
```

**Present to user:** Gap analysis table per input slot:

| Required Column | Source Column | Status | Transform Needed |
|----------------|-------------|--------|-----------------|
| period_id | `Period ID` | RENAME | Rename to period_id |
| revenue_amount | `Revenue` | CAST | Cast STRING → DOUBLE |
| account_id | account_id | OK | None |
| region | — | MISSING | Need lookup join from Account Dim |

### Phase 4: Transform Planning

**Goal:** Design the adapter ETL tiles for each input slot. Use native tiles — see `../etl-builder/reference/etl-tiles.md` for the full 42-tile catalog with verified JSON schemas.

```
Step 4.1: Per input slot, determine required native tiles:
  → Rename / drop columns → SelectValues tile
  → Cast types            → Metadata tile
  → Filter rows           → Filter tile
  → Join sources          → MergeJoin tile
  → Aggregate             → GroupBy tile
  → Calculated columns    → ExpressionEvaluator tile
  → Dedup                 → Unique tile
  → Value lookups         → ValueMapper tile
  → Select final columns  → SelectValues tile

Step 4.2: Order the tiles by dependency
  → LoadFromVault(source) → joins/filters → transforms → select → PublishToVault(output)

Step 4.3: Name the output datasets
  → Convention: "View of <source> → <target ETL input slot>"
  → Output schema MUST exactly match the required input schema from Phase 1
```

**Present to user:** "Here's the plan for each adapter ETL. Approve to build?"

### Phase 5: Build Adapter ETLs

**Goal:** Create the new dataflows in Domo. Read `../etl-builder/reference/lessons-learned.md` before building.

```
Step 5.1: Create scaffold ETL
  → domo_dataflow_create(
      name="Adapter: <source> → <target input slot>",
      inputs=[{dataSourceId: <source_id>, name: <source_name>}]
    )
  → CRITICAL: databaseType must be "MAGIC" (not REDSHIFT)

Step 5.2: Fetch the scaffold to modify
  → domo_dataflow_get(new_id, format="full")

Step 5.3: Add transform tiles
  → Modify the actions array
  → Wire dependsOn chains correctly
  → All action properties must be FLAT on the action — not in a "variables" object
  → Every action must include "tables": [{}]
  → domo_dataflow_save(new_id, definition=<modified JSON>)

Step 5.4: Verify the save
  → domo_dataflow_get(new_id, format="full")
  → Confirm all actions persisted (the API silently drops malformed properties)

Step 5.5: Execute and verify
  → domo_dataflow_execute(new_id, wait=true)
  → If success: domo_schema(output_dataset) to confirm output matches target
  → If failure: domo_dataflow_diagnose(new_id) to identify the issue
```

Output datasets: Do NOT pre-create them via the streams API. Set `PublishToVault` with `dataSource.type: "DataFlow"`, `name`, and `cloudId: "domo"` — no `guid`. The engine creates the dataset on first execution.

### Phase 6: Connect to Target ETL

**Goal:** Wire the adapter outputs as inputs to the target ETL.

```
Step 6.1: Get the adapter output dataset IDs
  → From step 5.1 results — the PublishToVault creates a new dataset

Step 6.2: Update target ETL inputs
  → domo_dataflow_get(target_etl_id, format="full")
  → For each input slot: update the LoadFromVault tile's dataSourceId
  → domo_dataflow_save(target_etl_id, definition=<updated JSON>)

Step 6.3: Execute target ETL
  → domo_dataflow_execute(target_etl_id, wait=true)

Step 6.4: Report
  → Summary: N adapter ETLs created, target ETL inputs rewired, execution status
```

## Output Template

```markdown
# ETL Input Adapter Report

**Target ETL:** [name] (ID: [id])
**Instance:** [instance]
**Date:** [date]

## Input Contract

| # | Input Slot | Required Columns | Source Dataset | Adapter ETL |
|---|-----------|-----------------|---------------|-------------|
| 1 | [slot name] | [N columns] | [source name] | [adapter name] (ID: [id]) |

## Transforms Applied

### Adapter 1: [name]
- Renamed: column_a → column_b
- Cast: Revenue (STRING → DOUBLE)
- Filtered: status = 'Active'
- Output: [N] rows, [N] columns

## Execution Results

| ETL | Status | Rows Output | Duration |
|-----|--------|------------|----------|
| Adapter 1 | SUCCESS | [N] | [Xs] |
| Target ETL | SUCCESS | [N] | [Xs] |
```

## Design principles

- **Asset protection first.** Never edit or delete any existing client asset. The only permitted write surface is newly created staging ETLs and the explicitly marked optional sections of a data product template.
- **Native tiles over SQL.** Use native Magic ETL tiles (SelectValues, MergeJoin, Filter, GroupBy, ExpressionEvaluator, Unique, ValueMapper). Use `SqlTransform` only for window functions or complex CTEs that would require 5+ native tiles.
- **Consolidate by input affinity.** Multiple input slots sharing the same source dataset should produce one adapter with multiple `PublishToVault` branches — not separate adapters — unless independent scheduling is explicitly required.
- **Validate output schema before connecting.** Run the adapter ETL and confirm the output schema matches the required input contract before wiring it to the target ETL.
- **Verify after save.** Always call `domo_dataflow_get` after saving — the API silently drops malformed properties.
- **Ask before building.** Present the transform plan (Phase 4) and get user approval before creating any dataflows (Phase 5). Do not build speculatively.
- **`preferredDatabaseEntityType` must be `"TEMP_VIEW"`.** Never use `"TABLE"` — the API rejects it with a 400 VALIDATION-DIV error.
- **When in doubt, ask.** If source datasets are unclear, ask the user or search the instance by key terms before proceeding.

## MCP Tools

| Tool | Phase | What It Does |
|------|-------|-------------|
| `domo_attach` | Pre-req | Connect to target instance |
| `domo_dataflow_list` | 1 | Find the target ETL by name |
| `domo_dataflow_get` | 1, 5, 6 | Fetch ETL definitions for analysis and modification |
| `domo_schema` | 1, 2, 5 | Get column schemas for datasets |
| `domo_search` | 2 | Find candidate source datasets |
| `domo_dataflow_create` | 5 | Create new adapter ETLs |
| `domo_dataflow_save` | 5, 6 | Modify ETL definitions (add tiles, rewire inputs) |
| `domo_dataflow_execute` | 5, 6 | Run ETLs and verify |
| `domo_dataflow_diagnose` | 5 | Debug failures in adapter ETLs |
| `domo_query` | 5 | Spot-check output data if needed |

## Memory

### Before executing — Build Context Discovery (REQUIRED)

**Step 1 — Determine the build target.** From the user's message and conversation context, identify exactly what they want to build. If ambiguous, stop and ask before proceeding.

**Step 2 — Pull focused build context.** Call `memory_build_context` with `build_type: "etl"` and a concise `target_description`.

**Step 3 — Human review of memory hits.** Present returned context to the user; ask them to confirm or reject each section.

**Step 4 — Plan with confirmed context.** Use only confirmed items as inputs to the build plan.

### After executing

Call `memory_remember` with scope `{account_id, engagement_id}` and content summarizing: adapter ETL name, dataflow ID, source-to-target column mapping, intermediate dataset ID, schema transformations applied.

## Related Skills

- `dataflow-spec-design` (v2 upstream) — Supersedes `etl-spec-designer`. Use upstream when the user needs a full pipeline spec before adapting inputs.
- `dataflow-build-and-edit` (v2 upstream) — Supersedes `etl-builder`. Use upstream when building or editing a dataflow from scratch rather than adapting an existing template.
- `dataflow-debug` (v2 upstream) — Supersedes `etl-builder` diagnosis path. Use upstream when an existing dataflow is failing.
