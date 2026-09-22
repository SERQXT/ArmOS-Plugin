---
name: service-matchmaker
tier: 1
description: "Map the scoped and estimated solution to the best-fit engagement structure, package tier, and commercial posture — and produce a set of options for the SSD to choose from. Trigger with 'match the service package for [account]', 'what package fits [account]', 'commercial recommendation for [account]', or 'how should we price [account]'. Requires a locked Scope Model and LOE Estimate. Does not make pricing decisions — recommends within guardrails for SSD judgment."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: commercial
  sub_phase: commercial-design
  position: 6
  output_type: output
  wave: 2
  state: ready
  inputs:
    - agent: package-mapping
      required: true
      data: Package Mapping — recommended package tier, pricing, internal LOE reference
    - agent: loe-estimator
      required: true
      data: LOE Estimate — hours by workstream, expected total, confidence assessment
    - agent: scope-builder
      required: true
      data: locked Scope Model — workstream breakdown, deliverables, assumptions
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — use cases, platform components, customer value profile
    - agent: discovery-synthesizer
      required: false
      data: Discovery Record — value drivers, budget signal, delivery preference, deal expansion potential
  outputs:
    - name: commercial-recommendation
      format: markdown
      downstream:
        - agent: proposal-generator
        - agent: sow-generator
        - agent: cpq-validator
  data_sources:
    - tool: fileset_search
      required: true
    - tool: portfolio_lookup
      required: false
  phase_gate: true
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Service Matchmaker — Commercial Recommendation

Maps the scoped and estimated solution to the best-fit Domo PS engagement structure, package tier, and commercial posture. Produces a set of clearly reasoned options for the SSD to evaluate and decide from.

This skill recommends — it does not decide. Commercial judgment belongs to the SSD. The Service Matchmaker's job is to provide the right options, the right reasoning, and the right guardrails so the SSD can make a fast, confident decision.

## How It Works

```
LOE Estimate + Scope Model + Solution Blueprint + Discovery Record
                          |
  +--------+--------+--------+--------+--------+
  |        |        |        |        |        |
Package  Engage.  Pricing  Option   Rationale
 Match   Structure Posture  Set    & Guardrails
  |        |        |        |        |        |
  +--------+--------+--------+--------+--------+
                          |
            SSD Selects Commercial Path
                          |
       🔵 OUTPUT: Commercial Recommendation
                          |
     → Proposal Generator + SOW Generator + CPQ Validator
```

## Triggers

- "match the service package for [account]"
- "what package fits [account]"
- "commercial recommendation for [account]"
- "how should we price [account]"
- "what engagement structure for [account]"
- "package and pricing options for [account]"

**Prerequisite:** LOE Estimate must be reviewed and accepted by the SSD. Running commercial matching against a draft estimate produces misleading recommendations.

---

## Execution Flow

### Step 1: Load Inputs

```
loe-estimator output      → total hours (low / expected / high), workstream breakdown
scope-builder output      → workstream list, complexity profile, delivery model
solution-blueprint output → use cases, platform components, customer value profile
discovery-synthesizer     → value drivers, budget signal, delivery preference, expansion potential
portfolio_lookup          → ARR, segment, account history, renewal context

fileset_search("FY service catalog packages tiers")
fileset_search("PS packaging pricing rules engagement structure")
fileset_search("fixed bid T&M retainer guidance")
→ Load current service catalog, package definitions, pricing rules, and engagement structure guidance
```

---

### Step 2: Characterize the Engagement

Before matching to a package, build a clear profile of the engagement:

| Dimension | Assessment | Source |
|-----------|-----------|--------|
| **Total LOE** | [X] hrs expected ([low]–[high] range) | LOE Estimate |
| **Complexity profile** | [Simple / Moderate / Complex / Enterprise] | LOE inputs — multiplier levels |
| **Workstream mix** | [Standard / Includes Everywhere / Automation / App Studio] | Scope Model |
| **Delivery model** | [Domo-led / Co-delivery / Teach-to-fish / Retainer] | Discovery Record |
| **Timeline pressure** | [Tight / Standard / Flexible] | Discovery Record |
| **Budget signal** | [Known ceiling / Range / Unstated] | Discovery Record |
| **Value driver** | [Cost savings / Revenue enablement / Risk reduction / Productivity] | Discovery Record |
| **Expansion potential** | [High / Medium / Low] | Discovery Record + ARR |
| **Account strategic importance** | [Strategic / Standard / New logo] | portfolio_lookup |

This profile determines which package tiers are eligible and which commercial posture is appropriate.

---

### Step 3: Match to Package Catalog

```
fileset_search("service catalog package tiers eligibility criteria")
→ Load package definitions — hours ranges, included accelerators, optional modules,
  eligibility rules, and value-add components per tier
```

For each package tier, assess fit against the LOE and engagement profile:

| Package Tier | Hours Range | Fit Assessment | Gap or Surplus | Notes |
|-------------|------------|---------------|----------------|-------|
| [Tier A — e.g., Silver] | [range] | Good / Partial / Poor fit | [+/- hrs vs. LOE expected] | [What it includes/excludes vs. scope] |
| [Tier B — e.g., Gold] | [range] | Good / Partial / Poor fit | [+/- hrs] | |
| [Tier C — e.g., Platinum] | [range] | Good / Partial / Poor fit | [+/- hrs] | |
| Custom-scoped | N/A — bespoke | [When appropriate] | | |
| Retainer | N/A — ongoing | [When appropriate] | | |

**Fit criteria to evaluate:**
- Does the package hours range contain the LOE expected total?
- Does the package include the accelerators or modules this engagement needs?
- Does the package structure match the delivery model (fixed-bid vs. flexible)?
- Does the package pricing align with the customer's budget signal?
- Is there a meaningful value-add that differentiates this tier from the one below?

---

### Step 4: Determine Commercial Posture

```
fileset_search("fixed bid T&M retainer commercial posture guidance")
→ Reference criteria for each engagement structure type
```

Evaluate which commercial structure is appropriate:

| Structure | When It Fits | Risk Profile |
|-----------|-------------|-------------|
| **Fixed-bid / Packaged** | Scope is well-defined and locked; complexity is understood; customer wants price certainty | Lower commercial risk if LOE is accurate; scope creep is the main risk |
| **Time & Materials (T&M)** | Scope has significant unknowns; complexity is high; customer flexibility is needed | Requires strong change management; customer may resist without a ceiling |
| **Capped T&M** | Unknowns exist but customer needs a ceiling; provides flexibility with protection | Good middle ground for moderate-uncertainty engagements |
| **Retainer** | Ongoing advisory, flexible deliverables, no fixed endpoint; expansion-focused | Requires clear definition of included services and out-of-scope triggers |
| **Phased fixed-bid** | Large scope that can be broken into discrete phases; phase 1 locks, later phases flex | Reduces commitment risk; allows scope refinement between phases |

Flag any mismatch between the recommended structure and the LOE confidence level:
- LOW-confidence LOE → do not recommend fixed-bid without appropriate contingency buffer
- Wide LOE range (high/low spread > 25%) → flag as risky for fixed-bid; recommend T&M or phased

---

### Step 5: Build Option Set

Produce 2–3 clearly differentiated options. Every option must be genuinely different — not fake alternatives.

**Option structure for each:**

```
Option [A/B/C]: [Name — e.g., "Recommended", "Lean MVP", "Full Scope"]
  Package / Structure: [Package tier or engagement model]
  Hours: [from LOE, adjusted for option scope if phased]
  Pricing framework: [from fileset pricing rules — do not invent rates]
  What's included: [Workstreams and deliverables in this option]
  What's excluded: [Workstreams or scope items not in this option]
  Why this option: [Clear rationale — value, risk, timeline, budget fit]
  Trade-off vs. recommended: [What the customer gains or gives up]
```

**Common option patterns:**

| Pattern | When to Use |
|---------|-------------|
| Recommended vs. Lean MVP | Customer has budget constraint; Phase 1 delivers core value, Phase 2 gets remainder |
| Recommended vs. Expanded | Customer shows appetite for more; upsell path to higher tier or add-ons |
| Fixed-bid vs. T&M | Scope uncertainty is moderate; give customer a choice of structure |
| Single phase vs. Phased | Large scope; phasing reduces risk and commitment barrier |

**Do not present:**
- Options that differ only in price (not scope or structure)
- Options with no genuine rationale
- More than three options — decision paralysis helps no one

---

### Step 6: Assess Pricing Posture

```
fileset_search("pricing posture value-based discount guidance")
→ Reference pricing alignment to value delivered and account context
```

Provide a pricing posture recommendation for the SSD:

| Consideration | Assessment | Implication |
|--------------|-----------|-------------|
| **Value delivered vs. price** | [Is the price proportionate to expected ROI?] | [Price confidence] |
| **Budget signal alignment** | [Does LOE hours × rate fit the stated/implied budget?] | [Negotiation risk] |
| **Account ARR and strategic value** | [Is this a strategic account where investment in terms makes sense?] | [Flexibility signal] |
| **Competitive context** | [Is there competitive pressure that affects price posture?] | [Discount risk] |
| **Expansion potential** | [Is Phase 1 a beachhead for a larger engagement?] | [Justify investment if needed] |

Pricing posture options:
- **Hold firm** — value is clear, scope is tight, customer is bought in
- **Flexible on structure, not price** — offer phasing or retainer before discounting
- **Modest flexibility available** — within SSD's discretion, flag the ceiling
- **Escalate for approval** — deal size or discount level requires management sign-off

This is a recommendation, not a directive. The SSD owns the final pricing decision.

---

### Step 7: Document Rationale

The SSD must be able to explain the recommended option to their manager and to the customer. Every recommendation needs a one-paragraph rationale that answers:

1. Why this package/structure fits the scope
2. Why the pricing is aligned to value
3. What the risk is if the customer pushes back
4. What the path is if they want a lower price

---

## Output Template

```markdown
# Commercial Recommendation: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **SSD:** [Name]
**Based on:** LOE Estimate (expected [X] hrs) | Scope Model (LOCKED) | Solution Blueprint (LOCKED)
**Status:** DRAFT — Pending SSD Decision

---

## Engagement Profile

| Dimension | Assessment |
|-----------|-----------|
| Total LOE | [X] hrs ([low]–[high] range) |
| Complexity | [Simple / Moderate / Complex / Enterprise] |
| Workstream Mix | [Standard / + Everywhere / + Automation / + App Studio] |
| Delivery Model | [Domo-led / Co-delivery / Teach-to-fish] |
| Budget Signal | [Known: $X / Implied: $X–$X / Unstated] |
| Value Driver | [Primary driver from Discovery Record] |
| Expansion Potential | [High / Medium / Low] — [rationale] |
| Account Context | [ARR, segment, strategic importance] |

---

## Package Match Analysis

| Package | Hours Range | Fit | Hours vs. LOE | Notes |
|---------|------------|-----|--------------|-------|
| [Tier A] | [range] | ✅ Good / ⚠️ Partial / ❌ Poor | [+/- hrs] | [Notes] |
| [Tier B] | [range] | | | |
| [Tier C] | [range] | | | |
| Custom | N/A | [If appropriate] | | |

---

## Options

### Option A — Recommended: [Name]

| | |
|---|---|
| **Package / Structure** | [Tier / engagement model] |
| **Total Hours** | [X] hrs |
| **Pricing Framework** | [Rate structure and total from fileset rules] |
| **Commercial Structure** | [Fixed-bid / T&M / Capped T&M / Retainer / Phased] |

**Included:**
- [Workstream 1 with key deliverables]
- [Workstream 2 with key deliverables]

**Excluded:**
- [Items not in this option]

**Why this option:**
[1–2 sentences — why this is the best fit for this customer given their scope, value, and context]

---

### Option B: [Name]

| | |
|---|---|
| **Package / Structure** | |
| **Total Hours** | [X] hrs |
| **Pricing Framework** | |
| **Commercial Structure** | |

**What changes vs. Option A:**
- [What is added or removed]

**Trade-off:**
[What the customer gains or gives up vs. Option A]

---

### Option C (if applicable): [Name]
*[Same structure]*

---

## Recommended Option

**Recommendation: Option [A/B/C] — [Name]**

[Paragraph rationale — why this option fits the scope, aligns to value, manages risk, and positions for expansion]

**If customer pushes back on price:**
[Specific guidance — which lever to pull first: phasing, scope reduction, structure change, or escalation]

---

## Pricing Posture

**Posture: [Hold firm / Flexible on structure / Modest flexibility / Escalate]**

| Consideration | Assessment |
|--------------|-----------|
| Value vs. price alignment | [Assessment] |
| Budget signal | [Known / Implied / Unstated — and implication] |
| Competitive context | [Any known pressure] |
| Expansion potential | [Justification for investment if needed] |

**SSD discretion ceiling:** `[REQUIRES SSD INPUT — or pull from approval rules in fileset]`

---

## Next Steps

1. SSD selects commercial option and pricing posture
2. Lock Commercial Recommendation → feeds Proposal Generator and SOW Generator
3. AE alignment on pricing before customer presentation
4. [Any escalation or approval required before presenting]

---

**Prepared by:** CS Solutions Service Matchmaker Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Commercial → Commercial Design → Position 6
**Phase Gate:** YES — SSD must select and lock the commercial option before Proposal or SOW proceeds
```

---

## Guardrails

- **This skill recommends — it does not decide.** Pricing authority belongs to the SSD. Never present a single option framed as "the answer." Always give the SSD genuine choices.
- **Do not invent rates or pricing.** All pricing must come from the fileset service catalog and pricing rules. If the catalog is not available in the fileset, flag it and ask the SSD to input pricing manually.
- **Options must be genuinely different.** A Gold package at $X and a Gold package at $X-5000 is not a real option set. Differentiate on scope, structure, or phasing — not just price.
- **Flag LOE confidence before recommending fixed-bid.** A fixed-bid recommendation on a LOW-confidence estimate is a liability. If the LOE range is wide, recommend T&M or phased, or explicitly flag the risk to the SSD.
- **Expansion potential is a commercial input, not a justification for padding.** If expansion potential is high, note it as context for the SSD's pricing posture. Do not inflate the scope to capture it.
- **Pricing posture guidance must be specific.** "Be flexible" is not guidance. "Offer phasing before discounting; flag if customer asks for more than 10% reduction" is guidance.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Service catalog, package tiers, pricing rules, engagement structure guidance |
| portfolio_lookup | Optional | ARR, segment, account history — informs strategic importance and pricing posture |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: service catalog packages matched, recommended tier, hours estimate, pricing rationale.
- Call `memory_store_artifact` to persist the service match in `engagement-artifacts`.

---

## Related Skills

- **LOE Estimator** → Upstream — total hours that drive package matching
- **Scope Builder** → Upstream — workstream complexity profile that informs package fit
- **Solution Blueprint** → Upstream — customer value profile and use cases
- **Proposal Generator** → Downstream — translates commercial recommendation into customer-facing narrative
- **SOW Generator** → Downstream — uses commercial recommendation for fees and engagement structure
- **CPQ Validator** → Downstream — verifies SOW/CPQ consistency against this recommendation
