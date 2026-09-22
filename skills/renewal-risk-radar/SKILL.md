---
name: renewal-risk-radar
tier: 1
description: "Scan the portfolio for renewal risk — accounts approaching renewal with bad signals, declining health, or forecast gaps. Trigger with 'renewal risk radar', 'who's at risk', 'show me risky renewals', 'portfolio risk scan', 'renewals next [X] days', 'which accounts need attention', or any request to surface accounts that need intervention before renewal."
maturity: alpha
audience: [intelligence]
---

# Renewal Risk Radar

Scans the entire portfolio to surface accounts that need attention before their renewal. This is the agent a CSM manager or VP runs on Monday morning to know where to focus the week.

## How It Works

```
User says: "show me risky renewals in the next 90 days"
                    |
         portfolio_search
         (renewal window + risk criteria)
                    |
    +-------+-------+-------+
    |       |       |       |
  Renewals  Risk     Health   Forecast
  by window signals  trends   gaps
    |       |       |       |
    +-------+-------+-------+
                    |
         Rank by composite risk score
                    |
         Produce Risk Radar Report
```

## Triggers

- "renewal risk radar"
- "who's at risk"
- "show me risky renewals"
- "portfolio risk scan"
- "renewals next [X] days"
- "which accounts need attention"
- "risk report for [CSM name]'s book"
- "accounts renewing this quarter"
- "what should I worry about"
- "Monday morning briefing" (when context is CS/renewals)

## Execution Flow

### Step 1: Define the Scan Window

Default: next 120 days. User can override.

```
portfolio_search:
  where_clause: `Days to Renewal` > 0 AND `Days to Renewal` <= [window]
  select_fields: bks_account_name, bks_account_id, hgtrends_health_grade,
                 hgtrends_health_gpa, Days to Renewal, bks_renewal_date,
                 bks_renewal_baseline_usd, bks_FCST_amount, fcst_renewal_pct,
                 bks_forecast_delta, risk_signal_total, growth_signal_total,
                 risk_last30days, momentum_segment, Account Segment,
                 bks_csm, team_ae, bks_stage, % Pacing
  order_by: `Days to Renewal` ASC
  limit: 100
```

Optional filters:
- By CSM: `AND \`bks_csm\` = '[Name]'`
- By segment: `AND \`Account Segment\` = '[Segment]'`
- By region: `AND \`bks_csm_region\` = '[Region]'`
- By health grade: `AND \`hgtrends_health_grade\` IN ('D', 'F')`

### Step 2: Score Each Account

For each account in the scan, compute a **composite risk score** (0-100, higher = more urgent):

```
Risk Score Components:
┌─────────────────────────────────────────────┐
│ Time Pressure (0-25 pts)                     │
│   Days to Renewal:                           │
│     0-30 days  = 25 pts                      │
│     31-60 days = 20 pts                      │
│     61-90 days = 15 pts                      │
│     91-120 days = 10 pts                     │
│     120+ days  = 5 pts                       │
├─────────────────────────────────────────────┤
│ Health Grade (0-25 pts)                      │
│     F = 25, D = 20, C = 15, B = 5, A = 0   │
├─────────────────────────────────────────────┤
│ Signal Load (0-20 pts)                       │
│   risk_signal_total:                         │
│     >10 = 20, 6-10 = 15, 3-5 = 10, <3 = 5  │
│   Bonus: +5 if risk_last30days > 3 (recent)  │
├─────────────────────────────────────────────┤
│ Forecast Gap (0-15 pts)                      │
│   fcst_renewal_pct:                          │
│     <70% = 15, 70-85% = 10, 85-95% = 5,     │
│     95%+ = 0                                 │
├─────────────────────────────────────────────┤
│ Pacing (0-15 pts)                            │
│   % Pacing:                                  │
│     <50% = 15, 50-70% = 10, 70-85% = 5,     │
│     85%+ = 0                                 │
└─────────────────────────────────────────────┘
```

### Step 3: Classify Risk Tier

| Tier | Score | Count Expected | Action Required |
|------|-------|----------------|-----------------|
| **🔴 Critical** | 70-100 | ~5% of renewals | Immediate war-room. CSM + Manager + AE aligned this week. |
| **🟠 High** | 50-69 | ~15% of renewals | Active intervention. Proactive outreach within 2 weeks. |
| **🟡 Moderate** | 30-49 | ~30% of renewals | Monitor closely. Ensure engagement plan is in place. |
| **🟢 Low** | 0-29 | ~50% of renewals | Standard renewal motion. No special attention needed. |

### Step 4: Deep-Dive Critical Accounts

For accounts scoring 70+, automatically pull additional context:

```
For each critical account:
  1. hggrades_lookup(account_id)  → Which health dimensions are failing?
  2. actions_lookup(account_name) → What actions are recommended?
  3. calls_lookup(account_name, limit=3) → What's the recent conversation tone?
  4. sfopportunities_lookup(account_name, stage="Renewal") → Where is the renewal deal?
     Is it stuck at early stage? Has the forecast been downgraded?
  5. hgsupport_lookup(account_name, priority="Critical") → Any open critical cases
     compounding the risk?
```

Optional portfolio-level support risk lens (run alongside Step 1 lenses):

```
hgsupport_search:
  where_clause: Priority IN ('Critical', 'High') AND Status = 'Open'
  select_fields: Account Name, CaseNumber, Priority, Status, Subject, CreatedDate
  order_by: CreatedDate DESC
  limit: 25
```
This surfaces accounts with active support fires — a risk signal not captured in the standard scoring model.

### Step 5: Produce the Radar Report

---

## Output Template

```markdown
# Renewal Risk Radar

**Scan Date:** [Date]
**Window:** Next [X] days (renewals through [end date])
**Filter:** [CSM / Segment / Region / All]
**Accounts Scanned:** [N]

---

## Risk Summary

| Tier | Count | Total ARR at Risk | Avg Days to Renewal |
|------|-------|-------------------|---------------------|
| 🔴 Critical | [N] | $[sum] | [avg] days |
| 🟠 High | [N] | $[sum] | [avg] days |
| 🟡 Moderate | [N] | $[sum] | [avg] days |
| 🟢 Low | [N] | $[sum] | [avg] days |
| **Total** | **[N]** | **$[sum]** | |

---

## 🔴 Critical Risk Accounts (Score 70+)

### [Account Name] — Score: [XX]/100

| | |
|---|---|
| Health Grade | [Grade] (GPA: [X.XX]) |
| Renewal | [Date] ([X] days) |
| ARR | $[amount] |
| Forecast | $[amount] ([X]% of baseline) |
| Pacing | [X]% |
| Risk Signals | [N] (last 30d: [N]) |
| CSM | [Name] |
| AE | [Name] |
| Segment | [Segment] |

**Why It's Critical:**
- [Top risk factor 1 — e.g., "Health Grade F with 42 days to renewal"]
- [Top risk factor 2 — e.g., "Forecast at 65% of baseline = $X gap"]
- [Top risk factor 3 — e.g., "12 risk signals, 5 new in last 30 days"]

**Health Grade Breakdown:** (from hggrades_lookup)
| Health Course | Grade | Trend |
|---------------|-------|-------|
| [Worst course] | [Grade] | [30d trend] |
| [2nd worst] | [Grade] | [30d trend] |

**Top Recommended Actions:** (from actions_lookup)
1. [Action] — [Urgency] — [Executing Role]
2. [Action] — [Urgency] — [Executing Role]

**Recent Call Sentiment:** (from calls_lookup)
- [Date]: [Title] — [Sentiment] — "[Key recap excerpt]"

**Recommended Intervention:**
1. [Specific step with owner and deadline]
2. [Specific step]
3. [Specific step]

---

[Repeat for each critical account]

---

## 🟠 High Risk Accounts (Score 50-69)

| Account | Grade | Days to Renewal | ARR | Forecast % | Risk Signals | Score | CSM |
|---------|-------|-----------------|-----|------------|--------------|-------|-----|
| [Name] | [X] | [X] | $[X] | [X%] | [X] | [XX] | [Name] |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## 🟡 Moderate Risk Accounts (Score 30-49)

| Account | Grade | Days to Renewal | ARR | Forecast % | Risk Signals | Score | CSM |
|---------|-------|-----------------|-----|------------|--------------|-------|-----|
| [Name] | [X] | [X] | $[X] | [X%] | [X] | [XX] | [Name] |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## Portfolio Risk Heatmap

By CSM:
| CSM | Total Renewals | Critical | High | Moderate | Low | Total ARR |
|-----|----------------|----------|------|----------|-----|-----------|
| [Name] | [N] | [N] | [N] | [N] | [N] | $[sum] |
| ... | ... | ... | ... | ... | ... | ... |

By Segment:
| Segment | Total Renewals | Critical | High | Avg Score |
|---------|----------------|----------|------|-----------|
| [Segment] | [N] | [N] | [N] | [XX] |

---

## Action Items This Week

1. **[Account]** — [Action] — Owner: [CSM/AE] — Deadline: [Date]
2. **[Account]** — [Action] — Owner: [CSM/AE] — Deadline: [Date]
3. ...

---

**Prepared by:** Compass Renewal Risk Radar
**Data Sources:** Portfolio, HG Grades, Actions, Calls[, SF Opportunities, Support Cases]
**Next Scan:** [Recommended: weekly on Monday]
```

---

## Guardrails

- **Never hide bad news.** If an account is critical, say so clearly. The whole point is early warning.
- **Show the math.** Always show the risk score components so managers can understand why an account ranked where it did.
- **Don't over-scan.** Default to 120-day window. Wider scans dilute focus.
- **Respect data boundaries.** If forecast data is missing, use health grade + signals only. Don't impute a forecast.
- **Weekly rhythm.** This is designed to run weekly. Recommend Monday morning cadence.
- **Deep-dive is for criticals only.** Don't pull hggrades/actions/calls for every account — just the ones scoring 70+.
- **ARR is real money.** Always show dollar amounts alongside percentages. "$50K at risk" lands differently than "3 accounts at risk."

---

## Connecting MCP Tools

| Tool | Required | What It Does |
|------|----------|-------------|
| portfolio_search | **Yes** | Scans portfolio with renewal + risk filters |
| portfolio_lookup | **Yes** | Gets full account data for scoring |
| hggrades_lookup | Recommended | Deep-dive health breakdown for critical accounts |
| actions_lookup | Recommended | Recommended actions for critical accounts |
| calls_lookup | Optional | Recent call sentiment for critical accounts |
| sfopportunities_lookup | Optional | Renewal deal stage and forecast for critical accounts |
| sfopportunities_search | Optional | Portfolio-wide deal risk lens |
| hgsupport_search | Optional | Portfolio-wide support fire detection |

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: renewal risk level, days to renewal, health gaps contributing to risk, recommended pre-renewal actions.

## Related Skills

- **Account 360** (Discover) — Deep-dive any account surfaced by the radar
- **Adoption Acceleration** (Adopt) — Generate intervention plan for at-risk accounts
- **Call Prep** (Align) — Prep for the intervention call with a critical account
- **Web Research** (Discover) — External context for critical accounts
- **Template Registry** (Global) — Risk reports use Domo Word Doc Template
