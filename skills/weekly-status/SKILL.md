---
name: weekly-status
tier: 1
description: "Generate weekly status deliverables for active customer engagements — meeting agendas, status emails, meeting minutes, multi-project reports, and steering committee briefs. Trigger with 'weekly status for [account]', 'generate status email for [customer]', 'prep the weekly for [account]', 'meeting minutes for [account]', 'steering committee brief for [account]', or any request to produce recurring engagement status communications."
maturity: alpha
audience: [intelligence]
---

# Weekly Status Agent

The workhorse of the Build phase. Generates all recurring status communications for active customer engagements — from the pre-call agenda to the post-call minutes to the weekly status email. Designed to run every week per active engagement.

## How It Works

```
User says: "weekly status for Consumer Reports"
                    |
         What deliverable(s)?
                    |
    +-------+-------+-------+-------+-------+
    |       |       |       |       |       |
  Agenda  Status   Minutes  Multi-  Steering  Estaff
  (pre)   (end of  (post)   Project Committee (internal)
          week)             Status
    |       |       |       |       |       |
    PMO 02  PMO 04  PMO 03  PMO 05  PMO 07   PMO 10
```

## Triggers

- "weekly status for [account]"
- "generate status email for [customer]"
- "prep the weekly for [account]"
- "meeting minutes for [account]"
- "steering committee brief for [account]"
- "executive summary for [account]"
- "multi-project status for [account]"
- "run the weekly cadence for [account]"

## Deliverable Types

This agent produces **6 different deliverables**, each mapped to a PMO template. The user can request one or let the agent determine which are needed based on timing and context.

| Deliverable | Template | When to Send | Audience |
|-------------|----------|-------------|----------|
| **Meeting Agenda** | PMO 02 | Before weekly call | Customer + internal team |
| **Meeting Minutes** | PMO 03 | After every customer meeting | Customer + internal team |
| **Weekly Status (Single)** | PMO 04 | End of week (1 project) | Customer stakeholders |
| **Weekly Multi-Project Status** | PMO 05 | End of week (2+ projects) | Customer stakeholders |
| **Steering Committee Email** | PMO 07 | Before steering committee | Executive sponsors |
| **Executive Summary (Estaff)** | PMO 10 | Weekly/bi-weekly | Internal leadership only |

### Auto-Selection Logic

If the user just says "weekly status for X" without specifying a deliverable:

```
1. How many active projects?
   → portfolio_lookup → # Active Projects
   → 1 project: use PMO 04 (Single)
   → 2+ projects: use PMO 05 (Multi-Project)

2. Is there a call this week?
   → If yes and it hasn't happened: also generate PMO 02 (Agenda)
   → If yes and it already happened: also generate PMO 03 (Minutes)

3. Is there a steering committee this month?
   → If within next 7 days: also generate PMO 07 (Steering Committee)
```

## Execution Flow

### Step 1: Gather Engagement Context

```
1. portfolio_lookup(account_name, fields="identity,services,team,health,adoption")
   → Active projects, hours, CSM, engagement stage

2. hggrades_lookup(account_id)
   → Health dimensions for progress narrative
   → 30d trends = "what improved this week"

3. calls_lookup(account_name, limit=3)
   → Recent calls for meeting minutes / context
   → Commitments from last call = agenda items for next

4. actions_lookup(account_name)
   → Active signals to reference in risks section
   → Recommended plays = upcoming priorities

5. asana [if connected]
   → Task completion this week
   → Milestones hit/missed
   → Blockers and assignees
   → Hours logged
```

### Step 2: Determine Deliverables

Based on auto-selection logic above, determine which templates to produce.

### Step 3: Generate Each Deliverable

---

## Output Templates

### PMO 02 — Meeting Agenda (Pre-Call)

```markdown
Subject: [Account Name] — Weekly Call Agenda — [Date]

Hi [Customer Contact],

Here's the proposed agenda for our call on [Day, Date, Time]:

**1. Progress & Outcomes (10 min)**
- [Accomplishment 1 from this week — quantifiable if possible]
- [Accomplishment 2]
- [Milestone update if relevant]

**2. Upcoming Priorities (10 min)**
- [Next step 1 — who owns it, target date]
- [Next step 2]
- [Next step 3]

**3. Value & Alignment (5 min)**
- [How current work connects to stated business objectives]
- [Health score improvement if applicable]
- [Any alignment items to confirm]

**4. Open Items / Parking Lot (5 min)**
- [Carry-forward from last call]
- [Any blockers requiring customer input]

Please let me know if you'd like to add or adjust anything.

Best,
[PMO / Consultant Name]
```

### PMO 03 — Meeting Minutes (Post-Call)

```markdown
Subject: [Account Name] — Meeting Minutes — [Date]

Hi [Attendees],

Thank you for today's meeting. Here's a summary of what we covered:

**Attendees:** [List]
**Duration:** [X] minutes

**Key Topics Discussed:**
1. [Topic 1 — summary of discussion and decisions]
2. [Topic 2]
3. [Topic 3]

**Action Items:**

| # | Action Item | Owner | Deadline |
|---|-------------|-------|----------|
| 1 | [Action] | [Person] | [Date] |
| 2 | [Action] | [Person] | [Date] |
| 3 | [Action] | [Person] | [Date] |

**Clarifications Needed:**
- [Any items requiring follow-up or further input]

**Next Meeting:** [Day, Date, Time]

Please let me know if I've missed anything or if any corrections are needed.

Best,
[PMO / Consultant Name]
```

### PMO 04 — Weekly Project Summary (Single Use Case)

```markdown
Subject: [Account Name] — Weekly Project Summary — Week of [Date]

**Project:** [Project Name]
**Status:** [🟢 On Track / 🟡 At Risk / 🔴 Blocked]

---

**Project Health:**
| Metric | Status |
|--------|--------|
| Scope | [On Track / At Risk] |
| Timeline | [On Track / At Risk] |
| Hours | [X] consumed of [Y] purchased ([Z]% consumed) |
| Velocity | [X] hours/week average |

**Recent Accomplishments (this week):**
1. [Accomplishment 1 — quantifiable: "Built 3 dashboards covering X use case"]
2. [Accomplishment 2 — measurable: "Trained 12 users on dataflow management"]
3. [Accomplishment 3]

**Next Steps (upcoming week):**
1. [Step 1 — owner — target date]
2. [Step 2]
3. [Step 3]

**Risks & Mitigation:**
| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| [Risk] | [H/M/L] | [Plan] | [Person] |

**Education & Training:**
- [Training activity or recommendation]
- [Certification progress if applicable]

Best,
[PMO / Consultant Name]
```

### PMO 05 — Weekly Multi-Project Status

```markdown
Subject: [Account Name] — Multi-Project Status — Week of [Date]

**Active Engagements:** [N]

---

| Project | Hours Purchased | Hours Consumed | Hours Remaining | % Consumed | Status | Phase |
|---------|----------------|----------------|-----------------|------------|--------|-------|
| [Project 1] | [X] | [X] | [X] | [X%] | [🟢/🟡/🔴] | [Phase] |
| [Project 2] | [X] | [X] | [X] | [X%] | [🟢/🟡/🔴] | [Phase] |

---

**[Project 1]: [Project Name]**

*Accomplishments:*
1. [Accomplishment]
2. [Accomplishment]

*Next Steps:*
1. [Step — owner — date]

---

**[Project 2]: [Project Name]**

*Accomplishments:*
1. [Accomplishment]
2. [Accomplishment]

*Next Steps:*
1. [Step — owner — date]

---

**Cross-Project Risks:**
| Risk | Projects Affected | Impact | Mitigation |
|------|-------------------|--------|------------|
| [Risk] | [Which projects] | [H/M/L] | [Plan] |

Best,
[PMO / Consultant Name]
```

### PMO 07 — Steering Committee Email

```markdown
Subject: [Account Name] — Steering Committee Update — [Date]

Dear [Executive Sponsor(s)],

Please find below the executive status update ahead of our steering committee meeting.

---

**1. Progress & Outcomes**
- [Major milestone achieved]
- [Business value delivered — quantified if possible]
- [Health improvement: "Health grade improved from C to B over 90 days"]

**2. Upcoming Priorities**
- [Strategic initiative 1 — timeline — expected outcome]
- [Strategic initiative 2]
- [Key decision point requiring steering committee input]

**3. Value & Alignment**
- [How current work maps to stated strategic objectives]
- [ROI or value metrics if available]
- [Adoption metrics: users, use cases, platform utilization]

**4. Leadership Input Requested**
- [Decision 1 needing executive direction]
- [Resource or priority alignment needed]

---

We look forward to discussing these items in our steering committee session.

Best,
[PMO / Consultant Name]
```

### PMO 10 — Executive Summary (Internal / Estaff)

```markdown
Subject: [Account Name] — Executive Summary — [Date]

**INTERNAL — NOT CUSTOMER FACING**

---

**Immediate Focus:**

*Delivery Momentum:*
- [Current delivery velocity and trend]
- [Key milestones: upcoming, hit, or missed]

*Scope Discipline:*
- [Hours: consumed vs remaining vs burn rate]
- [Any scope creep indicators]
- [Change request status if applicable]

*Adoption Readiness:*
- [Is the customer ready to adopt what we're building?]
- [Training/enablement status]
- [User engagement signals from HG Grades]

**Why This Matters:**

*Growth Rationale:*
- [Renewal: $[ARR], renews [date], forecast at [X]%]
- [Upsell pipeline: [N] opportunities, $[value]]
- [Strategic importance of this account]

**Status & Outlook:**

*Risk Assessment:*
- [Overall risk level: Low/Medium/High/Critical]
- [Top risk and mitigation]

*Near-Term Outlook:*
- [What happens in the next 2 weeks]
- [Go/no-go decisions pending]
- [Resource needs]

---

**Prepared by:** Compass Weekly Status Agent
**Distribution:** Internal leadership only
```

---

## Weekly Cadence

The ideal weekly rhythm for an active engagement:

```
Monday:    Review health scores + signals (Account 360 or portfolio_summary)
Tuesday:   Generate PMO 02 Agenda → send to customer
Wednesday: Customer weekly call
Wednesday: Generate PMO 03 Minutes → send same day
Thursday:  Generate PMO 04/05 Status → send end of day
Friday:    Generate PMO 10 Estaff → send to leadership (if needed)

Monthly:   Generate PMO 07 Steering Committee → send before steering committee
```

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account**, **engagement-working**, and **engagement-observations**, intent: weekly status / PMO deliverables.

### After executing
- Call `memory_store_artifact` for **WeeklyStatusDoc**, **MeetingMinutes**, and **MeetingAgenda** as produced; `memory_remember` for **engagement-working** status observations; use `engagement_state_update` if engagement phase or risk posture changed.

---

## Guardrails

- **Quantify accomplishments.** "Built dashboards" is weak. "Built 3 dashboards covering credit consumption, user adoption, and executive KPIs" is strong.
- **Never send PMO 10 to customers.** It's internal only. Always flag this.
- **Carry forward action items.** If an action item from last week's minutes isn't complete, it must appear in this week's agenda.
- **Hours accuracy is critical.** If SPP data isn't available, ask the user for hours consumed/remaining. Don't guess.
- **Match the template structure.** These templates were designed by the PMO team. Follow their section order and naming.
- **Three accomplishments minimum.** Every weekly status should have at least 3 accomplishments. If you can't find 3 from the data, ask the user.
- **Flag overdue milestones.** If Asana shows missed deadlines, surface them in the status — don't hide them.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| portfolio_lookup | **Yes** | Account context, projects, hours, team |
| hggrades_lookup | Recommended | Health trends for progress narrative |
| calls_lookup | **Yes** (for minutes) | Call recap, attendees, sentiment |
| actions_lookup | Recommended | Signals for risk section |
| spp_lookup | Recommended | Hours by category, engagement detail |
| asana | Recommended | Task/milestone status, blockers |

### Manual Mode

If MCP isn't connected, the user provides:
1. What was accomplished this week (3+ items)
2. What's planned for next week
3. Hours consumed / remaining
4. Any risks or blockers
5. Attendee list and key discussion points (for minutes)

The agent structures it into the correct template format.

---

## Template Requirements

**All deliverables MUST use the corresponding PMO template from the Template Registry.** Do not freestyle the format.

| Deliverable | Template File |
|-------------|---------------|
| Meeting Agenda | `_TEMPLATES/_PMO Templates (current)/02[Template] Proposed Agenda - Weekly Calls.docx` |
| Meeting Minutes | `_TEMPLATES/_PMO Templates (current)/03[Template] Meeting Minutes email - post call.docx` |
| Weekly Status (Single) | `_TEMPLATES/_PMO Templates (current)/04[Template] Weekly Project Summary Email - Single Use Case.docx` |
| Multi-Project Status | `_TEMPLATES/_PMO Templates (current)/05[Template] Weekly Multi-Project Status and Hours Report.docx` |
| Steering Committee | `_TEMPLATES/_PMO Templates (current)/07[Template] Steering Committee email.docx` |
| Executive Summary | `_TEMPLATES/_PMO Templates (current)/10[Template] Executive Summary Estaff.docx` |

---

## Related Skills

- **Call Prep** (Align) — Use before the weekly call for deeper prep
- **Delivery Risk Radar** (Build) — Surfaces delivery risks across multiple engagements
- **Account 360** (Discover) — Full account context when needed
- **Template Registry** (Global) — Template selection and brand standards
- **Adoption Acceleration** (Adopt) — When status reveals adoption gaps
