---
name: align-relationship-map
tier: 1
description: "Build a structured Relationship Map for a Domo PS engagement — who the key people are, their sentiment toward Domo, their influence on the engagement, and how to get them talking. Pulls live data from Compass MCP tools (Gong calls, People.ai relationship activity, Domo user engagement, SF opportunities) to surface both known and hidden contacts. Produces a branded .docx with a stakeholder summary table, per-person profile cards (sentiment, influence, value message, engagement strategy, and 3 conversation-starter questions), a risk register, and coverage gaps. Trigger on 'relationship map for [account]', 'stakeholder map for [customer]', 'who are the key people at [account]', 'map the stakeholders for [account]', 'who should we be talking to at [customer]', 'align-relationship-map [account]', or any request to understand the people landscape, sentiment, or engagement strategy for a PS customer. Also trigger proactively whenever a kickoff, discovery call, or design session is being prepared and the team needs to know who's who."
maturity: alpha
audience: [delivery, intelligence]
pipeline:
  phase: align
  sub_phase: planning-and-kickoff
  position: 3
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: kickoff-brief
      required: false
      data: initial contact names, engagement context
    - agent: calls_lookup
      required: false
      data: recent call attendees, sentiment
  outputs:
    - name: align-relationship-map
      format: docx
      downstream:
        - agent: alignment-gate
        - agent: kickoff-brief
        - agent: weekly-status
  data_sources:
    - tool: portfolio_lookup
      required: true
    - tool: calls_lookup
      required: true
    - tool: hgrelationship_lookup
      required: true
    - tool: hguserengagement_lookup
      required: true
    - tool: sfopportunities_lookup
      required: false
    - tool: hgsupport_lookup
      required: false
---

# Align — Relationship Map

Produces a branded Domo PS Relationship Map .docx that helps the engagement team understand who they're dealing with, where the support and resistance lives, and how to move each person.

Engagements succeed or fail based on people, not technology. A champion who can't get internal approval is useless. A skeptic with budget authority can kill a renewal. This map surfaces those dynamics early so the team can engage strategically — not reactively.

## Step 1: Gather Data (run in parallel)

```
portfolio_lookup(account_name)
  → CSM, AE, primary contact, renewal date, health, segment

calls_lookup(account_name, limit=5)
  → Recent Gong call attendees, sentiment, topics, commitments made

hgrelationship_lookup(account_name, limit=50)
  → All People.ai meeting/email participants: names, emails, titles,
    departments, frequency. This expands contact universe beyond Gong.

hguserengagement_lookup(account_name, limit=50)
  → All Domo users: login frequency, role, CXO flag, active status.
    Power users (high days_logged_in) are latent champions.
    Admins are technical leads. CXO users are executive contacts.
    Inactive users who used to be active are at-risk signals.

sfopportunities_lookup(account_name)
  → Active renewal/upsell deals — shapes how each stakeholder's
    value message should be framed (cost defense vs. growth story)

hgsupport_lookup(account_name, limit=10)   [optional]
  → Open/recent cases — some contacts may be frustrated about bugs
    or outages; know this before engaging them
```

## Step 2: Classify Stakeholders

For every identified person, determine:

| Field | Options / Notes |
|---|---|
| **Influence** | HIGH / MEDIUM / LOW — how much can they affect the engagement outcome? |
| **Sentiment** | Advocate / Neutral / Skeptic / Unknown / At Risk |
| **Type** | See table below |
| **What they care about** | Frame in terms of Cost Savings, Revenue Generation, or Risk Mitigation |

**Stakeholder types and how to spot them:**

| Type | Signals |
|---|---|
| Executive Sponsor | VP+ title, attends steering meetings, owns budget |
| Decision Maker | Approves scope, timeline, resources — controls go/no-go |
| Champion | Shows up consistently, raises specific pain points, advocates internally |
| Technical Lead | Admin/Editor role in Domo, involved in data/ETL questions |
| End User | Participant role, high login days — relies on Domo daily |
| Influencer | Respected voice, not in every meeting but shapes opinions |
| Gatekeeper | Controls data access, system access, or meeting attendance |
| Skeptic | Raises cost/ROI objections, compares to alternatives, skeptical of value |
| Silent Influencer | High title, historically engaged but recently gone quiet |

**Sentiment signals from data:**
- Advocate: Attending calls, raising specific feature requests, driving cleanup work
- Neutral: Shows up when invited, no strong signals either way
- Skeptic: Questions cost, mentions alternatives, asks for ROI evidence
- At Risk: Senior user with significant login drop-off (e.g., no login in 60+ days)
- Unknown: In the data (People.ai / user list) but never on a call

## Step 3: Build Stakeholder Profiles

For each person, synthesize:

**Value message** — A 1–2 sentence statement of what Domo delivers *for this specific person's role*. Not a feature list — a business outcome framed around their primary concern. Connect it to one of the three value pillars: Cost Savings, Revenue Generation, or Risk Mitigation.

**Engagement strategy** — Concrete actions the team should take. Examples: "Request a dedicated exec sponsor conversation," "Give her the technical lead role formally," "Direct outreach — treat as user research, not a sales call."

**3 questions to open the conversation** — Questions that invite them to talk about their pain, not pitch points in question form. Good questions reveal something neither side fully knows yet. Bad questions are disguised demos ("Wouldn't you say Domo saves you time?").

**Watch outs** — Anything that could backfire if mishandled. Institutional ownership, political sensitivities, prior disappointments with Domo.

## Step 4: Identify Risks and Coverage Gaps

**Risk register — flag these patterns:**
- Single point of contact (one person carries champion + decision-maker)
- Finance/executive not engaged while renewal is active
- High-influence skeptic with no targeted strategy
- Active senior users who have gone quiet (possible disengagement or alternative tool)
- No technical champion (engagement will stall in design/build)
- Missing departments (HR, Finance, Operations) whose use cases are in scope

**Coverage gaps — flag these missing relationships:**
- Unnamed / unidentified people referenced in calls ("finance leadership," "the new VP")
- Departments visible in user data but not in any call
- CXO/VP users who have never been on a call
- High-login end users who could be power user champions

## Step 5: Build the JSON and Generate the Doc

Assemble a JSON file with this structure (save to working directory):

```json
{
  "account_name": "Acme Corp, LLC",
  "engagement_name": "Adoption Engine",
  "date": "March 2026",
  "stakeholders": [
    {
      "name": "Jane Smith",
      "email": "jane.smith@acme.com",
      "title": "VP of Data & Analytics",
      "dept": "Engineering",
      "type": "Decision Maker / Champion",
      "influence": "HIGH",
      "sentiment": "Advocate",
      "meetings": "Kickoff, all weekly syncs, renewal call",
      "careAbout": "Justifying the Domo investment to finance, cleaning up technical debt",
      "pillar": "Cost Savings + Risk Mitigation",
      "valueMsg": "The work we're doing turns years of technical debt into a clean, defensible instance — and gives you the cost visibility you need to walk into any finance review and win.",
      "strategy": "She is your primary champion AND is under fire internally. Equip her with ROI materials and pricing scenario docs before the renewal call.",
      "questions": [
        "What does a 'win' look like for you heading into the renewal?",
        "What's the single most important thing finance needs to see?",
        "Who in finance is the ultimate decision-maker on the Domo investment?"
      ],
      "watchOuts": "Single point of contact — concentration risk. If she loses internal standing, the engagement collapses. Broaden relationships now."
    }
  ],
  "risks": [
    {
      "risk": "Single point of contact concentration",
      "severity": "🔴 Critical",
      "detail": "All engagement flows through one person. If they leave or lose standing, the engagement has no backup.",
      "mitigation": "Identify and engage a second VP-level contact. Build a steering committee structure with at least two exec-level contacts."
    }
  ],
  "coverage_gaps": [
    {
      "gap": "Finance leadership not engaged",
      "description": "Renewal decision runs through finance but no finance exec has ever been on a Domo call. All context filtered through the champion.",
      "action": "Work with champion to identify and schedule a joint meeting with the finance decision-maker. Prepare a dollar-value business case before that meeting."
    }
  ],
  "priority_actions": [
    "CFO / Finance VP — Identify via champion, schedule business case briefing before renewal",
    "SVP Engineering — Request formal executive sponsor conversation",
    "Power User cohort — Identify top 5 for potential testimonials in renewal business case"
  ]
}
```

Then run the doc generator. First, find the correct path for this session:

```bash
SCRIPT_DIR="$(dirname "$0")/scripts"  # relative to skill base dir — adjust if needed
# Find docx module (the script auto-detects, but confirm node is available)
which node || echo "node not found — install via apt or nvm"

node "$SCRIPT_DIR/generate-relationship-map.js" /path/to/data.json /path/to/output.docx
```

The output filename should be: `[AccountName]-Align-Relationship-Map.docx`
Save to the Cowork outputs folder: `/sessions/*/mnt/_Cowork/`

## Output checklist

Before presenting the file, confirm:
- [ ] Every stakeholder from the calls has a profile card
- [ ] At least one risk identified (if none exist, re-examine the data)
- [ ] Coverage gaps section includes any unnamed contacts referenced in call recaps
- [ ] Priority actions are specific and ordered by urgency
- [ ] Filename follows convention: `[AccountName]-Align-Relationship-Map.docx`

## Guardrails

- **Never fabricate sentiment.** If someone hasn't been on a call and left no signal in the data, mark them Unknown — not Neutral. Unknown is an action item; Neutral implies no concern.
- **Watch outs must be real.** Don't invent political dynamics. Only document watch outs that are supported by something in the calls, actions, or data.
- **Value messages must be role-specific.** A value message for a CFO and a value message for a BI Manager should sound completely different. Generic messages ("Domo helps you make better decisions") are useless.
- **Questions should invite disclosure, not confirm your thesis.** If the answer is obviously "yes," it's not a real question.
- **Power users are often the best internal champions** — they have credibility with peers that consultants don't. Always call out the top 3–5 by login days and suggest using them in the renewal business case.
- **Missing contacts matter as much as known ones.** Finance leaders, ops leaders, and HR stakeholders are often invisible in early engagement data but critical to renewal. Flag them explicitly.

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context and engagement artifacts.

### After executing
- Call `memory_store_artifact` scoped to `{account_id}` with the produced artifact.
