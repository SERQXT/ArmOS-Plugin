---
name: revenue-impact-summary
tier: 1
description: "Roll up PS engagement outcomes to business impact: hours delivered, estimated ROI, renewal correlation, and services-to-retention link. Answers 'Is PS actually moving the needle on retention?' Trigger with 'revenue impact', 'PS impact summary', 'services ROI', 'are we moving the needle', 'show me PS value', or any request to quantify PS business impact across the portfolio."
maturity: alpha
audience: [intelligence]
pipeline:
  phase: discover
  sub_phase: portfolio-intelligence
  position: 5
  output_type: output
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: revenue-impact-report
      format: markdown
      downstream: []
  data_sources:
    - tool: portfolio_search
      required: true
    - tool: spp_lookup
      required: true
  phase_gate: false
---

# Revenue Impact Summary — PS Value Quantification

The executive's answer to "Is Professional Services moving the needle?" Rolls up engagement outcomes across the portfolio to quantify the business impact of PS: hours delivered, health improvement correlation, renewal outcomes, and the PS-to-retention link. This is the skill you run before a board meeting, QBR, or budget conversation.

## How It Works

```
User says: "are we moving the needle with PS?"
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Services  Health   Renewal  Financial
  Activity  Before/  Outcomes Growth
  (hours,   After    (serviced Correlation
  engage-   Services vs not)
  ments)
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Correlate PS Activity with Business Outcomes
                    |
         Quantify Impact
                    |
         Produce Revenue Impact Report
```

## Triggers

- "revenue impact"
- "PS impact summary"
- "services ROI"
- "are we moving the needle"
- "show me PS value"
- "PS contribution to retention"
- "services impact report"
- "justify PS investment"
- "what's our ROI on services"
- "PS business impact"

## Execution Flow

### Step 1: Pull Portfolio + Services Data

```
portfolio_search:
  select_fields: bks_account_name, hgtrends_health_grade, hgtrends_health_gpa,
                 2024_arr, 2023_arr, total_arr_growth, total_arr_growth_percent,
                 Has Active Services, # Active Projects, bks_renewal_date,
                 fcst_renewal_pct, bks_FCST_amount, bks_renewal_baseline_usd,
                 Account Segment, hg_total_billable_hours_purchased,
                 Billable Hours Consumed, Billable Hours Remaining,
                 % Pacing, momentum_segment
  limit: 500
```

### Step 2: Segment by Services Engagement

Split portfolio into:

```
Serviced:     Has Active Services = true OR Billable Hours Consumed > 0
Unserviced:   Has Active Services = false AND Billable Hours Consumed = 0
```

### Step 3: Compute Comparative Metrics

For each segment, compute:

```
Health:
  Avg health grade (serviced vs unserviced)
  Avg GPA
  Grade distribution (A/B/C/D/F counts)

Retention:
  Avg forecast renewal %
  Total ARR at risk (forecast < 85%)
  Renewal success rate (if historical data available)

Growth:
  Avg ARR growth %
  Total ARR growth ($)
  Accounts with positive growth %

Engagement:
  Total hours purchased
  Total hours consumed
  Avg pacing
  Revenue from services (hours * rate if available)
```

### Step 4: Quantify the Delta

The key metric: **What's the measurable difference between serviced and unserviced accounts?**

```
Health Delta:    [Serviced avg GPA] - [Unserviced avg GPA] = [X.XX] points
Retention Delta: [Serviced avg forecast %] - [Unserviced avg forecast %] = [X]pp
Growth Delta:    [Serviced avg ARR growth %] - [Unserviced avg ARR growth %] = [X]pp
ARR Protected:   [Sum of ARR in serviced accounts with forecast > 90%]
```

### Step 5: Produce the Report

---

## Output Template

```markdown
# PS Revenue Impact Summary

**Generated:** [Date]
**Period:** [Fiscal Year / Quarter]
**Portfolio:** [N] accounts, $[X]M total ARR

---

## Executive Summary

[3-4 sentence narrative answering "Is PS moving the needle?" with specific numbers]

Professional Services has engaged [N] accounts representing $[X]M in ARR this period. Serviced accounts show a [X]-point higher average health GPA and [X]pp higher renewal forecast rate compared to unserviced accounts. This correlation represents approximately $[X]M in protected ARR that would be at higher risk without services engagement.

---

## The PS Impact at a Glance

| Metric | Serviced Accounts | Unserviced Accounts | Delta |
|--------|-------------------|---------------------|-------|
| Count | [N] | [N] | |
| Total ARR | $[X]M | $[X]M | |
| Avg Health GPA | [X.XX] | [X.XX] | **+[X.XX]** |
| Avg Health Grade | [X] | [X] | |
| A/B Grade % | [X]% | [X]% | **+[X]pp** |
| D/F Grade % | [X]% | [X]% | **-[X]pp** |
| Avg Forecast % | [X]% | [X]% | **+[X]pp** |
| Avg ARR Growth | [X]% | [X]% | **+[X]pp** |
| Momentum: Accelerating | [X]% | [X]% | |
| Momentum: Declining | [X]% | [X]% | |

---

## Services Activity Summary

| Metric | Value |
|--------|-------|
| Total Engagements (Active) | [N] |
| Total Hours Purchased | [X] |
| Total Hours Consumed | [X] |
| Hours Remaining | [X] |
| Avg Pacing | [X]% |
| Accounts with Active Services | [N] ([X]% of portfolio) |

---

## ARR Impact Quantification

### Protected ARR
Serviced accounts with forecast > 90%: **$[X]M** across [N] accounts
These accounts are likely to renew at or above baseline, with PS engagement as a contributing factor.

### At-Risk ARR (Despite Services)
Serviced accounts with forecast < 85%: **$[X]M** across [N] accounts
These accounts have services but are still at risk — investigate whether scope, timing, or execution is the issue.

### Unserviced ARR at Risk
Unserviced accounts with forecast < 85%: **$[X]M** across [N] accounts
Opportunity: these accounts might benefit from PS intervention.

### Growth Attribution
Serviced accounts with positive ARR growth: [N] accounts, **$[X]M** in growth
Unserviced accounts with positive ARR growth: [N] accounts, **$[X]M** in growth

---

## Segment Breakdown

| Segment | Serviced | Unserviced | Health Delta | Forecast Delta |
|---------|----------|------------|-------------|----------------|
| Enterprise | [N] / [N] | [N] / [N] | +[X.XX] GPA | +[X]pp |
| Mid-Market | [N] / [N] | [N] / [N] | +[X.XX] GPA | +[X]pp |
| SMB | [N] / [N] | [N] / [N] | +[X.XX] GPA | +[X]pp |

---

## Key Stories

### Top PS Success Stories
[Accounts where services clearly correlated with improvement]

| Account | Before Services | After Services | ARR | Impact |
|---------|----------------|---------------|-----|--------|
| [Name]  | Grade [X], forecast [X]% | Grade [X], forecast [X]% | $[X] | [Narrative] |

### Accounts Needing Attention (Services Not Enough)
[Accounts with active services that are still struggling]

| Account | Grade | Forecast | Hours Consumed | Issue |
|---------|-------|----------|---------------|-------|
| [Name]  | [X]   | [X]%     | [X] hrs       | [What's going wrong] |

---

## Recommendations

1. **Increase coverage:** [X]% of portfolio has no services — target [N] high-ARR unserviced accounts for outreach
2. **Investigate underperformers:** [N] serviced accounts still declining — review engagement scope and execution
3. **Scale what works:** [Pattern from success stories] — replicate this approach across [similar accounts]
4. **Budget justification:** PS engagement correlates with +[X]pp forecast improvement, representing ~$[X]M in protected ARR

---

**Prepared by:** Compass Revenue Impact Summary
**Data Sources:** Portfolio Search, SPP
**Note:** Correlation analysis — causation requires deeper engagement-level review
```

---

## Guardrails

- **Correlation, not causation.** ALWAYS caveat that this is correlation analysis. Services may not be the sole cause of better health.
- **Show both sides.** Include "services not enough" accounts — hiding bad outcomes destroys credibility.
- **Dollar amounts are estimates.** Be clear about what's measured vs. inferred.
- **Don't inflate.** If the delta is small, say so. A 0.2 GPA difference is real but modest.
- **Selection bias exists.** Serviced accounts were likely selected because they were already engaged or at risk — acknowledge this.
- **Update regularly.** This analysis is most valuable as a trend over quarters, not a one-time snapshot.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_search | **Yes** | Full portfolio with health, financials, services data |
| spp_lookup | **Yes** | Engagement detail — hours, types, timelines |
| hggrades_lookup | Optional | Deeper health analysis for specific accounts |

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: PS hours delivered, estimated ROI figures, renewal correlation findings, services-to-retention metrics.

## Related Skills

- **Portfolio Health Dashboard** — Current health view (this skill adds the services impact lens)
- **Cross-Account Patterns** — Pattern analysis (this skill quantifies the PS pattern specifically)
- **Engagement Forecast** — Predict when engagements will complete
- **Scouting Agent** — Find new engagement opportunities based on this analysis
