---
name: ps-current-state-assessment
tier: 1
description: "Document a customer's current state — tech stack, data landscape, existing analytics maturity, and operational workflows — to establish the baseline before designing a Domo solution. Use this skill whenever someone says: 'current state assessment', 'current state', 'as-is assessment', 'tech stack review', 'data landscape assessment', 'what tools are they using', 'baseline assessment', 'environment assessment', 'existing analytics review', 'maturity assessment', 'what does their data stack look like', or any request to understand a customer's existing data/analytics/BI environment. Also trigger on 'gap analysis' when in a PS or pre-engagement context. This is part of the PS Discover phase."
maturity: alpha
audience: [delivery]
---

# PS Current State Assessment

You are helping a Domo Professional Services team member document a customer's current state — their technology landscape, data maturity, operational workflows, and pain points — to establish a clear baseline before designing the Domo solution. This assessment becomes the "before" picture that makes the "after" (with Domo) tangible and measurable.

## Why Current State Matters

You can't prove value without a baseline. If you don't document what "today" looks like — the hours wasted, the tools sprawled across departments, the decisions delayed — you can't credibly say "Domo saved you X." The Current State Assessment is the foundation for every ROI calculation and value conversation that follows.

## How to Use This Skill

### Step 1: Gather Intelligence

Combine data from multiple sources:

- **Compass** — `portfolio_lookup` for account health, ARR, existing Domo usage indicators; `hggrades_lookup` for Platform Utilization, User Engagement, and Education scores
- **Platform Utilization** — `hgplatformutilization_lookup` for feature-level data: which Domo features (Data Science, Embed, Jupyter, Everywhere, etc.) are enabled vs. actually used, with 30/60/90-day recency. This is the most important data source for understanding what the customer has vs. what they could be doing.
- **User Engagement** — `hguserengagement_lookup` for individual user data: login patterns, roles, titles, departments, CXO flags, active/inactive status. Populates "Who uses Domo today?" and informs Data Accessibility and Data Literacy maturity scores.
- **Support Cases** — `hgsupport_lookup` for recent support case volume, priorities, and categories — reveals operational pain points and areas where the customer is struggling.
- **ACE Activity** — `hgace_lookup` for adoption consulting activity if the customer has ACE — shows what adoption work has already been done and prevents duplicate discovery.
- **Gong calls** — `calls_lookup` for mentions of tools, frustrations, processes
- **Customer interview** — direct questions from the Discovery Questionnaire
- **Google Drive** — search for any existing SOWs, proposals, or technical documentation
- **Ask the user** — "What have you learned so far about their environment?"

### Step 2: Document the Current State

Structure the assessment across these dimensions:

#### 2a: Analytics & BI Tool Inventory

| Tool | Department(s) | # Users | Annual Cost | Primary Use | Pain Points |
|---|---|---|---|---|---|
| e.g., Tableau | Finance, Marketing | 45 | $135K | Monthly reporting | Slow, requires IT for changes |
| e.g., Excel | Everyone | 200+ | (included in O365) | Ad-hoc analysis | Version control nightmare, no governance |
| e.g., Power BI | Sales Ops | 20 | $48K | Pipeline dashboards | Can't connect to all data sources |

**Calculate tool consolidation value:**
> "Consolidating Tableau ($135K) and Power BI ($48K) into Domo = $183K/year in licensing savings, plus reduced admin overhead of ~0.5 FTE ($60K) = **$243K total annual savings**"

#### 2b: Data Source Inventory

| Data Source | Type | How Data Moves Today | Frequency | Owner | Domo Connector Available? |
|---|---|---|---|---|---|
| Salesforce | CRM | Manual CSV export | Weekly | Sales Ops | Yes — native connector |
| SAP | ERP | Custom ETL scripts | Nightly | IT | Yes — native connector |
| Google Sheets | Spreadsheet | Email attachments | Ad-hoc | Various | Yes — native connector |
| Internal DB | PostgreSQL | Direct queries | Real-time | Data Eng | Yes — native connector |

**Calculate data pipeline value:**
> "Replacing 3 custom ETL scripts (each requiring ~5 hours/month of maintenance by a $75/hr data engineer) = **$13,500/year in recovered engineering time**"

#### 2b+: Domo Feature Utilization [when hgplatformutilization_lookup available]

Pull `hgplatformutilization_lookup(account_name)` and map each feature:

| Feature | Enabled | Used | Used Last 30d | Opportunity |
|---------|---------|------|---------------|-------------|
| Data Science | [Yes/No] | [Yes/No] | [Yes/No] | [If enabled but unused: "Licensed but not activated — PS can enable"] |
| Embed | ... | ... | ... | ... |
| Jupyter | ... | ... | ... | ... |
| Everywhere | ... | ... | ... | ... |
| Publish | ... | ... | ... | ... |

**Enabled but unused features** represent immediate PS opportunities — the customer is paying for capabilities they aren't leveraging.

#### 2c: Analytics Maturity Assessment

Rate the customer on a 1-5 scale across these dimensions (use `hguserengagement_lookup` data for Data Accessibility and Data Literacy scoring):

| Dimension | Score (1-5) | Current State | Domo Opportunity |
|---|---|---|---|
| **Data Accessibility** | | Who can access data? Is it self-service or IT-gated? | Domo democratizes access — every user gets self-service |
| **Data Freshness** | | Real-time, daily, weekly, monthly? | Domo enables real-time with 1,000+ connectors |
| **Data Governance** | | Is there a single source of truth? Version control? | Domo's governance layer: certified datasets, lineage, RBAC |
| **Decision Speed** | | How fast can a question turn into an answer? | Domo: seconds. Not days waiting for IT. |
| **Data Literacy** | | How comfortable are users with data? | Domo's low-code/no-code interface lowers the bar |
| **Automation** | | Are alerts, workflows, and actions automated? | Domo's workflow automation and alerts engine |

#### 2d: Operational Workflow Mapping

For each key process the customer described:

- **Process name**: e.g., "Monthly Financial Close Reporting"
- **Current steps**: List the manual steps (data pull → transform → validate → create report → distribute)
- **Time per cycle**: e.g., "3 analysts × 40 hours each = 120 hours/month"
- **Frequency**: Monthly, weekly, daily
- **Pain points**: Where does it break? What causes delays?
- **Domo replacement**: How Domo automates or streamlines this

**Calculate process automation value:**
> "Monthly close reporting currently takes 120 analyst hours/month. At a blended rate of $59/hr, that's $84,960/year. Domo automates 80% of this → **$67,968/year in savings** plus close happens 10 days faster."

### Step 3: Identify Gaps and Opportunities

Based on the current state, surface:

1. **Quick Wins** — Things Domo can solve in the first 30 days with immediate, visible value. These are critical for building momentum and converting skeptics.
2. **High-Value Opportunities** — Larger initiatives that require more planning but deliver transformational value
3. **Risk Areas** — Technical or organizational challenges that need to be addressed (e.g., data quality issues, change management, IT resistance)

### Step 4: Build the Value Summary

Create a summary table that rolls up all the value identified:

| Value Category | Opportunity | Annual Value | Confidence | Timeline |
|---|---|---|---|---|
| **Cost Savings** | Tool consolidation | $243,000 | High | 90 days |
| **Cost Savings** | FTE reallocation (3 analysts) | $360,000 | Medium | 6 months |
| **Cost Savings** | ETL maintenance reduction | $13,500 | High | 60 days |
| **Revenue Generation** | Faster sales pipeline visibility | $500K+ pipeline acceleration | Medium | 90 days |
| **Risk Mitigation** | Compliance reporting automation | Avoid $100K+ in audit penalties | High | 120 days |
| | **Total Identified Value** | **$1.2M+** | | |

Frame the total: "Based on our current state assessment, we've identified over $1.2M in annual value across Cost Savings, Revenue Generation, and Risk Mitigation — with quick wins achievable within the first 90 days."

### Step 5: Like-Customer Benchmarking

Before generating the final output, research and include a "Like Customers" section that shows existing Domo customers in the same or adjacent industries. This builds credibility and gives the customer a concrete picture of what success looks like.

#### How to Find Like Customers

1. **Compass portfolio search** — Use `portfolio_search` to find accounts in the same industry vertical:
   - `WHERE bks_industry LIKE '%Transportation%'` (match by industry)
   - `WHERE bks_segment LIKE '%Enterprise%'` (match by size/segment)
   - Look for accounts with health grades of A or B as success stories

2. **Compass deep dives** — For each match, pull:
   - `portfolio_lookup` — ARR, health grade, renewal status, services engagement, CSM
   - `hggrades_lookup` — Platform Utilization, User Engagement, Content Creation, Education scores (these tell the adoption story)
   - `spp_lookup` — Hours consumed, project types, engagement depth
   - `calls_lookup` — Recent call recaps for qualitative success signals

3. **Web research** — Search for public Domo case studies, press releases, or customer stories in the same industry:
   - Published ROI numbers
   - Named customer testimonials
   - Industry-specific use cases highlighted by Domo marketing

4. **Common Room** — If available, check for community activity from companies in the same vertical

#### What to Include

For each like customer (aim for 2-4), document:

| Field | Description |
|---|---|
| **Company** | Name (anonymize if needed — e.g., "Fortune 500 Transportation Company") |
| **Industry Match** | How they're similar to this prospect (size, vertical, challenges) |
| **Domo Journey** | When they started, what they built first, how they expanded |
| **Key Use Cases** | What they use Domo for (fleet analytics, workforce dashboards, compliance, etc.) |
| **Adoption Metrics** | User count, content created, engagement scores from Compass |
| **Realized Value / ROI** | Quantified outcomes — hours saved, FTEs reallocated, decisions accelerated, risks mitigated |
| **Lessons Learned** | What worked well, what they'd do differently |

Frame each like customer through the three value pillars:
> "Like Customer X, a $500M transportation company, deployed Domo for fleet safety and workforce analytics. Within 6 months they automated 80% of manual reporting (Cost Savings: $280K/yr), gained real-time visibility into driver retention (Revenue Gen: retained 3 at-risk contracts worth $2M), and automated DOT compliance tracking (Risk Mitigation: eliminated $150K in penalty exposure)."

**Important**: If Compass returns no strong matches in the exact industry, broaden to adjacent verticals (logistics, fleet management, field services, multi-location operations) or match on operational characteristics (high employee count, multi-brand, acquisition-driven growth, distributed operations).

**Confidentiality note**: Always check whether customer names can be shared externally. When in doubt, anonymize: "A leading [industry] company with [size] employees."

### Step 6: Generate the Output

**⚠️ MANDATORY: Use Branded Templates for All Document Output**

All documents MUST use the official Domo branded templates. Documents without proper branding will not be accepted by leadership. **Open Sans font is critical for brand compliance.**

**For Word documents (.docx):**
- Template path: `templates/brand/Domo Word Doc Template.docx`
- **NEVER create documents from scratch using docx-js or python-docx. ALWAYS start from the branded template.**
- Workflow: Unpack template → edit XML → repack:
  1. `python scripts/office/unpack.py "templates/brand/Domo Word Doc Template.docx" unpacked/`
  2. Edit `unpacked/word/document.xml` — use the template's built-in styles:
     - `DomoHeader1` for section headers (large, branded blue)
     - `DomoQuestion` for subheaders (dark, bold)
     - `DomoAnswers` for body text (**Open Sans** font — automatically applied by this style)
  3. Preserve the cover page image paragraph and branded headers/footers
  4. Fix any broken references (e.g., `attachedTemplate` pointing to local paths — remove the reference from both `settings.xml` and `word/_rels/settings.xml.rels`)
  5. `python scripts/office/pack.py unpacked/ output.docx --original "templates/brand/Domo Word Doc Template.docx"`

**For PowerPoint presentations (.pptx):**
- Template path: `templates/brand/24_12_13 Powerpoint template.potx`
- Use the PPTX skill's unpack → edit → repack workflow
- Preserve slide masters, layouts, and branded elements

Include in the assessment:
1. Executive summary (1 paragraph)
2. Company profile
3. Tool inventory with cost analysis
4. Data source inventory with connector mapping
5. Maturity scorecard
6. Operational workflow analysis with time/cost calculations
7. **Like-customer benchmarking** (2-4 comparable Domo customers with adoption journey and realized ROI)
8. Value summary table
9. Gaps and opportunities (quick wins, high-value, risk areas)
10. Recommended next steps (feeds into Align phase)

### Value Calculation Quick Reference

| Scenario | Formula | Example |
|---|---|---|
| Manual hours saved | `hours/week × rate × 52` | 10 hrs/wk × $59/hr × 52 = $30,680/yr |
| FTE replacement | `headcount × fully_loaded_salary` | 3 × $120,000 = $360,000/yr |
| Tool consolidation | `sum of replaced license costs + admin overhead` | $183K licenses + $60K admin = $243K/yr |
| Faster decision cycle | `revenue_at_risk × days_saved / cycle_days` | Qualitative or scenario-based |
| Compliance automation | `audit_penalty_risk + manual_compliance_hours × rate` | $100K risk + $40K labor = $140K/yr |
| Data engineering savings | `pipeline_maintenance_hours × engineer_rate × 12` | 15 hrs/mo × $75/hr × 12 = $13,500/yr |

### Role-Based Salary Benchmarks

| Role | Base Salary | Fully Loaded (1.3x) | Hourly Rate |
|---|---|---|---|
| Analyst / Specialist | $75,000 | $97,500 | $47/hr |
| Senior Analyst / Manager | $95,000 | $123,500 | $59/hr |
| Director | $130,000 | $169,000 | $81/hr |
| VP / Executive | $180,000 | $234,000 | $113/hr |
| Data Engineer | $120,000 | $156,000 | $75/hr |
| IT Admin | $85,000 | $110,500 | $53/hr |

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account, `engagement-observations`, StakeholderMap from `engagement-artifacts`); use `memory_bundle` as needed.
### After executing
- Call `memory_remember` with baseline and gap highlights scoped to `{account_id}`.
- Call `memory_store_artifact` for the CurrentStateAssessment in `engagement-artifacts`.
