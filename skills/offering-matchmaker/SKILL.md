---
name: offering-matchmaker
tier: 1
description: "Map customer needs and solution architecture to FY27 Service Catalog packages, accelerators, and value-add modules. Produces a recommended engagement structure with package tiers, hours, and pricing. Trigger with 'match offerings for [account]', 'what packages fit [account]', 'recommend services for [customer]', 'service catalog match for [account]', or any request to map customer needs to PS service packages."
maturity: alpha
audience: [delivery]
pipeline:
  phase: discover
  sub_phase: scoping-assets
  position: 4
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: customer-roi-hypothesis
      required: true
      data: pain points, use cases, ROI estimates
    - agent: solution-architect
      required: false
      data: technical approach, complexity, hours estimates
  outputs:
    - name: offering-recommendation
      format: markdown
      downstream:
        - agent: sow-builder
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: actions_lookup
      required: false
    - tool: hgplatformutilization_lookup
      required: false
    - tool: sfopportunities_lookup
      required: false
  phase_gate: false
---

# Offering Matchmaker — Service Package Recommendation

Takes the Customer ROI Hypothesis and Solution Architecture, then maps them to the FY27 Service Catalog. Recommends the optimal combination of base packages, accelerators, and value-add modules to deliver the scoped outcomes.

## How It Works

```
ROI Hypothesis + Solution Architecture (upstream)
  → Use Cases + Technical Complexity + Hours Estimates
                    |
    +-------+-------+-------+
    |       |       |       |
  Package   Accel-  Value-  Account
  Tier      erators Add     Context
  Matching  Matching Modules (ARR, segment)
    |       |       |       |
    +-------+-------+-------+
                    |
         Assemble Optimal Engagement Structure
                    |
         🔵 OUTPUT: Offering Recommendation
                    |
         → SOW Builder (downstream)
```

## Triggers

- "match offerings for [account]"
- "what packages fit [account]"
- "recommend services for [customer]"
- "service catalog match for [account]"
- "scope the engagement for [account]"
- "pricing for [account]"
- "build the offering for [account]"

## FY27 Service Catalog Reference

**⚠️ IMPORTANT: The FY27 Service Catalog has not yet been provided. When it is provided, update this section with actual package definitions, pricing, and catalog entries.**

### Placeholder Catalog Structure (from PoC mockup signals)

**Base Package Tiers:**

| Tier | Indicative Price | Hours Range | Typical Scope |
|------|-----------------|-------------|---------------|
| **Silver** | ~$45,000 | 60-100 hrs | Single use case, basic dashboards, standard connectors |
| **Gold** | ~$60,000 | 100-160 hrs | 2-3 use cases, custom pipelines, training included |
| **Platinum** | ~$80,000 | 160-250 hrs | Multi-use case, advanced architecture, full enablement |
| **Custom** | $80,000+ | 250+ hrs | Enterprise-scale, multi-team, complex integrations |

**Accelerators:**

| Accelerator | Description | Pairs With |
|-------------|-------------|------------|
| Essential Finance Data Product | Pre-built finance dashboards and data models | Silver, Gold |
| Executive Dashboard Starter | C-suite ready dashboards with common KPIs | All tiers |
| Data Architecture Assessment | Evaluate and design optimal data flow | Gold, Platinum |
| Domo Everywhere Quick Start | Embedded analytics setup and configuration | Gold, Platinum |
| Migration Accelerator | Migrate from Tableau/Power BI to Domo | All tiers |

**Value-Add Modules:**

| Module | Description | Hours | Pairs With |
|--------|-------------|-------|------------|
| Business Value Design Workshop | Half-day workshop to define use cases and KPIs | 8 hrs | Pre-engagement |
| Use Case Sprint | Rapid build of a single use case end-to-end | 40 hrs | Any tier |
| Data Architecture Assessment | Deep-dive into data model and pipeline design | 20 hrs | Gold, Platinum |
| Road Mapping Session | Strategic roadmap for Domo adoption over 6-12 months | 16 hrs | Post-engagement |
| Champion Training Program | Train internal champions to self-serve | 24 hrs | Any tier |
| Admin Enablement | Domo admin training and governance setup | 16 hrs | Any tier |

*When the actual FY27 Service Catalog is provided, replace this section with real definitions, pricing, and catalog IDs.*

## Execution Flow

### Step 1: Consume Upstream Context

```
1. ROI Hypothesis (required)
   → Pain points, use cases, ROI estimates
   → This tells us WHAT outcomes the customer needs

2. Solution Architecture (if available)
   → Technical complexity, hours estimates, third-party needs
   → This tells us HOW complex the build is

3. portfolio_lookup(account_name)
   → ARR (influences investment capacity)
   → Segment (Enterprise/Mid-Market/SMB)
   → Services history (have they bought PS before?)
   → Products owned (what Domo features are licensed)

4. hgplatformutilization_lookup(account_name) [when available]
   → Features enabled but unused = direct package mapping opportunities
   → "Domo Everywhere enabled but not used" → Domo Everywhere Quick Start
   → "Data Science enabled but not used" → Data Science Accelerator

5. sfopportunities_lookup(account_name, limit=5) [when available]
   → Recent deals: services revenue breakdown shows what they've bought before
   → Active pipeline context helps frame package pricing and timing
```

### Step 2: Score Use Cases Against Catalog

For each use case from the ROI Hypothesis, evaluate:

| Factor | Weight | Assessment |
|--------|--------|------------|
| **Technical Complexity** | 30% | Simple (dashboards only) / Medium (pipelines + dashboards) / Complex (integrations + transforms + dashboards) |
| **Data Source Count** | 15% | 1-2 sources = Low / 3-5 = Medium / 5+ = High |
| **User Count** | 15% | <20 users = Low / 20-100 = Medium / 100+ = High (affects training needs) |
| **Governance Needs** | 10% | Basic roles / PDP required / Multi-team governance |
| **Integration Points** | 15% | Domo-only / One external system / Multiple systems |
| **Timeline Pressure** | 15% | Flexible / Within quarter / Urgent (<30 days) |

**Complexity Score → Package Tier:**
- Low (< 40): Silver
- Medium (40-60): Gold
- High (60-80): Platinum
- Very High (80+): Custom

### Step 3: Assemble Engagement Structure

Build the recommended engagement as a composition:

```
Engagement = Base Package + [0-N Accelerators] + [0-N Value-Add Modules]

Example:
  Gold Package ($60K, 120 hrs)
  + Essential Finance Data Product (accelerator)
  + Champion Training Program (16 hrs, value-add)
  + Road Mapping Session (16 hrs, value-add)
  ─────────────────────────────────
  Total: $60K + value-adds, ~152 hours
```

### Step 4: Build ROI Case for the Engagement

Map the investment to the ROI from the upstream hypothesis:

```
Investment: $60,000 (Gold Package + modules)
Expected Annual Value: $180,000 (from ROI Hypothesis)
ROI Multiple: 3.0x in Year 1
Payback Period: ~4 months
```

### Step 5: Produce Offering Recommendation

---

## Output Template

```markdown
# Offering Recommendation: [Account Name]

**Generated:** [Date]
**Upstream:** ROI Hypothesis (dated [date]) | Solution Architecture (dated [date])
**Use Cases:** [N] identified

---

## Recommended Engagement

### Primary Package: [Tier Name]

| | |
|---|---|
| **Package** | [Silver / Gold / Platinum / Custom] |
| **Base Price** | $[amount] |
| **Base Hours** | [X] hours |
| **Scope** | [1-2 sentence scope summary] |

### Accelerators Included

| Accelerator | Why | Value |
|-------------|-----|-------|
| [Accelerator 1] | [Which use case it supports] | [What it delivers faster] |
| [Accelerator 2] | [Which use case] | [What it delivers] |

### Value-Add Modules

| Module | Hours | Why | Timing |
|--------|-------|-----|--------|
| [Module 1] | [X] hrs | [Gap it addresses] | [Pre / During / Post engagement] |
| [Module 2] | [X] hrs | [Gap it addresses] | [Timing] |

---

## Engagement Summary

| Component | Hours | Investment |
|-----------|-------|-----------|
| Base Package ([Tier]) | [X] hrs | $[amount] |
| [Accelerator 1] | Included | Included |
| [Module 1] | [X] hrs | $[amount or included] |
| [Module 2] | [X] hrs | $[amount or included] |
| **Total** | **[X] hrs** | **$[amount]** |

---

## Use Case → Package Mapping

| Use Case (from ROI Hypothesis) | Complexity | Hours Est. | Package Component | Accelerator |
|-------------------------------|------------|------------|-------------------|-------------|
| [UC1: Dashboard Suite] | Medium | 40-60 hrs | Base package | Executive Dashboard Starter |
| [UC2: Data Pipeline Build] | High | 60-80 hrs | Base package | — |
| [UC3: Training Program] | Low | 16-24 hrs | Value-add module | Champion Training |

---

## Investment vs. ROI

| | Without PS | With PS (This Engagement) |
|---|---|---|
| **Annual Platform Value** | $[current — from health gaps] | $[projected — from ROI hypothesis] |
| **PS Investment** | $0 | $[engagement cost] |
| **Health Grade** | [Current] | [Projected] |
| **Renewal Probability** | [Current forecast %] | [Improved forecast %] |
| **Protected/Grown ARR** | — | $[amount] |
| **ROI Multiple** | — | [X]x |

---

## Alternative Configurations

### Option A: Minimum Viable (Budget-Conscious)
| Component | Hours | Investment |
|-----------|-------|-----------|
| Silver Package | [X] hrs | $[amount] |
| [Essential module only] | [X] hrs | Included |
| **Total** | **[X] hrs** | **$[amount]** |

*Trade-off: Covers [N] of [N] use cases. Leaves [gap] unaddressed.*

### Option B: Recommended (Best Value)
[Primary recommendation from above]

### Option C: Comprehensive (Maximum Impact)
| Component | Hours | Investment |
|-----------|-------|-----------|
| Platinum Package | [X] hrs | $[amount] |
| [All relevant accelerators] | [X] hrs | Included |
| [All relevant modules] | [X] hrs | $[amount] |
| **Total** | **[X] hrs** | **$[amount]** |

*Trade-off: Covers all [N] use cases plus enablement and governance.*

---

## Customer Context Considerations

| Factor | Implication for Offering |
|--------|------------------------|
| **ARR: $[X]** | [Investment capacity: engagement should be < X% of ARR for easy approval] |
| **Segment: [X]** | [Enterprise = custom, Mid-Market = Gold/Platinum, SMB = Silver/Gold] |
| **Services History** | [First engagement = include discovery. Repeat customer = skip onboarding] |
| **Renewal in [X] days** | [If <90d: engagement must show value before renewal. Time-constrain the scope] |

---

## → Next in Pipeline

This Offering Recommendation feeds into:
- **SOW Builder** — generates the formal Statement of Work with terms, timeline, and deliverables

Say: "build SOW for [Account Name]" → generates the SOW

---

**Prepared by:** Compass Offering Matchmaker Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Scoping Assets → Position 4
**Catalog Version:** FY27 (pending — using placeholder catalog)
```

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account and UseCaseInventory from `engagement-artifacts`).
### After executing
- Call `memory_remember` with package mapping and pricing rationale scoped to `{account_id}`.
- Call `memory_store_artifact` for the OfferingMatch in `engagement-artifacts`.

---

## Guardrails

- **Never fabricate pricing.** If the FY27 catalog isn't loaded, use placeholder ranges and clearly label them as estimates.
- **Always offer 2-3 options.** Budget-conscious, recommended, and comprehensive. Let the customer choose their investment level.
- **ROI must exceed investment.** If the ROI from the upstream hypothesis doesn't justify the package cost, flag it. Don't force a package that doesn't pencil out.
- **Respect segment norms.** Don't recommend a $80K Platinum package to a $40K ARR SMB account. Investment should be proportional to ARR.
- **Accelerators reduce time, not cost.** Make clear that accelerators speed up delivery — they're included in the package, not additional cost.
- **Value-adds are optional, not mandatory.** Present them as enhancements, not requirements. The customer can choose which modules to include.
- **Carry the traceability chain.** Every package component must trace back to a use case in the ROI Hypothesis.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_lookup | **Yes** | ARR, segment, services history — sizing inputs |
| actions_lookup | Optional | Growth signals may suggest expansion packages |
| hgplatformutilization_lookup | Optional | Enabled-but-unused features map directly to specific PS packages |
| sfopportunities_lookup | Optional | Past service revenue breakdown and active deal context |
| ROI Hypothesis | **Yes** (pipeline) | Defines use cases and expected value |
| Solution Architecture | Recommended (pipeline) | Defines technical complexity and hours |
| FY27 Service Catalog | **Yes** (reference) | ⚠️ Not yet provided |

---

## Related Skills

- **Customer ROI Hypothesis** (Discover) → Upstream — defines WHAT to deliver
- **Solution Architect** (Discover) → Upstream — defines HOW complex
- **SOW Builder** (Discover) → Downstream — formalizes the engagement
- **Template Registry** (Global) → Proposal templates for formatting
