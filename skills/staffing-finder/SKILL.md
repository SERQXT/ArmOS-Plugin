---
name: staffing-finder
tier: 1
description: "Find consultants with capacity to staff a new engagement. Given engagement size (hours), type (custom/adoption/investment), and timeline, calculates the weekly commitment needed and matches against actual consultant availability from SPP data. Trigger on 'who can take this engagement', 'staff this project', 'staffing finder', 'who has bandwidth', 'find capacity for', 'can we staff a [X] hour engagement', 'who's available for a new project', 'capacity to take on', 'engagement staffing', or any request to match consultant availability to a new engagement or project. Also trigger when the user gives an engagement size in hours and asks who can do it."
maturity: alpha
audience: [delivery]
---

# Staffing Finder — Engagement-to-Consultant Matching

Takes an engagement description (hours, type, timeline) and finds consultants with the capacity to take it on, based on recent actual SPP data rather than guesswork.

## Before You Begin — Read the SPP Query Guide

**CRITICAL**: Read `memory/context/spp-query-guide.md` before making ANY SPP queries. It contains the date conventions and row limits that prevent data errors.

## How It Works

```
User says: "Can we staff a 150hr custom consulting engagement over 12 weeks?"
                    |
    Parse engagement parameters
    (hours, type, timeline, preferences)
                    |
    Calculate weekly hour commitment
    (150 hrs ÷ 12 weeks = 12.5 hrs/wk)
                    |
    Pull recent SPP data (last 4 weeks)
    to establish each consultant's actual availability pattern
                    |
    Score each consultant on fit:
    - Do they have the weekly bandwidth?
    - Is their availability consistent or spiky?
    - Does the engagement type match their current mix?
    - Are they already trending toward overload?
                    |
    Rank and present staffing options
    (best fits, possible fits, not available)
```

## Step 1: Gather Engagement Parameters

Ask for (or extract from the user's message) these inputs:

| Parameter | Required | Example | Default |
|-----------|----------|---------|---------|
| **Total hours** | Yes | 150 hrs | — |
| **Engagement type** | Yes | Custom (funded), Adoption, Investment | funded |
| **Timeline** | Yes | 12 weeks | — |
| **Team preference** | No | "West/Corp only" | All teams |
| **Role preference** | No | "Need a BC" | All roles |
| **Start date** | No | "Starting April" | Next available |

Calculate the **weekly commitment** = total hours ÷ timeline weeks.

Sanity check: if weekly commitment >30 hrs, warn that this is essentially a full-time engagement. If >40 hrs, flag as requiring multiple consultants.

## Step 2: Pull Recent Availability Data

Pull the last 4 completed weeks of SPP data to establish a reliable availability pattern. A single week can be noisy (PTO, holidays), so 4 weeks gives a better picture.

Use the same splitting strategy from the SPP query guide:
- Query each team separately
- Split into 2-week windows if needed
- Verify no truncation at 200 rows

Calculate the four Saturday metric_dates for the last 4 completed weeks using Python datetime.

## Step 3: Compute Consultant Availability Profiles

For each consultant, calculate:

### Availability Metrics
- **Avg Weekly Available** = mean of (work_capacity − total_logged) across 4 weeks
- **Min Weekly Available** = worst week's availability (shows floor)
- **Max Weekly Available** = best week's availability (shows ceiling)
- **Availability Consistency** = stddev of weekly available hours
  - Low stddev (<5 hrs) = Consistent, reliable capacity
  - High stddev (>10 hrs) = Spiky, less predictable

### Current Load Profile
- **Avg Billable Util** = mean billable util across 4 weeks
- **Avg Client Util** = mean client util across 4 weeks
- **Trend Direction** = is utilization going up or down over the 4 weeks?
  - Compare weeks 3-4 avg to weeks 1-2 avg

### Engagement Type Fit
- If engagement is **funded/custom**: Check what % of their current billable is funded
- If engagement is **adoption**: Check if they have adoption hours currently
- If engagement is **investment**: Check their investment hours mix

## Step 4: Score and Rank Consultants

### Scoring Formula

Each consultant gets a **fit score** (0–100) based on:

| Factor | Weight | Logic |
|--------|--------|-------|
| **Has bandwidth** | 40% | avg_weekly_available ≥ weekly_commitment → full points. Partial credit if within 5 hrs. |
| **Consistency** | 20% | Low stddev in availability → more points. Spiky = risky for a long engagement. |
| **Won't overload** | 20% | Projected client util with new engagement stays <100% → full points. 100–110% → half. >110% → zero. |
| **Type alignment** | 10% | Already doing this type of work → bonus. Shows familiarity with the billing model. |
| **Trend compatible** | 10% | Utilization trending down (freeing up) → bonus. Trending up (filling up) → penalty. |

### Projected Utilization

For each candidate, calculate what their utilization would look like WITH the new engagement:
- **Projected weekly logged** = current avg weekly logged + weekly_commitment
- **Projected client util** = projected weekly logged / avg work_capacity × 100
- **Projected billable util** = (current avg weekly billable + weekly_commitment) / avg work_capacity × 100

### Categorize Results

- **Best Fit** (score ≥ 70): Can comfortably absorb this engagement
- **Possible Fit** (score 40–69): Could work but with tradeoffs (may need to offload something, or engagement would push them to capacity)
- **Not Available** (score < 40): Already at or over capacity

## Step 5: Consider Multi-Consultant Options

If no single consultant can absorb the full weekly commitment:

1. **Split engagement**: Find 2 consultants who together have enough bandwidth
   - Example: 12.5 hrs/wk needed → Consultant A has 8 hrs/wk + Consultant B has 6 hrs/wk
   - Flag the coordination overhead tradeoff

2. **Phased approach**: If some consultants are freeing up in 2–4 weeks (declining util trend), suggest a delayed start or phased ramp

## Step 6: Generate the Report

Ask the user their preferred format per CLAUDE.md instructions.

### Report Structure

```markdown
# Staffing Finder — [Engagement Description]

**Engagement:** [Total hours] hrs [type] over [timeline] weeks
**Weekly Commitment:** [X] hrs/wk
**Team Scope:** [All or specific]
**Based on:** Last 4 weeks of SPP data ([date range])

## Engagement Summary
[Quick restatement of what we're staffing for]

## Best Fit Candidates

| Rank | Consultant | Team | Role | Avg Wkly Avail | Projected Bill% | Projected Client% | Score | Notes |
|-----:|-----------|------|------|---------------:|----------------:|------------------:|------:|-------|

## Possible Fit (with tradeoffs)

| Consultant | Team | Role | Avg Wkly Avail | Gap | Tradeoff | Score |
|-----------|------|------|---------------:|----:|----------|------:|

## Multi-Consultant Options
[If no single person can do it, suggest pairs]

## Not Available
[List with brief reason: overloaded, PTO pattern, already declining, etc.]

## Recommendation
[1-2 sentence recommendation on best staffing approach]
```

---

## Memory

### Before executing
- Call `memory_recall` for **account** and **engagement-artifacts** (SOW), intent: staffing / capacity match.

### After executing
- Call `memory_store_artifact` for **StaffingRecommendation**; `memory_remember` with ranked options and utilization notes.

## Edge Cases

- **Zero available consultants**: Recommend flagging to leadership, consider contractor augmentation or timeline extension
- **User asks about a specific person**: Pull just that person's data and assess fit directly
- **Engagement is very small (<20 hrs)**: Note that the overhead of staffing may not justify formal matching — suggest whoever has the most bandwidth
- **Engagement is very large (>300 hrs)**: Likely needs a dedicated team, not just one person — shift to team composition recommendations

## Combining with Monday QB

The Monday QB skill provides the retrospective ("how did we do"). This skill provides the forward-looking answer ("who should do the next thing"). They work well together:

1. Run Monday QB to see current state
2. User identifies an engagement to staff
3. Run Staffing Finder using the same data foundation

The SPP query guide ensures both skills pull data the same way with consistent, validated results.
