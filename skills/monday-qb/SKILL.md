---
name: monday-qb
tier: 1
description: "Monday Morning Quarterback — weekly retrospective view of consulting capacity and utilization. Shows last week's actuals vs targets, week-over-week trends, and auto-flags risk patterns (overload streaks, declining utilization, high admin ratios). Trigger on 'monday qb', 'monday morning quarterback', 'how did we do last week', 'weekly capacity review', 'weekly utilization review', 'last week capacity', 'consulting review', 'weekly retrospective', or any request to review last week's consulting performance. Also trigger when the user asks about team utilization trends or wants to see who was overloaded/underutilized."
maturity: alpha
audience: [intelligence]
---

# Monday Morning Quarterback — Weekly Consulting Capacity Review

A retrospective view of consulting team performance. Pulls last week's SPP data (and the prior week for trending), compares against utilization targets, and auto-flags risk patterns so leadership can act fast.

## Before You Begin — Read the SPP Query Guide

**CRITICAL**: Read `memory/context/spp-query-guide.md` before making ANY SPP queries. It contains hard-won learnings about date conventions and row limits that will save you from pulling wrong data.

Key reminders:
- `metric_date` uses **Sunday week-start dates** (e.g., the week of Mon Feb 24 – Fri Feb 28 = metric_date `2026-02-22`)
- `spp_search` has a **200-row hard limit** — split queries by team
- **work_capacity**: take MAX per user per week (don't sum)
- **Hour fields**: SUM across rows per user per week

## How It Works

```
User says: "Monday QB" or "how did we do last week"
                    |
    Calculate correct metric_dates
    (last week + prior week for trending)
                    |
    Pull SPP data split by team
    (stay under 200-row limit per query)
                    |
    Aggregate per consultant per week
                    |
    Compare against utilization targets
                    |
    Calculate week-over-week deltas
                    |
    Auto-flag risk patterns
                    |
    Generate report (MD or in-session)
```

## Step 1: Determine the Dates

Today's date determines which weeks to pull. "Last week" means the most recent fully completed work week.

To find the correct `metric_date`:
1. Find last Monday (the Monday of the most recent completed work week)
2. Subtract 2 days to get the Sunday before it — that's the `metric_date` for "last week"
3. Subtract 7 more days for the "prior week" (used for trending)

Example: If today is Monday March 9, 2026:
- Last completed week = March 3–7 → metric_date = `2026-03-01`
- Prior week = Feb 24–28 → metric_date = `2026-02-22`

If today is mid-week (e.g., Wednesday March 5):
- Last completed week = Feb 24–28 → metric_date = `2026-02-22`
- Prior week = Feb 17–21 → metric_date = `2026-02-15`

Use Python `datetime` if needed to compute these accurately. Never hardcode dates.

## Step 2: Pull SPP Data

Query each team separately to avoid the 200-row limit:

```
Teams: East/Midwest, West/Corp, India, Consulting PMO
```

For each team, pull both weeks in one query:
```
spp_search(
  where_clause = "vertical_team = '{team}' AND metric_date IN ('{last_week}', '{prior_week}')",
  select_fields = "user, vertical_team, role, metric_date, work_capacity, funded_billable_hrs, adoption_billable_hrs, investment_billable_hrs, strategic_hrs, admin_hrs, csat_hrs, total_logged_hrs",
  limit = 200
)
```

If any query returns exactly 200 rows, it was truncated. Split into two queries (one per week) or query missing individuals by name.

## Step 3: Aggregate

For each consultant × each week:
- **work_capacity** = MAX across all rows (it repeats per account/project)
- **funded, adoption, investment, strategic, admin, csat, total_logged** = SUM across rows
- **total_billable** = funded + adoption + investment
- **available** = work_capacity − total_logged (negative = overloaded)

## Step 4: Compare Against Targets

| Role Type | Target Billable Util | Status Thresholds |
|-----------|---------------------|-------------------|
| IC / Specialist (TC, BC) | 75–80% | 🟢 ≥75% · 🟡 60–74% · 🔴 <60% |
| Manager (EM) | 60–70% | 🟢 ≥60% · 🟡 45–59% · 🔴 <45% |
| PM | 60–70% | 🟢 ≥60% · 🟡 45–59% · 🔴 <45% |

Client utilization (total logged / capacity) indicates workload regardless of billable mix:
- 🔴 >110% = Overloaded (unsustainable)
- 🟡 100–110% = At capacity
- 🟢 80–99% = Healthy
- ⚪ <80% = Has bandwidth

## Step 5: Calculate Week-over-Week Trends

For each consultant, compute deltas:
- Δ Billable Util = this week's bill_util − prior week's bill_util
- Δ Client Util = this week's client_util − prior week's client_util
- Δ Available = this week's available − prior week's available

Flag significant changes (>10% swing in utilization or >8hr swing in available).

## Step 6: Auto-Flag Risk Patterns

These flags help leadership spot problems before they become crises:

| Flag | Condition | Why It Matters |
|------|-----------|----------------|
| 🔥 **Overloaded** | Client util >110% this week | Burnout risk, quality risk |
| 📉 **Declining Util** | Bill util dropped >15pp week-over-week | Possible bench risk, engagement ending |
| 📊 **High Admin** | Admin >40% of total logged | May indicate between-engagement gaps or overhead |
| ⚠️ **Low Billable** | IC/BC below 60% bill util for 2+ weeks | Underutilization, needs staffing |
| 🔴 **Zero Capacity** | work_capacity = 0 | PTO, leave, or data issue |

## Step 7: Generate the Report

Ask the user their preferred format (in-session, MD file, or document) per CLAUDE.md instructions.

### Report Structure

```markdown
# Monday Morning QB — Week of [Date Range]

**Period:** [Mon–Fri date range]
**vs Prior Week:** [Mon–Fri date range]
**Generated:** [today]

## Team Scorecard

| Team | HC | Bill Util | vs Target | Δ WoW | Client Util | Flags |
|------|---:|----------:|----------:|------:|------------:|-------|

## Flags & Alerts
[List all auto-flagged items grouped by severity]

## Individual Detail by Team

### [Team Name]
| Consultant | Role | Billable | Bill% | Target | Status | Δ WoW | Admin | Client% | Flags |
|-----------|------|--------:|------:|-------:|-------:|------:|------:|--------:|-------|

## Week-over-Week Trend
[Show who improved vs declined most]
```

## Notes

- If the user says "last 2 weeks" or "last month", expand the date range accordingly but always use the same per-team splitting strategy
- The prior week data is for trending only — the primary focus is last week's performance
- When running on an actual Monday morning, "last week" is the week that just ended (Fri)
- This skill works best when paired with the staffing-finder skill for action on bandwidth findings

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: last week actuals vs targets, week-over-week utilization trends, overload/underutilization flags, admin ratio concerns.
