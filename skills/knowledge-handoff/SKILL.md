---
name: knowledge-handoff
tier: 1
description: "Prepare the consulting delivery team for a won engagement — synthesize all pre-sales artifacts and Gong history into a Handoff Dossier that tells the team not just what was sold but why, who the stakeholders really are, what risks and watch-outs exist, what commitments were made, and what to do first. Trigger with 'build the handoff for [account]', 'prepare delivery handoff for [account]', 'generate handoff dossier for [account]', or 'brief the delivery team on [account]'. Run after SOW is signed."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: handoff
  sub_phase: delivery-preparation
  position: 9
  output_type: output
  wave: 3
  state: ready
  inputs:
    - agent: sow-generator
      required: true
      data: final signed SOW — scope, deliverables, assumptions, customer team, fees, timeline
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — solution statement, use cases, architecture, operating model
    - agent: scope-builder
      required: true
      data: locked Scope Model — workstream detail, exclusions, customer responsibilities
    - agent: loe-estimator
      required: true
      data: LOE Estimate — hours by workstream
    - agent: discovery-synthesizer
      required: true
      data: Discovery Record — stakeholder map, delivery preference, value drivers, risks
    - agent: connection-strategy
      required: true
      data: Connection Strategy — data ingestion methods, authentication requirements, customer dependencies, integration risks
    - agent: proposal-generator
      required: false
      data: Proposal content — what was presented to customer, ROI commitments, option selected
  outputs:
    - name: handoff-dossier
      format: markdown
      downstream:
        - agent: expansion-identifier
  data_sources:
    - tool: gong_transcript_lookup
      required: true
    - tool: portfolio_lookup
      required: false
    - tool: calls_lookup
      required: false
    - tool: fileset_search
      required: false
  phase_gate: true
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Knowledge Handoff Generator — Delivery Team Briefing

Synthesizes all pre-sales artifacts and Gong history into a Handoff Dossier that prepares the consulting team for delivery. The dossier tells the team not just what was sold — the SOW already does that — but why the deal exists, who the people are, what risks are real, what was promised in conversation, and what to prioritize at kickoff.

This is where human nuance matters most. The AI drafts the structure from artifacts. The SSD sharpens it with everything that is not in the documents — the politics, the personalities, the soft commitments, the things that could derail the project if the delivery team doesn't know about them.

A delivery team that reads this dossier should feel fully briefed in 30 minutes. They should know exactly what they're walking into.

## How It Works

```
SOW + Solution Blueprint + Scope Model + Discovery Record
    + Gong History + Proposal Content
                        |
  +-------+-------+-------+-------+-------+-------+
  |       |       |       |       |       |       |
 Why    What   Who's   Risks  Commit- Kickoff
 This   Was    Who   & Watch  ments  Priorities
 Deal   Sold           outs   Made
  |       |       |       |       |       |       |
  +-------+-------+-------+-------+-------+-------+
                        |
            SSD Adds Nuance and Validates
                        |
         🔵 OUTPUT: Handoff Dossier
                        |
             → Delivery Team + Expansion Identifier
```

## Triggers

- "build the handoff for [account]"
- "prepare delivery handoff for [account]"
- "generate handoff dossier for [account]"
- "brief the delivery team on [account]"
- "create the project kickoff brief for [account]"
- "transfer knowledge for [account]"

**Prerequisite:** SOW must be signed. Running the handoff before close creates a dossier that may not reflect the final scope.

---

## Execution Flow

### Step 1: Load All Artifacts and Gong History

```
sow-generator output        → signed SOW scope, deliverables, assumptions, timeline, fees, teams
solution-blueprint output   → solution statement, use cases, architecture, platform components
scope-builder output        → workstream detail, exclusions, customer responsibilities
loe-estimator output        → hours by workstream
discovery-synthesizer output → stakeholder map, delivery preference, value drivers, open questions
proposal-generator output   → what was presented, ROI claims, option selected vs. alternatives

gong_transcript_lookup(account_name, limit=10, recency="all")
→ Full conversation history — sales calls, discovery calls, negotiation calls
→ Look for: commitments made, concerns raised, objections overcome, tone shifts,
            things said informally that are not in the SOW

calls_lookup(account_name, limit=5)
→ Any supplemental notes or follow-up email context

portfolio_lookup(account_name)
→ Account health, ARR, renewal, CSM, AE — relationship context
```

---

### Step 2: Write "Why This Deal" — The Story

This is the most important section and the one most likely to be left blank in a standard SOW handoff. The delivery team needs to understand why this engagement exists — the human story, not just the business case.

From Gong transcripts and Discovery Record, construct:

**The trigger:** What event, pain, or opportunity caused this customer to start this conversation now? Was it a leadership directive? A failed Tableau migration? An upcoming board presentation? A competitive threat? A new exec who was hired to drive data culture?

**The business pressure:** What is riding on this project internally for the customer? Who championed it, and what do they need to show?

**What the customer is really testing:** Beyond the stated success criteria — what will make the customer feel this was worth it? What would make them tell their colleagues? What would make them renew?

**The sales process narrative:** How did this deal come together? What was the sticking point? What alternatives did they consider? What tipped them toward Domo PS?

**What was almost not sold:** Were there scope items that almost didn't make it in? Were there items the customer wanted but couldn't afford? These are the first expansion opportunities.

---

### Step 3: Map What Was Sold — Formal Summary

Translate the SOW into plain language that a Lead Consultant can absorb quickly.

**Engagement summary:**

| | |
|---|---|
| **Package / structure** | [From Commercial Recommendation] |
| **Total hours** | [From LOE Estimate] |
| **Total investment** | [From SOW fees] |
| **Duration** | [From SOW timeline] |
| **Delivery model** | [Domo-led / Co-delivery / Teach-to-fish] |
| **Start date** | [From SOW] |

**What we sold — use case by use case:**

For each use case:
- What it is (one plain sentence)
- Why it matters to the customer (from Discovery Record)
- What we will deliver (from Scope Model)
- How success will be measured (from Solution Blueprint / proposal)
- Hours allocated (from LOE Estimate)

**What we did not sell and why:**
Pull from the Scope Model out-of-scope list and, where possible, match each exclusion to the reason (budget, timing, complexity, deferred to Phase 2). This tells the delivery team what the customer may ask for — and what the answer is.

**The option not chosen:**
If the Commercial Recommendation had multiple options and the customer chose one, note what they did not choose and why. This context often surfaces in delivery as "we thought this was included."

---

### Step 4: Build the Stakeholder Intelligence Map

This is not an org chart. It is an intelligence brief on the humans the delivery team will work with.

```
gong_transcript_lookup → extract every named person, their statements, their concerns,
                          their engagement level, and how they showed up on calls
discovery-synthesizer  → formal stakeholder map as baseline
```

For each stakeholder:

| Name | Title | Role in Project | Influence | Attitude | Intelligence Notes |
|------|-------|----------------|-----------|----------|-------------------|
| [Name] | [Title] | Executive Sponsor | HIGH | Supportive but stretched | [Specific notes — "travels constantly, prefers email over calls", "was burned by a prior BI implementation — needs early wins to stay bought in", "key relationship is with the AE, not the SSD"] |
| [Name] | [Title] | Project Lead | HIGH | Enthusiastic | ["Will be the delivery team's day-to-day partner — very technically capable", "tends to gold-plate — watch scope creep"] |
| [Name] | [Title] | Data SME | MEDIUM | Skeptical | ["Came from legacy BI world — may resist new approach", "need to win them over early with data quality rigor"] |

**Key relationship dynamics:**
- Who has authority vs. who has influence (these are not always the same)
- Any internal conflict or tension between stakeholders
- Who is the project champion vs. who tolerated the decision
- Anyone who was not on the scoping calls but will matter in delivery

**Decision authority:**
Who makes the final call on: UAT sign-off, scope change requests, go-live approval, future phase decisions?

---

### Step 5: Extract Commitments Made Outside the SOW

```
gong_transcript_lookup → search for: "we will", "I'll make sure", "you can count on",
                          "that's included", "we'll handle", "don't worry about",
                          "we've done this before", timeline promises, staffing promises
```

These are the commitments that will come back to haunt the delivery team if they don't know about them. List every one.

| Commitment | Made By | Made To | Date | In SOW? | Action for Delivery Team |
|------------|---------|---------|------|---------|--------------------------|
| [e.g., "We'll have dashboards ready by the board meeting in June"] | SSD | CFO | [Date] | Partial — timeline in SOW but June not explicit | Confirm June is achievable at kickoff; escalate now if not |
| [e.g., "We'll make sure the data team gets trained, not just the end users"] | SSD | IT Lead | [Date] | Not explicit | Include IT in training plan; confirm at kickoff |
| [e.g., "We've connected to [system] before — it's straightforward"] | SSD | Data SME | [Date] | Assumption in SOW | Verify this assumption in week 1; flag if wrong |

**This section requires SSD review.** The SSD must add any commitments made in hallway conversations, follow-up emails, or informal channels that did not make it into the Gong transcripts.

---

### Step 6: Risk and Watch-Out Intelligence

Two layers of risk: the formal risks in the SOW, and the real risks that experienced delivery teams know to look for.

**Formal risks (from Scope Model):** List as-is from the assumptions and risk register.

**Watch-outs (human intelligence — SSD to validate and add to):**

```
gong_transcript_lookup → search for: hesitation, concern, "as long as", "assuming",
                          scope inflation language, timeline pressure, budget sensitivity,
                          prior vendor failure references, internal resistance signals
```

| Watch-Out | Context | What to Watch For | Suggested Response |
|-----------|---------|------------------|--------------------|
| [e.g., "Customer had a bad experience with a prior SI"] | Mentioned on call 2 — they did not elaborate | Early quality issues may trigger disproportionate alarm | Over-communicate quality at every checkpoint; share QA results proactively |
| [e.g., "Executive sponsor is under pressure to show results by Q2"] | Referenced twice in discovery | Scope creep risk if they feel behind | Lock scope explicitly at kickoff; weekly milestone tracking |
| [e.g., "IT team was not involved in scoping"] | IT contact not confirmed in Discovery Record | Access and security delays are likely | Escalate IT introduction to pre-kickoff; do not wait until week 1 |
| [e.g., "Customer mentioned they 'might' need Everywhere later"] | Said informally in call 3 | They may expect Everywhere to be included | Confirm it is out of scope at kickoff; position as Phase 2 |

---

### Step 7: Kickoff Priorities and Dependency Management

Based on the Scope Model, LOE inputs, and risk intelligence, define what the delivery team should do first and what they must secure before any build work starts.

**Pre-kickoff checklist (things to resolve before the project starts):**

| Item | Owner | Status | Consequence if Delayed |
|------|-------|--------|----------------------|
| All source system credentials obtained | Customer IT | [ ] | Blocks data connection workstream |
| Customer project lead confirmed and available | Customer | [ ] | No day-to-day coordination |
| Asana / project tool set up | PMO | [ ] | No milestone tracking |
| Communication channels established | Lead Consultant | [ ] | No async coordination path |
| SOW signed by all parties | AE | [ ] | Cannot begin billable work |
| [Sub-tool-specific items — Everywhere license, API docs, etc.] | | [ ] | |

**Kickoff meeting priorities:**
1. Align on scope — walk through what is in and out; confirm the customer's understanding matches the SOW
2. Confirm customer team availability and commitment level — this is where over-commitment by the customer gets surfaced early
3. Validate data access — do not leave kickoff without a plan for credentials
4. Establish communication cadence and escalation path
5. Address any open watch-outs from the risk intelligence section

**Dependency sequence — what must happen in what order:**

```
[Credentials obtained] → [Data profiling] → [Connection build]
[Requirements finalized] → [Dashboard design] → [Build]
[PDP policy confirmed] → [Governance setup] → [User access]
```

Flag any workstream where the dependency chain has a known weak link.

---

### Step 8: High-Level Project Plan Starter

Build a starting point for the project plan that the PMO can take into their tool of choice.

```
fileset_search("project plan template PS engagement phases")
→ Load standard project plan structure for reference
```

| Week | Phase | Key Activities | Owner | Milestone | Dependencies |
|------|-------|---------------|-------|-----------|-------------|
| Pre | Setup | Pre-kickoff checklist, system access, Asana setup | PMO + Customer | All credentials received | SOW signed |
| 1 | Discovery & Design | Kickoff meeting, requirements gathering, data profiling | Lead Consultant | Requirements locked | Customer team available |
| 2 | Architecture | Architecture finalized, data connection strategy, metrics map | Lead + Data Eng | Architecture approved | Data access confirmed |
| 3–4 | Connect | Source system connections, QA | Data Engineer | All sources connected | Credentials, API docs |
| 5–7 | Transform | ETL / data model build, QA | Data Engineer | Data model validated | Connected datasets |
| 8–10 | Visualize | Dashboard build, UAT | Lead Consultant | UAT complete | Validated data model |
| [+] | [Everywhere / Automation / App Studio if in scope] | | | | |
| [Last-1] | Governance & Rollout | PDP setup, training, documentation | Lead + PMO | Training delivered | Finalized dashboards |
| [Last] | Handoff & Close | Go-live, runbook, close-out | All | Go-live ✅ | UAT sign-off |

*Adjust week count based on LOE Estimate total hours and delivery model.*

---

### Step 9: Staffing Recommendation Inputs

Based on the workstream mix and delivery model, provide inputs for staffing the engagement.

| Role | Requirement | Hours/Week | Notes |
|------|-------------|------------|-------|
| Lead Consultant | Required | [X] hrs/wk | [Delivery model note — teach-to-fish needs stronger enablement skill] |
| Data Engineer | Required | [X] hrs/wk | [Any specialist note — Workbench, complex API, App Studio] |
| PMO | [Required / Recommended] | [X] hrs/wk | [Flag if tight timeline or cross-team dependencies] |
| App Studio Developer | [If App Studio in scope] | [X] hrs/wk | [DDX or App Studio skill required] |
| Engagement Manager | [If strategic / high PM overhead] | [X] hrs/wk | [Flag if LOE PM % was elevated] |

**Specific skill flags:**
- [Any specialist requirement identified during scoping — e.g., "customer uses Workbench on-prem — need a consultant with Workbench experience"]
- [Any customer-side knowledge that should inform team selection — e.g., "customer team is very technical — send a senior resource or they will lose confidence"]

---

## Output Template

```markdown
# Handoff Dossier: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **SSD:** [Name]
**SOW Signed:** [Date] | **Engagement Start:** [Date]
**Status:** DRAFT — Requires SSD Review Before Delivery Team Briefing

> ⚠️ SSD REVIEW REQUIRED: Sections marked [SSD TO ADD] require human intelligence
> that cannot be extracted from artifacts. Complete before sharing with delivery team.

---

## 1. Why This Deal Exists — The Story

[Paragraph — written in narrative form, not bullets. The delivery team needs to feel
the context, not just read the facts.]

**The trigger:** [What caused this customer to start this conversation now]

**What's riding on this internally:** [Stakes for the customer champion and exec sponsor]

**What the customer is really testing:** [The unstated success criteria]

**The sales process:** [How the deal came together; what almost didn't happen]

**What was almost not sold:** [Scope items that didn't make it in — first expansion targets]

---

## 2. What Was Sold

### Engagement Overview

| | |
|---|---|
| **Package / Structure** | |
| **Total Hours** | |
| **Investment** | |
| **Duration** | |
| **Delivery Model** | |
| **Start Date** | |

### Use Cases

| Use Case | Why It Matters | Deliverables | Success Metric | Hours |
|----------|---------------|-------------|----------------|-------|
| [UC 1] | | | | |
| [UC 2] | | | | |

### What Was Not Sold and Why

| Out-of-Scope Item | Reason | Customer's Reaction | Phase 2 Candidate? |
|------------------|--------|--------------------|--------------------|
| [Item] | Budget / Timing / Complexity / Deferred | [Accepted / Reluctant / Unaware] | Yes / No |

### The Option Not Chosen

[If customer selected from multiple options — what they didn't choose and why. Flag any
misunderstanding risk — "they may think X is included."]

---

## 3. Stakeholder Intelligence Map

| Name | Title | Role | Influence | Attitude | Intelligence Notes |
|------|-------|------|-----------|----------|-------------------|
| | | Executive Sponsor | | | |
| | | Project Lead | | | |
| | | Data SME | | | |
| | | IT Contact | | | |

**Key dynamics:** [SSD TO ADD — politics, relationships, internal tensions, who really drives decisions]

**Decision authority for delivery:** [Who signs off on UAT, scope changes, go-live]

---

## 4. Commitments Made Outside the SOW

| Commitment | Made By | Made To | In SOW? | Action for Delivery Team |
|------------|---------|---------|---------|--------------------------|
| [Commitment] | | | Yes / No / Partial | |

**[SSD TO ADD]:** Any commitments made in email, informally, or in conversations not captured in Gong:
- [SSD adds here]

---

## 5. Risks and Watch-Outs

### Formal Risks (from SOW)
[Copied from Scope Model risk register]

### Watch-Outs (Human Intelligence)

| Watch-Out | Context | What to Watch For | Response |
|-----------|---------|------------------|--------------------|
| | | | |

**[SSD TO ADD]:** Anything you know that isn't in the transcripts:
- [Personality notes, political dynamics, sensitivities, prior history with Domo]

---

## 6. Pre-Kickoff Checklist

| Item | Owner | Status |
|------|-------|--------|
| All source system credentials | Customer IT | [ ] |
| Customer project lead confirmed | Customer | [ ] |
| Domo team assigned and briefed | Delivery leadership | [ ] |
| Project management tool set up | PMO | [ ] |
| Kickoff meeting scheduled | CSM / Lead Consultant | [ ] |
| SOW fully executed | AE | [ ] |

---

## 7. Kickoff Meeting Priorities

1. [Priority 1 — usually: lock scope understanding]
2. [Priority 2 — usually: confirm customer team commitment]
3. [Priority 3 — usually: validate data access plan]
4. [Address specific watch-outs from Section 5]
5. [Establish communication cadence and escalation path]

---

## 8. High-Level Project Plan

| Week | Phase | Activities | Milestone | Dependencies |
|------|-------|-----------|-----------|-------------|
| Pre | Setup | | | |
| 1 | Discovery & Design | | Requirements locked | |
| 2 | Architecture | | Architecture approved | |
| [Continue per workstream] | | | | |
| [Last] | Handoff & Close | | Go-live ✅ | UAT sign-off |

---

## 9. Staffing Inputs

| Role | Required | Hours/Week | Specialist Notes |
|------|----------|------------|-----------------|
| Lead Consultant | Yes | | |
| Data Engineer | Yes | | |
| PMO | [Yes/Rec] | | |
| [Additional roles] | | | |

**[SSD TO ADD]:** Any specific skill or seniority requirements you know this customer needs:
- [Add here]

---

**Prepared by:** CS Solutions Knowledge Handoff Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Handoff → Delivery Preparation → Position 9
**Phase Gate:** YES — SSD must review, complete [SSD TO ADD] sections, and validate
              before sharing with delivery team
```

---

## Guardrails

- **The dossier is not the SOW.** The SOW tells the delivery team what to do. The dossier tells them how to succeed. Focus on the context the SOW cannot capture.
- **The [SSD TO ADD] sections are mandatory, not optional.** An AI-generated handoff without the SSD's human intelligence is incomplete. Flag incomplete sections clearly and do not allow the dossier to be shared until the SSD has reviewed it.
- **Commitments made outside the SOW are the highest-risk items.** Extract these aggressively from Gong. Ask the SSD explicitly: "Are there any commitments you made that aren't captured here?"
- **Stakeholder intelligence must be honest.** If a stakeholder is skeptical, say so. If there is internal conflict, say so. The delivery team is better served by accurate intelligence than by a polished description that sets them up for a surprise.
- **Watch-outs beat risks.** Formal risk registers are useful. "The data SME has been openly hostile to this project in two of the four calls and was overruled by the CFO" is more useful. Capture the human version.
- **This dossier is confidential.** It contains candid assessments of customer personnel and internal dynamics. It should not be sent to the customer. Flag this clearly.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| gong_transcript_lookup | **Yes** | Commitment extraction, stakeholder intelligence, tone and dynamics across all calls |
| portfolio_lookup | Optional | Account health, ARR, renewal, CSM context |
| calls_lookup | Optional | Supplemental notes, email follow-up context |
| fileset_search | Optional | Project plan template reference |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["account", "engagement-working"]}`, content summarizing: handoff summary, knowledge transferred, key contacts, ongoing risks, recommended next steps, institutional knowledge captured for future engagements.

---

## Related Skills

- **SOW Generator** → Upstream — signed scope as the formal foundation
- **Solution Blueprint** → Upstream — what was architected
- **Discovery Synthesizer** → Upstream — stakeholder map and discovery intelligence
- **Proposal Generator** → Upstream — what was promised to the customer
- **Expansion Identifier** → Downstream — uses dossier context to identify Phase 2 signals
