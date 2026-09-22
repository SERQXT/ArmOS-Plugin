---
name: ps-use-case-inventory
tier: 1
description: "Capture, prioritize, and value-score use cases for a Domo PS engagement. Each use case gets a business case tied to Cost Savings, Revenue Generation, or Risk Mitigation with real dollar estimates. Use this skill whenever someone says: 'use case inventory', 'use case prioritization', 'rank the use cases', 'value score use cases', 'which use cases should we build first', 'use case list', 'use case backlog', 'what should we build', 'prioritize the build', 'scope the use cases', 'business case for use cases', 'ROI for use cases', or any request to list, rank, or value-justify what to build in a Domo engagement. Also trigger on 'what dashboards should we build' or 'what apps should we create'. This is part of the PS Discover phase."
maturity: alpha
audience: [delivery, intelligence]
---

# PS Use Case Inventory & Value Calculator

You are helping a Domo Professional Services team member capture, prioritize, and build business cases for the use cases identified during Discovery. Every use case needs a clear "why" — framed in dollars and tied to Cost Savings, Revenue Generation, or Risk Mitigation — so the customer and the PS team can make smart decisions about what to build first.

## Why This Matters

Without a prioritized, value-scored use case inventory, engagements devolve into "build whatever the loudest stakeholder wants." That leads to scope creep, budget overruns, and — worst of all — use cases that don't get adopted because they weren't solving the right problem for the right people.

## The 8 Domo Umbrella Use Cases

Every use case identified during Discovery must be mapped to one of Domo's 8 Umbrella Use Cases. These are the primary categories that Domo delivers value across all customers and industries. Use them as the organizing framework when inventorying, presenting, and prioritizing use cases with the customer.

When a customer describes a need, your first job is to classify it under the right Umbrella. Then drill into the specific sub use case. This ensures consistency across engagements, makes it easier to reference like-customer success stories, and aligns the PS team's language with Domo's go-to-market messaging.

---

### Umbrella 1: Sales Performance & Revenue Optimization

**What it is**: Turn pipeline, quota, pricing, and POS data into real-time insights that boost win-rates, lift same-store sales, and protect margin.

**Who cares**: CRO, VP Sales, Sales Ops, Revenue Ops, Regional/District Managers, Store Managers

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Pipeline Visibility & Forecasting** | Real-time pipeline by stage, rep, region, product. Replace spreadsheet-based forecasting with live data. | CRM (Salesforce, HubSpot, Dynamics), ERP | Revenue Gen | "$50M pipeline × 2% win-rate improvement from faster action = $1M/yr" |
| **Quota Attainment & Rep Performance** | Track quota attainment by rep/team/region in real-time. Identify coaching opportunities and top-performer patterns. | CRM, HR/Comp systems | Revenue Gen | "5% improvement in bottom-quartile rep performance on $20M territory = $250K/yr" |
| **Deal Velocity & Stage Conversion** | Measure time-in-stage, conversion rates, deal aging. Surface stalled deals before they die. | CRM | Revenue Gen | "Reducing average sales cycle by 5 days on $10M quarterly bookings = $200K accelerated" |
| **POS & Same-Store Sales Analytics** | Real-time point-of-sale data across locations. Compare store performance, identify trends, optimize pricing. | POS systems, ERP, inventory | Revenue Gen / Cost Savings | "2% margin protection across $100M retail revenue = $2M/yr" |
| **Pricing & Discount Analytics** | Analyze discount patterns, margin erosion, pricing effectiveness by segment/product/rep. | CRM, ERP, billing | Cost Savings | "Reducing unnecessary discounting by 3% on $30M annual deals = $900K margin recovery" |
| **Territory & Account Planning** | Data-driven territory balancing and account prioritization. Whitespace analysis. | CRM, firmographic data, usage data | Revenue Gen | "Identifying $5M in whitespace across existing accounts" |
| **Sales & Marketing Alignment** | Connect marketing-sourced leads through pipeline to closed revenue. Attribution by campaign and channel. | CRM, MAP (Marketo, HubSpot), ad platforms | Revenue Gen | "Reallocating $500K marketing spend from underperforming to top channels" |

**Quick Win Opportunity**: Pipeline Visibility Dashboard — connects to CRM in days, immediate exec value, high visibility.

---

### Umbrella 2: Finance Planning, Budgeting & Reporting

**What it is**: Automate close, consolidate data, and model scenarios so finance teams can steer cash flow and profitability with agility.

**Who cares**: CFO, VP Finance, Controller, FP&A, Accounting, Treasury

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Automated Financial Close & Reporting** | Reduce monthly/quarterly close cycle. Automate data consolidation from multiple entities, currencies, or ERPs. | ERP (SAP, Oracle, NetSuite, Workday Financials), GL | Cost Savings | "Reducing close from 15 days to 5 days. 3 FTEs × 10 days saved × $81/hr = $194K/yr" |
| **Budget vs. Actual Tracking** | Real-time BvA by department, cost center, project. Automated variance alerts. | ERP, budgeting tools, spreadsheets | Cost Savings | "Catching budget overruns 2 weeks earlier. Average overrun prevented: $50K × 6/yr = $300K" |
| **Cash Flow Forecasting** | Rolling cash flow projections combining AR, AP, payroll, and revenue forecasts. | ERP, banking APIs, CRM (pipeline data) | Risk Mitigation | "Avoiding 2 cash crunches/year that previously required $500K emergency credit line" |
| **Profitability Analysis** | Margin analysis by product, customer, segment, geography. Identify unprofitable accounts or SKUs. | ERP, CRM, cost allocation models | Revenue Gen / Cost Savings | "Identifying $2M in below-margin accounts for repricing or exit" |
| **Expense Management & Spend Analytics** | Track and categorize spend across departments, vendors, and categories. Surface anomalies. | ERP, expense systems (Concur, Expensify), P-card data | Cost Savings | "Identifying $200K in redundant vendor spend and $75K in policy violations" |
| **Investor & Board Reporting** | Automated board-ready dashboards and data packs. KPI tracking against investor commitments. | ERP, CRM, HR, operational systems | Cost Savings / Risk Mitigation | "Eliminating 80 hours/quarter of manual board prep at $81/hr = $26K/yr" |
| **Revenue Recognition & ASC 606** | Automated rev rec calculations and compliance reporting. | ERP, billing, contract management | Risk Mitigation | "Avoiding $200K+ in audit findings from manual rev rec errors" |

**Quick Win Opportunity**: Budget vs. Actual Dashboard — high demand from every CFO, straightforward data, immediate adoption.

---

### Umbrella 3: Marketing Attribution & Campaign Optimization

**What it is**: Connect ad, web, and CRM signals to prove ROI, fine-tune spend, and personalize outreach.

**Who cares**: CMO, VP Marketing, Demand Gen, Digital Marketing, Marketing Ops, Content Marketing

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Multi-Touch Attribution** | Connect marketing touchpoints to pipeline and revenue. Understand which campaigns, channels, and content drive deals. | MAP (Marketo, HubSpot, Pardot), CRM, ad platforms, web analytics | Revenue Gen | "Reallocating 20% of $2M ad spend from low-attribution to high-attribution channels = $400K more pipeline" |
| **Campaign Performance Dashboard** | Real-time campaign metrics: spend, impressions, clicks, MQLs, SQLs, pipeline, closed-won. By channel and campaign. | Ad platforms (Google, Meta, LinkedIn), MAP, CRM | Cost Savings / Revenue Gen | "Pausing underperforming campaigns saves $150K/yr in wasted spend" |
| **Marketing Spend Optimization** | ROI by channel, CPA by segment, budget allocation modeling. | Ad platforms, MAP, finance/budget data | Cost Savings | "Reducing CAC by 15% across $3M annual spend = $450K savings" |
| **Lead Scoring & Routing** | Data-driven lead scoring combining behavioral, firmographic, and intent signals. Automated routing to sales. | MAP, CRM, intent data (Bombora, G2), web analytics | Revenue Gen | "Improving MQL-to-SQL conversion by 10% on 5,000 MQLs = 500 additional SQLs" |
| **Content Performance Analytics** | Measure content engagement, consumption patterns, and impact on pipeline. | CMS, MAP, web analytics, CRM | Revenue Gen | "Identifying top-converting content to double investment → 20% more pipeline from content" |
| **Web & Digital Analytics** | Unified view of website traffic, conversion funnels, SEO performance, and user journeys. | Google Analytics, Search Console, CMS, A/B testing tools | Revenue Gen | "Improving website conversion rate by 0.5% on 500K monthly visitors = 2,500 more leads/month" |
| **Account-Based Marketing (ABM)** | Track engagement across target accounts. Coordinate marketing and sales touches. Measure account penetration. | ABM platform (6sense, Demandbase), CRM, MAP, ad platforms | Revenue Gen | "Increasing target account engagement by 30% → 15% more enterprise pipeline" |

**Quick Win Opportunity**: Campaign Performance Dashboard — marketing teams are data-hungry, ad platform connectors are fast to set up.

---

### Umbrella 4: Workflow Automation & Operational Efficiency

**What it is**: Replace manual tasks with event-based triggers, bots, and alerts to cut cost and error.

**Who cares**: COO, VP Operations, IT, Process Owners, Department Heads across the org

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Automated Alert & Escalation Workflows** | Real-time alerts on KPI breaches, SLA violations, anomalies. Auto-escalation chains. | Any operational data source | Cost Savings / Risk Mitigation | "Catching exceptions 48 hours faster prevents $25K average incident cost × 12/yr = $300K" |
| **Manual Report Elimination** | Replace recurring Excel/email reports with live Domo dashboards and scheduled distributions. | Multiple source systems, email | Cost Savings | "Eliminating 15 manual reports × 4 hrs each × monthly × $59/hr = $42,480/yr" |
| **Cross-System Process Orchestration** | Connect systems that don't talk to each other. Trigger actions in one system based on events in another. | ERP, CRM, HRIS, ticketing, custom APIs | Cost Savings | "Eliminating 2 FTEs of manual data entry between systems = $240K/yr" |
| **Approval & Routing Workflows** | Automate approval chains (expense approvals, deal desk, change requests) with data-driven routing. | ERP, CRM, HR, custom forms | Cost Savings | "Reducing approval cycle time by 3 days × 500 requests/year = 1,500 business days recovered" |
| **Data Quality & Exception Management** | Automated data validation rules, anomaly detection, and exception queues. | Any data source | Risk Mitigation | "Preventing 3 data-driven errors/yr averaging $50K impact = $150K" |
| **Executive Briefing Automation** | Auto-generated daily/weekly executive briefings pulling from multiple systems. | CRM, ERP, HR, operations, marketing | Cost Savings | "Eliminating 10 hrs/week of executive briefing prep across 3 people = $92K/yr" |
| **SLA Monitoring & Compliance** | Real-time SLA tracking with automated alerts when approaching breach thresholds. | Ticketing, operations, contracts | Risk Mitigation | "Preventing SLA breaches that carry $10K penalty × 20 potential/yr = $200K risk reduction" |

**Quick Win Opportunity**: Manual Report Elimination — every company has 10+ recurring reports that can go live in Domo in days.

---

### Umbrella 5: Inventory & Supply Chain Visibility

**What it is**: Use real-time demand, logistics, and IoT data to balance stock, avoid outages, and shrink carrying costs.

**Who cares**: VP Supply Chain, Procurement, Warehouse/Distribution, Logistics, Demand Planning

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Real-Time Inventory Tracking** | Live inventory levels across warehouses, stores, and in-transit. Unified view replacing spreadsheets. | ERP, WMS, POS, IoT sensors | Cost Savings | "Reducing excess inventory by 10% on $20M average stock = $2M freed capital + $300K carrying cost savings" |
| **Demand Forecasting & Planning** | Data-driven demand forecasts combining historical sales, seasonality, promotions, and external signals. | ERP, POS, marketing calendar, weather APIs | Revenue Gen / Cost Savings | "Reducing stockouts by 15% on $50M product line = $750K in recovered sales" |
| **Supplier Performance & Procurement** | Track supplier on-time delivery, quality, cost trends. Identify risk and negotiate with data. | ERP, procurement systems, supplier portals | Cost Savings | "Identifying 5% cost reduction opportunity across $10M in supplier spend = $500K" |
| **Logistics & Shipping Analytics** | Route optimization, carrier performance, shipping cost analysis, delivery time tracking. | TMS, carrier APIs, GPS/telematics | Cost Savings | "Reducing shipping costs by 8% on $5M annual freight = $400K" |
| **Warehouse Operations** | Pick/pack/ship efficiency, labor utilization, throughput tracking, dock scheduling. | WMS, labor management, IoT | Cost Savings | "Improving warehouse labor utilization by 12% across 100 FTEs = $360K" |
| **Quality & Defect Tracking** | Track defect rates, root causes, vendor quality, return rates. | QMS, ERP, customer returns data | Risk Mitigation / Cost Savings | "Reducing return rate by 2% on $30M product line = $600K savings" |
| **Fleet & Asset Management** | Vehicle/asset utilization, maintenance scheduling, lifecycle cost tracking. | Fleet management, telematics, ERP | Cost Savings | "Extending asset lifecycle by 15% on $5M fleet = $750K deferred capital" |

**Quick Win Opportunity**: Inventory Dashboard — connects to ERP, immediate visibility, high executive interest.

---

### Umbrella 6: Employee Engagement & Workforce Productivity

**What it is**: Measure sentiment, skills, and output to boost retention and high-value work time.

**Who cares**: CHRO, VP HR, Talent Acquisition, L&D, HR Business Partners, Department Heads

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Workforce Analytics & Headcount Planning** | Real-time headcount, org structure, FTE tracking. Plan hiring against growth targets. | HRIS (Workday, BambooHR, ADP), finance/budget | Cost Savings | "Reducing time-to-hire by 10 days across 200 annual hires = 2,000 days of productivity recovered" |
| **Turnover & Retention Analysis** | Track attrition by department, role, tenure, manager. Predict flight risk. Surface drivers of turnover. | HRIS, engagement surveys, exit interviews | Cost Savings | "Reducing turnover by 5% on 1,000 employees (avg replacement cost $15K) = $750K" |
| **Employee Engagement & Sentiment** | Aggregate engagement survey data, eNPS trends, pulse check results. Identify hot spots. | Survey tools (Qualtrics, Culture Amp, Glint), HRIS | Risk Mitigation | "Improving engagement in bottom-quartile teams prevents $200K in turnover costs" |
| **DEI & Compliance Reporting** | Track diversity metrics, pay equity, EEO compliance. Automated regulatory reporting. | HRIS, comp systems, applicant tracking | Risk Mitigation | "Automated EEO-1 and pay equity reporting. Avoiding $100K+ in compliance penalties" |
| **Learning & Development ROI** | Track training completion, skill development, certification status. Measure L&D impact on performance. | LMS (Cornerstone, LinkedIn Learning), HRIS, performance | Revenue Gen | "Upskilled team closes 10% more deals → $500K additional revenue" |
| **Compensation & Benefits Analytics** | Total comp analysis, benefits utilization, market benchmarking. | HRIS, comp tools, benefits admin, market data | Cost Savings | "Optimizing benefits selection based on utilization data saves $200K/yr" |
| **Recruiting Funnel & TA Analytics** | Track sourcing effectiveness, time-to-fill, offer acceptance rate, cost-per-hire by channel. | ATS (Greenhouse, Lever, iCIMS), HRIS | Cost Savings | "Reducing cost-per-hire by 20% across 300 hires at $5K avg = $300K" |

**Quick Win Opportunity**: Turnover Dashboard — every CHRO wants this, HRIS connector is quick, data is clean.

---

### Umbrella 7: Customer Service & Support

**What it is**: Track case volume, SLA adherence, and sentiment to elevate CX and reduce churn.

**Who cares**: VP Customer Success, VP Support, Contact Center Director, CX, Customer Ops

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Support Ticket Analytics** | Volume, resolution time, CSAT by channel/agent/product/priority. Trend analysis and capacity planning. | Ticketing (Zendesk, ServiceNow, Freshdesk, Salesforce Service Cloud) | Cost Savings | "Reducing average resolution time by 15% saves 3,000 agent hours/yr = $141K" |
| **SLA & Response Time Monitoring** | Real-time SLA tracking with alerts on approaching breaches. Historical SLA compliance reporting. | Ticketing, contracts | Risk Mitigation | "Preventing SLA breach penalties: $5K per breach × 30 potential breaches = $150K" |
| **Customer Health Scoring** | Composite health score combining support tickets, product usage, NPS, engagement, billing. Predict churn. | CRM, ticketing, product analytics, NPS, billing | Revenue Gen | "Identifying and saving 5 at-risk accounts worth $2M ARR. 50% save rate = $1M retained" |
| **Contact Center Performance** | Agent productivity, handle time, first-call resolution, queue management, staffing optimization. | Contact center platform (Five9, Nice, Genesys), HRIS | Cost Savings | "Optimizing staffing with data reduces overtime by 20% = $200K savings on $1M labor" |
| **Voice of Customer (VoC) Analytics** | Aggregate NPS, CSAT, CES scores with qualitative feedback themes. Tie sentiment to product/feature. | Survey tools, support tickets, social, review sites | Revenue Gen / Risk Mitigation | "Addressing top 3 detractor themes improves NPS by 10 points → 5% higher retention" |
| **Self-Service & Deflection Analytics** | Track knowledge base effectiveness, chatbot deflection rates, self-service adoption. | KB analytics, chatbot platform, ticketing | Cost Savings | "Increasing self-service deflection by 10% on 50K annual tickets × $15/ticket = $75K" |
| **Escalation & Churn Risk Tracking** | Track escalation patterns, identify customers at risk of churn based on support interactions. | Ticketing, CRM, billing | Revenue Gen | "Early churn detection saves $500K in at-risk renewals annually" |

**Quick Win Opportunity**: Support Ticket Dashboard — Zendesk/ServiceNow connectors are fast, support leaders want this yesterday.

---

### Umbrella 8: Product Performance & User Insights

**What it is**: Mine in-app telemetry and feedback to guide roadmap and speed releases.

**Who cares**: CPO, VP Product, Product Managers, UX Research, Engineering Leadership

**Sub Use Cases**:

| Sub Use Case | Description | Typical Data Sources | Value Pillar | Example Value Calculation |
|---|---|---|---|---|
| **Product Usage & Adoption Analytics** | Track feature usage, user journeys, activation rates, stickiness metrics. | Product analytics (Mixpanel, Amplitude, Pendo, Heap), backend logs | Revenue Gen | "Improving activation rate by 5% on 10,000 trial users × $10K ACV = $5M pipeline" |
| **Feature Performance & ROI** | Measure engagement and business impact per feature. Inform build/kill/invest decisions. | Product analytics, CRM, support tickets | Revenue Gen / Cost Savings | "Sunsetting 3 low-usage features saves $200K/yr in maintenance" |
| **Release & Deployment Tracking** | Track release cadence, deployment success rate, rollback frequency, change failure rate. | CI/CD (Jenkins, GitHub Actions), monitoring | Risk Mitigation | "Reducing deployment failures by 30% prevents 10 incidents × $25K avg cost = $250K" |
| **User Feedback & Sentiment Analysis** | Aggregate feedback from in-app surveys, support, social, app store reviews. Theme extraction and trend tracking. | In-app surveys, support tickets, app stores, social | Revenue Gen | "Prioritizing top 5 requested features increases retention by 3% on $20M ARR = $600K" |
| **Conversion Funnel Optimization** | Track trial-to-paid, free-to-premium, onboarding completion, and activation funnels. | Product analytics, billing, CRM | Revenue Gen | "Improving trial-to-paid conversion by 2% on 5,000 trials × $12K ACV = $1.2M" |
| **Engineering Velocity & Quality** | Sprint velocity, cycle time, bug rate, technical debt metrics. Inform planning and resourcing. | Jira, GitHub, CI/CD, monitoring | Cost Savings | "Reducing bug escape rate by 25% saves 500 engineering hours/yr = $75K" |
| **Customer Segmentation & Cohort Analysis** | Segment users by behavior, plan, industry, size. Analyze cohort retention, expansion, and health. | Product analytics, CRM, billing | Revenue Gen | "Identifying expansion-ready cohort worth $3M in upsell pipeline" |

**Quick Win Opportunity**: Product Usage Dashboard — product teams are starved for data, immediate adoption, drives roadmap decisions.

---

## How to Use This Skill

### Step 1: Gather Use Cases

Collect use cases from:
- **Discovery Questionnaire** responses
- **Gong calls** — `calls_lookup` for specific asks and pain points mentioned
- **Compass** — `actions_lookup` for recommended actions; `hggrades_lookup` for weak areas that suggest use case opportunities
- **Platform utilization** — `hgplatformutilization_lookup` for features enabled but unused. Each unused feature suggests use cases: "Data Science enabled but unused" → Umbrella 8 (AI/ML) opportunities. "Domo Everywhere enabled but unused" → Umbrella 7 (Embedded Analytics) opportunities.
- **User engagement** — `hguserengagement_lookup` for user role/department distribution. Departments with zero or few Domo users are untapped audiences for new use cases. "Finance has 12 active users, Marketing has 0" → Marketing use cases are whitespace.
- **Stakeholder Map** — what each stakeholder said they care about
- **Current State Assessment** — workflow bottlenecks and tool gaps identified
- **Ask the user** — "What use cases came up in your discovery calls?"

### Step 2: Classify Under Umbrellas

For every use case gathered, map it to one of the 8 Umbrella Use Cases above. If a use case spans multiple umbrellas (e.g., "Sales and Marketing alignment" touches both Umbrella 1 and 3), assign it to the primary umbrella and note the secondary.

Use the sub use case tables to find the closest match. If a customer describes something that doesn't perfectly match a sub use case, map it to the closest one and customize the description.

**Pro tip**: When presenting to the customer, organize the inventory by Umbrella. This shows breadth of value and helps stakeholders from different departments see their priorities reflected.

### Step 3: Define Each Use Case

For every use case, capture:

| Field | Description |
|---|---|
| **Use Case Name** | Clear, descriptive name (e.g., "Executive Revenue Dashboard", "Supply Chain Inventory Tracker") |
| **Umbrella** | Which of the 8 Umbrella Use Cases this falls under |
| **Sub Use Case** | Which specific sub use case from the Umbrella tables |
| **Business Problem** | What problem does this solve? In the customer's words. |
| **Primary Audience** | Who will use this? (role, department, # of users) |
| **Value Pillar** | Cost Savings, Revenue Generation, Risk Mitigation, or multiple |
| **Data Sources Required** | What connectors/data feeds are needed? |
| **Complexity** | Low (1-2 weeks) / Medium (3-4 weeks) / High (5+ weeks) |
| **Dependencies** | What needs to happen first? (data access, stakeholder sign-off, etc.) |
| **Success Criteria** | How will we know this is working? What metric moves? |
| **Estimated Value** | Dollar amount or range — use the formulas below |

### Step 4: Calculate Value for Each Use Case

Every use case must have a quantified business case. Use these frameworks:

#### Cost Savings Use Cases

**Manual Process Elimination:**
```
Current hours/week × number of people × hourly rate × 52 weeks = Annual cost
× Domo automation % = Annual savings
```
Example: "5 analysts × 8 hrs/week × $59/hr × 52 = $122,720/yr. Domo automates 75% → **$92,040/yr savings**"

**FTE Reallocation:**
```
Number of FTEs redirected × fully loaded salary = Annual savings
```
Example: "Eliminating need for 2 dedicated reporting analysts at $120K each = **$240,000/yr**"
Note: Frame as "reallocation to higher-value work" rather than "headcount reduction" — it's more palatable and often more accurate.

**Tool Consolidation:**
```
Sum of replaced tool licenses + admin FTE savings = Annual savings
```
Example: "Replacing Tableau ($135K) + Looker ($80K) + 0.5 FTE admin ($60K) = **$275K/yr**"

#### Revenue Generation Use Cases

**Faster Decision Cycle:**
```
Revenue influenced × (days saved / current cycle time) = Revenue acceleration value
```
Example: "Your sales team manages a $50M pipeline. Moving weekly pipeline review to real-time visibility recovers ~5 business days/month of decision lag. Even a 2% improvement in win rate from faster action = **$1M/yr**"

**New Revenue Visibility:**
```
Revenue leakage identified × recovery rate = Annual value
```
Example: "Identifying $2M in un-invoiced services across 500 accounts × 50% recovery = **$1M**"

**Customer Retention / Churn Reduction:**
```
At-risk revenue × churn reduction % = Annual value
```
Example: "Real-time health scoring on $20M book of business. Reducing churn by 3% = **$600K/yr**"

#### Risk Mitigation Use Cases

**Compliance Automation:**
```
Audit penalty risk + manual compliance labor = Annual value
```
Example: "SOX compliance reporting: $200K penalty exposure + 2 FTEs × 4 weeks/quarter × $59/hr = **$224,640/yr** in risk and labor"

**Data Quality / Single Source of Truth:**
```
Cost of errors from conflicting data × frequency = Annual value
```
Example: "Bad data caused 3 pricing errors last year averaging $50K each = **$150K/yr in preventable losses**"

**Operational Risk Detection:**
```
Average incident cost × incidents detected earlier = Annual value
```
Example: "Real-time alerting catches inventory stockouts 2 days earlier. Average stockout cost = $25K × 12/yr = **$300K/yr**"

### Step 5: Prioritize with a Scoring Matrix

Score each use case on a 1-5 scale:

| Criteria | Weight | Description |
|---|---|---|
| **Business Value** | 30% | Dollar value of the outcome |
| **Strategic Alignment** | 20% | How closely it aligns with the exec sponsor's stated priorities |
| **Adoption Likelihood** | 20% | Will people actually use it? Is there a champion? |
| **Technical Feasibility** | 15% | Are data sources available? Is the complexity manageable? |
| **Time to Value** | 15% | How quickly can we deliver a working version? |

**Priority Score** = (Value × 0.3) + (Alignment × 0.2) + (Adoption × 0.2) + (Feasibility × 0.15) + (Speed × 0.15)

Rank use cases by score. The top 1-2 become the "quick wins" for the first 30 days.

### Step 6: Create the Recommended Build Sequence

Based on scores, create a phased roadmap:

**Phase 1 — Quick Wins (Days 1-30):**
- 1-2 use cases with highest adoption likelihood and fastest time to value
- Prioritize the "Quick Win Opportunity" identified in each relevant Umbrella
- Goal: Generate internal momentum, convert skeptics, prove the platform works
- Value target: Demonstrable savings or insight within first month

**Phase 2 — Core Value (Days 31-90):**
- 2-3 use cases with highest business value
- Goal: Deliver the headline ROI numbers
- Value target: Measurable impact on Cost Savings, Revenue, or Risk

**Phase 3 — Scale & Expand (Days 91+):**
- Additional use cases that build on Phase 1-2 foundations
- Expand into additional Umbrellas to broaden platform stickiness
- Goal: Broader adoption, more departments, more data sources
- Value target: Platform becomes indispensable

### Step 7: Generate the Output

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
  4. Fix any broken references (e.g., `attachedTemplate` pointing to local paths — remove from both `settings.xml` and `word/_rels/settings.xml.rels`)
  5. `python scripts/office/pack.py unpacked/ output.docx --original "templates/brand/Domo Word Doc Template.docx"`

**For PowerPoint presentations (.pptx):**
- Template path: `templates/brand/24_12_13 Powerpoint template.potx`
- Use the PPTX skill's unpack → edit → repack workflow
- Preserve slide masters, layouts, and branded elements

Include:
1. Executive summary with total portfolio value across all use cases
2. **Umbrella coverage map** — which of the 8 Umbrellas are represented, which are untapped opportunities
3. Individual use case cards organized by Umbrella, with all fields from Step 3
4. Value calculations for each use case
5. Prioritization scorecard (table with scores)
6. Recommended build sequence / phased roadmap
7. Appendix: Value calculation methodology and assumptions

**Always include the total value rollup:**
> "Across all [N] identified use cases spanning [X] of Domo's 8 Umbrella Use Case categories, we've quantified **$X.XM in annual value** — $XXK in Cost Savings, $XXK in Revenue Generation, and $XXK in Risk Mitigation. Phase 1 quick wins alone deliver $XXK within the first 30 days."

**Always include the Umbrella coverage insight:**
> "This engagement covers [X] of 8 Umbrella categories. Untapped areas — [list uncovered Umbrellas] — represent additional expansion opportunities worth exploring in Phase 3."

### Value Framing Cheat Sheet

Use these ready-made sentences when discussing use cases with customers:

- "Replacing 3 analysts doing manual reporting at an industry-average $120K salary saves you **$360K annually** — and those people can do higher-value strategic work instead."
- "Every hour your team spends pulling data from Excel is an hour they're not analyzing it. At $59/hr blended rate, that's **$3,068 per person per year** just in wasted data gathering."
- "If Domo helps your sales team close deals even 1 week faster on a $5M pipeline, that's **$96K in accelerated revenue** per year."
- "A single compliance violation in [industry] averages $[X] in penalties. Domo automates the reporting that prevents it."
- "Every day your monthly close is delayed is a day your executives are making decisions on stale data. What's one bad decision worth?"

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
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account, `engagement-observations`, `engagement-working`); use `memory_bundle` when those layers are separate.
### After executing
- Call `memory_remember` with prioritization and value-scoring conclusions scoped to `{account_id}`.
- Call `memory_store_artifact` for the UseCaseInventory in `engagement-artifacts`.
