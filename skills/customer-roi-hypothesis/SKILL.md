---
name: customer-roi-hypothesis
tier: 1
description: "Generate a structured hypothesis of what business outcomes Professional Services can deliver for a specific account. Takes opportunity signals and account context, maps to use cases, and produces a scoped ROI narrative. Trigger with 'ROI hypothesis for [account]', 'scope engagement for [customer]', 'what can PS do for [account]', 'business case for [account]', or any request to articulate the value PS would deliver."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: scoping-assets
  position: 2
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: scouting-agent
      required: false
      data: opportunity context, health gaps, signal patterns
  outputs:
    - name: roi-hypothesis
      format: markdown
      downstream:
        - agent: solution-architect
        - agent: offering-matchmaker
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: hggrades_lookup
      required: true
    - tool: actions_lookup
      required: true
    - tool: calls_lookup
      required: true
    - tool: hgstacked_lookup
      required: false
    - tool: hgplatformutilization_lookup
      required: false
    - tool: WebSearch
      required: false
  phase_gate: false
---

# Customer ROI Hypothesis — Engagement Scoping

Takes an account (either from the Scouting Agent's opportunity list or a direct user request) and generates a structured hypothesis of what business outcomes PS can deliver. This is the "why should we engage" document that feeds into Solution Architecture and Offering Matchmaker.

## How It Works

```
User says: "ROI hypothesis for Consumer Reports"
(or Scouting Agent passes opportunity context)
                    |
    +-------+-------+-------+-------+-------+
    |       |       |       |       |       |
 Portfolio  HG     Actions  Calls   Web     Scouting
 (context) Grades  (signals) (voice  Research Output
           (gaps)           of cust)        (if avail)
    |       |       |       |       |       |
    +-------+-------+-------+-------+-------+
                    |
         Identify Business Pain Points
                    |
         Map Pain → Use Cases → Outcomes
                    |
         Quantify Expected ROI
                    |
         🔵 OUTPUT: ROI Hypothesis
                    |
    → Solution Architect + Offering Matchmaker (downstream)
```

## Triggers

- "ROI hypothesis for [account]"
- "scope engagement for [customer]"
- "what can PS do for [account]"
- "business case for [account]"
- "why should we engage [account]"
- "value proposition for [account]"
- "build the case for [account]"

## Execution Flow

### Step 1: Gather Account Intelligence (parallel)

```
1. portfolio_lookup(account_name, fields="all")
   → Full account profile: ARR, segment, products, CSM, AE, renewal,
     services history, adoption metrics

2. hggrades_lookup(account_id)
   → Component health scores across all 8 Health Courses
   → 30/90/180-day trends — where is health moving?
   → Critical: identify D/F grades = direct pain points

3. actions_lookup(account_name)
   → Active signals: what the data says is happening
   → Recommended plays: what the data says to do
   → Signal classification: de-risk vs. grow

4. calls_lookup(account_name, limit=5)
   → Recent conversations: what has the customer SAID?
   → Sentiment trends: are they getting more/less frustrated?
   → Commitments: what have we promised?
   → Topics: what are THEY focused on?

5. hgstacked_lookup(account_id, limit=50) [when available]
   → Health metric time-series: trend lines that make pain points visceral
   → "Content Creation has been declining for 6 months" is more compelling
     than "Content Creation grade = F"

6. hgplatformutilization_lookup(account_name) [when available]
   → Features enabled but unused = concrete pain points
   → "You're paying for Domo Everywhere but never activated it"
     maps directly to a PS engagement opportunity

7. WebSearch("[Company Name] strategy [year]")
   → External context: what's the company trying to achieve?
   → Strategic priorities that PS could align to

8. Scouting Agent output (if available)
   → Opportunity type, score, lenses hit
```

### Step 2: Identify Business Pain Points

Synthesize all data into a pain-point map. Each pain point connects internal Domo data to a business problem:

```
Pain Point Framework:
┌─────────────────────────────────────────────────────────────┐
│ Health Gap → Business Impact → Domo Use Case → Expected ROI │
└─────────────────────────────────────────────────────────────┘

Example:
  Health Gap:     Content Creation = F (0 dataflows, 3 cards)
  Business Impact: "No automated data pipelines — team manually pulls
                    reports every Monday, consuming ~20 hours/week"
  Use Case:       Automated Executive Dashboard Suite
  Expected ROI:   Save 80+ hours/month in manual reporting,
                  deliver real-time visibility to leadership
```

**Pain Point Sources (in priority order):**

1. **Voice of Customer (Calls):** What has the customer explicitly complained about or asked for? This is the strongest signal because it represents stated demand.

2. **Health Grade Gaps (HG Grades):** D/F grades in specific Health Courses reveal capability gaps. Map each gap to a business impact:
   - Content Creation D/F → "Not building — platform is underutilized"
   - User Engagement D/F → "People aren't using what's been built"
   - Value Realization D/F → "No documented use cases — can't prove ROI"
   - Platform Utilization D/F → "Paying for features they're not using"
   - Education D/F → "Users don't know how to use Domo effectively"
   - Commercial D/F → "Not consuming credits — may not renew"
   - Relationship D/F → "Disengaged — we're losing mindshare"
   - Support D/F → "Active issues blocking adoption"

3. **Action Signals:** Recommended actions from the Actions dataset translate directly into PS engagement rationale.

4. **External Context:** Company strategy and industry trends that PS can align to — "The company announced a digital transformation initiative; PS can accelerate this by..."

### Step 3: Map Pain Points to Use Cases

For each identified pain point, map to a specific PS use case:

| Pain Category | Example Use Cases |
|--------------|-------------------|
| **No Dashboards / Cards** | Executive Dashboard Suite, Department-Specific Dashboards, KPI Scorecards |
| **No Data Pipelines** | Data Architecture Assessment, Connector Setup & ETL Build, Automated Data Products |
| **Low User Adoption** | User Adoption Sprint, Champion Training Program, Role-Based Enablement |
| **No Documented Value** | Business Value Design Workshop, Use Case Documentation Sprint, ROI Measurement Framework |
| **Feature Underutilization** | Platform Optimization Assessment, Advanced Feature Enablement, Workflow Automation |
| **Data Quality Issues** | Data Governance Framework, Data Quality Monitoring, Master Data Management |
| **Executive Disengagement** | Executive Alignment Workshop, C-Suite Dashboard, Strategic Business Review |
| **Scaling Challenges** | Architecture Review, Performance Optimization, Multi-Instance Strategy |

*Note: When the Use Case Catalog is provided, this mapping will reference specific catalog entries with pricing and delivery frameworks.*

### Step 4: Quantify Expected ROI

For each use case, build an ROI estimate using available data:

```
ROI Components:
1. Time Savings: Hours saved per week × hourly rate × 52 weeks
2. Revenue Impact: Faster decisions × revenue per decision
3. Risk Reduction: Churn risk reduced × ARR at risk
4. Efficiency Gains: Automated processes × manual process cost
5. Platform Value: Features utilized / features available × subscription cost
```

**Conservative Approach:** Use ranges, not point estimates. State assumptions explicitly.

### Step 5: Produce ROI Hypothesis

---

## Output Template

```markdown
# Customer ROI Hypothesis: [Account Name]

**Generated:** [Date]
**Opportunity Type:** [🔴 Rescue / 🟠 Protect / 🟡 Accelerate / 🟢 Expand / 🔵 Activate]
**Confidence Level:** [High / Medium / Low — based on data availability]

---

## Account Context

| | |
|---|---|
| **Account** | [Name] |
| **Segment** | [Segment] |
| **ARR** | $[amount] |
| **Health** | [Grade] (GPA: [X.XX]) — [Trajectory: Improving/Declining/Stable] |
| **Renewal** | [Date] — [X] days away |
| **Active Services** | [Yes/No] — [Details if yes] |
| **CSM** | [Name] |
| **AE** | [Name] |

---

## Executive Summary

[2-3 sentences: Why this account needs PS engagement NOW, what we can deliver, and the expected business impact. This is the "elevator pitch" that a sales leader reads in 15 seconds.]

---

## Business Pain Points

### Pain Point 1: [Name — e.g., "No Automated Data Pipelines"]

| | |
|---|---|
| **Source** | [Call transcript / Health gap / Action signal / External news] |
| **Evidence** | [Specific data: "Content Creation grade = F; 0 dataflows, 3 cards total"] |
| **Business Impact** | [What this costs the customer: "Team spends 20+ hours/week on manual reporting"] |
| **Customer Voice** | [Direct quote from call if available: "We're drowning in manual Excel reports"] |

**Mapped Use Case:** [Use Case Name]
**Expected Outcome:** [What success looks like: "Automated daily refresh of 5 executive dashboards"]
**Estimated ROI:** [$X saved/generated — with assumptions stated]

---

### Pain Point 2: [Name]

[Same structure as above]

---

### Pain Point 3: [Name]

[Same structure as above]

---

## ROI Summary

| Use Case | Investment (Hours) | Annual Value | ROI Multiple | Confidence |
|----------|-------------------|--------------|--------------|------------|
| [Use Case 1] | [X] hrs | $[amount] | [X]x | [H/M/L] |
| [Use Case 2] | [X] hrs | $[amount] | [X]x | [H/M/L] |
| [Use Case 3] | [X] hrs | $[amount] | [X]x | [H/M/L] |
| **Total** | **[X] hrs** | **$[amount]** | **[X]x** | |

**Key Assumptions:**
- [Assumption 1 — e.g., "Average analyst hourly cost = $75"]
- [Assumption 2 — e.g., "Manual reporting consumes 20 hours/week based on industry average"]
- [Assumption 3]

---

## Health Score Impact Forecast

If PS engagement is successful, projected health improvements:

| Health Course | Current Grade | 90-Day Target | What Changes |
|---------------|---------------|---------------|-------------|
| [Worst course] | [Grade] | [Target] | [What PS delivers to improve this] |
| [2nd worst] | [Grade] | [Target] | [What PS delivers] |
| [3rd worst] | [Grade] | [Target] | [What PS delivers] |
| **Overall** | **[Current]** | **[Target]** | **GPA: [Current] → [Target]** |

---

## Renewal Impact

| Scenario | Forecast % | ARR Impact | Notes |
|----------|-----------|------------|-------|
| **Without PS** | [Current forecast %] | $[amount at risk] | [Risk narrative] |
| **With PS** | [Improved forecast %] | $[protected/grown ARR] | [Value narrative] |
| **Delta** | [+X%] | **$[incremental value]** | |

---

## Voice of Customer Evidence

| Date | Source | Quote / Topic | Relevance |
|------|--------|---------------|-----------|
| [Date] | [Call title] | "[Direct quote or paraphrase]" | [How this supports the hypothesis] |
| [Date] | [Call title] | "[Quote]" | [Relevance] |

**Sentiment Trend:** [Last 3 calls trending positive/negative/mixed]

---

## External Context

- [Company news that supports the engagement case]
- [Industry trend that creates urgency]
- [Strategic initiative PS can align to]

---

## → Next in Pipeline

This ROI Hypothesis feeds into:
1. **Solution Architect Agent** — to design HOW we deliver these outcomes
2. **Offering Matchmaker** — to map use cases to FY27 Service Catalog packages

Say:
- "solution architecture for [Account Name]" → designs the technical approach
- "match offerings for [Account Name]" → maps to packages and pricing

---

**Prepared by:** Compass Customer ROI Hypothesis Agent
**Output Type:** 🔵 OUTPUT
**Data Sources:** Portfolio, HG Grades, Actions, Calls[, Web Research]
**Pipeline Position:** Discover → Scoping Assets → Position 2
```

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account and UseCaseInventory from `engagement-artifacts` when available).
### After executing
- Call `memory_remember` with hypothesis and ROI conclusions scoped to `{account_id}`.
- Call `memory_store_artifact` for the ROIHypothesis in `engagement-artifacts`.

---

## Guardrails

- **Every pain point must have evidence.** No fabricated pain points. Every claim traces to a data source — health grade, call transcript, action signal, or external news.
- **Conservative ROI estimates.** Use ranges, not point estimates. Always state assumptions. Better to underpromise than overpromise.
- **Voice of Customer is king.** If the customer has explicitly stated a need (from call data), that outweighs any analytical inference.
- **Don't prescribe solutions yet.** This agent identifies WHAT outcomes to deliver, not HOW. The Solution Architect handles the "how."
- **Three pain points minimum.** Every hypothesis should have at least 3 distinct pain points. If you can't find 3 from the data, flag it and note the confidence level as Low.
- **Flag missing data.** If calls_lookup returns nothing, note "No call data available — hypothesis based on quantitative signals only." This affects confidence level.
- **Respect the pipeline.** Pass the hypothesis downstream — don't try to also do solution architecture or offering matching.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_lookup | **Yes** | Account context — the foundation |
| hggrades_lookup | **Yes** | Health gaps → pain points |
| actions_lookup | **Yes** | Signal-driven engagement rationale |
| calls_lookup | **Yes** | Voice of customer — stated needs |
| WebSearch | Recommended | External context for strategic alignment |
| spp_lookup | Optional | Services history and pacing context |

### Manual Mode

If MCP tools aren't connected, the agent asks the user to provide:
1. Account name and basic context (ARR, renewal, segment)
2. Known health gaps or platform issues
3. Recent customer conversations or feedback
4. What the customer's business priorities are

---

## Related Skills

- **Scouting Agent** (Discover) → Upstream — provides opportunity context
- **Solution Architect** (Discover) → Downstream — designs the technical approach
- **Offering Matchmaker** (Discover) → Downstream — maps to service packages
- **Account 360** (Discover) → Deeper context when more data needed
- **Web Research** (Discover) → Extended company intelligence for strategic cases
