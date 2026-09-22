---
name: align-account-intel
tier: 1
description: "Deep account intelligence dossier for the Align phase — everything the engagement team needs to know before kickoff. Goes beyond account-360 by adding historical engagement lineage, relationship mapping, enablement/support/ACE inventory, credit trends, department coverage, SOW risk analysis, and live external intelligence (news, financials, job postings). Produces a branded Word doc. Trigger on 'account intel for [account]', 'align intel for [customer]', 'deep dive on [account]', 'dossier for [account]', 'everything we know about [account]', 'intel brief for [account]', or any request for comprehensive account intelligence in preparation for a PS engagement. Also trigger when a consultant says 'I need to get smart on [account]' or 'what's the full picture on [account]'. This is the Align-phase counterpart to account-360 — it's specifically designed for a PS team about to kick off work."
maturity: alpha
audience: [intelligence, orchestration]
pipeline:
  phase: align
  sub_phase: intel-gathering
  position: 1
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: account-360
      required: false
      data: baseline account snapshot
  outputs:
    - name: account-intel-dossier
      format: docx
      downstream:
        - agent: kickoff-brief
        - agent: align-create-kickoff-deck
        - agent: alignment-gate
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: hggrades_lookup
      required: true
    - tool: hg_summary_lookup
      required: true
    - tool: actions_lookup
      required: true
    - tool: calls_lookup
      required: true
    - tool: spp_lookup
      required: true
    - tool: spp_project_assignments_lookup
      required: true
    - tool: sfopportunities_lookup
      required: true
    - tool: hgrelationship_lookup
      required: true
    - tool: hgsupport_lookup
      required: true
    - tool: hguserengagement_lookup
      required: true
    - tool: hgplatformutilization_lookup
      required: true
    - tool: hgstacked_lookup
      required: true
    - tool: hgace_lookup
      required: false
    - tool: WebSearch
      required: true
  phase_gate: false
---

# Align — Account Intel Dossier

The comprehensive intelligence package for an engagement team about to enter the Align phase. This isn't a quick status check — it's the "know everything before you walk in the room" document. When a consultant opens this dossier, they should feel like they've been on the account for six months.

The dossier answers three strategic questions:
1. **Where has this account been?** — History, prior engagements, team lineage, how they got here.
2. **Where is it right now?** — Health, usage, relationships, support posture, credit position.
3. **What's happening outside Domo?** — Company news, financial trajectory, hiring signals, market context.

## Execution Flow

### Step 1: Resolve the Account

```
portfolio_summary(account_name)
  → Match the account, capture bks_account_id
  → If multiple matches: present list, ask user to choose
  → If no match: try partial name, suggest corrections
```

### Step 2: Pull All Data (in parallel)

Launch all of these concurrently. Every one of these calls matters — this is the deep dive, not the snapshot.

**Core (required):**
```
1.  portfolio_lookup(account_name, fields="identity,renewal,health,pacing,signals,team,segmentation,services,financial,adoption,companyIntel")
2.  hggrades_lookup(account_id)
3.  hg_summary_lookup(account_id)
4.  actions_lookup(account_name)
5.  calls_lookup(account_name, limit=10)
6.  spp_lookup(account_name, limit=100)
7.  spp_project_assignments_lookup(account_name, limit=100)
8.  sfopportunities_lookup(account_name, limit=20, fields="identity,opportunity,financial,team,segmentation,forecast,stageDates,csServices,serviceRevenue,deal")
9.  hgrelationship_lookup(account_name, limit=50)
10. hgsupport_lookup(account_name, limit=30)
11. hguserengagement_lookup(account_name, limit=50, fields="identity,user,login,role,email,domoPoints,sfdcContact")
12. hgplatformutilization_lookup(account_name)
13. hgstacked_lookup(account_id, limit=100)
14. hgace_lookup(account_name, limit=30)
```

**External intelligence (run in parallel with above):**
```
15. WebSearch: "[Company Name] news [current year]"
16. WebSearch: "[Company Name] revenue OR financial results [current year]"
17. WebSearch: "[Company Name] hiring data engineer OR data analyst OR business intelligence"
18. WebSearch: "[Company Name] 10-K SEC" (if public company)
```

### Step 3: Synthesize into Dossier Sections

Work through each section below. The output is a branded Word document using `templates/brand/Domo Word Doc Template.docx`.

---

## Output Structure

The dossier has 16 sections. **Section 1 (Strategic Summary) comes first** — it's the executive-level "here's what matters" that frontloads the most important insights. The remaining 15 sections provide the deep supporting evidence. Build them in this order.

### Section 1: Strategic Summary & Alignment Priorities

**Source:** ALL data sources — this section is written LAST during synthesis but placed FIRST in the document.

Synthesize everything from sections 2-16 into a lead section:

**Account posture:** Use the same classification as account-360:
- Red (Intervene) / Yellow (Monitor) / Green (Optimize) / Blue (Expand)

Present in a prominent callout box with the posture label and a 2-sentence synopsis.

**Top 5 things the engagement team must know:**
1. [Most critical insight — could be a risk, an opportunity, or a context factor]
2. [Second]
3. [Third]
4. [Fourth]
5. [Fifth]

**Alignment priorities for kickoff:**
- What should the kickoff meeting focus on?
- What questions need answers before Design can begin?
- What relationships need to be built or repaired?

This section replaces the need for anyone to read the full dossier if they're short on time. It must be self-contained and actionable.

### Section 2: Account Identity & Historical Timeline

**Source:** `portfolio_lookup` (identity, financial fields), `sfopportunities_lookup` (earliest Closed Won)

The consultant needs to understand the arc of this relationship — not just where it is today.

Build a timeline showing:
- **Customer since:** Earliest Closed Won opportunity date (this is when the relationship began)
- **Consumption model transition:** Look at opportunity history for evidence of moving to consumption pricing. Note the date if visible in opportunity names or types.
- **ARR trajectory:** Show year-over-year ARR from portfolio data (2023_arr, 2024_arr, total_arr_growth, total_arr_growth_percent)
- **Account segment changes:** Current segment from portfolio, plus any evidence of segment transitions
- **Key milestones:** First deal, major upsells, renewals, any downsell events (last_renewal_downsell_flag)

Present as a narrative timeline, not just a table. The reader should understand the story of this account.

### Section 3: Account Team & Ownership History

**Source:** `portfolio_lookup` (team fields), `spp_project_assignments_lookup` (historical consultants), `sfopportunities_lookup` (opportunity owners)

| Role | Current Owner |
|------|--------------|
| CSM | [bks_csm] |
| AE | [team_ae] |
| CSM Manager | [bks_csm_manager] |
| Frontline Leader | [front line leader] |
| SC | [sc_name] |
| PMO | [PMO] |

Then show the **historical engagement team** from SPP assignments — who has worked on this account before, on which projects, in what role. This matters because prior consultants have institutional knowledge. If someone from the new engagement team has never touched this account, they should know who to ask.

### Section 4: Relationship Map

**Source:** `hgrelationship_lookup`, `calls_lookup`, `hguserengagement_lookup`, `sfopportunities_lookup`

Build a contact map by cross-referencing:
- **Gong call attendees** — who shows up, how often, what they talk about
- **People.ai activity** — email/meeting frequency, direction (inbound vs outbound), participant titles
- **Domo user data** — login frequency, role, CXO flag, department, active status
- **SF opportunity contacts** — who owns the deals

For each identified contact, classify:
- **Role type:** Executive Sponsor / Decision Maker / Champion / Technical Lead / End User / Skeptic / Unknown
- **Influence:** HIGH / MEDIUM / LOW
- **Sentiment:** Advocate / Neutral / Skeptic / At Risk / Unknown
- **Engagement frequency:** Weekly / Monthly / Occasional / Dormant
- **Department:** From user engagement data

Flag coverage gaps: departments with Domo users but no one in calls, CXO users who've never been engaged, power users who could be champions.

### Section 5: Enablement Resources

**Source:** `hguserengagement_lookup` (Domo Points, certified users), `hgace_lookup`, `portfolio_lookup` (services fields)

What enablement infrastructure does this account already have?

- **Certified users:** Count and list users with Domo certifications (from Domo Points / dp_2025 field)
- **Education engagement:** Training events attended, Domo University usage
- **ACE engagement:** See Section 5
- **Community participation:** Any evidence of Domo Community usage from user data
- **Self-service maturity:** Ratio of content creators to consumers (from user roles — Privileged/Admin vs Participant)

This tells the engagement team whether the customer can self-serve or needs hand-holding.

### Section 6: ACE Package & Activity

**Source:** `hgace_lookup`, `portfolio_lookup` (Has ACE, hg_acePackage)

- **Has ACE:** Yes/No
- **Package type:** [hg_acePackage]
- **Quarterly allotted hours:** From ACE data
- **Hours used this quarter:** Sum hours from current fiscal quarter
- **Assigned ACE rep:** Name from ACE data
- **Recent ACE activity:** Last 5 ACE interactions (meetings, emails, calls) with dates, topics, and summaries
- **ACE utilization:** Are they using their allotted hours? Under-utilization signals disengagement; over-utilization signals high dependency.

### Section 7: Support Package & Ticket History

**Source:** `portfolio_lookup` (Has Preferred Support, Preferred Support Advisor, support_package), `hgsupport_lookup`

**Support posture:**
- **Package:** [support_package] — Preferred Support / Standard / None
- **Preferred Support Advisor:** [name] if applicable
- **Has Preferred Support:** Yes/No

**Ticket history (last 30 cases):**

| Case # | Priority | Status | Category | Subject | Created | JIRA? |
|--------|----------|--------|----------|---------|---------|-------|

**Analysis:**
- Open case count and severity distribution
- Recurring categories (what keeps breaking?)
- JIRA-linked bugs (active engineering issues)
- Average resolution time trend
- Critical/High priority pattern — is this account escalation-prone?

The engagement team needs to know what's broken before they walk in. Nothing kills credibility faster than proposing new use cases while the existing ones are on fire.

### Section 8: Prior Opportunities & Engagements

**Source:** `sfopportunities_lookup` (all types), `spp_lookup`, `spp_project_assignments_lookup`

**Opportunity history (all time):**

| Opportunity | Type | Stage | ACV | Close Date | Owner | Deal Code |
|-------------|------|-------|-----|------------|-------|-----------|

**SPP engagement history:**
For each engagement (project), show:
- Project name, ID, status (active/inactive)
- Type: PAID / $0 Oppty (investment) / adopt. segment
- Hours purchased vs. hours remaining
- Start date, hub hours expiration
- Consultants assigned (from project assignments) with roles and allocation %
- Task completion status

This is the lineage. The new engagement team needs to understand what PS has delivered before, who did it, and whether the customer got value from it.

### Section 9: Credit Usage & Pacing

**Source:** `portfolio_lookup` (pacing fields), `hgstacked_lookup` (Credit Pacing metric over time)

- **Current pacing:** [% Pacing] — is the customer consuming credits at the expected rate?
- **Pacing trend:** Pull Credit Pacing from hgstacked data and show the 30/60/90-day trajectory
- **Credit grade:** From hggrades (Commercial > Credit Pacing metric)
- **Interpretation:**
  - Over-pacing (>110%): May burn through contract early — discuss with customer
  - On-pace (90-110%): Healthy
  - Under-pacing (<90%): Under-utilization risk — they're paying for capacity they're not using
  - Severe under-pacing (<50%): Red flag — are they using Domo at all?

### Section 10: Health Grade Deep Dive

**Source:** `hggrades_lookup`, `hg_summary_lookup`, `hgstacked_lookup`

**Overall:** [Grade] (GPA: [X.XX])

Show the full health grade breakdown by Health Course:

| Health Course | Metric | Grade | Value | 30d | 90d | 180d |
|---------------|--------|-------|-------|-----|-----|------|
| Commercial | Credit Pacing | | | | | |
| Value Realization | ... | | | | | |
| Relationship | ... | | | | | |
| Education | ... | | | | | |
| Support | ... | | | | | |
| Content Creation | ... | | | | | |
| User Engagement | ... | | | | | |
| Platform Utilization | ... | | | | | |

**Strengths:** Courses grading A/S
**Weaknesses:** Courses grading D/F
**Trending up:** Metrics with improving 90-day trends
**Trending down:** Metrics with declining 90-day trends

**Health narrative:** [From hg_summary_lookup]

### Section 11: Gong Call History

**Source:** `calls_lookup` (last 10 calls)

| Date | Title | Duration | Owner | Key Attendees |
|------|-------|----------|-------|---------------|

For each call, extract from the recap:
- **Topics discussed** — what the customer cares about
- **Commitments made** — promises that need to be honored
- **Pain points raised** — things they're struggling with
- **Sentiment** — tone of the conversation

This is the voice of the customer. A consultant reading these summaries should understand the customer's mindset without having listened to the recordings.

### Section 12: Platform Feature Utilization

**Source:** `hgplatformutilization_lookup`

| Feature | Enabled | Used | Last 30d | Last 60d | Last 90d |
|---------|---------|------|----------|----------|----------|
| Data Science | | | | | |
| Embed | | | | | |
| Jupyter | | | | | |
| Publish | | | | | |
| Everywhere | | | | | |
| [all others] | | | | | |

**PS Opportunities:** Features that are enabled but unused are low-hanging fruit for the engagement. Call them out explicitly — "Embed is enabled but hasn't been used in 90 days. If there's a use case for embedded analytics, this is already licensed."

**Active stack:** Features used in the last 30 days — this is what the customer relies on.

### Section 13: Use Cases & Active Departments

**Source:** `hguserengagement_lookup` (departments, roles), `hgplatformutilization_lookup` (feature usage), `calls_lookup` (topics from recaps), `hgstacked_lookup` (Content Creation metrics), `sfopportunities_lookup` (deal names for scope context)

This section requires synthesis across multiple data sources to infer what the customer is doing with Domo, **mapped to the 8 Domo Umbrella Use Case Categories:**

| # | Umbrella Use Case |
|---|-------------------|
| 01 | Sales Performance & Revenue Optimization |
| 02 | Finance Planning, Budgeting & Reporting |
| 03 | Marketing Attribution & Campaign Optimization |
| 04 | Workflow Automation & Operational Efficiency |
| 05 | Inventory & Supply Chain Visibility |
| 06 | Employee Engagement & Workforce Productivity |
| 07 | Customer Service & Support |
| 08 | Product Performance & User Insights |

**Identified Use Cases table:**

| Use Case | Umbrella Category | Department | Status | Value Pillar |
|----------|-------------------|------------|--------|--------------|
| [name] | [## — Category Name] | [dept] | In-Scope / Signaled / ACE Enabling / Adopted | Cost Savings / Revenue Generation / Risk Mitigation |

Build by cross-referencing:
- **Call recaps:** Mine for mentions of specific projects, dashboards, business processes
- **Opportunity names:** Deal descriptions often name the use case (e.g., "reputation management app")
- **Feature usage:** Embed → customer-facing analytics, Data Science → predictive/ML, Jupyter → advanced analysis
- **Department activity:** Departments with heavy Domo usage = active use cases
- **Content creation signals:** Cards/datasets/dataflows from HG stacked metrics

**Next Best Use Case Bridges:**

After mapping current use cases, identify 2-3 umbrella categories that are NOT yet in-scope but are strongly signaled by:
- The customer's industry profile and business model
- Conversations from Gong calls (topics discussed but not yet built)
- Enabled but unused platform features (e.g., Workflows enabled but not used → Bridge to 04)
- Stakeholders engaged in calls who don't yet have Domo use cases (e.g., COO on calls but no Ops dashboards → Bridge to 05)
- External intelligence (company expanding → supply chain / workforce analytics)

For each bridge, write a 2-3 sentence recommendation explaining: which umbrella category, why it fits this customer, which existing stakeholders or data could bootstrap it, and what value pillar it targets.

These bridges represent the natural expansion path after the current build and feed directly into adoption roadmap planning.

**Active Departments:** Group users by department showing user count, avg login days, and engagement notes. Flag departments involved in calls but with zero Domo users — these are provisioning gaps.

### Section 14: SOW Context & Risk Analysis

**Source:** `sfopportunities_lookup` (active opportunity financials), `spp_lookup` (hours purchased/remaining), `portfolio_lookup` (financial fields)

**Active engagement financials:**
- Total hours purchased across active SPP projects
- Hours remaining
- Hours consumed / burn rate
- Projected completion date at current burn rate
- Contract expiration / hub hours expiration date

**Budget vs. ask risk analysis:**
- Compare the ACV of the current/upcoming opportunity against prior deals. Is the ask growing, shrinking, or flat?
- Compare hours purchased against scope signals from calls. Are they buying enough hours for what they're asking for?
- Flag mismatches: if call recaps reference 5 use cases but hours purchased typically cover 2, that's scope risk.
- Downsell history: if the last renewal was a downsell, the budget envelope is tightening.
- Forecast delta: compare bks_FCST_amount against bks_renewal_baseline_usd. Negative delta = renewal risk.

This gives the engagement team a realistic picture of whether the engagement is adequately funded for the customer's expectations.

### Section 15: Recommended Actions & Signals

**Source:** `actions_lookup`

Pull all active signals and present as:

**De-Risk Actions:**
| Action | Rationale | Urgency | Top Play |
|--------|-----------|---------|----------|

**Growth Actions:**
| Action | Rationale | Urgency | Top Play |
|--------|-----------|---------|----------|

### Section 16: External Intelligence

**Source:** `WebSearch`, `portfolio_lookup` (companyIntel fields)

Run the web research modules (news, financials, job postings, 10-K if public) following the patterns from the web-research skill. Present:

**Recent news (last 90 days):**
- Headline, date, source, and one-sentence summary
- Flag anything that affects the Domo relationship (layoffs, M&A, new CxO, expansion)

**Financial snapshot:**
- Revenue, growth trajectory, profitability
- Public/private status
- Market cap (if public)

**Job posting signals:**
- Are they hiring data/analytics roles? (growth signal)
- Are they hiring for competitive BI tools? (risk signal)
- Headcount trend from portfolio companyIntel fields

**10-K highlights (if public):**
- Strategic priorities relevant to data/analytics
- Risk factors that could affect Domo usage
- Technology mentions

---

## Document Generation

Produce a branded Word document using `templates/brand/Domo Word Doc Template.docx`. Read the `docx` skill and `template-registry` skill for formatting standards.

**Filename:** `[AccountName]-Align-Account-Intel.docx`

**Structure:**
- Title page: "Account Intelligence Dossier — [Account Name]"
- Date, prepared by, classification (Internal — PS Eyes Only)
- Table of Contents (manual — render as numbered list, do NOT use Word's TOC field codes as they don't render in docx-js)
- Section 1: Strategic Summary (synthesized last, placed first)
- Sections 2-16: Deep supporting evidence
- No appendix — the dossier is self-contained

**Brand rules:** Domo Blue (#99CCEE), Open Sans font, use Domo Word Doc Template styles.

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account** and **engagement-observations**, intent: align account intel / dossier.

### After executing
- Call `memory_store_artifact` for **AccountIntelDossier**; `memory_remember` with posture, top risks, and alignment priorities.

---

## Guardrails

- **Never fabricate data.** If a source returns empty, write "No data available — [tool name]" and move on. Partial intel is better than fictional intel.
- **Cite every data point's source tool.** The reader should be able to trace any number back to its origin dataset.
- **Trends matter more than snapshots.** Always include 30/90/180-day trends where available. A B-grade account that was an A three months ago tells a very different story than one that's been B for a year.
- **Flag data freshness.** If the last Gong call is >30 days old, say so. If SPP data looks stale, say so. The engagement team needs to know what's current and what's not.
- **The SOW risk section must be honest.** If hours don't match scope expectations, say it plainly. The engagement team needs to negotiate scope early, not discover the gap mid-project.
- **External research must cite sources.** Every web-sourced claim needs a URL or source name.
- **Don't editorialize beyond the data.** The Strategic Summary should be driven by patterns in the data, not opinion. "Credit pacing at 45% suggests under-utilization" is good. "They clearly don't care about Domo" is not.
- **Respect copyright.** Summarize external sources. No long quotes.

---

## Related Skills

- **Account 360** — Lighter-weight snapshot; use when you need quick context, not a full dossier
- **Relationship Map** — Deeper relationship analysis; this skill includes a relationship section but the dedicated skill produces richer per-person profiles
- **Kickoff Brief** — Downstream consumer of this dossier; uses the intel to structure the kickoff meeting
- **Web Research** — The external intelligence patterns come from this skill
- **Template Registry** — Brand standards and template selection
