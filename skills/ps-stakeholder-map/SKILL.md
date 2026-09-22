---
name: ps-stakeholder-map
tier: 1
description: "Build a stakeholder map for a Domo PS engagement — identify decision makers, champions, technical contacts, skeptics, and end users. Use this skill whenever someone says: 'stakeholder map', 'stakeholder mapping', 'who are the key players', 'map the stakeholders', 'org chart for the engagement', 'who do I need to know', 'identify the decision makers', 'who's involved in this account', 'champion mapping', or any request to understand the people landscape at a customer account. Also trigger on 'relationship map', 'power map', or 'influence map' in a PS or customer context. This is part of the PS Discover phase."
maturity: alpha
audience: [delivery]
---

# PS Stakeholder Map Builder

You are helping a Domo Professional Services team member build a structured Stakeholder Map for a customer engagement. Understanding who the people are — their roles, influence, sentiment toward Domo, and what they care about — is essential for navigating the engagement successfully and ensuring adoption sticks.

## Why Stakeholder Mapping Matters

Engagements don't fail because of technology. They fail because the wrong people weren't involved, the right champion wasn't empowered, or a silent skeptic torpedoed adoption after go-live. A stakeholder map surfaces these dynamics early so the team can build relationships strategically.

## How to Use This Skill

### Step 1: Gather Account Intelligence

Pull everything available about the account's people landscape:

- **Compass data** — `portfolio_lookup` for CSM, AE, account team; `calls_lookup` for recent Gong call attendees and sentiment
- **Relationship data** — `hgrelationship_lookup(account_name, limit=50)` for People.ai email/meeting activity with participant names, emails, job titles, departments, and seniority. This dramatically expands the contact universe beyond just Gong call attendees — it captures ALL email and meeting participants across the Domo team's engagement with this account. Use this to identify:
  - **Frequent contacts** — who engages most often (high meeting/email volume)
  - **Executive contacts** — participants with VP/C-suite titles
  - **Department coverage** — which customer departments are engaged vs. silent
  - **Engagement direction** — are they reaching out to us (inbound) or are we chasing them (outbound)?
- **User engagement data** — `hguserengagement_lookup(account_name, limit=50)` for all Domo users with names, emails, titles, departments, roles, login activity, and CXO flags. This maps the "end user" stakeholder category directly from data:
  - **Power users** — top users by login days (potential Champions)
  - **CXO users** — executives using Domo (potential Executive Sponsors)
  - **Inactive users** — people with access who don't log in (adoption risk)
  - **Admins** — users with Admin/Privileged roles (Technical Leads)
- **ACE activity** — `hgace_lookup(account_name)` if the customer has adoption consulting — shows which ACE reps are engaged and who they've been meeting with, adding to the relationship picture.
- **Common Room** — `common-room:contact-research` for individual contacts; `common-room:account-research` for company-level activity
- **Asana** — check the Assignment Board for any existing project tasks that mention contacts
- **Sales handoff notes** — any Google Drive docs from the sales cycle
- **Ask the user** — "Who have you already been in contact with? Who was on the sales calls?"

### Step 2: Classify Each Stakeholder

For every identified person, capture:

| Field | Description |
|---|---|
| **Name** | Full name |
| **Title / Role** | Their job title and functional role |
| **Department** | Which team they're on |
| **Stakeholder Type** | Executive Sponsor, Decision Maker, Champion, Technical Lead, End User, Influencer, Gatekeeper, or Skeptic |
| **Influence Level** | High / Medium / Low — how much sway do they have over the engagement's success? |
| **Sentiment** | Advocate / Neutral / Skeptic / Unknown — how do they feel about Domo today? |
| **What They Care About** | Their primary business concern or KPI. Frame in terms of Cost Savings, Revenue Generation, or Risk Mitigation |
| **Engagement Strategy** | How should the PS team engage this person? (e.g., "Include in steering committee", "Needs a quick win to convert", "Keep informed via email updates") |
| **Communication Preference** | How often and through what channel (weekly standup, email digest, Slack, ad-hoc) |

### Step 3: Identify Gaps and Risks

After mapping known stakeholders, flag:

- **Missing Executive Sponsor** — If there's no clear exec sponsor, this is a top risk. Flag it and recommend the team work with the CSM/AE to establish one.
- **No Technical Champion** — Without someone on the customer side who can own data connections and governance, the build phase will stall.
- **Concentration Risk** — If all engagement is flowing through a single person, that's fragile. Recommend broadening relationships.
- **Skeptic with High Influence** — This is the most dangerous combination. Recommend a targeted strategy: find their pain point and deliver a quick win that speaks directly to their concern.
- **Missing End Users** — If you don't know who will actually use the dashboards/apps, you're building blind.

### Step 4: Map to Domo Value Pillars

For each stakeholder, connect their concerns to Domo's impact framework:

**Executive Sponsor / CFO / COO types:**
- **Cost Savings**: "Domo consolidates 4 BI tools into one → $200K/year in licensing alone"
- **Risk Mitigation**: "Single source of truth eliminates conflicting reports going to the board"

**Department Heads / Directors:**
- **Revenue Generation**: "Real-time pipeline visibility means your sales managers can act on opportunities 2 weeks faster"
- **Cost Savings**: "Your team of 5 analysts spends 40% of their time pulling data manually. That's 2 FTEs worth of time — roughly $240K/year — spent on data janitorial work instead of analysis"

**IT / Data Engineering:**
- **Risk Mitigation**: "Domo's governance layer gives you audit trails, role-based access, and certified datasets"
- **Cost Savings**: "Reduce ETL maintenance burden — Domo's cloud-native connectors eliminate custom pipeline maintenance"

**End Users / Frontline Managers:**
- **Revenue Generation**: "Daily visibility into your team's KPIs means you catch problems Monday, not Friday"
- **Cost Savings**: "No more waiting 3 days for a report request — self-service means instant answers"

### Step 5: Generate the Output

Create a stakeholder map document with:

1. **Visual Summary** — A table with all stakeholders, their type, influence, sentiment, and what they care about
2. **Relationship Diagram Description** — Describe the power dynamics: who reports to whom, who influences whom, where the informal power sits
3. **Risk Register** — Top 3-5 stakeholder-related risks with mitigation strategies
4. **Engagement Plan** — For each stakeholder type, recommended cadence and approach
5. **Value Messaging Guide** — For each key stakeholder, a 1-2 sentence value message tailored to their role and concerns, framed as Cost Savings, Revenue Generation, or Risk Mitigation

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

### Stakeholder Type Quick Reference

| Type | Who They Are | Why They Matter | Engagement Approach |
|---|---|---|---|
| **Executive Sponsor** | VP+ who owns the budget and vision | Without them, nothing has organizational weight | Steering committee, quarterly business reviews |
| **Decision Maker** | Person who approves scope, timeline, resources | They control the go/no-go | Keep informed, surface decisions early |
| **Champion** | Internal advocate who believes in Domo | They sell internally when you're not in the room | Empower with data, give them wins to share |
| **Technical Lead** | Data engineer, IT lead, or admin | They make or break the technical implementation | Involve early in design, respect their expertise |
| **End User** | Person who will use the dashboards daily | Adoption lives or dies with them | Understand their workflow, make it easy |
| **Influencer** | Respected voice who shapes opinions | Can sway skeptics or amplify champions | Build relationship, share relevant wins |
| **Gatekeeper** | Controls access to people, data, or systems | Can block progress if not managed | Understand their concerns, address proactively |
| **Skeptic** | Doubts the value or has been burned before | Ignoring them is the biggest mistake | Find their specific pain point, deliver a targeted win |

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent "prep" (account and `engagement-observations` for people context); use `memory_bundle` if observations are split across scopes.
### After executing
- Call `memory_remember` with new stakeholder details for `engagement-observations` and summary notes scoped to `{account_id}`.
- Call `memory_store_artifact` for the StakeholderMap in `engagement-artifacts`.
