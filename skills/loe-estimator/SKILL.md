---
name: loe-estimator
tier: t1
bucket: engagement-scoping
maturity: alpha
owner: Andrew Ferguson
description: "Run the Domo estimation formulas against a completed Scope Model to produce a workstream-by-workstream hour breakdown, total LOE range, confidence assessment, and risk flags. Explicitly scoped to minimum viable product delivery with expected tool synergy built in. Trigger with 'estimate the LOE for [account]', 'run the estimate for [account]', 'calculate hours for [account]', or 'how many hours for [account]'. Requires a locked Scope Model from the Scope Builder."
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: estimation
  position: 5
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: scope-builder
      required: true
      data: locked Scope Model — LOE inputs summary, workstream complexity signals, connector types, KPI counts, automation classifications
  outputs:
    - name: loe-estimate
      format: markdown
      downstream:
        - agent: service-matchmaker
        - agent: sow-generator
  data_sources:
    - tool: fileset_search
      required: true
      fileset_id: "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
      note: "Primary: S3 bucket. Fallback: Domo FileSet ID e5b7e2e9-79ed-499d-95ff-fc9d74157d24 via /api/content/v1/filesets/{id}/aiSearch"
  phase_gate: false
---

## Scoping Reference Documents

Use the shared scoping reference documents from S3 as the authoritative runtime guidance. Fall back to the Domo FileSet if S3 is unavailable.

**Primary — S3:**
- Live scoping templates: `s3://armos-workspace-676897632200/cs-templates/scoping/`
- Sync command: `aws s3 sync "s3://armos-workspace-676897632200/cs-templates/scoping/" ./templates/scoping/ --region us-east-2`
- Single file: `aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/Domo Project Estimation & Calculation Methodology.docx" ./templates/scoping/ --region us-east-2`

**Fallback — Domo FileSet:**
- FileSet ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24`
- Search endpoint: `POST /api/content/v1/filesets/e5b7e2e9-79ed-499d-95ff-fc9d74157d24/aiSearch`
- Query: `{"query": "estimation calculation methodology formulas multipliers", "topK": 5}`
- Use `fileset_search("Domo estimation calculation methodology")` in Code Engine context

Read the downloaded or retrieved document and extract the relevant formulas and multiplier tables before calculating.

---

# LOE Estimator — Minimum Viable Product Workstream Effort Calculation

Runs the Domo estimation methodology formulas against the completed Scope Model to produce a transparent, workstream-by-workstream hour breakdown and total LOE range. Every number is traceable to its formula, its inputs, and the classification decisions made in the Scope Builder.

This skill calculates effort for the **minimum viable product** — the fewest hours required to deliver the agreed scope with quality. It does not pad for scope creep, hypothetical complexity, or features not confirmed in the locked Scope Model.

## Estimation Philosophy — MVP First, No Bloat

**The fundamental rule: estimate what the locked scope requires to build well, nothing more.**

- **MVP by default.** Every deliverable is scoped to what it needs to be, not what it could be. No scope inflation, no gold-plating hours, no "just in case" padding.
- **Tool synergy is real and must be credited.** Domo's native platform capabilities (Magic ETL, Beast Mode, DataFlow chains, Workflows, Publish Groups, PDP Policies) reduce custom development time. Where native tools handle the work, estimate accordingly — do not assume custom-build hours for functionality that Domo handles natively.
- **Efficiency is assumed, not aspirational.** Experienced Domo delivery follows repeatable patterns. Estimate for a competent team executing a clear scope, not for every possible confusion or delay.
- **Risks are surfaced, not absorbed.** When a risk might add hours, flag it explicitly in the risk register. Do not silently pad to cover it — that hides information the SSD needs to make commercial decisions.
- **The estimate never chases a budget.** If the result does not fit the customer's budget, that is the Service Matchmaker's and SSD's problem to solve. Do not adjust inputs to produce a target number.

## Tool Synergy Credit — Native Domo Capabilities That Reduce LOE

Before finalizing any workstream estimate, apply Tool Synergy Credits where Domo's native functionality replaces custom development work. These credits must be documented in the calculation worksheet.

| Scenario | Without Synergy | With Synergy (Credit) | Condition |
|----------|-----------------|----------------------|-----------|
| ETL using Magic ETL visual canvas | Full manual ETL coding hours | 20–35% reduction on Transform | Use when: scope is joins, filters, aggregations, pivots — all Magic ETL-native operations |
| KPI calculations via Beast Mode | Custom computed column logic | 15–25% reduction on Transform + Viz | Use when: KPIs can be fully expressed as Beast Mode formulas without custom DataFlow logic |
| Distribution via Domo Publication Groups | Custom embed + tenant management | Replace edit-connect embed hours with Publish setup (8–16 hrs) | Use when: distribution model is Domo-internal to sub-instances, not external embed |
| Governance via native PDP policies | Custom security layer development | Standard PDP rate applies (0.5–2 hrs/dataset); no custom dev | Use when: access control fits PDP filter logic without external security middleware |
| Automation via Domo Workflows (no-code) | Code Engine Python development | Use Moderate Workflow rate (10–20 hrs) instead of Code Engine rate | Use when: automation is trigger → action chains achievable in Workflow canvas |
| Dashboard layout via standard card types | App Studio custom layout | No App Studio hours needed | Use when: customer requirements fit standard Domo dashboard cards + Stories layout |
| Alert distribution via native Domo Alerts | Custom notification system | Alerts absorbed (negligible) | Use when: threshold-based alerts only, no multi-system routing |
| DataSet Views for virtual joins | Full physical DataFlow build | 25–40% reduction on Transform | Use when: joins are read-only analytics views that don't require writeback or heavy processing |

**Document each synergy credit applied:**
```
TOOL SYNERGY CREDITS APPLIED:
[Workstream] — [Credit applied] — [Condition confirmed] — [Hours saved: X hrs]
```

If a synergy credit is debatable (e.g., Magic ETL may not handle the logic), flag it as a conditional credit and show both versions (with and without synergy) in the sensitivity analysis.

---

## How It Works

```
Locked Scope Model (LOE Inputs Summary)
                    |
  +--------+--------+--------+--------+--------+--------+
  |        |        |        |        |        |        |
Connect  Transform  Viz   Everywhere  Auto   App    Governance
Formula  Formula  Formula  Formula  Formula  Studio  + Rollout
  |        |        |        |        |        |        |
  +--------+--------+--------+--------+--------+--------+
                    |
         Apply Tool Synergy Credits
                    |
         Apply Overhead Percentages
         (Architecture, Solution Design, PM)
                    |
         Calculate Low / Expected / High Range
                    |
         Flag Confidence and Risk Items
                    |
         🔵 OUTPUT: LOE Estimate
                    |
    → Service Matchmaker + SOW Generator
```

## When to use

- "estimate the LOE for [account]"
- "run the estimate for [account]"
- "calculate hours for [account]"
- "how many hours for [account]"
- "what's the effort for [account]"
- "build the estimate for [account]"

**Prerequisite:** Scope Model must be LOCKED. If status is DRAFT, prompt the SSD to lock it first.

## When NOT to use

- If no locked Scope Model exists yet, invoke `engagement-scope` first to produce the scoping artefact — `loe-estimator` requires confirmed scope inputs.
- If the ask is to define what will be built (not estimate hours), use `engagement-scope` instead.
- If the ask is purely commercial packaging (SOW tiers, pricing), use `service-matchmaker` downstream; this skill produces raw hours, not commercial structure.

---

## Estimation Reference

Pull the full estimation methodology before running calculations:

**S3 (primary):**
```
aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/Domo Project Estimation & Calculation Methodology.docx" ./templates/scoping/ --region us-east-2
aws s3 cp "s3://armos-workspace-676897632200/cs-templates/scoping/Domo_Estimation_Calculation_Cheat_Sheet.docx" ./templates/scoping/ --region us-east-2
```

**Fallback (Domo FileSet):**
```
fileset_search("Domo estimation calculation methodology formulas")
fileset_search("Domo estimation cheat sheet multipliers")
# FileSet ID: e5b7e2e9-79ed-499d-95ff-fc9d74157d24
```

The formulas below are the current standard methodology. Always verify against the retrieved document — if the source contains an updated version, the source document takes precedence over the formulas written here.

---

## Execution Flow

### Step 1: Load and Validate the Scope Model

```
scope-builder output → confirm status = LOCKED
→ Load LOE Inputs Summary
→ Confirm all required signals are present for each in-scope workstream
→ Apply MVP Check: confirm every in-scope item is confirmed (not speculative)
→ Apply Tool Synergy Check: identify applicable synergy credits before calculating
```

**MVP Pre-Check:** Before estimating, validate the scope against MVP guardrails:
- Every deliverable in scope must be confirmed in the Discovery Record or Solution Blueprint — no speculative items
- Any deliverable that exceeds the minimum required to meet the confirmed business goal must be flagged and questioned
- If the Scope Model contains items that appear to gold-plate beyond the MVP, flag them for SSD review before estimating

If any LOE input is missing or marked LOW confidence, flag it before proceeding. A missing input forces an assumption — state it explicitly and add it to the risk flags.

---

### Step 2: Calculate Data Connection Effort

**Formula:**
```
Connection Effort per source =
  [Base Hours + (Incremental Hours × (Datasets - 1))] × Complexity Multiplier

Total Connection Effort = Sum across all sources
Add QA: 10–20% of Connection Effort
```

**Connector reference table:**

| Connector Type | Base Hours | Incremental Hours per Additional Dataset |
|---------------|------------|----------------------------------------|
| Domo API Connector | 8 | 2 |
| Database Connector | 2 | 1 |
| JSON Connector | 16 | 8 |
| File Upload (email, SFTP, manual) | 1 | 0.25 |
| Partition Connector | 8 | 8 |
| Writeback Connector | 8 | 4 |
| Domo Workbench | 8 | 1 |
| Federated Query | 16 | 8 |

**Complexity multipliers:**

| Classification | Multiplier | When to Apply |
|---------------|------------|--------------|
| Very Easy | 0.5× | Plug-and-play, minimal config, no anticipated issues |
| Easy | 0.75× | Standard connector, light config, clean data |
| Standard | 1.0× | Typical DB or API setup, requires careful verification |
| Difficult | 1.5× | API rate limits, on-premises, Workbench, many tables |
| Very Complex | 2.0×+ | Custom connector, complex auth, extreme data volume |

**MVP Note:** Classify at the lowest defensible multiplier consistent with confirmed complexity signals. Do not pre-emptively apply Difficult or Very Complex unless the Scope Model explicitly confirms those conditions.

**Calculation worksheet:**

| Source | Connector Type | Base Hrs | Datasets | Incremental Hrs | Subtotal (pre-mult) | Complexity | Multiplier | Subtotal (post-mult) |
|--------|---------------|----------|----------|----------------|---------------------|------------|------------|---------------------|
| [Source 1] | | | | | | | | |
| [Source 2] | | | | | | | | |
| **Total Connection (pre-QA)** | | | | | | | | **[sum]** |
| **QA (10–20%)** | | | | | | | | **[QA hrs]** |
| **Total Connection** | | | | | | | | **[total]** |

---

### Step 3: Calculate Data Transformation & Architecture Effort

**Formula:**
```
Transform Effort (base) = 1.5 × Total Connection Effort (pre-QA)

Apply multipliers in sequence:
  × ETL Logic Complexity multiplier
  × Data Volume / History multiplier
  × Refresh Frequency multiplier
  × Metric Complexity multiplier
  × Integrated Sources multiplier

Apply Tool Synergy Credits (Magic ETL, Beast Mode, DataSet Views) before finalizing

Add QA: 10–20% of Transform Effort
Add Architecture Design Overhead: 5–10% of (Connect + Transform + Viz)
```

**Multiplier reference:**

| Signal | Low | Medium | High |
|--------|-----|--------|------|
| ETL Logic Complexity | 1.0 — basic joins, filters, simple calcs | 1.2 — multi-source joins, grouping, business rules | 1.5 — recursive flows, complex joins, window functions |
| Data Volume / History | 1.0 — <1M rows, no historical append | 1.1 — tens of millions or 1–2 years history | 1.3 — hundreds of millions+, multi-year full history |
| Refresh Frequency | 1.0 — daily or less | 1.1 — hourly or intraday batch | 1.3 — real-time or streaming |
| Metric Complexity | 1.0 — basic aggregations (sums, counts, averages) | 1.1 — calculated fields, conditional logic, grain mismatches | 1.2 — financial metrics, rolling calculations, multi-step KPI derivations |
| Integrated Sources | 1.0 — 1–2 sources | 1.1 — 3–5 sources | 1.2 — 6+ sources |

**Tool Synergy Check for Transform:**
- If ETL logic is entirely achievable in Magic ETL visual canvas → apply 20–35% credit to Transform subtotal (pre-QA)
- If KPIs can be fully derived as Beast Mode formulas without DataFlow → apply 15–25% credit to Transform subtotal
- If joins are view-only analytics without writeback → consider DataSet Views; apply 25–40% credit
- Document which credits applied and why in the calculation worksheet

**Calculation worksheet:**

| | Value |
|---|---|
| Connection Effort (pre-QA) | [from Step 2] |
| Base Transform (1.5 × Connection) | [calc] |
| × ETL Logic Complexity | [multiplier] |
| × Data Volume / History | [multiplier] |
| × Refresh Frequency | [multiplier] |
| × Metric Complexity | [multiplier] |
| × Integrated Sources | [multiplier] |
| **Transform Subtotal (pre-synergy, pre-QA)** | **[calc]** |
| Tool Synergy Credit | [−X% if Magic ETL / Beast Mode / DataSet Views applies] |
| **Transform Subtotal (post-synergy, pre-QA)** | **[calc]** |
| QA (10–20%) | [QA hrs] |
| **Total Transform** | **[total]** |

---

### Step 4: Calculate Visualization Effort

**Formula:**
```
Visualization Effort =
  KPI Multiplier × Breakdown Multiplier × Branding Multiplier × Complexity Multiplier

Apply Tool Synergy Credits (standard card types vs. App Studio) before finalizing

Add QA: 10% of Visualization Effort
Add Solution Design Overhead: 5–10% of total development effort
```

**Multiplier reference:**

| KPI Count | Multiplier |
|-----------|------------|
| 1–5 KPIs | ×4 |
| 6–10 KPIs | ×8 |
| 11–20 KPIs | ×15 |
| 21–30 KPIs | ×25 |
| 31–50 KPIs | ×40 |
| 50+ KPIs | ×60 |

| Breakdown Dimensions | Multiplier |
|---------------------|------------|
| 1–2 dimensions | ×1.5 |
| 3–5 dimensions | ×4 |
| 6–10 dimensions | ×8 |
| 11–15 dimensions | ×12 |
| 15+ dimensions | ×18 |

| Branding | Multiplier |
|----------|------------|
| Low — basic Domo styling | ×1.0 |
| Standard — logo, color palette | ×1.5 |
| High — custom themes, pixel-perfect | ×2.0 |

| Visual Complexity | Multiplier |
|------------------|------------|
| Low — standard charts, minimal filtering | ×0.75 |
| Standard — mixed charts, filtering, interactivity | ×1.0 |
| High — custom design, App Studio, DDX, advanced interactivity | ×1.5 |

**MVP Note on Branding:** Apply Standard (×1.5) only when logo + color palette is explicitly confirmed in scope. Apply High (×2.0) only when pixel-perfect or App Studio is confirmed. Default to Low or Standard unless explicitly scoped.

**Calculation worksheet:**

| | Value |
|---|---|
| KPI Count | [from Scope Model] |
| KPI Multiplier | [from table] |
| Breakdown Dimensions | [from Scope Model] |
| Breakdown Multiplier | [from table] |
| Branding Level | [from Scope Model] |
| Branding Multiplier | [from table] |
| Visual Complexity | [from Scope Model] |
| Complexity Multiplier | [from table] |
| **Visualization Subtotal (pre-QA)** | **KPI × Breakdown × Branding × Complexity** |
| QA (10%) | [QA hrs] |
| **Total Visualization** | **[total]** |

> **Note on KPI count:** If the Scope Model has a range (e.g., "15–25 KPIs"), run the formula at both ends to produce a low and high estimate for this workstream.

---

### Step 5: Calculate Architecture Design and Solution Design Overheads

```
Architecture Design Overhead = 5–10% of (Connect + Transform + Visualization)
  → 5%: straightforward architecture, single data model
  → 7%: moderate complexity, multiple data models or use cases
  → 10%: complex multi-source architecture, significant design decisions

Solution Design Overhead = 5–10% of total development effort
  → Scale based on overall engagement complexity
```

**MVP Note:** Apply 5% unless the architecture is demonstrably complex. Three or fewer source systems with standard connectors → 5%. Do not apply 10% unless cross-system design decisions are confirmed in scope.

---

### Step 6: Calculate Distribution Effort (if Domo Everywhere in scope)

**Formula:**
```
View-only Embed: 30 hrs base + 10% QA = 33 hrs
Edit/Connect Embed: 60 hrs base + 10% QA = 66 hrs
Domo Publication Groups (internal sub-instance): 8–16 hrs
Sandbox Setup/Promotion: 1–2% of (Connect + Transform + Visualize)

If both embed and Sandbox are in scope: sum them.
PDP complexity for multi-tenant: add 0.5–2 hrs per dataset with PDP rules applied.
```

**Tool Synergy Check for Distribution:** If distribution is to other internal Domo instances via Domo Publish (Publication Groups) rather than external embed, use 8–16 hrs instead of the 30 or 60 hr embed rates. Document the distinction.

**Calculation worksheet:**

| | Value |
|---|---|
| Distribution type | View-only embed (33 hrs) / Edit-Connect embed (66 hrs) / Domo Publish (8–16 hrs) |
| Base hours | [from table] |
| QA (10%) | [hrs] |
| Sandbox (if in scope) | 1–2% × (Connect + Transform + Viz) = [hrs] |
| PDP rules for distribution | [# datasets × 0.5–2 hrs] |
| **Total Distribution** | **[total]** |

---

### Step 7: Calculate Automation & AI Effort (if in scope)

**Formula:**
```
Per automation use case:
  Alerts: negligible (absorbed into other workstreams)
  Simple Workflow: 2–5 hrs
  Moderate Workflow: 10–20 hrs
  Complex Workflow: 40–80+ hrs
  AI Agent / Chat Setup: 6–12 hrs
  Custom Model (Python/R): 20–40+ hrs
  Code Engine / API Integration: 4–10 hrs per integration

QA: 10–20% of total automation effort
```

**Tool Synergy Check for Automation:** If automation use cases are achievable in the Domo Workflows no-code canvas (trigger → action, conditional steps, user tasks, form integrations), use Workflow rates — not Code Engine rates. Code Engine rates apply only when custom Python/JavaScript or external API integration is confirmed required. Document the distinction.

**MVP Note on Automation:** Complex Workflow (40–80+ hrs) applies only to confirmed multi-system, looping, error-handling workflows. Do not apply complex rates to workflows that are describable as simple trigger-action sequences. Classify individually; never lump multiple workflows under one "complex" bucket.

**Calculation worksheet:**

| Use Case | Type | Low Hrs | Expected Hrs | High Hrs | Synergy Credit | Notes |
|----------|------|---------|-------------|---------|----------------|-------|
| [Use case 1] | [Simple/Mod/Complex/AI/Code Engine] | | | | [Native Workflows? Y/N] | |
| [Use case 2] | | | | | | |
| **Subtotal (pre-QA)** | | | | | | |
| **QA (10–20%)** | | | | | | |
| **Total Automation** | | | | | | |

---

### Step 8: Calculate App Studio / DDX Effort (if in scope)

**Formula:**
```
App Studio App:
  Simple: 20–40 hrs
  Moderate: 40–80 hrs
  Complex: 80–150+ hrs

DDX Brick:
  Simple: 8–16 hrs
  Moderate: 16–40 hrs
  Complex: 40–80+ hrs

Design overhead: Low (5%) / Medium (10%) / High (15–20%) of App Studio / DDX hrs
QA: 10–20% of App Studio / DDX development time
```

**MVP Gate for App Studio:** App Studio is scoped ONLY when confirmed in the Scope Model after the scope-app-studio sub-tool has determined standard dashboards are insufficient. If the sub-tool decision tree was not applied, flag before estimating.

---

### Step 9: Calculate Governance Effort

**Formula:**
```
PDP rules: 0.5–2 hrs per dataset with PDP applied
User/Group setup: 1–4 hrs total depending on scale
Admin training and documentation: 2–4 hrs

Governance overhead: 5–10% of total development effort
  Low (5%): basic PDP, few groups, light compliance
  Medium (7%): multiple groups, formal governance process
  High (10%+): strict compliance, CoE setup, detailed security
```

---

### Step 10: Calculate Solution Rollout & Adoption

**Formula:**
```
Rollout overhead: 5–10% of total development effort
  Low (5%): few users, 1–2 training sessions
  Medium (7%): department rollout, multi-role training
  High (10%+): enterprise adoption program, change management

Training sessions: 2–4 hrs prep + delivery per session
Communications and support: 2–4 hrs
```

---

### Step 11: Calculate Project Management

**Formula:**
```
PM Effort = PM% × Total Project Hours (all workstreams above)

PM percentage:
  15%: normal complexity
  18%: moderate risk, dependencies on other teams
  20%+: high risk, cross-team, strategic account, Engagement Manager involvement
```

**MVP Note:** Use 15% unless the Scope Model explicitly documents elevated risk conditions or cross-team dependencies. Do not default to 18% or 20% without documented rationale.

---

### Step 12: Compile Total and Produce Range

**Total LOE:**
```
Grand Total = Connect + Transform + Architecture Overhead + Solution Design Overhead
            + Visualization + Distribution + Automation + App Studio
            + Governance + Rollout + PM
```

**Produce three scenarios:**

| Scenario | How to Calculate | When to Use |
|----------|-----------------|------------|
| **Low** | Use minimum values for all ranges; use LOW-end multipliers for uncertain inputs; apply maximum synergy credits where defensible | Best case — all complexity signals and synergy assumptions resolve favorably |
| **Expected** | Use midpoints for ranges; use most likely multipliers; apply confirmed synergy credits only | Most likely outcome given current information |
| **High** | Use maximum values for all ranges; use HIGH-end multipliers; apply no synergy credits | Worst case — complexity signals resolve unfavorably, native tools don't simplify |

> The spread between Low and High is a direct indicator of estimate confidence AND the commercial risk exposure. A wide spread means the SSD must choose between Fixed-Bid risk and T&M optionality.

---

### Step 13: Assess Confidence and Flag Risks

For each workstream, assign confidence:

| Confidence | Criteria |
|------------|---------|
| **HIGH** | Inputs are confirmed and specific (e.g., "3 Salesforce API datasets, standard complexity") |
| **MEDIUM** | Inputs are estimated but reasonable (e.g., "KPI count is 15–25, not yet finalized") |
| **LOW** | Inputs are speculative or a key unknown remains (e.g., "transformation complexity unknown until data profiling") |

Flag every LOW-confidence workstream. Each flag should include:
- What is unknown
- What would change the estimate if the unknown resolves unfavorably
- Recommended action (data profiling session, follow-up call, SOW assumption)

---

## Output Template

```markdown
# LOE Estimate: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **SSD:** [Name]
**Based on:** Scope Model v[X] (LOCKED)
**Estimate Status:** DRAFT — Pending SSD Review
**Scoped for:** Minimum Viable Product delivery

---

## Summary

| Scenario | Total Hours | Notes |
|----------|------------|-------|
| **Low** | [X] hrs | All complexity signals resolve favorably; maximum synergy credits applied |
| **Expected** | [X] hrs | Most likely based on current information; confirmed synergy credits applied |
| **High** | [X] hrs | Complexity signals resolve unfavorably; no synergy credits |

**Confidence:** [HIGH / MEDIUM / LOW]
**Spread interpretation:** [Narrow spread = high confidence. Wide spread = key unknowns remain — see Risk Flags.]

---

## Tool Synergy Credits Applied

| Workstream | Credit | Condition | Hours Saved |
|------------|--------|-----------|-------------|
| [Transform] | Magic ETL visual canvas (20% reduction) | ETL logic confirmed as joins/filters/aggregations only | −[X] hrs |
| [Transform] | Beast Mode for KPIs (15% reduction) | All KPIs expressible as Beast Mode formulas | −[X] hrs |
| [Distribution] | Domo Publish vs. embed | Distribution is to internal Domo sub-instances only | −[X] hrs |
| [Automation] | Domo Workflows no-code | Confirmed trigger→action workflows, no custom code required | −[X] hrs |
| **Total Credits** | | | **−[X] hrs** |

---

## Workstream Breakdown

| Workstream | Low Hrs | Expected Hrs | High Hrs | Confidence |
|------------|---------|-------------|---------|------------|
| Data Connection | | | | HIGH/MED/LOW |
| Data Transformation | | | | |
| Architecture Design Overhead | | | | |
| Solution Design Overhead | | | | |
| Visualization & Dashboards | | | | |
| Domo Everywhere / Distribution | | | | |
| Automation & AI | | | | |
| App Studio / DDX | | | | |
| Governance | | | | |
| Solution Rollout & Adoption | | | | |
| Project Management | | | | |
| **TOTAL** | **[low]** | **[expected]** | **[high]** | |

---

## Calculation Detail

### Data Connection

| Source | Connector | Base | Datasets | Incremental | Complexity | Multiplier | Hours |
|--------|-----------|------|----------|-------------|------------|------------|-------|
| [Source 1] | [Type] | [X] | [#] | [X] | [Level] | [×] | [hrs] |
| [Source 2] | | | | | | | |
| QA ([X]%) | | | | | | | [hrs] |
| **Total** | | | | | | | **[hrs]** |

### Data Transformation

| Input | Classification | Multiplier |
|-------|---------------|------------|
| Base (1.5 × [Connect pre-QA]) | — | [hrs] |
| ETL Logic Complexity | [Low/Med/High] | [×] |
| Data Volume / History | [Low/Med/High] | [×] |
| Refresh Frequency | [Low/Med/High] | [×] |
| Metric Complexity | [Low/Med/High] | [×] |
| Integrated Sources | [Low/Med/High] | [×] |
| Synergy Credit | [Magic ETL / Beast Mode / DataSet Views] | −[X]% |
| QA ([X]%) | — | [hrs] |
| **Total** | | **[hrs]** |

### Visualization

| Input | Value | Multiplier |
|-------|-------|------------|
| KPI Count | [#] | [×] |
| Breakdown Dimensions | [#] | [×] |
| Branding | [Low/Std/High] | [×] |
| Visual Complexity | [Low/Std/High] | [×] |
| QA (10%) | — | [hrs] |
| **Total** | | **[hrs]** |

### [Distribution / Automation / App Studio — repeat calculation detail for each in-scope workstream]

### Overheads

| Overhead | Base | Percentage | Hours |
|---------|------|------------|-------|
| Architecture Design | Connect + Transform + Viz = [X] | [5–10]% | [hrs] |
| Solution Design | Total dev effort = [X] | [5–10]% | [hrs] |
| Governance (overhead component) | Total dev effort = [X] | [5–10]% | [hrs] |
| Rollout (overhead component) | Total dev effort = [X] | [5–10]% | [hrs] |
| Project Management | All workstreams = [X] | [15–20]% | [hrs] |

---

## Confidence Assessment and Risk Flags

### HIGH Confidence Items
- [Workstream] — [Why confident: inputs are specific and confirmed]

### MEDIUM Confidence Items
- [Workstream] — [What is estimated and why it is reasonable]

### LOW Confidence Items — Flags

| Workstream | Unknown | Unfavorable Impact | Recommended Action |
|------------|---------|-------------------|--------------------|
| [e.g., Transform] | Data quality unknown until profiling | Could add 20–40 hrs if heavy cleansing needed | Include data profiling milestone; add cleansing assumption to SOW |
| [e.g., Automation] | Workflow logic not finalized | Complex path adds 40+ hrs vs. simple path | Confirm workflow design before SOW sign |

---

## Sensitivity Analysis

| Assumption | Current Estimate Impact | If Wrong — Additional Hours |
|-----------|------------------------|----------------------------|
| [e.g., Magic ETL handles all ETL logic] | −[X] hrs synergy credit | +[X] hrs if DataFlow/Python required |
| [e.g., Database connector, standard complexity] | [X] hrs | +[Y] hrs if Difficult complexity |
| [e.g., 15–20 KPIs] | [X] hrs | +[Y] hrs if 25–30 KPIs |

---

## MVP Scope Flags

*Items flagged during MVP pre-check that may represent scope beyond minimum requirements.*

| Item | Workstream | Flag | SSD Decision |
|------|------------|------|-------------|
| [e.g., Custom branded App Studio vs. standard dashboard] | Visualization | Scope-app-studio sub-tool should confirm this is required | [SSD TO CONFIRM] |
| [e.g., Real-time refresh for analytics dashboard] | Transform | Real-time adds significant complexity vs. daily — confirm business need | [SSD TO CONFIRM] |

---

**Prepared by:** CS Solutions LOE Estimator Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Estimation → Position 5
**Based on methodology:** Domo Project Estimation & Calculation Methodology (S3 primary; FileSet e5b7e2e9-79ed-499d-95ff-fc9d74157d24 fallback)
**Scoped for:** Minimum viable product — no bloat, confirmed tool synergy credited
```

---

## Design principles

- **MVP only.** Estimate what the locked scope requires to deliver well — not what it could theoretically become. Every hour above the MVP baseline must be traceable to a confirmed scope item.
- **Credit tool synergy.** Native Domo tools reduce custom build time. Apply synergy credits where conditions are met and document each one. Inflating hours for work Domo handles natively overstates the LOE.
- **The estimate is only as good as the Scope Model inputs.** If the Scope Model has LOW-confidence inputs, the estimate will have a wide range. Do not present a single number when inputs are speculative — always show the range.
- **Show the math.** Every number must be traceable to its formula, its inputs, the classification decisions, and any synergy credits applied.
- **Do not reverse-engineer from a budget.** If the result does not fit, that is the Service Matchmaker's and SSD's problem to solve.
- **Always use the source methodology.** Fetch from S3 or FileSet. Do not calculate from memory.
- **Flag all LOW-confidence items before presenting.**
- **QA is not optional.** Do not remove it to reduce the total.
- **PM is always included.** 15% unless documented rationale exists for higher.
- **The estimate does not include commercial buffer.** That is applied by the Service Matchmaker.

---

## Connecting Reference Sources

| Source | Priority | Access |
|--------|----------|--------|
| Local cache | Highest | `./templates/scoping/` |
| S3 bucket | Primary | `s3://armos-workspace-676897632200/cs-templates/scoping/` |
| Domo FileSet | Fallback | ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24` · POST `/api/content/v1/filesets/{id}/aiSearch` |

---

## Related Skills

- **Scope Builder** → Upstream — provides the locked Scope Model and LOE inputs this skill calculates against
- **Service Matchmaker** → Downstream — takes total hours and maps to packages, tiers, and commercial structure
- **SOW Generator** → Downstream — uses total hours and workstream breakdown to populate project fees and timeline
