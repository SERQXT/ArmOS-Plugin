---
name: kickoff-brief
tier: 1
description: "Generate a comprehensive kickoff briefing document for a new customer engagement — account context, engagement scope, team assignments, success criteria, timeline, and communication plan. Trigger with 'kickoff brief for [account]', 'prep the kickoff for [customer]', 'kickoff deck for [account]', 'start the engagement for [account]', or any request to prepare kickoff materials for a new PS engagement."
maturity: alpha
audience: [delivery, intelligence]
pipeline:
  phase: align
  sub_phase: planning-and-kickoff
  position: 4
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: offering-matchmaker
      required: false
      data: package selection, engagement structure
    - agent: solution-architect
      required: false
      data: technical approach, use case architectures
    - agent: customer-roi-hypothesis
      required: false
      data: pain points, expected outcomes
  outputs:
    - name: kickoff-brief
      format: markdown
      downstream:
        - agent: alignment-gate
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: hggrades_lookup
      required: true
    - tool: calls_lookup
      required: true
    - tool: actions_lookup
      required: false
    - tool: WebSearch
      required: false
  phase_gate: false
---

# Kickoff Brief Agent — Engagement Launch Preparation

Generates the kickoff briefing document that sets the stage for a new PS engagement. Pulls all available context from the Discover pipeline (ROI Hypothesis, Solution Architecture, Offering Match) and combines it with live account data to produce a comprehensive brief for both the internal team and the customer kickoff meeting.

## How It Works

```
Discover Pipeline Outputs (upstream)
  + Live Account Data (MCP tools)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
 Engagement Account  Team    Success  Timeline
 Scope     Context  Roster  Criteria & Milestones
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Assemble Kickoff Brief
                    |
         🔵 OUTPUT: Kickoff Brief
                    |
         → Alignment Gate (downstream)
```

## Triggers

- "kickoff brief for [account]"
- "prep the kickoff for [customer]"
- "kickoff deck for [account]"
- "start the engagement for [account]"
- "engagement kickoff for [account]"
- "launch the project for [account]"
- "onboard [account] engagement"

## Execution Flow

### Step 1: Gather All Context

```
1. Upstream Pipeline Outputs (if available):
   → ROI Hypothesis: pain points, use cases, expected ROI
   → Solution Architecture: technical approach, data sources, complexity
   → Offering Match: package tier, accelerators, hours, pricing

2. portfolio_lookup(account_name, fields="all")
   → Account profile, ARR, segment, CSM, AE, products, renewal

3. hggrades_lookup(account_id)
   → Current health baseline — this is the "before" measurement

4. calls_lookup(account_name, limit=5)
   → Recent conversations — context for relationship temperature
   → Any commitments made during the sales process

5. actions_lookup(account_name)
   → Active signals — risks to address early in engagement

6. WebSearch("[Company Name] news [month/year]")
   → External context the delivery team should know about
```

### Step 2: Define Engagement Parameters

| Parameter | Source | How to Determine |
|-----------|--------|-----------------|
| **Scope** | Offering Match / SOW | What's included and explicitly excluded |
| **Duration** | Solution Architecture | Estimated weeks based on complexity |
| **Hours** | Offering Match | Total hours purchased |
| **Team** | Staffing Agent (if run) or user input | Who's assigned from Domo PS |
| **Customer Contacts** | Portfolio + Calls | Primary contact, executive sponsor, technical lead |
| **Success Criteria** | ROI Hypothesis | Measurable outcomes tied to business value |
| **Communication Cadence** | Standard or custom | Weekly calls, status emails, steering committee |

### Step 3: Build Success Criteria

Transform ROI Hypothesis outcomes into measurable success criteria:

```
For each use case in the ROI Hypothesis:
  Business Outcome → Measurable Metric → Target → Measurement Method

Example:
  Outcome: "Automated executive reporting"
  Metric:  "Hours saved per week in manual reporting"
  Target:  "Reduce from 20 hrs/week to 2 hrs/week"
  Method:  "Pre/post survey + Domo usage analytics"
```

### Step 4: Produce Kickoff Brief

---

## Output Template

```markdown
# Engagement Kickoff Brief: [Account Name]

**Generated:** [Date]
**Engagement Start:** [Date]
**Package:** [Tier] — [Hours] hours
**Duration:** [X] weeks

---

## 1. Account Context

| | |
|---|---|
| **Account** | [Name] |
| **Segment** | [Segment] |
| **ARR** | $[amount] |
| **Health Grade** | [Grade] (GPA: [X.XX]) — Baseline |
| **Renewal** | [Date] — [X] days away |
| **CSM** | [Name] |
| **AE** | [Name] |
| **Industry** | [Industry] |

**Why This Engagement:**
[2-3 sentences from ROI Hypothesis — the business case for PS engagement]

**Account Health Baseline:**
| Health Course | Grade | Notes |
|---------------|-------|-------|
| [Worst course] | [Grade] | [What this means for the engagement] |
| [2nd worst] | [Grade] | [What this means] |
| [Best course] | [Grade] | [Strength to build on] |
| **Overall** | **[Grade]** | **GPA: [X.XX]** |

---

## 2. Engagement Scope

### What's In Scope

| Use Case | Deliverables | Estimated Hours |
|----------|-------------|-----------------|
| [UC1] | [Dashboard suite, data pipeline, etc.] | [X] hrs |
| [UC2] | [Deliverables] | [X] hrs |
| [UC3] | [Deliverables] | [X] hrs |

### What's Explicitly Out of Scope
- [Item 1 — e.g., "Migration of existing Tableau dashboards"]
- [Item 2 — e.g., "Custom connector development"]
- [Item 3 — e.g., "Data warehouse optimization"]

### Package Details
| | |
|---|---|
| **Package Tier** | [Silver / Gold / Platinum / Custom] |
| **Total Hours** | [X] hours |
| **Accelerators** | [List] |
| **Value-Add Modules** | [List] |

---

## 3. Team & Roles

### Domo Team

| Name | Role | Responsibility | Allocation |
|------|------|---------------|------------|
| [Name] | Lead Consultant | Delivery lead, primary customer contact | [X] hrs/week |
| [Name] | Data Engineer | Pipelines, connectors, data modeling | [X] hrs/week |
| [Name] | PMO | Status reporting, milestone tracking | [X] hrs/week |
| [Name] | CSM | Relationship management, escalation path | As needed |

### Customer Team

| Name | Role | Responsibility | Commitment Needed |
|------|------|---------------|------------------|
| [PRIMARY_NAME] | Executive Sponsor | Decision authority, escalation | Monthly check-ins |
| [Name] | Project Lead | Day-to-day coordination, requirements | [X] hrs/week |
| [Name] | Data SME | Source system expertise, data validation | [X] hrs/week |
| [Name] | IT Contact | Access, security, infrastructure | As needed |

---

## 4. Success Criteria

| # | Outcome | Metric | Baseline | Target | Measurement |
|---|---------|--------|----------|--------|-------------|
| 1 | [From ROI Hypothesis] | [Measurable] | [Current] | [Target] | [How we measure] |
| 2 | [Outcome] | [Metric] | [Current] | [Target] | [How] |
| 3 | [Outcome] | [Metric] | [Current] | [Target] | [How] |

**Health Score Targets:**
| Health Course | Current | 90-Day Target | What Drives This |
|---------------|---------|---------------|-----------------|
| Content Creation | [Grade] | [Target] | [Dashboards and dataflows we'll build] |
| User Engagement | [Grade] | [Target] | [Training and adoption activities] |
| Overall | [Grade] | [Target] | [Composite improvement] |

---

## 5. Timeline & Milestones

| Week | Phase | Key Activities | Milestone | Deliverable |
|------|-------|---------------|-----------|-------------|
| 1 | Discovery | Requirements gathering, data access | ✅ Requirements locked | Requirements doc |
| 2 | Discovery | Data profiling, source validation | ✅ Data access confirmed | Data inventory |
| 3-4 | Foundation | Connectors, pipelines, data model | ✅ Pipeline operational | Working data pipeline |
| 5-7 | Build | Dashboards, automation, governance | ✅ Draft dashboards | Dashboard suite (draft) |
| 8-9 | Refine | UAT, feedback, performance tuning | ✅ UAT complete | Final dashboards |
| 10 | Enable | Training, documentation, handoff | ✅ Go-live | Trained users, runbook |

---

## 6. Communication Plan

| Cadence | Format | Attendees | Purpose |
|---------|--------|-----------|---------|
| **Weekly** | 30-min call | Delivery team + customer project lead | Progress update, blocker review |
| **Weekly** | Status email (PMO 04) | Customer stakeholders | Written status with hours tracking |
| **Bi-weekly** | Steering committee (PMO 07) | Executive sponsors | Strategic alignment, decisions |
| **Ad hoc** | Slack / Teams | Working team | Day-to-day coordination |

---

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| [Data access delays] | [H/M/L] | [H/M/L] | [Pre-provision access before kickoff] | [Customer IT] |
| [Scope creep] | [H/M/L] | [H/M/L] | [Change request process, hours buffer] | [Lead Consultant] |
| [Low customer engagement] | [H/M/L] | [H/M/L] | [Weekly commitment tracking] | [CSM] |
| [From active action signals] | [H/M/L] | [H/M/L] | [Specific mitigation] | [Owner] |

---

## 8. Pre-Kickoff Checklist

| # | Item | Status | Owner |
|---|------|--------|-------|
| 1 | Domo instance access for delivery team | [ ] | [Customer IT] |
| 2 | Source system credentials / access | [ ] | [Customer Data SME] |
| 3 | Asana project created | [ ] | [PMO] |
| 4 | Communication channels set up | [ ] | [Lead Consultant] |
| 5 | Kickoff meeting scheduled | [ ] | [CSM] |
| 6 | SOW signed and hours approved | [ ] | [AE] |
| 7 | Customer stakeholders identified and confirmed | [ ] | [CSM] |
| 8 | Success criteria reviewed with customer | [ ] | [Lead Consultant] |

---

## 9. External Context

**Recent Company News:**
- [Headline — from WebSearch — relevance to engagement]
- [Headline]

**Things the Delivery Team Should Know:**
- [Context from calls — e.g., "Customer is frustrated with Tableau migration timeline"]
- [Signal from actions — e.g., "Executive engagement has been declining"]
- [External context — e.g., "Company going through reorg, expect contact changes"]

---

## → Next in Pipeline: Alignment Gate

Before moving to Design, the Alignment Gate verifies:
- [ ] Scope locked and agreed
- [ ] Team assigned and available
- [ ] Customer aligned on success criteria
- [ ] Kickoff meeting scheduled
- [ ] Pre-kickoff checklist items complete

Say: "run alignment gate for [Account Name]" → verifies readiness

---

**Prepared by:** Compass Kickoff Brief Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Align → Planning & Kickoff → Position 4
```

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account** and **engagement-artifacts** (SOW, DiscoveryReadout, SolutionArchitecture), intent: kickoff brief.

### After executing
- Call `memory_store_artifact` for **KickoffBrief**; `memory_remember` with agreed scope, success criteria, and checklist status.

---

## Guardrails

- **Scope must be explicit.** In-scope AND out-of-scope must be defined. Ambiguity here causes scope creep later.
- **Success criteria must be measurable.** "Improve adoption" is not a success criterion. "Increase MAU from 12 to 50 within 90 days" is.
- **Health baseline is critical.** Record the starting health grade. This is how we measure impact.
- **Customer team commitment is real.** If the customer hasn't identified a project lead and data SME, flag it as a risk.
- **Don't skip the checklist.** Every item on the pre-kickoff checklist must be addressed before the engagement starts.
- **Carry forward commitments.** If call data shows promises made during the sales cycle, include them in the brief.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_lookup | **Yes** | Account context, team, products |
| hggrades_lookup | **Yes** | Health baseline for success measurement |
| calls_lookup | **Yes** | Relationship context, commitments, sentiment |
| actions_lookup | Recommended | Active signals → engagement risks |
| WebSearch | Optional | External context for delivery team |
| Asana | Optional | Project setup verification |

---

## Related Skills

- **Offering Matchmaker** (Discover) → Upstream — engagement structure
- **Solution Architect** (Discover) → Upstream — technical approach
- **Alignment Gate** (Align) → Downstream — validates readiness
- **Call Prep** (Align) → For preparing the actual kickoff call
- **Weekly Status** (Build) → Takes over recurring communications
