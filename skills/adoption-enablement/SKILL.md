---
name: adoption-enablement
tier: 1
description: "Generate an enablement plan for transitioning a customer from build to adoption — champion identification, role-based training curricula, go-live schedule, and ongoing support structure. Trigger with 'enablement plan for [account]', 'training plan for [customer]', 'go-live plan for [account]', 'prepare [account] for adoption', 'enable [account]', or any request to plan the adoption and training phase of an engagement."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: adopt
  sub_phase: enablement
  position: 2
  output_type: output
  wave: 2
  state: planned
  inputs:
    - agent: weekly-status
      required: false
      data: delivery status, milestones completed
    - agent: kickoff-brief
      required: false
      data: success criteria, customer team
  outputs:
    - name: enablement-plan
      format: markdown
      downstream:
        - agent: adoption-acceleration
        - agent: adoption-radar
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: hggrades_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: spp_lookup
      required: false
  phase_gate: false
---

# Adoption Enablement Agent — Training & Go-Live Planning

Generates the enablement plan that bridges Build and sustained Adoption. Identifies champions, designs role-based training curricula, creates a go-live schedule, and establishes the ongoing support structure that ensures what was built gets used.

## How It Works

```
Build Complete / Nearing Completion
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Champion  Role-   Go-Live Training  Support
  ID        Based   Schedule Materials Structure
            Curricula
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Assemble Enablement Plan
                    |
         🔵 OUTPUT: Enablement Plan
                    |
    → Adoption Acceleration + Adoption Radar (downstream)
```

## Triggers

- "enablement plan for [account]"
- "training plan for [customer]"
- "go-live plan for [account]"
- "prepare [account] for adoption"
- "enable [account]"
- "who should we train at [account]"
- "adoption readiness for [account]"
- "launch plan for [account]"

## Execution Flow

### Step 1: Assess Adoption Readiness

```
1. portfolio_lookup(account_name, fields="all")
   → User count, MAU, power users — current adoption baseline
   → Products owned — what features can we train on?

2. hggrades_lookup(account_id)
   → User Engagement scores — who's using the platform?
   → Education scores — certification and community participation
   → Content Creation scores — is content ready for users?
   → Platform Utilization — which features are adopted?

3. calls_lookup(account_name, limit=3)
   → Has adoption been discussed? What are customer expectations?
   → Any concerns about user adoption mentioned?

4. Build phase outputs (if available)
   → What was built: dashboards, dataflows, apps
   → Success criteria from Kickoff Brief
```

### Step 2: Identify Champions

Champions are the internal customer advocates who will drive adoption after PS disengages.

**Champion Identification Framework:**

| Champion Type | Characteristics | Where to Find | Why They Matter |
|---------------|----------------|---------------|-----------------|
| **Executive Champion** | C-suite or VP who sponsors the platform | Portfolio (exec contacts), Calls (attendees) | Sets top-down adoption mandate |
| **Power User Champion** | Builds content, trains others, self-serves | HG Grades (power user count), Calls (mentions) | Peer-to-peer adoption driver |
| **Data Champion** | Manages data pipelines, governance | Build phase team contacts | Ensures data quality sustains |
| **Department Champion** | Leads adoption within their department | User engagement data by group | Scales adoption horizontally |

```
Champion Score (for each candidate):
  Platform Activity (from HG Grades):    0-30 pts
  Engagement History (from Calls):       0-25 pts
  Role/Influence (from Portfolio):       0-25 pts
  Training Completion (Education grade): 0-20 pts
```

### Step 3: Design Role-Based Training Curricula

Based on PoC mockup patterns, training is structured by role with specific time allocations:

#### Executive Track (30 minutes)

| Module | Duration | Content | Delivery |
|--------|----------|---------|----------|
| Platform Vision | 10 min | What the platform delivers for the business, how to access executive dashboards | Live demo |
| Key Dashboards | 15 min | Navigate 2-3 executive dashboards, interpret KPIs, drill-down basics | Hands-on |
| Support & Escalation | 5 min | Who to contact, how to request new views | Quick reference card |

#### Manager Track (60 minutes)

| Module | Duration | Content | Delivery |
|--------|----------|---------|----------|
| Platform Orientation | 10 min | Login, navigation, favorites, alerts | Hands-on |
| Department Dashboards | 20 min | Navigate dashboards relevant to their team, filters, drill paths | Hands-on |
| Self-Service Basics | 15 min | Create cards, apply filters, export data, schedule reports | Hands-on |
| Team Enablement | 10 min | How to onboard their direct reports, share access | Walkthrough |
| Support Resources | 5 min | Knowledge base, Domo University, support channels | Reference doc |

#### Power User Track (90 minutes)

| Module | Duration | Content | Delivery |
|--------|----------|---------|----------|
| Advanced Navigation | 10 min | Buzz, Domo Stories, page management | Hands-on |
| Card Building | 25 min | Chart types, beast modes, filters, PDP awareness | Workshop |
| Data Awareness | 20 min | Understanding datasets, refresh schedules, data quality signals | Walkthrough |
| Workflows & Alerts | 15 min | Set up alerts, automated workflows, scheduled reports | Hands-on |
| Governance | 10 min | Naming conventions, certification, content organization | Reference doc |
| Admin Basics | 10 min | User management, group permissions (if admin role) | Walkthrough |

### Step 4: Create Go-Live Schedule

**14-Day Go-Live Framework (from PoC mockup):**

| Day | Activity | Audience | Owner |
|-----|----------|----------|-------|
| **Day 1** | Executive briefing — platform overview and access | Executive sponsors | Lead Consultant |
| **Day 2** | Champion power session — deep training for champions | Identified champions | Lead Consultant |
| **Day 3-4** | Manager training sessions (cohort 1) | Managers batch 1 | Champion + Consultant |
| **Day 5** | Power user workshop | Power users | Consultant |
| **Day 6-7** | Manager training sessions (cohort 2) | Managers batch 2 | Champion + Consultant |
| **Day 8** | Open Q&A / drop-in office hours | All users | Champion |
| **Day 9-10** | Self-service practice period | All users | Support via Slack/Teams |
| **Day 11** | Feedback collection — survey + calls | All trained users | PMO |
| **Day 12** | Address feedback, quick fixes | Delivery team | Consultant |
| **Day 13** | Final champion readiness check | Champions | Lead Consultant |
| **Day 14** | 🎉 Official go-live — handoff to champions | All stakeholders | CSM + Lead Consultant |

### Step 5: Define Ongoing Support Structure

Post-go-live support model:

| Timeframe | Support Model | Provider | Escalation Path |
|-----------|--------------|----------|-----------------|
| Week 1-2 post go-live | Active support — daily check-ins | Lead Consultant | CSM → Manager |
| Week 3-4 | Tapering — 2x/week check-ins | Consultant + Champion | CSM |
| Month 2 | Champion-led — weekly office hours | Champions | CSM → Consultant (as needed) |
| Month 3+ | Self-sustaining — monthly health check | CSM | Standard support |

### Step 6: Produce Enablement Plan

---

## Output Template

```markdown
# Adoption Enablement Plan: [Account Name]

**Generated:** [Date]
**Engagement Phase:** Build → Adopt transition
**Target Go-Live:** [Date]
**Training Duration:** 14 days

---

## Adoption Readiness Assessment

| Dimension | Current State | Ready? | Gap |
|-----------|--------------|--------|-----|
| Content | [X] dashboards, [X] dataflows built | [✅/❌] | [What's missing] |
| Users | [X] MAU of [X] total | [✅/❌] | [Adoption gap] |
| Education | [Grade] — [X] certified users | [✅/❌] | [Training need] |
| Governance | [Roles/PDP/Groups status] | [✅/❌] | [What to set up] |
| Champions | [N] identified | [✅/❌] | [Who's missing] |

---

## Champion Roster

| Name | Type | Score | Department | Training Status | Notes |
|------|------|-------|------------|-----------------|-------|
| [Name] | Executive Champion | [XX]/100 | [Dept] | [Scheduled/Complete] | [Key context] |
| [Name] | Power User Champion | [XX]/100 | [Dept] | [Scheduled/Complete] | [Key context] |
| [Name] | Data Champion | [XX]/100 | [Dept] | [Scheduled/Complete] | [Key context] |
| [Name] | Department Champion | [XX]/100 | [Dept] | [Scheduled/Complete] | [Key context] |

**Champion Gaps:** [Any champion types not yet identified]

---

## Training Curricula

### Executive Track (30 min)
**Audience:** [N] executives
**Schedule:** [Date/Time]

| Module | Duration | Delivery Method |
|--------|----------|-----------------|
| Platform Vision | 10 min | Live demo |
| Key Dashboards | 15 min | Hands-on |
| Support & Escalation | 5 min | Reference card |

### Manager Track (60 min)
**Audience:** [N] managers across [X] cohorts
**Schedule:** Cohort 1: [Date] | Cohort 2: [Date]

| Module | Duration | Delivery Method |
|--------|----------|-----------------|
| Platform Orientation | 10 min | Hands-on |
| Department Dashboards | 20 min | Hands-on |
| Self-Service Basics | 15 min | Hands-on |
| Team Enablement | 10 min | Walkthrough |
| Support Resources | 5 min | Reference doc |

### Power User Track (90 min)
**Audience:** [N] power users
**Schedule:** [Date/Time]

| Module | Duration | Delivery Method |
|--------|----------|-----------------|
| Advanced Navigation | 10 min | Hands-on |
| Card Building | 25 min | Workshop |
| Data Awareness | 20 min | Walkthrough |
| Workflows & Alerts | 15 min | Hands-on |
| Governance | 10 min | Reference doc |
| Admin Basics | 10 min | Walkthrough |

---

## 14-Day Go-Live Schedule

| Day | Date | Activity | Audience | Owner | Status |
|-----|------|----------|----------|-------|--------|
| 1 | [Date] | Executive briefing | Executives | Lead Consultant | [ ] |
| 2 | [Date] | Champion power session | Champions | Lead Consultant | [ ] |
| 3-4 | [Dates] | Manager training (cohort 1) | Managers | Champion + Consultant | [ ] |
| 5 | [Date] | Power user workshop | Power users | Consultant | [ ] |
| 6-7 | [Dates] | Manager training (cohort 2) | Managers | Champion + Consultant | [ ] |
| 8 | [Date] | Open Q&A / office hours | All users | Champion | [ ] |
| 9-10 | [Dates] | Practice period | All users | Slack/Teams support | [ ] |
| 11 | [Date] | Feedback collection | All trained | PMO | [ ] |
| 12 | [Date] | Address feedback | Delivery team | Consultant | [ ] |
| 13 | [Date] | Champion readiness check | Champions | Lead Consultant | [ ] |
| 14 | [Date] | 🎉 Go-live handoff | All stakeholders | CSM + Consultant | [ ] |

---

## Success Metrics (Adoption Phase)

| Metric | Pre-Training | Go-Live Target | 30-Day Target | 90-Day Target |
|--------|-------------|----------------|---------------|---------------|
| MAU | [Current] | [Go-live] | [30d] | [90d] |
| Power Users | [Current] | [Go-live] | [30d] | [90d] |
| Card Views/Week | [Current] | [Go-live] | [30d] | [90d] |
| Certified Users | [Current] | [Go-live] | [30d] | [90d] |
| Health Grade | [Current] | [Go-live target] | [30d] | [90d] |

---

## Post Go-Live Support Structure

| Timeframe | Model | Provider | Cadence |
|-----------|-------|----------|---------|
| Weeks 1-2 | Active support | Lead Consultant | Daily check-ins |
| Weeks 3-4 | Tapering | Consultant + Champions | 2x/week |
| Month 2 | Champion-led | Champions | Weekly office hours |
| Month 3+ | Self-sustaining | CSM | Monthly health check |

---

## Training Materials Checklist

| Material | Type | Status | Owner |
|----------|------|--------|-------|
| Executive dashboard guide | PDF / 1-pager | [ ] | Consultant |
| Manager quickstart guide | PDF | [ ] | Consultant |
| Power user reference | Documentation | [ ] | Consultant |
| Video walkthroughs | Recording | [ ] | Consultant |
| FAQ document | Shared doc | [ ] | Champion |
| Support contact card | 1-pager | [ ] | PMO |

---

## → Next in Pipeline

After go-live, adoption monitoring begins:
- **Adoption Acceleration** — diagnoses health and generates intervention plans
- **Adoption Radar** — continuous monitoring of adoption health

---

**Prepared by:** Compass Adoption Enablement Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Adopt → Enablement → Position 2
```

---

## Guardrails

- **Champions make or break adoption.** If no champions are identified, flag it as a critical risk. Adoption without champions is unsustainable.
- **Role-based training is non-negotiable.** Don't give executives the power user track. Don't give power users the executive track. Respect their time and needs.
- **14 days is the minimum.** Go-live compressed below 14 days risks poor adoption. Push back on accelerated timelines.
- **Measure before and after.** Record the health grade baseline before training starts. This is how we prove PS value.
- **Training materials must be created.** Don't just do live sessions and walk away. Leave documentation that persists after PS disengages.
- **Post-go-live support is tapering, not a cliff.** Never go from daily support to zero support overnight.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_lookup | **Yes** | User counts, MAU, adoption baseline |
| hggrades_lookup | **Yes** | Education, User Engagement, Platform Utilization scores |
| calls_lookup | Optional | Has adoption been discussed? Customer expectations? |
| spp_lookup | Optional | Remaining hours for enablement activities |
| Asana | Optional | Training task tracking |

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and adoption patterns.

### After executing
- Call `memory_store_artifact` scoped to `{account_id}` with the adoption artifact produced.
- Call `memory_remember` scoped to `{account_id}` with adoption signals observed.

## Related Skills

- **Weekly Status** (Build/Adopt) → Status reporting continues through enablement
- **Adoption Acceleration** (Adopt) → Downstream — diagnoses adoption health post-go-live
- **Adoption Radar** (Adopt) → Downstream — continuous adoption monitoring
- **Kickoff Brief** (Align) → Success criteria inform enablement targets
- **Template Registry** (Global) → Training materials use brand templates
