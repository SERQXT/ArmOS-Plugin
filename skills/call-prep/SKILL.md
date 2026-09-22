---
name: call-prep
tier: 1
description: "Prepare for a customer meeting by pulling account context, recent calls, health signals, active actions, and external intelligence into a structured prep doc. Trigger with 'prep me for my call with [account]', 'call prep for [customer]', 'I have a meeting with [account]', 'get me ready for [customer]', or any request to prepare for a customer conversation."
maturity: alpha
audience: [intelligence]
---

# Call Prep — Pre-Call Briefing

Get fully prepped for a customer call in under 2 minutes. Pulls internal Domo data + external intelligence into a single prep sheet with talking points, landmines to avoid, and opportunities to pursue.

## How It Works

```
User says: "prep me for my call with Consumer Reports"
                    |
    +-------+-------+-------+-------+-------+
    |       |       |       |       |       |
 Portfolio  HG     Actions  Calls   Web     Asana
 (context) Grades  (plays)  (last   Research (delivery)
           (why)           calls)  (news)
    |       |       |       |       |       |
    +-------+-------+-------+-------+-------+
                    |
         Synthesize into Call Prep Sheet
                    |
         Generate Talking Points + Agenda
```

## Triggers

- "prep me for my call with [account]"
- "call prep for [customer]"
- "I have a meeting with [account]"
- "get me ready for [customer]"
- "what should I know before talking to [account]"
- "brief me before my [account] call"
- "meeting prep for [customer]"

## Execution Flow

### Step 1: Gather Context (parallel)

```
1. portfolio_summary(account_name)
   → Health grade, GPA, renewal date, pacing, signals, CSM, AE, segment

2. hggrades_lookup(account_id)
   → Component health scores — know which dimensions are strong/weak
   → 30-day trends — know what's improving/declining RIGHT NOW

3. actions_lookup(account_name)
   → Active signals and recommended plays
   → Know what the data says you should be doing with this account

4. calls_lookup(account_name, limit=3)
   → Last 3 calls: what was discussed, what was the sentiment,
     what commitments were made, who attended

5. hgsupport_lookup(account_name, limit=5) [when available]
   → Open/recent support cases: priority, status, subject
   → Must-know: "They have 2 critical open bugs" changes the call dynamic

6. sfopportunities_lookup(account_name, limit=5) [when available]
   → Active deals: renewal stage, upsell pipeline, ACV, close date
   → Must-know: "There's a $150K upsell at Negotiations" changes how you frame the call

7. hgrelationship_lookup(account_name, limit=20) [when available]
   → Recent email/meeting activity from People.ai: engagement frequency, direction
   → Are they reaching out more (good) or going silent (concerning)?

8. WebSearch("[Company Name] news [current month/year]")
   → Any breaking news or events the customer might bring up
   → Shows you're informed and paying attention

9. asana [if connected]
   → Active project status, blockers, upcoming milestones
   → Don't walk into a call not knowing where the project stands
```

### Step 2: Identify Conversation Dynamics

Analyze the data to understand the relationship temperature:

| Signal | Source | What to Watch For |
|--------|--------|-------------------|
| **Sentiment trend** | Calls | Last 3 calls trending negative? Positive? Mixed? |
| **Engagement frequency** | Relationship data | Email/meeting volume trending up or down? Inbound vs outbound ratio? |
| **Commitment follow-through** | Calls + Asana | Did we do what we said we'd do last time? |
| **Health trajectory** | HG Grades | 30d trends — what's getting better/worse since last call? |
| **Signal urgency** | Actions | Any "Immediate" urgency actions that haven't been addressed? |
| **Support situation** | Support Cases | Any open critical/high cases they'll likely bring up? |
| **Deal context** | SF Opportunities | Active renewal/upsell that frames the conversation? |
| **External context** | Web Research | Any company news they might expect us to know about? |

### Step 3: Generate Prep Sheet

---

## Output Template

```markdown
# Call Prep: [Account Name]

**Meeting Date:** [Date/Time if known]
**Generated:** [Now]
**Your Role:** [CSM / AE / Consultant — inferred from context]

---

## 60-Second Account Snapshot

| | |
|---|---|
| **Health** | [Grade] ([GPA]) — [one word: Improving / Declining / Stable] |
| **Renewal** | [Date] — [X] days out — Forecast: [X]% of baseline |
| **Pacing** | [X]% through period |
| **Momentum** | [momentum_segment] |
| **Last Call** | [Date] — [Title] — [Sentiment] |
| **Risk Signals** | [N] total, [N] in last 30 days |
| **Growth Signals** | [N] total, [N] in last 30 days |

---

## What Happened Last Time

**Last Call:** [Title] — [Date] — [Duration] min
**Attendees:** [Names]
**Sentiment:** [Sentiment]

**Key Topics Discussed:**
- [Topic 1 from call recap]
- [Topic 2]
- [Topic 3]

**Commitments Made:**
- [ ] [Commitment 1 — who owned it — was it completed?]
- [ ] [Commitment 2]
- [ ] [Commitment 3]

⚠️ **Open Commitments:** [List anything we promised but haven't delivered]

---

## Health Deep-Dive: What's Moving

**Improving (last 30 days):**
- [Metric] in [Health Course]: [previous → current] [↑ X%]

**Declining (last 30 days):**
- [Metric] in [Health Course]: [previous → current] [↓ X%]

**Critical Gaps (D/F grades):**
- [Health Course]: [Metric] = [Grade] — [What this means in plain English]

---

## Active Signals & Plays

### 🔴 De-Risk (address these)
| Action | Urgency | Suggested Play | Your Role |
|--------|---------|----------------|-----------|
| [recommended_action] | [urgency] | [play1_name] | [play1_executing_role] |

### 🟢 Growth (pursue these)
| Action | Urgency | Suggested Play | Your Role |
|--------|---------|----------------|-----------|
| [recommended_action] | [urgency] | [play1_name] | [play1_executing_role] |

---

## External Context (from Web Research)

**Recent News:**
- [Headline 1] — [Date] — [Why it matters to this call]
- [Headline 2]

**Things They Might Bring Up:**
- [External event that could come up in conversation]
- [Industry trend relevant to their business]

---

## Support Situation [when available]

[From hgsupport_lookup — flag open cases they may raise]

| Case # | Priority | Status | Subject | Created |
|--------|----------|--------|---------|---------|
| [CaseNumber] | [Priority] | [Status] | [Subject] | [Date] |

⚠️ **Heads up:** [N] open case(s) ([critical/high count] critical/high) — be prepared to address these.

---

## Deal Context [when available]

[From sfopportunities_lookup — active pipeline context]

| Opportunity | Type | Stage | ACV | Close Date |
|-------------|------|-------|-----|------------|
| [Name] | [Type] | [Stage] | $[ACV] | [Date] |

**Frame the call around:** [How the active deal context should shape the conversation]

---

## Delivery Status (from Asana — if available)

| Project | Status | % Complete | Next Milestone | Due |
|---------|--------|------------|----------------|-----|
| [Project] | [On Track/At Risk/Blocked] | [X%] | [Milestone] | [Date] |

**Blockers:** [Any blockers to address on this call]

---

## Suggested Agenda (15 min framework)

**Opening (2 min)**
- "Since our last call on [date], I wanted to follow up on [commitment]..."
- [Reference any external news to show you're paying attention]

**Progress & Value (5 min)**
- [Address improvements in health scores — celebrate wins]
- [Delivery status update if relevant]
- [Show any metrics that demonstrate value]

**Address Concerns (5 min)**
- [Tackle declining health dimensions proactively]
- [Address open commitments — provide status or resolution]
- [Surface any de-risk actions as discussion points]

**Forward Look (3 min)**
- [Growth opportunities to plant seeds for]
- [Upcoming milestones or renewal timeline awareness]
- [Clear next steps with owners and dates]

---

## Talking Points

### Lead With (positive framing)
- "[Health metric] has improved [X%] in the last 30 days — [what drove this]"
- "[Usage metric] shows strong adoption in [area]"

### Address Proactively (don't wait for them to bring it up)
- "[Declining metric] — here's what we're seeing and what we recommend"
- "[Open commitment] — status update and next steps"

### Avoid / Handle Carefully
- [Topic that could be sensitive based on call history or signals]
- [Area where we don't have a good answer yet]

### Plant Seeds For
- [Growth opportunity from actions data]
- [Upsell/cross-sell aligned with their strategic priorities]

---

## Quick Reference

| | |
|---|---|
| CSM | [Name] ([Email]) |
| AE | [Name] ([Email]) |
| CSM Manager | [Name] |
| Primary Contact | [PRIMARY_NAME from Portfolio] |
| LinkedIn | [PRIMARY_LINKEDIN_URL] |
| Services | [Has Active Services] — [Project Name(s)] |
| ACE | [Has ACE] → [hg_acePackage] |

---

**Prepared by:** Compass Call Prep Agent
**Data Sources:** Portfolio, HG Grades, Actions, Calls[, Support Cases, SF Opportunities, Relationship, Web Research, Asana]
```

---

## Guardrails

- **Recency matters most.** The last call and last 30 days of data are more important than historical trends. Lead with what's fresh.
- **Don't surprise the CSM.** If there's bad news (declining health, negative sentiment), surface it in the prep — better to know before the call than during.
- **Commitments are sacred.** If we made a commitment on the last call, the very first thing in the prep should be whether we delivered.
- **Keep it scannable.** This gets read 5 minutes before a call. Use tables, bold, and short bullets. No walls of text.
- **Don't fabricate talking points.** Every talking point must trace back to real data. If you don't have data, say "No recent data available."
- **External news is a power move.** Even one relevant headline shows the customer you're paying attention. Always include it when available.
- **Flag when data is missing.** If calls_lookup returns nothing, say "No recorded calls found" — don't skip the section silently.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| portfolio_summary | **Yes** | Account snapshot — the foundation |
| hggrades_lookup | **Yes** | Health dimension details — know the "why" |
| actions_lookup | **Yes** | What the data says to do |
| calls_lookup | **Yes** | What happened last time — critical for continuity |
| hgsupport_lookup | Optional | Open support cases — know what they'll bring up |
| sfopportunities_lookup | Optional | Active deals — frame the conversation appropriately |
| hgrelationship_lookup | Optional | Engagement frequency/direction — is the relationship warming or cooling? |
| WebSearch | Recommended | External context — shows you're informed |
| asana | Optional | Delivery status — know where projects stand |

---

## Memory

### Before executing

- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load **account** context (stakeholders, health snapshot).
- Call `memory_recall` with intent `"prep"` scoped to the engagement to load **engagement-working** (current state) and **engagement-observations** (Gong takeaways) per your memory layer configuration.
- Call `memory_recall` with intent `"patterns"` to load **patterns-library** (relevant plays and cross-account patterns).
- Call `memory_bundle` when you need all four layers (account, engagement-working, engagement-observations, patterns) in one consolidated read.

### After executing

- Call `memory_remember` scoped to the engagement (and `{account_id}` as required by your memory contract) with the **CallPrepBrief**: snapshot, last-call continuity, agenda, talking points, and landmines — so the next session picks up from this prep.

---

## Related Skills

- **Account 360** (Discover) — Deeper dive if you need full account context
- **Web Research** (Discover) — Extended company intelligence for strategic calls
- **Adoption Acceleration** (Adopt) — If the call reveals adoption gaps, pivot to this
- **Weekly Status** (Build) — If this is a recurring weekly, that agent handles the cadence
- **Template Registry** (Global) — PMO 02 Proposed Agenda template for formal meeting agendas
