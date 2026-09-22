---
name: solution-blueprint
tier: 1
description: "Define the 'what' and 'how' of the proposed solution before scoping begins — translate customer pain into a clear solution statement, recommend Domo platform components and technical approach, produce a business-readable reference architecture, identify alternatives, and surface dependencies and risks. Trigger with 'build solution blueprint for [account]', 'design the solution for [account]', 'what should we build for [account]', or 'solution approach for [account]'. Requires a validated Discovery Record."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: solution-design
  position: 3
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: discovery-synthesizer
      required: true
      data: validated Discovery Record — goals, pain points, technical requirements, stakeholders, assumptions
    - agent: pre-scoping-brief
      required: false
      data: deal context, prior call history
    - agent: connection-strategy
      required: false
      data: Connection Strategy — recommended data ingestion methods, integration complexity, prerequisites
  outputs:
    - name: solution-blueprint
      format: markdown
      downstream:
        - agent: scope-builder
        - agent: proposal-generator
        - agent: sow-generator
  data_sources:
    - tool: fileset_search
      required: true
    - tool: portfolio_lookup
      required: false
    - tool: gong_transcript_lookup
      required: false
  phase_gate: true
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Solution Blueprint Generator — Define What We Will Build

Translates the validated Discovery Record into a clear, locked Solution Blueprint — the authoritative definition of what Domo Professional Services will deliver and how. This is the design document that every downstream skill (Scope Builder, Proposal Generator, SOW Generator) reads from. Once locked by the SSD, it does not change without a formal revision.

This skill produces a business-readable solution, not a consultant-only technical memo. It must be understandable by an executive sponsor, not just the delivery team.

## How It Works

```
Validated Discovery Record + fileset_search (patterns, capabilities, references)
                              |
  +--------+--------+--------+--------+--------+--------+
  |        |        |        |        |        |        |
Solution  Platform  Data    Ref.   Operating  Risks &  Open
Statement  Comps   Flow   Arch.    Model    Depends  Questions
  |        |        |        |        |        |        |
  +--------+--------+--------+--------+--------+--------+
                              |
           SSD Refines Until Locked
                              |
          🔵 OUTPUT: Solution Blueprint
                              |
   → Scope Builder + Proposal Generator + SOW Generator
```

## Triggers

- "build solution blueprint for [account]"
- "design the solution for [account]"
- "what should we build for [account]"
- "solution approach for [account]"
- "draft the solution for [account]"
- "define what we're building for [account]"

**Prerequisite:** A validated Discovery Record must exist. If it does not, prompt the SSD to run the Discovery Synthesizer first.

## Execution Flow

### Step 1: Load the Discovery Record

```
discovery-synthesizer output (required)
→ Load validated Discovery Record
→ Confirm status = VALIDATED (not DRAFT)
→ Extract: goals, pain points, success criteria, technical requirements by workstream,
           stakeholders, delivery preference, assumptions, unresolved questions
→ Flag any unresolved questions tagged [SCOPE] or [RISK] — these must be addressed
  before the blueprint can be locked
```

If any `[SCOPE]`-tagged questions remain unresolved, surface them to the SSD before proceeding. The blueprint should not be built on open scope questions.

### Step 2: Query the Fileset for Relevant Patterns and Capabilities

```
fileset_search("architecture patterns [use case type]")
→ Retrieve reference architectures relevant to the customer's use case

fileset_search("Domo [platform component] capabilities")
→ Retrieve capability references for each component being considered
   (e.g., "Domo Workflows capabilities", "Domo Everywhere embed options")

fileset_search("scoping guide [workstream]")
→ Retrieve workstream-specific guidance for solution design

fileset_search("integration [source system name]")
→ Retrieve any reference material on connecting to the specific data sources identified
```

Use fileset results to validate recommendations — do not recommend components outside confirmed Domo capabilities.

### Step 3: Define the Solution Statement

Translate the customer's pain into a one-paragraph business-language solution statement:

```
Format:
[Customer] will use Domo Professional Services to [solve X] by [building Y].
This will enable [audience] to [do Z], resulting in [business outcome].
The solution will be delivered as [engagement model] over approximately [timeframe].
```

This statement must be:
- Understandable by a non-technical executive sponsor
- Tied directly to the pain points and success criteria in the Discovery Record
- Free of Domo jargon unless the customer uses it themselves

### Step 4: Define Use Cases and Recommended Solution per Use Case

For each use case identified in the Discovery Record:

| Element | What to Define |
|---------|---------------|
| **Use case name** | Short, customer-language label |
| **Business problem** | What is broken or missing today |
| **Proposed solution** | What Domo will deliver to address it |
| **Platform components** | Which Domo capabilities are required |
| **Data sources** | Which source systems feed this use case |
| **Key deliverables** | What the customer will receive |
| **Measurable outcome** | How success is measured for this use case |

### Step 5: Recommend Platform Components and Justify Each

For each Domo platform component being recommended, provide:

1. **What it does** (in business terms)
2. **Why it is the right choice for this customer**
3. **Alternatives considered and why they were ruled out** (when relevant)
4. **Any prerequisites** (e.g., "Domo Everywhere requires embedding license")

```
fileset_search("Domo [component] overview")
→ Pull reference material to ensure accuracy of capability descriptions
```

Do not recommend components speculatively. Every recommendation must trace back to a confirmed requirement in the Discovery Record.

### Step 6: Produce the Reference Architecture

Build a text-based reference architecture showing data flow from source to output:

```
[Source Systems]  →  [Connection Method]  →  [Domo Platform]  →  [Delivery Layer]
                                                    |
                              +--------------------+--------------------+
                              |                    |                    |
                         [Data Layer]       [Logic Layer]       [Presentation Layer]
                     (Connectors, DataSets)  (ETL, DataFusion)  (Dashboards, Stories)
                              |                    |                    |
                              +--------------------+--------------------+
                                                    |
                                         [Distribution Layer]
                                    (Domo Everywhere / Publish / Direct)
                                                    |
                                          [Automation Layer]
                                    (Workflows, Alerts, Code Engine)
```

Label each layer with:
- Specific source system names (from Discovery Record)
- Specific Domo components recommended
- Specific delivery mechanism (who sees what, how)

### Step 7: Define the Operating Model and Delivery Approach

Based on the delivery preference identified in the Discovery Record:

| Dimension | Decision | Rationale |
|-----------|---------|-----------|
| **Delivery model** | Domo-led / Co-delivery / Teach-to-fish / Retainer | [From discovery] |
| **Customer involvement** | [What is required from the customer team] | [Capacity signal from discovery] |
| **Customer responsibilities** | [Data access, SME availability, UAT, approvals] | [Standard + any specific items] |
| **Domo responsibilities** | [What PS will own end-to-end] | [Delivery model driven] |
| **Phasing** | [Single phase or multi-phase] | [Scope and budget signal] |

### Step 8: Identify Alternative Approaches

When meaningful tradeoffs exist, present alternatives:

```
For each alternative:
  Option A (recommended): [Approach] — [Why recommended]
  Option B:               [Approach] — [Tradeoff vs. Option A]
  Option C (if applicable): [Approach] — [Tradeoff vs. Option A]
```

Alternatives are appropriate when:
- Two valid technical approaches exist with different cost/complexity tradeoffs
- Phasing options exist (MVP vs. full scope)
- Delivery model options exist (Domo-led vs. co-delivery)

### Step 9: Compile Dependencies, Assumptions, and Risks

Carry forward from the Discovery Record and add solution-level items:

**Dependencies** — things that must be true for the solution to work:
- Customer must provide [access / credentials / data / approvals] before [milestone]
- [Platform prerequisite] must be licensed or enabled

**Assumptions** — things treated as true that have not been confirmed:
- Each assumption must trace to a Discovery Record source or be flagged as new
- Mark: INHERITED (from Discovery Record) or NEW (added during solution design)

**Risks** — things that could go wrong and their mitigation:
- Each risk must have: description, probability (H/M/L), impact (H/M/L), and mitigation

### Step 10: List Open Questions

Carry forward any unresolved questions from the Discovery Record that the blueprint cannot resolve, plus any new questions that arose during solution design. These become inputs to the Scope Builder and must be resolved before the SOW is drafted.

---

## Output Template

```markdown
# Solution Blueprint: [Account Name]
**Version:** 1.0 — DRAFT
**Prepared:** [Date] | **SSD:** [Name]
**Based on:** Discovery Record v[X] — [Date of discovery call]
**Status:** DRAFT — Pending SSD Review and Lock

---

## Solution Statement

[One paragraph in business language — what we are building, for whom, to solve what,
delivering what outcome, in what timeframe and engagement model.]

---

## Use Cases

### Use Case 1: [Name]

| | |
|---|---|
| **Business Problem** | [What is broken or missing today] |
| **Proposed Solution** | [What Domo will build] |
| **Platform Components** | [List] |
| **Data Sources** | [List from Discovery Record] |
| **Key Deliverables** | [What the customer receives] |
| **Success Metric** | [How we measure this use case's success] |

### Use Case 2: [Name]
*[Repeat structure above]*

---

## Recommended Platform Components

| Component | Purpose in This Engagement | Justification |
|-----------|--------------------------|---------------|
| [e.g., Magic ETL 2.0] | [Transform sales + ops data into unified model] | [Multi-source blending required per Discovery Record] |
| [e.g., Domo Dashboards] | [Executive and ops reporting layer] | [Confirmed audience and KPI requirements] |
| [e.g., Domo Workflows] | [Automated approval routing for [use case]] | [Manual process confirmed in discovery] |
| [e.g., Domo Everywhere] | [Embed dashboards in [portal/product]] | [External user requirement confirmed] |

*Components not recommended for this engagement and why:*
- [e.g., App Studio — standard dashboards sufficient; no custom app requirement confirmed]

---

## Reference Architecture

```
[Source Systems]
   Salesforce (CRM)    →  Domo API Connector      ─┐
   NetSuite (ERP)      →  Database Connector       ─┤
   Google Sheets       →  File Upload Connector    ─┘
                                                    ↓
                              ┌─────────────────────────────────┐
                              │         DATA LAYER              │
                              │  Raw DataSets (per source)      │
                              └────────────┬────────────────────┘
                                           ↓
                              ┌─────────────────────────────────┐
                              │         LOGIC LAYER             │
                              │  Magic ETL — unified data model │
                              │  DataFusion — cross-source joins │
                              └────────────┬────────────────────┘
                                           ↓
                              ┌─────────────────────────────────┐
                              │      PRESENTATION LAYER         │
                              │  Executive Dashboard            │
                              │  Operational Dashboard          │
                              │  [Additional dashboards]        │
                              └────────────┬────────────────────┘
                                           ↓
                              ┌─────────────────────────────────┐
                              │      AUTOMATION LAYER           │
                              │  Alerts — threshold triggers    │
                              │  Workflow — [specific process]  │
                              └─────────────────────────────────┘
```

*Customize per account — replace source systems, components, and layer labels with specifics.*

---

## Operating Model

| Dimension | Decision | Notes |
|-----------|---------|-------|
| **Delivery Model** | [Domo-led / Co-delivery / Teach-to-fish] | [Rationale from discovery] |
| **Customer Involvement** | [X hrs/week from [roles]] | [Capacity signal] |
| **Customer Responsibilities** | Data access, SME availability, UAT sign-off | [Any specific items] |
| **Domo Responsibilities** | [List what PS owns end-to-end] | |
| **Phasing** | [Single phase / Phase 1 of N] | [Scope and budget rationale] |
| **Estimated Duration** | [X weeks] | [Directional — Scope Builder will refine] |

---

## Alternative Approaches

### Option A — Recommended
**Approach:** [Description]
**Why recommended:** [Rationale — speed, cost, risk, fit]

### Option B
**Approach:** [Description]
**Tradeoff vs. Option A:** [What you gain and give up]

### Option C (if applicable)
**Approach:** [Description]
**Tradeoff vs. Option A:** [What you gain and give up]

---

## Dependencies

| Dependency | Owner | Required By | Risk if Delayed |
|-----------|-------|-------------|----------------|
| [e.g., Database credentials provided] | Customer IT | Week 1 | Blocks data connection workstream |
| [e.g., Domo Everywhere license active] | AE / Customer | Before build | Blocks embed delivery |
| [e.g., Source system access for PS team] | Customer | Kickoff | Blocks all delivery |

---

## Assumptions

| # | Assumption | Source | Impact If Wrong |
|---|-----------|--------|----------------|
| 1 | [Assumption] | INHERITED from Discovery Record | [Impact] |
| 2 | [Assumption] | NEW — added during solution design | [Impact] |

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| [e.g., Data quality issues in source systems] | Med | High | Build QA checkpoint into data connection phase |
| [e.g., Scope expansion after blueprint is locked] | High | Med | Formal change request process in SOW |
| [e.g., Customer team availability below expected] | Med | Med | Define minimum commitment in SOW |

---

## Open Questions

*These must be resolved before the SOW is drafted. Carried from Discovery Record unless marked NEW.*

| # | Question | Tag | Blocks | Owner | Resolution Path |
|---|----------|-----|--------|-------|----------------|
| 1 | [Question] | `[SCOPE]` | Scope Builder | SSD | Follow-up call with [Name] |
| 2 | [Question] | `[LOE]` | Scope Builder | Customer | Customer to provide data inventory |
| 3 | [Question] | `[RISK]` | SOW | SSD | Internal review |

---

## What This Blueprint Is Not

- This is not a project plan. Timeline and hours are directional only — the Scope Builder owns estimates.
- This is not a proposal. The Proposal Generator will translate this into customer-facing language.
- This is not an SOW. The SOW Generator will formalize this into contractual scope.

---

**Prepared by:** CS Solutions Solution Blueprint Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Solution Design → Position 3
**Phase Gate:** YES — SSD must lock this blueprint before Scope Builder proceeds
```

---

## Guardrails

- **The blueprint must be business-readable.** An executive sponsor who was on the discovery call should be able to read this and confirm it reflects what they described. If it reads like a technical spec, rewrite it.
- **Every recommendation must trace to the Discovery Record.** Do not add components, use cases, or capabilities that were not surfaced in discovery. If the SSD wants to add something, flag it as SSD-added and note the assumption.
- **Do not proceed if unresolved `[SCOPE]` questions remain.** A blueprint built on open scope questions will create SOW problems. Surface them and ask the SSD whether to proceed with assumptions or resolve first.
- **The blueprint is a design document, not a sales document.** It should be accurate, not optimistic. Risks and dependencies must be stated plainly.
- **Alternatives must be genuinely different approaches.** Do not present fake options. If only one reasonable approach exists, say so and explain why.
- **Phase gate is enforced.** The Scope Builder must not run until the SSD has locked this blueprint. Mark status clearly — DRAFT until SSD confirms LOCKED.
- **Reference fileset for all capability claims.** If recommending a platform component, verify the capability description against the fileset. Do not describe Domo capabilities from memory.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Architecture patterns, platform capability references, integration guides, scoping methodology |
| portfolio_lookup | Optional | Account context to validate solution fit against account profile |
| gong_transcript_lookup | Optional | Prior engagement patterns for analogous accounts |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: blueprint design decisions, architecture components, integration patterns, technical constraints, implementation sequence.
- Call `memory_store_artifact` to persist the blueprint in `engagement-artifacts`.

---

## Related Skills

- **Discovery Synthesizer** → Upstream — provides the validated Discovery Record this skill is built on
- **Scope Builder & LOE Estimator** → Downstream — consumes locked blueprint to estimate workstream effort
- **Proposal Generator** → Downstream — translates blueprint into customer-facing narrative
- **SOW Generator** → Downstream — formalizes locked blueprint into contractual scope
