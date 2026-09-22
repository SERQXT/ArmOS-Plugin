---
name: credit-usage-estimator
description: "Estimate Domo credit consumption for a 500 Apps project by reading all available project artifacts (build spec, surface plan, discovery handoff, etc.) and applying credit cost formulas per feature. Trigger with 'estimate credits', 'credit estimate', 'how many credits', or via the Generate Credit Estimate button on the project page."
maturity: alpha
pipeline:
  phase: build
  sub_phase: cost-estimation
  position: 6
  output_type: output
  wave: 2
  state: ready
  inputs:
    - source: project-artifacts
      required: true
      data: "500 Apps project folder — BUILD-SPEC.md, SURFACE-PLAN.md, DISCOVERY-HANDOFF.md, INTAKE-FIELDS.md, NORTHSTAR.md, MVP notes, SAMPLE-DATA-PLAN.md"
  outputs:
    - name: credit-estimate
      format: markdown
      artifact: artifacts/CREDIT-ESTIMATE.md
      downstream:
        - agent: service-matchmaker
        - agent: sow-generator
---

# Credit Usage Estimator — Domo Credit Consumption Analysis

Reads all available project artifacts from a 500 Apps project, identifies every Domo feature being delivered, and calculates the expected annual credit consumption with a transparent per-line-item breakdown. Every number traces to a formula, an input, and a stated assumption.

This skill calculates credit costs. It does not make commercial decisions — package matching and pricing are handled by the Service Matchmaker.

## How It Works

```
Project Artifacts (BUILD-SPEC, SURFACE-PLAN, DISCOVERY-HANDOFF, etc.)
                    |
         Extract Domo Features Being Delivered
         (connectors, ETL, dashboards, AI, workflows, apps)
                    |
  +--------+--------+--------+--------+--------+--------+--------+--------+
  |        |        |        |        |        |        |        |        |
AI Chat  AI Agent  Workflows  ETL    Connectors Storage  Apps   Code
Queries  Tasks     Runs       Runs   Refreshes  Rows    Executions Engine
Formula  Formula   Formula   Formula  Formula  Formula  Formula  Formula
  |        |        |        |        |        |        |        |
  +--------+--------+--------+--------+--------+--------+--------+--------+
                    |
         Apply Usage Assumptions
         (Users, Frequency, Volume, Complexity)
                    |
         Calculate Per-Run Cost × Monthly Usage × 12
                    |
         Range: Low (80%) / Expected (100%) / High (150%)
                    |
         Rank Sensitivity Levers
                    |
         OUTPUT: artifacts/CREDIT-ESTIMATE.md
```

## Triggers

- "estimate credits for this project"
- "generate credit estimate"
- "how many credits will this use"
- "what's the credit cost"
- "credit estimate"
- Triggered via the **Generate Credit Estimate** button on the project page

---

## Step 1: Read All Available Project Artifacts

Read every artifact that exists in the project workspace. Not all will be present — work with what's available. More artifacts = more accurate estimate.

**Read these files (in order of importance):**

```
spec/BUILD-SPEC.md              ← PRIMARY: what Domo features get built
spec/SURFACE-PLAN.md            ← feature/surface plan: dashboards, apps, views
spec/SAMPLE-DATA-PLAN.md        ← data architecture: datasets, sizes, refresh
artifacts/DISCOVERY-HANDOFF.md  ← discovery brief: requirements, use cases
artifacts/INTAKE-FIELDS.md      ← what the customer asked for
objective/NORTHSTAR.md          ← business objective
documents/DISCOVERY-NOTES.md    ← discovery call notes: user counts, data volumes
artifacts/MVP1-NOTES.md         ← MVP1 scope (if exists)
artifacts/MVP2-NOTES.md         ← MVP2 scope (if exists)
spec/ENGAGEMENT-CONTEXT-COPY.md ← full engagement context
```

**From these artifacts, extract:**

| Signal | Where to find it | Default if missing |
|--------|------------------|--------------------|
| Data connectors (type, count) | BUILD-SPEC data architecture section | 2 connectors, mixed complexity |
| Data volume per connector | SAMPLE-DATA-PLAN, BUILD-SPEC | 1 GB per connector |
| Refresh frequency | SAMPLE-DATA-PLAN, BUILD-SPEC | Daily |
| ETL pipeline type | BUILD-SPEC (Magic ETL / SQL / federated) | Magic ETL |
| ETL complexity | BUILD-SPEC pipeline section | Moderate |
| Dashboard/card count | SURFACE-PLAN, BUILD-SPEC | 5 dashboards, 20 cards |
| AI Chat enabled? | BUILD-SPEC, NORTHSTAR, SURFACE-PLAN | No unless explicitly mentioned |
| AI Chat query complexity | BUILD-SPEC, DISCOVERY-NOTES | Basic queries |
| AI Agent tasks | BUILD-SPEC automation/workflow section | None unless explicitly mentioned |
| Workflow count and triggers | BUILD-SPEC automation section | 0 workflows |
| Workflow complexity | BUILD-SPEC (linear/branching/loops) | Linear |
| App Studio / DDX apps | BUILD-SPEC, SURFACE-PLAN | 0 unless explicitly mentioned |
| Code Engine functions | BUILD-SPEC | 0 unless explicitly mentioned |
| User count | DISCOVERY-NOTES, INTAKE-FIELDS, ENGAGEMENT-CONTEXT | 10 users |
| User role mix | DISCOVERY-NOTES, INTAKE-FIELDS | All standard users |
| Distribution method | BUILD-SPEC (embedded/PDP/scheduled) | In-app only |
| MVP1 vs MVP2 scope split | MVP1-NOTES, MVP2-NOTES, BUILD-SPEC | Single phase |

**If a signal is missing, use the default and flag it as an assumption in the output.**

---

## Step 2: Calculate AI Chat Credits

**Formula:**
```
AI Chat Credits = Σ (Queries per Tier × Credit Rate × Complexity Multiplier) × Users × 12
```

**Credit Rates per Query:**
| Tier | Rate | When to apply |
|------|------|--------------|
| Basic query | 0.1 credits | Simple lookups, single-source questions |
| Complex query with visualization | 0.5 credits | Cross-dataset analysis, generated charts |
| Multi-source query | 1.0 credits | Federated queries, multi-dataset joins |

**Complexity Multipliers:**
| Complexity | Multiplier | Indicator |
|-----------|-----------|-----------|
| Simple questions | 1.0× | "Show me X" type queries |
| Complex analysis | 2.0× | "Why did X change" or trend analysis |
| Custom visualizations | 3.0× | AI-generated dynamic charts per query |

**Default Monthly Volume per User:** 100 queries/month
- If discovery notes indicate heavy AI Chat usage → 200 queries/month
- If the solution emphasizes AI-powered insights → use 150 queries/month
- If AI Chat is a secondary feature → 50 queries/month

**Precomputed vs Dynamic Strategy:**
- **Precomputed summaries** (AI runs on schedule, users see cached results): fewer AI Chat credits but more ETL credits. Apply 0.3× to AI Chat volume, add the precompute runs to ETL.
- **Dynamic per-filter** (AI runs fresh per user interaction): full AI Chat credits. This is the default unless BUILD-SPEC indicates precomputation.

---

## Step 3: Calculate AI Agent Credits

**Formula:**
```
AI Agent Credits = Σ (Executions × Base Credits × (1 + Function Complexity)) × 12
```

**Base Credits per Execution:**
| Agent Complexity | Credits | Indicator |
|-----------------|---------|-----------|
| Simple | 5 credits | Single-step, no external calls |
| Moderate | 10 credits | Multi-step, basic function calls |
| Complex | 25 credits | Multi-step, API calls, branching logic |

**Function Complexity Adder:**
| Complexity | Adder | Indicator |
|-----------|-------|-----------|
| No external functions | 0 | Self-contained logic |
| Basic functions | 0.5 | File ops, simple API calls |
| Advanced functions/APIs | 1.0 | External integrations, complex orchestration |

**Default:** 50 executions/month per agent. Adjust based on workflow trigger frequency from BUILD-SPEC.

---

## Step 4: Calculate Workflow Credits

**Formula:**
```
Workflow Credits = Σ (Runs × Credits per Run × Complexity Multiplier) × 12
```

**Credits per Run:**
| Workflow Type | Credits/Run | Indicator |
|--------------|------------|-----------|
| Simple (linear, few steps) | 2 credits | Form submission → notification |
| Moderate (branching, conditions) | 5 credits | Approval chains, conditional routing |
| Complex (loops, AI tasks, APIs) | 15 credits | Iterative processing, AI agent steps |

**Complexity Multipliers:**
| Flow Type | Multiplier | Indicator |
|----------|-----------|-----------|
| Linear | 1.0× | A → B → C |
| Branching logic | 1.5× | If/else paths, conditional routing |
| Loops/iterations | 2.0× | For-each, retry logic, batch processing |

**Default:** 100 runs/month per workflow. Adjust by trigger:
- Manual trigger → 20 runs/month
- Scheduled (daily) → 30 runs/month
- Event-driven → 200 runs/month
- Real-time → 500+ runs/month

---

## Step 5: Calculate Data Processing (ETL) Credits

**Formula:**
```
Data Processing Credits = Σ (Data Volume GB × Credit Rate × Frequency Multiplier) × 12
```

**Credit Rates by Processing Type:**
| Type | Rate (per GB) | Indicator |
|------|--------------|-----------|
| Basic ETL (Magic ETL) | 10 credits/GB | Standard transforms, joins, filters |
| Magic ETL with AI features | 25 credits/GB | AI-powered transforms, classification |
| Custom scripting (SQL, Python) | 50 credits/GB | Jupyter, Code Engine transforms |

**Refresh Frequency Multipliers:**
| Frequency | Multiplier | Monthly factor |
|----------|-----------|---------------|
| Static / one-time | 0.1× | 1 run/month (maintenance) |
| Daily | 1.0× | 30 runs/month |
| Hourly | 2.0× | 720 runs/month |
| Real-time / streaming | 5.0× | Continuous |

---

## Step 6: Calculate Connector Credits

**Formula:**
```
Connector Credits = Σ (Refresh Count × Data Volume GB × Base Rate) × 12
```

**Base Rates:**
| Connector Type | Rate | Examples |
|---------------|------|---------|
| Cloud (API-based) | 5 credits/GB/refresh | Salesforce, HubSpot, Google Sheets |
| Database (direct) | 3 credits/GB/refresh | MySQL, Postgres, SQL Server |
| File-based | 1 credit/GB/refresh | SFTP, S3, local file upload |
| Federated / live query | 8 credits/query | Snowflake, BigQuery, Redshift |

---

## Step 7: Calculate Data Storage Credits

**Formula:**
```
Storage Credits = Total Rows (millions) × 0.5 credits/million rows/month × 12
```

Estimate total rows from SAMPLE-DATA-PLAN or BUILD-SPEC dataset descriptions. Default: 10M rows if unspecified.

---

## Step 8: Calculate App Studio / Code Engine Credits

**App Studio:**
```
App Credits = App Views × 0.1 credits/view × Monthly Active Users × 12
```
Default: 100 views/user/month if app is interactive.

**Code Engine:**
```
Code Engine Credits = Function Invocations × Credits per Invocation × 12
```
- Simple function: 0.5 credits/invocation
- Complex function (API calls, large payloads): 2 credits/invocation
Default: 500 invocations/month per function.

---

## Step 9: Assemble the Estimate

### 9a. Build the Line Item Table

For EACH use case or component identified in the BUILD-SPEC, create a row for each applicable credit category:

```
| Use Case | Feature | Component | Credits/Run | Runs/Month | Monthly Credits | Annual Credits | Assumptions |
```

### 9b. Calculate Range

| Scenario | Multiplier | Meaning |
|----------|-----------|---------|
| Low | 0.80× | Optimized: fewer users than planned, batch refresh, simpler queries |
| Expected | 1.00× | Current assumptions hold |
| High | 1.50× | Heavy adoption: more users, real-time refresh, complex AI, data growth |

### 9c. Rank Sensitivity Levers

Calculate the delta each assumption creates. Rank from highest to lowest impact:

1. **Number of users** — multiplies AI Chat, AI Agent, App Studio volumes
2. **Refresh frequency** — 1x (daily) vs 2x (hourly) vs 5x (real-time) on all ETL/connector credits
3. **AI query complexity** — basic (0.1) vs complex (0.5) vs multi-source (1.0) per query
4. **Precomputed vs dynamic filtering** — shifts credits between ETL and AI Chat
5. **Data volume growth** — affects ETL, connectors, storage over time
6. **Workflow trigger frequency** — manual (20/mo) vs event-driven (200/mo) vs real-time (500/mo)

For each lever, calculate: "If this assumption doubles, the estimate increases by X%."

---

## Step 10: Output the Credit Estimate

**Save the output as `artifacts/CREDIT-ESTIMATE.md`** in the project workspace.

Format the output exactly as follows:

---

### Output Template

```markdown
# Credit Estimate: [Project Name]

**Generated:** [Date]
**Based on:** [List which artifacts were read]
**Artifacts not available:** [List which were missing — these drive assumptions]

---

## Executive Summary

- **Estimated annual credit consumption: [Expected] credits** (range: [Low] – [High])
- **Top cost drivers:**
  1. [Feature] — [X]% of total ([Y] credits/year) — [why]
  2. [Feature] — [X]% of total ([Y] credits/year) — [why]
  3. [Feature] — [X]% of total ([Y] credits/year) — [why]
- **Most sensitive assumptions:**
  1. [Lever] — if doubled, estimate increases by [X]%
  2. [Lever] — if doubled, estimate increases by [X]%
  3. [Lever] — if doubled, estimate increases by [X]%
- **MVP1 vs MVP2:** [breakdown if applicable, or "Single phase"]
- **Key risks:** [Any cost risks or watch items]

---

## Detailed Breakdown

| Use Case | Feature | Component | Credits/Run | Runs/Month | Monthly Credits | Annual Credits | Assumptions |
|----------|---------|-----------|-------------|------------|-----------------|----------------|-------------|
| [row per component per use case] | | | | | | | |
| | | **TOTAL (Expected)** | | | **[monthly]** | **[annual]** | |

---

## Range Analysis

| Scenario | Annual Credits | vs Expected | Key Driver |
|----------|---------------|-------------|------------|
| Low (80%) | [X] | -20% | [what changes in the optimistic case] |
| Expected | [X] | baseline | Current assumptions |
| High (150%) | [X] | +50% | [what changes in the pessimistic case] |

---

## Sensitivity Analysis

| Rank | Assumption | Current Value | If Doubled | Credit Impact | % Change |
|------|-----------|--------------|------------|--------------|---------|
| 1 | [lever] | [value] | [new value] | +[X] credits/year | +[Y]% |
| 2 | [lever] | [value] | [new value] | +[X] credits/year | +[Y]% |
| ... | | | | | |

---

## Assumptions Register

| # | Assumption | Value Used | Source | Confidence | Impact if Wrong |
|---|-----------|-----------|--------|-----------|----------------|
| 1 | [assumption] | [value] | [artifact or default] | HIGH/MED/LOW | [consequence] |
| ... | | | | | |

---

**Prepared by:** Credit Usage Estimator
**Output Type:** OUTPUT
**Saved to:** artifacts/CREDIT-ESTIMATE.md
```

---

## Guardrails

- **Every number traces to a formula.** No magic numbers. If a rate or multiplier is used, cite it.
- **Every assumption is explicit.** If an input is missing, state the default used and flag it.
- **Do not reverse-engineer from a budget.** This is a bottom-up estimate from technical signals.
- **Do not make commercial decisions.** Credit estimates feed into Service Matchmaker — do not recommend packages or pricing.
- **Separate MVP phases when possible.** If MVP1-NOTES and MVP2-NOTES exist, break the estimate into phases.
- **When in doubt, use the higher estimate.** It's better to over-estimate and optimize than surprise the customer with overages.

## Related Skills

- **Service Matchmaker** — consumes this estimate to recommend engagement packages
- **SOW Generator** — includes credit estimates in commercial terms
- **500 Apps Pipeline** — this skill runs within the 500 Apps project context
