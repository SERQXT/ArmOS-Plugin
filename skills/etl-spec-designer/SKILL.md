---
name: etl-spec-designer
tier: 1
agent:
  name: "ETL Spec Designer"
  roles: ["Data Engineer", "Solutions Consultant"]
  target_roi: "Transform vague customer requirements into precise, buildable ETL specifications — before touching a single tile"
description: "Design ETL specifications from customer context. Trigger with 'design an ETL spec', 'what ETLs do we need for [customer]', 'spec out the data pipeline', or any request to plan/design (not build) a data transformation. Mines meeting transcripts, emails, and knowledgebase docs to extract requirements, then asks targeted clarifying questions before producing a structured spec that feeds directly into the ETL Builder symphony."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by upstream `dataflow-spec-design` (v2 product-team). Use dataflow-spec-design for ETL pipeline specification from vague requirements."
audience: [orchestration, delivery]
---

# ETL Spec Designer

Produces structured, buildable ETL specifications by mining customer context (meeting transcripts, emails, documents) and asking targeted clarifying questions. The output is a spec document that can be handed directly to the **ETL Builder** symphony as input.

## Triggers

- "design an ETL spec for [customer]"
- "what data pipelines does [customer] need?"
- "spec out the ETL for [description]"
- "plan the data transformation"
- "review the transcripts and figure out what ETLs we need"
- "create an ETL spec from the meeting notes"

## When to Use This vs. ETL Builder

| Situation | Use |
|-----------|-----|
| You know exactly what to build (datasets, columns, transforms) | ETL Builder directly |
| Customer said something vague like "we need reporting on X" | **ETL Spec Designer** first |
| You have transcripts/emails but no clear data requirements | **ETL Spec Designer** first |
| You have a spec and want to create the dataflow | ETL Builder directly |

---

## Shared ETL Knowledge

Before designing specs, read these shared references in `../etl-builder/reference/`:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `etl-planning-principles.md` | Layering, input affinity, multi-output, right-sizing | Before Step 2 (grouping needs) and Step 3 (layering) |
| `etl-tiles.md` | All 42 native tile types with capabilities | When designing transformation pipelines (Step 6) — know what's natively possible |

### Key Principles for Spec Design

- **Design for native tiles.** The ETL Builder uses native Magic ETL tiles (not SQL). When specifying transforms, use operations that map to real tiles: Filter, Join (MergeJoin), Group By, Formula (ExpressionEvaluator), Rank (WindowAction), Pivot (Denormaliser), Unpivot (Normalizer), Value Mapper, etc. See `etl-tiles.md` for the full 42-tile catalog. Only spec a SQL tile when native tiles genuinely can't handle the logic.
- **Group by input affinity** — transforms sharing the same inputs become one ETL with multiple outputs.
- **Layer by stage** — Bronze (cleanup), Silver (enrichment), Gold (model). Right-size to complexity.
- **Ask before assuming** — always confirm layering preference with the user.

---

## Execution Flow

### Step 1: Gather Context

**Stakeholder-first requirement:** BEFORE designing any technical architecture, check the knowledgebase for meeting transcripts or stakeholder notes. If transcripts exist, extract: (1) Who are the stakeholders? (2) What output do they need to see? (3) What decisions will this data support? Lead with stakeholder needs, not technical capabilities. If the user's request implies a complex technical solution but transcripts suggest simpler needs, flag the mismatch and confirm scope before proceeding.

Mine available customer context in this priority order:

1. **Meeting transcripts** (`meetings/transcripts/`) — richest source of requirements
   - Look for: data questions asked, reports requested, pain points with current data
   - Extract: dataset names mentioned, column names, business metrics, KPIs
   - Note: who asked for what (stakeholder attribution helps prioritize)

2. **Emails** (`emails/`) — often contain specific requests and follow-ups
   - Look for: "can you build...", "we need a report that...", "the data should show..."
   - Extract: acceptance criteria, deadlines, output format preferences

3. **Knowledgebase** (`knowledgebase/`) — distilled context from uploads
   - Look for: existing data landscape, known datasets, schema information
   - Extract: available source datasets, data quality notes

4. **Documents** (`documents/`) — SOWs, requirements docs, slide decks
   - Look for: formal requirements, agreed-upon deliverables
   - Extract: scope boundaries, data mapping specs

If the customer folder doesn't exist or is empty, skip to Step 2 and rely entirely on conversation.

### Step 2: Identify and Group Data Transformation Needs

From the gathered context, identify each distinct data transformation need:
- **What question does this answer?** (business purpose)
- **What data goes in?** (source datasets, APIs, manual inputs)
- **What transformation is needed?** (join, filter, aggregate, formula, etc.)
- **What comes out?** (output dataset, dashboard, report)

Then **group by input affinity** — transformations that share the same source datasets should be flagged as candidates for the same ETL with multiple output branches.

Present what you found as a bulleted summary with affinity groups:

```
From the context, I identified these data transformation needs:

Group A (shared source: CRM export):
1. **Sales Performance by Region** — Carol mentioned in the 3/5 meeting she needs
   regional breakdowns of Q1 sales.
2. **Rep Quota Attainment** — SOW deliverable #2 requires rep-level quota tracking.
   → These share the CRM dataset and can be one ETL with two output branches.

Group B (shared sources: usage data + billing):
3. **Customer Churn Risk Score** — Email from Mike (3/7) requesting a daily pipeline
   that combines usage data with billing to flag at-risk accounts.
4. **Account Health Dashboard** — Transcript from 3/10 indicates health scoring
   needs the same usage + billing join.
   → Same inputs, different aggregations — one ETL, two outputs.

Standalone:
5. **Product Inventory Reconciliation** — SOW deliverable #4 requires matching
   warehouse inventory against POS data.
```

### Step 3: Assess Layering and Ask About Architecture

Before diving into clarifying questions, assess overall complexity and ask the user about their preferred pipeline architecture. See `../etl-builder/reference/etl-planning-principles.md` for full layer definitions (L1 Bronze, L2 Silver, L3 Gold), right-sizing guidance, and the questions to ask.

**Complexity signals:**
- Number of distinct source systems (1–2 = simple, 3–5 = moderate, 10+ = complex)
- Whether transforms are mostly cleanup vs. heavy business logic
- Number of downstream consumers (dashboards, reports, other ETLs)
- Whether the customer has existing ETL infrastructure to integrate with

**Ask the user directly:**
- "I see [N] source systems and [M] output needs. Would you prefer a simple collapsed approach (fewer ETLs) or a layered Bronze → Silver → Gold architecture?"
- If the user says "just figure it out", apply the right-sizing guidance from the shared principles and note your choice in the spec.

### Step 4: Ask Clarifying Questions

**If context is insufficient**, ask the user targeted questions. Don't ask generic questions — be specific based on what you've already gathered.

**Good questions** (specific, actionable):
- "The transcript mentions 'sales data' — is that the Salesforce CRM export in Domo, or a different source?"
- "Mike wants churn scoring. What threshold defines 'at risk' — days since last login, revenue drop, or something else?"
- "Should the regional breakdown be by billing region or shipping region? The dataset has both."

**Bad questions** (too vague — avoid these):
- "What datasets do you want to use?"
- "What should the output look like?"
- "Do you have any requirements?"

Ask **at most 3-5 questions per ETL**. Group them logically. If the user says "just figure it out" or "use your best judgment", make reasonable assumptions and note them in the spec.

### Step 5: Discover Available Datasets (Incremental — One Group at a Time)

**CRITICAL: Work ONE AFFINITY GROUP per turn to avoid context overload and timeouts.**

Use MCP tools to find datasets that match the requirements:

```
dataset_list(query="keyword")     → search by name
dataset_get(dataset_id)           → verify and get metadata
dataset_schema(dataset_id)        → column names and types
dataset_profile(dataset_id)       → data shape, quality, stats
dataflow_search(name_filter="")   → check for existing ETLs (avoid duplicates)
```

**Incremental profiling rules:**
1. Profile ONE affinity group per turn (e.g., "Group A" datasets only)
2. Within a group, profile a maximum of 3 datasets per turn
3. After completing a group, report:
   - Datasets found and their schemas
   - Data freshness findings (see Step 5b)
   - Which groups remain to be profiled
4. Stop and let the system auto-continue to the next group
5. If workers pre-gathered dataset data, use it directly — do NOT re-call those tools

Map each requirement to concrete source datasets. If a required dataset doesn't exist, note it as a gap.

### Step 5b: Data Freshness Validation (Within Current Group Only)

For every key field identified for time-series, trend analysis, or filtering **in the current group**, validate that the data is actively populated:

1. Run a date-range query: `dataset_query(dataset_id, "SELECT MIN(date_col) as earliest, MAX(date_col) as latest, COUNT(*) as row_count FROM dataset WHERE field IS NOT NULL")`
2. For fields used in time-series analysis, also check population density: `SELECT YEAR(date_col) as yr, MONTH(date_col) as mo, COUNT(*) as cnt FROM dataset WHERE field IS NOT NULL GROUP BY yr, mo ORDER BY yr DESC, mo DESC LIMIT 24`
3. **Flag as STALE** any field where the most recent populated value is >6 months old
4. **Do NOT build on stale fields** without explicit user confirmation — present the staleness finding and ask whether to proceed, find an alternative field, or adjust scope

Include a **Data Freshness** section in the output spec (Step 6) listing each key field's date range and population status.

### Step 6: Produce the ETL Spec

Output a structured spec document for **each ETL** (not each output — remember, one ETL may have multiple outputs). Use this format:

```markdown
# ETL Spec: [Name]

## Layer
[L1 Bronze / L2 Silver / L3 Gold / Collapsed (L1+L2) / etc.]

## Business Purpose
[One sentence: what question(s) does this answer?]

## Source
- **Context**: [Where this requirement came from — transcript, email, etc.]
- **Stakeholder**: [Who asked for it]
- **Priority**: [High/Medium/Low based on context clues]

## Input Datasets
| Dataset | ID | Rows | Key Columns |
|---------|-----|------|-------------|
| [name]  | [uuid] | [count] | [relevant cols] |

## Transformation Pipeline
1. Input: [dataset name]
2. [Step]: [description] — e.g., Filter: Status = 'Active'
3. [Step]: [description] — e.g., Join: on Customer_ID
4. [Step]: [description] — e.g., Group By: Region, SUM(Revenue)
5. [Step]: [description] — e.g., Formula: Margin = Profit / Revenue * 100
6. Output A: [output dataset name] — [what this branch serves]
7. Output B: [output dataset name] — [what this branch serves] (if multi-output)

## Output Schemas

### Output A: [name]
| Column | Type | Source |
|--------|------|--------|
| [name] | [STRING/LONG/DOUBLE/DATE] | [which step produces it] |

### Output B: [name] (if multi-output)
| Column | Type | Source |
|--------|------|--------|
| [name] | [STRING/LONG/DOUBLE/DATE] | [which step produces it] |

## Data Freshness
| Field | Dataset | Earliest | Latest | Status |
|-------|---------|----------|--------|--------|
| [field] | [dataset] | [date] | [date] | OK / STALE (>6 months) |

## Assumptions
- [Any assumptions made due to insufficient context]

## Open Questions
- [Anything that still needs customer confirmation]
```

For multi-ETL layered designs, also include a **Pipeline Overview** that shows how ETLs chain together:

```markdown
# Pipeline Overview

L1 Bronze:
  ETL-1: CRM Cleanup → outputs: "Contacts — Clean", "Opps — Clean"
  ETL-2: Usage Staging → output: "Usage — Clean"

L2 Silver:
  ETL-3: Account Enrichment (joins Contacts + Opps + Usage) → output: "Account 360"

L3 Gold:
  ETL-4: Dashboard Metrics (aggregates Account 360) → outputs: "Exec Summary", "Rep Scorecard"
```

### Step 7: Confirm and Hand Off

Present all specs to the user. Ask:
- "Ready to build these? I can feed each spec into the ETL Builder."
- If the user confirms, format the spec as the `transformation_description` input for the ETL Builder.

The handoff output should be one paragraph **per ETL** (not per output):

> Build a Magic ETL called "[Name]" (Layer: [L1/L2/L3]) using [input datasets] (IDs: [uuids]). Pipeline: [step-by-step in plain English]. Outputs: "[output A name]" with columns [list], "[output B name]" with columns [list]. Domo instance: [instance].

---

## Tool Mapping

| Step | Tools |
|------|-------|
| Gather context | File system (read transcripts, emails, docs) |
| Discover datasets | `dataset_list`, `dataset_get`, `dataset_schema`, `dataset_profile` |
| Check existing ETLs | `dataflow_search`, `dataflow_list` |

## MCP Servers Required

- **ps_domo_mcp** (Domo Platform) — for dataset discovery, profiling, schema inspection, and checking existing ETLs

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
- Call `memory_store_artifact` for **ETLSpec**; `memory_remember` with layering choice, assumptions, and open questions.

---

## Guardrails

- **Design for native tiles.** Spec operations that map to real Magic ETL tiles (Filter, MergeJoin, GroupBy, ExpressionEvaluator, WindowAction, etc.). Don't spec SQL transforms unless native tiles can't handle the logic. See `../etl-builder/reference/etl-tiles.md` for the full catalog of what's natively available.
- **Validate data freshness.** Before building on any time-series or trend field, confirm it's actively populated. Stale fields (>6 months since last value) must be flagged and confirmed with the user before use.
- **Lead with stakeholder needs, not technical capabilities.** Do NOT propose ML models, backtesting frameworks, or statistical methods unless the stakeholder requirements explicitly call for predictive analytics. Default to the simplest solution that answers the stakeholder's question.
- **Mine context before asking questions.** Don't ask the user things that are already in the transcripts.
- **Ask about layering before designing.** Always assess complexity and ask the user's preference before committing to a pipeline architecture.
- **Consolidate by input affinity.** Transforms sharing the same inputs go in the same ETL with multiple output branches. Don't create separate ETLs for what can be branches.
- **Don't combine unrelated transforms.** Input affinity means shared inputs — not "everything in one ETL." If transforms have different sources and no shared lineage, they're separate ETLs.
- **Be specific.** Vague specs produce vague ETLs. Pin down exact column names, filter conditions, aggregation types.
- **Check for duplicates.** Always search for existing dataflows with similar names before speccing a new one.
- **Note assumptions.** If you're guessing, say so. Let the user correct before building.
- **Attribute requirements.** Link each spec back to the source (transcript timestamp, email date, SOW section).

---

## Related Skills

- **ETL Builder** (Build) — takes the spec output and creates the actual dataflow in Domo
- **Account 360** (Discover) — broader customer context for understanding data needs
