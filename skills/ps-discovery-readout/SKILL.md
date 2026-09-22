---
name: ps-discovery-readout
tier: 2
description: "Synthesize all Discovery phase outputs into a comprehensive Discovery Readout document that hands off cleanly to the Align phase. Use this skill whenever someone says: 'discovery readout', 'discovery summary', 'discovery handoff', 'discovery findings', 'summarize discovery', 'discovery deck', 'discovery report', 'wrap up discovery', 'discovery complete', 'hand off to align', 'discovery deliverable', 'what did we learn in discovery', or any request to compile, summarize, or present the findings from a PS Discovery phase. Also trigger on 'pre-align summary' or 'engagement kickoff summary'. This is the capstone of the PS Discover phase."
maturity: alpha
audience: [delivery, orchestration]
---

# PS Discovery Readout Generator

You are helping a Domo Professional Services team member synthesize everything learned during the Discover phase into a single, polished Discovery Readout. This document is the bridge between Discover and Align — it tells the story of what we learned, what we recommend, and why Domo is the right answer, backed by real numbers.

## Why the Readout Matters

The Discovery Readout is the most important document in the early engagement. It demonstrates to the customer that we listened, we understood their business, and we have a clear plan to deliver value. It's also the internal handoff document that ensures everyone on the Domo side — PM, consultant, CSM, AE — is aligned on what we're building and why.

## How to Use This Skill

### Step 1: Gather All Discovery Artifacts

Pull from everything produced during Discovery:

- **Discovery Questionnaire** responses and notes
- **Stakeholder Map** — key players, influence, sentiment
- **Current State Assessment** — tech stack, maturity scores, workflow analysis
- **Use Case Inventory** — prioritized use cases with value calculations
- **Compass data** — `portfolio_lookup` for account context, `hggrades_lookup` for health metrics, `spp_lookup` for services engagement details, `calls_lookup` for Gong call summaries
- **Platform & Engagement data** — `hgplatformutilization_lookup` for feature enablement/usage (supports Current State section), `hguserengagement_lookup` for user adoption data (supports Stakeholder Overview and maturity scoring)
- **Deal context** — `sfopportunities_lookup` for active pipeline, renewal/upsell deals, and ACV (supports Business Context and framing the engagement's alignment with commercial motions)
- **Support context** — `hgsupport_lookup` for open cases and support patterns (supports Risks & Mitigation section)
- **Any Google Drive documents** from the discovery process
- **Asana tasks** from the Assignment Board related to this account

### Step 2: Structure the Readout

The Discovery Readout follows this structure:

---

#### Cover Page
- Customer logo + Domo logo
- "Discovery Readout"
- Customer name
- Date
- Prepared by: [PS team member name]
- Engagement type: [Paid / Adoption / $0 Oppty]

#### 1. Executive Summary (1 page max)

A single page that any executive can read in 2 minutes and understand:
- Who the customer is and what they're trying to achieve
- What we discovered about their current state
- The total value opportunity we identified (single headline number)
- Our recommended approach

Template paragraph:
> "[Customer] is a [industry] company with [context]. Through our discovery process, we identified **$X.XM in annual value** across [N] use cases spanning Cost Savings ($XXK), Revenue Generation ($XXK), and Risk Mitigation ($XXK). We recommend a phased approach starting with [quick win use case] to deliver immediate impact within 30 days, followed by [core value use cases] over the next 90 days."

#### 2. Business Context & Strategic Priorities

Summarize what the customer told us about their world:
- Their top 3-5 strategic priorities
- Key business challenges
- Why they engaged Domo / what triggered this initiative
- Their definition of success

Map each priority to a Domo value pillar (Cost Savings, Revenue Generation, Risk Mitigation).

#### 3. Stakeholder Overview

A condensed version of the Stakeholder Map:
- Key stakeholders table (Name, Role, Influence, Sentiment, What They Care About)
- Executive sponsor identified: Yes/No (flag if No)
- Champion identified: Yes/No
- Key risks: skeptics, single points of failure, missing personas

#### 4. Current State Assessment

Synthesized findings from the Current State Assessment:
- **Tool Landscape**: What they have today, what it costs, what's broken
- **Data Landscape**: Key data sources, how data flows, where the gaps are
- **Analytics Maturity**: Scorecard summary (the 1-5 ratings)
- **Operational Workflows**: Top 3 workflows analyzed with time/cost breakdown

Include the value-of-current-pain calculation:
> "We estimate [Customer] is currently spending **$XXK/year** on manual processes, redundant tools, and delayed decisions that Domo can address."

#### 5. Use Case Portfolio

The heart of the readout. For each prioritized use case:

| Use Case | Value Pillar | Audience | Estimated Value | Complexity | Priority |
|---|---|---|---|---|---|
| Executive Revenue Dashboard | Revenue Gen | C-Suite (8 users) | $500K+ (decision speed) | Medium | 1 |
| Automated Compliance Reporting | Risk Mitigation | Finance (12 users) | $225K/yr | Low | 2 |
| Sales Pipeline Tracker | Revenue Gen | Sales (30 users) | $300K/yr | Low | 3 |
| Manual Reporting Elimination | Cost Savings | Operations (5 users) | $92K/yr | Medium | 4 |

**Total Value Portfolio**: Roll up all use cases into a single headline.

#### 6. Value Summary

A dedicated section that makes the business case crystal clear:

**By the numbers:**
- Total annual value identified: $X.XM
- Cost Savings: $XXK (tool consolidation + process automation + FTE reallocation)
- Revenue Generation: $XXK (faster decisions + pipeline visibility + churn reduction)
- Risk Mitigation: $XXK (compliance automation + data governance + error prevention)

**Value per user:**
> "With [N] projected Domo users, the value per user is **$X,XXX/year** — a [X]x return on the per-user license cost."

**Time to ROI:**
> "Phase 1 quick wins deliver measurable value within 30 days. Full ROI payback projected at [X] months."

**The headline framing:**
Pick the most impactful way to say it:
- "Domo replaces the work of 3 full-time analysts — that's $360K/year your team can redirect to strategic initiatives."
- "Every month without Domo costs [Customer] approximately $XX,000 in manual processes and delayed decisions."
- "At a $120K average analyst salary, the 5,200 hours/year your team spends on manual reporting is costing you $312K. Domo automates 80% of that."

#### 7. Recommended Approach

**Phase 1 — Quick Wins (Days 1-30):**
- Use cases: [list]
- Goal: Visible value, stakeholder buy-in
- Expected outcome: [specific metric]

**Phase 2 — Core Build (Days 31-90):**
- Use cases: [list]
- Goal: Deliver headline ROI
- Expected outcome: [specific metric]

**Phase 3 — Scale & Adopt (Days 91+):**
- Use cases: [list]
- Goal: Broad adoption, additional departments
- Expected outcome: [specific metric]

#### 8. Risks & Mitigation

Top risks identified during discovery with mitigation plans:

| Risk | Severity | Mitigation |
|---|---|---|
| No executive sponsor identified | High | Work with CSM/AE to secure exec sponsorship before Align |
| Data quality issues in [source] | Medium | Include data quality sprint in Phase 1 |
| Change management resistance in [dept] | Medium | Targeted quick win for skeptical stakeholders |
| Limited IT bandwidth for connectors | Low | Use Domo's self-service connectors; train power users |

#### 9. Next Steps

Clear, actionable next steps to move from Discover → Align:
1. Customer reviews and validates the Discovery Readout
2. Stakeholder alignment meeting scheduled (the "Align" kickoff)
3. Data access and connector setup initiated
4. SOW / engagement scope finalized based on prioritized use cases
5. Project timeline and milestones agreed

---

### Step 3: Generate the Output

**⚠️ MANDATORY: Use Branded Templates for All Document Output**

All documents MUST use the official Domo branded templates. Documents without proper branding will not be accepted by leadership. **Open Sans font is critical for brand compliance.**

**NEVER create documents from scratch using docx-js or python-docx. ALWAYS start from the branded template.**

**For presentations (recommended for customer-facing readouts):**
- Template path: `templates/brand/24_12_13 Powerpoint template.potx`
- Use the PPTX skill's unpack → edit → repack workflow
- Preserve slide masters, layouts, and branded elements
- One section per slide or slide group
- Heavy use of the value summary visuals

**For internal Word documents:**
- Template path: `templates/brand/Domo Word Doc Template.docx`
- Workflow: Unpack template → edit XML → repack:
  1. `python scripts/office/unpack.py "templates/brand/Domo Word Doc Template.docx" unpacked/`
  2. Edit `unpacked/word/document.xml` — use the template's built-in styles:
     - `DomoHeader1` for section headers (large, branded blue)
     - `DomoQuestion` for subheaders (dark, bold)
     - `DomoAnswers` for body text (**Open Sans** font — automatically applied by this style)
  3. Preserve the cover page image paragraph and branded headers/footers
  4. Fix any broken references (e.g., `attachedTemplate` pointing to local paths — remove from both `settings.xml` and `word/_rels/settings.xml.rels`)
  5. `python scripts/office/pack.py unpacked/ output.docx --original "templates/brand/Domo Word Doc Template.docx"`
- More detailed, includes all supporting calculations

### Domo Value Messaging — Final Framing

Close every readout with a compelling value statement that ties back to the three pillars:

> "Through this Discovery engagement, we've mapped [Customer]'s data landscape, identified key stakeholders, and quantified **$X.XM in annual value** that Domo can deliver. This value breaks down across three dimensions:
>
> **Cost Savings** ($XXK): Eliminating redundant tools, automating manual processes, and reallocating analyst time to strategic work.
>
> **Revenue Generation** ($XXK): Faster decisions, real-time visibility into pipeline and operations, and new data-driven revenue opportunities.
>
> **Risk Mitigation** ($XXK): Automated compliance, data governance, single source of truth, and proactive alerting.
>
> We recommend starting with [quick win] to demonstrate immediate value, then scaling across [departments/use cases] over the next 90 days."

### Salary & Value Reference Table

| Role | Annual Salary | Fully Loaded | Hourly | Common Calc |
|---|---|---|---|---|
| Analyst | $75K | $97.5K | $47/hr | 1 analyst's manual work = $97.5K/yr |
| Sr. Analyst/Mgr | $95K | $123.5K | $59/hr | 5 analysts × 8 hrs/wk = $122.7K/yr |
| Director | $130K | $169K | $81/hr | Executive time on data requests |
| VP/Executive | $180K | $234K | $113/hr | Decision delay cost |
| Data Engineer | $120K | $156K | $75/hr | ETL maintenance savings |
| "3 headcount at $120K" | $360K | $468K | — | The classic replacement calc |

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account** and **engagement-artifacts** (discovery outputs), intent: discovery readout synthesis.

### After executing
- Call `memory_store_artifact` for **DiscoveryReadout**; `memory_remember` with value headline, phased approach, and handoff risks.
