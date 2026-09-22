---
name: proposal-generator
tier: 1
description: "Create the customer-facing proposal narrative and business case — translate the solution, scope, and commercial recommendation into a compelling, stakeholder-ready story with quantified ROI and a clear recommendation. Trigger with 'build the proposal for [account]', 'generate proposal content for [account]', 'draft the business case for [account]', or 'proposal deck for [account]'. Requires locked Solution Blueprint, Scope Model, and Commercial Recommendation."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: commercial
  sub_phase: proposal-build
  position: 7
  output_type: output
  wave: 2
  state: ready
  inputs:
    - agent: solution-blueprint
      required: true
      data: locked Solution Blueprint — solution statement, use cases, platform components
    - agent: scope-builder
      required: true
      data: locked Scope Model — workstream deliverables, in/out of scope
    - agent: service-matchmaker
      required: true
      data: Commercial Recommendation — option set, recommended option, pricing framework
    - agent: discovery-synthesizer
      required: true
      data: Discovery Record — pain points, value drivers, stakeholders, success criteria, delivery preference
    - agent: roi-calculator
      required: true
      data: ROI Analysis — quantified value drivers, business impact calculations, assumptions
  outputs:
    - name: proposal-content
      format: markdown
      downstream:
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

# Proposal Generator — Customer-Facing Narrative and Business Case

Translates the locked technical and commercial artifacts into a customer-facing proposal narrative — a coherent story that connects the customer's pain to the proposed solution, quantifies the expected value, and presents the commercial options clearly. Output is structured as proposal deck content: slide-by-slide, section-by-section, in the language of the buyer.

The proposal must be persuasive and defensible. Persuasive means it connects emotionally to what the customer told us matters. Defensible means every value claim traces back to something the customer said in discovery. No invented ROI.

## How It Works

```
Solution Blueprint + Scope Model + Commercial Recommendation + Discovery Record
                               |
  +-------+-------+-------+-------+-------+-------+
  |       |       |       |       |       |       |
Current  Why   Proposed  Options  ROI /  Talk   Next
State   Domo  Solution   Table   Value  Track  Steps
  |       |       |       |       |       |       |
  +-------+-------+-------+-------+-------+-------+
                               |
            SSD Edits Storyline and Value Case
                               |
             🔵 OUTPUT: Proposal Content
                               |
                    → SOW Generator
```

## Triggers

- "build the proposal for [account]"
- "generate proposal content for [account]"
- "draft the business case for [account]"
- "proposal deck for [account]"
- "write the proposal narrative for [account]"
- "build the ROI model for [account]"

**Prerequisites:**
- Solution Blueprint: LOCKED
- Scope Model: LOCKED
- Commercial Recommendation: SSD-selected option locked
- Discovery Record: VALIDATED

---

## Execution Flow

### Step 1: Load Inputs and Identify the Audience

```
discovery-synthesizer  → stakeholder map, pain points, value drivers, success criteria
solution-blueprint     → solution statement, use cases, platform components
scope-builder          → workstream deliverables, in/out of scope
service-matchmaker     → recommended option, pricing framework, option set
portfolio_lookup       → account context, ARR, renewal
gong_transcript_lookup → specific language the customer used to describe their pain
                         (mirror their words back — it lands harder than consultant language)

fileset_search("proposal template narrative structure")
fileset_search("ROI business value model methodology")
→ Load proposal framework and value calculation approach
```

**Identify the primary audience:**

| Audience Type | What They Care About | Tone |
|--------------|---------------------|------|
| **Executive sponsor** | Business outcome, ROI, risk, strategic fit | High-level, outcome-focused, time-efficient |
| **Economic buyer** | Price, value for money, payback period | Specific, quantified, defensible |
| **Technical evaluator** | Platform capabilities, integration approach, feasibility | Credible, detailed, honest about complexity |
| **Project champion** | Ease of delivery, team burden, their personal win | Practical, collaborative, confidence-building |

If multiple stakeholders will receive this proposal, the narrative must speak to all of them — leading with the executive/business lens and supporting with technical/operational detail.

---

### Step 2: Build the Narrative Spine

Before writing any section, define the story structure:

```
Problem Statement  →  Why It Matters Now  →  Why Domo  →  What We Will Build
→  What You Get  →  What It Will Cost  →  What We Need From You  →  Next Step
```

Map each element to source material:

| Story Beat | Source | Key Message |
|-----------|--------|-------------|
| **Current state / pain** | Discovery Record pain points | [1–2 sentences in customer's own language] |
| **Why it matters now** | Discovery Record — why now, timeline pressure | [Stakes if they don't solve this] |
| **Why Domo** | Solution Blueprint — platform fit | [Specific capability match to their need] |
| **What we'll build** | Solution Blueprint use cases | [Concrete deliverables, not abstract capabilities] |
| **What they'll get** | Discovery Record success criteria | [Measurable outcomes tied to their goals] |
| **What it costs** | Commercial Recommendation — recommended option | [Clear, not buried] |
| **What we need** | Scope Model — customer responsibilities | [Honest about commitment required] |
| **Next step** | SSD input | [Single, specific ask] |

---

### Step 3: Build the ROI / Business Value Model

```
fileset_search("ROI business value calculation framework")
→ Load value calculation methodology and assumption library
```

**ROI must trace to discovery.** For every value claim:
1. Start with what the customer said in discovery (quote or paraphrase from Gong transcript)
2. Identify the value driver category (cost savings, productivity, revenue, risk reduction)
3. Quantify using customer-provided or industry-benchmarked inputs — state which
4. Show the math transparently
5. State assumptions explicitly

**Value driver framework:**

#### Cost Savings
```
Current state: [Customer currently spends X hours/week on Y process]
Source: [Gong call date / stated by Name]
Domo impact: [Automation reduces this to Z hours/week]
Annual savings: [(X - Z) hours × [rate] × 52 weeks = $Y/year]
Assumption: [Rate assumed at $X/hr — adjust with customer data]
```

#### Productivity Gains
```
Current state: [Decision-makers wait X days for reports]
Source: [Gong call / stated by Name]
Domo impact: [Real-time dashboards eliminate report lag]
Value: [X decisions/month × $Y impact per better decision = $Z/year]
Assumption: [Conservative estimate — customer to validate]
```

#### Revenue Enablement
```
Current state: [Sales team lacks visibility into X, resulting in Y]
Source: [Gong call / stated by Name]
Domo impact: [Dashboard enables Z behavior]
Value: [Estimate with customer input — do not invent revenue claims]
Assumption: [State clearly if estimated; flag if speculative]
```

#### Risk Reduction
```
Current state: [Manual process creates risk of X — compliance, data error, delay]
Source: [Gong call / stated by Name]
Domo impact: [Automated validation / governance eliminates this risk]
Value: [Cost of risk event × probability reduction = expected value]
Assumption: [State basis for probability estimate]
```

**ROI summary:**

| Value Driver | Annual Value | Confidence | Source |
|-------------|-------------|------------|--------|
| [Driver 1] | $[X] | HIGH — customer-stated | [Gong call date] |
| [Driver 2] | $[X] | MEDIUM — industry benchmark | [Source] |
| [Driver 3] | $[X] | LOW — directional estimate | [Basis] |
| **Total Annual Value** | **$[X]** | | |
| **Project Investment** | $[fees from Commercial Rec] | | |
| **Simple Payback** | [X months] | | |
| **Year 1 ROI** | [X%] | | |

**If value cannot be quantified:** Do not invent a number. State it qualitatively: "Customers in similar situations describe this as reducing report preparation from days to minutes — we recommend validating the specific time savings with your team."

---

### Step 4: Build Proposal Deck Content — Slide by Slide

Structure the proposal as deck-ready content. Each section is a slide or a set of slides.

---

#### Slide 1 — Title
- Engagement name / title
- Customer name and logo placeholder
- Date and SSD name
- Tagline: [One sentence that captures the engagement's business purpose]

---

#### Slide 2 — Executive Summary (1 slide)
- 3–4 bullets that give a busy executive everything they need in 30 seconds
- What the problem is
- What we propose to do
- What it will deliver
- What we need from them

---

#### Slide 3 — Current State & Problem (1–2 slides)
Source: Discovery Record pain points and Gong transcript language

**Current challenges:**
- [Pain 1] — [business impact in customer's language]
- [Pain 2] — [business impact]
- [Pain 3] — [business impact]

**The cost of staying the course:**
[1–2 sentences on what happens if they do nothing — from timeline pressure and why-now signals]

---

#### Slide 4 — Project Objectives (1 slide)
Source: Discovery Record success criteria, Solution Blueprint use cases

**This engagement will:**
1. [Objective 1 — tied to use case and success metric]
2. [Objective 2]
3. [Objective 3]

**How we will measure success:**
| Objective | Current State | Target | Measurement |
|-----------|--------------|--------|-------------|
| [Obj 1] | [Baseline] | [Target] | [How measured] |

---

#### Slide 5 — Proposed Solution (1–2 slides)
Source: Solution Blueprint solution statement and platform components

**[Solution name / headline]**
[Solution statement from blueprint — plain language]

**What we will build:**
| Use Case | What It Does | Who Benefits |
|----------|-------------|-------------|
| [Use Case 1] | [Business description] | [Audience] |
| [Use Case 2] | | |

**Platform components:**
[List with one-line descriptions in business language — no Domo jargon without explanation]

---

#### Slide 6 — Reference Architecture (1 slide)
Source: Solution Blueprint reference architecture

[ASCII or described architecture — data sources → Domo layers → delivery → users]

Keep it business-readable. Label with customer's actual system names, not generic placeholders.

---

#### Slide 7 — Business Value & ROI (1–2 slides)
Source: ROI model from Step 3

**Expected value from this engagement:**
[ROI summary table]

**Key assumptions:**
[State assumptions plainly — do not bury them in footnotes]

**What customers in similar situations have experienced:**
[Industry reference if applicable — from fileset — do not invent customer stories]

---

#### Slide 8 — Our Recommendation (1 slide)
Source: Commercial Recommendation — recommended option

**Recommended: [Option name]**

| | |
|---|---|
| **Engagement structure** | [Package / T&M / Phased / Retainer] |
| **Investment** | $[fees] |
| **Duration** | [X] weeks |
| **Hours** | [X] hrs |

**Why this is the right approach:**
[3 bullets — connects back to their pain, delivery preference, and timeline]

---

#### Slide 9 — Options Comparison (1 slide)
Source: Commercial Recommendation option set

| | Option A (Recommended) | Option B | Option C |
|---|---|---|---|
| **Scope** | [Summary] | [Summary] | [Summary] |
| **Investment** | $[X] | $[X] | $[X] |
| **Duration** | [X] wks | [X] wks | [X] wks |
| **Best for** | [When] | [When] | [When] |

---

#### Slide 10 — What We Need From You (1 slide)
Source: Scope Model customer responsibilities + Discovery Record delivery preference

**For this engagement to succeed, we need:**
- [Commitment 1 — specific, with timeframe]
- [Commitment 2]
- [Team involvement level — based on delivery model]

**What you can expect from us:**
- [Commitment from Domo — delivery model specific]

---

#### Slide 11 — Timeline (1 slide)
Source: LOE Estimate workstream breakdown, SOW Generator timeline

[Phase timeline — weeks and key milestones, from LOE and Scope Model]

---

#### Slide 12 — Why Domo, Why Now, Why Us (1 slide)
Source: fileset_search("Domo PS differentiation customer-facing")

**Why Domo:** [Platform fit specific to their use case — not generic]
**Why now:** [Why this timing matters — from discovery]
**Why Domo PS:** [What PS brings that matters for their specific engagement]

---

#### Slide 13 — Next Steps (1 slide)
Source: SSD input

| Step | Owner | Target Date |
|------|-------|------------|
| [e.g., Review and align on scope] | SSD + Customer | [Date] |
| [e.g., Confirm commercial option] | Customer | [Date] |
| [e.g., SOW review and sign] | SSD + AE + Customer | [Date] |
| [e.g., Kick off] | All | [Date] |

**The ask:** [Single, specific — "We'd like your feedback on the proposed scope by [date] so we can finalize the SOW."]

---

### Step 5: Draft the Talk Track

Provide the SSD with a verbal guide for presenting the proposal — what to say, what to emphasize, what objections to anticipate.

```
Opening (30 seconds):
[How to frame the presentation — connect to their world before diving into slides]

Key emphasis points:
  - [Slide X]: [What to say beyond what's on the slide]
  - [Slide Y]: [Where to pause for reaction]

Anticipated objections:
  | Objection | Response |
  |-----------|---------|
  | "The price is too high" | [Lead with phasing / value alignment — not discounting] |
  | "We need to think about it" | [What's the real concern? Probe: scope, timeline, budget, internal alignment] |
  | "Can you do it faster?" | [Options — reduce scope, increase resourcing, or be honest about quality risk] |
  | "We want to do more of this ourselves" | [Teach-to-fish option — reference Option B if applicable] |

Close:
[How to end the call with a specific next step — not "let us know what you think"]
```

---

## Output Template

The full proposal is assembled from the slide content above, plus:

```markdown
# Proposal: [Account Name]
**Version:** 1.0
**Prepared:** [Date] | **SSD:** [Name]
**Status:** DRAFT — Pending SSD Review and Customization

[Cover slide content]
[Executive summary]
[Current state & problem]
[Objectives]
[Proposed solution]
[Reference architecture]
[Business value & ROI]
[Recommendation]
[Options comparison]
[What we need from you]
[Timeline]
[Why Domo / Why now / Why PS]
[Next steps]

---
## Talk Track
[Per Step 5 above]

---
## ROI Model Detail
[Full ROI calculations with sources and assumptions per Step 3]

---
**Prepared by:** CS Solutions Proposal Generator Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Commercial → Proposal Build → Position 7
**Phase Gate:** YES — SSD must review, edit, and approve before presenting to customer
```

---

## Guardrails

- **Every value claim must trace to discovery.** If the customer said it, use it. If it comes from an industry benchmark, cite the source. If it is a directional estimate, say so. Never invent ROI numbers.
- **Use the customer's language.** Read the Gong transcripts. If the customer said "we're flying blind on inventory," use that phrase. It lands harder than "insufficient visibility into inventory levels."
- **The proposal is the SSD's document.** The agent drafts — the SSD owns it. Tone, emphasis, and key messages must be reviewed and personalized before the proposal is presented.
- **Separate the recommendation from the options.** The recommendation slide makes a clear choice. The options slide shows alternatives. Do not hedge the recommendation.
- **Proposals that try to say everything say nothing.** Prioritize the most important 3 value points. Cut anything that doesn't directly address what this specific customer said matters.
- **Never present a proposal built on a draft Commercial Recommendation.** If pricing is not locked, the proposal will contradict the SOW. Lock the commercial option first.
- **The talk track is as important as the slides.** An SSD who knows what to say, what to emphasize, and how to handle objections will close faster than one with a beautiful deck and no confidence.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| fileset_search | **Yes** | Proposal template structure, ROI methodology, Domo PS differentiation language, industry benchmarks |
| portfolio_lookup | Optional | Account context — ARR, renewal timing, account history that colors the pitch |
| gong_transcript_lookup | Optional | Exact customer language to mirror back in the narrative |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: proposal structure and themes, value propositions emphasized, pricing tier selected, differentiators highlighted.
- Call `memory_store_artifact` to persist the proposal in `engagement-artifacts`.

---

## Related Skills

- **Solution Blueprint** → Upstream — solution narrative and use cases
- **Scope Builder** → Upstream — deliverables and customer commitments
- **Service Matchmaker** → Upstream — option set and commercial recommendation
- **Discovery Synthesizer** → Upstream — pain points, value drivers, stakeholder map
- **SOW Generator** → Downstream — proposal alignment triggers SOW finalization
