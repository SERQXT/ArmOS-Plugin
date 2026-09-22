---
name: delivery-risk-radar
tier: 1
description: "Scan active engagements for delivery risks — scope creep, timeline slippage, hour overburn, blocker accumulation, and engagement health decline. Trigger with 'delivery risk radar', 'check delivery risks', 'are any projects in trouble', 'engagement health check', or any request to surface delivery risks across active PS engagements."
maturity: alpha
audience: [orchestration, delivery]
pipeline:
  phase: build
  sub_phase: execution
  position: 3
  output_type: alert
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: delivery-risk-report
      format: markdown
      downstream:
        - agent: weekly-status
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: portfolio_lookup
      required: true
    - tool: spp_lookup
      required: false
    - tool: hggrades_lookup
      required: false
    - tool: calls_lookup
      required: false
  phase_gate: false
---

# Delivery Risk Radar — Active Engagement Health Monitor

Continuous monitoring agent for the Build phase. Scans all active PS engagements to surface delivery risks before they become delivery failures. This is the Build-phase equivalent of the Renewal Risk Radar in Discover.

## How It Works

```
User says: "delivery risk radar" or "are any projects in trouble"
                    |
         Scan all active engagements
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Hours    Timeline Scope   Engagement Asana
  Burn     Tracking Health  Quality   Status
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Score & rank delivery risks
                    |
         🔴 ALERT: Delivery Risk Report
```

## Triggers

- "delivery risk radar"
- "check delivery risks"
- "are any projects in trouble"
- "engagement health check"
- "which engagements need help"
- "delivery health scan"
- "project risk scan"
- "Thursday risk check" (pre-status cadence)

## Execution Flow

### Step 1: Identify Active Engagements

```
portfolio_search:
  where_clause: `Has Active Services` = 'Yes'
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, bks_renewal_date, `Days to Renewal`,
                 bks_renewal_baseline_usd, bks_csm, `Account Segment`,
                 `% Pacing`, momentum_segment
  order_by: bks_account_name ASC
  limit: 100
```

If `spp_lookup` is available, also pull:
```
For each active engagement:
  spp_lookup(account_name)
  → Hours purchased, hours consumed, hours remaining
  → Billing category, engagement type
  → Burn rate, velocity
```

### Step 2: Score Delivery Risk

For each active engagement, compute a **Delivery Risk Score (0-100)**:

```
Delivery Risk Score Components:
┌─────────────────────────────────────────────────────┐
│ Hours Burn Rate (0-30 pts)                           │
│   % Consumed vs. % Timeline Elapsed:                 │
│   >20% ahead of pace = 30 (overburning)              │
│   10-20% ahead = 20                                  │
│   On pace (±10%) = 5                                 │
│   10-20% behind = 10 (underburning — may stall)      │
│   >20% behind = 15 (stalled — risk of non-delivery)  │
├─────────────────────────────────────────────────────┤
│ Health Trajectory (0-25 pts)                         │
│   30d health trend:                                  │
│   Declining 2+ grades = 25                           │
│   Declining 1 grade = 15                             │
│   Stable = 5                                         │
│   Improving = 0                                      │
├─────────────────────────────────────────────────────┤
│ Engagement Quality (0-20 pts)                        │
│   From calls sentiment + frequency:                  │
│   Negative sentiment + declining frequency = 20      │
│   Negative sentiment OR declining frequency = 12     │
│   Neutral = 5                                        │
│   Positive + regular cadence = 0                     │
├─────────────────────────────────────────────────────┤
│ Signal Load (0-15 pts)                               │
│   risk_signal_total during engagement:               │
│   >8 new signals = 15                                │
│   4-8 = 10                                           │
│   1-3 = 5                                            │
│   0 = 0                                              │
├─────────────────────────────────────────────────────┤
│ Pacing Gap (0-10 pts)                                │
│   % Pacing (overall account):                        │
│   <50% = 10                                          │
│   50-70% = 7                                         │
│   70-85% = 3                                         │
│   85%+ = 0                                           │
└─────────────────────────────────────────────────────┘
```

### Step 3: Classify Risk Tier

| Tier | Score | Action Required |
|------|-------|-----------------|
| **🔴 Critical** | 70-100 | Immediate escalation. Delivery lead + manager meeting within 48 hours. |
| **🟠 High** | 50-69 | Active intervention. Review scope, timeline, and hours this week. |
| **🟡 Moderate** | 30-49 | Monitor. Address in next weekly status. |
| **🟢 Healthy** | 0-29 | On track. Standard cadence. |

### Step 4: Deep-Dive Critical Engagements

For engagements scoring 70+:

```
1. hggrades_lookup(account_id) → Which health dimensions are declining?
2. calls_lookup(account_name, limit=3) → What's the recent tone?
3. Asana (if connected) → Blockers, missed milestones, overdue tasks
```

### Step 5: Produce Risk Report

---

## Output Template

```markdown
# 🔴 Delivery Risk Radar

**Scan Date:** [Date]
**Active Engagements Scanned:** [N]
**Data Sources:** Portfolio, [SPP if available], HG Grades, Calls

---

## Risk Summary

| Tier | Count | Total Hours at Risk | Avg Risk Score |
|------|-------|--------------------|-----------------|
| 🔴 Critical | [N] | [X] hrs remaining | [avg] |
| 🟠 High | [N] | [X] hrs remaining | [avg] |
| 🟡 Moderate | [N] | [X] hrs remaining | [avg] |
| 🟢 Healthy | [N] | [X] hrs remaining | [avg] |

---

## 🔴 Critical Risk Engagements

### [Account Name] — Risk Score: [XX]/100

| | |
|---|---|
| **Package** | [Tier] — [X] hrs purchased |
| **Hours** | [X] consumed / [X] remaining ([X]% burned) |
| **Timeline** | [X]% through engagement |
| **Burn Rate** | [X] hrs/week (target: [X] hrs/week) |
| **Health** | [Grade] — [Trajectory] |
| **Last Call** | [Date] — [Sentiment] |
| **CSM** | [Name] |
| **Lead Consultant** | [Name] |

**Risk Factors:**
1. **[Top risk]** — [Score contribution] pts — [Detail]
2. **[Second risk]** — [Score contribution] pts — [Detail]
3. **[Third risk]** — [Score contribution] pts — [Detail]

**Recommended Intervention:**
1. [Specific action — owner — deadline]
2. [Action]
3. [Action]

---

[Repeat for each critical engagement]

---

## 🟠 High Risk Engagements

| Account | Score | Hours Remaining | Burn Rate | Health | Top Risk Factor |
|---------|-------|----------------|-----------|--------|-----------------|
| [Name] | [XX] | [X] hrs | [X]/wk | [Grade] | [Factor] |
| ... | ... | ... | ... | ... | ... |

---

## 🟡 Moderate Risk Engagements

| Account | Score | Hours Remaining | Health | Flag |
|---------|-------|----------------|--------|------|
| [Name] | [XX] | [X] hrs | [Grade] | [Brief note] |
| ... | ... | ... | ... | ... |

---

## Cross-Engagement Patterns

**Common Risk Themes:**
- [Theme — e.g., "3 of 5 critical engagements have data access delays"]
- [Theme — e.g., "Burn rate exceeding plan on all Gold packages"]
- [Theme — e.g., "Customer engagement declining across Enterprise segment"]

**Resource Hotspots:**
| Consultant | Active Engagements | Risk Engagements | Hours Committed |
|------------|-------------------|------------------|-----------------|
| [Name] | [N] | [N of those at risk] | [X] hrs/week |

---

## Action Items This Week

| # | Account | Action | Owner | Priority | Deadline |
|---|---------|--------|-------|----------|----------|
| 1 | [Account] | [Action] | [Name] | 🔴 Urgent | [Date] |
| 2 | [Account] | [Action] | [Name] | 🟠 High | [Date] |
| 3 | [Account] | [Action] | [Name] | 🟡 Monitor | [Date] |

---

**Prepared by:** Compass Delivery Risk Radar
**Output Type:** 🔴 ALERT
**Pipeline Position:** Build → Execution → Position 3
**Recommended Cadence:** Weekly (Thursday — before Friday status emails)
```

---

## Guardrails

- **Hours accuracy is paramount.** If SPP data isn't available, ask the user for hours consumed/remaining. Don't guess burn rate.
- **Don't conflate account health with delivery health.** A healthy account can have a troubled engagement, and vice versa. Score delivery risk independently.
- **Overburn is a louder alarm than underburn.** An engagement burning hours too fast is a bigger immediate risk than one burning too slow. But underburn can indicate stall.
- **Surface patterns, not just individual risks.** If 3 engagements share the same risk factor (e.g., data access delays), that's a systemic issue worth calling out.
- **Weekly cadence, Thursday preferred.** Run before the Friday status emails so risks are addressed in that week's communications.
- **Critical = escalation.** If an engagement scores 70+, the recommended action must include escalation to management.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_search | **Yes** | Identifies all active engagements |
| portfolio_lookup | **Yes** | Account details for each engagement |
| spp_lookup | **Recommended** | Hours tracking — core of delivery risk |
| hggrades_lookup | Recommended | Health trajectory during engagement |
| calls_lookup | Optional | Engagement quality signals |
| Asana | Optional | Task-level delivery status |

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: risks identified with severity levels, affected engagements, burn rate concerns, blocker accumulation, recommended interventions.

## Related Skills

- **Weekly Status** (Build) → Risks surface in weekly status communications
- **Renewal Risk Radar** (Discover) → Portfolio-level risk (vs. delivery-level here)
- **Quality Radar** (Build) → QA-focused risk (vs. delivery-focused here)
- **Adoption Acceleration** (Adopt) → When delivery risk stems from adoption gaps
