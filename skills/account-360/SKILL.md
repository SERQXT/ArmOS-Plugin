---
name: account-360
tier: 1
description: "Generate a complete account briefing by pulling all available Domo data into a single view. The starting point for any account conversation. Trigger with 'brief me on [account]', 'account 360 for [customer]', 'what do we know about [account]', 'pull up [account]', 'prep me on [account]', or any request for a full account picture."
maturity: alpha
audience: [intelligence]
---

# Account 360 — Discovery Briefing

The universal starting point for any account conversation. Pulls every available data source into a structured briefing so anyone — CSM, AE, consultant, leader — can get up to speed in 60 seconds.

## How It Works

```
User says: "brief me on Consumer Reports"
                    |
    +-------+-------+-------+-------+-------+-------+
    |       |       |       |       |       |       |
Portfolio  HG     HG      Actions  Calls   SPP     SF Opps
(master)  Grades Summary  (signals)(voice) (svc)   (deals)
    |       |       |       |       |       |       |
    +---+---+---+---+---+---+---+---+---+---+---+---+
    |       |           |           |           |
 Relation- Support   User Eng.  Platform   HG Stacked
  ship    Cases     (adoption)  Util       (trends)
    |       |           |           |           |
    +-------+-----------+-----------+-----------+
                    |
         Synthesize into 360 View
                    |
         Produce Briefing Document
```

## Triggers

- "brief me on [account]"
- "account 360 for [customer]"
- "what do we know about [account]"
- "pull up [account]"
- "prep me on [account]"
- "give me the rundown on [account]"
- "account overview for [customer]"
- "who is [account]"

## Execution Flow

### Step 1: Resolve the Account

```
1. portfolio_summary → Search by account name
   • If multiple matches: present list, ask user to choose
   • If no match: try partial name, suggest corrections
   • Capture: bks_account_id (needed for HG lookups)
```

### Step 2: Pull All Data Sources (in parallel)

```
1. portfolio_lookup(account_name, fields="identity,renewal,health,pacing,signals,team,segmentation,services,financial,adoption,companyIntel")
   → Full account context: 174+ fields across all dimensions

2. hggrades_lookup(account_id)
   → Component health scores: 17 metrics across 8 Health Courses
   → Letter grades + 30/90/180-day trends per metric

3. hg_summary_lookup(account_id)
   → AI narrative summary of account health

4. actions_lookup(account_name)
   → All active signals and recommended actions
   → De-risk and growth classifications with plays

5. calls_lookup(account_name, limit=5)
   → Last 5 Gong calls: title, date, sentiment, recap, attendees

6. spp_lookup(account_name) [when available]
   → Active engagements, hours by category, remaining balance

7. sfopportunities_lookup(account_name, limit=10) [when available]
   → Pipeline & deal history: renewal, upsell, close dates, ACV, stage, partners

8. hgrelationship_lookup(account_name, limit=20) [when available]
   → Recent email/meeting activity from People.ai: participants, frequency, direction

9. hgsupport_lookup(account_name, limit=10) [when available]
   → Open/recent support cases: priority, status, category, JIRA linkage

10. hguserengagement_lookup(account_name, limit=20) [when available]
    → Top users: login days, roles, titles, CXO flags, active status

11. hgplatformutilization_lookup(account_name) [when available]
    → Feature enablement vs. usage: Data Science, Embed, Jupyter, Everywhere, etc.

12. hgstacked_lookup(account_id, limit=50) [when available]
    → Health metric time-series: trend lines for key dimensions
```

### Step 3: Synthesize & Classify

Determine the account's **operating posture** based on data:

| Posture | Criteria | What It Means |
|---------|----------|---------------|
| **🔴 Intervene** | Grade D/F, or >3 de-risk actions, or negative call sentiment + <90 days to renewal | Drop everything. This account needs immediate attention. |
| **🟡 Monitor** | Grade C, or mixed signals, or declining 90-day trends | Proactive outreach needed. Things are slipping. |
| **🟢 Optimize** | Grade B, stable/improving trends, engagement consistent | Healthy. Look for ways to deepen value. |
| **🔵 Expand** | Grade A/S, growth signals, high utilization, strong sentiment | Prime for upsell/cross-sell. Expand footprint. |

### Step 4: Produce the Briefing

---

## Output Template

```markdown
# Account 360: [Account Name]

**Generated:** [Date] | **Posture:** [🔴 Intervene / 🟡 Monitor / 🟢 Optimize / 🔵 Expand]

---

## At a Glance

| | |
|---|---|
| **Health Grade** | [Letter] (GPA: [X.XX]) |
| **Segment** | [Account Segment] |
| **Lifecycle** | [Customer Lifecycle Stage] |
| **Momentum** | [momentum_segment] |
| **ARR** | $[2024_arr] |
| **Renewal** | [bks_renewal_date] ([Days to Renewal] days) |
| **Forecast** | $[bks_FCST_amount] ([fcst_renewal_pct]%) |
| **Pacing** | [% Pacing] through period |
| **Risk Signals** | [risk_signal_total] (30d: [risk_last30days]) |
| **Growth Signals** | [growth_signal_total] (30d: [growth_lever_last30days]) |

---

## Team

| Role | Person | Email |
|------|--------|-------|
| CSM | [bks_csm] | [CSM Email] |
| AE | [team_ae] | [AE Email] |
| CSM Manager | [bks_csm_manager] | |
| Frontline Leader | [front line leader] | |
| PMO | [PMO] | |
| SC | [sc_name] | |

---

## Health Grade Breakdown

[From hggrades_lookup — organized by Health Course]

| Health Course | Metric | Grade | Value | 30d Trend | 90d Trend | 180d Trend |
|---------------|--------|-------|-------|-----------|-----------|------------|
| Commercial | Credit Pacing | [grade] | [value] | [↑/↓/→] | [↑/↓/→] | [↑/↓/→] |
| Content Creation | Cards Created | [grade] | [value] | ... | ... | ... |
| ... | ... | ... | ... | ... | ... | ... |

**Strengths:** [Health Courses with A/S grades]
**Weaknesses:** [Health Courses with D/F grades]
**Trending Up:** [Metrics with positive 90d change]
**Trending Down:** [Metrics with negative 90d change]

### Health Narrative
> [From hg_summary_lookup — AI-generated paragraph]

---

## Active Signals & Recommended Actions

### De-Risk Actions
| # | Action | Rationale | Urgency | Play | Owner |
|---|--------|-----------|---------|------|-------|
| 1 | [recommended_action] | [action_rationale] | [action_urgency] | [play1_name] | [play1_executing_role] |

### Growth Actions
| # | Action | Rationale | Urgency | Play | Owner |
|---|--------|-----------|---------|------|-------|
| 1 | [recommended_action] | [action_rationale] | [action_urgency] | [play1_name] | [play1_executing_role] |

---

## Recent Conversations

[From calls_lookup — last 5 calls]

| Date | Title | Duration | Sentiment | Owner |
|------|-------|----------|-----------|-------|
| [Call Scheduled Date] | [Call Title] | [Duration] min | [sentiment] | [Call Owner] |

### Call Highlights
For each call, extract from Call Recap:
- **Key topics discussed**
- **Commitments made**
- **Customer concerns raised**
- **Follow-up items**

---

## Services & Engagement

| Metric | Value |
|--------|-------|
| Active Projects | [# Active Projects] |
| Project Names | [Project Name(s)] |
| Billable Hours Remaining | [Billable Hours Remaining] |
| Total Hours Purchased | [hg_total_billable_hours_purchased] |
| Hours Consumed | [Billable Hours Consumed] |
| Invested Hours | [Invested Hours] |
| Has Active Services | [Has Active Services] |
| Adoption Consulting | [Has Adoption Consulting] → [Adoption Consultants] |
| ACE Package | [Has ACE] → [hg_acePackage] |
| Preferred Support | [Has Preferred Support] → [Preferred Support Advisor] |

### SPP Engagement Detail [when available]
| Engagement | Type | Hours Used | Hours Remaining |
|------------|------|------------|-----------------|
| [From SPP dataset] | | | |

---

## Pipeline & Deals [when available]

[From sfopportunities_lookup — recent/active opportunities]

| Opportunity | Type | Stage | ACV | Close Date | Owner |
|-------------|------|-------|-----|------------|-------|
| [Opportunity Name] | [Renewal/Upsell/New] | [Stage] | $[ACV] | [Close Date] | [Owner] |

**Active pipeline:** [Count] open opportunities totaling $[sum ACV]
**Last closed-won:** [Most recent closed-won deal name, date, ACV]

---

## Relationship Activity [when available]

[From hgrelationship_lookup — People.ai email/meeting data]

| Period | Emails | Meetings | Direction Trend |
|--------|--------|----------|-----------------|
| Last 30 days | [count] | [count] | [More inbound/outbound/balanced] |

**Key contacts engaged:** [Top participant names with titles from recent activity]
**Engagement trend:** [Increasing/Declining/Stable compared to prior period]

---

## Support Cases [when available]

[From hgsupport_lookup — recent cases]

| Case # | Priority | Status | Subject | Created | Owner |
|--------|----------|--------|---------|---------|-------|
| [CaseNumber] | [Priority] | [Status] | [Subject] | [Date] | [Owner] |

**Open cases:** [count] ([critical/high count] critical/high priority)
**JIRA-linked bugs:** [count with JIRA numbers if applicable]

---

## User Engagement [when available]

[From hguserengagement_lookup — individual user data]

| Metric | Value |
|--------|-------|
| Active users | [count where user active = Yes] |
| CXO/executive users | [count where cxo_user = 1] |
| Top user (by login days) | [name] — [days_logged_in] days |
| Roles breakdown | [Admin: N, Privileged: N, Customer: N] |

**Power users:** [Top 3-5 users by login days with titles]
**Inactive risk:** [Users who haven't logged in 30+ days]

---

## Platform Feature Utilization [when available]

[From hgplatformutilization_lookup — feature-level data]

| Feature | Enabled | Used | Used Last 30d |
|---------|---------|------|---------------|
| Data Science | [Yes/No] | [Yes/No] | [Yes/No] |
| Embed | [Yes/No] | [Yes/No] | [Yes/No] |
| Jupyter | [Yes/No] | [Yes/No] | [Yes/No] |
| Publish | [Yes/No] | [Yes/No] | [Yes/No] |
| Everywhere | [Yes/No] | [Yes/No] | [Yes/No] |

**Enabled but unused:** [List features where Enabled=Yes but Used=No — these are PS opportunities]
**Actively used:** [List features where Used Last 30d=Yes]

---

## Financial Summary

| Metric | Value |
|--------|-------|
| 2024 ARR | $[2024_arr] |
| 2023 ARR | $[2023_arr] |
| ARR Growth | $[total_arr_growth] ([total_arr_growth_percent]%) |
| Total Active TCV | $[Total Active TCV] |
| Renewal Baseline | $[bks_renewal_baseline_usd] |
| Forecast Amount | $[bks_FCST_amount] |
| Forecast Delta | $[bks_forecast_delta] |
| Last Renewal | [Last Renewal] ($[last_renewal_amount]) |
| Downsell History | [last_renewal_downsell_flag] ([last_renewal_downsell_%]) |
| Upsell Pipeline | [upsell_total_opportunities] opps ($[upsell_total_acv]) |

---

## Company Intelligence

| Metric | Value |
|--------|-------|
| Company | [COMPANY] |
| Primary Contact | [PRIMARY_NAME] |
| LinkedIn | [PRIMARY_LINKEDIN_URL] |
| Website | [Website Domain] |
| Headcount (2024) | [HEADCOUNT_2024] |
| HC Growth | [hc_total_growth_percent]% |
| Job Postings (2024) | [Job_Postings_2024] |
| BI Job Postings (2024) | [PBI_Job_Postings_2024] |

---

## What to Do Next

[Based on the operating posture, generate 3-5 specific next steps]

**For 🔴 Intervene:**
1. Schedule internal war-room with CSM + CSM Manager within 48 hours
2. Address top de-risk action immediately
3. Review recent call sentiment — who is the unhappy stakeholder?
4. Check renewal forecast vs. baseline — quantify the risk

**For 🟡 Monitor:**
1. Schedule proactive check-in with customer
2. Address top 2 recommended actions this sprint
3. Identify the declining health dimension and build a plan

**For 🟢 Optimize:**
1. Review adoption gaps — which Health Courses have room to improve?
2. Explore additional use case enablement
3. Prep for upcoming renewal conversation with strong narrative

**For 🔵 Expand:**
1. Review growth signals — what's driving the positive trajectory?
2. Map upsell pipeline against customer priorities
3. Schedule strategic planning session for next-gen use cases

---

**Data Sources:** Portfolio, HG Grades, HG Summary, Actions, Calls[, SPP, SF Opportunities, Relationship, Support, User Engagement, Platform Utilization, HG Trends]
**Prepared by:** Compass Account 360 Agent
```

---

## Guardrails

- **Never fabricate data.** If a data source fails or returns empty, show "Data unavailable — [tool name]" and continue with what you have.
- **Always cite which dataset** a number comes from.
- **Show trends, not just snapshots.** The 30/90/180-day trends from HG Grades are critical context — always include them.
- **Don't editorialize beyond the data.** The "What to Do Next" section should be driven by the signals and posture classification, not opinion.
- **Flag data freshness.** If the most recent call is >30 days old, note it. If actions haven't been updated recently, note it.
- **Respect the posture classification.** Don't recommend expansion for an Intervene account.

---

## Connecting MCP Tools

| MCP Tool | Required | What It Provides |
|----------|----------|------------------|
| portfolio_lookup | **Yes** | Master account record — everything starts here |
| hggrades_lookup | **Yes** | Component health scores — the "why" behind the grade |
| hg_summary_lookup | Recommended | AI narrative summary |
| actions_lookup | **Yes** | Signal-driven recommendations |
| calls_lookup | Recommended | Voice-of-customer context |
| spp_lookup | Optional | Engagement hours and service utilization |
| portfolio_search | Optional | Used for cross-referencing similar accounts |
| sfopportunities_lookup | Optional | Pipeline, deals, ACV, stage, partner involvement |
| hgrelationship_lookup | Optional | People.ai email/meeting activity with participants |
| hgsupport_lookup | Optional | Support case detail — priority, status, JIRA linkage |
| hguserengagement_lookup | Optional | Individual user adoption — logins, roles, CXO flags |
| hgplatformutilization_lookup | Optional | Feature enablement vs. usage per Domo instance |
| hgstacked_lookup | Optional | Health metric time-series for trend analysis |

### Manual Mode

If MCP tools aren't connected, the skill works in manual mode. Ask the user to provide:

1. Account name and segment
2. Health grade and GPA (if known)
3. Key concerns or context
4. Any recent call notes

The output structure stays the same — the data just comes from the user instead of the API.

---

## Template Requirements

**Before generating any output file, reference the Template Registry skill** (`compass-skills/global/template-registry/SKILL.md`).

| Output Format | Template |
|---------------|----------|
| Account Briefing (Word) | Domo Word Doc Template (`templates/brand/Domo Word Doc Template.docx`) |
| Quick Brief (Markdown) | Output directly — no template needed |

**Brand rules:** Domo Blue (#99CCEE), Open Sans font family.

---

## Memory

### Before executing

- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load existing account context before pulling Domo data.
- Call `memory_recall` with intent `"global"` (or the platform default for portfolio/global scope) to load global-context: industry and entity relationships that frame the briefing.
- Call `memory_bundle` if you need full engagement context in one shot (e.g., prior artifacts tied to this account).

### After executing

- Call `memory_remember` scoped to `{account_id}` with the distilled **Account360Summary**: posture, key metrics, risks, and next steps — so the account layer stays the single source of truth for “what we know” about this customer.

---

## Related Skills

- **Adoption Acceleration** (Adopt) — Once you know the account, accelerate its adoption
- **Template Registry** (Global) — Brand standards and template selection
- **Portfolio Search** (via `portfolio_search` tool) — Find similar accounts or cohort analysis
