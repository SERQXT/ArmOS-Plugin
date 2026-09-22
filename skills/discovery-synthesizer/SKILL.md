---
name: discovery-synthesizer
tier: 1
description: "Turn a scoping call into structured context that the rest of the workflow can actually use — customer goals, pain points, technical requirements, data sources, stakeholders, value drivers, delivery preferences, assumptions, and unresolved questions. Trigger with 'synthesize the scoping call for [account]', 'process discovery notes for [account]', 'build discovery record for [account]', or 'what did we learn from the [account] call'. Run immediately after each scoping or discovery call."
maturity: alpha
audience: [orchestration, delivery]
pipeline:
  phase: discover
  sub_phase: post-call-synthesis
  position: 2
  output_type: output
  wave: 1
  state: ready
  inputs:
    - agent: pre-scoping-brief
      required: false
      data: prior call context, known unknowns, carry-forward questions
  outputs:
    - name: discovery-record
      format: markdown
      downstream:
        - agent: connection-strategy
        - agent: solution-blueprint
        - agent: scope-builder
  data_sources:
    - tool: gong_transcript_lookup
      required: true
    - tool: calls_lookup
      required: false
    - tool: portfolio_lookup
      required: false
    - tool: fileset_search
      required: false
  phase_gate: true
---

## Reference Documents

Scoping reference documents (SOW templates, estimation methodology, service catalog) are stored in S3 under `cs-templates/scoping/`.

**To access reference files on demand:**
- List available files: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/list?prefix=cs-templates/scoping/"`
- Read a specific file: `curl -sf "http://localhost:${API_PORT:-3001}/api/s3/read?key=cs-templates/scoping/<filename>"`

Cache files locally in `./templates/scoping/` after first fetch. Prefer cached copies on subsequent reads.

# Discovery Synthesizer — Post-Call Structured Extraction

Converts a scoping call into a locked, structured Discovery Record that every downstream skill can consume without re-interpreting raw transcript. This skill does the hard work of separating facts from assumptions, mapping technical requirements to Domo workstreams, and flagging what is still missing. Without this artifact, the Solution Blueprint and Scope Builder will spend half their effort reconstructing the call.

The Discovery Record is a canonical artifact. Once validated by the SSD, it becomes the authoritative source of truth for the engagement until it is superseded by a revised version.

## How It Works

```
Gong Transcript(s) + Call Notes + Pre-Scoping Brief (if available)
                             |
  +-------+-------+-------+-------+-------+-------+-------+
  |       |       |       |       |       |       |       |
Goals & Technical  Data   Stake- Value  Delivery  Open
Pains   Reqs    Sources  holders Drivers  Model  Questions
  |       |       |       |       |       |       |       |
  +-------+-------+-------+-------+-------+-------+-------+
                             |
             Separate Facts from Assumptions
                             |
           🔵 OUTPUT: Discovery Record
                             |
     → Solution Blueprint + Scope Builder (downstream)
```

## Triggers

- "synthesize the scoping call for [account]"
- "process discovery notes for [account]"
- "build discovery record for [account]"
- "what did we learn from the [account] call"
- "turn my call notes into a discovery record"
- "extract requirements from the [account] transcript"
- Run immediately after each scoping or discovery call

## Execution Flow

### Step 1: Retrieve the Call Transcript and Context

```
gong_transcript_lookup(account_name, limit=3, recency="most recent")
→ Pull the most recent scoping / discovery call transcript(s)
→ If multiple calls: synthesize across all; note date of each source

calls_lookup(account_name, limit=5)       [if available]
→ Supplemental call notes, follow-up emails, shared documents

portfolio_lookup(account_name)            [if available]
→ Baseline account context to cross-reference against what was said

pre-scoping-brief (upstream, if run)
→ Load carry-forward questions and known unknowns — check each one
   for resolution in this call's transcript
```

### Step 2: Extract Business Context

Pull the following from the transcript, quoting or closely paraphrasing the source:

| Element | What to Extract | Mark as |
|---------|----------------|---------|
| **Business goals** | What outcomes the customer is trying to achieve | FACT or ASSUMED |
| **Pain points** | What is broken, slow, or missing today | FACT or ASSUMED |
| **Success criteria** | How the customer will measure success | FACT or ASSUMED |
| **Timeline** | When they need to go live; hard deadlines | FACT or ASSUMED |
| **Budget signal** | Any indication of budget range, ceiling, or constraints | FACT or ASSUMED |
| **Why now** | What triggered this initiative | FACT or ASSUMED |
| **Decision drivers** | What matters most: speed, cost, quality, risk reduction | FACT or ASSUMED |

### Step 3: Extract Technical Requirements by Workstream

Map what was discussed to Domo's implementation workstreams. Use the fileset to cross-reference platform capabilities when the customer's language is ambiguous.

#### Data Connection
```
fileset_search("connector types data ingestion") → reference if source type is ambiguous
```
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| What source systems were named? | | HIGH / MED / LOW |
| What type is each source? (DB, API, File, SaaS) | | HIGH / MED / LOW |
| Cloud-hosted or on-premises? | | HIGH / MED / LOW |
| How many datasets / tables per source? | | HIGH / MED / LOW |
| Any custom connector requirements? | | HIGH / MED / LOW |
| Refresh frequency needed? | | HIGH / MED / LOW |
| Data volume / row count estimates? | | HIGH / MED / LOW |

#### Data Transformation & Architecture
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| Are datasets already clean, or heavy transformation needed? | | HIGH / MED / LOW |
| Are there complex joins, business rules, or calculated metrics? | | HIGH / MED / LOW |
| Multi-source blending required? | | HIGH / MED / LOW |
| Any writeback or reverse ETL requirements? | | HIGH / MED / LOW |

#### Visualization & Dashboards
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| Who are the dashboard audiences? (exec, ops, frontline) | | HIGH / MED / LOW |
| How many KPIs or metrics were discussed? | | HIGH / MED / LOW |
| How many breakdowns / dimensions? (region, product, channel) | | HIGH / MED / LOW |
| Branding requirements? | | HIGH / MED / LOW |
| Advanced interactivity? (App Studio, DDX, custom layout) | | HIGH / MED / LOW |
| Existing reports they want to replicate or improve? | | HIGH / MED / LOW |

#### Data Distribution (Domo Everywhere / Sandbox)
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| External users (partners, clients, customers) needing access? | | HIGH / MED / LOW |
| Embed requirements (view-only, edit, connect)? | | HIGH / MED / LOW |
| Multi-environment (Sandbox / promotion) workflow needed? | | HIGH / MED / LOW |

#### Automation & AI
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| Manual processes to automate? | | HIGH / MED / LOW |
| Alerting or threshold notifications? | | HIGH / MED / LOW |
| Workflow requirements (approvals, routing, write-backs)? | | HIGH / MED / LOW |
| AI, predictive analytics, or Code Engine requirements? | | HIGH / MED / LOW |
| External system integrations for workflows? | | HIGH / MED / LOW |

#### Governance
| Question | Answer from Transcript | Confidence |
|----------|----------------------|------------|
| Row-level security / PDP requirements? | | HIGH / MED / LOW |
| Sensitive data (PII, financial, healthcare)? | | HIGH / MED / LOW |
| User roles and permission model? | | HIGH / MED / LOW |
| Compliance or regulatory requirements? | | HIGH / MED / LOW |

### Step 4: Extract Stakeholders

Build or update the stakeholder map from the call.

| Name | Title | Role in Project | Influence | Notes |
|------|-------|----------------|-----------|-------|
| [Name] | [Title] | Executive Sponsor / Champion / Technical Lead / End User | High / Med / Low | [Attitude, concerns, availability] |

### Step 5: Identify Delivery Preference

Determine what kind of engagement the customer is expecting:

- **Domo-led** — Domo PS does the work; customer provides access and approvals
- **Co-delivery** — joint build; customer team is involved day-to-day
- **Teach-to-fish** — Domo guides; customer team does the build with coaching
- **Retainer / ongoing** — flexible access to PS resources over time

Source this from tone and language in the transcript, not just explicit statements.

### Step 6: Compile Assumptions, Unresolved Questions, and Missing Information

Three separate lists — do not mix them:

**Assumptions** — things we are treating as true that have not been confirmed:
- Each assumption must have: the assumption itself, why it matters, and what happens if it is wrong

**Unresolved questions** — things that came up but were not answered on the call:
- Tag each: `[LOE]`, `[SCOPE]`, `[RISK]`, or `[MISSING]`
- Note whether it blocks downstream work

**Missing information** — information we need that was never surfaced:
- Flag items that block Solution Blueprint or Scope Builder
- Recommend how to obtain each (follow-up email, next call, customer to provide)

### Step 7: Validate Against Pre-Scoping Brief

If a pre-scoping brief was generated upstream:
- Check each carry-forward question: was it answered?
- Check each flagged risk: was it surfaced or mitigated?
- Note which items remain open

---

## Output Template

```markdown
# Discovery Record: [Account Name]
**Call Date:** [Date] | **Transcript Source:** Gong — [Call Title]
**Synthesized:** [Date] | **SSD:** [Name]
**Status:** DRAFT — Pending SSD Validation

---

## 1. Business Context

### Goals & Desired Outcomes
| Goal | Stated By | Confidence | Source |
|------|-----------|------------|--------|
| [Goal] | [Name / Role] | FACT | [Timestamp or quote] |
| [Goal] | [Name / Role] | ASSUMED | [Basis for assumption] |

### Pain Points
- **[Pain 1]** — [Description. Impact on the business.] `FACT`
- **[Pain 2]** — [Description.] `ASSUMED`

### Success Criteria
| Metric | Current State | Target | How Measured |
|--------|--------------|--------|-------------|
| [KPI] | [Baseline] | [Goal] | [Method] |

### Timeline
| Milestone | Date | Hard Deadline? | Notes |
|-----------|------|---------------|-------|
| [Go-live / Phase 1] | [Date] | Yes / No | [Context] |

### Budget Signal
[What was said or implied about budget. If nothing surfaced: flag as unknown and recommend probing.]

### Why Now
[What triggered this initiative — leadership directive, pain point, renewal, competitive pressure, etc.]

---

## 2. Technical Requirements by Workstream

### Data Connection
| Source | Type | Hosting | Datasets | Refresh | Complexity Signal |
|--------|------|---------|----------|---------|------------------|
| [Name] | DB / API / File / SaaS | Cloud / On-prem | [#] | Daily / Hourly / RT | Low / Med / High |

**Connection notes:** [Anything that will affect LOE — credentials, custom connectors, data quality issues]

### Data Transformation & Architecture
- ETL complexity signal: Low / Medium / High — [rationale]
- Data volume signal: Low / Medium / High — [rationale]
- Multi-source blending: Yes / No / Unknown
- Writeback / reverse ETL: Yes / No / Unknown

### Visualization & Dashboards
- Audiences: [exec / ops / frontline / external]
- KPI count estimate: [range]
- Breakdown dimensions: [list]
- Branding requirement: Low / Standard / High
- Visual complexity: Low / Standard / High — [rationale]
- Existing reports to replicate: [list or "none identified"]

### Data Distribution
- External users: Yes / No / Unknown — [context]
- Embed type: View-only / Edit / Connect / Not applicable
- Sandbox / promotion: Yes / No / Unknown

### Automation & AI
- Automation use cases: [list or "none identified"]
- Workflow complexity: Simple / Moderate / Complex / Not in scope
- AI requirements: [list or "none identified"]
- External integrations: [list or "none identified"]

### Governance
- PDP / row-level security: Required / Not required / Unknown
- Sensitive data: Yes / No / Unknown — [type]
- Compliance requirements: [list or "none identified"]
- User roles needed: [Admin / Editor / Viewer / Custom]

---

## 3. Stakeholder Map

| Name | Title | Role | Influence | Attitude | Notes |
|------|-------|------|-----------|----------|-------|
| [Name] | [Title] | Executive Sponsor | High | Supportive | [Context] |
| [Name] | [Title] | Technical Lead | Med | Cautious | [Context] |
| [Name] | [Title] | End User Rep | Low | Enthusiastic | [Context] |

**Decision authority:** [Who has final say on scope and go-live decisions]
**Missing stakeholders:** [Roles that need to be identified — e.g., "IT contact not yet named"]

---

## 4. Delivery Preference

**Model:** [Domo-led / Co-delivery / Teach-to-fish / Retainer]
**Rationale:** [What in the call informed this — direct statement or inferred from tone/language]
**Customer capacity signal:** [What we know about the customer's team availability and technical capability]

---

## 5. Value Drivers

| Driver | Description | Quantified? |
|--------|-------------|-------------|
| [Cost savings] | [Specific description] | Yes — [$X / X hrs/week] / No — estimate needed |
| [Productivity gain] | [Description] | Yes / No |
| [Risk reduction] | [Description] | Yes / No |
| [Revenue enablement] | [Description] | Yes / No |

---

## 6. Assumptions

| # | Assumption | Why It Matters | Risk If Wrong |
|---|-----------|----------------|--------------|
| 1 | [e.g., "Data is accessible via cloud connector — no on-prem required"] | Affects LOE significantly | Adds Workbench setup, 8+ hrs |
| 2 | [Assumption] | [Why it matters] | [Impact] |

---

## 7. Unresolved Questions

| # | Question | Tag | Blocks Downstream? | How to Resolve |
|---|----------|-----|-------------------|---------------|
| 1 | [Question] | `[LOE]` | Yes — blocks Scope Builder | Follow-up email to [Name] |
| 2 | [Question] | `[SCOPE]` | Yes — blocks Solution Blueprint | Confirm on next call |
| 3 | [Question] | `[RISK]` | No — monitor | Internal review |

---

## 8. Missing Information

| Item | Why Needed | Blocks | Recommended Action |
|------|-----------|--------|-------------------|
| [e.g., Number of tables in Salesforce] | Required for LOE formula | Scope Builder | Customer to provide data inventory |
| [Item] | [Why] | [Skill] | [Action] |

---

## 9. Pre-Scoping Brief Reconciliation

*Only populated if a Pre-Scoping Brief was run upstream.*

| Carry-Forward Question | Resolved on This Call? | Answer / Status |
|-----------------------|----------------------|----------------|
| [Question from brief] | Yes / No / Partial | [Answer or "still open"] |

---

**Prepared by:** CS Solutions Discovery Synthesizer Agent
**Output Type:** 🔵 OUTPUT
**Pipeline Position:** Discover → Post-Call Synthesis → Position 2
**Phase Gate:** YES — SSD must validate before downstream skills proceed
```

---

## Guardrails

- **Facts and assumptions must be kept strictly separate.** Label every extracted item. If you are not sure whether something was stated or inferred, mark it ASSUMED.
- **This is a synthesis, not a transcript dump.** The output should be structured and scannable. Do not quote large blocks of transcript.
- **Confidence ratings are mandatory.** Every technical requirement must carry HIGH / MED / LOW confidence. LOW confidence items surface where follow-up is needed.
- **Do not skip workstreams.** Even if nothing was discussed, note "not discussed" — silence is meaningful for scoping.
- **The Discovery Record is the source of truth.** Downstream skills must consume this artifact, not re-interpret the raw transcript. If SSD edits the record, those edits take precedence.
- **Phase gate is enforced.** The Solution Blueprint and Scope Builder should not run until the SSD has reviewed and validated this record. Flag it clearly as DRAFT until approved.
- **Missing information is not a failure.** A well-documented gap is more valuable than a confident guess. Surface every gap explicitly.

---

## Connecting MCP Tools

| Tool | Required | What It Adds |
|------|----------|-------------|
| gong_transcript_lookup | **Yes** | The primary source — scoping call transcript |
| calls_lookup | Optional | Follow-up emails, supplemental call notes |
| portfolio_lookup | Optional | Account baseline to cross-reference against stated facts |
| fileset_search | Optional | Platform capability reference when customer language is ambiguous |

---

## Memory Integration

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-observations", "engagement-working"]}`, content summarizing: synthesis of all discovery inputs, key themes extracted, contradictions flagged, consolidated findings, readiness assessment.

---

## Related Skills

- **Pre-Scoping Brief** → Upstream — provides carry-forward questions and known unknowns
- **Solution Blueprint Generator** → Downstream — consumes Discovery Record to define solution approach
- **Scope Builder & LOE Estimator** → Downstream — consumes Discovery Record to estimate workstream effort
