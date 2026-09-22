---
name: engagement-forecast
tier: 1
description: "Forecast engagement completion dates based on burn rate and overlay customer sentiment from Compass. Shows when engagements will exhaust hours, flags mismatches between forecast and contract dates, and recommends investment/free bucket hours when sentiment warrants it. Trigger on 'engagement forecast', 'when will engagements finish', 'burn rate forecast', 'show me engagements closing soon', 'forecasted end dates', 'portfolio forecast', 'when does [account] run out of hours', '[consultant] portfolio forecast', 'which engagements are ending', or any request about projected engagement completion timelines. Also trigger when users ask about investing free hours, bridging engagement gaps, or whether a customer needs post-engagement investment."
maturity: alpha
audience: [intelligence]
---

# Engagement Forecast — Burn Rate Projection + Customer Sentiment

Forecasts when engagements will exhaust their hours based on actual burn rate, compares against contract end dates, and overlays Compass signals (health grade, risk/growth signals, Gong sentiment, upsell pipeline) to recommend whether to invest, extend, or let close gracefully.

## Before You Begin

**CRITICAL**: Read `memory/context/spp-query-guide.md` before making ANY SPP queries.

## The Core Insight

The raw forecast answers: "When will this engagement's hours run out?"

But the real value comes from combining that with sentiment:

```
Engagement closing in 2 weeks
  + Customer unhappy (risk signals, bad Gong calls)
  + No upsell in pipeline
  = 🔴 INVEST: Bridge with free hours to stabilize the relationship

Engagement closing in 2 weeks
  + Customer happy (health grade A, growth signals)
  + Upsell already in Negotiate stage
  = 🟢 CLOSE GRACEFULLY: Transition is natural, upsell will carry forward

Engagement closing in 2 weeks
  + Customer healthy but disengaged
  + No upsell conversations
  = 🟡 INVESTIGATE: Is the silence good or bad? Schedule a check-in before hours run out
```

## Query Modes

This skill supports several entry points:

### Mode 1: "Show me engagements closing in the next N weeks"
Scans across all active engagements for a team or all teams. Most useful for weekly/biweekly planning.

### Mode 2: "Show me [consultant]'s portfolio forecast"
Shows all engagements for a specific consultant with forecasted end dates. Useful for 1:1s and workload planning.

### Mode 3: "When does [account] run out of hours?"
Deep dive on a single account — all projects, all consultants, with full Compass overlay.

### Mode 4: "Which engagements need investment hours?"
Combines forecast + sentiment to identify where free/investment hours should be directed.

## Step 1: Pull Engagement Data

### For team-wide or consultant-specific views:

Pull last 4 weeks of SPP data (same splitting strategy as other skills). The critical fields for forecasting are:

```
select_fields = "user, account_name, project_id, project_name, project_status,
  adoption_segment, metric_date, funded_billable_hrs, adoption_billable_hrs,
  investment_billable_hrs, total_logged_hrs, project_hours_purchased,
  project_hours_remaining, hub_hours_expiration_date, project_start_date"
```

Filter to `project_status = 'In-Progress'` when aggregating (but pull all to catch recently completed engagements that may need follow-up).

### For account-specific views:

Use `spp_lookup` with the account name — this avoids the row limit issues since it's scoped to one account.

## Step 2: Calculate Burn Rate Per Engagement

For each `project_id`, aggregate across ALL consultants working on it:

```
Per project × per week:
  weekly_burn = SUM(total_logged_hrs) across all consultants on that project

Then:
  avg_weekly_burn = mean(weekly_burn) across the 4 weeks
  burn_trend = compare weeks 3-4 avg to weeks 1-2 avg
    - Accelerating: burning faster recently
    - Decelerating: burning slower recently
    - Steady: within ±15%
```

Burn trend matters because a decelerating engagement may be winding down naturally vs. one that's accelerating into a deadline.

## Step 3: Forecast Completion Date

```python
if avg_weekly_burn > 0:
    weeks_remaining = project_hours_remaining / avg_weekly_burn
    forecast_end_date = today + timedelta(weeks=weeks_remaining)
else:
    forecast_end_date = "Stalled (no recent burn)"
```

Compare against `hub_hours_expiration_date` (contract end):

| Scenario | Flag | Meaning |
|----------|------|---------|
| Forecast < Contract - 30 days | ⚡ **Early Exhaust** | Hours will run out well before contract ends. Customer may expect continued work. |
| Forecast ≈ Contract (±14 days) | ✅ **On Track** | Aligned — this is the ideal state. |
| Forecast > Contract + 14 days | 🐢 **Underburn** | Hours won't be used by contract end. Customer may not be getting value. |
| Hours remaining < 0 | 🔴 **Overburn** | Already exceeded purchased hours. Eating into investment/free bucket. |
| No recent burn (0 hrs/wk) | ⏸️ **Stalled** | Engagement may be paused, blocked, or abandoned. |

## Step 4: Overlay Customer Sentiment (Compass)

For each account with an engagement closing within the forecast window, pull:

1. **Portfolio Summary** (`portfolio_summary`):
   - Health grade and GPA
   - Risk signal total vs growth signal total
   - Days to renewal
   - ARR

2. **Actions** (`actions_lookup`):
   - Risk actions (de-risk classification)
   - Growth actions (grow classification)
   - Recent signal dates

3. **Opportunities** (`sfopportunities_lookup`, type = 'Upsell' or 'Renewal'):
   - Is there an active upsell in pipeline?
   - What stage is it in?
   - When does it close?

4. **Recent Calls** (`calls_lookup`, limit 3):
   - Last call date and recap
   - Customer sentiment from recent conversations

### Sentiment Score

Combine signals into a simple sentiment indicator:

| Signal | Positive | Negative |
|--------|----------|----------|
| Health grade | A or B | D or F |
| Risk signals | < 50 | > 100 |
| Growth signals | > 200 | < 50 |
| Active upsell | In Demonstrate Value+ | None |
| Recent Gong calls | Positive recap | Escalation, complaints |
| Days to renewal | > 180 | < 90 |

**Sentiment categories:**
- 🟢 **Happy** — Health A/B, growth signals strong, upsell moving, positive calls
- 🟡 **Mixed** — Some positive, some concerning signals
- 🔴 **At Risk** — Low health, high risk signals, no upsell, negative calls
- ⚪ **Unknown** — Insufficient data to assess

## Step 5: Generate Recommendations

Combine forecast + sentiment into actionable guidance:

| Forecast | Sentiment | Recommendation |
|----------|-----------|---------------|
| Closing soon | 🔴 At Risk | **INVEST**: Allocate free/investment hours to stabilize. Don't let the engagement end on a sour note. |
| Closing soon | 🟡 Mixed | **INVESTIGATE**: Schedule a health check call before hours run out. Determine if investment needed. |
| Closing soon | 🟢 Happy | **CLOSE GRACEFULLY**: Natural transition. If upsell exists, coordinate handoff. |
| Closing soon | ⚪ Unknown | **INVESTIGATE**: Lack of signal is itself a risk. Reach out. |
| Early exhaust | Any | **ALERT**: Customer expects work through contract date. Plan for gap coverage or reset expectations. |
| Underburn | 🟢 Happy | **MONITOR**: May not need all hours. Check if scope changed. |
| Underburn | 🔴 At Risk | **ALERT**: Not using hours AND unhappy = disengagement risk. Urgent outreach. |
| Stalled | Any | **ALERT**: Why did burn stop? Check for blockers, staffing gaps, or customer disengagement. |

## Step 6: Generate the Report

Ask the user their preferred format per CLAUDE.md instructions.

### Report Structure — Team/Portfolio View

```markdown
# Engagement Forecast — [Scope]

**Based on:** Last 4 weeks of SPP data ([date range])
**Generated:** [today]

## Engagements Closing Within [N] Weeks

| Account | Project | Type | Hrs Left | Avg Burn/Wk | Forecast End | Contract End | Gap | Sentiment | Action |
|---------|---------|------|----------|-------------|-------------|-------------|-----|-----------|--------|

## Needs Investment (Closing Soon + At Risk)
[Details with Compass overlay for each]

## Closing Gracefully (Closing Soon + Happy)
[Brief list — these are fine]

## Stalled / Underburning
[Engagements with anomalous burn patterns]

## Full Portfolio Forecast
[All active engagements sorted by forecasted end date]
```

### Report Structure — Consultant Portfolio View

```markdown
# [Consultant Name] — Engagement Portfolio Forecast

**Active Engagements:** [N]
**Total Hours Remaining:** [X]
**Avg Weekly Commitment:** [X] hrs across all engagements

## Engagement Timeline

| Account | Project | Type | Hrs Left | Wkly Burn | Forecast End | Contract End | Status | Sentiment |
|---------|---------|------|----------|-----------|-------------|-------------|--------|-----------|

## Upcoming Transitions
[Engagements ending in next 4 weeks with sentiment overlay]

## Capacity Outlook
[As engagements close, what bandwidth opens up? Ties into staffing-finder.]
```

### Report Structure — Account Deep Dive

```markdown
# [Account Name] — Engagement Forecast

**Health Grade:** [X] | **Risk Signals:** [N] | **Growth Signals:** [N]
**Days to Renewal:** [N] | **ARR:** [X]

## Active Engagements

[For each project:]
### [Project Name]
- **Type:** [Funded/Adoption/Investment] | **Status:** [In-Progress]
- **Hours:** [Purchased] purchased, [Remaining] remaining ([X]% consumed)
- **Burn Rate:** [X] hrs/wk avg (trend: accelerating/steady/decelerating)
- **Team:** [consultants assigned]
- **Forecast Completion:** [date] | **Contract End:** [date]
- **Gap:** [X days early/late]

## Compass Signals
[Recent actions, Gong call summaries, upsell pipeline]

## Recommendation
[Invest / Close gracefully / Investigate — with reasoning]
```

## How This Connects to the Other Skills

This skill forms the forward-looking piece of the consulting ops toolkit:

1. **Monday QB** tells you "how did we do last week" (retrospective)
2. **Engagement Forecast** tells you "what's coming next" (predictive)
3. **Staffing Finder** tells you "who can take on new work" (actionable)

The natural flow: Engagement Forecast shows an engagement closing in 3 weeks, freeing up 10 hrs/wk for a consultant → Staffing Finder uses that projected capacity to match against incoming engagement requests.

## Edge Cases

- **project_hours_purchased is blank/0**: Some entries (ACE, "Other Hour Types") don't have purchased hours. Skip these for forecasting. They're overhead/admin buckets, not customer engagements.
- **project_hours_remaining is negative**: Already overburned. Flag as 🔴 and check if it's deliberate investment or accidental overrun.
- **Multiple consultants on one project**: Aggregate all their burn for the project-level forecast. Show individual contributions in the detail view.
- **New engagement (< 2 weeks old)**: Burn rate from 1-2 weeks is unreliable. Flag as "Ramping" and use a conservative estimate.
- **Consultant asks about their own portfolio**: Filter to just their name and show the consultant portfolio view.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: forecasted completion dates, burn rate vs contracted hours, sentiment-forecast mismatches, free-hours investment recommendations.
