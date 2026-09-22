---
name: alignment-gate
tier: 1
description: "Phase gate checkpoint between Align and Design — verifies all alignment dimensions pass before the engagement moves into solution design. Checks scope, team, customer alignment, kickoff readiness, and handoff fidelity. Trigger with 'alignment gate for [account]', 'ready check for [account]', 'can we move to design for [account]', 'alignment check for [account]', or any request to validate engagement readiness."
maturity: alpha
audience: [delivery, orchestration]
pipeline:
  phase: align
  sub_phase: planning-and-kickoff
  position: 5
  output_type: approval
  wave: 1
  state: ready
  inputs:
    - agent: kickoff-brief
      required: true
      data: engagement scope, team, success criteria, checklist
  outputs:
    - name: alignment-gate-result
      format: markdown
      downstream:
        - agent: roadmap-agent
        - agent: data-strategy-agent
        - agent: wireframe-agent
  data_sources:
    - tool: portfolio_lookup
      required: true
  phase_gate: true
  gate_dimensions:
    - dimension: Scope
      criteria: Engagement scope is defined, agreed, and documented
    - dimension: Team
      criteria: Internal and customer team members identified and available
    - dimension: Customer Alignment
      criteria: Customer has agreed to success criteria and communication cadence
    - dimension: Kickoff Readiness
      criteria: Pre-kickoff checklist items complete
    - dimension: Handoff Fidelity
      criteria: All Discover outputs carried forward accurately
---

# Alignment Gate — Phase Gate (Align → Design)

The first phase gate in the Compass pipeline. Evaluates whether the engagement is ready to move from Align into Design. Requires human APPROVAL — the pipeline does not advance automatically.

## How It Works

```
Kickoff Brief (upstream)
  + Engagement Context
                    |
    +-------+-------+-------+-------+-------+
    |       |       |       |       |       |
  Scope   Team    Customer Kickoff  Handoff
  Check   Check   Alignment Readiness Fidelity
    |       |       |       |       |
    ✅/❌    ✅/❌    ✅/❌    ✅/❌    ✅/❌
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Gate Assessment
                    |
    PASS (all ✅) → 🟡 APPROVAL → Design Phase
    FAIL (any ❌) → 🔴 BLOCKED → Remediation Required
```

## Triggers

- "alignment gate for [account]"
- "ready check for [account]"
- "can we move to design for [account]"
- "alignment check for [account]"
- "gate check for [account]"
- "is [account] ready for design"

## Gate Dimensions

### Dimension 1: Scope ✅/❌

| Check | Criteria | Source | How to Verify |
|-------|----------|--------|--------------|
| Scope defined | Use cases are documented with deliverables | Offering Match / SOW | Each use case has defined inputs and outputs |
| Scope agreed | Customer has confirmed scope in writing or on a call | Calls / Email | Verbal or written confirmation |
| Out-of-scope documented | Explicit exclusions are listed | Kickoff Brief | Out-of-scope section populated |
| Hours allocated | Hours are assigned to use cases | Offering Match | Hours breakdown exists |
| Change request process | Process for scope changes is defined | Kickoff Brief | CR process documented |

### Dimension 2: Team ✅/❌

| Check | Criteria | Source | How to Verify |
|-------|----------|--------|--------------|
| Lead Consultant assigned | Named delivery lead with availability confirmed | Staffing Agent / User | Person and hours/week identified |
| Customer project lead | Named customer contact for day-to-day | Kickoff Brief | Contact information confirmed |
| Executive sponsor | Named exec with decision authority | Portfolio / Calls | Identified and agreed to participate |
| Data SME | Customer technical resource identified | Kickoff Brief | Available for requirements and validation |
| PMO assigned | Status reporting owner identified | Kickoff Brief | Named individual or role |

### Dimension 3: Customer Alignment ✅/❌

| Check | Criteria | Source | How to Verify |
|-------|----------|--------|--------------|
| Success criteria agreed | Measurable outcomes confirmed by customer | Kickoff Brief | Customer acknowledged targets |
| Communication cadence set | Weekly calls, status emails scheduled | Kickoff Brief | Calendar invites sent |
| Governance model agreed | Decision-making process defined | Kickoff Brief | Escalation path documented |
| Expectations set | Customer understands timeline and commitment required | Calls | Discussed on a call |

### Dimension 4: Kickoff Readiness ✅/❌

| Check | Criteria | Source | How to Verify |
|-------|----------|--------|--------------|
| Domo access provisioned | Delivery team has instance access | Pre-kickoff checklist | Login confirmed |
| Source system access | Credentials or access to data sources | Pre-kickoff checklist | Connection tested |
| Asana project created | Project management infrastructure ready | Asana | Project exists with structure |
| Kickoff meeting scheduled | Date/time confirmed with all parties | Calendar | Invite sent and accepted |
| SOW signed | Legal agreement in place | SOW / AE | Signature confirmed |

### Dimension 5: Handoff Fidelity ✅/❌

| Check | Criteria | Source | How to Verify |
|-------|----------|--------|--------------|
| ROI Hypothesis carried forward | Business outcomes from Discover are documented in kickoff brief | Kickoff Brief vs. ROI Hypothesis | Outcomes match |
| Solution Architecture preserved | Technical approach from Discover informs the engagement scope | Kickoff Brief vs. Solution Architecture | Architecture referenced |
| Customer voice preserved | Pain points and stated needs from calls are reflected | Kickoff Brief vs. Calls | Customer quotes/needs present |
| Risks carried forward | Known risks from Discover surface in engagement risk register | Kickoff Brief vs. Actions | Risks documented |

---

## Output Template

```markdown
# 🟡 Alignment Gate: [Account Name]

**Assessment Date:** [Date]
**Assessor:** [Agent + Human Reviewer]
**Gate Status:** [🟢 PASS / 🔴 BLOCKED]

---

## Gate Summary

| Dimension | Status | Score | Blockers |
|-----------|--------|-------|----------|
| Scope | [✅ / ❌] | [X/5] checks passed | [Blocker if any] |
| Team | [✅ / ❌] | [X/5] checks passed | [Blocker if any] |
| Customer Alignment | [✅ / ❌] | [X/4] checks passed | [Blocker if any] |
| Kickoff Readiness | [✅ / ❌] | [X/5] checks passed | [Blocker if any] |
| Handoff Fidelity | [✅ / ❌] | [X/4] checks passed | [Blocker if any] |
| **Overall** | **[🟢 / 🔴]** | **[X/23]** | |

---

## Detailed Assessment

### Scope [✅ / ❌]

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | Scope defined | [✅/❌] | [Reference] | [Detail] |
| 2 | Scope agreed | [✅/❌] | [Reference] | [Detail] |
| 3 | Out-of-scope documented | [✅/❌] | [Reference] | [Detail] |
| 4 | Hours allocated | [✅/❌] | [Reference] | [Detail] |
| 5 | Change request process | [✅/❌] | [Reference] | [Detail] |

### Team [✅ / ❌]

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | Lead Consultant assigned | [✅/❌] | [Name] | [Availability] |
| 2 | Customer project lead | [✅/❌] | [Name] | [Confirmed?] |
| 3 | Executive sponsor | [✅/❌] | [Name] | [Engaged?] |
| 4 | Data SME | [✅/❌] | [Name] | [Available?] |
| 5 | PMO assigned | [✅/❌] | [Name] | [Capacity?] |

### Customer Alignment [✅ / ❌]

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | Success criteria agreed | [✅/❌] | [Reference] | [Detail] |
| 2 | Communication cadence set | [✅/❌] | [Reference] | [Detail] |
| 3 | Governance model agreed | [✅/❌] | [Reference] | [Detail] |
| 4 | Expectations set | [✅/❌] | [Reference] | [Detail] |

### Kickoff Readiness [✅ / ❌]

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | Domo access provisioned | [✅/❌] | [Reference] | [Detail] |
| 2 | Source system access | [✅/❌] | [Reference] | [Detail] |
| 3 | Asana project created | [✅/❌] | [Reference] | [Detail] |
| 4 | Kickoff meeting scheduled | [✅/❌] | [Date/Time] | [Detail] |
| 5 | SOW signed | [✅/❌] | [Reference] | [Detail] |

### Handoff Fidelity [✅ / ❌]

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| 1 | ROI Hypothesis carried forward | [✅/❌] | [Comparison] | [Detail] |
| 2 | Solution Architecture preserved | [✅/❌] | [Comparison] | [Detail] |
| 3 | Customer voice preserved | [✅/❌] | [Comparison] | [Detail] |
| 4 | Risks carried forward | [✅/❌] | [Comparison] | [Detail] |

---

## Blockers (if any)

| # | Blocker | Dimension | Owner | Resolution | ETA |
|---|---------|-----------|-------|------------|-----|
| 1 | [Blocker description] | [Which dimension] | [Who resolves] | [How to resolve] | [When] |
| 2 | ... | ... | ... | ... | ... |

---

## Recommendation

### If 🟢 PASS:
**The engagement is ready to move to Design phase.**
- All [23/23] checks passed
- No blockers identified
- Handoff fidelity confirmed

**Next Steps:**
1. Schedule Design kickoff
2. Run Roadmap Agent, Data Strategy Agent, Wireframe Agent in parallel
3. Assign Design phase resources

### If 🔴 BLOCKED:
**The engagement is NOT ready for Design.**
- [X/23] checks passed, [Y] blockers identified
- Resolution required before gate can pass

**Remediation Plan:**
1. [Blocker 1] — [Owner] — [Action] — [ETA]
2. [Blocker 2] — [Owner] — [Action] — [ETA]
3. Re-run Alignment Gate after remediation

---

## 🟡 APPROVAL REQUIRED

**This gate requires human sign-off.**

To approve: "approve alignment gate for [Account Name]"
To reject: "block alignment gate for [Account Name] — [reason]"

The pipeline will not advance to Design until this gate is explicitly approved.

---

**Prepared by:** Compass Alignment Gate Agent
**Output Type:** 🟡 APPROVAL
**Pipeline Position:** Align → Planning & Kickoff → Position 5
**Phase Gate:** Align → Design
```

---

## Memory

### Before executing
- Call `memory_recall` or `memory_bundle` with scope **account**, **engagement-artifacts**, and **engagement-state**, intent: alignment gate / readiness.

### After executing
- Call `engagement_state_update` for phase transition (pass/blocked, blockers); `memory_remember` with dimension results and remediation owners.

---

## Guardrails

- **All dimensions must pass.** The gate is binary — PASS or BLOCKED. A single failing dimension blocks the gate.
- **Human approval is mandatory.** Even if all checks pass, a human must explicitly approve. The agent recommends, the human decides.
- **Blockers need owners and ETAs.** Don't just list blockers — assign resolution ownership and deadlines.
- **Handoff fidelity is non-negotiable.** If Discover outputs were lost or misrepresented, the gate fails. This prevents context degradation.
- **Don't lower the bar.** If data is missing, that's a failing check — not a skip. "Data unavailable" ≠ "Check passed."
- **Re-run after remediation.** When blockers are resolved, run the gate again. Don't manually override.

---

## Related Skills

- **Kickoff Brief** (Align) → Upstream — provides the engagement documentation to evaluate
- **Roadmap Agent** (Design) → Downstream — first agent in Design phase
- **Data Strategy Agent** (Design) → Downstream — begins data architecture
- **Wireframe Agent** (Design) → Downstream — begins dashboard design
