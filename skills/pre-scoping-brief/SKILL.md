---
name: pre-scoping-brief
tier: 1
description: "Prepare the Services Solutions Director before a scoping call — account context, deal status, prior call history, use case summary, Domo platform components, data sources, discovery agenda, and outstanding questions. Trigger with 'pre-scoping brief for [account]', 'prep notes for [account]', 'prepare scoping call for [meeting]', or 'generate pre-call brief'. Also runs automatically each weekday morning for calls scheduled that day."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: discover
  sub_phase: pre-call-preparation
  position: 1
  output_type: output
  wave: 1
  state: ready
  inputs: []
  outputs:
    - name: pre-scoping-brief
      format: markdown
      downstream:
        - agent: discovery-synthesizer
  data_sources:
    - tool: calendar_lookup
      required: true
    - tool: gong_transcript_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: portfolio_lookup
      required: false
  phase_gate: false
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Pre-Scoping Brief Agent — Scoping Call Readiness

Generates a short, highly digestible pre-scoping call brief before a scheduled scoping call. The agent identifies the upcoming call from the team member's calendar, retrieves prior Gong transcripts for the account, extracts critical context, and delivers a structured brief that prepares the Services Solutions Director in under two minutes. This skill does not just summarize — it actively identifies what is missing and what must be resolved on the call.

## How It Works

```
Calendar Invite + Previous Gong Transcripts + Account Data
                            |
  +--------+--------+--------+--------+--------+--------+
  |        |        |        |        |        |        |
Account   Use    Expected  Domo    Data    Discovery  Risks &
Summary  Case    Value    Parts  Sources   Agenda    Unknowns
  |        |        |        |        |        |        |
  +--------+--------+--------+--------+--------+--------+
                            |
          Assemble Pre-Scoping Call Brief
                            |
           🔵 OUTPUT: Pre-Scoping Brief
                            |
          → Discovery Synthesizer (downstream)
```

## Triggers

- "pre-scoping brief for [account]"
- "prep notes for [account]"
- "prepare scoping call for [meeting]"
- "generate pre-call brief"
- "what do I need to know before my call with [account]"
- Automatically runs each weekday morning for calls scheduled that day
- Manually triggered for a specific upcoming meeting

## Execution Flow

### Step 1: Identify the Upcoming Scoping Call

```
calendar_lookup(today or date range)
→ Scan meeting titles and descriptions for scoping call indicators
→ Extract: account name, opportunity name, attendees, scheduled time
→ If multiple calls found: surface all; let user select or run for each
```

Scoping call indicators to detect:
- "scoping", "discovery", "requirements", "intro call", "PS call"
- Meeting invites that include Domo PS team members

### Step 2: Pull Prior Gong Transcripts

```
gong_transcript_lookup(account_name, limit=5, type="scoping|discovery")
→ Retrieve the most recent scoping and discovery call transcripts
→ Order by recency — most recent call carries most weight
→ If no prior Gong transcripts: flag as "first contact" and note higher discovery burden
```

### Step 3: Pull Supporting Account Context

```
portfolio_lookup(account_name)         [if available]
→ Account profile, ARR, segment, CSM, AE, products, renewal date

calls_lookup(account_name, limit=3)    [if available]
→ Recent conversations — relationship temperature, commitments made
```

### Step 4: Extract Key Context from Transcripts

Analyze each transcript to extract:

| Element | What to Look For |
|---------|-----------------|
| **Account summary** | What the customer does, their Domo context, current state |
| **Use case** | What they are trying to build or solve |
| **Expected value** | Why they see value in Domo, what outcome they expect |
| **Domo components** | Which platform parts have been discussed (ETL, dashboards, Everywhere, Workflows, AI, etc.) |
| **Data sources** | Source systems named in prior calls |
| **Dashboards discussed** | Specific reporting or visualization use cases already identified |
| **Outstanding questions** | What was left unresolved or explicitly flagged for follow-up |
| **Commitments made** | Anything promised by Domo or expected from the customer |
| **Concerns or risks** | Objections, timeline pressure, budget signals, political dynamics |

### Step 5: Build Discovery Agenda

Generate a prioritized question list for the call using extracted context as the baseline:

- Questions that resolve gaps in the use case definition
- Questions that confirm data source types and access
- Questions that surface LOE drivers (volume, complexity, integrations)
- Questions that identify scope risks before they become SOW problems
- Any unresolved questions carried forward from prior calls

Tag each question with its purpose:
- `[LOE]` — needed for accurate estimation
- `[SCOPE]` — needed to define what is in vs. out
- `[RISK]` — surfaces a potential problem early
- `[MISSING]` — information not yet gathered that blocks downstream work

### Step 6: Assemble and Deliver the Brief

---

## Output Template

```markdown
# Pre-Scoping Call Brief: [Account Name]
**Call:** [Date & Time] | **With:** [Attendee Names & Titles]
**Prepared:** [Date] | **SSD:** [Name]

---

## Account Context

| | |
|---|---|
| **Account** | [Name] |
| **Segment** | [Segment] |
| **ARR** | $[amount] (if known) |
| **CSM** | [Name] |
| **AE** | [Name] |
| **Products** | [Current Domo products] |
| **Renewal** | [Date] (if known) |

**Situation Summary:**
[2–3 sentences — what the customer does, why they're talking to PS, and where they are in the process]

---

## Use Case Summary

[One paragraph — what the customer is trying to solve. Include what they've described as the problem,
what they want to build, and any context on why now.]

**Prior Call History:** [X] prior Gong transcripts found — [summarize arc of conversations]

---

## Expected Value

[Why the customer sees value in Domo and what business outcome they expect from this engagement.]

---

## Domo Platform Components Likely Required

- [ ] Data ingestion / connectors
- [ ] Magic ETL / data transformation
- [ ] Data modeling / DataFusion
- [ ] Dashboards / cards / stories
- [ ] Domo Everywhere / embed
- [ ] Domo Sandbox
- [ ] Workflows / automation
- [ ] Alerts / notifications
- [ ] AI / Code Engine / App Studio
- [ ] Governance / PDP / security

*Check all that have been mentioned. Flag any that seem likely but have not been confirmed.*

---

## Data Sources Identified

| Source | Type | Notes |
|--------|------|-------|
| [Name] | [Database / API / File / SaaS] | [Access method, complexity signal] |
| [Name] | [Type] | [Notes] |

**Data gaps:** [What has not been confirmed — e.g., "Database hosting (cloud vs. on-prem) not confirmed",
"Number of tables unknown"]

---

## Dashboards & Reporting Use Cases Discussed

- [Dashboard or use case 1] — [brief description]
- [Dashboard or use case 2] — [brief description]

*List any specific reporting needs or visualization requirements already surfaced.*

---

## Discovery Agenda — Questions for This Call

### Must Answer (blocks scope definition)

| # | Question | Why It Matters | Tag |
|---|----------|---------------|-----|
| 1 | [Question] | [Why this is critical] | `[SCOPE]` |
| 2 | [Question] | [LOE driver] | `[LOE]` |
| 3 | [Question] | [Risk surface] | `[RISK]` |

### Should Answer (improves estimate accuracy)

| # | Question | Why It Matters | Tag |
|---|----------|---------------|-----|
| 4 | [Question] | [Missing info] | `[MISSING]` |

### Carry-Forward Questions (unresolved from prior calls)

- [Question left open from [date] call] — [context]

---

## Risks & Unknowns

| Risk / Unknown | Severity | What to Listen For |
|---------------|----------|--------------------|
| [e.g., No prior Gong transcripts — first contact] | High | Expect longer discovery phase |
| [e.g., Data source type unclear] | Medium | Connector type affects LOE significantly |
| [e.g., Budget signal not surfaced] | Medium | Probe for budget range early |

---

## Commitments & Watch-Outs

*From prior call history — things already said or promised that must be honored.*

- [e.g., "AE indicated the project would be ~8 weeks — confirm this is still the expectation"]
- [e.g., "Customer was told PS would handle all data connections — validate scope"]

---

**Prepared by:** CS Solutions Pre-Scoping Brief Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Pre-Call Preparation → Position 1
```

---

## Guardrails

- **This brief must be actionable, not archival.** Every section should prepare the SSD for the call, not just document prior history.
- **Missing information is signal.** If key data is absent — no Gong transcripts, no account match, no data sources named — that absence must be surfaced explicitly, not silently omitted.
- **Questions must be prioritized.** A question list with 20 equal-weight items is not useful. Tag and rank so the SSD knows what to hit first.
- **Brief must be readable in under 2 minutes.** If a section is getting long, it belongs in the downstream Discovery Synthesizer, not the brief.
- **Do not invent scope.** Only describe what has been confirmed in transcripts or account data. Flag inferences as inferences.
- **Carry-forward questions are mandatory.** If a prior call left open questions, they must appear on the agenda — not get lost.
- **Flag first-contact calls.** If there are no prior Gong transcripts, explicitly note this and increase the recommended discovery depth.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| calendar_lookup | **Yes** | Identifies the upcoming scoping call, attendees, and timing |
| gong_transcript_lookup | **Yes** | Prior discovery context, open questions, commitments made |
| calls_lookup | Optional | Supplemental recent conversation context and sentiment |
| portfolio_lookup | Optional | Account-level business context, ARR, team, products, renewal |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, content summarizing: pre-scoping analysis, account readiness assessment, data landscape summary, preliminary scope range, key questions for scoping call.

---

## Related Skills

- **Discovery Synthesizer** → Downstream — processes the actual scoping call transcript into structured context
- **Solution Blueprint Generator** → Downstream — uses discovery output to define the solution approach
- **Scope Builder & LOE Estimator** → Downstream — translates solution into workstream effort estimates
