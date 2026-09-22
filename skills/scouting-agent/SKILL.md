---
name: scouting-agent
tier: 1
description: "Scan the portfolio for engagement opportunities — accounts with expiring services, health gaps, renewal risk, growth signals, or untapped potential. Trigger with 'scout for opportunities', 'who needs services', 'find engagement opportunities', 'opportunity scan', 'which accounts should we target', or any request to identify accounts that would benefit from PS engagement."
maturity: alpha
audience: [orchestration, intelligence]
pipeline:
  phase: discover
  sub_phase: opportunity-scan
  position: 1
  output_type: alert
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: opportunity-list
      format: markdown
      downstream:
        - agent: customer-roi-hypothesis
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: hggrades_lookup
      required: false
    - tool: actions_lookup
      required: false
    - tool: hgplatformutilization_search
      required: false
    - tool: sfopportunities_search
      required: false
    - tool: spp_project_assignments_search
      required: false
  phase_gate: false
---

# Scouting Agent — Opportunity Scan

The entry point to the entire Compass pipeline. Scans the portfolio to surface accounts that would benefit from Professional Services engagement. Produces a prioritized opportunity list that feeds into the Customer ROI Hypothesis agent.

## How It Works

```
User says: "scout for opportunities" or "who needs services"
                    |
         portfolio_search
         (multiple opportunity lenses)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Health   Renewal  Service  Growth   Engagement
  Gaps     Timing   Gaps     Signals  Gaps
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Score & rank opportunities
                    |
         🔴 ALERT: Opportunity List
                    |
         → Customer ROI Hypothesis (downstream)
```

## Triggers

- "scout for opportunities"
- "who needs services"
- "find engagement opportunities"
- "opportunity scan"
- "which accounts should we target"
- "where should PS focus"
- "accounts that need help"
- "pipeline scan"
- "find me work"

## Execution Flow

### Step 1: Define Opportunity Lenses

The Scouting Agent runs 5 portfolio scans, each surfacing a different type of opportunity:

#### Lens 1: Health Gap Opportunities
Accounts with poor health grades that PS could improve.

```
portfolio_search:
  where_clause: `hgtrends_health_grade` IN ('D', 'F')
                AND `bks_stage` NOT IN ('Churned', 'Cancelled')
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, bks_renewal_date, `Days to Renewal`,
                 bks_renewal_baseline_usd, risk_signal_total, growth_signal_total,
                 bks_csm, `Account Segment`, momentum_segment,
                 `Has Active Services`, `% Pacing`
  order_by: hgtrends_health_gpa ASC
  limit: 25
```

**Why:** D/F health accounts are at highest risk. PS engagement directly improves health scores through adoption, content creation, and user engagement.

#### Lens 2: Renewal Window + No Active Services
Accounts approaching renewal that don't have PS engaged.

```
portfolio_search:
  where_clause: `Days to Renewal` > 0 AND `Days to Renewal` <= 120
                AND (`Has Active Services` = 'No' OR `Has Active Services` IS NULL)
                AND `bks_renewal_baseline_usd` >= 50000
  select_fields: [same core fields]
  order_by: `Days to Renewal` ASC
  limit: 25
```

**Why:** Renewals without active PS have lower retention rates. Getting PS engaged before renewal creates stickiness and demonstrates value.

#### Lens 3: Service Gap Opportunities
Accounts with expiring or recently completed services that need follow-on.

```
portfolio_search:
  where_clause: `Has Active Services` = 'Yes'
                AND `% Pacing` >= 80
  select_fields: [same core fields plus spp fields when available]
  order_by: `% Pacing` DESC
  limit: 25
```

**Why:** Accounts at 80%+ pacing are about to run out of hours. They need follow-on engagement or they'll stall.

#### Lens 4: Growth Signal Opportunities
Accounts showing expansion signals that PS could accelerate.

```
portfolio_search:
  where_clause: `growth_signal_total` >= 3
                AND `hgtrends_health_grade` IN ('A', 'B', 'C')
  select_fields: [same core fields]
  order_by: growth_signal_total DESC
  limit: 25
```

**Why:** Growth signals indicate the account is ready to expand. PS engagement at this moment converts signals into revenue.

#### Lens 5: Engagement Drop-Off
Accounts where relationship metrics are declining.

```
portfolio_search:
  where_clause: `momentum_segment` IN ('Declining', 'Fading')
                AND `bks_renewal_baseline_usd` >= 25000
  select_fields: [same core fields]
  order_by: bks_renewal_baseline_usd DESC
  limit: 25
```

**Why:** Declining engagement is the earliest warning sign. PS re-engagement reverses the trend before it becomes a retention problem.

#### Lens 6: Feature Underutilization [when hgplatformutilization_search available]
Accounts paying for features they aren't using — direct PS opportunity.

```
hgplatformutilization_search:
  where_clause: Enabled = 'Yes' AND `Feature Used` = 'No'
  select_fields: account_name, domain, Feature, Enabled, Feature Used,
                 Feature Used Last 30 Days, Feature Used Last 90 Days
  order_by: Feature ASC
  limit: 50
```

**Why:** "You're paying for Domo Everywhere but have never turned it on. PS can build your embedded analytics portal." Enabled-but-unused features are the most concrete PS opportunities in the portfolio.

#### Lens 7: Deal Acceleration [when sfopportunities_search available]
Accounts with active upsell/expansion deals where PS engagement could help close.

```
sfopportunities_search:
  where_clause: `Type` IN ('Upsell', 'New Logo') AND `Stage` NOT IN ('Closed Won', 'Closed Lost')
                AND `ACV (USD)` >= 50000
  select_fields: Account Name, Opportunity Name, Type, Stage, ACV (USD), Close Date,
                 Domo Opportunity Owner, CSM
  order_by: `ACV (USD)` DESC
  limit: 25
```

**Why:** PS engagement accelerates deal closure. Showing the customer what PS can build tips the deal over the finish line.

### Step 2: De-duplicate and Score

Merge results across all 5 lenses. For accounts appearing in multiple lenses, that's a stronger signal.

**Opportunity Score (0-100):**

```
Opportunity Score Components:
┌───────────────────────────────────────────────┐
│ Multi-Lens Appearance (0-20 pts)               │
│   5 lenses = 20, 4 = 16, 3 = 12, 2 = 8, 1 = 4│
├───────────────────────────────────────────────┤
│ ARR Weight (0-20 pts)                          │
│   >$500K = 20, $200-500K = 15, $100-200K = 10,│
│   $50-100K = 5, <$50K = 2                      │
├───────────────────────────────────────────────┤
│ Health Urgency (0-20 pts)                      │
│   F = 20, D = 15, C = 10, B = 5, A = 0        │
├───────────────────────────────────────────────┤
│ Renewal Proximity (0-20 pts)                   │
│   0-30d = 20, 31-60d = 15, 61-90d = 10,       │
│   91-120d = 5, 120+ = 0                        │
├───────────────────────────────────────────────┤
│ Signal Density (0-20 pts)                      │
│   Combined risk+growth signals:                │
│   >15 = 20, 10-15 = 15, 5-10 = 10, <5 = 5    │
└───────────────────────────────────────────────┘
```

### Step 3: Classify Opportunity Type

For each scored account, classify the primary opportunity:

| Opportunity Type | Criteria | Recommended PS Engagement |
|-----------------|----------|--------------------------|
| **🔴 Rescue** | Health D/F + renewal <90d | Immediate intervention — adoption sprint |
| **🟠 Protect** | Health C + declining momentum | Proactive engagement — health improvement plan |
| **🟡 Accelerate** | Active services nearing completion | Follow-on scoping — next phase planning |
| **🟢 Expand** | Growth signals + healthy | New use case exploration — expansion engagement |
| **🔵 Activate** | No services + high ARR | First engagement — demonstrate PS value |

### Step 4: Enrich Top Opportunities

For the top 10 scored accounts, pull additional context:

```
For each top-10 account:
  1. hggrades_lookup(account_id) → Which health dimensions are weak?
  2. actions_lookup(account_name) → What actions are recommended?
  3. Infer potential PS engagements from gap patterns
```

### Step 5: Produce Opportunity List

---

## Output Template

```markdown
# 🔴 Opportunity Scan Report

**Scan Date:** [Date]
**Accounts Scanned:** [N]
**Opportunities Identified:** [N]
**Total ARR in Opportunity Pool:** $[sum]

---

## Scan Summary

| Opportunity Type | Count | Total ARR | Avg Score |
|-----------------|-------|-----------|-----------|
| 🔴 Rescue | [N] | $[sum] | [avg] |
| 🟠 Protect | [N] | $[sum] | [avg] |
| 🟡 Accelerate | [N] | $[sum] | [avg] |
| 🟢 Expand | [N] | $[sum] | [avg] |
| 🔵 Activate | [N] | $[sum] | [avg] |
| **Total** | **[N]** | **$[sum]** | |

---

## Top Opportunities

### 1. [Account Name] — Score: [XX]/100 — [🔴/🟠/🟡/🟢/🔵 Type]

| | |
|---|---|
| **Health** | [Grade] (GPA: [X.XX]) |
| **ARR** | $[amount] |
| **Renewal** | [Date] ([X] days) |
| **Services** | [Active / None / Expiring] |
| **Momentum** | [Segment] |
| **Signals** | [N] risk, [N] growth |
| **CSM** | [Name] |
| **AE** | [Name] |
| **Lenses Hit** | [Which of the 5 lenses flagged this account] |

**Why This Is an Opportunity:**
- [Primary reason from scoring — e.g., "Health F with $250K ARR and 45 days to renewal"]
- [Secondary reason — e.g., "Zero active services despite 8 risk signals"]
- [Third reason if applicable]

**Health Gap Analysis:** (from hggrades_lookup)
| Health Course | Grade | Gap Description |
|---------------|-------|-----------------|
| [Worst course] | [Grade] | [What PS could address] |
| [2nd worst] | [Grade] | [What PS could address] |

**Recommended PS Engagement:**
- **Type:** [Rescue / Protect / Accelerate / Expand / Activate]
- **Suggested Package:** [Based on gap pattern — e.g., "Adoption Sprint" or "Data Strategy Assessment"]
- **Estimated Hours:** [Range based on typical engagement]
- **Urgency:** [Immediate / This Quarter / Next Quarter]

---

[Repeat for top 10 opportunities]

---

## Quick-Scan: All Opportunities (sorted by score)

| Rank | Account | Type | Score | Health | ARR | Renewal | Services | Lenses |
|------|---------|------|-------|--------|-----|---------|----------|--------|
| 1 | [Name] | [🔴] | [XX] | [Grade] | $[X] | [X]d | [Y/N] | [N]/5 |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

---

## Recommended Next Steps

1. **[Account]** → Run Customer ROI Hypothesis to scope the engagement
2. **[Account]** → Run Customer ROI Hypothesis to scope the engagement
3. **[Account]** → Schedule call with CSM to discuss intervention

---

## → Next in Pipeline: Customer ROI Hypothesis

For any account on this list, say:
- "generate ROI hypothesis for [Account Name]"
- "scope engagement for [Account Name]"

The Customer ROI Hypothesis agent will take the opportunity context and generate a structured hypothesis of what business outcomes PS can deliver.

---

**Prepared by:** Compass Scouting Agent
**Output Type:** 🔴 ALERT
**Data Sources:** Portfolio Search, HG Grades, Actions[, Platform Utilization, SF Opportunities, SPP Assignments]
**Pipeline Position:** Discover → Opportunity Scan → Position 1
```

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" for account-level enrichment; use `memory_bundle` when prep spans multiple accounts in the opportunity list.
### After executing
- Call `memory_remember` with opportunity signals and new account facts scoped to `{account_id}`.
- Call `memory_store_artifact` for the ScoutingReport in `engagement-artifacts`.

---

## Guardrails

- **Cast a wide net, then score tightly.** Run all 5 lenses, then let the scoring algorithm surface the best opportunities. Don't pre-filter too aggressively.
- **ARR grounds the conversation.** Always show dollar values. "20 opportunities" means nothing. "$4.2M in ARR with active opportunities" gets attention.
- **Never fabricate engagement recommendations.** Base suggested PS engagements on actual health gaps and signal patterns. If the data doesn't support a specific engagement type, say "Further scoping needed."
- **Multi-lens hits are gold.** An account appearing in 3+ lenses is a stronger signal than any single-lens hit. Weight this heavily in scoring.
- **Respect the pipeline.** The Scouting Agent identifies and prioritizes. It does NOT scope engagements — that's the Customer ROI Hypothesis agent's job.
- **Refresh weekly.** This scan should run weekly (Monday morning cadence) to keep the opportunity pipeline fresh.

---

## Connecting MCP Tools

| Tool | Required | What It Does |
|------|----------|-------------|
| portfolio_search | **Yes** | Runs the 5 core opportunity lenses against the full portfolio |
| portfolio_lookup | Recommended | Gets full account detail for top opportunities |
| hggrades_lookup | Recommended | Identifies specific health gaps for PS engagement targeting |
| actions_lookup | Recommended | Surfaces recommended actions that align with PS offerings |
| spp_lookup | Optional | Identifies service gaps and pacing issues |
| hgplatformutilization_search | Optional | Lens 6: Finds accounts with enabled-but-unused features |
| sfopportunities_search | Optional | Lens 7: Finds accounts with active deals where PS can help close |
| spp_project_assignments_search | Optional | Identifies accounts with nearly-complete engagements for follow-on |

---

## Related Skills

- **Customer ROI Hypothesis** (Discover) → Next in pipeline — scopes the engagement
- **Renewal Risk Radar** (Discover) → Overlapping lens for renewal-focused scan
- **Account 360** (Discover) → Deep-dive any surfaced opportunity
- **Adoption Acceleration** (Adopt) → When opportunity is adoption-related
