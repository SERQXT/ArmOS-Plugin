# Wire Customer Data — ProCode App Data Source Binding

**Maps to pipeline phase:** Deploy — after MVP2 is built on the internal instance (J1/J2/K complete), this step connects the app to the customer's real data on their Domo instance. This is the bridge between "demo with representative data" and "running on the customer's production data."

## What This Step Does (and Doesn't Do)

**Does:**
- Discovers datasets on the customer's Domo instance
- Analyzes schemas and profiles data to find the best matches for each app data binding
- Maps customer datasets to the app's manifest aliases
- Updates `manifest.json` mapping entries with real dataset IDs
- Adapts code where schema differences require it (column names, types, missing fields)
- Flags features that can't be supported by available customer data
- Supports mixed mode: real data for some aliases, sample data for others
- Republishes and verifies the app works with real data

**Does NOT:**
- Build ETLs or dataflows (use etl-builder / etl-input-adapter for that)
- Create dashboards, cards, or pages (use dashboard-builder for that)
- Modify existing assets on the customer's instance (read-only scanning)
- Guess — if something is ambiguous, it asks the user

## Required reading before wiring

- **`modules/api-wiring-patterns.md`** — canonical wiring patterns from the portfolio audit. Follow the durhamlane DEMO-flag pattern for clean mock-to-real migration, the manulife pattern for queryWithSql, the UPS pattern for full-stack wiring with AppDB + AI.
- **`modules/api-wiring-patterns.md` §3 (risk checklist)** — check for CSP issues, PDP scoping, placeholder dataset IDs, and `domo.env` scope declarations before wiring.
- **`modules/api-wiring-patterns.md` §4 (human-only work)** — the agent must not attempt dataset provisioning, PDP policy creation, OAuth client setup, or cross-instance connector auth. Flag these as blockers for the human team.

## Prerequisites

```
1. health_check on domo-datasets → verify customer instance connection
2. health_check on domo-publish  → verify publish capability
3. App must be deployed (deploy-result.json exists with design ID)
```

If either health check fails, STOP and ask the user to configure the customer instance credentials.

## Tools Used

| Tool | Server | Phase | Purpose |
|------|--------|-------|---------|
| `dataset_list` | domo-datasets | 2 | Browse datasets on customer instance |
| `dataset_schema` | domo-datasets | 2, 3 | Get column names and types |
| `dataset_profile` | domo-datasets | 3 | Row counts, value distributions, type classification |
| `dataset_query` | domo-datasets | 3 | Sample rows and content inspection |
| `search_query` | domo-search | 2 | Search instance by keyword for datasets |
| `procode_source_download` | domo-publish | 1 | Download current app source + manifest |
| `procode_manifest_validate` | domo-publish | 5 | Validate updated manifest before publish |
| `procode_publish` | domo-publish | 5 | Republish app with new bindings |

**Optional sub-skill (Phase 4b only):** If the gap analysis reveals customer data needs joins, cleanup, or aggregation before the app can consume it, this skill delegates to **etl-builder** to construct a staging ETL. This only happens when the user explicitly approves it — the wiring skill defines the exact input contract and output schema, and etl-builder handles the dataflow construction. Outside of this specific branch, no other skills are invoked.

---

## Phase 1: Analyze the App's Data Contract

**Goal:** Understand exactly what data the app expects — every alias, what columns it uses, and how.

```
Step 1.1: Download current app source
  → procode_source_download(designId, outputDir)
  → Parse manifest.json

Step 1.2: Extract the data contract from manifest
  → For each entry in manifest.mapping[]:
    - Record: alias, dataSetId (current), fields (if specified)
  → For each entry in manifest.collections[] (if any):
    - Record: alias, collectionId

Step 1.3: Trace alias usage in code
  → Search all .js/.ts/.html files for:
    - domo.get('/data/v1/{alias}')  → which columns are accessed in the response handler
    - domo.get('/domo/datastores/v1/collections/{alias}')  → AppDB reads
    - Column references in chart configs, table renderers, filter logic
  → Build per-alias usage map:
    | Alias | Columns Used | How Used | UI Features Dependent |
    |-------|-------------|----------|----------------------|

Step 1.4: Fetch current dataset schemas (internal instance)
  → dataset_schema(dataSetId) for each current mapping
  → This is what the app was BUILT against — the baseline
```

**Present to user:**

"Here's what the app needs — [N] dataset aliases, each with the columns and features that depend on them:"

| Alias | Current Dataset | Columns Used | Features |
|-------|----------------|-------------|----------|
| `sales_data` | Sample Sales (internal) | date, amount, region, rep_name | Main chart, filters, KPI cards |
| `targets` | Sample Targets (internal) | period, target_amount, region | Target line on chart, variance calc |

---

## Phase 2: Discover Customer Datasets

**Goal:** Find datasets on the customer's instance that could serve each alias. Three paths — ask the user which:

### Path A: User provides dataset IDs
The user already knows which datasets to use. Collect the IDs and proceed to Phase 3.

### Path B: Keyword search
For each alias, search the customer's instance using terms from the alias name, column names, and the app's domain:

```
search_query(query_string="sales revenue", entity_types=["DATA_SOURCE"])
dataset_list(query="sales", limit=50)
```

Present candidates with row counts and column counts. User picks.

### Path C: Browse and select
List all datasets on the instance (paginated), let the user browse and select:

```
dataset_list(limit=50, offset=0)
dataset_list(limit=50, offset=50)
...
```

**Ask the user:** "How do you want to find the right datasets? You can give me the dataset IDs directly, I can search by keyword, or we can browse what's available."

**For each alias, confirm:** "For the `{alias}` alias (used for {features}), which dataset should we evaluate?" The user must confirm each mapping — never auto-assign.

---

## Phase 3: Profile and Match

**Goal:** For each alias ↔ candidate dataset pair, determine how well the customer data fits.

```
Step 3.1: Fetch schema
  → dataset_schema(candidate_id) for each candidate
  → Record column names, types

Step 3.2: Profile the data
  → dataset_profile(candidate_id)
  → Record: row count, per-column stats (nulls, cardinality, min/max)

Step 3.3: Sample content
  → dataset_query(candidate_id, sql="SELECT * FROM table LIMIT 20")
  → Eyeball the actual values — do they make sense for this alias?

Step 3.4: Column matching (per alias)
  For each column the app uses from this alias:
    → Exact name match in customer dataset? → MATCH
    → Similar name (case-insensitive, underscore/space variants)? → LIKELY MATCH (confirm with user)
    → Same type but different name? → RENAME NEEDED
    → Compatible type (e.g. STRING dates that could parse)? → TRANSFORM NEEDED
    → Not present in customer dataset at all? → MISSING
```

**Present to user — per alias:**

| App Column | Customer Column | Status | Action Needed |
|-----------|----------------|--------|---------------|
| `date` | `transaction_date` | Rename | Update code: `row.date` → `row.transaction_date` |
| `amount` | `amount` | Match | None |
| `region` | `sales_region` | Rename | Update code reference |
| `rep_name` | — | Missing | See gap analysis below |

---

## Phase 4: Gap Analysis and Feature Audit

**Goal:** Be honest about what works and what doesn't. Flag every feature that's affected. Determine whether the data can be wired directly or needs a transform layer first.

### 4.1: Classify every gap

For each MISSING column:
1. Identify every UI feature that depends on it
2. Categorize the impact:
   - **Removable** — the feature is a nice-to-have, can be hidden/removed
   - **Critical** — the feature is core to the app's value, can't just remove it
   - **Derivable** — the column could be computed from other available columns
   - **External** — the data exists elsewhere (another dataset, API, manual entry)

For each alias with no suitable single candidate:
- Flag the entire alias as **unresolvable with current data** OR
- Flag as **resolvable with a staging ETL** (data exists but needs joins, cleanup, or aggregation — see 4.2)

### 4.2: Determine if a staging ETL is needed

For each alias, evaluate whether the customer data can be wired directly or needs transformation first. Direct wiring is always preferred — only propose an ETL when the data genuinely can't be consumed as-is.

**An ETL is needed when:**
- The app alias needs columns from **multiple customer datasets** that must be joined (e.g. transactions + accounts + regions)
- The customer data has **quality issues** that would break the app — nulls in required fields, duplicate keys, inconsistent types
- The data needs **aggregation** the app expects pre-computed (e.g. app expects monthly rollups, customer has daily rows)
- Column values need **standardization** that's too complex for in-app parsing (e.g. date formats, currency conversion, code-to-label mapping)
- The customer dataset has **far more data** than the app needs and should be filtered/scoped to avoid performance issues

**An ETL is NOT needed when:**
- Columns just need renaming — handle in app code
- A single type cast is needed (e.g. string → number) — handle in app code
- The data is a clean direct match with minor field name differences

### 4.3: Present the full picture

**Present to user — three categories:**

```
DIRECT WIRE (no transform needed)
══════════════════════════════════
✓ targets → customer "Annual Targets" — all columns match
  → No changes needed, direct wire

WIRE WITH CODE CHANGES (minor adaptation)
═════════════════════════════════════════
~ sales_data → customer "Revenue Transactions" — 3 of 4 columns match
  → 1 rename: transaction_date → date
  → 1 type cast in code: amount (string → number)

NEEDS A STAGING ETL (data not ready for app as-is)
═══════════════════════════════════════════════════
⚠ pipeline_data — the app expects a single unified dataset but the customer
  has the data split across 3 datasets:
  → "CRM Opportunities" (deals, stages, close dates)
  → "Finance Actuals" (revenue, costs, by account)
  → "Team Roster" (rep names, regions, managers)
  → PROPOSED ETL: Join on account_id, filter active deals,
    roll up to monthly, output single "Pipeline Summary" dataset
  → Estimated: 1 staging ETL, 3 inputs, ~5 tiles

FEATURES AT RISK
════════════════
✗ sales_data.rep_name — MISSING in customer data
  → Affects: "Sales by Rep" chart, rep filter dropdown
  → Options: (a) remove the feature, (b) keep on sample data,
    (c) is this in the Team Roster dataset? (could be added to the ETL above)

RECOMMENDATION:
Wire targets directly. Wire sales_data with code renames.
Build 1 staging ETL for pipeline_data (joins 3 sources).
For rep_name — if it's in Team Roster, include it in the ETL join.
Otherwise, remove the rep-related features.
```

### 4.4: User decides

For each category, the user must confirm:
- **Direct wire** — approve or adjust
- **Code changes** — approve the renames/casts
- **Staging ETL** — approve the proposed ETL, or reject it (keep on sample data, simplify the app, etc.)
- **Features at risk** — remove, keep on sample, or resolve via ETL/other dataset

**Do not proceed until every alias and every gap has a resolution.**

---

## Phase 4b: Build Staging ETLs (only if approved)

**This phase only runs if the user approved one or more staging ETLs in Phase 4.4.** If all aliases are direct-wire or code-change only, skip to Phase 5.

**Goal:** Build the minimal transform layer so the customer data is in the shape the app expects, then wire the ETL output into the manifest.

### How this works

This step delegates to the **etl-builder** skill for the actual ETL construction. The wiring skill's job is to define the precise input contract and hand off cleanly.

### 4b.1: Define the ETL spec per approved staging ETL

For each approved ETL, produce a clear spec:

```
ETL: "Staging — Pipeline Summary for [App Name]"
PURPOSE: Produce a single dataset matching the app's pipeline_data alias schema
INPUTS:
  1. "CRM Opportunities" (dataset ID: xxx) — columns: deal_id, account_id, stage, close_date, amount
  2. "Finance Actuals" (dataset ID: yyy) — columns: account_id, revenue, cost, period
  3. "Team Roster" (dataset ID: zzz) — columns: account_id, rep_name, region, manager
JOIN LOGIC:
  - Join Opportunities + Finance on account_id
  - Join result + Team Roster on account_id
FILTERS:
  - Opportunities.stage != 'Lost'
AGGREGATION:
  - GROUP BY period, region, rep_name
  - SUM(amount), SUM(revenue), SUM(cost)
OUTPUT SCHEMA (must match app alias exactly):
  | Column | Type | Source |
  |--------|------|--------|
  | period | DATE | Finance Actuals.period |
  | region | STRING | Team Roster.region |
  | rep_name | STRING | Team Roster.rep_name |
  | deal_amount | DOUBLE | SUM(Opportunities.amount) |
  | revenue | DOUBLE | SUM(Finance Actuals.revenue) |
  | cost | DOUBLE | SUM(Finance Actuals.cost) |
```

### 4b.2: Present spec to user for approval

Show the spec. The user must confirm:
- The input datasets are correct
- The join logic makes sense
- The output schema matches what the app needs
- The filters and aggregation are appropriate

**Ask:** "Does this ETL plan look right? I'll build it using the etl-builder skill once you confirm."

### 4b.3: Build the ETL

Hand off to **etl-builder** with the approved spec. The etl-builder creates the dataflow on the customer's instance, executes it, and verifies the output.

Key constraints for the handoff:
- **Name convention:** "Staging — [description] for [App Name]"
- **Output dataset name:** Clear label tying it to the app (e.g. "Pipeline Summary (staged for [App Name])")
- **Native tiles only** — no SQL unless genuinely required
- **Read existing assets only** — never edit or delete anything on the customer instance except the new ETL being created
- The output schema must **exactly** match what the app alias expects (column names and types from Phase 1)

### 4b.4: Verify ETL output

After the ETL runs:
```
dataset_schema(etl_output_id) → confirm columns match the app alias contract
dataset_query(etl_output_id, sql="SELECT * FROM table LIMIT 10") → confirm data looks right
dataset_profile(etl_output_id) → confirm row count, no unexpected nulls
```

**Present to user:** "The staging ETL produced [N] rows with the expected schema. Here's a sample. Ready to wire this into the app?"

### 4b.5: Record the ETL output dataset ID

This becomes the `dataSetId` for the corresponding manifest alias in Phase 5. The app will now point at the ETL output instead of raw customer data or sample data.

---

## Phase 5: Execute the Wiring

**Goal:** Update manifest, adapt code, republish, verify. Only after user approves the plan from Phase 4 (and Phase 4b if ETLs were built).

### 5.1: Update manifest.json

For each alias the user approved for wiring:
```json
{
  "mapping": [
    {
      "dataSetId": "CUSTOMER-DATASET-UUID",
      "alias": "sales_data",
      "fields": []
    }
  ]
}
```

**Manifest rules (from procode-app-builder):**
- Use `"mapping"` NOT `"datasetsMapping"` — the publish CLI ignores the API-format key
- Use `"collections"` NOT `"collectionsMapping"`
- Keep `"fileName"` pointing to the correct entry HTML
- Remove any stale `"id"` field if publishing to a new instance

### 5.2: Adapt code for schema differences

For each RENAME or TRANSFORM from Phase 3:
- Find every reference to the old column name in the codebase
- Update to the new column name
- If the data type changed (e.g. number stored as string), add parsing logic
- Keep all UI functionality intact — only change the data access layer

**Code changes must be minimal and surgical.** Do not refactor, redesign, or add features. Change only what's needed to make the data flow correctly.

### 5.3: Handle gaps per user decision
- **Remove feature:** Comment out or hide the UI element, add a note in code
- **Keep on sample:** Leave that alias pointing to the internal sample dataset — document it clearly in the wiring report
- **Derivable:** Add the calculation (beast mode or in-code) and document it

### 5.4: Validate before publishing

```
procode_manifest_validate(manifestPath)
```

Fix any validation errors. Common issues at this stage:
- Placeholder dataSetId still present (not replaced)
- `datasetsMapping` used instead of `mapping`
- fileName mismatch after code changes

### 5.5: Publish and verify

On ArmOS desktop, run `domo publish` from the app directory. On the cloud worker, use `procode_publish(appDir)`. See `procode-app-builder` Step 8a.

After publish, verify the app loads with real data:
- Open the app URL
- Confirm each wired alias shows customer data (not sample)
- Confirm features flagged as "sample data" still work
- Confirm removed features are cleanly hidden

---

## Phase 6: Wiring Report

Produce `artifacts/DATA-WIRING-REPORT.md` with:

```markdown
# Data Wiring Report

**App:** [name] (Design ID: [id])
**Customer instance:** [instance].domo.com
**Date:** [date]

## Wiring Summary

| Alias | Customer Dataset | Dataset ID | Wiring Type | Status |
|-------|-----------------|------------|-------------|--------|
| sales_data | Revenue Transactions | abc-123-def | Direct | Wired — 1 column renamed |
| targets | Annual Targets | ghi-456-jkl | Direct | Wired — direct match |
| pipeline_data | Pipeline Summary (staged) | mno-789-pqr | Via staging ETL | Wired — ETL joins 3 sources |

## Column Mappings

### sales_data → Revenue Transactions
| App Column | Customer Column | Action |
|-----------|----------------|--------|
| date | transaction_date | Renamed in code |
| amount | amount | Direct match |
| region | sales_region | Renamed in code |
| rep_name | — | Feature removed (user decision) |

## Staging ETLs Built (if any)

| ETL Name | Dataflow ID | Inputs | Output Dataset | Output ID | Rows |
|----------|------------|--------|---------------|-----------|------|
| Staging — Pipeline Summary for [App] | df-abc-123 | CRM Opportunities + Finance Actuals + Team Roster | Pipeline Summary (staged) | mno-789-pqr | 1,240 |

## Code Changes
- `app.js` line 42: `row.date` → `row.transaction_date`
- `app.js` line 58: `row.region` → `row.sales_region`
- `app.js` lines 87-102: "Sales by Rep" chart hidden (rep_name unavailable)

## Features on Sample Data
- None (all wired or removed)

## Features Removed
- "Sales by Rep" chart — rep_name not available in customer data
- Rep filter dropdown — same dependency

## Verification
- App loads: YES
- Real data visible: YES
- Sample data aliases remaining: NONE
- Errors in console: NONE
```

---

## Guardrails

1. **Never modify existing customer assets.** All scanning is read-only. We only modify the app's own source code and manifest.
2. **Never auto-assign datasets.** The user confirms every alias → dataset mapping. Present candidates, let the user pick.
3. **Never hide data gaps.** Every missing column and affected feature must be surfaced. The user decides what to do.
4. **Minimal code changes.** Only change what's needed for the data to flow. No refactoring, no new features, no redesigns.
5. **Document everything.** The wiring report is a deliverable — the customer and consultant need to know exactly what was wired, what changed, and what's still on sample data.
6. **Mixed mode is fine.** An app can run with some aliases on real data and others on sample. Document which is which. Don't pretend everything is wired when it isn't.
7. **Ask before acting.** Present the plan at every phase boundary. The user approves before the next phase starts.
