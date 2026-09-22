---
name: persona-builder
tier: 1
description: "Builds dashboard user personas from Gong call transcripts, meeting notes, and customer context. If no transcripts exist, synthesizes a persona from the domain and data shape. Produces a structured persona profile that feeds into dashboard-architect for audience-driven design. Trigger with 'build a persona', 'who uses this dashboard', 'define the audience', or automatically as part of the dashboard-builder symphony."
maturity: alpha
audience: [orchestration]
---

# Persona Builder — Audience Discovery from Customer Evidence

Builds structured user personas for dashboard design by mining real customer evidence: Gong call transcripts, meeting notes, knowledgebase documents, and conversation context. When no evidence exists, synthesizes a credible persona from the domain and data shape.

The output is a **Persona Profile** — a structured document that the dashboard-architect consumes to make every design decision audience-specific: card count, complexity, interaction depth, KPI selection, and language.

## Why This Matters

A dashboard designed for "managers" is generic. A dashboard designed for "Sarah, VP of Operations at Jet's Pizza, who checks fulfillment rates every morning on her laptop and asks 'which stores need help today?'" is specific — and specific dashboards get used.

## Triggers

- "build a persona for this dashboard"
- "who uses this dashboard?"
- "define the audience"
- "what do the stakeholders care about?"
- Automatically invoked as Step 1.5 of the dashboard-builder symphony

---

## Execution Flow

### Step 1: Gather Evidence

Try each source in order. Use whatever is available — you may get evidence from multiple sources.

#### Source A: Gong Call Transcripts (Best Evidence)

If a customer context exists and `calls_lookup` is available:

```
calls_lookup(account_name, limit=5)
```

From each call, extract:
- **Who attended** — names, titles, roles
- **What questions they asked** — these map directly to dashboard cards
- **What language they used** — "fulfillment rate" vs "fill rate" vs "on-time delivery" (use THEIR terms)
- **What decisions they referenced** — "I need to know which stores to call" → operational decision
- **What frustrations they expressed** — "I can't see this in one place" → dashboard opportunity
- **What cadence they mentioned** — "every morning", "in our weekly meeting", "at month-end"
- **What device context** — "on my phone", "in the boardroom", "at my desk"

#### Source B: Knowledge Base Documents

Search the account knowledgebase for:
- Requirements documents, SOWs, discovery notes
- Prior dashboard specs or design docs
- Stakeholder maps

Extract the same signals: who, what questions, what language, what decisions.

#### Source C: Conversation Context

If the user has described the audience in the current conversation:
- Direct statements ("this is for the VP of Sales")
- Implied audience ("they want to see regional performance" → regional manager)
- Business questions provided by the user

#### Source D: Data Shape Inference (Fallback)

If no customer evidence exists, infer the persona from the dataset:

| Data Signal | Persona Inference |
|---|---|
| Geographic columns (Region, State, Store) | Regional/area manager who manages by geography |
| Time-series data with daily grain | Operational user who checks daily |
| Financial columns (Revenue, Cost, Margin) | Finance/executive who tracks P&L |
| Customer/account columns | Account manager or customer success |
| Product/SKU columns | Product manager or merchandiser |
| HR columns (Employee, Department, Tenure) | HR leader or people manager |
| Fantasy sports data | Fantasy league manager optimizing draft/lineup |
| Marketing columns (Campaign, Channel, CPC) | Marketing manager measuring ROI |

#### Source E: Domain Synthesis (Last Resort)

If the data is domain-specific with no customer context, synthesize a realistic persona:

> "For a fantasy football projections dataset, the persona is a **Fantasy League Manager** — someone preparing for their draft who needs to quickly identify the best value picks, compare platform rankings, and spot sleepers. They'll view this on a laptop during draft prep, probably for 15-30 minutes. Their top question is 'who should I draft next?' and they care about FP (fantasy points) as the primary metric."

This is better than no persona — it still constrains the design.

---

### Step 2: Synthesize the Persona Profile

Combine all evidence into a structured profile. If multiple users emerged (e.g., an executive and an analyst), create the **primary persona** (most frequent dashboard user) and note secondary personas.

**Output format:**

```markdown
## Persona Profile

### Primary Persona

**Name:** [Real name if known from transcripts, or a descriptive label]
**Role:** [Title and responsibility — e.g., "VP Operations, responsible for 12-state fulfillment network"]
**Decision Authority:** [What decisions this person makes — e.g., "Allocates resources to underperforming stores"]

**Dashboard Usage Pattern:**
- **Frequency:** [Daily / Weekly / Monthly / Ad-hoc]
- **Duration:** [Glance (5 sec) / Scan (1-2 min) / Explore (5-10 min) / Deep dive (15+ min)]
- **Device:** [Laptop / Mobile / Boardroom display / Tablet]
- **Context:** [Morning standup / Weekly review / Board prep / Draft night]

**Top 3 Questions:**
1. [Exact question in their language — e.g., "Which stores need help today?"]
2. [Second question — e.g., "Are we trending better or worse than last month?"]
3. [Third question — e.g., "Which product categories are dragging us down?"]

**Language & Terms:**
- Uses "[their term]" not "[our term]" (e.g., "fill rate" not "fulfillment percentage")
- Refers to [metric] as [their name for it]
- Cares about [specific dimension] more than [other dimension]

**Frustrations / Gaps:**
- [What they can't see today — e.g., "No single view of all regions"]
- [What takes too long — e.g., "Have to pull 3 reports to answer one question"]

**Success Metric:**
[How they'd judge this dashboard — e.g., "Can I answer my top 3 questions in under 30 seconds without clicking anything?"]

### Secondary Personas (if any)

**[Name/Role]:** [Brief — how their needs differ from primary. e.g., "Analyst who drills into store-level detail after VP flags a problem region"]

### Design Implications

| Persona Signal | Design Constraint |
|---|---|
| [Frequency: daily] | Keep it simple — hero KPIs must answer top question at a glance |
| [Duration: 5-second glance] | Max 5 KPIs, max 5 cards above the fold |
| [Device: laptop] | 12-column grid, standard viewport |
| [Question: "which stores need help?"] | Need a sorted bar chart or conditional table with poor performers highlighted |
| [Language: "fill rate"] | Use "Fill Rate" in card titles, not "Fulfillment Percentage" |
| [Decision: resource allocation] | Cross-filtering from geography → detail table for actionable records |
```

---

### Step 3: Validate and Present

Before passing to the dashboard-architect:

1. **Check completeness** — Every field in the profile should have a value. If evidence is thin, note it as "[inferred]" so the architect knows the confidence level.
2. **Check consistency** — Do the questions match the role? Does the frequency match the decision type? A daily operational check and a monthly board report have very different designs.
3. **Present to the user** — Show the persona and ask: "Does this match who'll use this dashboard? Any corrections?"

If the user corrects the persona, update it. The corrected version flows to the architect.

---

## How This Feeds Into Dashboard Design

The persona profile maps directly to dashboard-architect constraints:

| Persona Field | Architect Constraint |
|---|---|
| Frequency + Duration | Card count, complexity, interaction depth |
| Top 3 Questions | Above-the-fold card selection (each question = a card) |
| Device | Grid density, font sizes, responsive behavior |
| Language & Terms | Card titles, axis labels, filter names |
| Decision Authority | What the "actionable records" tier shows |
| Frustrations | What the dashboard must solve (anti-requirements) |
| Success Metric | The 5-second test criteria |

The dashboard-architect's audience profile table maps as:

| Persona Duration | Architect Audience | Max KPIs | Max Cards |
|---|---|---|---|
| 5-second glance | Executive | 4-5 | 3-5 |
| 1-2 min scan | Director/VP | 5-7 | 5-8 |
| 5-10 min explore | Manager/Analyst | 6-8 | 8-12 |
| 15+ min deep dive | Analyst/Operations | 6-8 | 8-12 |

---

## Tool Mapping

| Step | Tools | Notes |
|------|-------|-------|
| Gather Gong calls | `calls_lookup` | If customer context + tool available |
| Search knowledgebase | Knowledge store search | If knowledgebase has documents |
| Profile dataset | `dataset_schema`, `dataset_profile` | For data shape inference |

## MCP Servers

- **compass-domo** — for `calls_lookup` (Gong call summaries)
- **mcp-knowledge-store** — for knowledgebase document search
- **domo-datasets** — for data shape inference (fallback)

---

## Guardrails

- **Real evidence beats inference.** If you have transcripts, use them. Don't synthesize when real data exists.
- **One primary persona.** Multiple users is fine, but the dashboard is designed for ONE primary user. Secondary personas get accommodated, not optimized for.
- **Use their language, not yours.** If the VP says "fill rate," every card title says "Fill Rate." Don't normalize to internal jargon.
- **Inferred personas must be flagged.** Mark anything not grounded in evidence as "[inferred]" so the architect and user know the confidence level.
- **The persona is a living document.** After the dashboard ships, update the persona based on actual usage patterns if available.
- **Don't over-specify without evidence.** A thin persona ("fantasy league manager preparing for draft") is better than a fabricated detailed one. Keep confidence proportional to evidence.

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: persona name, role, goals, data needs, decision-making patterns, dashboard usage context, source material used.

## Related Skills

- **Dashboard Architect** (Compass Core) — consumes the persona profile for audience-driven design
- **Dashboard Builder** (Build) — invokes this skill as Step 1.5 of the symphony
- **Call Prep** (Compass Core) — also uses `calls_lookup`; similar pattern for extracting meeting insights
- **Stakeholder Map** (Discover) — complementary skill that maps all stakeholders, not just dashboard users
