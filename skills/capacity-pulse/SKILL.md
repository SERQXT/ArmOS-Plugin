---
name: capacity-pulse
tier: 1
description: "PS Capacity Planning, Utilization Forecasting, and Assignment Intelligence. The command center for understanding consultant workload, identifying capacity gaps, and making smart staffing decisions. Use this skill whenever anyone asks about capacity, utilization, staffing, assignments, bench, workload, who's available, who's burning hot, who can take a project, resource planning, consultant pacing, billable hours, or team throughput. Also trigger on 'capacity plan', 'capacity pulse', 'who has room', 'assignment recommendations', 'staffing plan', 'workload check', 'utilization report', 'bench report', or 'Monday briefing'. This skill should be used proactively whenever the conversation involves consultant staffing decisions, even if the user doesn't explicitly ask for a 'capacity' report."
maturity: alpha
audience: [intelligence]
---

# Capacity Pulse — PS Workforce Intelligence

This skill transforms raw SPP time-tracking data and the Asana Assignment Board into actionable staffing decisions. It answers three questions: **How are we doing?** (utilization pulse), **What's coming?** (forward projection), and **Who should do the work?** (assignment matching).

## Data Sources & How They Connect

```
SPP Time Tracking ──────┐
  (who billed what)      │
                         ├──→ CAPACITY PULSE ──→ Recommendations
SPP Project Assignments ─┤      (this skill)       & Briefing
  (who's on what project)│
                         │
Asana Assignment Board ──┤
  (what needs staffing)  │
  Project GID: 1206137355464902
                         │
Compass Portfolio ───────┘
  (account context: ARR, health, renewal)
```

## Core Metrics & Calculations

These calculations are the foundation. Get them right every time.

### Work Capacity
`work_capacity` reflects actual available hours for a given week, already adjusted for PTO and company holidays. If someone shows 32 hours instead of 40, they had a day off. Use the value as-is. **Critical**: work_capacity repeats across rows for the same person in the same week (one row per project). Never sum it — use a single value per consultant per week.

### Client Utilization
```
Client Utilization = SUM(total_logged_hrs) / work_capacity
```
This captures ALL productive time — billable, strategic, admin, everything. The target is **85%** for client-based activities.

### Billable Utilization
```
Billable Utilization = SUM(funded_billable_hrs + adoption_billable_hrs + investment_billable_hrs) / work_capacity
```
This captures revenue-generating time only. It's a subset of client utilization.

### Per-Bucket Pacing (Delta Analysis)
Each consultant has weekly targets for each time bucket:

| Bucket | Actual Field | Target Field | What It Means |
|--------|-------------|-------------|---------------|
| Funded Billable | `funded_billable_hrs` | `target_wkly_funded_billable_hrs` | Non-recurring revenue work — the money engine |
| Adoption Billable | `adoption_billable_hrs` | `target_wkly_adoption_billable_hrs` | Adoption consulting — drives retention |
| Investment Billable | `investment_billable_hrs` | `target_wkly_investment_billable_hrs` | Strategic investment — $0 oppty, building relationships |
| Strategic | `strategic_hrs` | `target_wkly_strategic_hrs` | Internal strategic initiatives |
| Admin | `admin_hrs` | `target_wkly_admin_hrs` | Overhead — keep this tight |

**Delta = Actual - Target.** Positive means over-pacing, negative means under-pacing.

The delta view is where the real insight lives. Someone at 90% billable looks great on the surface, but if it's all adoption hours and zero funded billable, the NRR throughput is suffering. Always decompose.

## How to Run a Capacity Pulse

### Step 1: Pull the Supply Side (Consultant Data)

Use `spp_search` to get the most recent weeks of data. Pull at least 4 weeks for trend analysis:

```
spp_search:
  where_clause: metric_date >= '<4 weeks ago YYYY-MM-DD>'
  select_fields: account_name, project_id, project_name, user, role, vertical_team, adoption_segment, metric_date, funded_billable_hrs, adoption_billable_hrs, investment_billable_hrs, strategic_hrs, admin_hrs, total_logged_hrs, work_capacity, target_wkly_funded_billable_hrs, target_wkly_adoption_billable_hrs, target_wkly_investment_billable_hrs, target_wkly_strategic_hrs, target_wkly_admin_hrs, project_hours_purchased, project_hours_remaining, billable_hrs_consumed
  order_by: metric_date DESC, user ASC
  limit: 200
```

If you hit the 200-row limit, run additional queries filtering by `vertical_team` or `role` to ensure complete coverage.

### Step 2: Aggregate Per Consultant Per Week

For each consultant, for each week:
1. **SUM** all hour buckets across their project rows (funded_billable, adoption_billable, investment_billable, strategic, admin, total_logged)
2. **DO NOT SUM** work_capacity — take the single value
3. Calculate client_utilization, billable_utilization, and per-bucket deltas against targets
4. Collect the list of accounts they billed to (useful for skill profiling later)

### Step 3: Classify Each Consultant

Based on the **most recent complete week** (the current partial week may be misleading if it's early in the week — use judgment):

| Status | Criteria | What It Means |
|--------|----------|---------------|
| 🔴 Burning Hot | Client util > 95% OR billable util > 95% for 2+ consecutive weeks | Burnout risk, timeline slip risk, no room for new work |
| 🟡 At Capacity | Client util 80-95% AND bucket deltas within ±20% of targets | Healthy, on-pace, minimal room for additional work |
| 🟢 Available | Client util < 75% OR billable util < 70% | Has room for a new engagement |
| ⚪ Bench | Client util < 30% AND no active projects ending soon | Needs assignment urgently |
| ⚠️ Imbalanced | Overall util looks fine but bucket deltas show major skew | Example: 90% billable but ALL in adoption, zero funded. Needs rebalancing |

**Important context for the current week**: If today is Monday or Tuesday, the current week's data will look artificially low because people haven't logged yet. Always note this and lean on the prior week for classification. By Wednesday/Thursday the current week data becomes more reliable.

### Step 4: Pull the Demand Side (Assignment Board)

Use Asana to get incomplete tasks from the Assignment Board:

```
get_tasks:
  project: 1206137355464902
  opt_fields: name,assignee,assignee.name,due_on,completed,notes,custom_fields,custom_fields.name,custom_fields.display_value,memberships.section,memberships.section.name
  limit: 100
```

Focus on tasks in these sections (the pipeline stages):
- **Project Identified** — earliest stage, needs scoping and staffing decisions
- **SOW/SO Signed** — committed, needs staffing now
- **Internal Handoff** — ready to be handed to the delivery team
- **Customer Kickoff** — should already be staffed, flag if BC/TC fields are empty

Key custom fields on each task:
- `Tier` — Tier 1 (large/complex), Tier 2 (medium), Tier 3 (small/kickstarter)
- `BC` — Assigned Business Consultant(s)
- `TC` — Assigned Technical Consultant(s)
- `SME/Squad Captain` — Specialist assigned
- `CS Owner` — Customer Success owner (for context)
- `Business` — Enterprise vs Corporate segment
- `Pending Action` — current blocker or next step

Engagements where BC or TC fields are **empty** are your staffing opportunities.

### Step 5: Enrich with Account Context (Optional but Valuable)

For unassigned or high-priority engagements, pull Compass data:

```
portfolio_summary:
  account_name: <account from the assignment board>
```

This gives you ARR, health grade, renewal date, and risk signals. A $2M ARR account with an F health grade and renewal in 60 days should get your best available consultant — not just whoever has room.

### Step 6: Match and Recommend

For each unassigned engagement, evaluate candidates across three dimensions:

**1. Capacity Fit** (weight: 40%)
- Does the consultant have room? Look at projected utilization for the next 4 weeks.
- Factor in project end dates from `project_hours_remaining` — if someone has 10 hours left on their current project, they're about to free up.

**2. Skill Fit** (weight: 35%)
- Look at the consultant's recent project history from SPP — what accounts and engagement types have they worked on?
- Use `spp_project_assignments_search` to get richer detail on their project history if needed.
- Match against the engagement requirements (is it Embed work? Data Science? Standard dashboard build?)

**3. Balance & Development** (weight: 25%)
- Is this consultant's bucket mix healthy? If they're heavy on adoption and light on funded, recommending a funded engagement helps rebalance.
- Role-type match: Is this a TC-heavy project? BC-heavy? Match the engagement's needs.
- Team distribution: Don't overload one vertical team if another has capacity.
- Development interests: If you have consultant preference data (check `memory/consultant-profiles.md` if it exists), factor in what people want to work on.

### Step 6b: Burn Rate Projection (Forward Look Engine)

This is how you predict when consultants will free up — and when capacity cliffs are coming.

**The only reliable "end date" is the hub_hours_expiration_date.** But the real end date is a function of burn rate.

#### Calculating Burn Rate Per Project

Pull project-level data for each active consultant:

```
spp_search:
  where_clause: user = '<consultant name>' AND metric_date >= '<8 weeks ago>'
  select_fields: user, account_name, project_id, project_name, metric_date, funded_billable_hrs, adoption_billable_hrs, investment_billable_hrs, total_logged_hrs, project_hours_purchased, project_hours_remaining, hub_hours_expiration_date
  order_by: metric_date DESC
  limit: 100
```

For each project the consultant is on:

```
Weekly Burn Rate = SUM(billable hours on that project over N weeks) / N weeks
Projected Weeks Remaining = project_hours_remaining / weekly_burn_rate
Projected End Date = today + (projected_weeks_remaining * 7 days)
```

**Important nuances:**

- Use at least 4 weeks of data for burn rate to smooth out spiky weeks (holidays, PTO, context-switching). If only 2-3 weeks are available, note the lower confidence.
- If burn rate is 0 for 2+ consecutive weeks but hours_remaining > 0, the project may be stalled — flag it as "Stalled/Paused" rather than projecting an infinite timeline.
- If burn rate exceeds the original weekly pace (burning faster than planned), flag it — the engagement may end early, which is a capacity planning opportunity, but it could also signal scope issues.
- Compare the projected end date against `hub_hours_expiration_date` if available. If the burn rate projects completion AFTER the expiration date, that's a risk — the hours may expire before the work is done. If it projects completion well BEFORE expiration, there may be unused capacity that could be redeployed.

#### Projecting Consultant Availability

Once you have projected end dates for each of a consultant's active projects:

```
For each consultant:
  - List their active projects with projected end dates
  - Calculate projected utilization at 30, 60, 90 days:
    - Which projects will still be active?
    - What's the expected weekly hour load from remaining projects?
    - Projected utilization = remaining project hours per week / work_capacity
  - Flag transitions:
    - "Sarah drops from 85% to 35% in 3 weeks when Acme Corp ends"
    - "Marcus goes to bench in 6 weeks — both projects ending"
    - "Jeff's project is burning 2x rate — frees up 4 weeks earlier than planned"
```

#### Capacity Cliff Detection

A capacity cliff is when multiple consultants lose projects in the same window:

```
For each 2-week window in the next 90 days:
  Count how many consultants have projects ending
  If >= 3 endings in same window: FLAG as capacity cliff
  If bench count would exceed 20% of team: FLAG as critical
```

Conversely, look for capacity crunches — when new engagements from the Assignment Board land at the same time and there aren't enough available consultants to staff them.

#### Burn Rate Anomalies Worth Surfacing

- **Runaway burn**: Actual weekly burn > 1.5x the expected rate (hours_purchased / planned_weeks). The engagement is ahead of schedule or scope is creeping.
- **Stall**: Zero burn for 2+ weeks with hours remaining. Is the customer unresponsive? Is the consultant blocked?
- **Expiration risk**: Projected completion date > hub_hours_expiration_date. Hours will expire unused.
- **Ghost allocation**: Consultant is assigned to a project but logging 0 hours to it while logging heavy hours elsewhere. They've effectively moved on but the allocation hasn't been updated.

### Step 7: Generate the Briefing

Structure the output depending on what was asked. For a full capacity pulse / Monday briefing:

**Section 1: Team Snapshot**
- Total headcount by role (TC, BC, EM, PM) and team
- Average client utilization and billable utilization this week vs target
- Trend: are we improving, declining, or flat vs. last week?

**Section 2: Individual Consultant Status**
- Organized by status (Burning Hot → At Capacity → Available → Bench → Imbalanced)
- For each: name, role, team, client util%, billable util%, and the key bucket delta that tells the story
- Flag anyone who's been burning hot 3+ weeks straight

**Section 3: Revenue Throughput Check**
- Total funded billable hours logged this week vs. total target across team
- Total adoption billable hours logged vs. target
- This is the "is the business engine running?" check

**Section 4: Role Mix Analysis**
- TC average utilization vs BC average utilization
- If one role is consistently overtaxed, flag it as a hiring signal

**Section 5: Demand Pipeline**
- Unassigned or partially-staffed engagements from the Assignment Board
- For each: account name, estimated hours, tier, what roles are needed, priority based on Compass context

**Section 6: Assignment Recommendations**
- For each open engagement, recommend 1-3 candidates with reasoning
- Call out any conflicts (e.g., "Jeff is the best skill match but he's at 95%, consider Steve as alternative")

**Section 7: Forward Look (30/60/90 day) — Burn Rate Driven**
- For each consultant with active projects, show projected end dates based on burn rate (hours_remaining / avg_weekly_burn)
- Projects projected to end within 30 days → who's freeing up soon? What's their projected utilization drop?
- Projects projected to end in 30-60 days → capacity pipeline coming
- Capacity cliff detection → are 3+ consultants losing projects in the same 2-week window?
- Burn rate anomalies → flag runaway burns (>1.5x pace), stalled projects (0 burn 2+ weeks), expiration risks (projected end > hub expiration)
- Demand pipeline from Assignment Board → what's landing when, and does supply meet demand?
- Net capacity forecast → expected available hours across team at 30/60/90 days

## Handling Specific Questions

Users won't always ask for a full briefing. Here's how to handle common requests:

**"Who has room for a project?"** → Run Steps 1-3, filter to Available and Bench, present with context about WHAT kind of room they have (bucket-wise).

**"Is [consultant] overloaded?"** → Pull their last 4 weeks, show the trend, decompose by bucket. Don't just say yes/no — show why.

**"What's our utilization?"** → Team-level aggregation: average client util and billable util by role and team. Include the revenue throughput check.

**"Assign [engagement] to someone"** → Run the full matching logic (Step 6) for that specific engagement. Present candidates ranked with reasoning.

**"Compare TCs vs BCs"** → Role mix analysis with averages, ranges, and specific outliers in both directions.

**"What's our funded billable throughput?"** → Sum funded_billable_hrs across all consultants for the week, compare to sum of all targets. Show the delta and who's contributing vs. who's short.

**"When does [consultant]'s project end?"** → Pull their project-level SPP data, calculate burn rate, and project end date. Compare against hub_hours_expiration_date if available.

**"Who's freeing up soon?"** → Run burn rate projection for all consultants with active projects. Show everyone whose projects are projected to end within 30 days, ranked by how much capacity they'll release.

**"Are any projects at risk of expiring?"** → Compare projected end dates against hub_hours_expiration_date. Flag any where projected completion is AFTER expiration.

**"What does our capacity look like in 60 days?"** → Run full forward projection: subtract projects that will have ended by then, add pipeline from Assignment Board, show net available capacity by role and team.

**"Is [project] burning too fast?"** → Calculate weekly burn rate vs expected rate (hours_purchased / planned duration). Flag if >1.5x. Show remaining weeks at current pace.

**"Who can work on AI / Embed / [specific skill]?"** → Search SPP project assignments for consultants who've worked on similar projects. Cross-reference with capacity. Also check `memory/consultant-profiles.md` for stated interests.

## Output Format Options

Per the user's CLAUDE.md preferences, when generating a capacity report, prompt the user:

1. **Right here in the session** — Summary with key callouts, formatted for conversation
2. **Word document (.docx)** — Full formatted report using the brand template
3. **Markdown (.md)** — Clean markdown file saved to _Cowork

For scheduled/automated runs, default to option 1 (in-session) with the full briefing structure.

## Fiscal Calendar Reference

Domo's fiscal year starts February 1, offset +1 from calendar year:
- Q1: Feb 1 – Apr 30
- Q2: May 1 – Jul 31
- Q3: Aug 1 – Oct 31
- Q4: Nov 1 – Jan 31

March 2026 = FY27 Q1. Always use this convention when referencing quarters.

## Tips for Getting This Right

- **Partial week awareness**: If running on Monday/Tuesday, the current week's data is incomplete. Say so explicitly and base classifications on the prior complete week.
- **Holiday weeks**: If work_capacity drops below 40 for many people simultaneously, it's likely a company holiday. Note it — utilization percentages during holiday weeks aren't comparable to normal weeks.
- **Zero-logging weeks**: A consultant showing 0 hours for a week could be PTO, could be a data lag, could be a problem. Check work_capacity — if it's 0, they were out. If it's 40 and they logged 0, that's a flag.
- **The "looks fine but isn't" pattern**: Always decompose. The Jenna example — 90% billable looks great, but 100% adoption and 0% funded means revenue throughput is down. The bucket delta view catches this every time.
- **Admin hours creep**: If someone's admin hours consistently exceed their target, they're getting pulled into non-client work. That's an efficiency leak.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and portfolio signals.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["account"]}`, content: consultant utilization rates, capacity gaps identified, assignment recommendations, bench status, overload alerts.
