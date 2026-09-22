---
name: web-research
tier: 1
description: "Research a company using public web sources — financials, news, 10-K filings, executive changes, industry trends, and competitive landscape. Trigger with 'research [company]', 'what's happening at [company]', 'get me the latest on [company]', 'pull the 10-K for [company]', 'company intel on [company]', or any request for external company intelligence."
maturity: alpha
audience: [intelligence]
---

# Web Research — Company Intelligence Agent

Go out to the open web and bring back structured company intelligence. This is NOT a Domo dataset — it's a live research capability that pulls from public sources in real time.

## How It Works

```
User says: "research Consumer Reports"
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  News    Financials  10-K   Exec    Competitive
  (recent) (revenue)  (SEC)  (changes) (landscape)
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Structure into Intel Brief
                    |
         Merge with Domo data (if available)
```

## Triggers

- "research [company]"
- "what's happening at [company]"
- "get me the latest on [company]"
- "pull the 10-K for [company]"
- "company intel on [company]"
- "news on [company]"
- "[company] financial overview"
- "who are the execs at [company]"
- "competitive landscape for [company]"

## Execution Flow

### Step 1: Identify the Company

Resolve the company name. If the user gives a Domo account name, cross-reference with Portfolio data:
- `COMPANY` field = company name in external sources
- `Website Domain` = useful for finding the right entity
- `PRIMARY_NAME` = primary contact (helps identify the right org)

### Step 2: Research Modules (run in parallel)

Execute these research modules using `WebSearch` and `WebFetch`:

#### Module A: Recent News (last 90 days)
```
Search: "[Company Name] news" + current year
Search: "[Company Name] announcement" + current quarter
Search: "[Company Name] partnership OR acquisition OR expansion"

Extract:
- Headline, date, source
- One-sentence summary per article
- Sentiment classification (positive/negative/neutral)
- Relevance to Domo (does this affect their data/analytics needs?)
```

#### Module B: Financial Overview
```
Search: "[Company Name] revenue" OR "[Company Name] annual report"
Search: "[Company Name] financial results [year]"
Search: "[Company Name] stock price" (if public)

Extract:
- Revenue (most recent available)
- Revenue growth trajectory
- Profitability status
- Key financial metrics for their industry
- Fiscal year end
- Public/private status
```

#### Module C: SEC Filings / 10-K (public companies only)
```
Search: "[Company Name] 10-K SEC filing site:sec.gov"
Search: "[Company Name] annual report [year]"

Extract:
- Most recent 10-K filing date
- Business description summary
- Risk factors relevant to data/analytics
- Technology and data infrastructure mentions
- Key metrics they report on (KPIs they care about)
- Strategic priorities mentioned
```

#### Module D: Executive Leadership
```
Search: "[Company Name] executive team" OR "[Company Name] leadership"
Search: "[Company Name] CTO OR CDO OR CIO OR VP Data"

Extract:
- C-suite roster (CEO, CFO, CTO, CIO, CDO)
- VP-level data/analytics leaders
- Recent exec changes (last 12 months)
- LinkedIn profiles where available
- Relevant: who is the data/analytics champion?
```

#### Module E: Competitive & Industry Context
```
Search: "[Company Name] competitors"
Search: "[Company Name] industry trends [year]"
Search: "[Company Name] [industry] market"

Extract:
- Primary competitors
- Industry vertical and sub-segment
- Market position (leader/challenger/niche)
- Industry trends affecting data/analytics adoption
- Regulatory environment (if relevant)
```

#### Module F: Technology Stack (bonus)
```
Search: "[Company Name] technology stack" OR "[Company Name] data platform"
Search: site:stackshare.io "[Company Name]"
Search: "[Company Name] hiring data engineer OR data analyst"

Extract:
- Known technology platforms
- Job postings mentioning data/BI tools (especially competitors like Tableau, Power BI, Looker)
- Data infrastructure signals from job descriptions
- Cloud platform (AWS, Azure, GCP)
```

### Step 3: Cross-Reference with Domo Data

If MCP tools are available, enrich the external research with internal context:

```
1. portfolio_lookup → Get Domo's internal view of this account
   • Compare external revenue signals with ARR data
   • Compare external headcount with Domo's headcount fields
   • Note any disconnects between external narrative and internal health

2. hggrades_lookup → Get health scores
   • Does external news explain internal health trends?
   • E.g., "Company laid off 20% → declining MAU makes sense"

3. calls_lookup → Get recent conversation context
   • Have call recaps mentioned any of the external news?
   • Is the customer talking about the same strategic priorities the 10-K mentions?
```

### Step 4: Produce Intelligence Brief

---

## Output Template

```markdown
# Company Intelligence Brief: [Company Name]

**Generated:** [Date] | **Source:** Web Research Agent

---

## Company Overview

| | |
|---|---|
| **Company** | [Full legal name] |
| **Industry** | [Industry / sub-sector] |
| **Headquarters** | [City, State/Country] |
| **Website** | [domain] |
| **Public/Private** | [Status] |
| **Revenue** | $[amount] ([year]) |
| **Employees** | [headcount] |
| **Market Position** | [Leader / Challenger / Niche] |

---

## Executive Leadership

| Name | Title | Since | Notes |
|------|-------|-------|-------|
| [Name] | CEO | [Date] | [Key context] |
| [Name] | CTO/CIO/CDO | [Date] | [Data/analytics champion?] |
| ... | ... | ... | ... |

**Recent Changes:** [Any exec departures/arrivals in last 12 months]

---

## Recent News & Events

| Date | Headline | Source | Sentiment | Domo Relevance |
|------|----------|--------|-----------|----------------|
| [Date] | [Headline] | [Source] | [+/-/~] | [How this affects their Domo usage] |
| ... | ... | ... | ... | ... |

**News Narrative:** [2-3 sentence synthesis of what's happening at this company]

---

## Financial Summary

| Metric | Value | Trend |
|--------|-------|-------|
| Revenue | $[X] | [↑/↓/→] |
| Revenue Growth | [X%] | [vs. prior year] |
| Profitability | [Profitable / Break-even / Loss] | |
| Key Metric 1 | [Industry-specific] | |

**Financial Narrative:** [What does their financial trajectory mean for Domo?]
- Growing revenue → likely expanding headcount → more Domo users
- Cost cutting → potential downsell risk, watch renewal closely
- M&A activity → could mean integration projects (opportunity) or platform consolidation (risk)

---

## 10-K / Annual Report Insights (if public)

**Filed:** [Date] | **Fiscal Year End:** [Date]

### Strategic Priorities (from 10-K)
1. [Priority 1 — relevance to data/analytics]
2. [Priority 2]
3. [Priority 3]

### Risk Factors of Note
- [Risk factor that could affect Domo usage]
- [Risk factor related to technology/data]

### Technology & Data Mentions
- [Any mentions of BI, data platforms, analytics in the filing]
- [Infrastructure investments mentioned]

---

## Technology & Data Landscape

| Category | Known Stack |
|----------|-------------|
| Cloud Platform | [AWS / Azure / GCP / On-prem] |
| BI/Analytics | [Domo + any others: Tableau, Power BI, Looker] |
| Data Infrastructure | [Snowflake, Databricks, Redshift, etc.] |
| CRM | [Salesforce, HubSpot, etc.] |

**Job Posting Signals:** [What are they hiring for? Data engineers? Analysts? BI developers?]

---

## Competitive Context

| Competitor | Why They Compete | Domo Advantage |
|-----------|------------------|----------------|
| [Competitor 1] | [Overlap area] | [Why Domo wins here] |
| [Competitor 2] | [Overlap area] | [Why Domo wins here] |

**Industry Trends:**
- [Trend 1 affecting their data needs]
- [Trend 2]

---

## Cross-Reference with Domo Data (if available)

| External Signal | Internal Signal | Alignment |
|-----------------|-----------------|-----------|
| [Revenue growing 15%] | [ARR flat] | ⚠️ Misaligned — growth not reflected in Domo spend |
| [Hired new CDO] | [No exec engagement in calls] | ⚠️ Gap — should engage new data leader |
| [Acquired Company X] | [Integration discussions in calls] | ✅ Aligned — already in conversation |

---

## So What? — Implications for Domo

### Opportunities
1. [Opportunity based on research — e.g., "New CDO = champion candidate for executive engagement"]
2. [Opportunity — e.g., "Expansion into new market = new use cases for Domo"]

### Risks
1. [Risk — e.g., "Cost-cutting initiative may pressure renewal"]
2. [Risk — e.g., "Hiring for Tableau developers suggests competitive evaluation"]

### Recommended Next Steps
1. [Action with owner]
2. [Action with owner]
3. [Action with owner]

---

**Sources:** [List all URLs consulted]
**Data Freshness:** Web research as of [date]. Domo data as of last sync.
**Prepared by:** Compass Web Research Agent
```

---

## Guardrails

- **Always cite sources.** Every claim needs a URL or source name.
- **Never fabricate financial data.** If you can't find revenue, say "Revenue not publicly disclosed."
- **Distinguish fact from inference.** Label interpretations clearly (e.g., "This suggests..." not "This means...").
- **Respect copyright.** Summarize, don't reproduce. Short quotes only (<15 words) with attribution.
- **Flag low-confidence findings.** If a source is questionable or data is old, say so.
- **Public companies only for SEC data.** Don't try to pull 10-K for private companies.
- **Don't access paywalled content.** If a source requires login, note it and move on.
- **Cross-reference when possible.** If Domo data contradicts external data, flag the discrepancy — don't resolve it.

---

## Connecting MCP Tools

Web Research uses built-in `WebSearch` and `WebFetch` tools. Domo MCP tools are optional enrichment:

| Tool | Required | What It Adds |
|------|----------|-------------|
| WebSearch | **Yes** | Core research capability |
| WebFetch | **Yes** | Deep-read specific pages |
| portfolio_lookup | Optional | Cross-reference with internal account data |
| hggrades_lookup | Optional | Correlate external signals with health trends |
| calls_lookup | Optional | Check if external news has been discussed |

### Standalone Mode

This skill works fully without any Domo data. The "Cross-Reference with Domo Data" section simply gets skipped.

---

## Memory

### Before executing

- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load what Domo and prior sessions already know — avoid duplicating research the team has already captured.

### After executing

- Call `memory_remember` scoped to **engagement-working** with the **WebResearchDossier** (structured brief, sources, implications).
- Call `memory_remember` scoped to `{account_id}` for **new durable facts** (financials, leadership changes, strategic priorities) that should persist on the account layer beyond this engagement.

---

## Related Skills

- **Account 360** (Discover) — Combines web research with all Domo data for complete picture
- **Call Prep** (Align) — Uses web research to prepare for customer meetings
- **Adoption Acceleration** (Adopt) — Web research provides context for why health scores are what they are
- **Template Registry** (Global) — Scouting reports use the Domo Word Doc Template
