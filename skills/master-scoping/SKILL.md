---
name: master-scoping
maturity: alpha
owner: Andrew Ferguson
description: "Orchestrate the complete Domo Professional Services scoping process from pre-call preparation through SOW review in the correct skill sequence. Manages session context, passes data between skills, enforces phase gates, and coordinates SSD validation checkpoints. Trigger with 'run the full scoping process for [account]', 'scope [account]', 'start scoping for [account]', or 'run the scoping workflow for [account]'. Ends with the antagonistic SOW review as a final quality gate."
pipeline:
  phase: master
  sub_phase: full-pipeline
  position: 0
  output_type: orchestrator
  wave: all
  state: ready
  inputs:
    - source: user
      required: true
      data: account name and any available context (Gong transcript, discovery notes, prior call records)
  outputs:
    - name: session-context
      format: json
      note: "Persists across all skill executions; accumulates every artifact produced and its status"
    - name: complete-scoping-package
      format: collection
      contents:
        - pre-scoping-brief
        - discovery-record
        - connection-strategy
        - solution-blueprint
        - scope-model
        - loe-estimate
        - roi-analysis (if produced)
        - commercial-recommendation
        - proposal-content (if produced)
        - sow-draft
        - cpq-validation-report
        - handoff-dossier
        - expansion-summary
        - sow-review-report
  data_sources:
    - tool: fileset_search
      required: true
      fileset_id: "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
    - tool: gong_transcript_lookup
      required: false
    - tool: portfolio_lookup
      required: false
    - tool: calendar_lookup
      required: false
    - tool: salesforce_lookup
      required: false
  phase_gate: false
---

## Scoping Reference Documents

**Primary — S3:**
- `s3://armos-workspace-676897632200/cs-templates/scoping/`
- Sync all: `aws s3 sync "s3://armos-workspace-676897632200/cs-templates/scoping/" ./templates/scoping/ --region us-east-2`

**Fallback — Domo FileSet:**
- FileSet ID: `e5b7e2e9-79ed-499d-95ff-fc9d74157d24`
- Endpoint: `POST /api/content/v1/filesets/e5b7e2e9-79ed-499d-95ff-fc9d74157d24/aiSearch`

---

# Master Scoping Skill — Complete Pipeline Orchestrator

Runs the complete Domo Professional Services scoping workflow in the correct sequence. This skill does not replace the individual skills — it coordinates them, passes data between them, enforces phase gates, and presents the right checkpoints to the SSD. Think of this skill as the conductor: each specialist skill does its own work, and this skill ensures they execute in order, with the right inputs, at the right time.

## What This Skill Does

1. **Sequences the workflow.** Invokes each skill in the correct order based on the pipeline positions defined in the individual SKILL.md files.
2. **Manages session context.** Maintains a persistent Session Context Object that accumulates every artifact, its status, and its key outputs as the process progresses.
3. **Passes data explicitly.** When invoking a downstream skill, loads the relevant upstream artifacts from session context and passes them as structured inputs — not as unstructured conversation memory.
4. **Enforces phase gates.** Pauses at every mandatory SSD validation checkpoint. Does not advance past a phase gate until the SSD explicitly approves.
5. **Tracks SSD action items.** Surfaces what the SSD needs to review, decide, or provide at each checkpoint.
6. **Ends with SOW review.** After the SOW is generated, automatically invokes the sow-reviewer skill as the final quality gate.

## Triggers

- "run the full scoping process for [account]"
- "scope [account]"
- "start scoping for [account]"
- "run the scoping workflow for [account]"
- "walk me through the scoping process for [account]"
- "begin the scoping pipeline for [account]"
- "resume scoping for [account]" (resume from a saved session)

---

## Session Context Object

The Session Context Object is the single source of truth for all data flowing through the pipeline. It is initialized at the start of the process and updated after every skill execution. Every downstream skill receives its inputs from this object — no skill reads from conversational memory; all reads are from the structured context.

### Schema

```json
{
  "session": {
    "session_id": "[UUID]",
    "account": "[Account Name]",
    "ssd": "[SSD Name]",
    "created": "[ISO timestamp]",
    "updated": "[ISO timestamp]",
    "current_step": "[skill name currently active]",
    "process_status": "IN_PROGRESS | BLOCKED_AT_GATE | COMPLETE"
  },
  "artifacts": {
    "pre-scoping-brief": {
      "status": "PENDING | COMPLETE",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "account_summary": "[ARR, CSM, renewal date, account health]",
        "use_case_summary": "[top 2-3 use cases from prior context]",
        "discovery_agenda": "[prioritized question list]",
        "risk_flags": "[pre-call risks and watch-outs]",
        "carry_forward_questions": "[unresolved items from prior calls]"
      },
      "ref": "[path or session storage key]"
    },
    "discovery-record": {
      "status": "PENDING | DRAFT | VALIDATED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "business_context": "[goals, pain points, success criteria, timeline, budget signal]",
        "technical_requirements": {
          "connection": "[connector types, source count, complexity signals]",
          "transform": "[ETL complexity, volume, refresh, metric complexity]",
          "visualization": "[KPI count, breakdown count, branding level]",
          "distribution": "[external users, embed type, Publish, Sandbox]",
          "automation": "[workflow types and complexity classifications]",
          "governance": "[PDP scope, user count, compliance requirements]",
          "rollout": "[training needs, audience, change management scope]"
        },
        "stakeholder_map": "[name, title, role, influence, attitude per stakeholder]",
        "delivery_preference": "Domo-led | Co-delivery | Teach-to-fish | Retainer",
        "value_drivers": "[cost savings, productivity, revenue, risk reduction]",
        "confidence_ratings": "[HIGH/MED/LOW per workstream signal]",
        "open_questions": "[unresolved items tagged by impact: LOE/SCOPE/RISK/MISSING]"
      },
      "ref": "[path or session storage key]"
    },
    "connection-strategy": {
      "status": "PENDING | COMPLETE",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "source_strategies": "[per source: method, complexity, auth, prerequisites, risks, alternatives]"
      },
      "ref": "[path or session storage key]"
    },
    "solution-blueprint": {
      "status": "PENDING | DRAFT | LOCKED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "solution_statement": "[one paragraph, customer language]",
        "use_cases": "[per use case: business problem, proposed solution, components, sources, deliverables, success metrics]",
        "reference_architecture": "[text-based architecture description]",
        "operating_model": "[delivery model, phasing, estimated duration]",
        "alternatives_considered": "[Option A/B/C with tradeoffs]"
      },
      "ref": "[path or session storage key]"
    },
    "scope-model": {
      "status": "PENDING | DRAFT | LOCKED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "workstreams_in_scope": "[list with deliverables per workstream]",
        "out_of_scope": "[explicit exclusions per workstream]",
        "loe_inputs_summary": "[classification signals for LOE Estimator]",
        "customer_responsibilities": "[owner, required by, consequence if late]",
        "assumptions": "[scope assumptions register]",
        "sub_tools_invoked": "[scope-everywhere | scope-automation | scope-app-studio — which were triggered]"
      },
      "ref": "[path or session storage key]"
    },
    "loe-estimate": {
      "status": "PENDING | DRAFT | REVIEWED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "total_hours": { "low": 0, "expected": 0, "high": 0 },
        "by_workstream": "[hours per workstream, low/expected/high]",
        "confidence": "HIGH | MEDIUM | LOW",
        "tool_synergy_credits": "[credits applied and hours saved]",
        "risk_flags": "[LOW-confidence workstreams and unknowns]",
        "mvp_scope_flags": "[items flagged as potentially above MVP minimum]"
      },
      "ref": "[path or session storage key]"
    },
    "roi-analysis": {
      "status": "PENDING | SKIPPED | COMPLETE",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "annual_value": 0,
        "payback_period": "[months]",
        "year1_roi_pct": 0,
        "value_drivers": "[by category with confidence level]"
      },
      "ref": "[path or session storage key]"
    },
    "commercial-recommendation": {
      "status": "PENDING | DRAFT | SSD_LOCKED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "selected_option": "[Option name, package tier, structure, investment, duration]",
        "options_presented": "[Option A/B/C with rationale]",
        "pricing_posture": "Hold firm | Flexible on structure | Modest flexibility | Escalate",
        "engagement_structure": "Fixed-bid | T&M | Capped T&M | Retainer | Phased"
      },
      "ref": "[path or session storage key]"
    },
    "proposal-content": {
      "status": "PENDING | SKIPPED | DRAFT | SSD_APPROVED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "executive_summary": "[3-4 bullet narrative]",
        "value_claims": "[traceable to discovery]",
        "recommendation_slide": "[recommended option with rationale]",
        "talk_track_highlights": "[opening, emphasis points, anticipated objections]"
      },
      "ref": "[path or session storage key]"
    },
    "sow-draft": {
      "status": "PENDING | DRAFT | READY_FOR_CUSTOMER",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "template_used": "DOMO SOW TEMPLATE 2025",
        "sections_populated": "[list of populated sections]",
        "missing_fields_critical": "[count]",
        "missing_fields_important": "[count]",
        "missing_fields_advisory": "[count]"
      },
      "ref": "[path or session storage key]"
    },
    "cpq-validation": {
      "status": "PENDING | PASS | NEEDS_ATTENTION | FAIL",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "overall_status": "PASS | NEEDS_ATTENTION | FAIL",
        "critical_items": "[count and list]",
        "important_items": "[count and list]",
        "advisory_items": "[count and list]"
      },
      "ref": "[path or session storage key]"
    },
    "handoff-dossier": {
      "status": "PENDING | DRAFT | SSD_VALIDATED",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "ssd_add_sections_complete": false,
        "commitments_outside_sow": "[count of identified commitments]",
        "pre_kickoff_items_open": "[count]"
      },
      "ref": "[path or session storage key]"
    },
    "expansion-summary": {
      "status": "PENDING | COMPLETE",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "priority_opportunities": "[⭐ Act now opportunities]",
        "next_qbr_opportunities": "[🔵 Next QBR opportunities]"
      },
      "ref": "[path or session storage key]"
    },
    "sow-review": {
      "status": "PENDING | COMPLETE",
      "version": "1.0",
      "produced_at": "[timestamp]",
      "key_outputs": {
        "overall_verdict": "APPROVED | CONDITIONALLY_APPROVED | REVISE_BEFORE_SEND",
        "critical_gaps": "[count]",
        "scope_accuracy_issues": "[count]",
        "completeness_score": "[0-100]"
      },
      "ref": "[path or session storage key]"
    }
  },
  "phase_gates": {
    "discovery-synthesizer": "PENDING | VALIDATED",
    "solution-blueprint": "PENDING | LOCKED",
    "scope-builder": "PENDING | LOCKED",
    "service-matchmaker": "PENDING | SSD_LOCKED",
    "proposal-generator": "PENDING | SKIPPED | SSD_APPROVED",
    "cpq-validator": "PENDING | PASS | FAIL",
    "knowledge-handoff": "PENDING | SSD_VALIDATED"
  },
  "ssd_action_queue": [
    {
      "step": "[skill name]",
      "action_required": "[specific decision or input the SSD must provide]",
      "blocking": true,
      "status": "PENDING | COMPLETE"
    }
  ]
}
```

### Session Context Management Rules

1. **Initialize at start.** Create a new session context when the process begins for an account. Assign a session ID.
2. **Update after every skill.** After each skill completes, update the relevant artifact's status and key_outputs in the context.
3. **Read from context, not memory.** When invoking a downstream skill, extract the required inputs from the session context. Pass them explicitly as structured data. Do not rely on conversation history to carry data between steps.
4. **Persist the context.** Store the session context in AppDB or a named session reference so it can be retrieved if the process is interrupted and resumed.
5. **Resume from checkpoint.** If the user triggers "resume scoping for [account]", load the existing session context and continue from the last completed step.

---

## Pipeline Execution Order

The pipeline executes in the following order. Each step is described with: what it invokes, what data it passes in, what it expects back, and what SSD action (if any) is required before advancing.

```
DISCOVER PHASE
═══════════════════════════════════════════════════════════
Step 1 │ pre-scoping-brief
Step 2 │ discovery-synthesizer           ← PHASE GATE (SSD validation)
Step 3 │ connection-strategy
Step 4 │ solution-blueprint              ← PHASE GATE (SSD locks)
Step 5 │ scope-builder                   ← PHASE GATE (SSD locks)
        │   ↳ scope-everywhere           (auto-invoked if applicable)
        │   ↳ scope-automation           (auto-invoked if applicable)
        │   ↳ scope-app-studio           (auto-invoked if applicable)

ESTIMATE & COMMERCIAL PHASE
═══════════════════════════════════════════════════════════
Step 6 │ loe-estimator
Step 7 │ roi-calculator                  (optional; recommended when ROI is a key driver)
Step 8 │ service-matchmaker              ← PHASE GATE (SSD selects and locks option)
Step 9 │ proposal-generator              ← PHASE GATE (SSD reviews and approves; optional if SOW-direct)

CONTRACT PHASE
═══════════════════════════════════════════════════════════
Step 10 │ sow-generator                  ← PHASE GATE (SSD reviews and approves)
Step 11 │ cpq-validator                  ← PHASE GATE (CRITICAL items must be resolved)

HANDOFF & QUALITY GATE
═══════════════════════════════════════════════════════════
Step 12 │ knowledge-handoff              ← PHASE GATE (SSD completes [SSD TO ADD] sections)
Step 13 │ expansion-identifier
Step 14 │ sow-reviewer                   ← FINAL QUALITY GATE (antagonistic SOW review)
═══════════════════════════════════════════════════════════
```

---

## Step-by-Step Execution

### Step 1 — Pre-Scoping Brief

**Invoke:** `pre-scoping-brief`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "tools_available": ["calendar_lookup", "gong_transcript_lookup", "calls_lookup", "portfolio_lookup"]
}
```

**Expect back:**
- Account summary (ARR, CSM, renewal date, account health)
- Use case summary from prior context
- Discovery agenda (prioritized questions tagged LOE/SCOPE/RISK/MISSING)
- Pre-call risk flags and watch-outs
- Carry-forward questions from prior calls

**Update session context:**
```json
artifacts["pre-scoping-brief"].status = "COMPLETE"
artifacts["pre-scoping-brief"].key_outputs = [extracted outputs]
```

**SSD action:** Review the brief before the scoping call. No blocking gate — advance automatically after brief is produced.

**Advance to:** Step 2

---

### Step 2 — Discovery Synthesizer

**Invoke:** `discovery-synthesizer`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "pre_scoping_brief": artifacts["pre-scoping-brief"].key_outputs,
  "tools_available": ["gong_transcript_lookup", "calls_lookup", "portfolio_lookup", "fileset_search"]
}
```

**Expect back:**
- Discovery Record with all seven workstreams addressed
- Facts vs. assumptions separated
- Confidence ratings (HIGH/MED/LOW) per workstream signal
- Stakeholder map
- Open questions tagged by impact
- Delivery preference

**Update session context:**
```json
artifacts["discovery-record"].status = "DRAFT"
artifacts["discovery-record"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST VALIDATE BEFORE ADVANCING**

Present the Discovery Record to the SSD with this prompt:
```
PHASE GATE: Discovery Synthesizer Validation

The Discovery Record for [account] is ready for your review.

Review the following before approving:
□ All seven workstreams addressed (even if "not discussed")
□ Facts and assumptions are clearly separated
□ Confidence ratings are appropriate (LOW confidence items are flagged)
□ Stakeholder map is complete and accurate
□ Open questions are correctly tagged by impact
□ No speculative scope has been included as fact

Action required:
- APPROVE to lock the Discovery Record and advance to Connection Strategy
- RETURN WITH NOTES to send back for revision
- ADD CONTEXT to inject additional information before locking
```

After SSD approval:
```json
artifacts["discovery-record"].status = "VALIDATED"
phase_gates["discovery-synthesizer"] = "VALIDATED"
```

**Advance to:** Step 3

---

### Step 3 — Connection Strategy

**Invoke:** `connection-strategy`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "discovery_record": artifacts["discovery-record"].key_outputs.technical_requirements.connection,
  "pre_scoping_brief": artifacts["pre-scoping-brief"].key_outputs
}
```

**Expect back:**
- Per-source connection strategy (method, complexity, auth, prerequisites, risks, alternatives)
- Priority hierarchy applied per source (pre-aggregated DB > Domo connectors > API > DB > scheduled report > manual)
- Security/complexity assessment
- Customer dependency flags

**Update session context:**
```json
artifacts["connection-strategy"].status = "COMPLETE"
artifacts["connection-strategy"].key_outputs = [extracted outputs]
```

**SSD action:** Review for any sources requiring customer action (credentials, IT access, custom connectors). No blocking gate — advance automatically.

**Advance to:** Step 4

---

### Step 4 — Solution Blueprint

**Invoke:** `solution-blueprint`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "connection_strategy": artifacts["connection-strategy"].key_outputs,
  "pre_scoping_brief": artifacts["pre-scoping-brief"].key_outputs,
  "tools_available": ["gong_transcript_lookup", "portfolio_lookup", "fileset_search"]
}
```

**Expect back:**
- Solution statement (customer language, tied to pain points)
- Use case designs (business problem, proposed solution, components, sources, deliverables, success metrics)
- Reference architecture (text-based)
- Operating model (delivery model, phasing, duration, responsibilities)
- Alternative approaches considered (Option A/B/C)
- Dependencies and risks

**Update session context:**
```json
artifacts["solution-blueprint"].status = "DRAFT"
artifacts["solution-blueprint"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST LOCK BEFORE ADVANCING**

Present the Solution Blueprint to the SSD with this prompt:
```
PHASE GATE: Solution Blueprint Lock

The Solution Blueprint for [account] is ready for your review.

Review the following before locking:
□ Solution statement is accurate and in customer language
□ All confirmed use cases are represented correctly
□ Recommended components are justified and traceable to Discovery Record
□ Reference architecture reflects the actual design
□ Operating model matches delivery model discussed with customer
□ Alternative approaches are genuinely different (not cosmetically different)
□ All recommendations are traceable — no speculative components
□ Open questions are listed and will be resolved before scope-building

Action required:
- LOCK to advance to Scope Builder
- REVISE WITH NOTES to send back for changes
```

After SSD locks:
```json
artifacts["solution-blueprint"].status = "LOCKED"
phase_gates["solution-blueprint"] = "LOCKED"
```

**Advance to:** Step 5

---

### Step 5 — Scope Builder (with sub-tools)

**Invoke:** `scope-builder`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "connection_strategy": artifacts["connection-strategy"].key_outputs,
  "tools_available": ["fileset_search"]
}
```

**Sub-tool auto-invocation (Scope Builder manages this internally):**
- If `solution_blueprint.use_cases` include external users, embed, Domo Everywhere, subscriber instances, or Domo Publish → auto-invoke `scope-everywhere`
- If `solution_blueprint.use_cases` include automation, workflows, alerts, Code Engine, AI agents, or write-backs → auto-invoke `scope-automation`
- If `solution_blueprint.use_cases` include App Studio, DDX Bricks, custom apps, or pixel-perfect branding → auto-invoke `scope-app-studio`

Pass sub-tool outputs back into the Scope Model before completing.

**Expect back:**
- Complete Scope Model (workstreams in scope with deliverables, out-of-scope per workstream)
- LOE Inputs Summary (classification signals for LOE Estimator)
- Customer responsibilities (owner, required by, consequence if late)
- Assumptions register
- Sub-tool outputs folded in (scope-everywhere-block, scope-automation-block, scope-app-studio-block as applicable)

**Update session context:**
```json
artifacts["scope-model"].status = "DRAFT"
artifacts["scope-model"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST LOCK BEFORE ADVANCING**

Present the Scope Model to the SSD with this prompt:
```
PHASE GATE: Scope Model Lock

The Scope Model for [account] is ready for your review.

Review the following before locking:
□ Every workstream addressed (explicitly in-scope OR explicitly out-of-scope — no silence)
□ Deliverables are specific and measurable
□ Out-of-scope items are unambiguous — a customer reading this would not be surprised
□ Customer responsibilities are named (not generic), dated (not "eventually"), and consequenced
□ Sub-tools invoked where required: scope-everywhere □ | scope-automation □ | scope-app-studio □
□ LOE Inputs Summary has all signals required for each in-scope workstream
□ Assumptions are specific and verifiable (not vague hedges)

Action required:
- LOCK to advance to LOE Estimator and Service Matchmaker
- REVISE WITH NOTES to send back for changes
```

After SSD locks:
```json
artifacts["scope-model"].status = "LOCKED"
artifacts["scope-model"].key_outputs.sub_tools_invoked = [list of sub-tools used]
phase_gates["scope-builder"] = "LOCKED"
```

**Advance to:** Steps 6 and 7 (can run in parallel)

---

### Step 6 — LOE Estimator

**Invoke:** `loe-estimator`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "scope_model": artifacts["scope-model"].key_outputs,
  "loe_inputs_summary": artifacts["scope-model"].key_outputs.loe_inputs_summary,
  "tools_available": ["fileset_search"],
  "fileset_id": "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
}
```

**Expect back:**
- LOE estimate: low / expected / high hours by workstream
- Confidence assessment (HIGH/MED/LOW per workstream)
- Tool synergy credits applied
- MVP scope flags
- Risk flags for LOW-confidence items
- Sensitivity analysis

**Update session context:**
```json
artifacts["loe-estimate"].status = "DRAFT"
artifacts["loe-estimate"].key_outputs = [extracted outputs]
```

**SSD action:** Review LOE estimate. Confirm confidence levels. Resolve LOW-confidence flags or accept them as SOW assumptions. No blocking gate to advance — but SSD must mark the LOE as "reviewed" before the SOW Generator can use it.

**Advance to:** Step 7 (parallel with Step 6 if ROI requested), then Step 8

---

### Step 7 — ROI Calculator (optional)

**Invoke when:** ROI is a key decision driver (customer is evaluating business case, budget approval pending, or SSD requests it).

**Skip when:** ROI analysis is not needed for this deal stage.

**Pass in (from session context):**
```json
{
  "account": session.account,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "loe_estimate": artifacts["loe-estimate"].key_outputs
}
```

**Expect back:**
- Value driver breakdown (cost savings, productivity, revenue, risk reduction)
- Financial summary (annual value, investment, payback period, Year 1 ROI)
- Confidence levels per claim
- Customer validation checklist

**Update session context:**
```json
artifacts["roi-analysis"].status = "COMPLETE"  // or "SKIPPED"
artifacts["roi-analysis"].key_outputs = [extracted outputs]
```

**Advance to:** Step 8

---

### Step 8 — Service Matchmaker

**Invoke:** `service-matchmaker`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "loe_estimate": artifacts["loe-estimate"].key_outputs,
  "scope_model": artifacts["scope-model"].key_outputs,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "roi_analysis": artifacts["roi-analysis"].key_outputs,  // null if skipped
  "tools_available": ["fileset_search", "portfolio_lookup"],
  "fileset_id": "e5b7e2e9-79ed-499d-95ff-fc9d74157d24"
}
```

**Expect back:**
- 2–3 genuinely different engagement options (scope, investment, duration, best-for)
- Pricing posture recommendation
- Engagement structure recommendation (Fixed-bid / T&M / Capped T&M / Retainer / Phased)
- Rationale for each option

**Update session context:**
```json
artifacts["commercial-recommendation"].status = "DRAFT"
artifacts["commercial-recommendation"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST SELECT AND LOCK ONE OPTION**

Present options to the SSD with this prompt:
```
PHASE GATE: Commercial Option Selection

The Service Matchmaker has produced [N] commercial options for [account].

[Present Option A / B / C with key details]

Action required:
- SELECT ONE OPTION to lock the commercial recommendation and advance to Proposal/SOW
- REQUEST REVISION if the options don't reflect the right commercial posture
- NOTE: Pricing posture and discount authority — [posture recommendation from skill]

Once you select an option, it becomes the locked commercial recommendation for the Proposal and SOW.
```

After SSD locks:
```json
artifacts["commercial-recommendation"].status = "SSD_LOCKED"
artifacts["commercial-recommendation"].key_outputs.selected_option = [SSD selection]
phase_gates["service-matchmaker"] = "SSD_LOCKED"
```

**Advance to:** Step 9 (optional) and Step 10

---

### Step 9 — Proposal Generator (optional)

**Invoke when:** A customer-facing proposal deck is needed before or alongside the SOW. Skip for deals going direct to SOW.

**Pass in (from session context):**
```json
{
  "account": session.account,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "scope_model": artifacts["scope-model"].key_outputs,
  "commercial_recommendation": artifacts["commercial-recommendation"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "roi_analysis": artifacts["roi-analysis"].key_outputs,
  "tools_available": ["gong_transcript_lookup", "portfolio_lookup", "fileset_search"]
}
```

**Expect back:**
- Slide-by-slide proposal narrative (executive summary through next steps)
- Talk track for each slide
- Anticipated objections with responses

**Update session context:**
```json
artifacts["proposal-content"].status = "DRAFT"  // or "SKIPPED"
artifacts["proposal-content"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST REVIEW AND APPROVE BEFORE PRESENTING**

```
PHASE GATE: Proposal Approval

The Proposal for [account] is ready for your review.

Do NOT present to the customer until you have:
□ Verified every value claim traces to discovery
□ Confirmed the recommendation slide is clear and unambiguous
□ Customized the talk track for the specific stakeholders in the room
□ Removed any internal-only content

Action required:
- APPROVE to mark proposal as SSD_APPROVED
- REVISE WITH NOTES to send back for changes
```

After SSD approves:
```json
artifacts["proposal-content"].status = "SSD_APPROVED"
phase_gates["proposal-generator"] = "SSD_APPROVED"
```

**Advance to:** Step 10

---

### Step 10 — SOW Generator

**Invoke:** `sow-generator`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "scope_model": artifacts["scope-model"].key_outputs,
  "loe_estimate": artifacts["loe-estimate"].key_outputs,
  "commercial_recommendation": artifacts["commercial-recommendation"].key_outputs,
  "proposal_content": artifacts["proposal-content"].key_outputs,  // null if skipped
  "tools_available": ["fileset_search", "portfolio_lookup"],
  "fileset_id": "e5b7e2e9-79ed-499d-95ff-fc9d74157d24",
  "template_instructions": "Use DOMO SOW TEMPLATE 2025 exactly. Fill in placeholders only. Preserve all fonts, colors, images, section order."
}
```

**Expect back:**
- Populated DOMO SOW TEMPLATE 2025 (all sections filled from artifacts or flagged)
- Missing-field checklist (CRITICAL / IMPORTANT / ADVISORY)
- Template fidelity confirmation (no sections reordered or reformatted)

**Update session context:**
```json
artifacts["sow-draft"].status = "DRAFT"
artifacts["sow-draft"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST REVIEW AND APPROVE BEFORE CUSTOMER SEND**

```
PHASE GATE: SOW Review

The SOW draft for [account] is ready for your review.

The SOW uses the DOMO SOW TEMPLATE 2025. All populated sections are sourced from locked artifacts.

Missing-field summary:
- CRITICAL items remaining: [N] — MUST be resolved before sending
- IMPORTANT items remaining: [N] — Should be resolved before sending
- ADVISORY items remaining: [N]

Action required:
- Complete all CRITICAL missing fields before advancing
- Change status to READY FOR CUSTOMER when satisfied with the document
```

After SSD approves:
```json
artifacts["sow-draft"].status = "READY_FOR_CUSTOMER"
phase_gates["sow-generator"] = "SSD_APPROVED"
```

**Advance to:** Steps 11 and 14 (CPQ Validator runs before customer send; SOW Reviewer runs as final quality gate)

---

### Step 11 — CPQ Validator

**Invoke:** `cpq-validator`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "sow_draft": artifacts["sow-draft"].key_outputs,
  "commercial_recommendation": artifacts["commercial-recommendation"].key_outputs,
  "tools_available": ["salesforce_lookup", "fileset_search"]
}
```

**Expect back:**
- CPQ Validation Report: PASS / NEEDS ATTENTION / FAIL
- Discrepancy list (CRITICAL / IMPORTANT / ADVISORY)
- Approval chain recommendation

**Update session context:**
```json
artifacts["cpq-validation"].status = [result: PASS | NEEDS_ATTENTION | FAIL]
artifacts["cpq-validation"].key_outputs = [extracted outputs]
phase_gates["cpq-validator"] = [result]
```

**⛔ PHASE GATE — CRITICAL items block approval submission**

```
PHASE GATE: CPQ Validation

CPQ Validation result: [PASS | NEEDS ATTENTION | ❌ FAIL]

[If FAIL or NEEDS ATTENTION:]
CRITICAL items requiring resolution:
[List each item with specific action]

Action required:
- Resolve all CRITICAL items (these block approval submission)
- Confirm IMPORTANT items are intentionally left or resolve them
- Re-run CPQ Validator after resolving CRITICAL items
```

**Advance to:** Step 12 (after PASS)

---

### Step 12 — Knowledge Handoff

**Invoke:** `knowledge-handoff`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "sow_draft": artifacts["sow-draft"].key_outputs,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "scope_model": artifacts["scope-model"].key_outputs,
  "loe_estimate": artifacts["loe-estimate"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "proposal_content": artifacts["proposal-content"].key_outputs,
  "tools_available": ["gong_transcript_lookup", "portfolio_lookup", "calls_lookup"]
}
```

**Expect back:**
- Handoff Dossier with all AI-producible sections populated
- [SSD TO ADD] sections clearly flagged for human intelligence
- Pre-kickoff checklist
- Stakeholder intelligence map
- Commitments made outside SOW

**Update session context:**
```json
artifacts["handoff-dossier"].status = "DRAFT"
artifacts["handoff-dossier"].key_outputs = [extracted outputs]
```

**⛔ PHASE GATE — SSD MUST COMPLETE [SSD TO ADD] SECTIONS**

```
PHASE GATE: Handoff Dossier Completion

The Handoff Dossier for [account] is ready for your human intelligence additions.

[SSD TO ADD] sections require your input:
□ Key relationship dynamics, politics, internal tensions
□ Commitments made in hallway conversations, emails, or informal channels
□ Personality notes, political sensitivities, prior history with Domo
□ Specific staffing or seniority requirements
□ Any off-script context the delivery team needs to succeed

This dossier is NOT complete until you have filled in all [SSD TO ADD] sections.
Do not share with the delivery team until complete.

Action required:
- Complete [SSD TO ADD] sections and mark dossier as SSD_VALIDATED
```

After SSD completes:
```json
artifacts["handoff-dossier"].status = "SSD_VALIDATED"
artifacts["handoff-dossier"].key_outputs.ssd_add_sections_complete = true
phase_gates["knowledge-handoff"] = "SSD_VALIDATED"
```

**Advance to:** Steps 13 and 14

---

### Step 13 — Expansion Identifier

**Invoke:** `expansion-identifier`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "scope_model": artifacts["scope-model"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "handoff_dossier": artifacts["handoff-dossier"].key_outputs,
  "tools_available": ["portfolio_lookup", "gong_transcript_lookup", "calls_lookup"]
}
```

**Expect back:**
- Priority expansion opportunities (⭐ Act now, 🔵 Next QBR, 🟡 Monitor)
- Pre-Scoping Brief inputs for Phase 2 if ⭐ opportunities exist
- Evidence-based opportunity register

**Update session context:**
```json
artifacts["expansion-summary"].status = "COMPLETE"
artifacts["expansion-summary"].key_outputs = [extracted outputs]
```

**No blocking gate.** Present to SSD for awareness. If ⭐ opportunities exist, suggest timing for Phase 2 kickoff.

**Advance to:** Step 14

---

### Step 14 — SOW Reviewer (Final Quality Gate)

**Invoke:** `sow-reviewer`

**Pass in (from session context):**
```json
{
  "account": session.account,
  "sow_document": artifacts["sow-draft"],
  "scope_model": artifacts["scope-model"].key_outputs,
  "loe_estimate": artifacts["loe-estimate"].key_outputs,
  "discovery_record": artifacts["discovery-record"].key_outputs,
  "solution_blueprint": artifacts["solution-blueprint"].key_outputs,
  "commercial_recommendation": artifacts["commercial-recommendation"].key_outputs,
  "review_mode": "domo_format",
  "review_stance": "antagonistic"
}
```

**Expect back:**
- SOW Review Report with overall verdict (APPROVED / CONDITIONALLY_APPROVED / REVISE_BEFORE_SEND)
- Completeness score (0–100)
- Scope accuracy issues
- Critical gaps
- Specific revision recommendations

**Update session context:**
```json
artifacts["sow-review"].status = "COMPLETE"
artifacts["sow-review"].key_outputs = [extracted outputs]
```

**Final quality gate presentation:**
```
FINAL QUALITY GATE: Antagonistic SOW Review

SOW Review for [account] is complete.

Overall Verdict: [APPROVED | CONDITIONALLY_APPROVED | REVISE_BEFORE_SEND]
Completeness Score: [X/100]

[If CONDITIONALLY_APPROVED or REVISE_BEFORE_SEND:]
Issues requiring attention before customer delivery:
[List with specific revision recommendations]

Action required:
- APPROVE to finalize the scoping package
- REVISE to address SOW issues before sending
```

After final review:
```json
artifacts["sow-review"].key_outputs.overall_verdict = [verdict]
session.process_status = "COMPLETE"
```

---

## Complete Pipeline Summary (Quick Reference)

| Step | Skill | Phase Gate | SSD Action Required |
|------|-------|------------|---------------------|
| 1 | pre-scoping-brief | ❌ | Review before call |
| 2 | discovery-synthesizer | ✅ BLOCKING | Validate and approve Discovery Record |
| 3 | connection-strategy | ❌ | Review for customer dependencies |
| 4 | solution-blueprint | ✅ BLOCKING | Lock the Solution Blueprint |
| 5 | scope-builder (+ sub-tools) | ✅ BLOCKING | Lock the Scope Model |
| 6 | loe-estimator | ❌ | Mark as reviewed; resolve LOW-confidence flags |
| 7 | roi-calculator | ❌ (optional) | Review and validate value claims |
| 8 | service-matchmaker | ✅ BLOCKING | Select and lock one commercial option |
| 9 | proposal-generator | ✅ BLOCKING (optional) | Approve before presenting to customer |
| 10 | sow-generator | ✅ BLOCKING | Complete CRITICAL fields; approve for customer |
| 11 | cpq-validator | ✅ BLOCKING | Resolve CRITICAL items; must PASS before submission |
| 12 | knowledge-handoff | ✅ BLOCKING | Complete [SSD TO ADD] sections before sharing |
| 13 | expansion-identifier | ❌ | Review and act on ⭐ opportunities |
| 14 | sow-reviewer | ✅ FINAL GATE | Address issues before final delivery |

---

## Data Passing Principles

1. **All inter-skill data moves through the Session Context Object.** No skill reads from conversational memory. Every skill gets structured JSON input from the context and writes structured output back to it.

2. **Key outputs, not full documents.** The Session Context carries key structured outputs extracted from each artifact — not the raw full-text of every document. Full documents are stored by reference. This keeps the context manageable and ensures downstream skills receive clean, structured inputs.

3. **Confidence and status travel with the data.** When an artifact's key outputs are passed to a downstream skill, their confidence ratings and status flags travel with them. A LOW-confidence signal from the Discovery Record remains flagged all the way through to the SOW.

4. **SSD overrides are explicit and recorded.** When the SSD overrides a recommendation (e.g., adjusts a multiplier, changes an assumption), the override is recorded in the session context with attribution. Downstream skills see the overridden value and note the source.

5. **Versioning is maintained.** Every artifact has a version. When the SSD revises an artifact, the version increments. Downstream skills always specify which version of each artifact they consumed.

---

## Guardrails

- **Never skip a phase gate.** Every blocking gate exists because downstream artifacts are unreliable without upstream validation. A wide-open pipeline produces fast output of low quality.
- **Never advance without SSD action at gates.** Phase gates are SSD checkpoints, not formalities. The skill halts and presents the checkpoint clearly; the SSD decides to advance.
- **Never fabricate inputs.** If a required upstream artifact is missing, halt and identify which skill produced it and why it is missing.
- **Resume from checkpoint.** If the process is interrupted, it can always be resumed from the last completed step using the stored session context.
- **The SOW reviewer always runs.** Even when all upstream artifacts are clean and the process has gone smoothly, the antagonistic SOW review is the final quality gate and is never skipped.

---

## Related Skills (All)

pre-scoping-brief → discovery-synthesizer → connection-strategy → solution-blueprint →
scope-builder [+ scope-everywhere, scope-automation, scope-app-studio] →
loe-estimator → roi-calculator (optional) → service-matchmaker →
proposal-generator (optional) → sow-generator → cpq-validator →
knowledge-handoff → expansion-identifier → **sow-reviewer**
