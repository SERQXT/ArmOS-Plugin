---
name: ps-discovery-questionnaire
tier: 1
description: "Generate a structured PS Discovery Questionnaire tailored to the customer's industry, Domo maturity, and engagement type. Use this skill whenever someone says: 'discovery questionnaire', 'discovery questions', 'prep discovery questions', 'what should I ask in discovery', 'customer intake questions', 'scoping questions', 'first call questions', 'kickoff questions', 'needs assessment questions', or any variation of preparing questions for a first or early customer call. Also trigger when someone mentions 'discovery call prep' or 'scoping call prep' in a PS context. This is part of the PS Discover phase."
maturity: alpha
audience: [delivery]
---

# PS Discovery Questionnaire Generator

You are helping a Domo Professional Services team member (Scoping Consultant, Adoption Advocate, or Project Manager) prepare a structured Discovery Questionnaire for an upcoming customer engagement. This questionnaire will be used during the first 1-2 calls with the customer to understand their business, data landscape, stakeholders, and goals — so Domo can deliver maximum value.

## Why This Matters

Discovery is the foundation of every successful PS engagement. A weak discovery means misaligned use cases, scope creep, and disappointing outcomes. A great discovery means the team walks into the Align phase with clarity on what matters, who's involved, and where Domo can create measurable business impact.

## How to Use This Skill

### Step 1: Gather Context

Before generating the questionnaire, ask for (or pull from Compass/Asana if available):

- **Customer name** — use Compass `portfolio_lookup` or `portfolio_summary` to pull account health, ARR, renewal timeline, signals, and services data
- **Industry / vertical** — tailor questions to their domain (healthcare, financial services, retail, tech, etc.)
- **Engagement type** — Paid engagement, $0 Oppty/free, or Adoption segment? This changes the depth and focus
- **Domo maturity** — New customer vs. existing with low adoption vs. power user expanding? Check Compass `hggrades_lookup` for Platform Utilization and User Engagement scores
- **Platform utilization** — `hgplatformutilization_lookup` for features enabled but unused. Generate data-driven questions: "We see Domo Everywhere is enabled but not active — what was the original intent? What blocked activation?" is better than the generic "Are you using embedded analytics?"
- **Support history** — `hgsupport_lookup` for recent cases. Generate informed questions: "We see you had 3 high-priority support cases recently about data pipeline failures — can you tell us about the underlying data challenges?" is better than "Any technical issues?"
- **Known pain points or goals** — anything from the sales handoff, Gong calls (`calls_lookup`), or account signals

### Step 2: Generate the Questionnaire

Structure the questionnaire in these sections. Tailor the specific questions based on the context gathered above.

#### Section 1: Business Context & Strategic Goals
Questions that uncover what the business is trying to achieve at the executive level. Connect everything back to the three Domo value pillars:

- **Cost Savings** — Where are they spending money on manual processes, redundant tools, or headcount that Domo could reduce?
- **Revenue Generation** — Where could better data visibility drive top-line growth, faster decisions, or new revenue streams?
- **Mitigating Risk** — Where are they exposed to compliance gaps, data quality issues, blind spots, or delayed reporting?

Example questions:
- "What are your top 3 strategic priorities this quarter/year?"
- "Where do you feel your team spends the most time on manual reporting or data wrangling?"
- "What decisions are being delayed because the right data isn't available fast enough?"
- "Are there compliance or regulatory reporting requirements that are currently painful?"

#### Section 2: Current Data Landscape
Questions about their existing tech stack, data sources, and how data flows today.

- What BI/analytics tools are in use today? (Tableau, Power BI, Excel, homegrown?)
- What are the primary data sources? (ERP, CRM, HRIS, marketing platforms, custom databases?)
- How is data currently moved and transformed? (ETL tools, manual exports, APIs?)
- Where are the biggest data silos or gaps?
- How many people touch data today vs. how many need to?

#### Section 3: Stakeholder & User Landscape
Questions to map out who matters and who will use Domo.

- Who is the executive sponsor for this initiative?
- Who are the day-to-day data consumers vs. data producers?
- Which teams/departments will benefit most?
- How many users are expected? (Tie this to value: "Each user who saves 2 hours/week at a blended rate of $60/hr = $6,240/year per user")
- Who are the skeptics or blockers we should be aware of?

#### Section 4: Use Case Prioritization
Questions to surface and rank what they want to build.

- What are the top 3-5 dashboards, apps, or workflows you'd want first?
- For each: Who is the audience? What decisions does it drive? What's the current process?
- What does "success" look like for each use case?
- Which use case, if delivered in the first 30 days, would generate the most internal momentum?

#### Section 5: Success Metrics & Value Realization
Questions that establish measurable outcomes — critical for proving ROI.

- How will you measure the success of this Domo engagement?
- What KPIs matter most to your executive sponsor?
- Can we quantify the current cost of the problem? (hours spent, FTE equivalents, delayed decisions, revenue at risk)

**Always include a value framing prompt like:**
> "If this use case eliminates 10 hours/week of manual reporting across your team, at an industry-standard blended rate of $75/hr, that's roughly $39,000/year in recovered productivity — before you factor in faster decision-making and reduced error rates."

#### Section 6: Timeline, Constraints & Risks
- What is the desired go-live date or milestone?
- Are there any hard deadlines (board meetings, regulatory filings, fiscal year end)?
- What's been tried before and why didn't it work?
- Any known technical constraints (security, network, data residency)?

### Step 3: Format the Output

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
- Customer name and date at the top
- Section headers with 4-6 questions each
- Space for notes/answers next to each question
- A "Value Impact" callout box in each section showing how Domo maps to Cost Savings, Revenue Generation, or Risk Mitigation for that area
- A summary section at the bottom for key takeaways and next steps

### Value Calculation Reference

When generating value framing, use these benchmarks:

| Role Level | Industry Avg Salary | Fully Loaded Cost | Hourly Rate |
|---|---|---|---|
| Analyst / Specialist | $75,000 | $97,500 | $47/hr |
| Senior Analyst / Manager | $95,000 | $123,500 | $59/hr |
| Director | $130,000 | $169,000 | $81/hr |
| VP / Executive | $180,000 | $234,000 | $113/hr |
| Data Engineer | $120,000 | $156,000 | $75/hr |

Fully loaded = 1.3x base (benefits, overhead). Hourly = fully loaded / 2,080 hours.

**Common value calculations:**
- Replacing manual reporting: `hours_saved_per_week × hourly_rate × 52 weeks`
- FTE replacement: "Replacing 3 analyst headcount at $120K average = $360K/year in direct savings"
- Tool consolidation: "Eliminating 2 redundant BI licenses at $50K/year each = $100K savings"
- Faster decisions: "Reducing monthly close from 15 days to 5 days = 10 days of earlier visibility into performance"
- Risk reduction: "Automated compliance reporting eliminates $X in potential audit findings or penalties"

### Domo Value Pillars — Always Frame Impact

Every question and every use case should map back to one or more of:

1. **Cost Savings** 💰 — Fewer tools, fewer manual hours, fewer FTEs doing data janitorial work, lower infrastructure costs
2. **Revenue Generation** 📈 — Faster decisions, better customer insights, new data products, improved sales effectiveness, real-time operational visibility
3. **Mitigating Risk** 🛡️ — Compliance automation, data governance, audit trails, real-time alerting on anomalies, single source of truth reducing error rates

When presenting the questionnaire, include a brief intro paragraph that sets the tone:

> "The goal of this Discovery session is to understand your business priorities, data landscape, and success criteria — so we can design a Domo solution that delivers measurable impact. We'll frame everything through the lens of Cost Savings, Revenue Generation, and Risk Mitigation to ensure every use case has a clear business case."

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account and patterns-library / industry patterns as needed).
### After executing
- Call `memory_remember` with key questionnaire themes scoped to `{account_id}`.
- Call `memory_store_artifact` for the DiscoveryQuestionnaire in `engagement-artifacts`.
