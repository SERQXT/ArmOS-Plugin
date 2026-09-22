---
name: engagement-scope
tier: t1
bucket: engagement-scoping
status: draft
visibility: anyone
description: "Scope a Domo CS engagement from first principles — identify workstreams, define deliverables, call out exclusions, surface LOE inputs, and flag specialist areas (Everywhere, Automation, App Studio) that need dedicated sub-skill treatment. Use when an SSD needs a complete Scope Model before estimation and SOW generation."
tools: []
---

# engagement-scope — Engagement Scoping Orchestrator

Translates discovery outputs (Solution Blueprint, Discovery Record) into a Scope Model that drives every downstream artefact: LOE estimate, service selection, and SOW language. This skill handles the core judgment work — which workstreams are in scope, how complex each one is, what is explicitly out of scope, and what the customer must bring to the table.

Scoping is where scope control is won or lost. Every ambiguity left here becomes either a change request or a delivery problem.

## When to use

- "Scope a new customer engagement for [account]"
- "Size this customer's CS work"
- "Define scope for [account] before we write the SOW"
- "What are we building for [account] and how long will it take?"
- "Build the scope model for [account]"
- "Break down the work for [account] — what's in, what's out"

## When NOT to use

- If you need hour-level estimates with multiplier tables and confidence bands, use `loe-estimator` — that skill runs the Domo estimation formulas against a completed Scope Model. `engagement-scope` produces the Scope Model; `loe-estimator` converts it to hours.
- If the engagement involves deep-dive scoping of a single specialist workstream (Domo Everywhere distribution model, automation/workflow design, or App Studio custom app components), the dedicated discovery skills in the `ps-*` family go further: `ps-discovery-questionnaire`, `ps-current-state-assessment`, `ps-sow-generator`, `ps-stakeholder-map`, `ps-use-case-inventory`, and `ps-discovery-readout` are all distinct artefacts, not depth modes of scoping.
- If the Solution Blueprint is still in DRAFT, stop. Lock the blueprint before running scope. Scoping a draft produces a draft scope.

## Judgment framework

### Step 1: Validate the prerequisite

Confirm the Solution Blueprint is LOCKED. If it is DRAFT, surface this to the SSD before proceeding.

### Step 2: Detect in-scope workstreams

Read the Solution Blueprint and Discovery Record. Map each platform component and requirement to a workstream. Standard workstreams:

| Workstream | Always in scope? | Detection signal |
|---|---|---|
| Data Connection | Detect | Any data source in Discovery Record |
| Data Transformation & Architecture | Detect | ETL, modeling, multi-source requirements |
| Visualization & Dashboards | Detect | Dashboard, KPI, or reporting requirement |
| Governance | Detect | PDP, row-level security, user roles, compliance |
| Solution Rollout & Adoption | Detect | Training, enablement, user onboarding |
| Project Management | Always | 15–20% overhead — always included |

Specialist workstreams requiring separate treatment:

| Signal in Blueprint | Specialist area |
|---|---|
| External users, embed, Domo Everywhere, Domo Publish, subscriber instance | Domo Everywhere distribution |
| Workflows, automation, alerts, Code Engine, AI agents, write-backs | Automation & AI |
| App Studio, DDX Bricks, custom apps, pixel-perfect branded experience | App Studio custom development |

When a specialist signal is present, this skill surfaces it clearly with the scoping questions that need answers before LOE can proceed. It does not silently absorb specialist workstreams into generic estimates.

### Step 3: Scope each standard workstream

For each in-scope workstream, define:
- What is explicitly **in scope** (deliverable by deliverable)
- What is explicitly **out of scope** (every workstream contributes at least one exclusion)
- Assumptions (specific and consequential — "Customer will provide credentials by project start; delay blocks data connection")
- Customer responsibilities (owned and dated where possible)
- LOE complexity signals for `loe-estimator`

### Step 4: Classify LOE complexity signals

Classify each signal at Low / Medium / High (not hours — that is `loe-estimator`'s job):

- **Data Connection:** connector types, dataset count, access method complexity
- **Transform:** ETL logic complexity, data volume, refresh frequency, metric complexity, source count
- **Visualization:** KPI count, breakdown dimensions, branding requirement, visual complexity
- **Governance:** PDP complexity, user/group count
- **Rollout:** training session count and audience, documentation scope

### Step 5: Consolidate into Scope Model

Produce a master in-scope / out-of-scope summary, customer responsibilities table, assumptions register, and LOE inputs summary.

## Design principles

- **Explicit beats vague.** If something is not on the out-of-scope list, it is a change request waiting to happen. Every ambiguity gets resolved to a named in or out decision.
- **Specialist signals get flagged, not absorbed.** When Everywhere, Automation, or App Studio signals appear, surface them with the open questions — do not estimate them inline as "high complexity" of a standard workstream.
- **LOE inputs are scoping outputs, not estimates.** This skill classifies complexity signals. Hour calculations belong in `loe-estimator`.
- **Customer responsibilities must be owned and consequential.** "Customer provides data" is not a responsibility. "Customer IT provides database credentials by project start; delay blocks the data connection workstream" is a responsibility.
- **Assumptions must be specific.** "Customer will cooperate" fails the specificity test. The assumption should state what happens if it is wrong.
