---
name: expansion-identifier
tier: 1
description: "Surface and structure Phase 2 and expansion opportunities during or after a PS engagement — identify adjacent use cases, platform gaps, delivery discoveries, adoption signals, and backlog items, then package them into a future-scoping brief. Trigger with 'identify expansion opportunities for [account]', 'what's next for [account]', 'phase 2 ideas for [account]', 'find expansion signals for [account]', or 'build the next-phase brief for [account]'. Run during delivery, at project close, or at any customer touchpoint where expansion potential surfaces."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: adopt
  sub_phase: expansion-scouting
  position: 10
  output_type: output
  wave: 3
  state: ready
  inputs:
    - agent: knowledge-handoff
      required: false
      data: Handoff Dossier — backlog items, watch-outs, items almost not sold, stakeholder map
    - agent: scope-builder
      required: false
      data: locked Scope Model — explicit out-of-scope list, exclusions register
    - agent: discovery-synthesizer
      required: false
      data: Discovery Record — use cases mentioned but not prioritized, unresolved questions
  outputs:
    - name: expansion-summary
      format: markdown
      downstream:
        - agent: pre-scoping-brief
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: gong_transcript_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: fileset_search
      required: false
  phase_gate: false
---

# Expansion Identifier — Phase 2 and Expansion Opportunity Scouting

Surfaces and structures expansion opportunities by systematically mining six signal sources: the Phase 1 backlog, discovery residue, platform gaps, adoption signals, delivery discoveries, and organizational changes. Packages the findings into a future-scoping brief the SSD, CSM, or Consulting Lead can use to initiate a Phase 2 conversation.

This skill does not create new scope or make commercial recommendations. It produces opportunity hypotheses — structured, evidence-based, and ready for the team to evaluate and decide when to commercialize.

## How It Works

```
Scope Model (backlog) + Discovery Residue + Platform Usage + Delivery Updates
+ Gong History + Organizational Context
                            |
  +--------+--------+--------+--------+--------+--------+
  |        |        |        |        |        |        |
Backlog  Discovery Platform Delivery  Org    Adoption
 Items   Residue   Gaps    Discoveries Changes Signals
  |        |        |        |        |        |        |
  +--------+--------+--------+--------+--------+--------+
                            |
         Classify, Prioritize, and Package
                            |
          🔵 OUTPUT: Expansion Summary + Future-Scoping Brief
                            |
           → Pre-Scoping Brief (re-enters workflow for Phase 2)
```

## Triggers

- "identify expansion opportunities for [account]"
- "what's next for [account]"
- "phase 2 ideas for [account]"
- "find expansion signals for [account]"
- "build the next-phase brief for [account]"
- "expansion scan for [account]"

**When to run:**
- Mid-delivery (weeks 4–6) — early enough to plant seeds before project close
- At project close — capture delivery learnings while they are fresh
- At any QBR, business review, or customer touchpoint where expansion comes up
- When the CSM or Consulting Lead flags a customer signal

---

## Execution Flow

### Step 1: Load All Context

```
scope-builder output           → out-of-scope list, exclusions register, items deferred to Phase 2
discovery-synthesizer output   → use cases mentioned but not prioritized, unresolved questions
knowledge-handoff output       → backlog items, items almost not sold, watch-outs, stakeholder map

portfolio_lookup(account_name)
→ Current account health (HG Grades if available), ARR, products in use,
  renewal date, CSM notes, recent activity signals

gong_transcript_lookup(account_name, limit=10, recency="delivery period")
→ Delivery-period conversations — what has come up since kickoff
→ New use cases mentioned, pain points surfaced during build,
  stakeholder statements about future needs

calls_lookup(account_name, limit=10)
→ Recent CS and sales calls — expansion signals from the broader relationship

fileset_search("Domo platform capabilities expansion use cases")
→ Reference platform capabilities not yet deployed that may fit this customer
```

---

### Step 2: Mine the Six Signal Sources

Work through each source systematically. Every signal gets evaluated for expansion potential.

---

#### Signal Source 1: Phase 1 Backlog

The most reliable expansion source — these are things the customer already wanted but couldn't include in Phase 1.

From the Scope Model out-of-scope list and Handoff Dossier "what was almost not sold" section:

| Backlog Item | Why It Was Excluded | Customer's Reaction at Exclusion | Expansion Readiness |
|-------------|--------------------|---------------------------------|---------------------|
| [Item from Scope Model exclusions] | Budget / Timing / Complexity | [Accepted reluctantly / Unaware / Planning to revisit] | High / Medium / Low |

**Readiness signals for backlog items:**
- Customer mentioned it again during delivery → HIGH
- It was excluded for budget reasons only, not complexity → HIGH
- It was deferred with explicit "Phase 2" language in the SOW → HIGH
- Customer has not referenced it since scoping → MEDIUM
- It was excluded because the customer didn't see value → LOW

---

#### Signal Source 2: Discovery Residue

Use cases and requirements that surfaced in discovery but were not prioritized for Phase 1.

From the Discovery Record — use cases mentioned but not included:

| Use Case | When Mentioned | Why Not Included | Fit Assessment |
|----------|---------------|-----------------|---------------|
| [Use case from Discovery Record unresolved items] | [Call date] | [Prioritization / Budget / Complexity] | Strong / Moderate / Weak |

```
gong_transcript_lookup → search transcripts for use cases mentioned once and never followed up:
  "we also want to", "eventually we'd like to", "down the road", "that's on our roadmap"
→ Surface these as expansion candidates that may have been forgotten
```

---

#### Signal Source 3: Platform Gaps

Domo capabilities that fit this customer's profile but are not yet deployed.

```
fileset_search("Domo platform capabilities [customer industry / use case type]")
→ Identify capabilities relevant to this customer that Phase 1 did not include
```

Evaluate against the account profile and what was learned during discovery and delivery:

| Platform Capability | Why It Fits This Customer | Deployment Readiness | Value Hypothesis |
|--------------------|--------------------------|---------------------|-----------------|
| [e.g., Domo Everywhere] | Customer has external partners who need data access — mentioned in call 3 | High — Phase 1 data is ready to distribute | Monetize existing data with external users |
| [e.g., Workflows automation] | Manual approval process described in discovery — not prioritized | Medium — needs process definition | Save X hrs/week in manual routing |
| [e.g., AI Chat / conversational analytics] | Leadership wants self-service — mentioned by CFO | Medium — depends on data quality from Phase 1 | Enable exec self-service without IT |
| [e.g., App Studio] | Customer expressed desire for embedded experience in their product | Low — needs product roadmap alignment | Differentiate customer's product with embedded analytics |

---

#### Signal Source 4: Delivery Discoveries

Things the consulting team learned during build that suggest new value or new needs.

```
gong_transcript_lookup(recency="delivery period")
→ Delivery calls — what issues came up, what the customer asked about,
  what the team noticed about data, systems, or user behavior
```

This signal source requires delivery team input — either from the Lead Consultant or from delivery call transcripts:

| Discovery | Context | Expansion Signal | Opportunity |
|-----------|---------|-----------------|-------------|
| [e.g., "Found that customer has 3 additional data sources they didn't mention in scoping"] | Data profiling week 1 | High — they have more to connect | Phase 2 data connection and additional use cases |
| [e.g., "Customer's operations team asked about automating weekly report distribution"] | Delivery call week 4 | High — clear use case, confirmed need | Workflows / alerts add-on |
| [e.g., "IT revealed they're migrating their ERP in Q3"] | Delivery call week 5 | Medium — creates re-connect opportunity | New connector + data model update post-migration |

**Prompt for delivery team input:** "What surprised you during build that the SSD should know about? What did the customer ask for that was out of scope? What data or systems did you discover that we didn't know about?"

---

#### Signal Source 5: Organizational Changes

Changes in the customer's organization that create new opportunities or change the expansion landscape.

```
gong_transcript_lookup + calls_lookup
→ New stakeholders mentioned, org changes, leadership announcements,
  new business units, M&A signals, headcount changes, tool consolidation

portfolio_lookup → CSM notes, account signals, renewal context
```

| Change | Signal Type | Expansion Implication |
|--------|------------|----------------------|
| [e.g., New CTO hired who came from data-driven company] | Relationship signal | New champion — reach out; higher appetite for platform expansion |
| [e.g., Company acquiring a smaller competitor] | Strategic signal | New data source integration need; potentially new Domo instance |
| [e.g., CSM flagged renewed executive interest in AI] | Adoption signal | AI / Code Engine conversation readiness |
| [e.g., Customer expanding to new markets / regions] | Growth signal | Domo Everywhere / Publish for new regional distribution] |

---

#### Signal Source 6: Adoption Signals

How the customer is actually using what was built — and where there are gaps or accelerators.

```
portfolio_lookup → account health data if available (HG Grades, platform usage metrics)
gong_transcript_lookup → delivery calls — user feedback, adoption concerns, enthusiasm signals
```

| Adoption Pattern | Signal | Expansion Implication |
|-----------------|--------|----------------------|
| High usage on dashboards built → users asking for more | POSITIVE | Users are bought in — expand visualization footprint |
| Low engagement on specific dashboard | NEGATIVE | May indicate data quality issue, training gap, or wrong use case — PS advisory opportunity |
| Power users emerging who want to build their own | POSITIVE | Teach-to-fish Phase 2, self-service enablement |
| Executive engagement spike at go-live | POSITIVE | Strike while iron is hot — Phase 2 conversation now |
| Governance challenges emerging | NEGATIVE → OPPORTUNITY | Governance advisory / CoE engagement |
| Users hitting limitations (too many dimensions, performance) | NEUTRAL → OPPORTUNITY | Architecture optimization, DataFusion expansion |

---

### Step 3: Classify and Prioritize Opportunities

Evaluate each identified opportunity on two dimensions:

**Evidence strength:** How well-documented is the signal?
- **STRONG** — Customer explicitly stated the need in a call or email
- **MODERATE** — Signal inferred from multiple indicators; not directly stated
- **SPECULATIVE** — Pattern-based hypothesis; no specific customer signal yet

**Expansion readiness:** How ready is the customer to act on this?
- **HIGH** — Customer has shown appetite, data is ready, champion is engaged
- **MEDIUM** — Opportunity is clear but timing or budget is uncertain
- **LOW** — Valid hypothesis but no near-term trigger or champion

**Priority matrix:**

| | HIGH Readiness | MEDIUM Readiness | LOW Readiness |
|---|---|---|---|
| **STRONG evidence** | ⭐ Act now — initiate conversation | 🔵 Schedule for next QBR | 🟡 Monitor — plant seeds |
| **MODERATE evidence** | 🔵 Probe at next touchpoint | 🟡 Add to expansion watchlist | ⬜ Track for future |
| **SPECULATIVE** | 🟡 Mention casually — gauge reaction | ⬜ Track for future | ⬜ Drop unless signal strengthens |

---

### Step 4: Build the Future-Scoping Brief

For each ⭐ and 🔵 opportunity, build a scoping starter that the SSD or Consulting Lead can use to open the Phase 2 conversation.

**Brief structure per opportunity:**

```
Opportunity: [Name]
Signal source: [Backlog / Discovery Residue / Platform Gap / Delivery Discovery / Org Change / Adoption]
Evidence: [STRONG / MODERATE / SPECULATIVE]
Readiness: [HIGH / MEDIUM / LOW]
Priority: [⭐ Act now / 🔵 Next QBR / 🟡 Monitor]

The opportunity:
[1–2 sentences — what the customer could do next and why it matters to them]

Why now:
[What makes this the right time — delivery momentum, org change, adoption signal, etc.]

How to open the conversation:
[Specific suggested language for the SSD or CSM to use at the next touchpoint]
Example: "Now that the sales dashboard is live and your team is using it daily, you mentioned
wanting to distribute it to your distributor network. Want us to scope that out?"

Likely scope shape:
[What Phase 2 might look like — workstreams, rough size, platform components]
This is a hypothesis only — not a commitment. The Pre-Scoping Brief will develop it properly.

Pre-Scoping Brief inputs:
[What context to pass to the Pre-Scoping Brief if the customer engages on this opportunity]
```

---

## Output Template

```markdown
# Expansion Opportunity Summary: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **Prepared by:** [SSD / CSM / Consulting Lead]
**Phase 1 Status:** [In delivery — Week X / Complete — [Date]]
**Next touchpoint:** [QBR date / Status call date / Ad hoc]

---

## Priority Opportunities

### ⭐ Act Now

#### [Opportunity Name 1]
**Signal:** [Source] | **Evidence:** STRONG | **Readiness:** HIGH

[The opportunity in 2 sentences]

**Why now:** [Trigger or timing rationale]

**How to open it:**
> "[Suggested conversation opener — specific and natural]"

**Likely Phase 2 shape:** [Workstreams, rough size, key deliverables]

---

#### [Opportunity Name 2]
*[Same structure]*

---

### 🔵 Next QBR / Review

#### [Opportunity Name 3]
**Signal:** [Source] | **Evidence:** MODERATE | **Readiness:** MEDIUM

[Summary and conversation approach]

---

### 🟡 Monitor

#### [Opportunity Name 4]
**Signal:** [Source] | **Evidence:** SPECULATIVE | **Readiness:** LOW

[Brief description — what to watch for that would move this up]

---

## Signal Source Summary

| Source | Opportunities Found | Highest Priority |
|--------|--------------------|--------------------|
| Phase 1 Backlog | [#] | [Top item] |
| Discovery Residue | [#] | [Top item] |
| Platform Gaps | [#] | [Top item] |
| Delivery Discoveries | [#] | [Top item] |
| Organizational Changes | [#] | [Top item] |
| Adoption Signals | [#] | [Top item] |

---

## Full Opportunity Register

*All identified opportunities including those not yet ready to act on.*

| Opportunity | Source | Evidence | Readiness | Priority | Notes |
|-------------|--------|----------|-----------|----------|-------|
| [Opp 1] | | STRONG | HIGH | ⭐ | |
| [Opp 2] | | MODERATE | MEDIUM | 🔵 | |
| [Opp 3] | | SPECULATIVE | LOW | 🟡 | |

---

## Pre-Scoping Brief Inputs (for ⭐ opportunities)

*Pass this context to the Pre-Scoping Brief when the customer engages on a Phase 2 conversation.*

| Field | Value |
|-------|-------|
| Account name | [Account] |
| Opportunity name | [Phase 2 / Expansion name] |
| Context from Phase 1 | [What was built, what matters, what was left out] |
| Key stakeholders | [From Phase 1 stakeholder map] |
| Known requirements | [From backlog / discovery residue] |
| Watch-outs | [From knowledge-handoff dossier] |

---

**Prepared by:** CS Solutions Expansion Identifier Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Adopt → Expansion Scouting → Position 10
**Next action:** Team reviews and decides which opportunities to pursue and when to commercialize
```

---

## Guardrails

- **Opportunities must be evidence-based, not wishful.** Every hypothesis needs a source signal. "They might want more dashboards" is not an expansion opportunity. "The CFO asked about connecting their HR system on the week 4 call" is.
- **Do not conflate expansion with scope creep.** If the customer asks for something during Phase 1 that is out of scope, the delivery team handles it through the change request process. The Expansion Identifier packages it as a Phase 2 opportunity — not an immediate add.
- **Timing is as important as opportunity.** A real opportunity at the wrong time is a lost sale. Assess readiness honestly. Pushing Phase 2 before Phase 1 is successful will damage trust.
- **The delivery team's input is required.** Signal Source 4 (Delivery Discoveries) cannot be populated from artifacts alone. The Lead Consultant or data engineer will know things that are not in any transcript. Build in a structured prompt for their input.
- **The Pre-Scoping Brief is the handoff for Phase 2.** When a customer engages on an expansion opportunity, the workflow re-enters at Skill 1. Pre-populate the Pre-Scoping Brief inputs from this summary to give the next cycle a head start.
- **Revenue is the team's call, not the AI's.** This skill surfaces and structures opportunities. The decision to pursue, the timing, and the commercialization strategy belong to the SSD, CSM, and Consulting Lead together.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_lookup | **Yes** | Account health, usage signals, renewal context, CSM notes |
| gong_transcript_lookup | **Yes** | Delivery-period conversations, new signals, explicit customer requests |
| calls_lookup | Optional | CS and sales call supplemental context |
| fileset_search | Optional | Platform capability reference for gap analysis |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["account"]}`, content summarizing: expansion opportunities identified, upsell signals, cross-sell potential, recommended next engagements, ARR impact estimate.

---

## Related Skills

- **Knowledge Handoff** → Upstream — backlog items, items almost not sold, stakeholder context
- **Scope Builder** → Upstream — explicit out-of-scope list is the primary backlog source
- **Discovery Synthesizer** → Upstream — use cases mentioned but not prioritized
- **Pre-Scoping Brief** → Downstream — when customer engages on Phase 2, re-enter the workflow here with pre-populated context
