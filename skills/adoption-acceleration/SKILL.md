---
name: adoption-acceleration
tier: 1
description: "Accelerate adoption for at-risk or growth-ready Domo customers. Pulls live account data, diagnoses health signals, and generates an actionable adoption plan. Trigger with 'accelerate adoption for [account]', 'adoption plan for [customer]', 'why is [account] at risk', 'de-risk [account]', or any request about improving customer adoption, engagement, or health."
maturity: alpha
audience: [delivery, intelligence]
---

# Adoption Acceleration

Diagnose account health and generate a prioritized adoption plan by pulling live data from Compass MCP tools.

## How It Works

```
User says: "accelerate adoption for Consumer Reports"
                    |
    +---------------+---------------+
    |               |               |
 Portfolio      Health Grade     Actions
 (context)      (quantitative)   (qualitative)
    |               |               |
    +-------+-------+-------+------+
            |               |
          Calls            SPP            Asana
        (sentiment)     (hours/engagement) (delivery)
            |               |               |
            +-------+-------+-------+-------+
                    |
          Synthesize & Diagnose
                    |
          Generate Adoption Plan
```

## Triggers

- "accelerate adoption for [account]"
- "adoption plan for [customer]"
- "why is [account] at risk"
- "de-risk [account]"
- "[account] health check"
- "what should we do about [account]"

## Execution Flow

### Step 1: Gather Account Context

Query MCP tools in parallel:

```
1. portfolio → Get account profile: segment, ARR, CSM, AE, renewal date,
               products owned, territory, engagement history
2. hggrades_lookup → Get component health scores by Health Course:
                  Commercial (credit pacing), Value Realization (use cases),
                  Relationship (emails, exec engagement, meetings),
                  Education (community users, certifications),
                  Support (bug cases, escalations, outages),
                  Content Creation (cards, dataflows, datasets),
                  User Engagement (card views, MAU, power users),
                  Platform Utilization (features used)
                  Each metric: letter grade + 30/90/180-day trends
3. actions → Get recommended actions: signal type, signal detail,
             action category (de-risk/grow), priority, date generated
4. calls → Get recent call history: last 5 calls, sentiment,
           topics discussed, commitments made, attendees
5. spp → Get engagement data: active engagements, hours logged by category
         (adoption/funded/strategic/zero-dollar/admin), hours remaining
6. asana → Get project/task status: active projects, task completion rates,
           milestones hit/missed, blockers, assignee workload, timeline adherence
```

### Step 2: Diagnose Account State

Classify the account into one of four states based on health grade and signals:

| State | Health Grade | Signal Pattern | Response Posture |
|-------|-------------|----------------|------------------|
| **Critical Risk** | D or F | Multiple de-risk signals, declining engagement, escalations | Immediate intervention required |
| **At Risk** | C | Mixed signals, some de-risk actions flagged, usage gaps | Proactive outreach and enablement |
| **Stable** | B | Healthy signals, minor gaps, consistent engagement | Optimize and deepen adoption |
| **Growth Ready** | A | Growth signals, high utilization, strong engagement | Expand use cases, add users/features |

### Step 3: Identify Adoption Gaps

Analyze health grade sub-scores to identify specific gap areas:

Use `hggrades_lookup` to drill into the 8 Health Courses. For each, check the letter grade and trends:

- **Commercial (Credit Pacing):** Are they consuming credits on pace? Grade C or below = underutilization or misalignment.
- **Value Realization (Use Cases):** Are they building use cases? Grade F = zero use cases documented — critical gap.
- **Relationship (Emails, Exec Engagement, Meetings):** Are we staying close? Declining 90d trends = disengagement.
- **Education (Community Users, Certifications):** Are users learning? Low scores = users don't know how to use the platform.
- **Support (Bug Cases, Escalations, Outages):** Active issues blocking adoption? D/F grades = open wounds.
- **Content Creation (Cards, Dataflows, Datasets):** Are they building? S/A grades = self-sufficient. D/F = dormant.
- **User Engagement (Card Views, MAU, Power Users):** Are people actually using what's built? Low power users = concentration risk.
- **Platform Utilization (Features Used):** Which features are adopted vs. not? Gaps = expansion opportunities.

### Step 4: Generate Adoption Plan

Produce a structured adoption plan with these sections:

---

## Output Template

```markdown
# Adoption Acceleration Plan: [Account Name]

**Generated:** [Date]
**Account State:** [Critical Risk / At Risk / Stable / Growth Ready]
**Health Grade:** [Letter Grade] (GPA: [X.XX])
**Renewal Date:** [Date] ([X] months away)

---

## Executive Summary

[2-3 sentences: Account state, primary risk/opportunity, recommended posture]

---

## Health Scorecard

| Health Course | Metric | Grade | Value | 30d | 90d | 180d | Assessment |
|---------------|--------|-------|-------|-----|-----|------|------------|
| **Overall** | — | [hgtrends_health_grade] | GPA: [hgtrends_health_gpa] | — | — | — | [One-line] |
| Commercial | Credit Pacing | [grade] | [value] | [↑/↓/→] | [↑/↓/→] | [↑/↓/→] | [Analysis] |
| Value Realization | Use Cases | [grade] | [value] | ... | ... | ... | [Analysis] |
| Relationship | Emails/Engagement/Meetings | [grades] | [values] | ... | ... | ... | [Analysis] |
| Education | Community/Certifications | [grades] | [values] | ... | ... | ... | [Analysis] |
| Support | Bugs/Escalations/Outages | [grades] | [values] | ... | ... | ... | [Analysis] |
| Content Creation | Cards/Dataflows/Datasets | [grades] | [values] | ... | ... | ... | [Analysis] |
| User Engagement | Views/MAU/Power Users | [grades] | [values] | ... | ... | ... | [Analysis] |
| Platform Utilization | Features Used | [grade] | [value] | ... | ... | ... | [Analysis] |

*Data from hggrades_lookup. Each metric has its own row — aggregate here for the scorecard, but preserve individual metrics in the detail section below.*

---

## Active Signals & Recommended Actions

### De-Risk Actions (if applicable)
| Priority | Signal | Recommended Action | Owner | Timeline |
|----------|--------|--------------------|-------|----------|
| [1-5] | [Signal detail from Actions dataset] | [Action detail] | [Role] | [Timeframe] |

### Growth Actions (if applicable)
| Priority | Signal | Recommended Action | Owner | Timeline |
|----------|--------|--------------------|-------|----------|
| [1-5] | [Signal detail from Actions dataset] | [Action detail] | [Role] | [Timeframe] |

---

## Engagement Context

### Recent Calls
| Date | Attendees | Key Topics | Sentiment | Commitments |
|------|-----------|------------|-----------|-------------|
| [From Calls dataset] | | | | |

### Active Engagements (from SPP)
| Engagement | Type | Hours Used | Hours Remaining | Billing Category |
|------------|------|------------|-----------------|------------------|
| [From SPP dataset] | | | | |

### Delivery Status (from Asana)
| Project | Status | Tasks Complete | Blockers | Next Milestone | Due Date |
|---------|--------|----------------|----------|----------------|----------|
| [From Asana projects] | | | | | |

---

## 90-Day Adoption Plan

### Month 1: [Stabilize / Optimize / Expand] (based on account state)
- **Week 1-2:** [Specific actions with owners]
- **Week 3-4:** [Specific actions with owners]

### Month 2: [Deepen / Scale / Extend]
- **Week 5-6:** [Specific actions]
- **Week 7-8:** [Specific actions]

### Month 3: [Measure / Validate / Grow]
- **Week 9-10:** [Specific actions]
- **Week 11-12:** [Success validation and next steps]

---

## Success Metrics

| Metric | Current | 30-Day Target | 90-Day Target |
|--------|---------|---------------|---------------|
| Health Grade | [Current] | [Target] | [Target] |
| GPA | [Current] | [Target] | [Target] |
| Active Users | [Current] | [Target] | [Target] |
| Feature Utilization | [Current %] | [Target %] | [Target %] |
| Credit Consumption Pace | [Current %] | [Target %] | [Target %] |

---

## Recommended Services

Based on gap analysis, these Domo PS services would accelerate adoption:

| Service | Why | Expected Impact | Est. Hours |
|---------|-----|-----------------|------------|
| [Service from Use Case Services catalog] | [Gap it addresses] | [Outcome] | [Hours] |

---

## Next Steps

1. [Most urgent action with owner and date]
2. [Second priority]
3. [Third priority]

**Prepared by:** Compass Adoption Acceleration Agent
**Data Sources:** Portfolio, Health Grade, Actions, Calls, SPP, Asana
```

---

## Guardrails

- **Never fabricate metrics.** If a data source is unavailable, say "Data unavailable" and note which MCP tool couldn't be reached.
- **Always cite which dataset** a number comes from (e.g., "Health Grade: C (source: health_grade)").
- **Don't override the Actions engine.** Present its recommended actions as-is, then add supplementary recommendations.
- **Respect the account state classification.** Don't recommend growth plays for a Critical Risk account.
- **Flag when data is stale.** If the most recent call or action is >30 days old, explicitly note the data freshness gap.

---

## Connecting MCP Tools

This skill requires the following MCP tools to be connected. Without them, the skill falls back to manual input mode (you provide the data, the skill structures the plan).

| MCP Tool | Required | Fallback |
|----------|----------|----------|
| portfolio_lookup | Yes | Ask user for account context |
| hggrades_lookup | Yes | Ask user for health scores |
| hg_summary_lookup | Recommended | Skip narrative summary |
| actions_lookup | Yes | Ask user for known signals |
| calls_lookup | Optional | Skip call analysis section |
| spp_lookup | Optional | Skip engagement hours section |
| asana | Optional | Skip delivery status section |
| web_research | Optional | Skip external context |

### Manual Mode

If MCP tools are not yet connected, the skill still works. It will ask the user to provide:

1. Account name and basic context
2. Current health grade and sub-scores (if known)
3. Any known signals or recommended actions
4. Recent call notes or engagement context

The output structure remains the same — the skill just needs the data from a different source.

---

## Template Requirements

**Before generating any output file, reference the Template Registry skill** (`compass-skills/global/template-registry/SKILL.md`) to select the correct template and apply Domo brand standards.

| Output | Template to Use |
|--------|----------------|
| Adoption Plan (Word) | Domo Word Doc Template (`brand/Domo Word Doc Template.docx`) |
| Adoption Roadmap (Deck) | Adoption Roadmap Template (`_TEMPLATES/_AdoptionTemplates/Adoption_Roadmap_Template.pptx`) |
| Engagement Proposal | Adoption Proposal Template (`_TEMPLATES/_AdoptionTemplates/Adoption_Proposal_Template.pptx`) |

**Brand rules:** Domo Blue (#99CCEE), Open Sans font family, no blank docs — always start from templates.

---

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and adoption patterns.

### After executing
- Call `memory_store_artifact` scoped to `{account_id}` with the adoption artifact produced.
- Call `memory_remember` scoped to `{account_id}` with adoption signals observed.

## Related Skills

- **Template Registry** (Global) — Template selection and brand standards for all deliverables
- **Account 360** (Discover) — Full account briefing before engagement
- **Value Realization** (Adopt) — Measure outcomes against committed KPIs
- **Growth Navigator** (Adopt) — Identify expansion opportunities
- **Delivery Management** (Build) — Track active engagement execution
