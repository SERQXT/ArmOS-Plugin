---
name: scope-builder
deprecated: true
superseded_by: engagement-scope
tier: 2
description: "Translate the locked Solution Blueprint into a complete Scope Model — workstreams, deliverables, in-scope and out-of-scope definitions, assumptions, exclusions, and customer responsibilities. Automatically detects and invokes sub-tools for Domo Everywhere, Automation, and App Studio when those workstreams are in scope. Trigger with 'build scope for [account]', 'define scope for [account]', 'scope out [account]', or 'create scope model for [account]'. Requires a locked Solution Blueprint."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: scoping
  position: 4
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — use cases, platform components, operating model, dependencies, assumptions
    - agent: discovery-synthesizer
      required: true
      data: validated Discovery Record — technical requirements by workstream, complexity signals
    - agent: connection-strategy
      required: true
      data: Connection Strategy — recommended connection methods, authentication complexity, prerequisites, risks
  outputs:
    - name: scope-model
      format: markdown
      downstream:
        - agent: loe-estimator
        - agent: service-matchmaker
        - agent: sow-generator
  data_sources:
    - tool: fileset_search
      required: true
    - tool: scope-everywhere
      required: false
      invoke_when: "Solution Blueprint includes external users, embed, Domo Everywhere, subscriber instance, or Domo Publish"
    - tool: scope-automation
      required: false
      invoke_when: "Solution Blueprint includes workflows, automation, alerts, Code Engine, AI agents, or write-backs to external systems"
    - tool: scope-app-studio
      required: false
      invoke_when: "Solution Blueprint includes App Studio, DDX Bricks, custom apps, or pixel-perfect branded experiences"
  phase_gate: true
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Scope Builder — Define What Is In and Out

Translates the locked Solution Blueprint into a complete, SOW-ready Scope Model. This skill defines every workstream, deliverable, assumption, exclusion, and customer responsibility. It processes standard workstreams inline and automatically invokes sub-tools when specialist areas — Domo Everywhere, Automation, or App Studio — are detected in the blueprint.

The Scope Model is the artifact the LOE Estimator runs against and the SOW Generator builds from. Scope control is won or lost here. Every assumption and exclusion stated explicitly now prevents a change request later.

## How It Works

```
Locked Solution Blueprint + Validated Discovery Record
                        |
           Detect in-scope workstreams
                        |
     +------------------+------------------+
     |                  |                  |
Standard           [If in scope]     [If in scope]     [If in scope]
Workstreams        scope-everywhere   scope-automation  scope-app-studio
(inline)               ↓                  ↓                  ↓
     |             Sub-tool           Sub-tool           Sub-tool
     |             output             output             output
     +------------------+------------------+------------------+
                        |
              Fold all outputs together
                        |
         Define In-Scope / Out-of-Scope / Assumptions
                        |
            🔵 OUTPUT: Scope Model
                        |
         → LOE Estimator + Service Matchmaker + SOW Generator
```

## Triggers

- "build scope for [account]"
- "define scope for [account]"
- "scope out [account]"
- "create scope model for [account]"
- "what are we building for [account]"
- "break down the work for [account]"

**Prerequisite:** Solution Blueprint must be LOCKED. If status is DRAFT, prompt SSD to lock it first.

## Execution Flow

### Step 1: Load Inputs and Validate Prerequisites

```
solution-blueprint (required) → confirm status = LOCKED
discovery-synthesizer output  → load technical requirements by workstream

If Solution Blueprint is DRAFT:
  → Stop. Prompt SSD: "The Solution Blueprint for [account] is still in DRAFT.
    Please review and lock it before running the Scope Builder."
```

### Step 2: Detect Which Workstreams Are In Scope

Read the Solution Blueprint platform components and the Discovery Record technical requirements. Map each to a workstream. Flag optional workstreams that require sub-tool invocation.

#### Standard Workstreams (always processed inline if in scope)

| Workstream | In Scope? | Signal to Look For |
|------------|-----------|-------------------|
| Data Connection | Detect | Any data source listed in Discovery Record |
| Data Transformation & Architecture | Detect | Any ETL, modeling, or multi-source requirement |
| Visualization & Dashboards | Detect | Any dashboard, KPI, or reporting requirement |
| Governance | Detect | PDP, row-level security, user roles, compliance |
| Solution Rollout & Adoption | Detect | Training, enablement, user onboarding |
| Project Management | Always included | 15–20% overhead — always in scope |

#### Sub-Tool Workstreams (invoke sub-tool when detected)

| Sub-Tool | Invoke When Blueprint / Discovery Record Contains |
|----------|--------------------------------------------------|
| `scope-everywhere` | External users, embed, Domo Everywhere, subscriber instance, Domo Publish, white-labeling |
| `scope-automation` | Workflows, automation, alerts, Code Engine, AI agents, write-back, external system triggers |
| `scope-app-studio` | App Studio, DDX Bricks, custom apps, pixel-perfect design, branded experience, custom interactivity |

If a sub-tool signal is detected, invoke that sub-tool before proceeding with standard workstream scoping. Fold the sub-tool output into the Scope Model.

### Step 3: Scope Standard Workstreams

For each standard workstream that is in scope, define the following. Use `fileset_search` to reference estimation methodology and scoping guidance when classifying complexity.

---

#### Workstream: Data Connection

```
fileset_search("data connection scoping connector types")
→ Reference connector type guidance and complexity signals
```

For each data source in the Discovery Record:

| Source | Connector Type | Datasets in Scope | Complexity | Notes |
|--------|---------------|-------------------|------------|-------|
| [Name] | [API / DB / File / Workbench / Federated] | [#] | Very Easy / Easy / Standard / Difficult / Very Complex | [Access method, QA requirements] |

**In scope:**
- Connect to [Source 1] via [connector type], ingest [# datasets]
- Connect to [Source 2] via [connector type], ingest [# datasets]

**Out of scope:**
- [e.g., Any source systems not listed above]
- [e.g., Custom connector development unless explicitly listed]
- [e.g., On-premises database access via Workbench unless confirmed]

**Assumptions:**
- Customer will provide credentials and access before project start
- Data is accessible in the format described; reformatting is not included
- [Any source-specific assumptions]

**Customer responsibilities:**
- Provide system credentials and access by [milestone]
- Confirm dataset list and report definitions before connection begins
- Validate that connected data matches source system within agreed tolerance

---

#### Workstream: Data Transformation & Architecture

```
fileset_search("data transformation architecture ETL scoping")
→ Reference ETL complexity guidance and top-down vs. bottom-up architecture approach
```

**In scope:**
- Build Magic ETL dataflows to [describe transformations — joins, filters, business rules]
- Create unified data model for [use case(s)]
- [Any DataFusion, writeback, or specific transformation deliverables]

**Out of scope:**
- [e.g., Transformation of data outside Domo (customer's source system ETL not included)]
- [e.g., Historical data migration beyond [X] years]
- [e.g., Real-time streaming unless confirmed]

**Complexity signals for LOE Estimator:**
- ETL Logic Complexity: Low / Medium / High — [rationale]
- Data Volume / History: Low / Medium / High — [rationale]
- Refresh Frequency: Low / Medium / High — [rationale]
- Metric Complexity: Low / Medium / High — [rationale]
- Integrated Sources: Low (1–2) / Medium (3–5) / High (6+)

**Assumptions:**
- Source data is reasonably clean; data cleansing beyond standard transformation is out of scope
- Customer will validate finalized datasets before dashboard build begins
- [Any architecture-specific assumptions]

---

#### Workstream: Visualization & Dashboards

```
fileset_search("visualization dashboard scoping KPI estimation")
→ Reference visualization complexity and estimation guidance
```

**In scope:**
- [Dashboard name 1] — [audience, purpose, KPI count estimate]
- [Dashboard name 2] — [audience, purpose, KPI count estimate]
- [Drill-down pages, sub-pages, or story pages if applicable]

**Out of scope:**
- [e.g., Dashboards not listed above]
- [e.g., Replication of existing Tableau / Power BI reports unless listed]
- [e.g., Custom App Studio components — see scope-app-studio if applicable]

**Complexity signals for LOE Estimator:**
- KPI count estimate: [range]
- Breakdown dimensions: [count and list]
- Branding requirement: Low / Standard / High — [rationale]
- Visual complexity: Low / Standard / High — [rationale]

**Assumptions:**
- Dashboard requirements will be finalized during Solution & Architecture Design phase
- Customer will provide brand guidelines before visualization build begins
- Up to [X] rounds of revision are included; additional rounds are out of scope

---

#### Workstream: Governance

```
fileset_search("governance PDP security scoping")
→ Reference governance complexity guidance
```

**In scope:**
- [PDP rules — list by dataset if known]
- [User role and group setup — roles and count estimate]
- [Admin training and documentation if applicable]

**Out of scope:**
- [e.g., SSO / identity provider integration unless listed]
- [e.g., Data retention or archiving configuration]
- [e.g., Governance dashboard build unless listed]

**Complexity signals for LOE Estimator:**
- Governance overhead: Low (5%) / Medium (7%) / High (10%+) — [rationale]

**Assumptions:**
- Customer will provide user list and role assignments before governance setup
- PDP rules will be based on existing user attributes; custom attribute creation is out of scope unless listed

---

#### Workstream: Solution Rollout & Adoption

```
fileset_search("rollout adoption training scoping")
→ Reference rollout and enablement guidance
```

**In scope:**
- [Training sessions — count, audience, format]
- [Documentation — runbook, user guide, admin guide as applicable]
- [Hypercare / go-live support period if applicable]

**Out of scope:**
- [e.g., Ongoing training after project close]
- [e.g., Change management program beyond standard enablement]

**Complexity signals for LOE Estimator:**
- Rollout overhead: Low (5%) / Medium (7%) / High (10%+) — [rationale]

---

#### Workstream: Project Management

Always included. Overhead percentage determined by project complexity.

**Complexity signals for LOE Estimator:**
- PM overhead: 15% / 18% / 20%+ — [rationale]
- Drivers for elevated PM: tight timeline, cross-team dependencies, strategic account, Engagement Manager involvement

### Step 4: Fold In Sub-Tool Outputs

If `scope-everywhere`, `scope-automation`, or `scope-app-studio` were invoked, insert their Scope Model sections here. Each sub-tool returns a structured scope block in the same format as the standard workstreams above (in scope, out of scope, complexity signals, assumptions, customer responsibilities).

### Step 5: Define the Master In-Scope / Out-of-Scope Summary

Consolidate all workstream outputs into a single master list. This becomes the top of the SOW Initiative Scope section.

**In-scope summary:** Every deliverable across all workstreams, stated in one place.
**Out-of-scope summary:** Everything explicitly excluded, stated in plain language. If it is not on this list and comes up later, it is a change request.

### Step 6: Define Customer Responsibilities

Consolidated list of everything the customer must provide, do, or decide — across all workstreams. This is critical for the SOW and for setting expectations at kickoff.

| Responsibility | Owner | Required By | Consequence if Delayed |
|---------------|-------|-------------|----------------------|
| [e.g., Provide all system credentials] | Customer IT | Project start | Blocks data connection |
| [e.g., Assign project lead and data SME] | Customer | Kickoff | Blocks requirements gathering |
| [e.g., Complete UAT within 5 business days] | Customer | End of each phase | Delays project timeline |

### Step 7: Compile the Scope Model

---

## Output Template

```markdown
# Scope Model: [Account Name]
**Version:** 1.0 — DRAFT
**Prepared:** [Date] | **SSD:** [Name]
**Based on:** Solution Blueprint v[X] (LOCKED) | Discovery Record v[X] (VALIDATED)
**Status:** DRAFT — Pending SSD Review and Lock

---

## Scope Summary

### In Scope

| Workstream | Key Deliverables |
|------------|----------------|
| Data Connection | [Summary — X sources, Y datasets] |
| Data Transformation | [Summary — unified data model, X dataflows] |
| Visualization | [Summary — X dashboards, Y KPIs] |
| Domo Everywhere | [If in scope — embed type, audience] |
| Automation | [If in scope — X workflows, alert setup] |
| App Studio | [If in scope — X custom apps] |
| Governance | [Summary — PDP rules, user/group setup] |
| Rollout & Adoption | [Summary — X training sessions, documentation] |
| Project Management | [Included — [X]% overhead] |

### Out of Scope

- [Item 1 — stated plainly in customer language]
- [Item 2]
- [Item 3]
- [Add all explicit exclusions — every workstream should contribute at least one]

---

## Workstream Detail

### Data Connection
**In scope:**
- [Deliverable 1]
- [Deliverable 2]

**Out of scope:**
- [Exclusion]

**Assumptions:**
- [Assumption]

**Customer responsibilities:**
- [Responsibility]

**LOE inputs:** Connector types and complexity signals → [see LOE Estimator]

---

### Data Transformation & Architecture
[Same structure]

---

### Visualization & Dashboards
[Same structure]

---

### [Domo Everywhere — if invoked]
[Sub-tool output block inserted here]

---

### [Automation — if invoked]
[Sub-tool output block inserted here]

---

### [App Studio — if invoked]
[Sub-tool output block inserted here]

---

### Governance
[Same structure]

---

### Solution Rollout & Adoption
[Same structure]

---

### Project Management
**Included:** [X]% of total development hours
**Rationale:** [What drove the percentage selected]

---

## Customer Responsibilities

| Responsibility | Owner | Required By | Consequence if Delayed |
|---------------|-------|-------------|----------------------|
| [Responsibility] | [Role] | [Milestone] | [Impact] |

---

## Assumptions and Exclusions Register

### Assumptions
| # | Assumption | Workstream | Impact If Wrong |
|---|-----------|------------|----------------|
| 1 | [Assumption] | [Workstream] | [Impact] |

### Exclusions
| # | Exclusion | Why Excluded | Path to Include |
|---|-----------|-------------|----------------|
| 1 | [Item] | [Not in blueprint / not confirmed] | [Change request / Phase 2] |

---

## LOE Inputs Summary

*Structured inputs for the LOE Estimator. Do not edit — generated from workstream detail above.*

| Workstream | Signal | Classification |
|------------|--------|---------------|
| Data Connection | Connector types and counts | [Per source above] |
| Transform | Logic / Volume / Frequency / Metrics / Sources | Low-Med-High per signal |
| Visualization | KPI count / Breakdowns / Branding / Complexity | [Values above] |
| Everywhere | Embed type / User count / PDP | [From sub-tool if invoked] |
| Automation | Workflow type / Count / Integrations | [From sub-tool if invoked] |
| App Studio | App count / Complexity | [From sub-tool if invoked] |
| Governance | Overhead % | Low / Medium / High |
| Rollout | Overhead % | Low / Medium / High |
| PM | Overhead % | 15% / 18% / 20%+ |

---

**Prepared by:** CS Solutions Scope Builder Agent
**Sub-tools invoked:** [scope-everywhere / scope-automation / scope-app-studio — list those used]
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Scoping → Position 4
**Phase Gate:** YES — SSD must lock Scope Model before LOE Estimator proceeds
```

---

## Guardrails

- **Do not run if the Solution Blueprint is DRAFT.** Scoping a draft blueprint produces a draft scope. Lock the blueprint first.
- **Every workstream must have an explicit out-of-scope list.** Vague scope is how change requests happen. If something is not listed, the default answer must be "not in scope."
- **Assumptions must be specific and consequential.** "Customer will cooperate" is not an assumption. "Customer will provide database credentials by project start; delay blocks data connection" is an assumption.
- **Sub-tools must be invoked, not skipped.** If a sub-tool signal is detected in the blueprint and the sub-tool is not invoked, the scope will be incomplete. Do not estimate Domo Everywhere, Automation, or App Studio inline — these workstreams are complex enough that skipping the sub-tool will produce an inaccurate scope.
- **LOE inputs are scoping outputs, not estimates.** The Scope Builder classifies complexity signals (Low / Medium / High, connector types, KPI counts). It does not calculate hours — that is the LOE Estimator's job.
- **Customer responsibilities must be specific and owned.** "Customer provides data" is not a responsibility. "Customer IT provides database credentials and VPN access by project start; delay blocks the data connection workstream" is a responsibility.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Scoping methodology, workstream guidance, estimation signal classification |
| scope-everywhere | Conditional | Full Domo Everywhere scope block when embed/distribution is in scope |
| scope-automation | Conditional | Full automation scope block when workflows/AI/Code Engine is in scope |
| scope-app-studio | Conditional | Full App Studio scope block when custom apps/DDX is in scope |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: scope decisions made, in-scope vs out-of-scope items, hours allocation, phase breakdown, assumptions.
- Call `memory_store_artifact` to persist the scope document in `engagement-artifacts`.

---

## Related Skills

- **Solution Blueprint** → Upstream — locked blueprint this skill builds from
- **Discovery Synthesizer** → Upstream — validated technical requirements and complexity signals
- **scope-everywhere** → Sub-tool — invoked when distribution workstream is in scope
- **scope-automation** → Sub-tool — invoked when automation workstream is in scope
- **scope-app-studio** → Sub-tool — invoked when App Studio workstream is in scope
- **LOE Estimator** → Downstream — runs estimation formulas against completed Scope Model
- **Service Matchmaker** → Downstream — maps scope to packages and commercial structure
- **SOW Generator** → Downstream — formalizes Scope Model into contractual language
